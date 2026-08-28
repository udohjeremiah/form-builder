"use client";

import { XIcon } from "lucide-react";
import { useMemo } from "react";

import type { AnyFieldDefinition } from "@/types/form-definition";
import type {
  ComparisonCondition,
  Condition,
  ExistsCondition,
} from "@/types/rule-definition";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { generateColor } from "@/lib/generate-color";
import {
  COMPARISON_OPERATOR_LABELS,
  COMPARISON_OPERATOR_LIST,
  newComparisonCondition,
  newExistsCondition,
  newReviewCondition,
} from "@/lib/rule-definition";

const CONDITION_TYPES: { label: string; value: Condition["type"] }[] = [
  { label: "Comparison", value: "comparison" },
  { label: "Exists", value: "exists" },
  { label: "Review", value: "review" },
];

export function ConditionRow({
  allFields,
  condition,
  onChange,
  onRemove,
}: {
  allFields: AnyFieldDefinition[];
  condition: Condition;
  onChange: (condition: Condition) => void;
  onRemove: () => void;
}) {
  const fieldId = "field" in condition ? condition.field : undefined;
  const color = useMemo(() => generateColor(fieldId), [fieldId]);

  return (
    <div
      className="space-y-1.5 border-s-4 bg-background/60 p-2"
      style={{ borderInlineStartColor: color }}
    >
      <div className="flex items-center gap-1.5">
        <Select
          onValueChange={(value) => {
            if (!value || value === condition.type) return;
            if (value === "comparison") {
              onChange(newComparisonCondition());
            } else if (value === "exists") {
              onChange(newExistsCondition());
            } else {
              onChange(newReviewCondition());
            }
          }}
          value={condition.type}
        >
          <SelectTrigger className="h-7 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONDITION_TYPES.map((type) => (
              <SelectItem
                className="text-xs"
                key={type.value}
                value={type.value}
              >
                {type.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          className="ms-auto shrink-0 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
          onClick={onRemove}
          size="icon-xs"
          title="Remove condition"
          variant="ghost"
        >
          <XIcon className="size-3" />
        </Button>
      </div>

      {condition.type === "comparison" && (
        <ComparisonEditor
          allFields={allFields}
          condition={condition}
          onChange={onChange}
        />
      )}

      {condition.type === "exists" && (
        <ExistsEditor
          allFields={allFields}
          condition={condition}
          onChange={onChange}
        />
      )}

      {condition.type === "review" && (
        <Input
          className="h-7 text-xs"
          onChange={(event) => {
            onChange({ ...condition, note: event.target.value });
          }}
          placeholder="Review instruction..."
          value={condition.note}
        />
      )}
    </div>
  );
}

function ComparisonEditor({
  allFields,
  condition,
  onChange,
}: {
  allFields: AnyFieldDefinition[];
  condition: ComparisonCondition;
  onChange: (condition: Condition) => void;
}) {
  return (
    <>
      <FieldSelect
        allFields={allFields}
        onChange={(field) => {
          onChange({ ...condition, field });
        }}
        value={condition.field}
      />
      <Select
        onValueChange={(operator) => {
          if (operator) onChange({ ...condition, operator });
        }}
        value={condition.operator}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {COMPARISON_OPERATOR_LIST.map((operator) => (
            <SelectItem className="text-xs" key={operator} value={operator}>
              {COMPARISON_OPERATOR_LABELS[operator]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        className="h-7 font-mono text-xs"
        onChange={(event) => {
          onChange({ ...condition, value: event.target.value });
        }}
        placeholder="Expected value(s) — comma separated..."
        value={condition.value}
      />
    </>
  );
}

function ExistsEditor({
  allFields,
  condition,
  onChange,
}: {
  allFields: AnyFieldDefinition[];
  condition: ExistsCondition;
  onChange: (condition: Condition) => void;
}) {
  return (
    <>
      <FieldSelect
        allFields={allFields}
        onChange={(field) => {
          onChange({ ...condition, field });
        }}
        value={condition.field}
      />
      <Select
        onValueChange={(present) => {
          if (present) onChange({ ...condition, present: present === "true" });
        }}
        value={condition.present ? "true" : "false"}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem className="text-xs" value="true">
            Is answered
          </SelectItem>
          <SelectItem className="text-xs" value="false">
            Is not answered
          </SelectItem>
        </SelectContent>
      </Select>
    </>
  );
}

function FieldSelect({
  allFields,
  onChange,
  value,
}: {
  allFields: AnyFieldDefinition[];
  onChange: (fieldId: string) => void;
  value: string;
}) {
  return (
    <Select
      onValueChange={(fieldId) => {
        if (fieldId) onChange(fieldId);
      }}
      value={value}
    >
      <SelectTrigger className="h-7 w-full text-xs">
        <SelectValue placeholder="Select a field..." />
      </SelectTrigger>
      <SelectContent>
        {allFields.map((field) => (
          <SelectItem className="text-xs" key={field.id} value={field.id}>
            {field.attributes.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
