import { Slider } from "@/components/ui/slider";

import type { FieldInputPropsFor } from "../types";

export function SliderField({
  disabled,
  field,
  onBlur,
  onChange,
  value,
}: FieldInputPropsFor<"slider">) {
  const { max = 100, min = 0, step = 1 } = field.attributes;
  const sliderValue = value ? Number(value) : Math.min(Math.max(50, min), max);

  return (
    <div className="space-y-3">
      <Slider
        className="w-full"
        disabled={disabled}
        max={max}
        min={min}
        onValueChange={(v: number | readonly number[]) => {
          if (Array.isArray(v)) {
            onChange(String(v[0]));
          } else {
            onChange(String(v));
          }
          onBlur();
        }}
        step={step}
        value={[sliderValue]}
      />
      <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
        <span>{min}</span>
        <span className="font-medium text-foreground">{sliderValue}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
