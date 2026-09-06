/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { Input } from "@/components/ui/input";

export function NumberField({ definition, field }: FieldComponentProps) {
  const attributes = definition.attributes as {
    max?: number;
    min?: number;
    placeholder?: string;
    step?: number;
  };
  const { max, min, placeholder, step } = attributes;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Input
      aria-invalid={isInvalid ?? undefined}
      id={field.name}
      max={max}
      min={min}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => {
        field.handleChange(event.target.value);
      }}
      placeholder={placeholder}
      step={step}
      type="number"
      value={field.state.value}
    />
  );
}
