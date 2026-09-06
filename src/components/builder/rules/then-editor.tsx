/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
"use client";

import { useField, useSelector } from "@tanstack/react-form";
import { PlusIcon, XIcon } from "lucide-react";
import { useMemo } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
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

import type { Duration } from "../index";

import {
  DURATION_UNIT_LABELS,
  DURATION_UNIT_LIST,
  RULE_STATUS_LABELS,
  RULE_STATUS_LIST,
  type RuleFormHandle,
} from "./rule-definition";

const parseNumber = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function ThenEditor({ form }: { form: RuleFormHandle }) {
  // Hoisted so the nested deadline renders below stay reactive to the
  // outcome shape (deadline is conditionally present).
  const outcome = useSelector(form.store, (state) => state.values.outcome);

  const status = useField({ form, name: "outcome.status" });
  const reason = useField({ form, name: "outcome.adminReason" });
  const action = useField({ form, name: "outcome.studentAction" });

  const color = useMemo(() => generateColor("then"), []);

  return (
    <div
      className="border-s-4 bg-background/40 p-2"
      style={{ borderInlineStartColor: color }}
    >
      <Field className="pb-5">
        <FieldLabel>Status</FieldLabel>
        <FieldContent>
          <Select
            onValueChange={(value) => {
              if (value) status.handleChange(value);
            }}
            value={status.state.value as string}
          >
            <SelectTrigger
              className="h-8 w-full text-[13px]"
              onBlur={status.handleBlur}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_STATUS_LIST.map((value) => (
                <SelectItem className="text-[13px]" key={value} value={value}>
                  {RULE_STATUS_LABELS[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      <Field
        className="pb-5"
        data-invalid={
          (reason.state.meta.isTouched && !reason.state.meta.isValid) ||
          undefined
        }
      >
        <FieldLabel>Admin reason</FieldLabel>
        <FieldContent>
          <Textarea
            className="max-h-40 resize-none overflow-y-auto text-xs"
            onBlur={reason.handleBlur}
            onChange={(event) => {
              reason.handleChange(event.target.value);
            }}
            placeholder="Why this outcome applies..."
            value={reason.state.value as string}
          />
          {reason.state.meta.isTouched && !reason.state.meta.isValid && (
            <FieldError errors={reason.state.meta.errors} />
          )}
        </FieldContent>
      </Field>

      <Field className="pb-5">
        <FieldLabel>Student action</FieldLabel>
        <FieldContent>
          <Input
            onChange={(event) => {
              action.handleChange(
                event.target.value === "" ? undefined : event.target.value,
              );
            }}
            placeholder="What the student should do next..."
            value={action.state.value as string}
          />
        </FieldContent>
      </Field>

      <Field className="pb-5">
        <FieldLabel className="justify-between">
          Deadline
          {outcome.deadline && (
            <Button
              onClick={() => {
                form.setFieldValue("outcome", {
                  adminReason: outcome.adminReason,
                  status: outcome.status,
                  studentAction: outcome.studentAction,
                });
              }}
              size="icon-xs"
              title="Remove deadline"
              variant="destructive"
            >
              <XIcon className="size-3" />
            </Button>
          )}
        </FieldLabel>
        <FieldContent>
          {outcome.deadline ? (
            <DeadlineEditor form={form} />
          ) : (
            <Button
              className="w-full border-dashed text-xs"
              onClick={() => {
                form.setFieldValue("outcome.deadline", {
                  amount: 1,
                  unit: "week",
                });
              }}
              size="xs"
              variant="outline"
            >
              <PlusIcon /> Add deadline
            </Button>
          )}
        </FieldContent>
      </Field>
    </div>
  );
}

function DeadlineEditor({ form }: { form: RuleFormHandle }) {
  const amount = useField({ form, name: "outcome.deadline.amount" });
  const unit = useField({ form, name: "outcome.deadline.unit" });

  return (
    <div className="flex gap-1.5">
      <Input
        className="h-8 w-20 text-[13px]"
        min={0}
        onChange={(event) => {
          amount.handleChange(
            Math.max(0, parseNumber(event.target.value) ?? 0),
          );
        }}
        placeholder="0"
        type="number"
        value={(amount.state.value as number | undefined) ?? 0}
      />
      <Select
        onValueChange={(value) => {
          if (value) unit.handleChange(value);
        }}
        value={unit.state.value as Duration["unit"]}
      >
        <SelectTrigger
          className="h-8 flex-1 text-[13px]"
          onBlur={unit.handleBlur}
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {DURATION_UNIT_LIST.map((value) => (
            <SelectItem className="text-[13px]" key={value} value={value}>
              {DURATION_UNIT_LABELS[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
