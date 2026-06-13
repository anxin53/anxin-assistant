export interface GpuAdapter {
  id: string;
  name: string;
  pnpDeviceId: string;
  registryKey: string;
  adapterCompatibility?: string;
  driverVersion?: string;
  videoProcessor?: string;
  deviceDesc?: string;
  friendlyName?: string;
  isLaptop?: boolean;
}

export interface GpuBackup {
  id: string;
  adapterName: string;
  pnpDeviceId: string;
  registryKey: string;
  deviceDesc?: string;
  friendlyName?: string;
  backedUpAt: string;
}

export interface AppSettings {
  gpuBackups: Record<string, GpuBackup>;
}

export interface OperationResult {
  ok: boolean;
  message: string;
  requiresRestart?: boolean;
}

export interface SetGpuNamePayload {
  adapter: GpuAdapter;
  customName: string;
}

export interface RestoreGpuNamePayload {
  backupId: string;
}
