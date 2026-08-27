"use client";

import { PlusIcon } from "lucide-react";

import type { Rule, RuleStatus } from "@/types/rule-definition";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { RULE_STATUS_LABELS } from "@/lib/rule-definition";

const statusTone: Record<RuleStatus, string> = {
  NOT_QUALIFIED: "border-destructive/30 bg-destructive/10 text-destructive",
  READY: "border-border/60 bg-muted text-muted-foreground",
  REVIEW_REQUIRED:
    "border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400",
  SUPPORT_REQUIRED: "border-primary/30 bg-primary/10 text-primary",
};

export function RuleList({
  onCreate,
  onEdit,
  rules,
}: {
  onCreate: () => void;
  onEdit: (id: string) => void;
  rules: Rule[];
}) {
  return (
    <div className="mx-auto w-full max-w-3xl p-4 md:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <h2 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
            Rules
          </h2>
          {rules.length > 0 && (
            <span className="font-mono text-[11px] text-muted-foreground">
              {rules.length}
            </span>
          )}
        </div>
        <Button onClick={onCreate} size="sm">
          <PlusIcon className="size-3.5" />
          Create rule
        </Button>
      </div>

      {rules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/70 py-16 text-center">
          <p className="font-mono text-sm text-muted-foreground">
            No rules yet.
          </p>
          <p className="mt-1 text-xs text-muted-foreground/60">
            Create your first rule to start setting up assessment logic.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border/70">
          <div className="grid grid-cols-[1fr_1fr_2fr_1fr] gap-2 border-b border-border bg-muted/40 px-4 py-2 font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase">
            <span>Rule ID</span>
            <span>Area</span>
            <span>Outcome</span>
            <span>Status</span>
          </div>
          <div className="divide-y divide-border/70">
            {rules.map((rule) => (
              <button
                className="grid w-full grid-cols-[1fr_1fr_2fr_1fr] items-center gap-2 px-4 py-2.5 text-left transition-colors hover:bg-accent"
                key={rule.id}
                onClick={() => {
                  onEdit(rule.id);
                }}
              >
                <span className="truncate font-mono text-[11px] text-muted-foreground">
                  {rule.id}
                </span>
                <span className="truncate text-[13px] text-foreground">
                  {rule.area || "—"}
                </span>
                <span className="truncate text-[13px] text-foreground/80">
                  {rule.outcome.adminReason || (
                    <span className="text-muted-foreground/40 italic">
                      No reason set
                    </span>
                  )}
                </span>
                <StatusBadge status={rule.outcome.status} />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: RuleStatus }) {
  const dots: Record<RuleStatus, string> = {
    NOT_QUALIFIED: "bg-destructive",
    READY: "bg-muted-foreground",
    REVIEW_REQUIRED: "bg-amber-500",
    SUPPORT_REQUIRED: "bg-primary",
  };
  return (
    <Badge
      className={cn(
        "w-fit gap-1.5 font-normal normal-case",
        statusTone[status],
      )}
      variant="outline"
    >
      <span className={cn("size-1.5 rounded-full", dots[status])} />
      {RULE_STATUS_LABELS[status]}
    </Badge>
  );
}
