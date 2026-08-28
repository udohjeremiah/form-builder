"use client";

import type { GroupCondition } from "@/types/rule-definition";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const MATCH_OPTIONS: Record<GroupCondition["operator"], string> = {
  and: "All conditions",
  or: "Any condition",
};

/**
 * A labeled MATCH select at a group's connector junction. The stored value is
 * the lowercase `and`/`or`; the dropdown reads "All conditions"/"Any condition".
 */
export function Combinator({
  onChange,
  operator,
}: {
  onChange: (operator: GroupCondition["operator"]) => void;
  operator: GroupCondition["operator"];
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] tracking-widest text-muted-foreground/70">
        Match
      </span>
      <Select
        onValueChange={(value) => {
          if (value === "and" || value === "or") onChange(value);
        }}
        value={operator}
      >
        <SelectTrigger className="h-7 w-40 text-xs">
          <SelectValue>{operator}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          {(["and", "or"] as const).map((value) => (
            <SelectItem className="text-xs" key={value} value={value}>
              {MATCH_OPTIONS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
