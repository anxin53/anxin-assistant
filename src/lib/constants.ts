import { MonitorCog } from 'lucide-react';

export type TabKey = 'gpu';

export const navItems: { key: TabKey; label: string; description: string; icon: typeof MonitorCog }[] = [
  { key: 'gpu', label: 'GPU 名称改写', description: '显示名备份与写入', icon: MonitorCog }
];

export const desktopDefaultGpuName = 'NVIDIA GeForce GTX 750 Ti';
export const laptopDefaultGpuName = 'NVIDIA GeForce GTX 1050 Ti';

export const gpuNamePresets = [
  desktopDefaultGpuName,
  laptopDefaultGpuName
];
