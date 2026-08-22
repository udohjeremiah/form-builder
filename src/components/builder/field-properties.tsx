"use client";

import { EyeIcon, PlusIcon, ShieldCheckIcon, XIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

import type { FormField, ValidationRule } from "@/types/form";

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
import {
  CONDITION_OPERATORS,
  VALIDATION_LABELS,
  VALIDATION_OPTIONS,
} from "@/types/form";

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
    <motion.div
      animate={{ height: "auto", opacity: 1 }}
      className="space-y-2 rounded-lg border border-border/60 bg-muted/50 p-2.5"
      exit={{ height: 0, opacity: 0 }}
      initial={{ height: 0, opacity: 0 }}
    >
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
    </motion.div>
  );
};

export function FieldProperties({
  allFields,
  field,
  fullWidth,
  onChange,
}: {
  allFields?: FormField[];
  field: FormField | null;
  fullWidth?: boolean;
  onChange: (id: string, updates: Partial<FormField>) => void;
}) {
  if (!field) {
    return (
      <div
        className={`${fullWidth ? "w-full" : "w-64"} flex items-center justify-center border-l border-border bg-background p-6`}
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

  const availableValidations = VALIDATION_OPTIONS[field.type];
  const currentRules = field.validation ?? [];
  const usedTypes = new Set(currentRules.map((r) => r.type));
  const addableRules = availableValidations.filter(
    (t) => !usedTypes.has(t) && t !== "required",
  );

  const handleAddRule = (type: ValidationRule["type"]) => {
    const ruleDefaults: Partial<Record<ValidationRule["type"], number>> = {
      max: 100,
      min: 1,
    };
    onChange(field.id, {
      validation: [
        ...currentRules,
        {
          message: "",
          type,
          value: ruleDefaults[type],
        },
      ],
    });
  };

  const handleUpdateRule = (
    index: number,
    updates: Partial<ValidationRule>,
  ) => {
    onChange(field.id, {
      validation: currentRules.map((r, index_) =>
        index_ === index ? { ...r, ...updates } : r,
      ),
    });
  };

  const handleRemoveRule = (index: number) => {
    onChange(field.id, {
      validation: currentRules.filter((_, index_) => index_ !== index),
    });
  };

  return (
    <motion.div
      animate={{ opacity: 1, x: 0 }}
      className={`${fullWidth ? "w-full" : "w-64"} overflow-y-auto border-l border-border bg-background p-4`}
      initial={{ opacity: 0, x: 8 }}
      key={field.id}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Properties
        </h3>
        <Badge
          className="border-0 bg-primary/8 font-mono text-[9px] text-primary/70 uppercase"
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
              onChange(field.id, { label: event.target.value });
            }}
            value={field.label}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Placeholder
          </Label>
          <Input
            className="h-8 text-[13px]"
            onChange={(event) => {
              onChange(field.id, { placeholder: event.target.value });
            }}
            value={field.placeholder ?? ""}
          />
        </div>

        <div className="flex items-center justify-between py-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Required
          </Label>
          <Switch
            checked={!!field.required}
            onCheckedChange={(v) => {
              onChange(field.id, { required: v });
            }}
          />
        </div>

        {(field.type === "select" || field.type === "radio") && (
          <div className="space-y-1">
            <Label className="text-[11px] font-medium text-muted-foreground/70">
              Options
            </Label>
            <Textarea
              className="resize-none font-mono text-xs"
              onChange={(event) => {
                onChange(field.id, {
                  options: event.target.value.split("\n"),
                });
              }}
              placeholder="One per line"
              rows={3}
              value={(field.options ?? []).join("\n")}
            />
          </div>
        )}

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
            <AnimatePresence>
              {currentRules.map((rule, index) => (
                <ValidationRuleEditor
                  index={index}
                  key={`${rule.type}-${index}`}
                  onChange={handleUpdateRule}
                  onRemove={handleRemoveRule}
                  rule={rule}
                />
              ))}
            </AnimatePresence>
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
            {field.condition?.fieldId && (
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
              checked={!!field.condition}
              onCheckedChange={(checked) => {
                if (checked) {
                  onChange(field.id, {
                    condition: { fieldId: "", operator: "not_empty" },
                  });
                } else {
                  onChange(field.id, { condition: undefined });
                }
              }}
            />
          </div>

          {field.condition && (
            <motion.div
              animate={{ height: "auto", opacity: 1 }}
              className="space-y-2 rounded-lg border border-border/60 bg-muted/50 p-2.5"
              exit={{ height: 0, opacity: 0 }}
              initial={{ height: 0, opacity: 0 }}
            >
              <div className="space-y-1">
                <Label className="text-[10px] font-medium text-muted-foreground/60">
                  When field
                </Label>
                <Select
                  onValueChange={(v) => {
                    if (!field.condition || !v) return;
                    onChange(field.id, {
                      condition: { ...field.condition, fieldId: v },
                    });
                  }}
                  value={field.condition.fieldId}
                >
                  <SelectTrigger className="h-7 text-xs">
                    <SelectValue placeholder="Select a field..." />
                  </SelectTrigger>
                  <SelectContent>
                    {allFields
                      ?.filter(
                        (f) =>
                          f.id !== field.id &&
                          f.type !== "heading" &&
                          f.type !== "separator",
                      )
                      .map((f) => (
                        <SelectItem className="text-xs" key={f.id} value={f.id}>
                          {f.label}
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
                    if (!field.condition || !v) return;
                    onChange(field.id, {
                      condition: {
                        ...field.condition,
                        operator: v,
                      },
                    });
                  }}
                  value={field.condition.operator}
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

              {!["empty", "not_empty"].includes(field.condition.operator) && (
                <div className="space-y-1">
                  <Label className="text-[10px] font-medium text-muted-foreground/60">
                    Value
                  </Label>
                  <Input
                    className="h-7 font-mono text-xs"
                    onChange={(event) => {
                      if (!field.condition) return;
                      onChange(field.id, {
                        condition: {
                          ...field.condition,
                          value: event.target.value,
                        },
                      });
                    }}
                    placeholder="Expected value..."
                    value={field.condition.value ?? ""}
                  />
                </div>
              )}
            </motion.div>
          )}
        </div>

        <Separator className="my-1" />

        <div className="truncate font-mono text-[10px] text-muted-foreground/30">
          {field.id}
        </div>
      </div>
    </motion.div>
  );
}
