import type { FilterSettings } from '@/types';

export const defaultFilters: FilterSettings = {
  brightness: 0,
  contrast: 0,
  gamma: 1,
  saturation: 0,
  temperature: 0
};

export function clamp(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function formatValue(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(2);
}

export function renderPreview(
  image: HTMLImageElement | null,
  canvas: HTMLCanvasElement | null,
  filters: FilterSettings,
  original: boolean
) {
  if (!image || !canvas || !image.complete || image.naturalWidth === 0) {
    return;
  }

  const maxSide = 1800;
  const scale = Math.min(1, maxSide / Math.max(image.naturalWidth, image.naturalHeight));
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  if (original) {
    return;
  }

  const frame = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = frame.data;
  const brightness = filters.brightness * 2.55;
  const contrast = (259 * (filters.contrast + 255)) / (255 * (259 - filters.contrast));
  const gamma = Math.max(0.05, filters.gamma);
  const saturation = 1 + filters.saturation / 100;
  const temperature = filters.temperature / 100;

  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    r = contrast * (r - 128) + 128 + brightness;
    g = contrast * (g - 128) + 128 + brightness;
    b = contrast * (b - 128) + 128 + brightness;

    r = 255 * Math.pow(clamp(r) / 255, 1 / gamma);
    g = 255 * Math.pow(clamp(g) / 255, 1 / gamma);
    b = 255 * Math.pow(clamp(b) / 255, 1 / gamma);

    const gray = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    r = gray + (r - gray) * saturation;
    g = gray + (g - gray) * saturation;
    b = gray + (b - gray) * saturation;

    r += 28 * temperature;
    b -= 28 * temperature;

    data[i] = clamp(r);
    data[i + 1] = clamp(g);
    data[i + 2] = clamp(b);
  }

  ctx.putImageData(frame, 0, 0);
}
