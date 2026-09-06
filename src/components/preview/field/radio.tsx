/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  type FieldComponentProps,
  getActiveOptions,
} from "@/components/builder/form/form-definition";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/cn";

export function RadioField({ definition, field }: FieldComponentProps) {
  const options = getActiveOptions(definition);

  return (
    <RadioGroup
      className="flex flex-col gap-2"
      onValueChange={(v: string) => {
        field.handleChange(v);
        field.handleBlur();
      }}
      value={field.state.value}
    >
      {(options.length > 0 ? options : ["Option 1", "Option 2"])
        .filter(Boolean)
        .map((o) => (
          <Label
            className={cn(
              "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors",
              "has-data-checked:border-primary has-data-checked:bg-primary/5",
              "hover:bg-accent/50",
            )}
            htmlFor={`${definition.id}-${o}`}
            key={o}
          >
            <RadioGroupItem id={`${definition.id}-${o}`} value={o} />
            <span className="font-medium text-foreground">{o}</span>
          </Label>
        ))}
    </RadioGroup>
  );
}
