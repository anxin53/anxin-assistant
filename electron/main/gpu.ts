import { createHash } from 'crypto';
import type { GpuAdapter, GpuBackup, OperationResult, RestoreGpuNamePayload, SetGpuNamePayload } from '../shared/types';
import { getSettings, patchSettings } from './store';
import { psString, runPowerShell } from './powershell';

export async function listAdapters(): Promise<GpuAdapter[]> {
  const script = `
$laptopChassisTypes = @(8, 9, 10, 11, 12, 14, 18, 21, 30, 31, 32)
$chassisTypes = @()
try {
  $chassisTypes = @(Get-CimInstance Win32_SystemEnclosure -ErrorAction SilentlyContinue |
    ForEach-Object { $_.ChassisTypes } |
    Where-Object { $_ })
} catch {}
$hasLaptopChassis = @($chassisTypes | Where-Object { $laptopChassisTypes -contains [int]$_ }).Count -gt 0
$hasBattery = $false
try {
  $hasBattery = [bool](Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue)
} catch {}
$isLaptop = $hasLaptopChassis -or $hasBattery

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
    isLaptop = $isLaptop
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
      friendlyName: row.friendlyName,
      isLaptop: Boolean(row.isLaptop)
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
  const registryPath = toRegExePath(registryKey);
  const script = `
$regPath = ${psString(registryPath)}
$deviceDesc = ${psString(deviceDesc)}
$friendlyName = ${psString(friendlyName || deviceDesc)}

function Invoke-Reg {
  param(
    [string[]]$Arguments,
    [string]$FailureMessage
  )

  $output = & reg.exe @Arguments 2>&1 | Out-String
  if ($LASTEXITCODE -ne 0) {
    throw ($FailureMessage + [Environment]::NewLine + $output)
  }

  return $output
}

Invoke-Reg -Arguments @('query', $regPath) -FailureMessage "注册表路径不存在或不可访问：$regPath" | Out-Null
Invoke-Reg -Arguments @('add', $regPath, '/v', 'DeviceDesc', '/t', 'REG_SZ', '/d', $deviceDesc, '/f') -FailureMessage "写入 DeviceDesc 失败：$regPath" | Out-Null
Invoke-Reg -Arguments @('add', $regPath, '/v', 'FriendlyName', '/t', 'REG_SZ', '/d', $friendlyName, '/f') -FailureMessage "写入 FriendlyName 失败：$regPath" | Out-Null
`;
  await runPowerShell(script, true);
}

function toRegExePath(registryKey: string): string {
  const trimmed = registryKey.trim();
  if (/^Registry::HKEY_LOCAL_MACHINE\\/iu.test(trimmed)) {
    return trimmed.replace(/^Registry::HKEY_LOCAL_MACHINE\\/iu, 'HKLM\\');
  }

  if (/^HKLM:\\/iu.test(trimmed)) {
    return trimmed.replace(/^HKLM:\\/iu, 'HKLM\\');
  }

  if (/^HKEY_LOCAL_MACHINE\\/iu.test(trimmed)) {
    return trimmed.replace(/^HKEY_LOCAL_MACHINE\\/iu, 'HKLM\\');
  }

  return trimmed;
}

function hashId(value: string): string {
  return createHash('sha1').update(value).digest('hex').slice(0, 12);
}
