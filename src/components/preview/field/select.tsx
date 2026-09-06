/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import {
  type FieldComponentProps,
  getActiveOptions,
} from "@/components/builder/form/form-definition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

export function SelectField({ definition, field }: FieldComponentProps) {
  const attributes = definition.attributes as {
    multiple?: boolean;
    placeholder?: string;
  };
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const options = getActiveOptions(definition);

  if (attributes.multiple) {
    return (
      <select
        aria-invalid={isInvalid ?? undefined}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-2xl border border-input bg-input/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
        id={field.name}
        multiple
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => {
          const selected = Array.from(
            event.target.selectedOptions,
            (option) => option.value,
          );
          field.handleChange(selected.join(","));
        }}
        value={field.state.value.split(",")}
      >
        {options.filter(Boolean).map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    );
  }

  return (
    <Select
      onValueChange={(v) => {
        if (!v) return;
        field.handleChange(v);
        field.handleBlur();
      }}
      value={field.state.value}
    >
      <SelectTrigger
        aria-invalid={isInvalid ?? undefined}
        className="w-full"
        id={field.name}
      >
        <SelectValue placeholder={attributes.placeholder ?? "Select..."} />
      </SelectTrigger>
      <SelectContent>
        {options.filter(Boolean).map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
