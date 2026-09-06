/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { Switch } from "@/components/ui/switch";

export function ToggleField({ field }: FieldComponentProps) {
  return (
    <Switch
      checked={field.state.value === "true"}
      id={field.name}
      onCheckedChange={(checked) => {
        field.handleChange(String(checked));
        field.handleBlur();
      }}
    />
  );
}
