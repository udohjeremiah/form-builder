import { getActiveOptions } from "@/components/builder/form/form-definition";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

import type { FieldInputProps } from "../types";

export function CheckboxField({
  disabled,
  field,
  onBlur,
  onChange,
  value,
}: FieldInputProps) {
  const options = getActiveOptions(field).filter(Boolean);
  const choices = options.length > 0 ? options : ["Option 1", "Option 2"];
  const selected = value.split(",").filter(Boolean);
  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((item) => item !== option)
      : [...selected, option];
    onChange(next.join(","));
    onBlur();
  };

  return (
    <div className="space-y-2">
      {choices.map((option) => {
        const checked = selected.includes(option);
        return (
          <Label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
              "has-data-checked:border-primary has-data-checked:bg-primary/5",
              "hover:bg-accent/50",
              disabled && "cursor-default opacity-60",
            )}
            htmlFor={`${field.id}-${option}`}
            key={option}
          >
            <Checkbox
              checked={checked}
              disabled={disabled}
              id={`${field.id}-${option}`}
              onCheckedChange={() => {
                toggle(option);
              }}
            />
            <span className="font-medium text-foreground">{option}</span>
          </Label>
        );
      })}
    </div>
  );
}
