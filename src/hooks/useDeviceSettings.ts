import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, GpuAdapter } from '@/types';
import { readError } from '@/lib/error';

export type StatusKind = 'info' | 'success' | 'error';

export interface DeviceSettings {
  settings: AppSettings | null;
  adapters: GpuAdapter[];
  status: string;
  statusKind: StatusKind;
  initialized: boolean;
  busy: boolean;
  setStatus: (status: string) => void;
  refresh: () => Promise<void>;
  runAction: (action: () => Promise<{ message?: string } | void>, fallback: string) => Promise<void>;
}

export function useDeviceSettings(): DeviceSettings {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [adapters, setAdapters] = useState<GpuAdapter[]>([]);
  const [status, setStatus] = useState('正在读取本机配置...');
  const [statusKind, setStatusKind] = useState<StatusKind>('info');
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [nextSettings, nextAdapters] = await Promise.all([
        window.lightQuality.settings.get(),
        window.lightQuality.gpu.listAdapters()
      ]);
      setSettings(nextSettings);
      setAdapters(nextAdapters);
      setStatusKind(nextAdapters.length ? 'success' : 'info');
      setStatus(nextAdapters.length ? '已读取本机 NVIDIA 显卡。' : '未发现 NVIDIA 显卡。');
    } catch (error) {
      setStatusKind('error');
      setStatus(readError(error));
    } finally {
      setInitialized(true);
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = useCallback(
    async (action: () => Promise<{ message?: string } | void>, fallback: string) => {
      setBusy(true);
      try {
        const result = await action();
        setStatusKind('success');
        setStatus(result?.message || fallback);
        await refresh();
      } catch (error) {
        setStatusKind('error');
        setStatus(readError(error));
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  return {
    settings,
    adapters,
    status,
    statusKind,
    initialized,
    busy,
    setStatus,
    refresh,
    runAction
  };
}
