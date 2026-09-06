/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { Input } from "@/components/ui/input";

export function DateField({ definition, field }: FieldComponentProps) {
  const attributes = definition.attributes as {
    maxDate?: string;
    minDate?: string;
  };
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Input
      aria-invalid={isInvalid ?? undefined}
      id={field.name}
      max={attributes.maxDate}
      min={attributes.minDate}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => {
        field.handleChange(event.target.value);
      }}
      type="date"
      value={field.state.value}
    />
  );
}
