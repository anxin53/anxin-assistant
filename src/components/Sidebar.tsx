import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import gpuEdit from '@/assets/ui/gpu-edit.png';
import shieldLogo from '@/assets/ui/shield-logo.png';

const navItems = [
  {
    label: 'GPU 名称改写',
    description: '显示名称备份与写入',
    image: gpuEdit
  }
];

export function Sidebar({
  onRefresh,
  busy
}: {
  onRefresh: () => void;
  busy: boolean;
}) {
  return (
    <aside className="relative z-10 flex w-64 shrink-0 flex-col border-r border-white/45 bg-white/38 shadow-[12px_0_35px_rgba(77,97,152,0.10)] backdrop-blur-xl">
      <div className="px-6 pb-6 pt-8">
        <div className="flex items-center gap-3">
          <img src={shieldLogo} alt="" className="h-12 w-12 shrink-0 object-contain" />
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase text-[#24365f]">ANXIN ASSISTANT</p>
            <h1 className="text-xl font-extrabold leading-6 text-[#17224a]">安心助手</h1>
          </div>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-3 px-4">
        {navItems.map((item) => {
          return (
            <button
              key={item.label}
              type="button"
              className="group flex w-full items-center gap-3 rounded-lg bg-gradient-to-r from-[#4965ff] to-[#13b8f1] px-3 py-3 text-left text-white shadow-[0_12px_25px_rgba(36,120,255,0.28)] transition"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/18">
                <img src={item.image} alt="" className="h-9 w-9 object-contain" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-bold text-white">{item.label}</span>
                <span className="mt-0.5 block text-xs text-white/82">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="px-6 pb-9">
        <Button
          variant="outline"
          className="h-12 w-full rounded-lg border-0 bg-white/72 text-sm font-bold text-[#415cff] shadow-[0_10px_25px_rgba(87,100,150,0.14)] backdrop-blur-md hover:bg-white"
          onClick={onRefresh}
          disabled={busy}
        >
          <RefreshCw className={cn('h-5 w-5', busy && 'animate-spin')} />
          刷新
        </Button>
      </div>
    </aside>
  );
}
