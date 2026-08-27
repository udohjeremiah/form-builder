"use client";

import {
  ChevronsUpDown,
  ClipboardListIcon,
  Code2Icon,
  EyeIcon,
  ListChecksIcon,
  type LucideIcon,
  Redo2Icon,
  Undo2Icon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type {
  FormDefinition,
  PersistedFormDefinition,
} from "@/types/form-definition";

import { FormBuilderView } from "@/components/form-builder/form-builder-view";
import { FormPreview } from "@/components/form-builder/form-preview";
import { SchemaOutput } from "@/components/form-builder/schema-output";
import { RulesBuilderView } from "@/components/rules-builder/rules-builder-view";
import { RulesSchemaOutput } from "@/components/rules-builder/rules-schema-output";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  createDefaultDefinition,
  getAllFields,
  normalizePersisted,
} from "@/lib/form-definition";
import { newRulesDefinition } from "@/lib/rule-definition";

const STORAGE_KEY = "form-builder-draft";
const AUTOSAVE_DELAY = 1500;

type BuilderView = "form" | "rules";
type RightPanel = "preview" | "schema";

const VIEW_LABELS: Record<BuilderView, { icon: LucideIcon; label: string }> = {
  form: { icon: ClipboardListIcon, label: "Form Builder" },
  rules: { icon: ListChecksIcon, label: "Rules Builder" },
};

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

  const [view, setView] = useState<BuilderView>("form");
  const [rightPanel, setRightPanel] = useState<RightPanel>("preview");
  const [resetKey, setResetKey] = useState(0);

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

  const handleClearDraft = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    resetHistory(createDefaultDefinition());
    setResetKey((previous) => previous + 1);
  }, [resetHistory]);

  const handleRulesChange = useCallback(
    (rules: FormDefinition["rules"]) => {
      setFormState((previous) => ({ ...previous, rules }));
    },
    [setFormState],
  );

  const handleClearRules = useCallback(() => {
    setFormState((previous) => ({ ...previous, rules: newRulesDefinition() }));
  }, [setFormState]);

  return (
    <div className="flex h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex h-11 shrink-0 items-center justify-between border-b border-border bg-background px-2 md:px-3">
        <div className="flex items-center gap-1.5 md:gap-2">
          {/* View switcher */}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button variant="ghost">
                  {(() => {
                    const ActiveIcon = VIEW_LABELS[view].icon;
                    return <ActiveIcon className="size-3.5 shrink-0" />;
                  })()}
                  {VIEW_LABELS[view].label}
                  <ChevronsUpDown className="ml-auto size-3" />
                </Button>
              }
            />
            <DropdownMenuContent className="min-w-56">
              <DropdownMenuRadioGroup
                onValueChange={(next: BuilderView) => {
                  setView(next);
                }}
                value={view}
              >
                {(Object.keys(VIEW_LABELS) as BuilderView[]).map((key) => {
                  const { icon: ItemIcon, label } = VIEW_LABELS[key];
                  return (
                    <DropdownMenuRadioItem key={key} value={key}>
                      <div className="flex size-6 items-center justify-center rounded-md border">
                        <ItemIcon className="size-3.5 shrink-0" />
                      </div>
                      {label}
                    </DropdownMenuRadioItem>
                  );
                })}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {view === "form" && (
          <div className="flex items-center gap-1 md:gap-1.5">
            {/* Undo/Redo */}
            <div className="mr-1 flex items-center gap-0.5">
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
          </div>
        )}

        {view === "rules" && (
          <div className="flex items-center gap-1 md:gap-1.5">
            <Button onClick={handleClearRules} size="xs" variant="destructive">
              Clear
            </Button>
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
                  <SheetTitle>Rules Schema</SheetTitle>
                </SheetHeader>
                <div className="flex-1 overflow-hidden">
                  <RulesSchemaOutput definition={formState.rules} />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        )}
      </header>

      {/* Main content */}
      <div className="flex min-h-0 flex-1">
        {view === "rules" ? (
          <RulesBuilderView
            allFields={allFields}
            onRulesChange={handleRulesChange}
            rules={formState.rules}
          />
        ) : (
          <FormBuilderView
            allFields={allFields}
            formState={formState}
            isMobile={isMobile}
            key={resetKey}
            rightPanel={rightPanel}
            setFormState={setFormState}
            setRightPanel={setRightPanel}
          />
        )}
      </div>
    </div>
  );
}
