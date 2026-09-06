/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  type FieldComponentProps,
  getActiveOptions,
} from "@/components/builder/form/form-definition";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/cn";

export function CheckboxField({ definition, field }: FieldComponentProps) {
  const options = getActiveOptions(definition).filter(Boolean);
  const choices = options.length > 0 ? options : ["Option 1", "Option 2"];
  const selected = field.state.value.split(",").filter(Boolean);
  const toggle = (option: string) => {
    const next = selected.includes(option)
      ? selected.filter((item: string) => item !== option)
      : [...selected, option];
    field.handleChange(next.join(","));
    field.handleBlur();
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
            )}
            htmlFor={`${definition.id}-${option}`}
            key={option}
          >
            <Checkbox
              checked={checked}
              id={`${definition.id}-${option}`}
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
