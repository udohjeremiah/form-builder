"use client";

import { useDroppable } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import {
  CopyIcon,
  EyeIcon,
  GripVerticalIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import type { FormField, FormStep } from "@/types/form";

import { Button } from "@/components/ui/button";

const SortableField = ({
  field,
  index,
  isSelected,
  onDuplicate,
  onRemove,
  onSelect,
}: {
  field: FormField;
  index: number;
  isSelected: boolean;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}) => {
  const { isDragging, ref } = useSortable({ id: field.id, index });

  return (
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className={`group flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-all ${
        isSelected
          ? "border-primary/40 bg-primary/6 shadow-[0_0_0_1px_hsl(217_91%_60%/0.1)]"
          : "border-border/60 bg-muted/50 hover:border-border hover:bg-accent"
      } ${isDragging ? "z-50 opacity-40" : ""}`}
      exit={{ height: 0, opacity: 0, y: -8 }}
      initial={{ opacity: 0, y: 8 }}
      layout
      onClick={() => {
        onSelect(field.id);
      }}
      ref={ref}
    >
      <div className="-ml-1 cursor-grab p-0.5 active:cursor-grabbing">
        <GripVerticalIcon className="size-3.5 text-muted-foreground/30 transition-colors group-hover:text-muted-foreground/60" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-[13px] font-medium text-foreground">
            {field.label}
          </span>
          <span className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-muted-foreground/70 uppercase">
            {field.type}
          </span>
          {field.required && (
            <span className="size-1 shrink-0 rounded-full bg-primary" />
          )}
          {field.condition?.fieldId && (
            <EyeIcon className="size-3 shrink-0 text-accent/60" />
          )}
        </div>
      </div>

      <div className="flex gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onDuplicate(field.id);
          }}
          title="Duplicate"
        >
          <CopyIcon className="size-3" />
        </button>
        <button
          className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-accent hover:text-foreground"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(field.id);
          }}
        >
          <PencilIcon className="size-3" />
        </button>
        <button
          className="rounded-md p-1.5 text-muted-foreground/50 transition-colors hover:bg-destructive/10 hover:text-destructive"
          onClick={(event) => {
            event.stopPropagation();
            onRemove(field.id);
          }}
        >
          <Trash2Icon className="size-3" />
        </button>
      </div>
    </motion.div>
  );
};

export function FormCanvas({
  activeStepIndex,
  editingStepId,
  fields,
  multiStepEnabled,
  onAddStep,
  onDuplicate,
  onEditingStepChange,
  onRemove,
  onRemoveStep,
  onRenameStep,
  onSelect,
  onStepChange,
  selectedId,
  steps,
}: {
  activeStepIndex: number;
  editingStepId: null | string;
  fields: FormField[];
  multiStepEnabled: boolean;
  onAddStep: () => void;
  onDuplicate: (id: string) => void;
  onEditingStepChange: (id: null | string) => void;
  onRemove: (id: string) => void;
  onRemoveStep: (index: number) => void;
  onRenameStep: (index: number, title: string) => void;
  onSelect: (id: string) => void;
  onStepChange: (index: number) => void;
  selectedId: null | string;
  steps: FormStep[];
}) {
  const { isDropTarget, ref } = useDroppable({ id: "canvas" });
  const [renameValue, setRenameValue] = useState("");

  const startRename = (step: FormStep) => {
    onEditingStepChange(step.id);
    setRenameValue(step.title);
  };

  const commitRename = (index: number) => {
    if (renameValue.trim()) onRenameStep(index, renameValue.trim());
    onEditingStepChange(null);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      {/* Canvas header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-5 py-2.5">
        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground/60 uppercase">
          Canvas
        </span>
        <span className="font-mono text-[10px] text-muted-foreground/40">
          {fields.length} field{fields.length === 1 ? "" : "s"}
          {multiStepEnabled && ` · step ${activeStepIndex + 1}/${steps.length}`}
        </span>
      </div>

      {/* Step tabs */}
      {multiStepEnabled && (
        <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-background px-3 py-1.5">
          {steps.map((step, index) => (
            <div className="flex items-center" key={step.id}>
              {editingStepId === step.id ? (
                <input
                  autoFocus
                  className="w-24 rounded-md border border-primary/40 bg-muted px-2 py-1 font-mono text-xs text-foreground focus:outline-none"
                  onBlur={() => {
                    commitRename(index);
                  }}
                  onChange={(event) => {
                    setRenameValue(event.target.value);
                  }}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") commitRename(index);
                    if (event.key === "Escape") onEditingStepChange(null);
                  }}
                  value={renameValue}
                />
              ) : (
                <button
                  className={`group flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                    activeStepIndex === index
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                  onClick={() => {
                    onStepChange(index);
                  }}
                  onDoubleClick={() => {
                    startRename(step);
                  }}
                >
                  <span
                    className={`flex size-5 items-center justify-center rounded-full border text-[10px] font-bold ${
                      activeStepIndex === index
                        ? "border-primary/40 bg-primary/10"
                        : "border-border"
                    }`}
                  >
                    {index + 1}
                  </span>
                  {step.title}
                  {steps.length > 1 && (
                    <span
                      className="ml-0.5 opacity-0 transition-all group-hover:opacity-100 hover:text-destructive"
                      onClick={(event) => {
                        event.stopPropagation();
                        onRemoveStep(index);
                      }}
                    >
                      <XIcon className="size-3" />
                    </span>
                  )}
                </button>
              )}
            </div>
          ))}
          <Button
            className="size-7 text-muted-foreground/40 hover:text-primary"
            onClick={onAddStep}
            size="icon"
            variant="ghost"
          >
            <PlusIcon className="size-3.5" />
          </Button>
        </div>
      )}

      {/* Drop zone */}
      <div
        className={`flex-1 overflow-y-auto p-5 transition-colors ${isDropTarget ? "drop-zone-active" : ""}`}
        ref={ref}
      >
        {fields.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center">
            <div className="mb-3 flex size-14 items-center justify-center rounded-2xl border border-dashed border-border/80">
              <PlusIcon className="size-5 text-muted-foreground/30" />
            </div>
            <p className="text-sm font-medium text-muted-foreground/50">
              Drop fields here
            </p>
            {multiStepEnabled && (
              <p className="mt-1 text-[11px] text-muted-foreground/30">
                Adding to {steps[activeStepIndex]?.title}
              </p>
            )}
          </div>
        ) : (
          <div className="mx-auto max-w-lg space-y-1.5">
            <AnimatePresence>
              {fields.map((field, index) => (
                <SortableField
                  field={field}
                  index={index}
                  isSelected={selectedId === field.id}
                  key={field.id}
                  onDuplicate={onDuplicate}
                  onRemove={onRemove}
                  onSelect={onSelect}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
