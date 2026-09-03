import { getActiveOptions } from "@/components/builder/form/form-definition";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

import type { FieldInputPropsFor } from "../types";

export function SelectField({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputPropsFor<"select">) {
  const hasError = touched && !!error;

  if (field.attributes.multiple) {
    return (
      <select
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-2xl border border-input bg-input/50 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-ring/30 focus:ring-offset-2 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50",
          hasError ? "border-destructive/60 focus:ring-destructive/30" : "",
        )}
        disabled={disabled}
        multiple
        onBlur={onBlur}
        onChange={(event) => {
          const selected = Array.from(
            event.target.selectedOptions,
            (option) => option.value,
          );
          onChange(selected.join(","));
        }}
        value={(value as string | undefined)?.split(",") ?? []}
      >
        {getActiveOptions(field)
          .filter(Boolean)
          .map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
      </select>
    );
  }

  return (
    <Select
      disabled={disabled}
      onValueChange={(v) => {
        if (!v) return;
        onChange(v);
        onBlur();
      }}
      value={value || undefined}
    >
      <SelectTrigger
        className={cn(
          "w-full",
          hasError ? "border-destructive/60 focus:ring-destructive/30" : "",
        )}
      >
        <SelectValue
          placeholder={field.attributes.placeholder ?? "Select..."}
        />
      </SelectTrigger>
      <SelectContent>
        {getActiveOptions(field)
          .filter(Boolean)
          .map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  );
}
