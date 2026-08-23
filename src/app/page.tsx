"use client";

import type { DragEndEvent } from "@dnd-kit/react";

import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import { isSortable } from "@dnd-kit/react/sortable";
import {
  Code2Icon,
  Columns3Icon,
  EyeIcon,
  LayersIcon,
  ListOrderedIcon,
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
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
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
  resetIdCounters,
  syncIdCounters,
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
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  useEffect(() => {
    const initialDraft = loadDraft();
    if (!initialDraft) return;
    let maxField = 0;
    let maxStep = 0;
    for (const field of getAllFields(initialDraft)) {
      const n = /^field_(\d+)/.exec(field.id);
      if (n?.[1]) maxField = Math.max(maxField, Number.parseInt(n[1], 10));
    }
    for (const step of initialDraft.steps) {
      const n = /^step_(\d+)/.exec(step.id);
      if (n?.[1]) maxStep = Math.max(maxStep, Number.parseInt(n[1], 10));
    }
    syncIdCounters({ field: maxField, step: maxStep });
    resetHistory(initialDraft);
    const ago = Date.now() - initialDraft.savedAt;
    let agoText = "just now";
    if (ago >= 3_600_000) {
      agoText = `${Math.floor(ago / 3_600_000)}h ago`;
    } else if (ago >= 60_000) {
      agoText = `${Math.floor(ago / 60_000)}m ago`;
    }
    const fieldTotal = getAllFields(initialDraft).length;
    toast.add({
      description: `${fieldTotal} field${fieldTotal === 1 ? "" : "s"} recovered (${agoText}).`,
      title: "Draft restored",
    });
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
      setSaveStatus("saved");
      setTimeout(() => {
        setSaveStatus("idle");
      }, 2000);
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

  const selectStep = useCallback((id: string) => {
    setSelection({ id, kind: "step" });
  }, []);

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
      if (!isSortable(source)) return;
      const fieldId = String(source.id);

      // The optimistic sorting plugin physically reparents the dragged node
      // next to the hovered target during dragover and leaves it there after
      // a successful drop. Restore it to its React-managed container first so
      // the upcoming state commit does not fail on a stale parent
      // (NotFoundError: Failed to execute 'removeChild').
      const draggedNode = document.querySelector(
        `[data-field-id="${CSS.escape(fieldId)}"]`,
      );
      const homeEntry = renderedSections.find((entry) =>
        entry.section.fields.some((field) => field.id === fieldId),
      );
      const homeContainer = homeEntry
        ? document.querySelector(
            `[data-section-fields="${CSS.escape(homeEntry.section.id)}"]`,
          )
        : null;
      if (
        draggedNode &&
        homeContainer &&
        !homeContainer.contains(draggedNode)
      ) {
        homeContainer.append(draggedNode);
      }

      if (targetId !== null && droppedOnSection) {
        // Field drop on a section body rather than on another field.
        setFormState((previous) =>
          moveFieldIntoSection(previous, fieldId, targetId),
        );
        return;
      }

      const { index, initialIndex } = source;
      if (initialIndex === index) return;
      // Sortable indexes refer to the flattened list of rendered sections;
      // map both positions back to global field ids before reordering.
      const fromId = renderedFields[initialIndex]?.id;
      const toId = renderedFields[index]?.id;
      if (!fromId || !toId || fromId === toId) return;
      setFormState((previous) => moveField(previous, fromId, toId));
    },
    [
      activeStepIndex,
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
    setFormState(addStep);
    setActiveStepIndex(steps.length);
    setSelection(null);
  }, [setFormState, steps.length]);

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
    resetIdCounters();
    resetHistory(createDefaultDefinition());
    setActiveStepIndex(0);
    setSelection(null);
    toast.add({ description: "Started fresh.", title: "Draft cleared" });
  }, [resetHistory]);

  const handleTapAdd = useCallback(
    (type: FieldType) => {
      const field = newField(type);
      setFormState((previous) => appendField(previous, activeStepIndex, field));
      selectField(field.id);
      setMobilePanel("canvas");
      toast.add({
        description: "Tap to edit properties.",
        title: `${field.attributes.label} added`,
      });
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
          <div className="flex items-center gap-1.5">
            <LayersIcon className="size-3.5 text-primary" />
            <span className="font-mono text-[13px] font-semibold text-foreground">
              form-builder
            </span>
          </div>

          <Separator className="hidden h-4 md:block" orientation="vertical" />

          {/* Save indicator */}
          <div className="flex items-center gap-1">
            <div
              className={cn(
                "size-1.5 rounded-full transition-colors",
                saveStatus === "saved"
                  ? "bg-primary"
                  : "bg-muted-foreground/20",
              )}
            />
            <span
              className={cn(
                "hidden font-mono text-[10px] transition-colors sm:inline",
                saveStatus === "saved"
                  ? "text-primary/70"
                  : "text-muted-foreground/30",
              )}
            >
              {saveStatus === "saved" ? "saved" : ""}
            </span>
          </div>

          {/* Undo/Redo */}
          <div className="ml-1 flex items-center gap-0.5">
            <button
              className={cn(
                "rounded-md p-1 transition-colors",
                canUndo
                  ? "text-muted-foreground/60 hover:bg-accent hover:text-foreground"
                  : "cursor-not-allowed text-muted-foreground/15",
              )}
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2Icon className="size-3.5" />
            </button>
            <button
              className={cn(
                "rounded-md p-1 transition-colors",
                canRedo
                  ? "text-muted-foreground/60 hover:bg-accent hover:text-foreground"
                  : "cursor-not-allowed text-muted-foreground/15",
              )}
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2Icon className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1 md:gap-1.5">
          <button
            className="rounded-md px-2 py-1 font-mono text-[11px] text-muted-foreground/40 transition-colors hover:bg-destructive/5 hover:text-destructive"
            onClick={handleClearDraft}
          >
            Clear
          </button>

          <Separator className="hidden h-4 sm:block" orientation="vertical" />

          <button
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/60 transition-all hover:bg-accent hover:text-foreground md:px-2.5"
            onClick={handleAddStep}
          >
            <ListOrderedIcon className="size-3.5" />
            <span className="hidden sm:inline">Add step</span>
          </button>

          {/* Desktop-only: Preview/Schema toggle */}
          {!isMobile && (
            <>
              <Separator className="h-4" orientation="vertical" />
              <div className="flex items-center rounded-lg bg-muted/50 p-0.5">
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
            </>
          )}
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
                <DragDropProvider onDragEnd={handleDragEnd}>
                  <FormCanvas
                    activeStepIndex={activeStepIndex}
                    onAddSection={handleAddSection}
                    onAddStep={handleAddStep}
                    onDuplicate={handleDuplicate}
                    onMoveSection={handleMoveSection}
                    onMoveStep={handleMoveStep}
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
                    {(source) =>
                      String(source.id).startsWith("palette-") ? (
                        <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground shadow-glow">
                          {String(source.id).replace("palette-", "")}
                        </div>
                      ) : null
                    }
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
          <DragDropProvider onDragEnd={handleDragEnd}>
            <FieldPalette />
            <FormCanvas
              activeStepIndex={activeStepIndex}
              onAddSection={handleAddSection}
              onAddStep={handleAddStep}
              onDuplicate={handleDuplicate}
              onMoveSection={handleMoveSection}
              onMoveStep={handleMoveStep}
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
              {(source) =>
                String(source.id).startsWith("palette-") ? (
                  <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground shadow-glow">
                    {String(source.id).replace("palette-", "")}
                  </div>
                ) : null
              }
            </DragOverlay>
          </DragDropProvider>

          {renderProperties()}

          <div className="flex w-90 min-w-0 flex-col border-l border-border bg-background">
            <div className="flex min-h-0 flex-1 flex-col">
              {rightPanel === "preview" ? (
                <FormPreview definition={formState} />
              ) : (
                <SchemaOutput definition={formState} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
