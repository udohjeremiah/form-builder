"use client";

import {
  ChevronsUpDown,
  ClipboardListIcon,
  EyeIcon,
  ListChecksIcon,
  type LucideIcon,
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
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useIsMobile } from "@/hooks/use-mobile";

import {
  BuilderContext,
  type BuilderContextValue,
  type BuilderView,
  useForm,
  useRules,
} from "./builder-context";
import { FieldPalette } from "./form/field-palette";
import { FormCanvas } from "./form/form-canvas";
import {
  createDefaultDefinition,
  getAllFields,
  isDefinitionComplete,
} from "./form/form-definition";
import { Form } from "./form/form-editor";
import { PreviewPanel, type PreviewRenderer } from "./preview-panel";
import { RuleEditor } from "./rules/rule-editor";
import { RuleList } from "./rules/rule-list";
import { Rules } from "./rules/rules-editor";

export type AnyFieldDefinition = {
  [Type in FieldType]: FieldDefinition<Type>;
}[FieldType];

export interface BaseFieldAttributes {
  description?: string;
  label: string;
  placeholder?: string;
  required?: boolean;
}

export interface BuilderProps {
  /** The composed content: `<Builder.Form>` and/or `<Builder.Rules>`. */
  children?: ReactNode;
  /** Optional className applied to the outer shell. */
  className?: string;
  /** Notified whenever the definition changes. */
  onChange?: (definition: FormDefinition) => void;
  /** Called when "Clear" resets the builder, with the fresh (reset) definition. */
  onClear?: (definition: FormDefinition) => void;
  /**
   * Called with the completed definition whenever the `completed` flag
   * transitions (into or out of a complete state) and when "Publish" is
   * clicked while the definition is complete. A definition is complete when
   * it has at least one field and every rule's condition is populated.
   */
  onComplete?: (definition: FormDefinition, completed: boolean) => void;
  /**
   * Renders the UI preview shown in the "UI" tab. When omitted, the "UI" tab
   * is hidden and only the Form Schema and Rules Schema tabs are shown. Pass
   * your own renderer to customize the preview.
   */
  preview?: PreviewRenderer;
  /** The current definition; the builder is controlled by this value. */
  value: FormDefinition;
}

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
  checkbox: BaseFieldAttributes;
  color: BaseFieldAttributes;
  date: DateTimeFieldAttributes;
  datetime: DateTimeFieldAttributes;
  email: EmailFieldAttributes;
  file: FileFieldAttributes;
  number: NumberFieldAttributes;
  password: PasswordFieldAttributes;
  phone: PhoneFieldAttributes;
  radio: OptionsFieldAttributes;
  rating: RatingFieldAttributes;
  select: SelectFieldAttributes;
  slider: SliderFieldAttributes;
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
  | "phone"
  | "radio"
  | "rating"
  | "select"
  | "slider"
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

export interface FormDefinition {
  rules: Rule[];
  steps: StepDefinition[];
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
  options?: string[];
}

export interface PasswordFieldAttributes extends BaseFieldAttributes {
  autoComplete?: string;
  maxLength?: number;
  minLength?: number;
  pattern?: string;
}

export interface PhoneFieldAttributes extends BaseFieldAttributes {
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
export interface Rule {
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
  title?: string;
}

export interface StepDefinition {
  attributes: StepAttributes;
  id: string;
  sections: SectionDefinition[];
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
export function Builder({
  children,
  className,
  onChange,
  onClear,
  onComplete,
  preview,
  value,
}: BuilderProps) {
  const isMobile = useIsMobile();

  const [formState, setFormState] = useState<FormDefinition>(value);

  const [view, setView] = useState<BuilderView>("form");
  const [resetKey, setResetKey] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- mirror the controlled `value` prop into internal formState
    setFormState(value);
  }, [value]);

  useEffect(() => {
    onChange?.(formState);
  }, [formState, onChange]);

  const completed = isDefinitionComplete(formState);
  const completedRef = useRef(completed);
  useEffect(() => {
    if (completedRef.current === completed) return;
    completedRef.current = completed;
    onComplete?.(formState, completed);
  }, [completed, formState, onComplete]);

  const allFields = getAllFields(formState);

  const handleClear = useCallback(() => {
    const next = createDefaultDefinition();
    setFormState(next);
    onClear?.(next);
    setResetKey((previous) => previous + 1);
  }, [onClear]);

  const builderContext: BuilderContextValue = {
    allFields,
    formState,
    isMobile,
    preview,
    setFormState,
    view,
  };

  return (
    <BuilderContext.Provider value={builderContext}>
      <div className={className ?? "flex h-screen flex-col bg-background"}>
        {/* Header */}
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-background px-2 md:px-3">
          <div className="flex items-center gap-1.5 md:gap-2">
            {/* View switcher */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost">
                    {VIEW_LABELS[view].label}
                    <ChevronsUpDown className="size-3 shrink-0" />
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

            <Button
              disabled={!completed}
              onClick={() => {
                onComplete?.(formState, true);
              }}
              size="xs"
            >
              Publish
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
                <SheetContent side="right">
                  <PreviewPanel
                    definition={formState}
                    renderPreview={preview}
                  />
                </SheetContent>
              </Sheet>
            )}
          </div>
        </header>

        {/* Main content */}
        <main className="flex min-h-0 flex-1">
          {view === "rules" ? (
            <Builder.Rules>{children}</Builder.Rules>
          ) : (
            <Builder.Form key={resetKey}>{children}</Builder.Form>
          )}
        </main>
      </div>
    </BuilderContext.Provider>
  );
}

function PalettePart() {
  const { handleTapAdd, isMobile } = useForm();
  return <FieldPalette fullWidth={isMobile} onTapAdd={handleTapAdd} />;
}

PalettePart.role = "palette";

function CanvasPart() {
  const {
    activeStepIndex,
    handleAddSection,
    handleAddStep,
    handleDuplicate,
    handleRemove,
    handleRemoveSection,
    handleRemoveStep,
    renderedSections,
    selectedId,
    selectedSectionId,
    selectField,
    selectSection,
    selectStep,
    setActiveStepIndex,
    steps,
  } = useForm();

  return (
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
      selectedId={selectedId}
      selectedSectionId={selectedSectionId}
      steps={steps}
    />
  );
}

CanvasPart.role = "canvas";

function PropertiesPart() {
  const { isMobile, renderProperties } = useForm();
  return renderProperties(isMobile ? true : undefined);
}

PropertiesPart.role = "properties";

function RulesListPart() {
  const { handleCreate, openEditor, rules } = useRules();
  return <RuleList onCreate={handleCreate} onEdit={openEditor} rules={rules} />;
}

RulesListPart.role = "list";

function RulesEditorPart() {
  const { allFields, editingRule, handleChange, handleDelete, onBack } =
    useRules();

  if (!editingRule) return null;

  return (
    <RuleEditor
      allFields={allFields}
      onBack={onBack}
      onChange={handleChange}
      onDelete={() => {
        handleDelete(editingRule.id);
      }}
      rule={editingRule}
    />
  );
}

RulesEditorPart.role = "editor";

const FormNamespace = Object.assign(Form, {
  Canvas: CanvasPart,
  Palette: PalettePart,
  Properties: PropertiesPart,
});

const RulesNamespace = Object.assign(Rules, {
  Editor: RulesEditorPart,
  List: RulesListPart,
});

Builder.Form = FormNamespace;
Builder.Rules = RulesNamespace;

export type { PreviewRenderer } from "./preview-panel";
