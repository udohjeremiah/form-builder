"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/cn";

import type { ConditionOperator } from "./index";

import { isMultiValueOperator } from "./operators";

/**
 * Edits the expected value of a condition when the referenced field has a
 * fixed set of options (checkbox / radio / select). Renders a single dropdown
 * for single-value operators and a checkbox picker for the multi-value
 * "is one of" / "is not one of" operators. Returns null when the field offers
 * no options, so callers can fall back to free-text input.
 */
export function OptionsValueInput({
  disabled,
  fullWidth,
  onChange,
  operator,
  options,
  value,
}: {
  disabled?: boolean;
  fullWidth?: boolean;
  onChange: (value: string) => void;
  operator: ConditionOperator;
  options: string[];
  value: string;
}) {
  const availableOptions = options.filter(Boolean);
  if (availableOptions.length === 0) return null;

  if (isMultiValueOperator(operator)) {
    const selected = value
      .split("\n")
      .map((option) => option.trim())
      .filter((option) => option.length > 0);
    const toggle = (option: string) => {
      const next = selected.includes(option)
        ? selected.filter((item) => item !== option)
        : [...selected, option];
      onChange(next.join("\n"));
    };
    return (
      <div className="min-w-0 flex-1 basis-full space-y-1">
        {availableOptions.map((option) => {
          const checked = selected.includes(option);
          return (
            <Label
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-md px-2 py-1 text-xs text-foreground",
                checked && "bg-primary/10",
                disabled && "cursor-default opacity-60",
              )}
              key={option}
            >
              <Checkbox
                checked={checked}
                disabled={disabled}
                onCheckedChange={() => {
                  toggle(option);
                }}
              />
              <span className="truncate">{option}</span>
            </Label>
          );
        })}
      </div>
    );
  }

  return (
    <Select
      disabled={disabled}
      onValueChange={(option) => {
        if (option) onChange(option);
      }}
      value={value}
    >
      <SelectTrigger
        className={cn("h-7 text-xs", fullWidth ? "w-full" : "min-w-0 flex-1")}
      >
        <SelectValue placeholder="Select an option..." />
      </SelectTrigger>
      <SelectContent>
        {availableOptions.map((option) => (
          <SelectItem className="text-xs" key={option} value={option}>
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
