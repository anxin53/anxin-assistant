import { useState } from 'react';
import { useDeviceSettings } from '@/hooks/useDeviceSettings';
import { type TabKey } from '@/lib/constants';
import { Sidebar } from '@/components/Sidebar';
import { GpuPanel } from '@/components/panels/GpuPanel';
import { ColorPanel } from '@/components/panels/ColorPanel';
import { PreviewPanel } from '@/components/panels/PreviewPanel';

export function App() {
  const device = useDeviceSettings();
  const [activeTab, setActiveTab] = useState<TabKey>('gpu');

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} onRefresh={device.refresh} busy={device.busy} />

      <main className="flex flex-1 flex-col overflow-y-auto">
        <div className="border-b bg-card/60 px-8 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
            <span>{device.status}</span>
          </div>
        </div>

        <div className="mx-auto w-full max-w-3xl px-8 py-8">
          {activeTab === 'gpu' && <GpuPanel device={device} />}
          {activeTab === 'color' && <ColorPanel device={device} />}
          {activeTab === 'preview' && <PreviewPanel device={device} />}
        </div>
      </main>
    </div>
  );
}
