/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { Input } from "@/components/ui/input";

export function ColorField({ field }: FieldComponentProps) {
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const value = field.state.value ?? "#3b82f6";

  return (
    <div className="flex items-center gap-3">
      <div
        className="size-10 cursor-pointer overflow-hidden rounded-lg border border-border"
        style={{ backgroundColor: value }}
      >
        <input
          aria-invalid={isInvalid ?? undefined}
          className="size-full cursor-pointer opacity-0"
          id={field.name}
          onChange={(event) => {
            field.handleChange(event.target.value);
            field.handleBlur();
          }}
          type="color"
          value={value}
        />
      </div>
      <Input
        aria-invalid={isInvalid ?? undefined}
        className="flex-1 font-mono text-xs"
        name={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(event.target.value);
        }}
        placeholder="#000000"
        value={value}
      />
    </div>
  );
}
