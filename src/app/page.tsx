"use client";

import type { DragEndEvent } from "@dnd-kit/react";

import { PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
  CircleCheckIcon,
  Code2Icon,
  Columns3Icon,
  EyeIcon,
  PanelLeftIcon,
  Redo2Icon,
  Settings2Icon,
  Undo2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { StructureNode } from "@/components/builder/structure-properties";
import type {
  AnyFieldDefinition,
  FieldType,
  FormDefinition,
  PersistedFormDefinition,
  SectionAttributes,
  StepAttributes,
} from "@/types/form-definition";

import { FieldPalette } from "@/components/builder/field-palette";
import { FieldProperties } from "@/components/builder/field-properties";
import { FormCanvas } from "@/components/builder/form-canvas";
import { FormPreview } from "@/components/builder/form-preview";
import { SchemaOutput } from "@/components/builder/schema-output";
import { StructureProperties } from "@/components/builder/structure-properties";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { cn } from "@/lib/cn";
import {
  addSection,
  addStep,
  appendField,
  appendFieldToSection,
  createDefaultDefinition,
  duplicateField,
  getAllFields,
  getField,
  moveField,
  moveFieldIntoSection,
  moveSection,
  moveStep,
  newField,
  normalizePersisted,
  removeField,
  removeSection,
  removeStep,
  updateField,
  updateSectionAttributes,
  updateStepAttributes,
} from "@/lib/form-definition";

interface BuilderSelection {
  id: string;
  kind: "field" | "section" | "step";
}

type MobilePanel = "canvas" | "output" | "palette" | "properties";
type RightPanel = "preview" | "schema";

const STORAGE_KEY = "form-builder-draft";
const AUTOSAVE_DELAY = 1500;

// Mouse drags need a small distance threshold so plain clicks (select,
// delete) are not swallowed by drag activation; touch and pen use a
// deliberate long-press instead, leaving native scrolling untouched until
// the drag engages.
const dragSensors = [
  PointerSensor.configure({
    activationConstraints(event) {
      if (event.pointerType === "mouse") {
        return [new PointerActivationConstraints.Distance({ value: 5 })];
      }
      return [
        new PointerActivationConstraints.Delay({ tolerance: 5, value: 250 }),
      ];
    },
  }),
];

const loadDraft = (): null | PersistedFormDefinition => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const normalized = normalizePersisted(JSON.parse(raw) as unknown);
    if (!normalized) return null;
    if (getAllFields(normalized).length === 0 && normalized.steps.length <= 1)
      return null;
    return normalized;
  } catch {
    return null;
  }
};

const saveDraft = (state: PersistedFormDefinition) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
};

const initialDefinition = createDefaultDefinition();

export default function BuilderPage() {
  const isMobile = useIsMobile();

  const {
    canRedo,
    canUndo,
    redo,
    resetHistory,
    set: setFormState,
    state: formState,
    undo,
  } = useUndoRedo<FormDefinition>(initialDefinition);

  // Multi-step is derived: a form is stepped exactly when it has more than
  // one step, so single-step forms never surface step chrome.
  const multiStepEnabled = formState.steps.length > 1;
  const steps = formState.steps;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selection, setSelection] = useState<BuilderSelection | null>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  useEffect(() => {
    const initialDraft = loadDraft();
    if (!initialDraft) return;
    resetHistory(initialDraft);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const skipAutosaveRef = useRef(true);
  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft({ ...formState, savedAt: Date.now() });
    }, AUTOSAVE_DELAY);
    return () => {
      clearTimeout(saveTimer.current);
    };
  }, [formState]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const module_ = event.metaKey || event.ctrlKey;
      if (!module_ || event.key.toLowerCase() !== "z") return;
      const tag = (event.target as HTMLElement).tagName;
      if (["INPUT", "SELECT", "TEXTAREA"].includes(tag)) return;
      event.preventDefault();
      if (event.shiftKey) {
        redo();
      } else {
        undo();
      }
    };
    globalThis.addEventListener("keydown", handler);
    return () => {
      globalThis.removeEventListener("keydown", handler);
    };
  }, [undo, redo]);

  const allFields = getAllFields(formState);

  // Sections rendered on the canvas: only the active step's when multi-step
  // is on, otherwise every step's sections flattened in order.
  const renderedSections = multiStepEnabled
    ? (formState.steps[activeStepIndex]?.sections ?? []).map((section) => ({
        section,
        stepIndex: activeStepIndex,
      }))
    : formState.steps.flatMap((step, stepIndex) =>
        step.sections.map((section) => ({ section, stepIndex })),
      );

  const renderedFields = renderedSections.flatMap(
    (entry) => entry.section.fields,
  );

  const selectedField =
    selection?.kind === "field"
      ? (getField(formState, selection.id) ?? null)
      : null;

  const selectedNode: null | StructureNode = (() => {
    if (!selection || selection.kind === "field") return null;
    if (selection.kind === "step") {
      const index = steps.findIndex(
        (candidate) => candidate.id === selection.id,
      );
      const step = steps[index];
      return step
        ? {
            attributes: step.attributes,
            id: step.id,
            index,
            kind: "step",
            stepCount: steps.length,
          }
        : null;
    }
    for (const step of steps) {
      const section = step.sections.find(
        (candidate) => candidate.id === selection.id,
      );
      if (section) {
        return {
          attributes: section.attributes,
          id: section.id,
          kind: "section",
        };
      }
    }
    return null;
  })();

  const selectField = useCallback(
    (id: null | string) => {
      setSelection(id ? { id, kind: "field" } : null);
      if (isMobile && id && mobilePanel === "canvas") {
        setMobilePanel("properties");
      }
    },
    [isMobile, mobilePanel],
  );

  const selectSection = useCallback(
    (id: string) => {
      setSelection({ id, kind: "section" });
      if (isMobile && mobilePanel === "canvas") {
        setMobilePanel("properties");
      }
    },
    [isMobile, mobilePanel],
  );

  const selectStep = useCallback(
    (id: string) => {
      setSelection({ id, kind: "step" });
      if (isMobile && mobilePanel === "canvas") {
        setMobilePanel("properties");
      }
    },
    [isMobile, mobilePanel],
  );

  const handleMoveStep = useCallback(
    (fromIndex: number, toIndex: number) => {
      setFormState((previous) => moveStep(previous, fromIndex, toIndex));
      // Keep editing the same step after it lands in its new position.
      setActiveStepIndex((previous) => {
        if (fromIndex === previous)
          return Math.min(Math.max(toIndex, 0), steps.length - 1);
        if (fromIndex < previous && toIndex >= previous) return previous - 1;
        if (fromIndex > previous && toIndex <= previous) return previous + 1;
        return previous;
      });
    },
    [setFormState, steps.length],
  );

  const handleMoveSection = useCallback(
    (stepIndex: number, fromIndex: number, toIndex: number) => {
      setFormState((previous) =>
        moveSection(previous, stepIndex, fromIndex, toIndex),
      );
    },
    [setFormState],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;
      const { source, target } = event.operation;
      if (!source) return;

      const sectionIds = new Set(
        renderedSections.map((entry) => entry.section.id),
      );
      const targetId = target == null ? null : String(target.id);
      const droppedOnSection =
        targetId !== null && !isSortable(target) && sectionIds.has(targetId);

      if (String(source.id).startsWith("palette-")) {
        const type = source.data["type"] as FieldType | undefined;
        if (!type) return;
        const field = newField(type);
        if (targetId !== null && droppedOnSection) {
          // Palette drop aimed at a specific section body.
          setFormState((previous) =>
            appendFieldToSection(previous, targetId, field),
          );
        } else {
          setFormState((previous) =>
            appendField(previous, activeStepIndex, field),
          );
        }
        selectField(field.id);
        return;
      }

      // Step tabs and section cards sort within their own groups; their
      // indexes map directly onto model positions.
      const sourceId = String(source.id);
      if (sourceId.startsWith("step:")) {
        if (!isSortable(source) || !isSortable(target)) return;
        const { index, initialIndex } = source;
        if (initialIndex === index) return;
        handleMoveStep(initialIndex, index);
        return;
      }
      if (sourceId.startsWith("section:")) {
        if (!isSortable(source) || !isSortable(target)) return;
        const entry = renderedSections.find(
          (item) => `section:${item.section.id}` === sourceId,
        );
        if (!entry) return;
        const { index, initialIndex } = source;
        if (initialIndex === index) return;
        handleMoveSection(entry.stepIndex, initialIndex, index);
        return;
      }

      if (!isSortable(source)) return;
      const fieldId = sourceId;

      // The optimistic sorting plugin physically reparents nodes (and shifts
      // siblings between sections) while hovering. Return every field node to
      // its React-managed container before committing state so reconciliation
      // never touches a node living under the wrong parent (NotFoundError).
      for (const entry of renderedSections) {
        const container = document.querySelector(
          `[data-section-fields="${CSS.escape(entry.section.id)}"]`,
        );
        if (!container) continue;
        for (const field of entry.section.fields) {
          const node = document.querySelector(
            `[data-field-id="${CSS.escape(field.id)}"]`,
          );
          if (node && !container.contains(node)) {
            container.append(node);
          }
        }
      }

      if (targetId !== null && droppedOnSection) {
        // Field drop on a section body rather than on another field.
        setFormState((previous) =>
          moveFieldIntoSection(previous, fieldId, targetId),
        );
        return;
      }

      // Drop onto another field: resolve positions by id instead of sortable
      // indexes, which drift from the rendered list once a drag crosses
      // section boundaries.
      if (targetId === null || targetId === fieldId) return;
      if (!renderedFields.some((field) => field.id === targetId)) return;
      setFormState((previous) => moveField(previous, fieldId, targetId));
    },
    [
      activeStepIndex,
      handleMoveSection,
      handleMoveStep,
      renderedFields,
      renderedSections,
      setFormState,
      selectField,
    ],
  );

  const handleRemove = useCallback(
    (id: string) => {
      setFormState((previous) => removeField(previous, id));
      if (selection?.kind === "field" && selection.id === id) {
        setSelection(null);
      }
    },
    [selection, setFormState],
  );

  const handleRemoveSection = useCallback(
    (id: string) => {
      const removed = renderedSections.find(
        (entry) => entry.section.id === id,
      )?.section;
      setFormState((previous) => removeSection(previous, id));
      if (
        removed &&
        selection &&
        (selection.kind === "section"
          ? selection.id === removed.id
          : selection.kind === "field" &&
            removed.fields.some((field) => field.id === selection.id))
      ) {
        setSelection(null);
      }
    },
    [renderedSections, selection, setFormState],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      setFormState((previous) => duplicateField(previous, id));
    },
    [setFormState],
  );

  const handleFieldChange = useCallback(
    (
      id: string,
      updater: (field: AnyFieldDefinition) => AnyFieldDefinition,
    ) => {
      setFormState((previous) => updateField(previous, id, updater));
    },
    [setFormState],
  );

  const handleAddStep = useCallback(() => {
    const next = addStep(formState);
    setFormState(next);
    const created = next.steps.at(-1);
    if (!created) return;
    setActiveStepIndex(next.steps.length - 1);
    selectStep(created.id);
  }, [formState, selectStep, setFormState]);

  const handleAddSection = useCallback(() => {
    const next = addSection(formState, activeStepIndex);
    setFormState(next);
    const created = next.steps[activeStepIndex]?.sections.at(-1);
    if (!created) return;
    selectSection(created.id);
  }, [activeStepIndex, formState, selectSection, setFormState]);

  const handleRemoveStep = useCallback(
    (index: number) => {
      if (steps.length <= 1) return;
      const removed = steps[index];
      setFormState((previous) => removeStep(previous, index));
      setActiveStepIndex((previous) => Math.min(previous, steps.length - 2));
      if (
        removed &&
        selection &&
        (selection.kind === "step"
          ? selection.id === removed.id
          : removed.sections.some(
              (section) =>
                section.id === selection.id ||
                section.fields.some((field) => field.id === selection.id),
            ))
      ) {
        setSelection(null);
      }
    },
    [selection, setFormState, steps],
  );

  const handleStructureChange = useCallback(
    (_id: string, patch: SectionAttributes | StepAttributes) => {
      if (!selection || selection.kind === "field") return;
      const { id, kind } = selection;
      setFormState((previous) =>
        kind === "step"
          ? updateStepAttributes(previous, id, patch)
          : updateSectionAttributes(previous, id, patch),
      );
    },
    [selection, setFormState],
  );

  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    resetHistory(createDefaultDefinition());
    setActiveStepIndex(0);
    setSelection(null);
  }, [resetHistory]);

  const canComplete = allFields.length > 0;

  const handleComplete = useCallback(() => {
    if (!canComplete) return;
  }, [canComplete]);

  const handleTapAdd = useCallback(
    (type: FieldType) => {
      const field = newField(type);
      setFormState((previous) => appendField(previous, activeStepIndex, field));
      selectField(field.id);
      setMobilePanel("canvas");
    },
    [activeStepIndex, setFormState, selectField],
  );

  const mobileTabs: {
    icon: React.FC<{ className?: string }>;
    key: MobilePanel;
    label: string;
  }[] = [
    { icon: PanelLeftIcon, key: "palette", label: "Fields" },
    { icon: Columns3Icon, key: "canvas", label: "Canvas" },
    { icon: Settings2Icon, key: "properties", label: "Props" },
    { icon: EyeIcon, key: "output", label: "Preview" },
  ];

  const renderProperties = (fullWidth?: boolean) => {
    if (selectedField) {
      return (
        <FieldProperties
          allFields={allFields}
          field={selectedField}
          fullWidth={fullWidth}
          onChange={handleFieldChange}
        />
      );
    }
    if (selectedNode) {
      return (
        <StructureProperties
          fullWidth={fullWidth}
          node={selectedNode}
          onChange={handleStructureChange}
        />
      );
    }
    return (
      <FieldProperties
        allFields={allFields}
        field={null}
        fullWidth={fullWidth}
        onChange={handleFieldChange}
      />
    );
  };

  return (
    <div className="relative flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-2 md:px-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <span className="font-mono text-[13px] font-semibold text-foreground">
            form-builder
          </span>

          {/* Undo/Redo */}
          <div className="ml-1 flex items-center gap-0.5">
            <Button
              className={cn(!canUndo && "text-muted-foreground/60")}
              disabled={!canUndo}
              onClick={undo}
              size="icon-xs"
              variant="ghost"
            >
              <Undo2Icon className="size-3.5" />
            </Button>
            <Button
              className={cn(!canRedo && "text-muted-foreground/60")}
              disabled={!canRedo}
              onClick={redo}
              size="icon-xs"
              variant="ghost"
            >
              <Redo2Icon className="size-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5">
          <Button onClick={handleClearDraft} size="xs" variant="destructive">
            Clear
          </Button>

          {/* Desktop-only: Preview sheet */}
          {!isMobile && (
            <Sheet>
              <SheetTrigger
                render={
                  <Button size="xs" variant="outline">
                    <EyeIcon className="size-3.5" />
                    Preview
                  </Button>
                }
              />
              <SheetContent className="flex flex-col p-0" side="right">
                <SheetHeader className="border-b px-4 py-3">
                  <SheetTitle>Preview</SheetTitle>
                  <div className="flex w-fit items-center rounded-lg bg-muted/50 p-0.5">
                    {[
                      {
                        icon: EyeIcon,
                        key: "preview" as RightPanel,
                        label: "UI",
                      },
                      {
                        icon: Code2Icon,
                        key: "schema" as RightPanel,
                        label: "Schema",
                      },
                    ].map(({ icon: Icon, key, label }) => (
                      <button
                        className={cn(
                          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
                          rightPanel === key
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground/50 hover:text-foreground",
                        )}
                        key={key}
                        onClick={() => {
                          setRightPanel(key);
                        }}
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  {rightPanel === "schema" ? (
                    <SchemaOutput definition={formState} />
                  ) : (
                    <FormPreview definition={formState} />
                  )}
                </div>
              </SheetContent>
            </Sheet>
          )}

          {/* Done */}
          <button
            className="flex items-center gap-1 rounded-md bg-primary px-2 py-1 font-mono text-[11px] text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-40"
            disabled={!canComplete}
            onClick={handleComplete}
            title={canComplete ? undefined : "Add at least one field"}
          >
            <CircleCheckIcon className="size-3" />
            Done
          </button>
        </div>
      </header>

      {/* Main content */}
      {isMobile ? (
        /* ─── Mobile layout: single panel at a time ─── */
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full animate-in duration-150 fade-in slide-in-from-right-4"
              key={mobilePanel}
            >
              {mobilePanel === "palette" && (
                <div className="h-full">
                  <FieldPalette fullWidth onTapAdd={handleTapAdd} />
                </div>
              )}
              {mobilePanel === "canvas" && (
                <DragDropProvider
                  onDragEnd={handleDragEnd}
                  sensors={dragSensors}
                >
                  <FormCanvas
                    activeStepIndex={activeStepIndex}
                    onAddSection={handleAddSection}
                    onAddStep={handleAddStep}
                    onDuplicate={handleDuplicate}
                    onRemove={handleRemove}
                    onRemoveSection={handleRemoveSection}
                    onRemoveStep={handleRemoveStep}
                    onSelect={selectField}
                    onSelectSection={selectSection}
                    onSelectStep={selectStep}
                    onStepChange={setActiveStepIndex}
                    sections={renderedSections}
                    selectedId={
                      selection?.kind === "field" ? selection.id : null
                    }
                    selectedSectionId={
                      selection?.kind === "section" ? selection.id : null
                    }
                    steps={steps}
                  />
                  <DragOverlay>
                    {(source) => {
                      const id = String(source.id);
                      if (id.startsWith("palette-")) {
                        return (
                          <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
                            {id.replace("palette-", "")}
                          </div>
                        );
                      }
                      const stepIndex = steps.findIndex(
                        (item) => `step:${item.id}` === id,
                      );
                      if (stepIndex !== -1) {
                        return (
                          <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
                            {steps[stepIndex]?.attributes.title ??
                              `Step ${stepIndex + 1}`}
                          </div>
                        );
                      }
                      const entry = renderedSections.find(
                        (item) => `section:${item.section.id}` === id,
                      );
                      if (!entry) return null;
                      const sectionIndex = renderedSections
                        .filter((item) => item.stepIndex === entry.stepIndex)
                        .indexOf(entry);
                      return (
                        <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
                          {entry.section.attributes.title ??
                            `Section ${sectionIndex + 1}`}
                        </div>
                      );
                    }}
                  </DragOverlay>
                </DragDropProvider>
              )}
              {mobilePanel === "properties" && (
                <div className="h-full overflow-y-auto">
                  {renderProperties(true)}
                </div>
              )}
              {mobilePanel === "output" && (
                <div className="flex h-full flex-col">
                  {/* Mini toggle for preview/schema on mobile */}
                  <div className="flex items-center gap-1 border-b border-border bg-background p-2">
                    {[
                      {
                        icon: EyeIcon,
                        key: "preview" as RightPanel,
                        label: "Preview",
                      },
                      {
                        icon: Code2Icon,
                        key: "schema" as RightPanel,
                        label: "Schema",
                      },
                    ].map(({ icon: Icon, key, label }) => (
                      <button
                        className={cn(
                          "flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all",
                          rightPanel === key
                            ? "bg-background text-foreground shadow-sm"
                            : "text-muted-foreground/50 hover:text-foreground",
                        )}
                        key={key}
                        onClick={() => {
                          setRightPanel(key);
                        }}
                      >
                        <Icon className="size-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="flex-1 overflow-y-auto">
                    {rightPanel === "preview" ? (
                      <FormPreview definition={formState} />
                    ) : (
                      <SchemaOutput definition={formState} />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Bottom tab bar */}
          <nav className="flex shrink-0 items-center border-t border-border bg-background">
            {mobileTabs.map(({ icon: Icon, key, label }) => (
              <button
                className={cn(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                  mobilePanel === key
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground",
                )}
                key={key}
                onClick={() => {
                  setMobilePanel(key);
                }}
              >
                <Icon className="size-4" />
                <span className="text-[10px] font-medium">{label}</span>
                {mobilePanel === key && (
                  <div className="mt-0.5 h-0.5 w-4 animate-in rounded-full bg-primary duration-150 zoom-in-50 fade-in" />
                )}
              </button>
            ))}
          </nav>
        </div>
      ) : (
        /* ─── Desktop layout: side-by-side panels ─── */
        <div className="flex flex-1 overflow-hidden">
          <DragDropProvider onDragEnd={handleDragEnd} sensors={dragSensors}>
            <FieldPalette />
            <FormCanvas
              activeStepIndex={activeStepIndex}
              onAddSection={handleAddSection}
              onAddStep={handleAddStep}
              onDuplicate={handleDuplicate}
              onRemove={handleRemove}
              onRemoveSection={handleRemoveSection}
              onRemoveStep={handleRemoveStep}
              onSelect={selectField}
              onSelectSection={selectSection}
              onSelectStep={selectStep}
              onStepChange={setActiveStepIndex}
              sections={renderedSections}
              selectedId={selection?.kind === "field" ? selection.id : null}
              selectedSectionId={
                selection?.kind === "section" ? selection.id : null
              }
              steps={steps}
            />
            <DragOverlay>
              {(source) => {
                const id = String(source.id);
                if (id.startsWith("palette-")) {
                  return (
                    <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
                      {id.replace("palette-", "")}
                    </div>
                  );
                }
                const stepIndex = steps.findIndex(
                  (item) => `step:${item.id}` === id,
                );
                if (stepIndex !== -1) {
                  return (
                    <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
                      {steps[stepIndex]?.attributes.title ??
                        `Step ${stepIndex + 1}`}
                    </div>
                  );
                }
                const entry = renderedSections.find(
                  (item) => `section:${item.section.id}` === id,
                );
                if (!entry) return null;
                const sectionIndex = renderedSections
                  .filter((item) => item.stepIndex === entry.stepIndex)
                  .indexOf(entry);
                return (
                  <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
                    {entry.section.attributes.title ??
                      `Section ${sectionIndex + 1}`}
                  </div>
                );
              }}
            </DragOverlay>
          </DragDropProvider>

          {renderProperties()}
        </div>
      )}
    </div>
  );
}
