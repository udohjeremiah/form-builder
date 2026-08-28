"use client";

import {
  ChevronsUpDown,
  ClipboardListIcon,
  EyeIcon,
  ListChecksIcon,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import type { FormDefinition } from "@/types/form-definition";

import { FormBuilderView } from "@/components/form-builder/form-builder-view";
import {
  PreviewPanel,
  type PreviewPanelTab,
} from "@/components/form-builder/preview-panel";
import { RulesBuilderView } from "@/components/rules-builder/rules-builder-view";
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
import {
  createDefaultDefinition,
  getAllFields,
  normalizePersisted,
} from "@/lib/form-definition";
import { normalizeRulesDefinition } from "@/lib/rule-definition";

const formKey = (id: string) => `form-builder-${id}`;
const rulesKey = (id: string) => `rules-builder-${id}`;
const AUTOSAVE_DELAY = 1500;

type BuilderView = "form" | "rules";

const VIEW_LABELS: Record<BuilderView, { icon: LucideIcon; label: string }> = {
  form: { icon: ClipboardListIcon, label: "Form Builder" },
  rules: { icon: ListChecksIcon, label: "Rules Builder" },
};

/**
 * Loads the persisted draft. The form and its rules are kept in separate
 * storage keys; the form key holds a stable id whose payload records the
 * rules id used to look up the matching rules key.
 */
const loadDraft = (): FormDefinition | null => {
  try {
    const formRaw = localStorage.getItem(formKey(initialDefinition.id));
    if (!formRaw) return null;
    const formJson = JSON.parse(formRaw) as {
      rulesId?: unknown;
      savedAt?: unknown;
    };
    const formPayload = normalizePersisted(formJson);
    if (!formPayload) return null;
    if (
      getAllFields(formPayload).length === 0 &&
      formPayload.steps.length <= 1
    ) {
      return null;
    }

    let rules = formPayload.rules;
    if (typeof formJson.rulesId === "string") {
      const rulesRaw = localStorage.getItem(rulesKey(formJson.rulesId));
      if (rulesRaw) {
        rules =
          normalizeRulesDefinition(JSON.parse(rulesRaw) as unknown) ?? rules;
      }
    }

    return { ...formPayload, rules };
  } catch {
    return null;
  }
};

const saveDraft = (state: FormDefinition) => {
  try {
    const savedAt = Date.now();
    localStorage.setItem(
      formKey(state.id),
      JSON.stringify({
        id: state.id,
        rulesId: state.rules.id,
        savedAt,
        steps: state.steps,
        version: state.version,
      }),
    );
    localStorage.setItem(
      rulesKey(state.rules.id),
      JSON.stringify({ ...state.rules, savedAt }),
    );
  } catch {
    return;
  }
};

const initialDefinition = createDefaultDefinition();

export default function BuilderPage() {
  const isMobile = useIsMobile();

  const [formState, setFormState] = useState<FormDefinition>(
    () => loadDraft() ?? initialDefinition,
  );

  const [view, setView] = useState<BuilderView>("form");
  const [rightPanel, setRightPanel] = useState<PreviewPanelTab>("ui");
  const [resetKey, setResetKey] = useState(0);

  const saveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const skipAutosaveRef = useRef(true);
  useEffect(() => {
    if (skipAutosaveRef.current) {
      skipAutosaveRef.current = false;
      return;
    }
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveDraft(formState);
    }, AUTOSAVE_DELAY);
    return () => {
      clearTimeout(saveTimer.current);
    };
  }, [formState]);

  const allFields = getAllFields(formState);

  const handleClear = useCallback(() => {
    localStorage.removeItem(formKey(formState.id));
    localStorage.removeItem(rulesKey(formState.rules.id));
    setFormState(createDefaultDefinition());
    setResetKey((previous) => previous + 1);
  }, [formState]);

  const handleRulesChange = useCallback(
    (rules: FormDefinition["rules"]) => {
      setFormState((previous) => ({ ...previous, rules }));
    },
    [setFormState],
  );

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

        <div className="flex items-center gap-1 md:gap-1.5">
          <Button onClick={handleClear} size="xs" variant="destructive">
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
                </SheetHeader>
                <div className="min-h-0 flex-1">
                  <PreviewPanel
                    definition={formState}
                    onTabChange={setRightPanel}
                    tab={rightPanel}
                  />
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
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
