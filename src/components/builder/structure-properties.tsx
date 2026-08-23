"use client";

import type {
  SectionAttributes,
  StepAttributes,
} from "@/types/form-definition";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";

export type StructureNode =
  | { attributes: SectionAttributes; id: string; kind: "section" }
  | {
      attributes: StepAttributes;
      id: string;
      index: number;
      kind: "step";
      stepCount: number;
    };

export function StructureProperties({
  fullWidth,
  node,
  onChange,
}: {
  fullWidth?: boolean;
  node: StructureNode;
  onChange: (id: string, patch: SectionAttributes | StepAttributes) => void;
}) {
  // Navigation labels only make sense from a step's position: the first step
  // has no back button, and the last one submits instead of advancing.
  const isLastStep = node.kind === "step" && node.index === node.stepCount - 1;

  return (
    <div
      className={cn(
        fullWidth ? "w-full" : "w-64",
        "animate-in overflow-y-auto border-l border-border bg-background p-4 duration-200 fade-in slide-in-from-right-4",
      )}
      key={node.id}
    >
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Properties
        </h3>
        <Badge
          className="bg-primary/8 font-mono text-[9px] text-primary/70 uppercase"
          variant="secondary"
        >
          {node.kind}
        </Badge>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Title
          </Label>
          <Input
            className="h-8 text-[13px]"
            onChange={(event) => {
              onChange(node.id, {
                ...node.attributes,
                title:
                  event.target.value === "" ? undefined : event.target.value,
              });
            }}
            value={node.attributes.title ?? ""}
          />
        </div>

        <div className="space-y-1">
          <Label className="text-[11px] font-medium text-muted-foreground/70">
            Description
          </Label>
          <Textarea
            className="resize-none font-mono text-xs"
            onChange={(event) => {
              onChange(node.id, {
                ...node.attributes,
                description:
                  event.target.value === "" ? undefined : event.target.value,
              });
            }}
            placeholder="Shown under the title..."
            rows={3}
            value={node.attributes.description ?? ""}
          />
        </div>

        {node.kind === "step" && (
          <>
            {node.index > 0 && (
              <div className="space-y-1">
                <Label className="text-[11px] font-medium text-muted-foreground/70">
                  Previous label
                </Label>
                <Input
                  className="h-8 text-[13px]"
                  onChange={(event) => {
                    onChange(node.id, {
                      ...node.attributes,
                      previousLabel:
                        event.target.value === ""
                          ? undefined
                          : event.target.value,
                    });
                  }}
                  placeholder="Back button text..."
                  value={node.attributes.previousLabel ?? ""}
                />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-[11px] font-medium text-muted-foreground/70">
                {isLastStep ? "Submit label" : "Next label"}
              </Label>
              <Input
                className="h-8 text-[13px]"
                onChange={(event) => {
                  onChange(node.id, {
                    ...node.attributes,
                    nextLabel:
                      event.target.value === ""
                        ? undefined
                        : event.target.value,
                  });
                }}
                placeholder={
                  isLastStep ? "Submit button text..." : "Next button text..."
                }
                value={node.attributes.nextLabel ?? ""}
              />
            </div>
          </>
        )}

        <Separator className="my-1" />

        <div className="truncate font-mono text-[10px] text-muted-foreground/30">
          {node.id}
        </div>
      </div>
    </div>
  );
}
