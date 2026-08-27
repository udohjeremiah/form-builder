"use client";

import type { ReactNode } from "react";

import { PlusIcon, XIcon } from "lucide-react";

import type { RuleOutcome } from "@/types/rule-definition";

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
import { Textarea } from "@/components/ui/textarea";
import {
  DURATION_UNIT_LABELS,
  DURATION_UNIT_LIST,
  RULE_STATUS_LABELS,
  RULE_STATUS_LIST,
} from "@/lib/rule-definition";

const parseNumber = (raw: string): number | undefined => {
  if (raw.trim() === "") return undefined;
  const parsed = Number(raw);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export function ThenEditor({
  disabled,
  onChange,
  outcome,
}: {
  disabled?: boolean;
  onChange: (outcome: RuleOutcome) => void;
  outcome: RuleOutcome;
}) {
  // Hoisted so the nested spreads below narrow to a concrete Duration
  // (nested property narrowing is lost inside the event callbacks).
  const deadline = outcome.deadline;

  return (
    <div className="border-l border-border pl-5">
      {/* match condition sits on the rail top, connected by a horizontal arm */}
      <div className="relative flex items-center pb-5">
        <span className="absolute top-1/2 -left-5 h-px w-5 bg-border" />
        <Badge variant="outline">all</Badge>
      </div>

      <ThenField>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Status
          </Label>
          <Select
            disabled={disabled}
            onValueChange={(status) => {
              if (status) onChange({ ...outcome, status });
            }}
            value={outcome.status}
          >
            <SelectTrigger className="h-8 w-full text-[13px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RULE_STATUS_LIST.map((status) => (
                <SelectItem className="text-[13px]" key={status} value={status}>
                  {RULE_STATUS_LABELS[status]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </ThenField>

      <ThenField>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Admin reason
          </Label>
          <Textarea
            className="resize-none text-xs"
            disabled={disabled}
            onChange={(event) => {
              onChange({ ...outcome, adminReason: event.target.value });
            }}
            placeholder="Why this outcome applies..."
            rows={3}
            value={outcome.adminReason}
          />
        </div>
      </ThenField>

      <ThenField>
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Student action (optional)
          </Label>
          <Input
            className="h-8 text-[13px]"
            disabled={disabled}
            onChange={(event) => {
              onChange({
                ...outcome,
                studentAction:
                  event.target.value === "" ? undefined : event.target.value,
              });
            }}
            placeholder="What the student should do next..."
            value={outcome.studentAction ?? ""}
          />
        </div>
      </ThenField>

      <ThenField>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label className="text-[11px] font-medium text-muted-foreground/70">
              Deadline (optional)
            </Label>
            {outcome.deadline && (
              <Button
                className="h-6 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  onChange({
                    adminReason: outcome.adminReason,
                    status: outcome.status,
                    studentAction: outcome.studentAction,
                  });
                }}
                size="icon-xs"
                title="Remove deadline"
                variant="ghost"
              >
                <XIcon className="size-3" />
              </Button>
            )}
          </div>
          {deadline ? (
            <div className="flex gap-1.5">
              <Input
                className="h-8 w-20 text-[13px]"
                min={0}
                onChange={(event) => {
                  onChange({
                    ...outcome,
                    deadline: {
                      ...deadline,
                      amount: Math.max(0, parseNumber(event.target.value) ?? 0),
                    },
                  });
                }}
                placeholder="0"
                type="number"
                value={deadline.amount}
              />
              <Select
                disabled={disabled}
                onValueChange={(unit) => {
                  if (unit) {
                    onChange({
                      ...outcome,
                      deadline: { ...deadline, unit },
                    });
                  }
                }}
                value={deadline.unit}
              >
                <SelectTrigger className="h-8 flex-1 text-[13px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_UNIT_LIST.map((unit) => (
                    <SelectItem className="text-[13px]" key={unit} value={unit}>
                      {DURATION_UNIT_LABELS[unit]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <Button
              className="w-full border-dashed text-xs"
              onClick={() => {
                onChange({ ...outcome, deadline: { amount: 1, unit: "week" } });
              }}
              size="xs"
              variant="outline"
            >
              <PlusIcon /> Add deadline
            </Button>
          )}
        </div>
      </ThenField>
    </div>
  );
}

/**
 * One outcome row of the THEN tree. The container's left border is the rail;
 * each field draws a short horizontal arm from that border to its own content.
 */
function ThenField({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <span className="absolute inset-y-0 -left-5 my-auto h-px w-5 bg-border" />
      <div className="pb-5">{children}</div>
    </div>
  );
}
