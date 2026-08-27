"use client";

import { ChevronLeftIcon, Trash2Icon } from "lucide-react";

import type { AnyFieldDefinition } from "@/types/form-definition";
import type { Condition, GroupCondition, Rule } from "@/types/rule-definition";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { newGroupCondition } from "@/lib/rule-definition";

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
  onChange: (rule: Rule) => void;
  onDelete: () => void;
  rule: Rule;
}) {
  // The WHEN tree is always a group root; normalise just in case a restored
  // draft points somewhere else.
  const root: GroupCondition =
    rule.condition.type === "group" ? rule.condition : newGroupCondition();

  const handleRootChange = (next: Condition) => {
    onChange({ ...rule, condition: next });
  };

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

      <div className="space-y-3 rounded-lg border border-border/60 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
            Rule
          </h3>
          <span className="font-mono text-xs text-muted-foreground">
            {rule.id}
          </span>
        </div>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Area
          </Label>
          <Input
            className="h-8 text-[13px]"
            onChange={(event) => {
              onChange({ ...rule, area: event.target.value });
            }}
            placeholder="Business/domain category this rule belongs to..."
            value={rule.area}
          />
        </div>
      </div>

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          When
        </h3>
        <WhenEditor
          allFields={allFields}
          condition={root}
          onRemoveGroup={() => {
            handleRootChange(newGroupCondition());
          }}
          onRootChange={handleRootChange}
          path={[]}
          removeable={false}
        />
      </section>

      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Then
        </h3>
        <ThenEditor
          onChange={(outcome) => {
            onChange({ ...rule, outcome });
          }}
          outcome={rule.outcome}
        />
      </section>
    </div>
  );
}
