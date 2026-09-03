import { Input } from "@/components/ui/input";

import { type FieldInputPropsFor, useErrorClass } from "../types";

export function NumberField({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputPropsFor<"number">) {
  const { max, min, placeholder, step } = field.attributes;

  return (
    <Input
      className={useErrorClass(touched, error)}
      disabled={disabled}
      max={max}
      min={min}
      onBlur={onBlur}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      placeholder={placeholder}
      step={step}
      type="number"
      value={value}
    />
  );
}
