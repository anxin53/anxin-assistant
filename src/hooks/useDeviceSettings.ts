import { useCallback, useEffect, useState } from 'react';
import type { AppSettings, DisplayDevice, FilterSettings, GpuAdapter } from '@/types';
import { defaultFilters } from '@/lib/image-filter';
import { readError } from '@/lib/error';

export interface DeviceSettings {
  settings: AppSettings | null;
  adapters: GpuAdapter[];
  displays: DisplayDevice[];
  filters: FilterSettings;
  status: string;
  busy: boolean;
  setStatus: (status: string) => void;
  refresh: () => Promise<void>;
  runAction: (action: () => Promise<{ message?: string } | void>, fallback: string) => Promise<void>;
  persistFilters: (nextFilters: FilterSettings) => Promise<void>;
}

export function useDeviceSettings(): DeviceSettings {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [adapters, setAdapters] = useState<GpuAdapter[]>([]);
  const [displays, setDisplays] = useState<DisplayDevice[]>([]);
  const [status, setStatus] = useState('正在读取本机配置...');
  const [busy, setBusy] = useState(false);

  const filters = settings?.filters || defaultFilters;

  const refresh = useCallback(async () => {
    setBusy(true);
    try {
      const [nextSettings, nextAdapters] = await Promise.all([
        window.lightQuality.settings.get(),
        window.lightQuality.gpu.listAdapters()
      ]);
      setSettings(nextSettings);
      setAdapters(nextAdapters);
      setStatus(nextAdapters.length ? '已读取本机 NVIDIA 显卡。' : '未发现 NVIDIA 显卡。');

      window.lightQuality.color
        .listDisplays()
        .then((nextDisplays) => {
          setDisplays(nextDisplays);
        })
        .catch((error) => {
          setStatus(`NVIDIA 显卡已读取；显示器色彩信息读取失败：${readError(error)}`);
        });
    } catch (error) {
      setStatus(readError(error));
    } finally {
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
        setStatus(result?.message || fallback);
        await refresh();
      } catch (error) {
        setStatus(readError(error));
      } finally {
        setBusy(false);
      }
    },
    [refresh]
  );

  const persistFilters = useCallback(
    async (nextFilters: FilterSettings) => {
      if (!settings) {
        return;
      }
      const next = { ...settings, filters: nextFilters };
      setSettings(next);
      try {
        await window.lightQuality.settings.set(next);
      } catch (error) {
        setStatus(readError(error));
      }
    },
    [settings]
  );

  return {
    settings,
    adapters,
    displays,
    filters,
    status,
    busy,
    setStatus,
    refresh,
    runAction,
    persistFilters
  };
}
