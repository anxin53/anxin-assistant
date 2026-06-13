import { useEffect, useState } from 'react';
import { Copy, Minus, Square, X } from 'lucide-react';

export function TitleBar() {
  const [maximized, setMaximized] = useState(false);

  useEffect(() => {
    void window.lightQuality.window.isMaximized().then(setMaximized);
    return window.lightQuality.window.onMaximizedChange(setMaximized);
  }, []);

  const toggleMaximize = async () => {
    const nextMaximized = await window.lightQuality.window.toggleMaximize();
    setMaximized(nextMaximized);
  };

  return (
    <div className="app-region-drag absolute left-0 right-0 top-0 z-30 flex h-10 items-center justify-between">
      <div />

      <div className="app-region-no-drag mr-2 flex h-full items-center gap-1">
        <button
          type="button"
          title="最小化"
          className="flex h-8 w-10 items-center justify-center rounded-md text-[#425075] transition hover:bg-white/45 hover:text-[#1c294b]"
          onClick={() => void window.lightQuality.window.minimize()}
        >
          <Minus className="h-4 w-4" />
        </button>
        <button
          type="button"
          title={maximized ? '还原' : '最大化'}
          className="flex h-8 w-10 items-center justify-center rounded-md text-[#425075] transition hover:bg-white/45 hover:text-[#1c294b]"
          onClick={() => void toggleMaximize()}
        >
          {maximized ? <Copy className="h-4 w-4" /> : <Square className="h-3.5 w-3.5" />}
        </button>
        <button
          type="button"
          title="关闭"
          className="flex h-8 w-10 items-center justify-center rounded-md text-[#425075] transition hover:bg-[#ff5c7a] hover:text-white"
          onClick={() => void window.lightQuality.window.close()}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
