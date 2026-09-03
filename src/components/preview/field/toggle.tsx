import { Switch } from "@/components/ui/switch";

import type { FieldInputProps } from "../types";

export function ToggleField({
  disabled,
  field,
  onBlur,
  onChange,
  value,
}: FieldInputProps) {
  return (
    <Switch
      checked={value === "true"}
      disabled={disabled}
      id={field.id}
      onCheckedChange={(checked) => {
        onChange(String(checked));
        onBlur();
      }}
    />
  );
}
