import { Slider } from '@/components/ui/slider';
import { formatValue } from '@/lib/image-filter';

export function FilterSlider({
  label,
  value,
  min,
  max,
  step,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="grid grid-cols-[64px_1fr_52px] items-center gap-3">
      <span className="text-sm text-foreground">{label}</span>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={(values) => onChange(values[0])} />
      <output className="text-right text-sm tabular-nums text-muted-foreground">{formatValue(value)}</output>
    </div>
  );
}
