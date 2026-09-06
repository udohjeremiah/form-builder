"use client";

import { useField, useForm, useSelector } from "@tanstack/react-form";
import { ChevronLeftIcon, Trash2Icon } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { generateColor } from "@/lib/generate-color";

import type { AnyFieldDefinition, RuleDefinition } from "../index";

import { ruleFormSchema } from "../schema";
import {
  newGroupCondition,
  type RuleFormHandle,
  type RuleFormValues,
} from "./rule-definition";
import { ThenEditor } from "./then-editor";
import { WhenEditor } from "./when-editor";

export function RuleEditor({
  allFields,
  onBack,
  onChange,
  onDelete,
  rule,
}: {
  allFields: AnyFieldDefinition[];
  onBack: () => void;
  onChange: (rule: RuleDefinition) => void;
  onDelete: () => void;
  rule: RuleDefinition;
}) {
  const defaultValues: RuleFormValues = {
    area: rule.area,
    condition:
      rule.condition.type === "group" ? rule.condition : newGroupCondition(),
    outcome: rule.outcome,
  };
  const form = useForm({
    defaultValues,
    validators: {
      onBlur: ruleFormSchema,
      onChange: ruleFormSchema,
      onSubmit: ruleFormSchema,
    } as never,
  });

  const values = useSelector(form.store, (state) => state.values);

  // Peer-sync: commit changes back to builder context. The latest
  // `onChange`/`rule` closures are mirrored into a ref inside an effect (refs
  // must not be written during render), while `firstRun` skips the reseed
  // render so an externally updated rule does not ping-pong back.
  const latest = useRef({ onChange, rule });
  useEffect(() => {
    latest.current = { onChange, rule };
  }, [onChange, rule]);

  const firstRun = useRef(true);
  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    latest.current.onChange({ ...latest.current.rule, ...values });
  }, [values]);

  const color = useMemo(() => generateColor("rule"), []);

  const rulesForm: RuleFormHandle = form;

  const area = useField({ form: rulesForm, name: "area" });

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <Button onClick={onBack} size="xs" variant="outline">
          <ChevronLeftIcon className="size-3" />
          Back to rules
        </Button>
        <Button onClick={onDelete} size="xs" variant="destructive">
          <Trash2Icon className="size-3" />
          Delete rule
        </Button>
      </div>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
            Rule
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {rule.id}
          </span>
        </div>
        <div
          className="space-y-3 border-s-4 bg-background/40 p-2"
          style={{ borderInlineStartColor: color }}
        >
          <Field
            data-invalid={
              (area.state.meta.isTouched && !area.state.meta.isValid) ||
              undefined
            }
          >
            <FieldLabel>Area</FieldLabel>
            <FieldContent>
              <Input
                onBlur={area.handleBlur}
                onChange={(event) => {
                  area.handleChange(event.target.value);
                }}
                placeholder="Domain category this rule belongs to..."
                value={area.state.value as string}
              />
              {area.state.meta.isTouched && !area.state.meta.isValid && (
                <FieldError errors={area.state.meta.errors} />
              )}
            </FieldContent>
          </Field>
        </div>
      </section>
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          When
        </h3>
        <WhenEditor allFields={allFields} form={rulesForm} />
      </section>
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Then
        </h3>
        <ThenEditor form={rulesForm} />
      </section>
    </div>
  );
}
