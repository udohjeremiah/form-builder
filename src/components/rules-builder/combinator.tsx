"use client";

import type { GroupCondition } from "@/types/rule-definition";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const COMBINATOR_LABELS: Record<GroupCondition["operator"], "AND" | "OR"> = {
  all: "AND",
  any: "OR",
};

/**
 * A compact editable AND/OR pill shown at the connector junction of a group.
 */
export function Combinator({
  onChange,
  operator,
}: {
  onChange: (operator: GroupCondition["operator"]) => void;
  operator: GroupCondition["operator"];
}) {
  return (
    <Select
      onValueChange={(value) => {
        if (value === "all" || value === "any") onChange(value);
      }}
      value={operator}
    >
      <SelectTrigger className="inline-flex h-5 w-auto gap-1 rounded-full border-border/70 bg-background px-2 text-[10px] font-bold tracking-wider text-muted-foreground [&>svg]:size-2.5">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {(["all", "any"] as const).map((value) => (
          <SelectItem className="text-xs" key={value} value={value}>
            {COMBINATOR_LABELS[value]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
