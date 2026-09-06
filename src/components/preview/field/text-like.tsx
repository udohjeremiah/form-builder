/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { AnyFieldDefinition, FieldDefinition } from "@/components/builder";

import { Input } from "@/components/ui/input";

interface TextLikeFieldProps {
  definition: AnyFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any;
  type: TextLikeType;
}

type TextLikeType = "email" | "password" | "tel" | "text" | "url";

export function TextLikeField({ definition, field, type }: TextLikeFieldProps) {
  const attributes =
    definition.attributes as FieldDefinition<TextLikeType>["attributes"];
  const { autoComplete, maxLength, minLength, placeholder } = attributes;
  const pattern = "pattern" in attributes ? attributes.pattern : undefined;
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;

  return (
    <Input
      aria-invalid={isInvalid ?? undefined}
      autoComplete={autoComplete}
      disabled={
        field.state.meta.isTouched && field.state.meta.errors.length > 0
      }
      id={field.name}
      maxLength={maxLength}
      minLength={minLength}
      name={field.name}
      onBlur={field.handleBlur}
      onChange={(event) => {
        field.handleChange(event.target.value);
      }}
      pattern={pattern}
      placeholder={placeholder}
      type={type}
      value={field.state.value}
    />
  );
}
