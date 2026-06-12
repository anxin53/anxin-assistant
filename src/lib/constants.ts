import { FileImage, MonitorCog, SlidersHorizontal } from 'lucide-react';

export type TabKey = 'gpu' | 'color' | 'preview';

export const navItems: { key: TabKey; label: string; description: string; icon: typeof MonitorCog }[] = [
  { key: 'gpu', label: 'GPU 名称改写', description: '显示名备份与写入', icon: MonitorCog },
  { key: 'color', label: 'ICC 系统色彩', description: '导入与应用配置', icon: SlidersHorizontal },
  { key: 'preview', label: '图片实时预览', description: '滤镜调节与导出', icon: FileImage }
];

export const gpuNamePresets = [
  'NVIDIA GeForce GTX 750 Ti',
  'NVIDIA GeForce GTX 650',
  'NVIDIA GeForce GTX 1050 Ti',
  'NVIDIA GeForce RTX 2050 Laptop GPU',
  'NVIDIA GeForce RTX 3060',
  'NVIDIA GeForce RTX 4060 Laptop GPU',
  'NVIDIA GeForce RTX 4070 Laptop GPU',
  'NVIDIA GeForce RTX 4090',
  'AMD Radeon RX 460',
  'AMD Radeon RX 580',
  'AMD Radeon RX 6600',
  'AMD Radeon RX 7900 XTX',
  'Intel(R) UHD Graphics 630',
  'Intel(R) Iris(R) Xe Graphics'
];
