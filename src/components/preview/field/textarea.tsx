import { Textarea } from "@/components/ui/textarea";

import { type FieldInputPropsFor, useErrorClass } from "../types";

export function TextareaField({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputPropsFor<"textarea">) {
  const { maxLength, minLength, placeholder } = field.attributes;

  return (
    <Textarea
      autoComplete={field.attributes.autoComplete}
      className={useErrorClass(touched, error)}
      disabled={disabled}
      maxLength={maxLength}
      minLength={minLength}
      onBlur={onBlur}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      placeholder={placeholder}
      value={value}
    />
  );
}
