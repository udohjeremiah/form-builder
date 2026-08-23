"use client";

import { EyeIcon, PlusIcon, ShieldCheckIcon, XIcon } from "lucide-react";

import type {
  AnyFieldDefinition,
  ValidationRule,
} from "@/types/form-definition";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  CONDITION_OPERATORS,
  getFieldEntry,
  VALIDATION_LABELS,
} from "@/lib/field-registry";

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
  <div className="flex items-center justify-between py-0.5">
    <Label className="text-[10px] font-medium text-muted-foreground/60">
      {label}
    </Label>
    <Input
      className="h-7 w-20 text-right font-mono text-xs"
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
  <div className="flex items-center justify-between gap-2 py-0.5">
    <Label className="shrink-0 text-[10px] font-medium text-muted-foreground/60">
      {label}
    </Label>
    <Input
      className="h-7 min-w-0 flex-1 font-mono text-xs"
      onChange={(event) => {
        onValueChange(event.target.value);
      }}
      placeholder={placeholder}
      type="text"
      value={value}
    />
  </div>
);

const ValidationRuleEditor = ({
  index,
  onChange,
  onRemove,
  rule,
}: {
  index: number;
  onChange: (index: number, updates: Partial<ValidationRule>) => void;
  onRemove: (index: number) => void;
  rule: ValidationRule;
}) => {
  const needsValue = ["max", "min", "pattern"].includes(rule.type);

  return (
    <div className="animate-in space-y-2 rounded-lg border border-border/60 bg-muted/50 p-2.5 duration-200 fade-in slide-in-from-top-1">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <ShieldCheckIcon className="size-3 text-primary/60" />
          <span className="font-mono text-[10px] font-medium text-primary/80">
            {VALIDATION_LABELS[rule.type]}
          </span>
        </div>
        <Button
          className="size-5 text-muted-foreground/40 hover:text-destructive"
          onClick={() => {
            onRemove(index);
          }}
          size="icon"
          variant="ghost"
        >
          <XIcon className="size-3" />
        </Button>
      </div>

      {needsValue && (
        <Input
          className="h-7 font-mono text-xs"
          onChange={(event) => {
            onChange(index, {
              value:
                rule.type === "pattern"
                  ? event.target.value
                  : Number(event.target.value),
            });
          }}
          placeholder={rule.type === "pattern" ? "^[A-Za-z]+$" : "0"}
          type={rule.type === "pattern" ? "text" : "number"}
          value={rule.value ?? ""}
        />
      )}

      <Input
        className="h-7 text-xs"
        onChange={(event) => {
          onChange(index, { message: event.target.value });
        }}
        placeholder="Error message..."
        type="text"
        value={rule.message}
      />
    </div>
  );
};

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
  const availableValidations = entry.validation;
  const currentRules = field.validation;
  const usedTypes = new Set(currentRules.map((r) => r.type));
  const addableRules = availableValidations.filter(
    (t) => !usedTypes.has(t) && t !== "required",
  );

  const handleAddRule = (type: ValidationRule["type"]) => {
    const ruleDefaults: Partial<Record<ValidationRule["type"], number>> = {
      max: 100,
      min: 1,
    };
    onChange(field.id, () => ({
      ...field,
      validation: [
        ...currentRules,
        {
          message: "",
          type,
          value: ruleDefaults[type],
        },
      ],
    }));
  };

  const handleUpdateRule = (
    index: number,
    updates: Partial<ValidationRule>,
  ) => {
    onChange(field.id, () => ({
      ...field,
      validation: currentRules.map((r, index_) =>
        index_ === index ? { ...r, ...updates } : r,
      ),
    }));
  };

  const handleRemoveRule = (index: number) => {
    onChange(field.id, () => ({
      ...field,
      validation: currentRules.filter((_, index_) => index_ !== index),
    }));
  };

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

        <Separator className="my-1" />

        {/* Validation */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              Validation
            </span>
            {currentRules.length > 0 && (
              <Badge
                className="border-0 bg-primary/8 font-mono text-[9px] text-primary/70"
                variant="secondary"
              >
                {currentRules.length}
              </Badge>
            )}
          </div>

          <div className="mb-2 space-y-1.5">
            {currentRules.map((rule, index) => (
              <ValidationRuleEditor
                index={index}
                key={`${rule.type}-${index}`}
                onChange={handleUpdateRule}
                onRemove={handleRemoveRule}
                rule={rule}
              />
            ))}
          </div>

          {addableRules.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {addableRules.map((type) => (
                <Button
                  className="h-6 gap-1 border-dashed px-2 font-mono text-[9px] text-muted-foreground/60"
                  key={type}
                  onClick={() => {
                    handleAddRule(type);
                  }}
                  size="sm"
                  variant="outline"
                >
                  <PlusIcon className="size-2.5" />
                  {VALIDATION_LABELS[type]}
                </Button>
              ))}
            </div>
          )}

          {availableValidations.length <= 1 && (
            <p className="text-[10px] text-muted-foreground/30">
              No extra validation available
            </p>
          )}
        </div>

        <Separator className="my-1" />

        {/* Conditional Visibility */}
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
              Visibility
            </span>
            {field.conditions.show?.fieldId && (
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
              Show conditionally
            </Label>
            <Switch
              checked={!!field.conditions.show}
              onCheckedChange={(checked) => {
                onChange(field.id, () => ({
                  ...field,
                  conditions: {
                    ...field.conditions,
                    show: checked
                      ? { fieldId: "", operator: "not_empty" }
                      : undefined,
                  },
                }));
              }}
            />
          </div>

          {!!field.conditions.show && (
            <div className="space-y-2 rounded-lg border border-border/60 bg-muted/50 p-2.5">
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground/60">
                  When field
                </Label>
                <Select
                  onValueChange={(v) => {
                    const current = field.conditions.show;
                    if (!current || !v) return;
                    onChange(field.id, () => ({
                      ...field,
                      conditions: {
                        ...field.conditions,
                        show: { ...current, fieldId: v },
                      },
                    }));
                  }}
                  value={field.conditions.show.fieldId}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select a field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allFields
                      ?.filter((f) => f.id !== field.id)
                      .map((f) => (
                        <SelectItem className="text-xs" key={f.id} value={f.id}>
                          {f.attributes.label}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground/60">
                  Operator
                </Label>
                <Select
                  onValueChange={(v) => {
                    const current = field.conditions.show;
                    if (!current || !v) return;
                    onChange(field.id, () => ({
                      ...field,
                      conditions: {
                        ...field.conditions,
                        show: { ...current, operator: v },
                      },
                    }));
                  }}
                  value={field.conditions.show.operator}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CONDITION_OPERATORS.map((op) => (
                      <SelectItem
                        className="text-xs"
                        key={op.value}
                        value={op.value}
                      >
                        {op.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {!["empty", "not_empty"].includes(
                field.conditions.show.operator,
              ) && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground/60">
                    Value
                  </Label>
                  <Input
                    className="h-7 font-mono text-xs"
                    onChange={(event) => {
                      const current = field.conditions.show;
                      if (!current) return;
                      const value = event.target.value;
                      onChange(field.id, () => ({
                        ...field,
                        conditions: {
                          ...field.conditions,
                          show: { ...current, value },
                        },
                      }));
                    }}
                    placeholder="Expected value..."
                    value={field.conditions.show.value}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <Separator className="my-1" />

        <div className="truncate font-mono text-[10px] text-muted-foreground/30">
          {field.id}
        </div>
      </div>
    </div>
  );
}
