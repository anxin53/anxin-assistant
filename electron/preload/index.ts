import { contextBridge, ipcRenderer } from 'electron';
import type { IpcRendererEvent } from 'electron';
import type {
  AppSettings,
  GpuAdapter,
  GpuBackup,
  OperationResult,
  RestoreGpuNamePayload,
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
  settings: {
    get: (): Promise<AppSettings> => ipcRenderer.invoke('settings:get'),
    set: (settings: AppSettings): Promise<AppSettings> => ipcRenderer.invoke('settings:set', settings)
  },
  window: {
    minimize: (): Promise<void> => ipcRenderer.invoke('window:minimize'),
    toggleMaximize: (): Promise<boolean> => ipcRenderer.invoke('window:toggleMaximize'),
    close: (): Promise<void> => ipcRenderer.invoke('window:close'),
    isMaximized: (): Promise<boolean> => ipcRenderer.invoke('window:isMaximized'),
    rendererReady: (): void => ipcRenderer.send('window:rendererReady'),
    onMaximizedChange: (callback: (maximized: boolean) => void): (() => void) => {
      const listener = (_event: IpcRendererEvent, maximized: boolean) => callback(maximized);
      ipcRenderer.on('window:maximized-change', listener);
      return () => ipcRenderer.removeListener('window:maximized-change', listener);
    }
  }
};

contextBridge.exposeInMainWorld('lightQuality', api);

export type LightQualityApi = typeof api;
