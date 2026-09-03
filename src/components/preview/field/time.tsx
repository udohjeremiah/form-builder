import { Input } from "@/components/ui/input";

import { type FieldInputPropsFor, useErrorClass } from "../types";

export function TimeField({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputPropsFor<"time">) {
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
      type="time"
      value={value}
    />
  );
}
