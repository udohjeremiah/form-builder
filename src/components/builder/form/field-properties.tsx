"use client";

import { PlusIcon, Settings2Icon, XIcon } from "lucide-react";
import { Fragment, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "../index";

import { OptionsValueInput } from "../options-value-input";
import {
  AUTOCOMPLETE_OPTIONS,
  CONDITION_OPERATOR_LABELS,
  getFieldEntry,
  getOperatorsForType,
  isMultiValueOperator,
  isPresenceOperator,
} from "./field-registry";
import { getActiveOptions } from "./form-definition";

type EffectKey = keyof FieldLogic;

const CONDITION_EFFECTS: { label: string; value: EffectKey }[] = [
  { label: "Show field", value: "show" },
  { label: "Hide field", value: "hide" },
  { label: "Disable field", value: "disable" },
];

const NEW_RULE: FieldRule = { fieldId: "", operator: "not_empty" };

/**
 * A self-contained condition builder that drives a single ConditionGroup.
 * The owning field can be excluded from the candidate field list via
 * `excludeFieldId` to avoid self-referential conditions.
 */
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
      <div className="space-y-1">
        <Label className="text-[10px] font-medium text-muted-foreground/60">
          Match
        </Label>
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
      </div>

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
        // Until a target field is chosen, offer the broadest (text-like)
        // operator set.
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
                field={allFields?.find((f) => f.id === rule.fieldId)}
                index={index}
                rule={rule}
                updateRule={updateRule}
              />
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

/**
 * The expected-value editor for a single field rule. Renders nothing for
 * presence operators, a one-per-line textarea for list operators, and a
 * single-line input otherwise.
 */
const RuleValueInput = ({
  field,
  index,
  rule,
  updateRule,
}: {
  field?: AnyFieldDefinition;
  index: number;
  rule: FieldRule;
  updateRule: (index: number, patch: Partial<FieldRule>) => void;
}) => {
  if (isPresenceOperator(rule.operator)) return null;

  const options = field ? getActiveOptions(field) : [];
  if (options.length > 0) {
    return (
      <OptionsValueInput
        fullWidth
        onChange={(value) => {
          updateRule(index, { value });
        }}
        operator={rule.operator}
        options={options}
        value={rule.value ?? ""}
      />
    );
  }

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

const NumberAttribute = ({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: number | undefined) => void;
  value: number | undefined;
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] font-medium text-muted-foreground/70">
      {label}
    </Label>
    <Input
      className="h-8 text-[13px]"
      onChange={(event) => {
        onValueChange(parseNumberInput(event.target.value));
      }}
      type="number"
      value={value ?? ""}
    />
  </div>
);

const TextAttribute = ({
  label,
  onValueChange,
  placeholder,
  value,
}: {
  label: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] font-medium text-muted-foreground/70">
      {label}
    </Label>
    <Input
      className="h-8 text-[13px]"
      onChange={(event) => {
        onValueChange(event.target.value);
      }}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  </div>
);

const LinesAttribute = ({
  label,
  onValueChange,
  placeholder,
  value,
}: {
  label: string;
  onValueChange: (value: string[]) => void;
  placeholder?: string;
  value: string[];
}) => {
  const [draft, setDraft] = useState(() => value.join("\n"));

  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground/70">
        {label}
      </Label>
      <Textarea
        className="h-32 resize-none overflow-y-auto font-mono text-xs"
        onBlur={() => {
          onValueChange(draft.split("\n").filter((line) => line.length > 0));
        }}
        onChange={(event) => {
          setDraft(event.target.value);
        }}
        placeholder={placeholder}
        value={draft}
      />
    </div>
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
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: boolean) => void;
  value: boolean | undefined;
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] font-medium text-muted-foreground/70">
      {label}
    </Label>
    <Select
      onValueChange={(v) => {
        if (!v) return;
        onValueChange(v === "yes");
      }}
      value={value ? "yes" : "no"}
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
  </div>
);

const AutocompleteAttribute = ({
  label,
  onValueChange,
  value,
}: {
  label: string;
  onValueChange: (value: string | undefined) => void;
  value: string | undefined;
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] font-medium text-muted-foreground/70">
      {label}
    </Label>
    <Select
      onValueChange={(v) => {
        onValueChange(v == null || v === "off" ? undefined : v);
      }}
      value={value ?? "off"}
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
  </div>
);

const MultiSelectAttribute = ({
  label,
  onValueChange,
  options,
}: {
  label: string;
  onValueChange: (value: string[]) => void;
  options: AttributeOptionGroup;
}) => {
  const anchor = useComboboxAnchor();

  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-muted-foreground/70">
        {label}
      </Label>
      <Combobox
        autoHighlight={true}
        items={options}
        multiple={true}
        onValueChange={onValueChange}
      >
        <ComboboxChips className="w-full min-w-0" ref={anchor}>
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
    </div>
  );
};

const DateTimeAttribute = ({
  inputType,
  label,
  onValueChange,
  value,
}: {
  inputType: string;
  label: string;
  onValueChange: (value: string | undefined) => void;
  value: string | undefined;
}) => (
  <div className="space-y-1">
    <Label className="text-[11px] font-medium text-muted-foreground/70">
      {label}
    </Label>
    <Input
      className="h-8 text-[13px]"
      onChange={(event) => {
        onValueChange(
          event.target.value === "" ? undefined : event.target.value,
        );
      }}
      type={inputType}
      value={value ?? ""}
    />
  </div>
);

export function FieldProperties({
  allFields,
  field,
  fullWidth,
  onChange,
}: {
  allFields?: AnyFieldDefinition[];
  field: AnyFieldDefinition | null;
  fullWidth?: boolean;
  onChange: (
    id: string,
    updater: (field: AnyFieldDefinition) => AnyFieldDefinition,
  ) => void;
}) {
  if (!field) {
    return (
      <div
        className={cn(
          fullWidth ? "w-full" : "w-full min-w-0 md:w-[40%]",
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

  const entry = getFieldEntry(field.type);

  const setAttribute = <T extends AnyFieldDefinition["attributes"]>(
    patch: Partial<T>,
  ) => {
    onChange(field.id, () => ({
      ...field,
      attributes: { ...field.attributes, ...patch },
    }));
  };

  const setAttributeValue = (key: string, value: unknown) => {
    onChange(field.id, () => ({
      ...field,
      attributes: {
        ...field.attributes,
        [key]: value,
      },
    }));
  };

  // The active effect is whichever key currently holds a group; `show` wins
  // ties so newly enabled conditioning lands on the familiar effect.
  const activeEffect =
    CONDITION_EFFECTS.find((effect) => field.logic[effect.value])?.value ??
    "show";
  const activeGroup: ConditionGroup | undefined = field.logic[activeEffect];

  const setLogic = (logic: FieldLogic) => {
    onChange(field.id, () => ({ ...field, logic }));
  };

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
        fullWidth ? "w-full" : "w-full min-w-0 md:w-[40%]",
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
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Label <span className="text-destructive">*</span>
          </Label>
          <Input
            className="h-8 text-[13px]"
            onChange={(event) => {
              setAttribute({ label: event.target.value });
            }}
            value={field.attributes.label}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Description
          </Label>
          <Input
            className="h-8 text-[13px]"
            onChange={(event) => {
              setAttribute({
                description:
                  event.target.value === "" ? undefined : event.target.value,
              });
            }}
            placeholder="Additional context for the user"
            value={field.attributes.description ?? ""}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Placeholder
          </Label>
          <Input
            className="h-8 text-[13px]"
            onChange={(event) => {
              setAttribute({ placeholder: event.target.value });
            }}
            value={field.attributes.placeholder ?? ""}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Required
          </Label>
          <Select
            onValueChange={(v) => {
              if (!v) return;
              setAttribute({ required: v === "yes" });
            }}
            value={field.attributes.required ? "yes" : "no"}
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
        </div>

        {entry.attributes.length > 0 && (
          <>
            <Separator className="my-3" />
            <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              Attributes
            </h3>
          </>
        )}

        {entry.attributes.map((meta) => {
          const value = (
            field.attributes as unknown as Record<string, unknown>
          )[meta.key];

          if (meta.kind === "boolean") {
            return (
              <BooleanAttribute
                key={meta.key}
                label={meta.label}
                onValueChange={(v) => {
                  setAttributeValue(meta.key, v);
                }}
                value={typeof value === "boolean" ? value : undefined}
              />
            );
          }

          if (meta.kind === "autocomplete") {
            return (
              <AutocompleteAttribute
                key={meta.key}
                label={meta.label}
                onValueChange={(v) => {
                  setAttributeValue(meta.key, v);
                }}
                value={typeof value === "string" ? value : undefined}
              />
            );
          }

          if (meta.kind === "multi-select") {
            const multiOptions = (meta.options ?? []) as AttributeOptionGroup;
            return (
              <MultiSelectAttribute
                key={meta.key}
                label={meta.label}
                onValueChange={(v) => {
                  setAttributeValue(meta.key, v);
                }}
                options={multiOptions}
              />
            );
          }

          if (meta.kind === "datetime") {
            return (
              <DateTimeAttribute
                inputType={meta.inputType ?? "text"}
                key={meta.key}
                label={meta.label}
                onValueChange={(v) => {
                  setAttributeValue(meta.key, v);
                }}
                value={typeof value === "string" ? value : undefined}
              />
            );
          }

          if (meta.kind === "lines") {
            return (
              <LinesAttribute
                key={`${field.id}:${String(meta.key)}`}
                label={meta.label}
                onValueChange={(lines) => {
                  setAttributeValue(meta.key, lines);
                }}
                placeholder={meta.placeholder}
                value={Array.isArray(value) ? (value as string[]) : []}
              />
            );
          }

          if (meta.kind === "number") {
            return (
              <NumberAttribute
                key={meta.key}
                label={meta.label}
                onValueChange={(v) => {
                  setAttributeValue(meta.key, v);
                }}
                value={typeof value === "number" ? value : undefined}
              />
            );
          }

          return (
            <TextAttribute
              key={meta.key}
              label={meta.label}
              onValueChange={(v) => {
                setAttributeValue(meta.key, v === "" ? undefined : v);
              }}
              placeholder={meta.placeholder}
              value={typeof value === "string" ? value : ""}
            />
          );
        })}

        <Separator className="my-3" />

        <div>
          <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
            Behavior
          </h3>

          <div className="mb-2 space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground/70">
              Conditionally
            </Label>
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
          </div>

          {!!activeGroup && (
            <>
              <div className="mb-2 space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground/60">
                  Effect
                </Label>
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
              </div>

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
