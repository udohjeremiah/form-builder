"use client";

import { EyeIcon, PlusIcon, XIcon } from "lucide-react";
import { Fragment } from "react";

import type {
  AnyFieldDefinition,
  ConditionGroup,
  FieldCondition,
  FieldConditions,
} from "@/types/form-definition";

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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import {
  AUTOCOMPLETE_OPTIONS,
  CONDITION_OPERATOR_LABELS,
  getFieldEntry,
  getOperatorsForType,
} from "@/lib/field-registry";

type EffectKey = keyof FieldConditions;

const CONDITION_EFFECTS: { label: string; value: EffectKey }[] = [
  { label: "Show field", value: "show" },
  { label: "Hide field", value: "hide" },
  { label: "Disable field", value: "disable" },
];

const NEW_CONDITION: FieldCondition = {
  fieldId: "",
  operator: "not_empty",
  value: "",
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
  const anchor = useComboboxAnchor();

  if (!field) {
    return (
      <div
        className={cn(
          fullWidth ? "w-full" : "w-full min-w-0 md:w-[40%]",
          "flex items-center justify-center border-l border-border bg-background p-6",
        )}
      >
        <div className="text-center">
          <div className="mx-auto mb-3 flex size-10 items-center justify-center rounded-xl bg-muted">
            <span className="text-lg text-muted-foreground/30">⚙</span>
          </div>
          <p className="text-xs font-medium text-muted-foreground/40">
            Select a field to edit
          </p>
        </div>
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
    CONDITION_EFFECTS.find((effect) => field.conditions[effect.value])?.value ??
    "show";
  const activeGroup: ConditionGroup | undefined =
    field.conditions[activeEffect];

  const setConditions = (conditions: FieldConditions) => {
    onChange(field.id, () => ({ ...field, conditions }));
  };

  const updateGroup = (
    transform: (group: ConditionGroup) => ConditionGroup,
  ) => {
    if (!activeGroup) return;
    setConditions({
      ...field.conditions,
      [activeEffect]: transform(activeGroup),
    });
  };

  const updateCondition = (index: number, patch: Partial<FieldCondition>) => {
    updateGroup((group) => ({
      ...group,
      conditions: group.conditions.map((condition, conditionIndex) =>
        conditionIndex === index ? { ...condition, ...patch } : condition,
      ),
    }));
  };

  const removeCondition = (index: number) => {
    updateGroup((group) => ({
      ...group,
      conditions: group.conditions.filter(
        (_, conditionIndex) => conditionIndex !== index,
      ),
    }));
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
            Label
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

        <div className="flex items-center justify-between py-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Required
          </Label>
          <Switch
            checked={!!field.attributes.required}
            onCheckedChange={(v) => {
              setAttribute({ required: v });
            }}
          />
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
              <div
                className="flex items-center justify-between py-1"
                key={meta.key}
              >
                <Label className="text-[11px] font-medium text-muted-foreground/70">
                  {meta.label}
                </Label>
                <Switch
                  checked={!!value}
                  onCheckedChange={(checked) => {
                    setAttributeValue(meta.key, checked);
                  }}
                />
              </div>
            );
          }

          if (meta.kind === "autocomplete") {
            return (
              <div className="space-y-1" key={meta.key}>
                <Label className="text-[11px] font-medium text-muted-foreground/70">
                  {meta.label}
                </Label>
                <Select
                  onValueChange={(v) => {
                    setAttributeValue(meta.key, v === "off" ? undefined : v);
                  }}
                  value={(value as string | undefined) ?? "off"}
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
                        <SelectLabel className="text-[10px]">
                          {group.label}
                        </SelectLabel>
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
          }

          if (meta.kind === "multi-select") {
            const multiOptions = (meta.options ?? []) as readonly {
              readonly label: string;
              readonly options: readonly {
                readonly label: string;
                readonly value: string;
              }[];
            }[];

            return (
              <div className="space-y-1" key={meta.key}>
                <Label className="text-[11px] font-medium text-muted-foreground/70">
                  {meta.label}
                </Label>
                <Combobox
                  autoHighlight={true}
                  items={multiOptions}
                  multiple={true}
                  onValueChange={(value) => {
                    setAttributeValue(meta.key, value);
                  }}
                >
                  <ComboboxChips ref={anchor}>
                    <ComboboxValue>
                      {(values: string[]) => (
                        <Fragment>
                          {values.map((value: string) => (
                            <ComboboxChip key={value}>{value}</ComboboxChip>
                          ))}
                          <ComboboxChipsInput />
                        </Fragment>
                      )}
                    </ComboboxValue>
                  </ComboboxChips>
                  <ComboboxContent anchor={anchor}>
                    <ComboboxEmpty>No items found.</ComboboxEmpty>
                    <ComboboxList>
                      {(group: (typeof multiOptions)[number], index) => (
                        <ComboboxGroup items={group.options} key={group.label}>
                          <ComboboxLabel>{group.label}</ComboboxLabel>
                          <ComboboxCollection>
                            {(
                              item: (typeof multiOptions)[number]["options"][number],
                            ) => (
                              <ComboboxItem key={item.value} value={item.value}>
                                {item.label}
                              </ComboboxItem>
                            )}
                          </ComboboxCollection>
                          {index < multiOptions.length - 1 && (
                            <ComboboxSeparator />
                          )}
                        </ComboboxGroup>
                      )}
                    </ComboboxList>
                  </ComboboxContent>
                </Combobox>
              </div>
            );
          }

          if (meta.kind === "datetime") {
            return (
              <div className="space-y-1" key={meta.key}>
                <Label className="text-[11px] font-medium text-muted-foreground/70">
                  {meta.label}
                </Label>
                <Input
                  className="h-8 text-[13px]"
                  onChange={(event) => {
                    setAttributeValue(
                      meta.key,
                      event.target.value === ""
                        ? undefined
                        : event.target.value,
                    );
                  }}
                  type={meta.inputType ?? "text"}
                  value={(value as string | undefined) ?? ""}
                />
              </div>
            );
          }

          if (meta.kind === "lines") {
            return (
              <div className="space-y-1" key={meta.key}>
                <Label className="text-[11px] font-medium text-muted-foreground/70">
                  {meta.label}
                </Label>
                <Textarea
                  className="resize-none font-mono text-xs"
                  onChange={(event) => {
                    setAttributeValue(meta.key, event.target.value.split("\n"));
                  }}
                  placeholder={meta.placeholder}
                  rows={3}
                  value={(Array.isArray(value) ? value : []).join("\n")}
                />
              </div>
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

        {/* Conditional behavior */}
        <div>
          <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
            Behavior
          </h3>

          <div className="mb-2 flex items-center justify-between py-1">
            <Label className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground/70">
              <EyeIcon className="size-3" />
              Conditionally
            </Label>
            <Switch
              checked={!!activeGroup}
              onCheckedChange={(checked) => {
                if (checked) {
                  setConditions({
                    ...field.conditions,
                    [activeEffect]: {
                      combinator: "all",
                      conditions: [{ ...NEW_CONDITION }],
                    },
                  });
                  return;
                }
                // Disabling conditioning clears every effect.
                setConditions({});
              }}
            />
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
                    const { [activeEffect]: moved, ...rest } = field.conditions;
                    setConditions(moved ? { ...rest, [v]: moved } : rest);
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

              <div className="space-y-2 rounded-lg border border-border/60 bg-muted/50 p-2.5">
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground/60">
                    Match
                  </Label>
                  <Select
                    onValueChange={(v) => {
                      if (!v) return;
                      const combinator = v;
                      updateGroup((group) => ({ ...group, combinator }));
                    }}
                    value={activeGroup.combinator}
                  >
                    <SelectTrigger className="h-7 w-full text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem className="text-xs" value="all">
                        All conditions
                      </SelectItem>
                      <SelectItem className="text-xs" value="any">
                        Any condition
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {activeGroup.conditions.map((condition, index) => {
                  const targetField = allFields?.find(
                    (f) => f.id === condition.fieldId,
                  );
                  // Until a target field is chosen, offer the broadest
                  // (text-like) operator set.
                  const operators = getOperatorsForType(
                    targetField?.type ?? "text",
                  );

                  return (
                    <div key={index}>
                      {index > 0 && (
                        <div className="flex items-center gap-2 py-1.5">
                          <span className="h-px flex-1 bg-border/70" />
                          <span className="rounded-full bg-muted px-2 py-0.5 font-mono text-[9px] tracking-wide text-muted-foreground/60 uppercase">
                            {activeGroup.combinator === "any" ? "or" : "and"}
                          </span>
                          <span className="h-px flex-1 bg-border/70" />
                        </div>
                      )}

                      <div className="space-y-1.5 rounded-md border border-border/50 bg-background/60 p-2">
                        <div className="flex items-center gap-1.5">
                          <Select
                            onValueChange={(v) => {
                              if (!v) return;
                              const next: Partial<FieldCondition> = {
                                fieldId: v,
                              };
                              const target = allFields?.find((f) => f.id === v);
                              if (
                                target &&
                                !getOperatorsForType(target.type).includes(
                                  condition.operator,
                                )
                              ) {
                                next.operator = getOperatorsForType(
                                  target.type,
                                )[0];
                              }
                              updateCondition(index, next);
                            }}
                            value={condition.fieldId}
                          >
                            <SelectTrigger className="h-7 flex-1 text-xs">
                              <SelectValue placeholder="Select a field..." />
                            </SelectTrigger>
                            <SelectContent>
                              {allFields
                                ?.filter((f) => f.id !== field.id)
                                .map((f) => (
                                  <SelectItem
                                    className="text-xs"
                                    key={f.id}
                                    value={f.id}
                                  >
                                    {f.attributes.label}
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                          <button
                            className="shrink-0 rounded-md p-1 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
                            onClick={() => {
                              removeCondition(index);
                            }}
                            title="Remove condition"
                          >
                            <XIcon className="size-3" />
                          </button>
                        </div>

                        <Select
                          onValueChange={(v) => {
                            if (!v) return;
                            updateCondition(index, { operator: v });
                          }}
                          value={condition.operator}
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

                        {!["empty", "not_empty"].includes(
                          condition.operator,
                        ) && (
                          <Input
                            className="h-7 font-mono text-xs"
                            onChange={(event) => {
                              updateCondition(index, {
                                value: event.target.value,
                              });
                            }}
                            placeholder="Expected value..."
                            value={condition.value ?? ""}
                          />
                        )}
                      </div>
                    </div>
                  );
                })}

                <Button
                  className="w-full border-dashed"
                  onClick={() => {
                    updateGroup((group) => ({
                      ...group,
                      conditions: [...group.conditions, { ...NEW_CONDITION }],
                    }));
                  }}
                  size="xs"
                  variant="outline"
                >
                  <PlusIcon /> Add condition
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
