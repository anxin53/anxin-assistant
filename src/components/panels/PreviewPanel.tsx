import { useEffect, useRef, useState } from 'react';
import { Download, FileImage, RefreshCw, RotateCcw, Upload } from 'lucide-react';
import type { DeviceSettings } from '@/hooks/useDeviceSettings';
import { defaultFilters, renderPreview } from '@/lib/image-filter';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FilterSlider } from '@/components/FilterSlider';

export function PreviewPanel({ device }: { device: DeviceSettings }) {
  const { filters, setStatus, persistFilters } = device;
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [compareOriginal, setCompareOriginal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    renderPreview(imageRef.current, canvasRef.current, filters, compareOriginal);
  }, [filters, imageUrl, compareOriginal]);

  function onImageSelected(file: File | undefined) {
    if (!file) {
      return;
    }
    if (!/^image\/(png|jpeg|webp|bmp)$/.test(file.type) && !/\.(png|jpe?g|webp|bmp)$/i.test(file.name)) {
      setStatus('只支持 png、jpg、jpeg、webp、bmp 图片。');
      return;
    }
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl);
    }
    setImageUrl(URL.createObjectURL(file));
    setStatus(`已载入图片：${file.name}`);
  }

  function downloadPreview() {
    const canvas = canvasRef.current;
    if (!canvas || !imageUrl) {
      setStatus('请先上传图片再导出。');
      return;
    }
    const anchor = document.createElement('a');
    anchor.download = `light-quality-preview-${Date.now()}.png`;
    anchor.href = canvas.toDataURL('image/png');
    anchor.click();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileImage className="h-5 w-5 text-primary" />
          图片实时预览
        </CardTitle>
        <CardDescription>亮度、对比度、伽马、饱和度和色温。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/bmp"
          hidden
          onChange={(event) => onImageSelected(event.target.files?.[0])}
        />
        <div className="flex max-h-[420px] min-h-[280px] items-center justify-center overflow-hidden rounded-md border bg-muted/40">
          {imageUrl ? (
            <>
              <img
                ref={imageRef}
                src={imageUrl}
                alt="preview source"
                onLoad={() => renderPreview(imageRef.current, canvasRef.current, filters, compareOriginal)}
                hidden
              />
              <canvas ref={canvasRef} className="max-h-[420px] max-w-full object-contain" />
            </>
          ) : (
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload />
              上传图片
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => fileInputRef.current?.click()}>
            <Upload />
            选择图片
          </Button>
          <Button variant="secondary" onClick={() => setCompareOriginal((value) => !value)} disabled={!imageUrl}>
            <RefreshCw />
            {compareOriginal ? '显示滤镜' : '对比原图'}
          </Button>
          <Button variant="secondary" onClick={downloadPreview} disabled={!imageUrl}>
            <Download />
            导出 PNG
          </Button>
        </div>

        <div className="space-y-4">
          <FilterSlider label="亮度" value={filters.brightness} min={-100} max={100} step={1} onChange={(brightness) => persistFilters({ ...filters, brightness })} />
          <FilterSlider label="对比度" value={filters.contrast} min={-100} max={100} step={1} onChange={(contrast) => persistFilters({ ...filters, contrast })} />
          <FilterSlider label="伽马" value={filters.gamma} min={0.2} max={3} step={0.01} onChange={(gamma) => persistFilters({ ...filters, gamma })} />
          <FilterSlider label="饱和度" value={filters.saturation} min={-100} max={100} step={1} onChange={(saturation) => persistFilters({ ...filters, saturation })} />
          <FilterSlider label="色温" value={filters.temperature} min={-100} max={100} step={1} onChange={(temperature) => persistFilters({ ...filters, temperature })} />
        </div>

        <Button variant="outline" className="w-full" onClick={() => persistFilters(defaultFilters)}>
          <RotateCcw />
          重置参数
        </Button>
      </CardContent>
    </Card>
  );
}
