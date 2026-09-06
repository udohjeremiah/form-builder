/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use client";

import type { ZodType } from "zod";

import {
  type AnyFieldApi,
  type AnyFormApi,
  useField,
  useForm,
  useSelector,
} from "@tanstack/react-form";
import { PlusIcon, Settings2Icon, XIcon } from "lucide-react";
import { Fragment, type ReactNode, useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Combobox,
  ComboboxChip,
  ComboboxChips,
  ComboboxChipsInput,
  ComboboxCollection,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxGroup,
  ComboboxItem,
  ComboboxLabel,
  ComboboxList,
  ComboboxSeparator,
  ComboboxValue,
  useComboboxAnchor,
} from "@/components/ui/combobox";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@/components/ui/empty";
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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

import type {
  AnyFieldDefinition,
  ConditionGroup,
  FieldLogic,
  FieldRule,
  SectionAttributes,
  StepAttributes,
} from "../index";

import { buildFieldSchema, buildStructureSchema } from "../schema";
import {
  AUTOCOMPLETE_OPTIONS,
  CONDITION_OPERATOR_LABELS,
  getFieldEntry,
  getOperatorsForType,
  isMultiValueOperator,
  isPresenceOperator,
} from "./field-registry";
import {
  getStructureAttributes,
  type StructureAttributeMeta,
  type StructurePosition,
} from "./structure-registry";

type EffectKey = keyof FieldLogic;

const CONDITION_EFFECTS: { label: string; value: EffectKey }[] = [
  { label: "Show field", value: "show" },
  { label: "Hide field", value: "hide" },
  { label: "Disable field", value: "disable" },
];

const NEW_RULE: FieldRule = { fieldId: "", operator: "not_empty" };

const ConditionEditor = ({
  allFields,
  excludeFieldId,
  group,
  onChange,
}: {
  allFields?: AnyFieldDefinition[];
  excludeFieldId: string;
  group: ConditionGroup;
  onChange: (group: ConditionGroup) => void;
}) => {
  const updateRule = (index: number, patch: Partial<FieldRule>) => {
    onChange({
      ...group,
      rules: group.rules.map((rule, ruleIndex) =>
        ruleIndex === index ? { ...rule, ...patch } : rule,
      ),
    });
  };

  const removeRule = (index: number) => {
    onChange({
      ...group,
      rules: group.rules.filter((_, ruleIndex) => ruleIndex !== index),
    });
  };

  return (
    <div className="space-y-2 rounded-lg border border-border/60 bg-muted/50 p-2.5">
      <Field>
        <FieldLabel>Match</FieldLabel>
        <FieldContent>
          <Select
            onValueChange={(v) => {
              if (!v) return;
              onChange({ ...group, combinator: v });
            }}
            value={group.combinator}
          >
            <SelectTrigger className="h-7 w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem className="text-xs" value="and">
                All conditions
              </SelectItem>
              <SelectItem className="text-xs" value="or">
                Any condition
              </SelectItem>
            </SelectContent>
          </Select>
        </FieldContent>
      </Field>

      {group.rules.length === 0 && (
        <Empty className="border border-dashed">
          <EmptyHeader>
            <EmptyDescription>
              No conditions yet. Add one below.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {group.rules.map((rule, index) => {
        const targetField = allFields?.find((f) => f.id === rule.fieldId);
        const operators = getOperatorsForType(targetField?.type ?? "text");

        return (
          <div key={index}>
            {index > 0 && (
              <div className="flex items-center gap-2 py-1.5">
                <span className="h-px flex-1 bg-border/70" />
                <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] tracking-wide text-muted-foreground/60 uppercase">
                  {group.combinator === "or" ? "or" : "and"}
                </span>
                <span className="h-px flex-1 bg-border/70" />
              </div>
            )}

            <div className="space-y-1.5 rounded-md border border-border/50 bg-background/60 p-2">
              <div className="flex items-center gap-1.5">
                <Select
                  onValueChange={(v) => {
                    if (!v) return;
                    const next: Partial<FieldRule> = { fieldId: v };
                    const target = allFields?.find((f) => f.id === v);
                    if (
                      target &&
                      !getOperatorsForType(target.type).includes(rule.operator)
                    ) {
                      next.operator = getOperatorsForType(target.type)[0];
                    }
                    updateRule(index, next);
                  }}
                  value={rule.fieldId}
                >
                  <SelectTrigger className="h-7 flex-1 text-xs">
                    <SelectValue placeholder="Select a field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allFields
                      ?.filter((f) => f.id !== excludeFieldId)
                      .map((f) => (
                        <SelectItem className="text-xs" key={f.id} value={f.id}>
                          {f.attributes.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => {
                    removeRule(index);
                  }}
                  size="icon-xs"
                  title="Remove condition"
                  variant="destructive"
                >
                  <XIcon className="size-3" />
                </Button>
              </div>

              {rule.fieldId.trim().length === 0 && (
                <FieldError errors={[{ message: "Select a field" }]} />
              )}

              <Select
                onValueChange={(v) => {
                  if (!v) return;
                  updateRule(index, { operator: v });
                }}
                value={rule.operator}
              >
                <SelectTrigger className="h-7 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((operator) => (
                    <SelectItem
                      className="text-xs"
                      key={operator}
                      value={operator}
                    >
                      {CONDITION_OPERATOR_LABELS[operator]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <RuleValueInput
                index={index}
                rule={rule}
                updateRule={updateRule}
              />

              {!isPresenceOperator(rule.operator) &&
                (rule.value ?? "").trim().length === 0 && (
                  <FieldError
                    errors={[{ message: "Expected value is required" }]}
                  />
                )}
            </div>
          </div>
        );
      })}

      <Button
        className="w-full"
        onClick={() => {
          onChange({ ...group, rules: [...group.rules, { ...NEW_RULE }] });
        }}
        size="xs"
        variant="outline"
      >
        <PlusIcon /> Add condition
      </Button>
    </div>
  );
};

const RuleValueInput = ({
  index,
  rule,
  updateRule,
}: {
  index: number;
  rule: FieldRule;
  updateRule: (index: number, patch: Partial<FieldRule>) => void;
}) => {
  if (isPresenceOperator(rule.operator)) return null;

  if (isMultiValueOperator(rule.operator)) {
    return (
      <RuleMultiValueInput
        onChange={(value) => {
          updateRule(index, { value });
        }}
        reseedKey={`${rule.fieldId}:${rule.operator}`}
        value={rule.value ?? ""}
      />
    );
  }

  return (
    <Input
      className="h-7 font-mono text-xs"
      onChange={(event) => {
        updateRule(index, { value: event.target.value });
      }}
      placeholder="Expected value..."
      value={rule.value ?? ""}
    />
  );
};

const RuleMultiValueInput = ({
  onChange,
  reseedKey,
  value,
}: {
  onChange: (value: string) => void;
  reseedKey: string;
  value: string;
}) => {
  // Commit on blur rather than every keystroke: committing live strips the
  // trailing blank line just created with Enter (the model drops empty lines),
  // so a new line would vanish. The draft keeps the raw text locally and the
  // cleaned list is committed on blur. Re-mounting per field+operator reseeds
  // it when the referenced field or operator changes.
  const [draft, setDraft] = useState(() => value);

  return (
    <Textarea
      className="max-h-32 basis-full resize-none overflow-y-auto font-mono text-xs"
      key={reseedKey}
      onBlur={() => {
        onChange(
          draft
            .split("\n")
            .filter((line) => line.trim().length > 0)
            .join("\n"),
        );
      }}
      onChange={(event) => {
        setDraft(event.target.value);
      }}
      placeholder="Enter each expected value on its own line..."
      value={draft}
    />
  );
};

const parseNumberInput = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

type FieldAttributeValues = Record<
  string,
  boolean | number | string | string[] | undefined
>;

const invalid = (field: AnyFieldApi): boolean =>
  field.state.meta.isTouched && !field.state.meta.isValid;

const AttributeField = ({
  children,
  field,
  label,
}: {
  children: ReactNode;
  field: AnyFieldApi;
  label: string;
}) => (
  <Field data-invalid={invalid(field) || undefined}>
    <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
    <FieldContent>
      {children}
      {invalid(field) && <FieldError errors={field.state.meta.errors} />}
    </FieldContent>
  </Field>
);

const StructureAttribute = ({
  form,
  meta,
}: {
  form: AnyFormApi;
  meta: StructureAttributeMeta;
}) => {
  const field = useField({ form, name: meta.key });

  return (
    <Field data-invalid={invalid(field) || undefined}>
      <FieldLabel htmlFor={field.name}>{meta.label}</FieldLabel>
      <FieldContent>
        {meta.kind === "multiline" ? (
          <Textarea
            className="h-32 resize-none overflow-y-auto font-mono text-xs"
            id={field.name}
            onBlur={field.handleBlur}
            onChange={(event) => {
              field.handleChange(event.target.value);
            }}
            placeholder={meta.placeholder}
            value={String(field.state.value ?? "")}
          />
        ) : (
          <Input
            id={field.name}
            onBlur={field.handleBlur}
            onChange={(event) => {
              field.handleChange(event.target.value);
            }}
            placeholder={meta.placeholder}
            value={String(field.state.value ?? "")}
          />
        )}
        {invalid(field) && <FieldError errors={field.state.meta.errors} />}
      </FieldContent>
    </Field>
  );
};

const structurePosition = (node: StructureNode): StructurePosition =>
  node.kind === "step"
    ? {
        isFirstStep: node.index === 0,
        isLastStep: node.index === node.stepCount - 1,
      }
    : { isFirstStep: false, isLastStep: false };

const structureAttributesFor = (node: StructureNode) =>
  getStructureAttributes(node.kind, structurePosition(node));

export type StructureNode =
  | { attributes: SectionAttributes; id: string; kind: "section" }
  | {
      attributes: StepAttributes;
      id: string;
      index: number;
      kind: "step";
      stepCount: number;
    };

type FieldPropertiesSelection =
  | { field: AnyFieldDefinition | null; kind: "field" }
  | { kind: "structure"; node: StructureNode };

const emptyToUndefined = (value: string | undefined) =>
  value === "" ? undefined : value;

const NumberAttribute = ({
  form,
  label,
  name,
}: {
  form: AnyFormApi;
  label: string;
  name: string;
}) => {
  // Typing is kept in a local draft and committed on blur so partial input
  // ("-", "1.") never mutates the attribute. Re-mounting per selected field
  // reseeds the draft, and the committed value drives TanStack validation.
  const field = useField({ form, name });
  const [draft, setDraft] = useState(() =>
    field.state.value === undefined ? "" : String(field.state.value),
  );

  return (
    <AttributeField field={field} label={label}>
      <Input
        id={field.name}
        onBlur={() => {
          field.handleChange(parseNumberInput(draft));
          field.handleBlur();
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        type="number"
        value={draft}
      />
    </AttributeField>
  );
};

const TextAttribute = ({
  form,
  label,
  name,
  placeholder,
}: {
  form: AnyFormApi;
  label: string;
  name: string;
  placeholder?: string;
}) => {
  const field = useField({ form, name });

  return (
    <AttributeField field={field} label={label}>
      <Input
        id={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(
            event.target.value === "" ? undefined : event.target.value,
          );
        }}
        placeholder={placeholder}
        type="text"
        value={field.state.value ?? ""}
      />
    </AttributeField>
  );
};

const LinesAttribute = ({
  form,
  label,
  name,
  placeholder,
}: {
  form: AnyFormApi;
  label: string;
  name: string;
  placeholder?: string;
}) => {
  // Like the number attrs, lines commit on blur: stripping blanks live would
  // eat the trailing line Enter just created, so the raw draft is cleaned and
  // committed only once focus leaves.
  const field = useField({ form, name });
  const [draft, setDraft] = useState(() =>
    Array.isArray(field.state.value) ? field.state.value.join("\n") : "",
  );

  return (
    <AttributeField field={field} label={label}>
      <Textarea
        className="h-32 resize-none overflow-y-auto font-mono text-xs"
        id={field.name}
        onBlur={() => {
          field.handleChange(
            draft.split("\n").filter((line) => line.length > 0),
          );
          field.handleBlur();
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        placeholder={placeholder}
        value={draft}
      />
    </AttributeField>
  );
};

type AttributeOptionGroup = readonly {
  readonly label: string;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}[];

const BooleanAttribute = ({
  form,
  label,
  name,
}: {
  form: AnyFormApi;
  label: string;
  name: string;
}) => {
  const field = useField({ form, name });

  return (
    <AttributeField field={field} label={label}>
      <Select
        onValueChange={(v) => {
          if (!v) return;
          field.handleChange(v === "yes");
        }}
        value={field.state.value ? "yes" : "no"}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem className="text-xs" value="yes">
            Yes
          </SelectItem>
          <SelectItem className="text-xs" value="no">
            No
          </SelectItem>
        </SelectContent>
      </Select>
    </AttributeField>
  );
};

const AutocompleteAttribute = ({
  form,
  label,
  name,
}: {
  form: AnyFormApi;
  label: string;
  name: string;
}) => {
  const field = useField({ form, name });

  return (
    <AttributeField field={field} label={label}>
      <Select
        onValueChange={(v) => {
          field.handleChange(v == null || v === "off" ? undefined : v);
        }}
        value={field.state.value ?? "off"}
      >
        <SelectTrigger className="h-7 w-full text-xs">
          <SelectValue placeholder="Off" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem className="text-xs" value="off">
            Off
          </SelectItem>
          {AUTOCOMPLETE_OPTIONS.map((group) => (
            <SelectGroup key={group.label}>
              <SelectLabel className="text-[10px]">{group.label}</SelectLabel>
              {group.options.map((option) => (
                <SelectItem
                  className="text-xs"
                  key={option.value}
                  value={option.value}
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </AttributeField>
  );
};

const MultiSelectAttribute = ({
  form,
  label,
  name,
  options,
}: {
  form: AnyFormApi;
  label: string;
  name: string;
  options: AttributeOptionGroup;
}) => {
  const anchor = useComboboxAnchor();
  const field = useField({ form, name });

  return (
    <AttributeField field={field} label={label}>
      <Combobox
        autoHighlight={true}
        items={options}
        multiple={true}
        onValueChange={field.handleChange}
      >
        <ComboboxChips
          className="w-full min-w-0"
          onBlur={field.handleBlur}
          ref={anchor}
        >
          <ComboboxValue>
            {(values: string[]) => (
              <Fragment>
                {values.map((innerValue: string) => (
                  <ComboboxChip className="max-w-full min-w-0" key={innerValue}>
                    <span className="max-w-40 min-w-0 truncate">
                      {innerValue}
                    </span>
                  </ComboboxChip>
                ))}
                <ComboboxChipsInput />
              </Fragment>
            )}
          </ComboboxValue>
        </ComboboxChips>
        <ComboboxContent anchor={anchor}>
          <ComboboxEmpty>No items found.</ComboboxEmpty>
          <ComboboxList>
            {(group: (typeof options)[number], index) => (
              <ComboboxGroup items={group.options} key={group.label}>
                <ComboboxLabel>{group.label}</ComboboxLabel>
                <ComboboxCollection>
                  {(item: (typeof options)[number]["options"][number]) => (
                    <ComboboxItem key={item.value} value={item.value}>
                      {item.label}
                    </ComboboxItem>
                  )}
                </ComboboxCollection>
                {index < options.length - 1 && <ComboboxSeparator />}
              </ComboboxGroup>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </AttributeField>
  );
};

const DateTimeAttribute = ({
  form,
  inputType,
  label,
  name,
}: {
  form: AnyFormApi;
  inputType: string;
  label: string;
  name: string;
}) => {
  const field = useField({ form, name });

  return (
    <AttributeField field={field} label={label}>
      <Input
        id={field.name}
        onBlur={field.handleBlur}
        onChange={(event) => {
          field.handleChange(
            event.target.value === "" ? undefined : event.target.value,
          );
        }}
        type={inputType}
        value={field.state.value ?? ""}
      />
    </AttributeField>
  );
};

export function FieldProperties({
  allFields,
  isMobile,
  onChange,
  onStructureChange,
  selection,
}: {
  allFields?: AnyFieldDefinition[];
  isMobile?: boolean;
  onChange: (
    id: string,
    updater: (field: AnyFieldDefinition) => AnyFieldDefinition,
  ) => void;
  onStructureChange: (
    id: string,
    patch: SectionAttributes | StepAttributes,
  ) => void;
  selection: FieldPropertiesSelection;
}) {
  const defaultValues: FieldAttributeValues =
    selection.kind === "field"
      ? ((selection.field?.attributes ?? {}) as unknown as FieldAttributeValues)
      : (selection.node.attributes as unknown as FieldAttributeValues);

  let schema: undefined | ZodType;
  if (selection.kind === "structure") {
    schema = buildStructureSchema(
      selection.node.kind,
      structurePosition(selection.node),
    );
  } else if (selection.field) {
    schema = buildFieldSchema(selection.field);
  }

  const form = useForm({
    defaultValues,
    validators: schema
      ? ({
          onBlur: schema,
          onChange: schema,
          onSubmit: schema,
        } as never)
      : undefined,
  });

  const values = useSelector(form.store, (state) => state.values);
  const firstRun = useRef(true);
  const latest = useRef({ onChange, onStructureChange, selection });

  useEffect(() => {
    latest.current = { onChange, onStructureChange, selection };
  }, [onChange, onStructureChange, selection]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }

    const current = latest.current;
    if (current.selection.kind === "field") {
      const field = current.selection.field;
      if (!field) return;
      current.onChange(field.id, (existing) => ({
        ...existing,
        attributes: values as unknown as (typeof existing)["attributes"],
      }));
      return;
    }

    const node = current.selection.node;
    const attributes: Partial<Record<string, string | undefined>> = {};

    for (const meta of structureAttributesFor(node)) {
      attributes[meta.key] = emptyToUndefined(
        values[meta.key] as string | undefined,
      );
    }
    current.onStructureChange(node.id, attributes);
  }, [values]);

  if (selection.kind === "structure") {
    const node = selection.node;

    return (
      <div
        className={cn(
          isMobile ? "w-full" : "w-full min-w-0 md:w-[40%]",
          "overflow-y-auto border-l border-border bg-background p-4",
        )}
        key={node.id}
      >
        <div className="mb-4 flex items-center justify-between">
          <span className="truncate font-mono text-xs text-foreground/70">
            {node.id}
          </span>
          <Badge className="text-[9px] uppercase" variant="secondary">
            {node.kind}
          </Badge>
        </div>

        <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Properties
        </h3>

        <div className="space-y-3">
          {structureAttributesFor(node).map((meta) => (
            <StructureAttribute form={form} key={meta.key} meta={meta} />
          ))}
        </div>
      </div>
    );
  }

  if (!selection.field) {
    return (
      <div
        className={cn(
          isMobile ? "w-full" : "w-full min-w-0 md:w-[40%]",
          "flex h-full items-stretch justify-center border-l border-border bg-background p-6",
        )}
      >
        <Empty>
          <EmptyMedia variant="icon">
            <Settings2Icon className="size-5" />
          </EmptyMedia>
          <EmptyHeader>
            <EmptyDescription>Select a field to edit</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </div>
    );
  }

  const field = selection.field;

  const entry = getFieldEntry(field.type);

  const setLogic = (logic: FieldLogic) => {
    onChange(field.id, () => ({ ...field, logic }));
  };

  const activeEffect =
    CONDITION_EFFECTS.find((effect) => field.logic[effect.value])?.value ??
    "show";
  const activeGroup: ConditionGroup | undefined = field.logic[activeEffect];

  const updateGroup = (
    transform: (group: ConditionGroup) => ConditionGroup,
  ) => {
    if (!activeGroup) return;
    setLogic({
      ...field.logic,
      [activeEffect]: transform(activeGroup),
    });
  };

  return (
    <div
      className={cn(
        isMobile ? "w-full" : "w-full min-w-0 md:w-[40%]",
        "overflow-y-auto border-l border-border bg-background p-4",
      )}
      key={field.id}
    >
      <div className="mb-4 flex items-center justify-between">
        <span className="truncate font-mono text-xs text-foreground/70">
          {field.id}
        </span>
        <Badge className="text-[9px] uppercase" variant="secondary">
          {field.type}
        </Badge>
      </div>
      <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
        Properties
      </h3>
      <div className="space-y-3">
        <form.Field name="label">
          {(labelField) => (
            <Field data-invalid={invalid(labelField) || undefined}>
              <FieldLabel htmlFor={labelField.name}>Label</FieldLabel>
              <FieldContent>
                <Input
                  id={labelField.name}
                  onBlur={labelField.handleBlur}
                  onChange={(event) => {
                    labelField.handleChange(event.target.value);
                  }}
                  value={String(labelField.state.value ?? "")}
                />
                {invalid(labelField) && (
                  <FieldError errors={labelField.state.meta.errors} />
                )}
              </FieldContent>
            </Field>
          )}
        </form.Field>
        <form.Field name="description">
          {(descriptionField) => (
            <Field>
              <FieldLabel htmlFor={descriptionField.name}>
                Description
              </FieldLabel>
              <FieldContent>
                <Input
                  id={descriptionField.name}
                  onChange={(event) => {
                    descriptionField.handleChange(
                      event.target.value === ""
                        ? undefined
                        : event.target.value,
                    );
                  }}
                  placeholder="Additional context for the user"
                  value={String(descriptionField.state.value ?? "")}
                />
              </FieldContent>
            </Field>
          )}
        </form.Field>
        <form.Field name="placeholder">
          {(placeholderField) => (
            <Field data-invalid={invalid(placeholderField) || undefined}>
              <FieldLabel htmlFor={placeholderField.name}>
                Placeholder
              </FieldLabel>
              <FieldContent>
                <Input
                  id={placeholderField.name}
                  onBlur={placeholderField.handleBlur}
                  onChange={(event) => {
                    placeholderField.handleChange(event.target.value);
                  }}
                  value={String(placeholderField.state.value ?? "")}
                />
                {invalid(placeholderField) && (
                  <FieldError errors={placeholderField.state.meta.errors} />
                )}
              </FieldContent>
            </Field>
          )}
        </form.Field>

        <form.Field name="required">
          {(requiredField) => (
            <Field>
              <FieldLabel htmlFor={requiredField.name}>Required</FieldLabel>
              <FieldContent>
                <Select
                  onValueChange={(v) => {
                    if (!v) return;
                    requiredField.handleChange(v === "yes");
                  }}
                  value={requiredField.state.value ? "yes" : "no"}
                >
                  <SelectTrigger className="h-7 w-full text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem className="text-xs" value="yes">
                      Yes
                    </SelectItem>
                    <SelectItem className="text-xs" value="no">
                      No
                    </SelectItem>
                  </SelectContent>
                </Select>
              </FieldContent>
            </Field>
          )}
        </form.Field>

        {entry.attributes.length > 0 && (
          <>
            <Separator className="my-3" />
            <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              Attributes
            </h3>
          </>
        )}

        {entry.attributes.map((meta) => {
          const name = String(meta.key);

          if (meta.kind === "boolean") {
            return (
              <BooleanAttribute
                form={form}
                key={name}
                label={meta.label}
                name={name}
              />
            );
          }

          if (meta.kind === "autocomplete") {
            return (
              <AutocompleteAttribute
                form={form}
                key={name}
                label={meta.label}
                name={name}
              />
            );
          }

          if (meta.kind === "multi-select") {
            const multiOptions = (meta.options ?? []) as AttributeOptionGroup;
            return (
              <MultiSelectAttribute
                form={form}
                key={name}
                label={meta.label}
                name={name}
                options={multiOptions}
              />
            );
          }

          if (meta.kind === "datetime") {
            return (
              <DateTimeAttribute
                form={form}
                inputType={meta.inputType ?? "text"}
                key={name}
                label={meta.label}
                name={name}
              />
            );
          }

          if (meta.kind === "lines") {
            return (
              <LinesAttribute
                form={form}
                key={name}
                label={meta.label}
                name={name}
                placeholder={meta.placeholder}
              />
            );
          }

          if (meta.kind === "number") {
            return (
              <NumberAttribute
                form={form}
                key={name}
                label={meta.label}
                name={name}
              />
            );
          }

          return (
            <TextAttribute
              form={form}
              key={name}
              label={meta.label}
              name={name}
              placeholder={meta.placeholder}
            />
          );
        })}

        <Separator className="my-3" />

        <div>
          <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
            Behavior
          </h3>

          <Field className="mb-2">
            <FieldLabel>Conditionally</FieldLabel>
            <FieldContent>
              <Select
                onValueChange={(v) => {
                  if (!v) return;
                  if (v === "yes") {
                    setLogic({
                      ...field.logic,
                      [activeEffect]: { combinator: "and", rules: [] },
                    });
                    return;
                  }
                  // Disabling conditioning clears every effect.
                  setLogic({});
                }}
                value={activeGroup ? "yes" : "no"}
              >
                <SelectTrigger className="h-7 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem className="text-xs" value="yes">
                    Yes
                  </SelectItem>
                  <SelectItem className="text-xs" value="no">
                    No
                  </SelectItem>
                </SelectContent>
              </Select>
            </FieldContent>
          </Field>
          {!!activeGroup && (
            <>
              <Field className="mb-2">
                <FieldLabel>Effect</FieldLabel>
                <FieldContent>
                  <Select
                    onValueChange={(v) => {
                      if (!v || v === activeEffect) return;
                      const { [activeEffect]: moved, ...rest } = field.logic;
                      setLogic(moved ? { ...rest, [v]: moved } : rest);
                    }}
                    value={activeEffect}
                  >
                    <SelectTrigger className="h-7 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_EFFECTS.map((effect) => (
                        <SelectItem
                          className="text-xs"
                          key={effect.value}
                          value={effect.value}
                        >
                          {effect.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FieldContent>
              </Field>
              <ConditionEditor
                allFields={allFields}
                excludeFieldId={field.id}
                group={activeGroup}
                onChange={(next) => {
                  updateGroup(() => next);
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
