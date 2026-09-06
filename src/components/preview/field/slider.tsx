/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { Slider } from "@/components/ui/slider";

export function SliderField({ definition, field }: FieldComponentProps) {
  const attributes = definition.attributes as {
    max?: number;
    min?: number;
    step?: number;
  };
  const { max = 100, min = 0, step = 1 } = attributes;
  const sliderValue = field.state.value
    ? Number(field.state.value)
    : Math.min(Math.max(50, min), max);

  return (
    <div className="space-y-3">
      <Slider
        className="w-full"
        id={field.name}
        max={max}
        min={min}
        onValueChange={(v: number | readonly number[]) => {
          if (Array.isArray(v)) {
            field.handleChange(String(v[0]));
          } else {
            field.handleChange(String(v));
          }
          field.handleBlur();
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
