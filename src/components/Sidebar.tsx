import { RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { navItems, type TabKey } from '@/lib/constants';

export function Sidebar({
  activeTab,
  onTabChange,
  onRefresh,
  busy
}: {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
  onRefresh: () => void;
  busy: boolean;
}) {
  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-card">
      <div className="px-5 py-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Anxin Assistant</p>
        <h1 className="mt-1 text-lg font-semibold">安心助手</h1>
      </div>
      <nav className="flex flex-1 flex-col gap-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => onTabChange(item.key)}
              className={cn(
                'flex items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                active ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              <Icon className="mt-0.5 h-4 w-4 shrink-0" />
              <span className="flex flex-col">
                <span className="text-sm font-medium leading-tight">{item.label}</span>
                <span className="text-xs text-muted-foreground">{item.description}</span>
              </span>
            </button>
          );
        })}
      </nav>
      <div className="px-3 pb-5">
        <Button variant="outline" className="w-full" onClick={onRefresh} disabled={busy}>
          <RefreshCw className={cn(busy && 'animate-spin')} />
          刷新
        </Button>
      </div>
    </aside>
  );
}
