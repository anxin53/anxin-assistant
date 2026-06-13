import { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Pencil, RotateCcw, Shield } from 'lucide-react';
import type { DeviceSettings } from '@/hooks/useDeviceSettings';
import { desktopDefaultGpuName, gpuNamePresets, laptopDefaultGpuName } from '@/lib/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import gpuEdit from '@/assets/ui/gpu-edit.png';
import gpuHero from '@/assets/ui/gpu-hero.png';
import nvidiaMark from '@/assets/ui/nvidia-mark.png';

export function GpuPanel({ device }: { device: DeviceSettings }) {
  const { adapters, settings, busy, runAction } = device;
  const [selectedAdapterId, setSelectedAdapterId] = useState('');
  const [selectedPresetName, setSelectedPresetName] = useState('');
  const [manualGpuName, setManualGpuName] = useState('');

  const selectedAdapter = useMemo(
    () => adapters.find((adapter) => adapter.id === selectedAdapterId) || adapters[0],
    [adapters, selectedAdapterId]
  );

  useEffect(() => {
    if (!selectedAdapter) {
      return;
    }

    setSelectedPresetName(selectedAdapter.isLaptop ? laptopDefaultGpuName : desktopDefaultGpuName);
    setManualGpuName('');
  }, [selectedAdapter?.id]);

  const backupExists = Boolean(selectedAdapter && settings?.gpuBackups[selectedAdapter.id]);
  const targetGpuName = manualGpuName.trim() || selectedPresetName;

  return (
    <div className="overflow-hidden rounded-lg bg-white/88 shadow-[0_24px_70px_rgba(47,55,108,0.18)] backdrop-blur-xl">
      <div className="relative min-h-[126px] px-6 pb-5 pt-7">
        <div className="relative z-10 flex max-w-[620px] items-center gap-4 pr-24">
          <img src={gpuEdit} alt="" className="h-14 w-14 shrink-0 object-contain" />
          <div className="min-w-0">
            <h2 className="text-[26px] font-extrabold leading-tight text-[#121a38]">GPU 名称改写</h2>
            <p className="mt-2 text-sm font-medium text-[#6e7894]">预设名称或手动输入，写入前自动备份。</p>
          </div>
        </div>

        <img
          src={gpuHero}
          alt=""
          className="pointer-events-none absolute right-5 top-0 h-32 w-[250px] object-contain"
        />
      </div>

      <div className="space-y-5 px-6 pb-8">
        <div className="space-y-2">
          <Label className="text-sm font-extrabold text-[#121a38]">选择显卡</Label>
          <Select value={selectedAdapter?.id || ''} onValueChange={setSelectedAdapterId}>
            <SelectTrigger className="h-11 rounded-lg border border-[#4aa3ff] bg-white px-4 text-base font-semibold text-[#2d3855] shadow-[0_0_0_1px_rgba(74,163,255,0.16)] focus:ring-[#4aa3ff]/25">
              <div className="flex h-full min-w-0 items-center gap-3 leading-none">
                <img src={nvidiaMark} alt="" className="h-6 w-6 shrink-0 object-contain" />
                <SelectValue placeholder="未发现显示适配器" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg border-white/70 bg-white/95 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              {adapters.map((adapter) => (
                <SelectItem key={adapter.id} value={adapter.id} className="rounded-md">
                  {adapter.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedAdapter && (
          <div className="rounded-lg bg-[#eef5ff]/95 px-5 py-4 text-xs text-[#55617d] shadow-inner shadow-blue-900/[0.03]">
            <div className="mb-2 flex items-center gap-3">
              <InfoRow label="驱动：" value={selectedAdapter.driverVersion || '未知'} />
              <span className="ml-auto inline-flex h-7 items-center gap-1.5 rounded-full bg-emerald-100 px-3 text-xs font-bold text-emerald-600">
                <CheckCircle2 className="h-4 w-4 fill-emerald-500 text-white" />
                驱动正常
              </span>
            </div>
            <InfoRow label="厂商：" value={selectedAdapter.adapterCompatibility || '未知'} />
            <InfoRow label="设备路径：" value={selectedAdapter.pnpDeviceId} />
            <InfoRow label="当前 DeviceDesc：" value={selectedAdapter.deviceDesc || selectedAdapter.name} />
          </div>
        )}

        <div className="space-y-2">
          <Label className="text-sm font-extrabold text-[#121a38]">名称预设</Label>
          <Select value={selectedPresetName} onValueChange={setSelectedPresetName}>
            <SelectTrigger className="h-11 rounded-lg border border-[#b76dff] bg-white px-4 text-base font-semibold text-[#2d3855] shadow-[0_0_0_1px_rgba(183,109,255,0.15)] focus:ring-[#b76dff]/25">
              <div className="flex h-full min-w-0 items-center gap-3 leading-none">
                <Shield className="h-5 w-5 shrink-0 text-[#a557ff]" />
                <SelectValue placeholder="选择一个显卡名称预设" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-lg border-white/70 bg-white/95 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              {gpuNamePresets.map((name) => (
                <SelectItem key={name} value={name} className="rounded-md">
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="gpu-name" className="text-sm font-extrabold text-[#121a38]">
            手动名称
          </Label>
          <div className="relative">
            <Pencil className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#2ed2a0]" />
            <Input
              id="gpu-name"
              value={manualGpuName}
              onChange={(event) => setManualGpuName(event.target.value)}
              placeholder="也可以自己输入显卡显示名"
              maxLength={128}
              className="h-11 rounded-lg border border-[#72dfc3] bg-white pl-12 text-base font-semibold text-[#26314f] shadow-[0_0_0_1px_rgba(114,223,195,0.14)] placeholder:text-[#98a2b7] focus-visible:ring-[#72dfc3]/35"
            />
          </div>
        </div>

        <div className="flex gap-4 pt-1">
          <Button
            onClick={() =>
              selectedAdapter &&
              runAction(
                () => window.lightQuality.gpu.setAdapterName({ adapter: selectedAdapter, customName: targetGpuName }),
                '显卡名称已写入。'
              )
            }
            disabled={busy || !selectedAdapter || !targetGpuName.trim()}
            className="h-12 min-w-[260px] flex-1 rounded-lg bg-gradient-to-r from-[#4965ff] to-[#11b9ef] text-base font-extrabold text-white shadow-[0_12px_25px_rgba(38,124,245,0.28)] hover:from-[#3d57f5] hover:to-[#0aaee4] disabled:opacity-45"
          >
            <Shield className="h-5 w-5" />
            备份并写入
          </Button>
          <Button
            variant="outline"
            onClick={() =>
              selectedAdapter &&
              runAction(
                () => window.lightQuality.gpu.restoreAdapterName({ backupId: selectedAdapter.id }),
                '显卡名称已恢复。'
              )
            }
            disabled={busy || !selectedAdapter || !backupExists}
            className="h-12 min-w-[220px] rounded-lg border border-[#dfe4ee] bg-white px-8 text-base font-extrabold text-[#26314f] shadow-[0_8px_20px_rgba(55,64,100,0.12)] hover:border-[#ffa139] hover:bg-white"
          >
            <RotateCcw className="h-5 w-5 text-[#ff9828]" />
            恢复备份
          </Button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 items-start gap-2 py-0.5 leading-6">
      <span className="w-[108px] shrink-0 whitespace-nowrap font-extrabold text-[#516180]">{label}</span>
      <span className="min-w-0 break-all font-semibold text-[#606b86]">{value}</span>
    </div>
  );
}
