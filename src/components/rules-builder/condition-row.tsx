"use client";

import { XIcon } from "lucide-react";
import { useMemo } from "react";

import type {
  AnyFieldDefinition,
  ConditionOperator,
} from "@/types/form-definition";
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
import { Textarea } from "@/components/ui/textarea";
import { generateColor } from "@/lib/generate-color";
import {
  CONDITION_OPERATOR_LABELS,
  getOperatorsForType,
  isMultiValueOperator,
  isPresenceOperator,
} from "@/lib/operators";
import {
  newComparisonCondition,
  newExistsCondition,
  newReviewCondition,
} from "@/lib/rule-definition";

const CONDITION_TYPES: { label: string; value: Condition["type"] }[] = [
  { label: "Comparison", value: "comparison" },
  { label: "Exists", value: "exists" },
  { label: "Review", value: "review" },
];

type ValueArity = "multi" | "none" | "single";

const arityOf = (operator: ConditionOperator): ValueArity => {
  if (isPresenceOperator(operator)) return "none";
  if (isMultiValueOperator(operator)) return "multi";
  return "single";
};

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
      className="flex items-start gap-1.5 border-s-4 bg-background/60 p-2"
      style={{ borderInlineStartColor: color }}
    >
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
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
          <SelectTrigger className="h-7 min-w-0 flex-1 text-xs">
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
            className="h-7 min-w-0 flex-1 basis-40 text-xs"
            onChange={(event) => {
              onChange({ ...condition, note: event.target.value });
            }}
            placeholder="Review instruction..."
            value={condition.note}
          />
        )}
      </div>

      <Button
        onClick={onRemove}
        size="icon-xs"
        title="Remove condition"
        variant="destructive"
      >
        <XIcon className="size-3" />
      </Button>
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
  const selectedField = allFields.find((field) => field.id === condition.field);
  const fieldType = selectedField?.type ?? "text";
  const operators = getOperatorsForType(fieldType);
  const arity = arityOf(condition.operator);

  return (
    <>
      <FieldSelect
        allFields={allFields}
        onChange={(field) => {
          const next: ComparisonCondition = { ...condition, field };
          const type = allFields.find((f) => f.id === field)?.type ?? "text";
          const allowed = getOperatorsForType(type);
          if (!allowed.includes(next.operator)) {
            next.operator = allowed[0] ?? next.operator;
            next.value = "";
          }
          onChange(next);
        }}
        value={condition.field}
      />
      <Select
        onValueChange={(operator) => {
          if (!operator || operator === condition.operator) return;
          const next: ComparisonCondition = {
            ...condition,
            operator,
          };
          if (arityOf(next.operator) !== arityOf(condition.operator)) {
            next.value = "";
          }
          onChange(next);
        }}
        value={condition.operator}
      >
        <SelectTrigger className="h-7 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((operator) => (
            <SelectItem className="text-xs" key={operator} value={operator}>
              {CONDITION_OPERATOR_LABELS[operator]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ComparisonValueInput
        arity={arity}
        condition={condition}
        onChange={onChange}
      />
    </>
  );
}

function ComparisonValueInput({
  arity,
  condition,
  onChange,
}: {
  arity: ValueArity;
  condition: ComparisonCondition;
  onChange: (condition: Condition) => void;
}) {
  if (arity === "none") return null;

  if (arity === "multi") {
    return (
      <Textarea
        className="min-h-20 basis-full resize-none font-mono text-xs"
        onChange={(event) => {
          onChange({
            ...condition,
            value: event.target.value
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .join("\n"),
          });
        }}
        placeholder="Enter each expected value on its own line..."
        rows={3}
        value={condition.value}
      />
    );
  }

  return (
    <Input
      className="h-7 min-w-0 flex-1 basis-40 font-mono text-xs"
      onChange={(event) => {
        onChange({ ...condition, value: event.target.value });
      }}
      placeholder="Expected value..."
      value={condition.value}
    />
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
        <SelectTrigger className="h-7 min-w-0 flex-1 text-xs">
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
      <SelectTrigger className="h-7 min-w-0 flex-1 text-xs">
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
