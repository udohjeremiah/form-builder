import type { FieldDefinition } from "@/components/builder";

import { Input } from "@/components/ui/input";

import { type FieldInputProps, useErrorClass } from "../types";

interface TextLikeFieldProps extends FieldInputProps<
  FieldDefinition<TextLikeType>
> {
  type: TextLikeType;
}

type TextLikeType = "email" | "password" | "tel" | "text" | "url";

export function TextLikeField({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  type,
  value,
}: TextLikeFieldProps) {
  const { autoComplete, maxLength, minLength, placeholder } = field.attributes;
  const pattern =
    "pattern" in field.attributes ? field.attributes.pattern : undefined;

  return (
    <Input
      autoComplete={autoComplete}
      className={useErrorClass(touched, error)}
      disabled={disabled}
      maxLength={maxLength}
      minLength={minLength}
      onBlur={onBlur}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      pattern={pattern}
      placeholder={placeholder}
      type={type}
      value={value}
    />
  );
}
