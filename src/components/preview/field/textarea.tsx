/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { Textarea } from "@/components/ui/textarea";

export function TextareaField({ definition, field }: FieldComponentProps) {
  const attributes = definition.attributes as {
    autoComplete?: string;
    maxLength?: number;
    minLength?: number;
    placeholder?: string;
  };
  const { maxLength, minLength, placeholder } = attributes;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Textarea
      aria-invalid={isInvalid ?? undefined}
      autoComplete={attributes.autoComplete}
      id={field.name}
      maxLength={maxLength}
      minLength={minLength}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => {
        field.handleChange(event.target.value);
      }}
      placeholder={placeholder}
      value={field.state.value}
    />
  );
}
