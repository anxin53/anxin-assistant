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

export interface DisplayDevice {
  id: string;
  deviceName: string;
  monitorName: string;
  primary: boolean;
  currentProfile?: string;
}

export interface ImportedProfile {
  id: string;
  sourcePath: string;
  installedPath: string;
  fileName: string;
  importedAt: string;
}

export interface ColorBackup {
  displayId: string;
  deviceName: string;
  previousProfile?: string;
  backedUpAt: string;
}

export interface FilterSettings {
  brightness: number;
  contrast: number;
  gamma: number;
  saturation: number;
  temperature: number;
}

export interface AppSettings {
  gpuBackups: Record<string, GpuBackup>;
  colorBackups: Record<string, ColorBackup>;
  importedProfiles: ImportedProfile[];
  filters: FilterSettings;
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

export interface ImportProfilePayload {
  sourcePath: string;
}

export interface ApplyProfilePayload {
  display: DisplayDevice;
  profile: ImportedProfile;
}

export interface RestoreProfilePayload {
  displayId: string;
}
