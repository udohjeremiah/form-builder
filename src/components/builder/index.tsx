"use client";

import {
  ChevronsUpDown,
  ClipboardListIcon,
  ListChecksIcon,
  type LucideIcon,
  SaveIcon,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  getFields,
  normalizeDefinition,
  validateDefinition,
} from "./form/form-definition";
import { FormEditor } from "./form/form-editor";
import { RulesEditor } from "./rules/rules-editor";

export type AnyFieldDefinition = {
  [Type in FieldType]: FieldDefinition<Type>;
}[FieldType];

export interface BaseFieldAttributes {
  description?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export interface BuilderDefinition {
  rules: RuleDefinition[];
  steps: StepDefinition[];
}

export interface BuilderProps {
  /**
   * Seed used to initialize the builder's working state on first mount. The
   * builder is uncontrolled after that: its internal state is the source of
   * truth, edits are reported through `onChange`, and the consumer persists
   * wherever it likes. `initialValue` is only re-applied by remounting.
   */
  initialValue?: BuilderDefinition;
  /** Notified whenever the definition changes. */
  onChange?: (definition: BuilderDefinition) => void;
  /** Called when the builder is reset, with the fresh (reset) definition. */
  onClear?: (definition: BuilderDefinition) => void;
  /**
   * Called with the completed definition and its completion flag either when
   * the `completed` state transitions or when the consumer triggers a
   * "complete" action on an already-complete definition. A definition is
   * complete when it is ready to publish: it has at least one field, every
   * step, section, and field attribute is valid, and every rule's area,
   * outcome, and WHEN tree are populated.
   */
  onComplete?: (definition: BuilderDefinition, completed: boolean) => void;
  /**
   * Called with the current definition when the user triggers "Save & Exit".
   * Use it to persist progress elsewhere (for example localStorage or a
   * server) so work can be resumed later.
   */
  onSaveExit?: (definition: BuilderDefinition) => void;
  /**
   * Renders the live preview of the form steps. When omitted, no preview is
   * shown. Pass your own renderer to customize how the form is previewed.
   * The renderer receives only the step definitions (a form preview has no
   * knowledge of rules); step navigation is the preview's own concern.
   */
  preview?: PreviewRenderer;
}

export type BuilderView = "form" | "rules";

export interface ComparisonCondition {
  field: string;
  operator: ConditionOperator;
  type: "comparison";
  value: string;
}

/**
 * A single node in the rule's WHEN tree. Evaluated against an assessment
 * result; an empty group is always satisfied.
 */
export type Condition =
  ComparisonCondition | ExistsCondition | GroupCondition | ReviewCondition;

/**
 * A group of sibling rules combined with a single combinator. An empty group
 * is always satisfied.
 */
export interface ConditionGroup {
  combinator: "and" | "or";
  rules: FieldRule[];
}

export type ConditionOperator =
  | "contains"
  | "empty"
  | "eq"
  | "gt"
  | "gte"
  | "in"
  | "lt"
  | "lte"
  | "neq"
  | "not_contains"
  | "not_empty"
  | "not_in";

export interface DateTimeFieldAttributes extends BaseFieldAttributes {
  maxDate?: string;
  minDate?: string;
}

export interface Duration {
  amount: number;
  unit: "day" | "month" | "week" | "year";
}

export interface EmailFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

/**
 * Presence check: whether the referenced field was answered.
 */
export interface ExistsCondition {
  field: string;
  present: boolean;
  type: "exists";
}

export interface FieldAttributesByType {
  checkbox: OptionsFieldAttributes;
  color: BaseFieldAttributes;
  date: DateTimeFieldAttributes;
  datetime: DateTimeFieldAttributes;
  email: EmailFieldAttributes;
  file: FileFieldAttributes;
  number: NumberFieldAttributes;
  password: PasswordFieldAttributes;
  radio: OptionsFieldAttributes;
  rating: RatingFieldAttributes;
  select: SelectFieldAttributes;
  slider: SliderFieldAttributes;
  tel: TelFieldAttributes;
  text: TextFieldAttributes;
  textarea: TextareaFieldAttributes;
  time: DateTimeFieldAttributes;
  toggle: BaseFieldAttributes;
  url: UrlFieldAttributes;
}

export interface FieldDefinition<Type extends FieldType = FieldType> {
  attributes: FieldAttributesByType[Type];
  id: string;
  logic: FieldLogic;
  type: Type;
}

/**
 * The conditional logic a field can define, keyed by effect. An absent key
 * means the effect never applies.
 */
export interface FieldLogic {
  disable?: ConditionGroup;
  hide?: ConditionGroup;
  show?: ConditionGroup;
}

/**
 * A single predicate inside a condition group. `value` is always declared in
 * the schema (it may be unused for presence operators like `empty` and
 * `not_empty`).
 */
export interface FieldRule {
  fieldId: string;
  operator: ConditionOperator;
  value?: string;
}

export type FieldType =
  | "checkbox"
  | "color"
  | "date"
  | "datetime"
  | "email"
  | "file"
  | "number"
  | "password"
  | "radio"
  | "rating"
  | "select"
  | "slider"
  | "tel"
  | "text"
  | "textarea"
  | "time"
  | "toggle"
  | "url";

export interface FileFieldAttributes extends BaseFieldAttributes {
  accept?: string[];
  maxSize?: number;
  multiple?: boolean;
}

/**
 * Nests sibling conditions under a single combinator.
 */
export interface GroupCondition {
  conditions: Condition[];
  operator: "and" | "or";
  type: "group";
}

export interface NumberFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
  step?: number;
}

export interface OptionsFieldAttributes extends BaseFieldAttributes {
  /** One option per line. */
  options?: string[];
}

export interface PasswordFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface RatingFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
}

/**
 * Defers the decision to a human review step.
 */
export interface ReviewCondition {
  note: string;
  type: "review";
}

/**
 * The top-level assessment rule. `area` is a free-form grouping label;
 * `condition` (WHEN) drives the outcome (THEN).
 */
export interface RuleDefinition {
  area: string;
  condition: Condition;
  id: string;
  outcome: RuleOutcome;
}

export interface RuleOutcome {
  adminReason: string;
  deadline?: Duration;
  status: RuleStatus;
  studentAction?: string;
}

export type RuleStatus =
  "NOT_QUALIFIED" | "READY" | "REVIEW_REQUIRED" | "SUPPORT_REQUIRED";

export interface SectionAttributes {
  description?: string;
  title?: string;
}

export interface SectionDefinition {
  attributes: SectionAttributes;
  fields: AnyFieldDefinition[];
  id: string;
}

export interface SelectFieldAttributes extends OptionsFieldAttributes {
  multiple?: boolean;
}

export interface SliderFieldAttributes extends BaseFieldAttributes {
  max?: number;
  min?: number;
  step?: number;
}

export interface StepAttributes {
  description?: string;
  nextLabel?: string;
  previousLabel?: string;
  submitLabel?: string;
  title?: string;
}

export interface StepDefinition {
  attributes: StepAttributes;
  id: string;
  sections: SectionDefinition[];
}

export interface TelFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface TextareaFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
}

export interface TextFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface UrlFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

const VIEW_LABELS: Record<BuilderView, { icon: LucideIcon; label: string }> = {
  form: { icon: ClipboardListIcon, label: "Form Builder" },
  rules: { icon: ListChecksIcon, label: "Rules Builder" },
};

const EMPTY_DEFINITION: BuilderDefinition = { rules: [], steps: [] };
export type PreviewRenderer = (steps: StepDefinition[]) => ReactNode;

export function Builder({
  initialValue,
  onChange,
  onClear,
  onComplete,
  onSaveExit,
  preview,
}: BuilderProps) {
  const isMobile = useIsMobile();
  const [formState, setFormStateRaw] = useState<BuilderDefinition>(
    normalizeDefinition(initialValue ?? EMPTY_DEFINITION),
  );

  const setFormState = useCallback<
    (
      updater:
        | ((previous: BuilderDefinition) => BuilderDefinition)
        | BuilderDefinition,
    ) => void
  >((updater) => {
    setFormStateRaw((previous) =>
      normalizeDefinition(
        typeof updater === "function" ? updater(previous) : updater,
      ),
    );
  }, []);

  const [view, setView] = useState<BuilderView>("form");
  const [resetKey, setResetKey] = useState(0);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    onChange?.(formState);
  }, [formState, onChange]);

  const completed = validateDefinition(formState);
  const completedRef = useRef(completed);

  useEffect(() => {
    if (completedRef.current === completed) return;
    completedRef.current = completed;
    onComplete?.(formState, completed);
  }, [completed, formState, onComplete]);

  const allFields = getFields(formState.steps);

  const handleClear = useCallback(() => {
    const next = EMPTY_DEFINITION;
    setFormState(next);
    onClear?.(next);
    setResetKey((previous) => previous + 1);
  }, [onClear, setFormState]);

  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-12 shrink-0 items-center justify-between border-b bg-background px-2">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost">
                {VIEW_LABELS[view].label}
                <ChevronsUpDown className="size-3" />
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
                      <ItemIcon className="size-3.5" />
                    </div>
                    {label}
                  </DropdownMenuRadioItem>
                );
              })}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
        <div className="flex items-center gap-2">
          {onClear && (
            <Button onClick={handleClear} size="xs" variant="destructive">
              Clear
            </Button>
          )}
          {onSaveExit && (
            <Button
              disabled={allFields.length === 0 && formState.rules.length === 0}
              onClick={() => {
                onSaveExit(formState);
              }}
              size="xs"
              variant="outline"
            >
              <SaveIcon className="size-3.5" />
              Save &amp; Exit
            </Button>
          )}
          {onComplete && (
            <Button
              disabled={!completed}
              onClick={() => {
                onComplete(formState, true);
              }}
              size="xs"
            >
              Publish
            </Button>
          )}
        </div>
      </header>
      <main className="flex min-h-0 flex-1">
        {view === "rules" ? (
          <RulesEditor
            allFields={allFields}
            formState={formState}
            setFormState={setFormState}
          />
        ) : (
          <FormEditor
            allFields={allFields}
            formState={formState}
            isMobile={isMobile}
            key={resetKey}
            onPreview={
              preview
                ? () => {
                    setShowPreview(true);
                  }
                : undefined
            }
            preview={preview}
            setFormState={setFormState}
          />
        )}
      </main>
      {preview && (
        <Sheet onOpenChange={setShowPreview} open={showPreview}>
          <SheetContent className="min-w-full overflow-y-auto" side="right">
            {preview(formState.steps)}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
