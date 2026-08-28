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
    <div className="mx-auto w-full max-w-5xl p-4 md:p-6">
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
        <div className="overflow-x-auto rounded-xl border border-border/70">
          <table className="w-full min-w-max border-collapse text-start">
            <thead>
              <tr className="border-b border-border bg-muted/40 font-mono text-[10px] tracking-wider text-muted-foreground/60 uppercase">
                <th className="w-32 px-4 py-2 text-start font-medium whitespace-nowrap">
                  Rule ID
                </th>
                <th className="w-40 px-4 py-2 font-medium whitespace-nowrap">
                  Area
                </th>
                <th className="px-4 py-2 font-medium whitespace-nowrap">
                  Outcome
                </th>
                <th className="w-32 px-4 py-2 text-end font-medium whitespace-nowrap">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/70">
              {rules.map((rule) => (
                <tr
                  className="cursor-default transition-colors hover:bg-muted dark:hover:bg-muted/50"
                  key={rule.id}
                  onClick={() => {
                    onEdit(rule.id);
                  }}
                >
                  <td className="px-4 py-2.5 font-mono text-[11px] whitespace-nowrap text-muted-foreground">
                    {rule.id}
                  </td>
                  <td className="px-4 py-2.5 text-center text-[13px] whitespace-nowrap text-foreground">
                    {rule.area || "—"}
                  </td>
                  <td className="px-4 py-2.5 text-center text-[13px] whitespace-nowrap text-foreground/80">
                    {rule.outcome.adminReason || (
                      <span className="text-muted-foreground/40 italic">
                        No reason set
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-end whitespace-nowrap">
                    <StatusBadge status={rule.outcome.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
