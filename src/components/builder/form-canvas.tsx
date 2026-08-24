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

import type {
  AnyFieldDefinition,
  SectionDefinition,
  StepDefinition,
} from "@/types/form-definition";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

interface CanvasSection {
  section: SectionDefinition;
  stepIndex: number;
}

const plural = (count: number, noun: string) =>
  `${count} ${noun}${count === 1 ? "" : "s"}`;

const SectionCard = ({
  canRemove,
  entry,
  index,
  isSelected,
  onDuplicate,
  onRemove,
  onRemoveSection,
  onSelect,
  onSelectSection,
  selectedFieldId,
  startIndex,
}: {
  canRemove: boolean;
  entry: CanvasSection;
  index: number;
  isSelected: boolean;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveSection: (id: string) => void;
  onSelect: (id: string) => void;
  onSelectSection: (id: string) => void;
  selectedFieldId: null | string;
  startIndex: number;
}) => {
  // The section body is itself a drop target so fields can be dropped into
  // empty areas of another section, not only onto existing fields. It only
  // accepts palette items and fields; section drags target sibling cards.
  const { isDropTarget, ref } = useDroppable({
    accept: ["field", "palette"],
    id: entry.section.id,
  });

  const {
    handleRef,
    isDragging,
    ref: sortableRef,
  } = useSortable({
    accept: "section",
    group: "sections",
    id: `section:${entry.section.id}`,
    index,
    type: "section",
  });

  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border",
        isSelected ? "border-primary/40 shadow-sm" : "border-border/70",
        isDropTarget && !isSelected && "border-primary/40",
        isDragging && "z-50 opacity-40",
      )}
      onClick={() => {
        onSelectSection(entry.section.id);
      }}
      ref={sortableRef}
    >
      <Button
        className="group/header w-full cursor-grab rounded-none border-0 border-b border-border/70 active:cursor-grabbing"
        onClick={(event) => {
          event.stopPropagation();
          onSelectSection(entry.section.id);
        }}
        ref={handleRef}
        variant={isSelected ? "secondary" : "ghost"}
      >
        <span
          className={cn(
            "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold transition-colors",
            isSelected
              ? "border-primary/40 bg-primary/10 text-primary"
              : "border-border text-muted-foreground",
          )}
        >
          {index + 1}
        </span>
        <span
          className={cn(
            "min-w-0 flex-1 truncate",
            !entry.section.attributes.title &&
              "text-muted-foreground/40 italic",
          )}
        >
          {entry.section.attributes.title ?? `Section ${index + 1}`}
        </span>
        {canRemove && (
          <span
            className="-m-1 shrink-0 rounded-sm p-1 opacity-40 transition-opacity group-hover/header:opacity-100 hover:text-destructive active:bg-accent"
            onClick={(event) => {
              event.stopPropagation();
              onRemoveSection(entry.section.id);
            }}
          >
            <XIcon className="size-3" />
          </span>
        )}
      </Button>

      <div
        className={cn(
          "space-y-1.5 p-2.5 transition-colors",
          isDropTarget && !isSelected && "bg-primary/4",
        )}
        data-section-fields={entry.section.id}
        ref={ref}
      >
        {entry.section.fields.length === 0 ? (
          <div className="flex h-16 items-center justify-center rounded-lg border border-dashed border-border/60 text-[11px] text-muted-foreground/35">
            Drop fields here
          </div>
        ) : (
          entry.section.fields.map((field, fieldIndex) => (
            <SortableField
              field={field}
              index={startIndex + fieldIndex}
              isSelected={selectedFieldId === field.id}
              key={field.id}
              onDuplicate={onDuplicate}
              onRemove={onRemove}
              onSelect={onSelect}
            />
          ))
        )}
      </div>
    </div>
  );
};

const SortableField = ({
  field,
  index,
  isSelected,
  onDuplicate,
  onRemove,
  onSelect,
}: {
  field: AnyFieldDefinition;
  index: number;
  isSelected: boolean;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onSelect: (id: string) => void;
}) => {
  const { isDragging, ref } = useSortable({
    accept: "field",
    id: field.id,
    index,
    type: "field",
  });

  return (
    <div
      className={cn(
        "group flex cursor-pointer items-center gap-3 rounded-lg border p-3",
        isSelected
          ? "border-primary/40 bg-primary/6 shadow-[0_0_0_1px_hsl(217_91%_60%/0.1)]"
          : "border-border/60 bg-muted/50 hover:border-border hover:bg-accent",
        isDragging && "z-50 opacity-40",
      )}
      data-field-id={field.id}
      onClick={(event) => {
        event.stopPropagation();
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
            {field.attributes.label}
          </span>
          <span className="rounded-md bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] tracking-wide text-muted-foreground/70 uppercase">
            {field.type}
          </span>
          {field.attributes.required && (
            <span className="size-1 shrink-0 rounded-full bg-primary" />
          )}
          {(["disable", "hide", "show"] as const).some(
            (key) => field.conditions[key]?.conditions.length,
          ) && <EyeIcon className="size-3 shrink-0 text-accent/60" />}
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
    </div>
  );
};

const SortableStepTab = ({
  index,
  isActive,
  multiStepEnabled,
  onRemoveStep,
  onSelectStep,
  onStepChange,
  step,
}: {
  index: number;
  isActive: boolean;
  multiStepEnabled: boolean;
  onRemoveStep: (index: number) => void;
  onSelectStep: (id: string) => void;
  onStepChange: (index: number) => void;
  step: StepDefinition;
}) => {
  const { isDragging, ref } = useSortable({
    accept: "step",
    disabled: !multiStepEnabled,
    group: "steps",
    id: `step:${step.id}`,
    index,
    type: "step",
  });

  return (
    <Button
      className={cn("group max-w-44 min-w-0", isDragging && "z-50 opacity-40")}
      onClick={() => {
        onStepChange(index);
        onSelectStep(step.id);
      }}
      ref={ref}
      variant={isActive ? "secondary" : "outline"}
    >
      <span
        className={cn(
          "flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
          isActive ? "border-primary/40 bg-primary/10" : "border-border",
        )}
      >
        {index + 1}
      </span>
      <span
        className={cn(
          "min-w-0 truncate",
          !step.attributes.title && "text-muted-foreground/40 italic",
        )}
      >
        {step.attributes.title ?? `Step ${index + 1}`}
      </span>
      {multiStepEnabled && (
        <span
          className="-m-1 shrink-0 rounded-sm p-1 opacity-40 transition-opacity group-hover:opacity-100 hover:text-destructive active:bg-accent"
          onClick={(event) => {
            event.stopPropagation();
            onRemoveStep(index);
          }}
        >
          <XIcon className="size-3" />
        </span>
      )}
    </Button>
  );
};

export function FormCanvas({
  activeStepIndex,
  onAddSection,
  onAddStep,
  onDuplicate,
  onRemove,
  onRemoveSection,
  onRemoveStep,
  onSelect,
  onSelectSection,
  onSelectStep,
  onStepChange,
  sections,
  selectedId,
  selectedSectionId,
  steps,
}: {
  activeStepIndex: number;
  onAddSection: () => void;
  onAddStep: () => void;
  onDuplicate: (id: string) => void;
  onRemove: (id: string) => void;
  onRemoveSection: (id: string) => void;
  onRemoveStep: (index: number) => void;
  onSelect: (id: string) => void;
  onSelectSection: (id: string) => void;
  onSelectStep: (id: string) => void;
  onStepChange: (index: number) => void;
  sections: CanvasSection[];
  selectedId: null | string;
  selectedSectionId: null | string;
  steps: StepDefinition[];
}) {
  // Multi-step is derived from the model; a lone step renders as one quiet
  // tab chip that still selects the step for attribute editing.
  const multiStepEnabled = steps.length > 1;

  const totalFields = sections.reduce(
    (sum, entry) => sum + entry.section.fields.length,
    0,
  );

  // Sortable indexes must be unique across the whole droppable scope, so each
  // field gets its position within the flattened list of rendered sections.
  const offsets: number[] = [];
  let running = 0;
  for (const entry of sections) {
    offsets.push(running);
    running += entry.section.fields.length;
  }

  // A section can only be removed when its step keeps at least one section.
  const sectionCountsByStep = new Map<number, number>();
  for (const entry of sections) {
    sectionCountsByStep.set(
      entry.stepIndex,
      (sectionCountsByStep.get(entry.stepIndex) ?? 0) + 1,
    );
  }

  const sectionCards = (
    <div className="mx-auto max-w-lg space-y-5">
      {sections.map((entry, sectionIndex) => {
        return (
          <SectionCard
            canRemove={(sectionCountsByStep.get(entry.stepIndex) ?? 0) > 1}
            entry={entry}
            index={sectionIndex}
            isSelected={selectedSectionId === entry.section.id}
            key={entry.section.id}
            onDuplicate={onDuplicate}
            onRemove={onRemove}
            onRemoveSection={onRemoveSection}
            onSelect={onSelect}
            onSelectSection={onSelectSection}
            selectedFieldId={selectedId}
            startIndex={offsets[sectionIndex] ?? 0}
          />
        );
      })}
      <Button
        className="w-full border-dashed text-xs"
        onClick={(event) => {
          event.stopPropagation();
          onAddSection();
        }}
        variant="outline"
      >
        <PlusIcon className="size-3.5" />
        Add section
      </Button>
    </div>
  );

  const summaryParts = [
    `step ${activeStepIndex + 1}/${steps.length}`,
    plural(sections.length, "section"),
    plural(totalFields, "field"),
  ];

  return (
    <div className="flex h-full min-w-0 flex-1 flex-col">
      {/* Canvas header */}
      <div className="flex items-center justify-between border-b border-border bg-background px-5 py-2.5">
        <span className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
          Canvas
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {summaryParts.join(" · ")}
        </span>
      </div>

      {/* Step tabs; a single step stays selectable through its quiet chip */}
      <div className="flex items-center gap-1 overflow-x-auto border-b border-border bg-background px-3 py-1.5">
        {steps.map((step, index) => (
          <SortableStepTab
            index={index}
            isActive={activeStepIndex === index}
            key={step.id}
            multiStepEnabled={multiStepEnabled}
            onRemoveStep={onRemoveStep}
            onSelectStep={onSelectStep}
            onStepChange={onStepChange}
            step={step}
          />
        ))}
        <Button onClick={onAddStep} size="icon" variant="ghost">
          <PlusIcon className="size-3.5" />
        </Button>
      </div>

      {/* Drop zone */}
      <div className="flex-1 overflow-y-auto p-5">{sectionCards}</div>
    </div>
  );
}
