import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";

import { type FieldInputProps, useErrorClass } from "../types";

export function ColorField({
  disabled,
  error,
  onBlur,
  onChange,
  touched,
  value,
}: FieldInputProps) {
  const errorClass = useErrorClass(touched, error);

  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 cursor-pointer overflow-hidden rounded-lg border border-border"
        style={{ backgroundColor: value || "#3b82f6" }}
      >
        <input
          className="size-full cursor-pointer opacity-0"
          disabled={disabled}
          onChange={(event) => {
            onChange(event.target.value);
            onBlur();
          }}
          type="color"
          value={value || "#3b82f6"}
        />
      </div>
      <Input
        className={cn("flex-1 font-mono text-xs", errorClass)}
        disabled={disabled}
        onBlur={onBlur}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        placeholder="#000000"
        value={value || "#3b82f6"}
      />
    </div>
  );
}
