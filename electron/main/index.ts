import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import type { IpcMainEvent, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import { pathToFileURL } from 'url';
import { backupAdapter, listAdapters, restoreAdapterName, setAdapterName } from './gpu';
import { getSettings, initializeSettings, setSettings } from './store';
import type {
  AppSettings,
  GpuAdapter,
  RestoreGpuNamePayload,
  SetGpuNamePayload
} from '../shared/types';

const isDev = Boolean(process.env.VITE_DEV_SERVER_URL);
const shouldOpenDevTools = isDev && process.env.OPEN_DEVTOOLS === '1';
const unknownErrorMessage = '操作失败，但主进程没有返回可读错误。';

function getWindowIconPath(): string {
  return app.isPackaged ? path.join(process.resourcesPath, 'icon.ico') : path.join(__dirname, '../../build/icon.ico');
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1240,
    height: 820,
    minWidth: 1060,
    minHeight: 700,
    title: '安心助手',
    frame: false,
    show: false,
    icon: getWindowIconPath(),
    backgroundColor: '#f6f7f9',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  let shown = false;
  const showWindow = () => {
    if (shown || win.isDestroyed()) {
      return;
    }

    shown = true;
    win.show();
    if (shouldOpenDevTools) {
      win.webContents.openDevTools({ mode: 'detach' });
    }
  };
  const rendererReadyListener = (event: IpcMainEvent) => {
    if (event.sender === win.webContents) {
      showWindow();
    }
  };

  ipcMain.on('window:rendererReady', rendererReadyListener);
  win.setMenuBarVisibility(false);
  win.setAutoHideMenuBar(true);
  win.webContents.once('did-finish-load', () => {
    setTimeout(showWindow, 2000);
  });
  win.once('closed', () => {
    ipcMain.removeListener('window:rendererReady', rendererReadyListener);
  });
  win.on('maximize', () => win.webContents.send('window:maximized-change', true));
  win.on('unmaximize', () => win.webContents.send('window:maximized-change', false));

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    void win.loadURL(process.env.VITE_DEV_SERVER_URL);
    return;
  }

  void win.loadURL(pathToFileURL(path.join(__dirname, '../../dist/index.html')).toString());
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  initializeSettings(path.join(app.getPath('appData'), 'LightQualityTool'));

  // 启动时就检查并请求管理员权限
  const { isCurrentProcessElevated, requestElevation } = await import('./powershell');
  const isElevated = await isCurrentProcessElevated();

  if (!isElevated) {
    // 如果没有管理员权限，弹出UAC请求权限后重启应用
    try {
      await requestElevation();
      app.quit();
      return;
    } catch (error) {
      // 用户取消了UAC或其他错误，继续运行但功能受限
      console.error('Failed to elevate:', error);
    }
  }

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
  handleIpc('gpu:listAdapters', () => listAdapters());
  handleIpc('gpu:backupAdapterName', (_event, adapter: GpuAdapter) => backupAdapter(adapter));
  handleIpc('gpu:setAdapterName', (_event, payload: SetGpuNamePayload) => setAdapterName(payload));
  handleIpc('gpu:restoreAdapterName', (_event, payload: RestoreGpuNamePayload) => restoreAdapterName(payload));

  handleIpc('settings:get', () => getSettings());
  handleIpc('settings:set', (_event, settings: AppSettings) => setSettings(settings));

  handleIpc('window:minimize', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.minimize();
  });
  handleIpc('window:toggleMaximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (!win) {
      return false;
    }

    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }

    return win.isMaximized();
  });
  handleIpc('window:close', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.close();
  });
  handleIpc('window:isMaximized', (event) => {
    return BrowserWindow.fromWebContents(event.sender)?.isMaximized() || false;
  });
}

function handleIpc<TArgs extends unknown[], TResult>(
  channel: string,
  handler: (event: IpcMainInvokeEvent, ...args: TArgs) => TResult | Promise<TResult>
): void {
  ipcMain.handle(channel, async (event, ...args: TArgs) => {
    try {
      return await handler(event, ...args);
    } catch (error) {
      throw new Error(formatError(error));
    }
  });
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    if (error.message && error.message !== '[object Object]') {
      return error.message;
    }

    const cause = 'cause' in error ? formatError((error as Error & { cause?: unknown }).cause) : '';
    const stack = error.stack && !error.stack.includes('[object Object]') ? error.stack : '';
    return cause || stack || unknownErrorMessage;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    for (const key of ['message', 'Message', 'error', 'stderr', 'stdout', 'details', 'reason']) {
      const value = record[key];
      if (typeof value === 'string' && value.trim()) {
        return value;
      }
      if (value && typeof value === 'object' && value !== error) {
        const nested = formatError(value);
        if (nested && nested !== '[object Object]') {
          return nested;
        }
      }
    }

    try {
      const serialized = JSON.stringify(error);
      return serialized && serialized !== '{}' ? serialized : unknownErrorMessage;
    } catch {
      return Object.prototype.toString.call(error);
    }
  }

  const message = String(error);
  return message === '[object Object]' ? unknownErrorMessage : message;
}
