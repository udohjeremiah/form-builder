import { getActiveOptions } from "@/components/builder/form/form-definition";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/cn";

import type { FieldInputProps } from "../types";

export function RadioField({
  disabled,
  field,
  onBlur,
  onChange,
  value,
}: FieldInputProps) {
  return (
    <RadioGroup
      className="flex flex-col gap-2"
      disabled={disabled}
      onValueChange={(v: string) => {
        onChange(v);
        onBlur();
      }}
      value={value}
    >
      {(getActiveOptions(field).length > 0
        ? getActiveOptions(field)
        : ["Option 1", "Option 2"]
      )
        .filter(Boolean)
        .map((o) => (
          <Label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
              "has-data-checked:border-primary has-data-checked:bg-primary/5",
              "hover:bg-accent/50",
              disabled && "cursor-default opacity-60",
            )}
            htmlFor={`${field.id}-${o}`}
            key={o}
          >
            <RadioGroupItem id={`${field.id}-${o}`} value={o} />
            <span className="font-medium text-foreground">{o}</span>
          </Label>
        ))}
    </RadioGroup>
  );
}
