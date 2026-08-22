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
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FieldType, FormField, FormStep } from "@/types/form";

import { FieldPalette } from "@/components/builder/field-palette";
import { FieldProperties } from "@/components/builder/field-properties";
import { FormCanvas } from "@/components/builder/form-canvas";
import { FormPreview } from "@/components/builder/form-preview";
import { SchemaOutput } from "@/components/builder/schema-output";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/components/ui/toast";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUndoRedo } from "@/hooks/use-undo-redo";

type MobilePanel = "canvas" | "output" | "palette" | "properties";
type RightPanel = "preview" | "schema";

const STORAGE_KEY = "form-builder-draft";
const AUTOSAVE_DELAY = 1500;

interface DraftState extends FormState {
  savedAt: number;
}

interface FormState {
  fields: FormField[];
  multiStepEnabled: boolean;
  steps: FormStep[];
}

let fieldCounter = 0;

const createField = (type: FieldType, step: number): FormField => {
  fieldCounter++;
  const labels: Record<FieldType, string> = {
    checkbox: "Checkbox",
    color: "Color Picker",
    date: "Date",
    datetime: "Date & Time",
    email: "Email",
    file: "File Upload",
    heading: "Section Heading",
    hidden: "Hidden Field",
    number: "Number",
    paragraph: "Description",
    password: "Password",
    phone: "Phone",
    radio: "Radio Group",
    rating: "Rating",
    select: "Dropdown",
    separator: "Divider",
    slider: "Slider",
    text: "Text Field",
    textarea: "Message",
    time: "Time",
    toggle: "Toggle",
    url: "URL",
  };
  return {
    id: `field_${fieldCounter}_${Date.now()}`,
    label: labels[type] || "Field",
    options:
      type === "select" || type === "radio"
        ? ["Option 1", "Option 2", "Option 3"]
        : undefined,
    placeholder: `Enter ${labels[type].toLowerCase()}...`,
    required: false,
    step,
    type,
  };
};

let stepCounter = 0;
const createStep = (): FormStep => {
  stepCounter++;
  return {
    fieldIds: [],
    id: `step_${stepCounter}_${Date.now()}`,
    title: `Step ${stepCounter}`,
  };
};

const loadDraft = (): DraftState | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as DraftState;
    if (draft.fields.length > 0 || draft.steps.length > 1) return draft;
    return null;
  } catch {
    return null;
  }
};

const saveDraft = (state: DraftState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    return;
  }
};

const defaultStep = createStep();

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
  } = useUndoRedo<FormState>({
    fields: [],
    multiStepEnabled: false,
    steps: [defaultStep],
  });
  const { fields, multiStepEnabled, steps } = formState;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview");
  const [editingStepId, setEditingStepId] = useState<null | string>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  useEffect(() => {
    const initialDraft = loadDraft();
    if (!initialDraft) return;
    let maxField = fieldCounter;
    let maxStep = stepCounter;
    for (const f of initialDraft.fields) {
      const n = /^field_(\d+)/.exec(f.id);
      if (n?.[1]) maxField = Math.max(maxField, Number.parseInt(n[1], 10));
    }
    for (const s of initialDraft.steps) {
      const n = /^step_(\d+)/.exec(s.id);
      if (n?.[1]) maxStep = Math.max(maxStep, Number.parseInt(n[1], 10));
    }
    fieldCounter = maxField;
    stepCounter = maxStep;
    resetHistory({
      fields: initialDraft.fields,
      multiStepEnabled: initialDraft.multiStepEnabled,
      steps: initialDraft.steps,
    });
    const ago = Date.now() - initialDraft.savedAt;
    let agoText = "just now";
    if (ago >= 3_600_000) {
      agoText = `${Math.floor(ago / 3_600_000)}h ago`;
    } else if (ago >= 60_000) {
      agoText = `${Math.floor(ago / 60_000)}m ago`;
    }
    toast.add({
      description: `${initialDraft.fields.length} field${initialDraft.fields.length === 1 ? "" : "s"} recovered (${agoText}).`,
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

  const currentStepFields = multiStepEnabled
    ? fields.filter((f) => f.step === activeStepIndex)
    : fields;
  const selectedField = fields.find((f) => f.id === selectedId) ?? null;

  const updateFields = useCallback(
    (updater: (fields: FormField[]) => FormField[]) => {
      setFormState((previous) => ({
        ...previous,
        fields: updater(previous.fields),
      }));
    },
    [setFormState],
  );

  const updateSteps = useCallback(
    (updater: (steps: FormStep[]) => FormStep[]) => {
      setFormState((previous) => ({
        ...previous,
        steps: updater(previous.steps),
      }));
    },
    [setFormState],
  );

  const selectField = useCallback(
    (id: null | string) => {
      setSelectedId(id);
      if (isMobile && id && mobilePanel === "canvas") {
        setMobilePanel("properties");
      }
    },
    [isMobile, mobilePanel],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      if (event.canceled) return;
      const { source } = event.operation;
      if (!source) return;
      if (String(source.id).startsWith("palette-")) {
        const type = source.data["type"] as FieldType | undefined;
        if (type) {
          const f = createField(type, activeStepIndex);
          updateFields((p) => [...p, f]);
          selectField(f.id);
        }
        return;
      }
      if (!isSortable(source)) return;
      const { index, initialIndex } = source;
      if (initialIndex === index) return;
      // Sortable indexes refer to the filtered current-step list; map both
      // positions back to global field ids before reordering.
      const fromId = currentStepFields[initialIndex]?.id;
      const toId = currentStepFields[index]?.id;
      if (!fromId || !toId || fromId === toId) return;
      updateFields((previous) => {
        const oi = previous.findIndex((f) => f.id === fromId);
        const ni = previous.findIndex((f) => f.id === toId);
        if (oi === -1 || ni === -1) return previous;
        const next = [...previous];
        const [moved] = next.splice(oi, 1);
        if (!moved) return previous;
        next.splice(ni, 0, moved);
        return next;
      });
    },
    [activeStepIndex, currentStepFields, updateFields, selectField],
  );

  const handleRemove = useCallback(
    (id: string) => {
      updateFields((p) => p.filter((f) => f.id !== id));
      if (selectedId === id) selectField(null);
    },
    [selectedId, updateFields, selectField],
  );
  const handleDuplicate = useCallback(
    (id: string) => {
      updateFields((previous) => {
        const index = previous.findIndex((f) => f.id === id);
        if (index === -1) return previous;
        const source = previous[index];
        if (!source) return previous;
        fieldCounter++;
        const clone = {
          ...source,
          id: `field_${fieldCounter}_${Date.now()}`,
          label: `${source.label} (copy)`,
        };
        const next = [...previous];
        next.splice(index + 1, 0, clone);
        return next;
      });
    },
    [updateFields],
  );
  const handleFieldChange = useCallback(
    (id: string, u: Partial<FormField>) => {
      updateFields((p) => p.map((f) => (f.id === id ? { ...f, ...u } : f)));
    },
    [updateFields],
  );
  const handleAddStep = useCallback(() => {
    const s = createStep();
    updateSteps((p) => [...p, s]);
    setActiveStepIndex(steps.length);
  }, [updateSteps, steps.length]);

  const handleRemoveStep = useCallback(
    (index: number) => {
      if (steps.length <= 1) return;
      setFormState((previous) => ({
        ...previous,
        fields: previous.fields
          .filter((f) => f.step !== index)
          .map((f) => ({
            ...f,
            step: f.step !== undefined && f.step > index ? f.step - 1 : f.step,
          })),
        steps: previous.steps.filter((_, index_) => index_ !== index),
      }));
      setActiveStepIndex((p) => Math.min(p, steps.length - 2));
    },
    [steps.length, setFormState],
  );

  const handleRenameStep = useCallback(
    (index: number, t: string) => {
      updateSteps((p) =>
        p.map((s, index_) => (index_ === index ? { ...s, title: t } : s)),
      );
    },
    [updateSteps],
  );

  const toggleMultiStep = useCallback(() => {
    setFormState((previous) => {
      const enabled = !previous.multiStepEnabled;
      return {
        ...previous,
        fields: enabled
          ? previous.fields.map((f) => ({ ...f, step: 0 }))
          : previous.fields,
        multiStepEnabled: enabled,
        steps:
          enabled && previous.steps.length === 0
            ? [createStep()]
            : previous.steps,
      };
    });
    setActiveStepIndex(0);
  }, [setFormState]);

  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    stepCounter = 0;
    fieldCounter = 0;
    resetHistory({
      fields: [],
      multiStepEnabled: false,
      steps: [createStep()],
    });
    setActiveStepIndex(0);
    selectField(null);
    toast.add({ description: "Started fresh.", title: "Draft cleared" });
  }, [resetHistory, selectField]);

  const handleTapAdd = useCallback(
    (type: FieldType) => {
      const f = createField(type, activeStepIndex);
      updateFields((p) => [...p, f]);
      selectField(f.id);
      setMobilePanel("canvas");
      toast.add({
        description: "Tap to edit properties.",
        title: `${f.label} added`,
      });
    },
    [activeStepIndex, updateFields, selectField],
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
              className={`size-1.5 rounded-full transition-colors ${
                saveStatus === "saved" ? "bg-primary" : "bg-muted-foreground/20"
              }`}
            />
            <span
              className={`hidden font-mono text-[10px] transition-colors sm:inline ${
                saveStatus === "saved"
                  ? "text-primary/70"
                  : "text-muted-foreground/30"
              }`}
            >
              {saveStatus === "saved" ? "saved" : ""}
            </span>
          </div>

          {/* Undo/Redo */}
          <div className="ml-1 flex items-center gap-0.5">
            <button
              className={`rounded-md p-1 transition-colors ${canUndo ? "text-muted-foreground/60 hover:bg-accent hover:text-foreground" : "cursor-not-allowed text-muted-foreground/15"}`}
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2Icon className="size-3.5" />
            </button>
            <button
              className={`rounded-md p-1 transition-colors ${canRedo ? "text-muted-foreground/60 hover:bg-accent hover:text-foreground" : "cursor-not-allowed text-muted-foreground/15"}`}
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
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all md:px-2.5 ${
              multiStepEnabled
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/60 hover:bg-accent hover:text-foreground"
            }`}
            onClick={toggleMultiStep}
          >
            <ListOrderedIcon className="size-3.5" />
            <span className="hidden sm:inline">Steps</span>
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
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                      rightPanel === key
                        ? "bg-background text-foreground shadow-sm"
                        : "text-muted-foreground/50 hover:text-foreground"
                    }`}
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
            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="h-full"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key={mobilePanel}
                transition={{ duration: 0.15 }}
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
                      editingStepId={editingStepId}
                      fields={currentStepFields}
                      multiStepEnabled={multiStepEnabled}
                      onAddStep={handleAddStep}
                      onDuplicate={handleDuplicate}
                      onEditingStepChange={setEditingStepId}
                      onRemove={handleRemove}
                      onRemoveStep={handleRemoveStep}
                      onRenameStep={handleRenameStep}
                      onSelect={selectField}
                      onStepChange={setActiveStepIndex}
                      selectedId={selectedId}
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
                    <FieldProperties
                      allFields={fields}
                      field={selectedField}
                      fullWidth
                      onChange={handleFieldChange}
                    />
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
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            rightPanel === key
                              ? "bg-background text-foreground shadow-sm"
                              : "text-muted-foreground/50 hover:text-foreground"
                          }`}
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
                        <FormPreview
                          fields={fields}
                          multiStepEnabled={multiStepEnabled}
                          steps={steps}
                        />
                      ) : (
                        <SchemaOutput
                          fields={fields}
                          multiStepEnabled={multiStepEnabled}
                          steps={steps}
                        />
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Bottom tab bar */}
          <nav className="flex shrink-0 items-center border-t border-border bg-background">
            {mobileTabs.map(({ icon: Icon, key, label }) => (
              <button
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors ${
                  mobilePanel === key
                    ? "text-primary"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
                key={key}
                onClick={() => {
                  setMobilePanel(key);
                }}
              >
                <Icon className="size-4" />
                <span className="text-[10px] font-medium">{label}</span>
                {mobilePanel === key && (
                  <motion.div
                    className="mt-0.5 h-0.5 w-4 rounded-full bg-primary"
                    layoutId="mobile-tab-indicator"
                  />
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
              editingStepId={editingStepId}
              fields={currentStepFields}
              multiStepEnabled={multiStepEnabled}
              onAddStep={handleAddStep}
              onDuplicate={handleDuplicate}
              onEditingStepChange={setEditingStepId}
              onRemove={handleRemove}
              onRemoveStep={handleRemoveStep}
              onRenameStep={handleRenameStep}
              onSelect={selectField}
              onStepChange={setActiveStepIndex}
              selectedId={selectedId}
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

          <FieldProperties
            allFields={fields}
            field={selectedField}
            onChange={handleFieldChange}
          />

          <div className="flex w-90 min-w-0 flex-col border-l border-border bg-background">
            <motion.div
              animate={{ opacity: 1 }}
              className="flex min-h-0 flex-1 flex-col"
              initial={{ opacity: 0 }}
              key={rightPanel}
            >
              {rightPanel === "preview" ? (
                <FormPreview
                  fields={fields}
                  multiStepEnabled={multiStepEnabled}
                  steps={steps}
                />
              ) : (
                <SchemaOutput
                  fields={fields}
                  multiStepEnabled={multiStepEnabled}
                  steps={steps}
                />
              )}
            </motion.div>
          </div>
        </div>
      )}
    </div>
  );
}
