import { createHash } from 'crypto';
import type { GpuAdapter, GpuBackup, OperationResult, RestoreGpuNamePayload, SetGpuNamePayload } from '../shared/types';
import { getSettings, patchSettings } from './store';
import { psString, runPowerShell } from './powershell';

export async function listAdapters(): Promise<GpuAdapter[]> {
  const script = `
$items = Get-CimInstance Win32_VideoController |
  Where-Object {
    $_.AdapterCompatibility -like '*NVIDIA*' -or
    $_.Name -like '*NVIDIA*' -or
    $_.PNPDeviceID -like 'PCI\\VEN_10DE*'
  } |
  ForEach-Object {
  $pnp = $_.PNPDeviceID
  $regPath = if ($pnp) { "HKLM:\\SYSTEM\\CurrentControlSet\\Enum\\$pnp" } else { $null }
  $props = $null
  if ($regPath -and (Test-Path -LiteralPath $regPath)) {
    $props = Get-ItemProperty -LiteralPath $regPath
  }
  [pscustomobject]@{
    id = $pnp
    name = $_.Name
    pnpDeviceId = $pnp
    registryKey = $regPath
    adapterCompatibility = $_.AdapterCompatibility
    driverVersion = $_.DriverVersion
    videoProcessor = $_.VideoProcessor
    deviceDesc = if ($props) { $props.DeviceDesc } else { $null }
    friendlyName = if ($props) { $props.FriendlyName } else { $null }
  }
}
$items | ConvertTo-Json -Compress
`;
  const result = await runPowerShell(script);
  const parsed = JSON.parse(result.stdout || '[]') as Partial<GpuAdapter>[] | Partial<GpuAdapter>;
  const rows = Array.isArray(parsed) ? parsed : [parsed];

  return rows
    .filter((row) => row.pnpDeviceId && row.registryKey)
    .map((row) => ({
      id: hashId(row.pnpDeviceId || ''),
      name: row.name || 'Unknown adapter',
      pnpDeviceId: row.pnpDeviceId || '',
      registryKey: row.registryKey || '',
      adapterCompatibility: row.adapterCompatibility,
      driverVersion: row.driverVersion,
      videoProcessor: row.videoProcessor,
      deviceDesc: row.deviceDesc,
      friendlyName: row.friendlyName
    }));
}

export async function backupAdapter(adapter: GpuAdapter): Promise<GpuBackup> {
  const settings = getSettings();
  const existing = settings.gpuBackups[adapter.id];
  if (existing) {
    return existing;
  }

  const fresh = (await listAdapters()).find((item) => item.pnpDeviceId === adapter.pnpDeviceId) || adapter;
  const backup: GpuBackup = {
    id: adapter.id,
    adapterName: fresh.name,
    pnpDeviceId: fresh.pnpDeviceId,
    registryKey: fresh.registryKey,
    deviceDesc: fresh.deviceDesc,
    friendlyName: fresh.friendlyName,
    backedUpAt: new Date().toISOString()
  };

  patchSettings({
    gpuBackups: {
      ...settings.gpuBackups,
      [adapter.id]: backup
    }
  });

  return backup;
}

export async function setAdapterName(payload: SetGpuNamePayload): Promise<OperationResult> {
  const customName = payload.customName.trim();
  if (!customName) {
    throw new Error('显卡名称不能为空。');
  }
  if (customName.length > 128) {
    throw new Error('显卡名称不能超过 128 个字符。');
  }

  await backupAdapter(payload.adapter);
  await writeGpuRegistryValues(payload.adapter.registryKey, customName);

  return {
    ok: true,
    message: '显卡显示名称已写入。重启电脑或重新扫描硬件后，系统界面会更新显示。',
    requiresRestart: true
  };
}

export async function restoreAdapterName(payload: RestoreGpuNamePayload): Promise<OperationResult> {
  const settings = getSettings();
  const backup = settings.gpuBackups[payload.backupId];
  if (!backup) {
    throw new Error('没有找到此显卡的备份。');
  }

  await writeGpuRegistryValues(backup.registryKey, backup.deviceDesc || backup.adapterName, backup.friendlyName);

  return {
    ok: true,
    message: '显卡显示名称已按备份恢复。重启电脑或重新扫描硬件后，系统界面会更新显示。',
    requiresRestart: true
  };
}

async function writeGpuRegistryValues(registryKey: string, deviceDesc: string, friendlyName?: string): Promise<void> {
  const script = `
$path = ${psString(registryKey)}
if (!(Test-Path -LiteralPath $path)) { throw "注册表路径不存在：$path" }
$acl = Get-Acl -LiteralPath $path
$snapshot = $acl.Sddl
$identity = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$rule = New-Object System.Security.AccessControl.RegistryAccessRule(
  $identity,
  [System.Security.AccessControl.RegistryRights]::FullControl,
  [System.Security.AccessControl.InheritanceFlags]::None,
  [System.Security.AccessControl.PropagationFlags]::None,
  [System.Security.AccessControl.AccessControlType]::Allow
)
try {
  $acl.SetAccessRule($rule)
  Set-Acl -LiteralPath $path -AclObject $acl
  New-ItemProperty -LiteralPath $path -Name 'DeviceDesc' -Value ${psString(deviceDesc)} -PropertyType String -Force | Out-Null
  $hasFriendlyName = (Get-ItemProperty -LiteralPath $path).PSObject.Properties.Name -contains 'FriendlyName'
  if ($hasFriendlyName) {
    New-ItemProperty -LiteralPath $path -Name 'FriendlyName' -Value ${psString(friendlyName || deviceDesc)} -PropertyType String -Force | Out-Null
  }
} finally {
  $restore = Get-Acl -LiteralPath $path
  $restore.SetSecurityDescriptorSddlForm($snapshot)
  Set-Acl -LiteralPath $path -AclObject $restore
}
`;
  await runPowerShell(script, true);
}

function hashId(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 12);
}
