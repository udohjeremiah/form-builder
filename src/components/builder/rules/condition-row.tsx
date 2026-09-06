"use client";

import { type AnyFieldApi, useField } from "@tanstack/react-form";
import { XIcon } from "lucide-react";
import { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";
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

import type {
  AnyFieldDefinition,
  ComparisonCondition,
  Condition,
  ConditionOperator,
  ExistsCondition,
} from "../index";

import {
  CONDITION_OPERATOR_LABELS,
  getOperatorsForType,
  isMultiValueOperator,
  isPresenceOperator,
} from "../operators";
import {
  newComparisonCondition,
  newExistsCondition,
  newReviewCondition,
  type RuleFormHandle,
} from "./rule-definition";

const arityOf = (operator: ConditionOperator): ValueArity => {
  if (isPresenceOperator(operator)) return "none";
  if (isMultiValueOperator(operator)) return "multi";
  return "single";
};

const CONDITION_TYPES: { label: string; value: Condition["type"] }[] = [
  { label: "Comparison", value: "comparison" },
  { label: "Exists", value: "exists" },
  { label: "Review", value: "review" },
];

type ValueArity = "multi" | "none" | "single";

export function ConditionRow({
  allFields,
  condition,
  form,
  nodeName,
  onChange,
  onRemove,
}: {
  allFields: AnyFieldDefinition[];
  condition: Condition;
  form: RuleFormHandle;
  nodeName: string;
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
          <SelectTrigger className="h-7 w-full text-xs md:min-w-0 md:flex-1">
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
            form={form}
            nodeName={nodeName}
            onChange={onChange}
          />
        )}
        {condition.type === "exists" && (
          <ExistsEditor
            allFields={allFields}
            condition={condition}
            form={form}
            nodeName={nodeName}
            onChange={onChange}
          />
        )}
        {condition.type === "review" && (
          <ReviewNoteEditor form={form} nodeName={nodeName} />
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
  form,
  nodeName,
  onChange,
}: {
  allFields: AnyFieldDefinition[];
  condition: ComparisonCondition;
  form: RuleFormHandle;
  nodeName: string;
  onChange: (condition: Condition) => void;
}) {
  const field = useField({ form, name: `${nodeName}.field` });
  const value = useField({ form, name: `${nodeName}.value` });

  const selectedField = allFields.find((item) => item.id === condition.field);
  const fieldType = selectedField?.type ?? "text";
  const operators = getOperatorsForType(fieldType);
  const arity = arityOf(condition.operator);

  return (
    <>
      <div className="w-full space-y-0.5 md:min-w-0 md:flex-1">
        <FieldSelect
          allFields={allFields}
          onBlur={field.handleBlur}
          onChange={(fieldId) => {
            const next: ComparisonCondition = { ...condition, field: fieldId };
            const type =
              allFields.find((item) => item.id === fieldId)?.type ?? "text";
            const allowed = getOperatorsForType(type);

            if (!allowed.includes(next.operator)) {
              next.operator = allowed[0] ?? next.operator;
              next.value = "";
            }

            onChange(next);
          }}
          value={field.state.value as string}
        />
        {field.state.meta.isTouched && !field.state.meta.isValid && (
          <FieldError errors={field.state.meta.errors} />
        )}
      </div>

      <Select
        onValueChange={(operatorValue) => {
          if (!operatorValue || operatorValue === condition.operator) return;

          const next: ComparisonCondition = {
            ...condition,
            operator: operatorValue,
          };

          if (arityOf(next.operator) !== arityOf(condition.operator)) {
            next.value = "";
          }

          onChange(next);
        }}
        value={condition.operator}
      >
        <SelectTrigger className="h-7 w-full text-xs md:flex-1">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {operators.map((item) => (
            <SelectItem className="text-xs" key={item} value={item}>
              {CONDITION_OPERATOR_LABELS[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <ComparisonValueInput
        arity={arity}
        condition={condition}
        form={form}
        nodeName={nodeName}
        valueField={value}
      />
    </>
  );
}

function ComparisonValueInput({
  arity,
  condition,
  form,
  nodeName,
  valueField,
}: {
  arity: ValueArity;
  condition: ComparisonCondition;
  form: RuleFormHandle;
  nodeName: string;
  valueField: AnyFieldApi;
}) {
  if (arity === "none") return null;

  if (arity === "multi") {
    return (
      <MultiValueTextarea
        form={form}
        key={`${condition.field}:${condition.operator}`}
        name={`${nodeName}.value`}
      />
    );
  }

  return (
    <>
      <Input
        className="h-7 w-full font-mono text-xs md:min-w-0 md:flex-1 md:basis-40"
        onBlur={valueField.handleBlur}
        onChange={(event) => {
          valueField.handleChange(event.target.value);
        }}
        placeholder="Expected value..."
        value={valueField.state.value as string}
      />
      {valueField.state.meta.isTouched && !valueField.state.meta.isValid && (
        <FieldError errors={valueField.state.meta.errors} />
      )}
    </>
  );
}

function ExistsEditor({
  allFields,
  condition,
  form,
  nodeName,
  onChange,
}: {
  allFields: AnyFieldDefinition[];
  condition: ExistsCondition;
  form: RuleFormHandle;
  nodeName: string;
  onChange: (condition: Condition) => void;
}) {
  const field = useField({ form, name: `${nodeName}.field` });

  return (
    <>
      <div className="w-full space-y-0.5 md:min-w-0 md:flex-1">
        <FieldSelect
          allFields={allFields}
          onBlur={field.handleBlur}
          onChange={(fieldId) => {
            onChange({ ...condition, field: fieldId });
          }}
          value={field.state.value as string}
        />
        {field.state.meta.isTouched && !field.state.meta.isValid && (
          <FieldError errors={field.state.meta.errors} />
        )}
      </div>
      <ExistsPresentEditor form={form} nodeName={nodeName} />
    </>
  );
}

function ExistsPresentEditor({
  form,
  nodeName,
}: {
  form: RuleFormHandle;
  nodeName: string;
}) {
  const present = useField({ form, name: `${nodeName}.present` });

  return (
    <Select
      onValueChange={(value) => {
        if (value) present.handleChange(value === "true");
      }}
      value={present.state.value === true ? "true" : "false"}
    >
      <SelectTrigger className="h-7 w-full text-xs md:min-w-0 md:flex-1">
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
  );
}

function FieldSelect({
  allFields,
  onBlur,
  onChange,
  value,
}: {
  allFields: AnyFieldDefinition[];
  onBlur: () => void;
  onChange: (fieldId: string) => void;
  value: string | undefined;
}) {
  return (
    <Select
      onValueChange={(fieldId) => {
        if (fieldId) onChange(fieldId);
      }}
      value={value ?? ""}
    >
      <SelectTrigger className="h-7 w-full text-xs" onBlur={onBlur}>
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

function MultiValueTextarea({
  form,
  name,
}: {
  form: RuleFormHandle;
  name: string;
}) {
  // Commit on blur rather than every keystroke: committing live strips the
  // trailing blank line just created with Enter (the model drops empty lines),
  // so a new line would vanish. The draft keeps the raw text locally and the
  // cleaned list is committed on blur. Re-mounting per field+operator reseeds
  // it when the referenced field or operator changes.
  const field = useField({ form, name });
  const [draft, setDraft] = useState(() =>
    typeof field.state.value === "string" ? field.state.value : "",
  );

  return (
    <div className="w-full basis-full space-y-0.5">
      <Textarea
        className="max-h-32 w-full basis-full resize-none overflow-y-auto font-mono text-xs"
        onBlur={() => {
          field.handleChange(
            draft
              .split("\n")
              .filter((line) => line.trim().length > 0)
              .join("\n"),
          );
          field.handleBlur();
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        placeholder="Enter each expected value on its own line..."
        value={draft}
      />
      {field.state.meta.isTouched && !field.state.meta.isValid && (
        <FieldError errors={field.state.meta.errors} />
      )}
    </div>
  );
}

function ReviewNoteEditor({
  form,
  nodeName,
}: {
  form: RuleFormHandle;
  nodeName: string;
}) {
  const note = useField({ form, name: `${nodeName}.note` });

  return (
    <Input
      className="h-7 w-full text-xs md:min-w-0 md:flex-1 md:basis-40"
      onChange={(event) => {
        note.handleChange(event.target.value);
      }}
      placeholder="Review instruction..."
      value={note.state.value as string}
    />
  );
}
