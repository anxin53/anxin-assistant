import { contextBridge, ipcRenderer } from 'electron';
import type {
  ApplyProfilePayload,
  AppSettings,
  DisplayDevice,
  GpuAdapter,
  GpuBackup,
  ImportedProfile,
  ImportProfilePayload,
  OperationResult,
  RestoreGpuNamePayload,
  RestoreProfilePayload,
  SetGpuNamePayload
} from '../shared/types';

const api = {
  gpu: {
    listAdapters: (): Promise<GpuAdapter[]> => ipcRenderer.invoke('gpu:listAdapters'),
    backupAdapterName: (adapter: GpuAdapter): Promise<GpuBackup> => ipcRenderer.invoke('gpu:backupAdapterName', adapter),
    setAdapterName: (payload: SetGpuNamePayload): Promise<OperationResult> => ipcRenderer.invoke('gpu:setAdapterName', payload),
    restoreAdapterName: (payload: RestoreGpuNamePayload): Promise<OperationResult> =>
      ipcRenderer.invoke('gpu:restoreAdapterName', payload)
  },
  color: {
    listDisplays: (): Promise<DisplayDevice[]> => ipcRenderer.invoke('color:listDisplays'),
    pickProfile: (): Promise<string | null> => ipcRenderer.invoke('dialog:pickProfile'),
    importProfile: (payload: ImportProfilePayload): Promise<ImportedProfile> => ipcRenderer.invoke('color:importProfile', payload),
    applyProfile: (payload: ApplyProfilePayload): Promise<OperationResult> => ipcRenderer.invoke('color:applyProfile', payload),
    restoreProfile: (payload: RestoreProfilePayload): Promise<OperationResult> => ipcRenderer.invoke('color:restoreProfile', payload)
  },
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    set: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:set', settings)
  }
};

contextBridge.exposeInMainWorld('lightQuality', api);

export type LightQualityApi = typeof api;
