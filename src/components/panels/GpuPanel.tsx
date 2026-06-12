import { useMemo, useState } from 'react';
import { MonitorCog, RotateCcw, ShieldAlert } from 'lucide-react';
import type { DeviceSettings } from '@/hooks/useDeviceSettings';
import { gpuNamePresets } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export function GpuPanel({ device }: { device: DeviceSettings }) {
  const { adapters, settings, busy, runAction } = device;
  const [selectedAdapterId, setSelectedAdapterId] = useState('');
  const [customGpuName, setCustomGpuName] = useState('');

  const selectedAdapter = useMemo(
    () => adapters.find((adapter) => adapter.id === selectedAdapterId) || adapters[0],
    [adapters, selectedAdapterId]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MonitorCog className="h-5 w-5 text-primary" />
          GPU 名称改写
        </CardTitle>
        <CardDescription>预设名称或手动输入，写入前自动备份。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <Label>选择显卡</Label>
          <Select value={selectedAdapter?.id || ''} onValueChange={setSelectedAdapterId}>
            <SelectTrigger>
              <SelectValue placeholder="未发现显示适配器" />
            </SelectTrigger>
            <SelectContent>
              {adapters.map((adapter) => (
                <SelectItem key={adapter.id} value={adapter.id}>
                  {adapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAdapter ? (
          <div className="space-y-1.5 rounded-md border bg-muted/40 p-3 text-xs text-muted-foreground">
            <div>驱动：{selectedAdapter.driverVersion || '未知'}</div>
            <div>厂商：{selectedAdapter.adapterCompatibility || '未知'}</div>
            <div className="break-all">设备路径：{selectedAdapter.pnpDeviceId}</div>
            <div className="break-all">当前 DeviceDesc：{selectedAdapter.deviceDesc || '未读取到'}</div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">未发现显示适配器。</p>
        )}

        <div className="space-y-2">
          <Label>名称预设</Label>
          <Select value={customGpuName} onValueChange={setCustomGpuName}>
            <SelectTrigger>
              <SelectValue placeholder="选择一个显卡名称预设" />
            </SelectTrigger>
            <SelectContent>
              {gpuNamePresets.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gpu-name">手动名称</Label>
          <Input
            id="gpu-name"
            value={customGpuName}
            onChange={(event) => setCustomGpuName(event.target.value)}
            placeholder="也可以自己输入显卡显示名"
            maxLength={128}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            onClick={() =>
              selectedAdapter &&
              runAction(
                () => window.lightQuality.gpu.setAdapterName({ adapter: selectedAdapter, customName: customGpuName }),
                '显卡名称已写入。'
              )
            }
            disabled={busy || !selectedAdapter || !customGpuName.trim()}
          >
            <ShieldAlert />
            备份并写入
          </Button>
          <Button
            variant="secondary"
            onClick={() =>
              selectedAdapter &&
              runAction(
                () => window.lightQuality.gpu.restoreAdapterName({ backupId: selectedAdapter.id }),
                '显卡名称已恢复。'
              )
            }
            disabled={busy || !selectedAdapter || !settings?.gpuBackups[selectedAdapter.id]}
          >
            <RotateCcw />
            恢复备份
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
