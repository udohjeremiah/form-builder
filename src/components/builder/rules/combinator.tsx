"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import type { GroupCondition } from "../index";

const MATCH_OPTIONS: Record<GroupCondition["operator"], string> = {
  and: "All conditions",
  or: "Any condition",
};

export function Combinator({
  onBlur,
  onChange,
  operator,
}: {
  onBlur: () => void;
  onChange: (operator: GroupCondition["operator"]) => void;
  operator: GroupCondition["operator"];
}) {
  return (
    <div>
      <span className="mb-1 block text-[11px] tracking-widest text-muted-foreground">
        Match
      </span>
      <Select
        onValueChange={(value) => {
          if (value === "and" || value === "or") onChange(value);
        }}
        value={operator}
      >
        <SelectTrigger className="h-7 text-xs" onBlur={onBlur}>
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
