"use client";

import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";

import {
  closestCenter,
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { AnimatePresence, motion } from "framer-motion";
import {
  Code2,
  Columns3,
  Download,
  Eye,
  Layers,
  LayoutTemplate,
  ListOrdered,
  PanelLeft,
  Redo2,
  Settings2,
  Undo2,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FormTemplate } from "@/data/form-templates";
import type { FieldType, FormField, FormStep } from "@/types/form";

import { FieldPalette } from "@/components/builder/field-palette";
import { FieldProperties } from "@/components/builder/field-properties";
import { FormCanvas } from "@/components/builder/form-canvas";
import { FormPreview } from "@/components/builder/form-preview";
import { SchemaOutput } from "@/components/builder/schema-output";
import { TemplateGallery } from "@/components/builder/template-gallery";
import { Separator } from "@/components/ui/separator";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import { useUndoRedo } from "@/hooks/use-undo-redo";
import { downloadFile, generateReactComponent } from "@/lib/export-react";

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

const BuilderPage = () => {
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const [initialDraft] = useState(loadDraft);
  const hasDraft = !!initialDraft;
  const initialState: FormState = initialDraft
    ? {
        fields: initialDraft.fields,
        multiStepEnabled: initialDraft.multiStepEnabled,
        steps: initialDraft.steps,
      }
    : { fields: [], multiStepEnabled: false, steps: [defaultStep] };

  const {
    canRedo,
    canUndo,
    redo,
    resetHistory,
    set: setFormState,
    state: formState,
    undo,
  } = useUndoRedo<FormState>(initialState);
  const { fields, multiStepEnabled, steps } = formState;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selectedId, setSelectedId] = useState<null | string>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview");
  const [activeId, setActiveId] = useState<null | string>(null);
  const [editingStepId, setEditingStepId] = useState<null | string>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");
  const [showTemplates, setShowTemplates] = useState(!hasDraft);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

  useEffect(() => {
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
    const ago = Date.now() - initialDraft.savedAt;
    let agoText = "just now";
    if (ago >= 3_600_000) {
      agoText = `${Math.floor(ago / 3_600_000)}h ago`;
    } else if (ago >= 60_000) {
      agoText = `${Math.floor(ago / 60_000)}m ago`;
    }
    toast({
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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (!over) return;
      if (String(active.id).startsWith("palette-")) {
        const type = active.data.current?.["type"] as FieldType | undefined;
        if (type) {
          const f = createField(type, activeStepIndex);
          updateFields((p) => [...p, f]);
          selectField(f.id);
        }
        return;
      }
      if (active.id !== over.id) {
        updateFields((previous) => {
          const ni = previous.findIndex((f) => f.id === over.id),
            oi = previous.findIndex((f) => f.id === active.id);
          return oi === -1 || ni === -1
            ? previous
            : arrayMove(previous, oi, ni);
        });
      }
    },
    [activeStepIndex, updateFields, selectField],
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
    toast({ description: "Started fresh.", title: "Draft cleared" });
  }, [toast, resetHistory, selectField]);

  const handleLoadTemplate = useCallback(
    (template: FormTemplate) => {
      const ts = Date.now();
      const nf = template.fields.map((f, index) => ({
        ...f,
        id: `field_${++fieldCounter}_${ts + index}`,
      }));
      const ns = template.steps.map((s, index) => ({
        ...s,
        id: `step_${++stepCounter}_${ts + index}`,
      }));
      resetHistory({
        fields: nf,
        multiStepEnabled: template.multiStepEnabled,
        steps: ns,
      });
      setActiveStepIndex(0);
      selectField(null);
      setShowTemplates(false);
      toast({
        description: `${nf.length} fields ready.`,
        title: `"${template.name}" loaded`,
      });
    },
    [resetHistory, toast, selectField],
  );

  const handleTapAdd = useCallback(
    (type: FieldType) => {
      const f = createField(type, activeStepIndex);
      updateFields((p) => [...p, f]);
      selectField(f.id);
      setMobilePanel("canvas");
      toast({
        description: "Tap to edit properties.",
        title: `${f.label} added`,
      });
    },
    [activeStepIndex, updateFields, toast, selectField],
  );

  const mobileTabs: {
    icon: React.FC<{ className?: string }>;
    key: MobilePanel;
    label: string;
  }[] = [
    { icon: PanelLeft, key: "palette", label: "Fields" },
    { icon: Columns3, key: "canvas", label: "Canvas" },
    { icon: Settings2, key: "properties", label: "Props" },
    { icon: Eye, key: "output", label: "Preview" },
  ];

  return (
    <div className="relative flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-2 md:px-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          <div className="flex items-center gap-1.5">
            <Layers className="size-3.5 text-primary" />
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
              className={`rounded-md p-1 transition-colors ${canUndo ? "text-muted-foreground/60 hover:bg-surface-2 hover:text-foreground" : "cursor-not-allowed text-muted-foreground/15"}`}
              disabled={!canUndo}
              onClick={undo}
            >
              <Undo2 className="size-3.5" />
            </button>
            <button
              className={`rounded-md p-1 transition-colors ${canRedo ? "text-muted-foreground/60 hover:bg-surface-2 hover:text-foreground" : "cursor-not-allowed text-muted-foreground/15"}`}
              disabled={!canRedo}
              onClick={redo}
            >
              <Redo2 className="size-3.5" />
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

          <button
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-primary/70 transition-all hover:bg-primary/10 hover:text-primary md:px-2.5"
            onClick={() => {
              if (fields.length === 0) {
                toast({
                  description: "Add fields first.",
                  title: "Nothing to export",
                });
                return;
              }
              const code = generateReactComponent(
                fields,
                steps,
                multiStepEnabled,
              );
              downloadFile(code, "GeneratedForm.tsx");
              toast({
                description: "GeneratedForm.tsx downloaded.",
                title: "Exported!",
              });
            }}
          >
            <Download className="size-3.5" />
            <span className="hidden sm:inline">Export</span>
          </button>

          <button
            className="flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground/60 transition-all hover:bg-surface-2 hover:text-foreground md:px-2.5"
            onClick={() => {
              setShowTemplates(true);
            }}
          >
            <LayoutTemplate className="size-3.5" />
            <span className="hidden sm:inline">Templates</span>
          </button>

          <Separator className="hidden h-4 sm:block" orientation="vertical" />

          <button
            className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-[11px] font-medium transition-all md:px-2.5 ${
              multiStepEnabled
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground/60 hover:bg-surface-2 hover:text-foreground"
            }`}
            onClick={toggleMultiStep}
          >
            <ListOrdered className="size-3.5" />
            <span className="hidden sm:inline">Steps</span>
          </button>

          {/* Desktop-only: Preview/Schema toggle */}
          {!isMobile && (
            <>
              <Separator className="h-4" orientation="vertical" />
              <div className="flex items-center rounded-lg bg-surface-2/50 p-0.5">
                {[
                  { icon: Eye, key: "preview" as RightPanel, label: "Preview" },
                  { icon: Code2, key: "schema" as RightPanel, label: "Schema" },
                ].map(({ icon: Icon, key, label }) => (
                  <button
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all ${
                      rightPanel === key
                        ? "bg-surface-3 text-foreground shadow-sm"
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
                  <DndContext
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    onDragStart={handleDragStart}
                    sensors={sensors}
                  >
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
                      {activeId && activeId.startsWith("palette-") && (
                        <div className="glow rounded-lg border border-primary/30 bg-surface-2 px-3 py-2 text-sm font-medium text-foreground shadow-lg">
                          {activeId.replace("palette-", "")}
                        </div>
                      )}
                    </DragOverlay>
                  </DndContext>
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
                          icon: Eye,
                          key: "preview" as RightPanel,
                          label: "Preview",
                        },
                        {
                          icon: Code2,
                          key: "schema" as RightPanel,
                          label: "Schema",
                        },
                      ].map(({ icon: Icon, key, label }) => (
                        <button
                          className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all ${
                            rightPanel === key
                              ? "bg-surface-3 text-foreground shadow-sm"
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
          <nav className="safe-area-bottom flex shrink-0 items-center border-t border-border bg-background">
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
          <DndContext
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            onDragStart={handleDragStart}
            sensors={sensors}
          >
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
              {activeId && activeId.startsWith("palette-") && (
                <div className="glow rounded-lg border border-primary/30 bg-surface-2 px-3 py-2 text-sm font-medium text-foreground shadow-lg">
                  {activeId.replace("palette-", "")}
                </div>
              )}
            </DragOverlay>
          </DndContext>

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

      <AnimatePresence>
        {showTemplates && (
          <TemplateGallery
            onClose={() => {
              setShowTemplates(false);
            }}
            onSelect={handleLoadTemplate}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuilderPage;
