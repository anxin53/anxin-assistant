import { app, BrowserWindow, Menu, dialog, ipcMain } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { applyProfile, importProfile, listDisplays, restoreProfile } from './color';
import { backupAdapter, listAdapters, restoreAdapterName, setAdapterName } from './gpu';
import { getSettings, initializeSettings, setSettings } from './store';
import type {
  ApplyProfilePayload,
  AppSettings,
  GpuAdapter,
  ImportProfilePayload,
  RestoreGpuNamePayload,
  RestoreProfilePayload,
  SetGpuNamePayload
} from '../shared/types';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 1060,
    minHeight: 700,
    title: '安心助手',
    backgroundColor: '#f6f7f9',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: 'detach' });
    return;
  }

  void win.loadURL(pathToFileURL(path.join(__dirname, '../../dist/index.html')).toString());
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  initializeSettings(path.join(app.getPath('appData'), 'LightQualityTool'));
  registerIpc();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function registerIpc(): void {
  ipcMain.handle('gpu:listAdapters', () => listAdapters());
  ipcMain.handle('gpu:backupAdapterName', (_event, adapter: GpuAdapter) => backupAdapter(adapter));
  ipcMain.handle('gpu:setAdapterName', (_event, payload: SetGpuNamePayload) => setAdapterName(payload));
  ipcMain.handle('gpu:restoreAdapterName', (_event, payload: RestoreGpuNamePayload) => restoreAdapterName(payload));

  ipcMain.handle('color:listDisplays', () => listDisplays());
  ipcMain.handle('color:importProfile', (_event, payload: ImportProfilePayload) => importProfile(payload));
  ipcMain.handle('color:applyProfile', (_event, payload: ApplyProfilePayload) => applyProfile(payload));
  ipcMain.handle('color:restoreProfile', (_event, payload: RestoreProfilePayload) => restoreProfile(payload));

  ipcMain.handle('dialog:pickProfile', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择 ICC/ICM 配置文件',
      filters: [{ name: 'Color profiles', extensions: ['icc', 'icm'] }],
      properties: ['openFile']
    });

    return result.canceled ? null : result.filePaths[0];
  });

  ipcMain.handle('settings:get', () => getSettings());
  ipcMain.handle('settings:set', (_event, settings: AppSettings) => setSettings(settings));
}
