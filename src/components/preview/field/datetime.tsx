import { Input } from "@/components/ui/input";

import { type FieldInputPropsFor, useErrorClass } from "../types";

export function DatetimeField({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputPropsFor<"datetime">) {
  return (
    <Input
      className={useErrorClass(touched, error)}
      disabled={disabled}
      max={field.attributes.maxDate}
      min={field.attributes.minDate}
      onBlur={onBlur}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      type="datetime-local"
      value={value}
    />
  );
}
