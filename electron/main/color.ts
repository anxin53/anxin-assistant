import { createHash, randomUUID } from 'crypto';
import { existsSync } from 'fs';
import path from 'path';
import type {
  ApplyProfilePayload,
  ColorBackup,
  DisplayDevice,
  ImportedProfile,
  ImportProfilePayload,
  OperationResult,
  RestoreProfilePayload
} from '../shared/types';
import { getSettings, patchSettings } from './store';
import { psString, runPowerShell } from './powershell';

const COLOR_DIR = 'C:\\Windows\\System32\\spool\\drivers\\color';

export async function listDisplays(): Promise<DisplayDevice[]> {
  const script = `
Add-Type -AssemblyName System.Windows.Forms
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
using System.Text;
public static class ColorNative {
  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsGetDefaultColorProfileSize(int scope, string deviceName, int profileType, int profileSubType, uint profileId, out uint size);

  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsGetDefaultColorProfile(int scope, string deviceName, int profileType, int profileSubType, uint profileId, uint profileNameSize, StringBuilder profileName);
}
"@
function Get-DefaultProfile([string]$deviceName) {
  $size = 0
  $ok = [ColorNative]::WcsGetDefaultColorProfileSize(1, $deviceName, 0, 4, 0, [ref]$size)
  if (!$ok -or $size -eq 0) { return $null }
  $builder = New-Object System.Text.StringBuilder ([int]($size / 2))
  $ok = [ColorNative]::WcsGetDefaultColorProfile(1, $deviceName, 0, 4, 0, $size, $builder)
  if (!$ok) { return $null }
  return $builder.ToString()
}
$screens = [System.Windows.Forms.Screen]::AllScreens
$items = for ($i = 0; $i -lt $screens.Count; $i++) {
  $screen = $screens[$i]
  [pscustomobject]@{
    id = $screen.DeviceName
    deviceName = $screen.DeviceName
    monitorName = if ($screen.Primary) { '主显示器' } else { "显示器 $($i + 1)" }
    primary = $screen.Primary
    currentProfile = Get-DefaultProfile $screen.DeviceName
  }
}
$items | ConvertTo-Json -Compress
`;
  const result = await runPowerShell(script);
  const parsed = JSON.parse(result.stdout || '[]') as Partial<DisplayDevice>[] | Partial<DisplayDevice>;
  const rows = Array.isArray(parsed) ? parsed : [parsed];

  return rows.map((row, index) => ({
    id: row.id || row.deviceName || `display-${index}`,
    deviceName: row.deviceName || `DISPLAY${index + 1}`,
    monitorName: row.monitorName || `显示器 ${index + 1}`,
    primary: Boolean(row.primary),
    currentProfile: row.currentProfile
  }));
}

export async function importProfile(payload: ImportProfilePayload): Promise<ImportedProfile> {
  const sourcePath = payload.sourcePath;
  if (!sourcePath || !existsSync(sourcePath)) {
    throw new Error('ICC/ICM 文件不存在。');
  }

  const extension = path.extname(sourcePath).toLowerCase();
  if (!['.icc', '.icm'].includes(extension)) {
    throw new Error('只支持导入 .icc 或 .icm 文件。');
  }

  const installedName = `${path.basename(sourcePath, extension)}-${Date.now()}${extension}`;
  const installedPath = path.join(COLOR_DIR, installedName);
  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class ColorInstallNative {
  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool InstallColorProfileW(string machineName, string profileName);
}
"@
$source = ${psString(sourcePath)}
$dest = ${psString(installedPath)}
if (!(Test-Path -LiteralPath $source)) { throw 'ICC/ICM 文件不存在。' }
Copy-Item -LiteralPath $source -Destination $dest -Force
$ok = [ColorInstallNative]::InstallColorProfileW($null, $dest)
if (!$ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "安装 ICC/ICM 失败，Win32Error=$err"
}
`;
  await runPowerShell(script, true);

  const profile: ImportedProfile = {
    id: hashId(`${sourcePath}:${installedPath}:${randomUUID()}`),
    sourcePath,
    installedPath,
    fileName: installedName,
    importedAt: new Date().toISOString()
  };

  const settings = getSettings();
  patchSettings({
    importedProfiles: [profile, ...settings.importedProfiles].slice(0, 24)
  });

  return profile;
}

export async function applyProfile(payload: ApplyProfilePayload): Promise<OperationResult> {
  const settings = getSettings();
  if (!settings.colorBackups[payload.display.id]) {
    const backup: ColorBackup = {
      displayId: payload.display.id,
      deviceName: payload.display.deviceName,
      previousProfile: payload.display.currentProfile,
      backedUpAt: new Date().toISOString()
    };
    patchSettings({
      colorBackups: {
        ...settings.colorBackups,
        [payload.display.id]: backup
      }
    });
  }

  const script = `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class ColorApplyNative {
  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool InstallColorProfileW(string machineName, string profileName);

  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsAssociateColorProfileWithDevice(int scope, string profileName, string deviceName);

  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsSetDefaultColorProfile(int scope, string deviceName, int profileType, int profileSubType, uint profileId, string profileName);
}
"@
$profile = ${psString(payload.profile.installedPath)}
if (!(Test-Path -LiteralPath $profile)) { throw 'ICC/ICM 文件不存在。' }
$device = ${psString(payload.display.deviceName)}
$ok = [ColorApplyNative]::InstallColorProfileW($null, $profile)
if (!$ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "安装 ICC/ICM 失败，Win32Error=$err"
}
$ok = [ColorApplyNative]::WcsAssociateColorProfileWithDevice(0, $profile, $device)
if (!$ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "关联 ICC/ICM 到显示器失败，Win32Error=$err"
}
$ok = [ColorApplyNative]::WcsSetDefaultColorProfile(0, $device, 0, 4, 0, $profile)
if (!$ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "设置默认 ICC/ICM 失败，Win32Error=$err"
}
Write-Output 'ICC/ICM 已设为所选显示器默认配置。'
`;
  await runPowerShell(script, true);

  return {
    ok: true,
    message: 'ICC/ICM 已关联到所选显示器并设为系统默认配置。'
  };
}

export async function restoreProfile(payload: RestoreProfilePayload): Promise<OperationResult> {
  const settings = getSettings();
  const backup = settings.colorBackups[payload.displayId];
  if (!backup) {
    throw new Error('没有找到此显示器的 ICC 备份。');
  }

  const script = backup.previousProfile
    ? `
Add-Type -TypeDefinition @"
using System;
using System.Runtime.InteropServices;
public static class ColorRestoreNative {
  [DllImport("Mscms.dll", CharSet = CharSet.Unicode, SetLastError = true)]
  public static extern bool WcsSetDefaultColorProfile(int scope, string deviceName, int profileType, int profileSubType, uint profileId, string profileName);
}
"@
$device = ${psString(backup.deviceName)}
$profile = ${psString(backup.previousProfile)}
$ok = [ColorRestoreNative]::WcsSetDefaultColorProfile(0, $device, 0, 4, 0, $profile)
if (!$ok) {
  $err = [Runtime.InteropServices.Marshal]::GetLastWin32Error()
  throw "恢复默认 ICC/ICM 失败，Win32Error=$err"
}
Write-Output 'ICC/ICM 默认配置已恢复。'
`
    : `
Start-Process -FilePath colorcpl.exe
Write-Output '备份时未检测到明确默认 ICC/ICM，已打开色彩管理面板供手动恢复系统默认。'
`;
  await runPowerShell(script, true);

  return {
    ok: true,
    message: `已打开色彩管理面板，请恢复到备份配置：${backup.previousProfile || '系统默认配置'}。`
  };
}

function hashId(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 12);
}
