"use client";

import { EyeIcon, XIcon } from "lucide-react";

import type {
  AnyFieldDefinition,
  ConditionGroup,
  FieldCondition,
  FieldConditions,
} from "@/types/form-definition";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import {
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
  if (!field) {
    return (
      <div
        className={cn(
          fullWidth ? "w-full" : "w-64",
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
  const hasConditions = CONDITION_EFFECTS.some(
    (effect) => !!field.conditions[effect.value],
  );

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
        fullWidth ? "w-full" : "w-64",
        "animate-in overflow-y-auto border-l border-border bg-background p-4 duration-200 fade-in slide-in-from-right-4",
      )}
      key={field.id}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Properties
        </h3>
        <Badge
          className="bg-primary/8 font-mono text-[9px] text-primary/70 uppercase"
          variant="secondary"
        >
          {field.type}
        </Badge>
      </div>

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
            placeholder="Helper text shown below the label"
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
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
                Attributes
              </span>
            </div>
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

          if (meta.kind === "csv") {
            return (
              <TextAttribute
                key={meta.key}
                label={meta.label}
                onValueChange={(v) => {
                  setAttributeValue(
                    meta.key,
                    v.trim() === ""
                      ? undefined
                      : v
                          .split(",")
                          .map((part) => part.trim())
                          .filter(Boolean),
                  );
                }}
                placeholder={meta.placeholder}
                value={(Array.isArray(value) ? value : []).join(", ")}
              />
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
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              Behavior
            </span>
            {hasConditions && (
              <Badge
                className="border-0 bg-accent/20 font-mono text-[9px] text-accent"
                variant="secondary"
              >
                Conditional
              </Badge>
            )}
          </div>

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
                  <SelectTrigger className="h-7 text-xs">
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
                    <SelectTrigger className="h-7 text-xs">
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
                          <SelectTrigger className="h-7 text-xs">
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

                <button
                  className="w-full rounded-md border border-dashed border-border/60 py-1.5 text-[11px] font-medium text-muted-foreground/50 transition-colors hover:border-primary/40 hover:text-primary"
                  onClick={() => {
                    updateGroup((group) => ({
                      ...group,
                      conditions: [...group.conditions, { ...NEW_CONDITION }],
                    }));
                  }}
                  type="button"
                >
                  + Add condition
                </button>
              </div>
            </>
          )}
        </div>

        <Separator className="my-3" />

        <div className="truncate font-mono text-[10px] text-muted-foreground/30">
          {field.id}
        </div>
      </div>
    </div>
  );
}
