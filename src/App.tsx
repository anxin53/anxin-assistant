import { useEffect, useRef } from 'react';
import { useDeviceSettings } from '@/hooks/useDeviceSettings';
import { Sidebar } from '@/components/Sidebar';
import { TitleBar } from '@/components/TitleBar';
import { GpuPanel } from '@/components/panels/GpuPanel';
import { ScrollArea } from '@/components/ui/scroll-area';
import appBackground from '@/assets/ui/app-bg.png';
import gpuEdit from '@/assets/ui/gpu-edit.png';
import gpuHero from '@/assets/ui/gpu-hero.png';
import nvidiaMark from '@/assets/ui/nvidia-mark.png';
import shieldLogo from '@/assets/ui/shield-logo.png';
import { CheckCircle2, CircleAlert, LoaderCircle } from 'lucide-react';

// 只预加载关键的小图标，背景图延迟加载
const criticalAssets = [nvidiaMark, shieldLogo, gpuEdit];
const deferredAssets = [appBackground, gpuHero];

export function App() {
  const device = useDeviceSettings();
  const readySent = useRef(false);
  const StatusIcon = device.busy ? LoaderCircle : device.statusKind === 'error' ? CircleAlert : CheckCircle2;
  const statusTone =
    device.statusKind === 'error'
      ? 'bg-red-50/80 text-red-700 shadow-red-900/5'
      : 'bg-white/40 text-[#24304d] shadow-blue-900/5';
  const iconTone =
    device.busy
      ? 'animate-spin text-[#4965ff]'
      : device.statusKind === 'error'
        ? 'text-red-500'
        : 'fill-emerald-500 text-white';

  useEffect(() => {
    if (!device.initialized || readySent.current) {
      return;
    }

    let cancelled = false;

    const notifyReady = async () => {
      // 只预加载关键小图标
      await Promise.all(criticalAssets.map(preloadImage));
      await waitForNextPaint();
      if (!cancelled) {
        readySent.current = true;
        window.lightQuality.window.rendererReady();

        // 窗口显示后再加载大图片
        void Promise.all(deferredAssets.map(preloadImage));
      }
    };

    void notifyReady();

    return () => {
      cancelled = true;
    };
  }, [device.initialized]);

  return (
    <div className="relative flex h-screen overflow-hidden bg-[#edf4ff] text-[#101a36]">
      <img
        src={appBackground}
        alt=""
        className="pointer-events-none absolute inset-0 h-full w-full scale-110 object-cover"
      />
      <TitleBar />
      <Sidebar onRefresh={device.refresh} busy={device.busy} />

      <main className="relative z-10 min-w-0 flex-1">
        <ScrollArea className="h-full">
          <header className="flex h-20 shrink-0 items-center px-10">
            <div
              className={`inline-flex max-w-full items-center gap-2 rounded-full px-3 py-2 text-sm font-medium shadow-sm backdrop-blur-md ${statusTone}`}
            >
              <StatusIcon className={`h-5 w-5 shrink-0 ${iconTone}`} />
              <span>{device.status}</span>
            </div>
          </header>

          <section className="px-7 pb-9">
            <div className="mx-auto w-full max-w-[920px]">
              <GpuPanel device={device} />
            </div>
          </section>
        </ScrollArea>
      </main>
    </div>
  );
}

async function preloadImage(src: string): Promise<void> {
  const image = new Image();
  image.src = src;

  if (image.decode) {
    try {
      await image.decode();
      return;
    } catch {
      // Fall back to load/error events below.
    }
  }

  if (image.complete) {
    return;
  }

  await new Promise<void>((resolve) => {
    image.onload = () => resolve();
    image.onerror = () => resolve();
  });
}

function waitForNextPaint(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}
