"use client";

import type { DragEndEvent } from "@dnd-kit/react";

import {
  Children,
  createContext,
  isValidElement,
  type ReactNode,
  useContext,
} from "react";

import type {
  AnyFieldDefinition,
  FieldType,
  FormDefinition,
  Rule,
  SectionAttributes,
  SectionDefinition,
  StepAttributes,
  StepDefinition,
} from "./index";
import type { PreviewRenderer } from "./preview-panel";

export interface BuilderContextValue {
  allFields: AnyFieldDefinition[];
  formState: FormDefinition;
  isMobile: boolean;
  preview?: PreviewRenderer;
  setFormState: (
    updater: ((previous: FormDefinition) => FormDefinition) | FormDefinition,
  ) => void;
  view: BuilderView;
}
export type BuilderView = "form" | "rules";

export interface FormContextValue {
  activeStepIndex: number;
  dragOverlay: (source: { id: unknown }) => ReactNode;
  handleAddSection: () => void;
  handleAddStep: () => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDuplicate: (id: string) => void;
  handleFieldChange: (
    id: string,
    updater: (field: AnyFieldDefinition) => AnyFieldDefinition,
  ) => void;
  handleRemove: (id: string) => void;
  handleRemoveSection: (id: string) => void;
  handleRemoveStep: (index: number) => void;
  handleStructureChange: (
    id: string,
    patch: SectionAttributes | StepAttributes,
  ) => void;
  handleTapAdd: (type: FieldType) => void;
  isMobile: boolean;
  mobilePanel: MobilePanel;
  renderedSections: { section: SectionDefinition; stepIndex: number }[];
  renderProperties: (fullWidth?: boolean) => ReactNode;
  selectedId: null | string;
  selectedSectionId: null | string;
  selectField: (id: null | string) => void;
  selectSection: (id: string) => void;
  selectStep: (id: string) => void;
  setActiveStepIndex: (index: number) => void;
  setMobilePanel: (panel: MobilePanel) => void;
  steps: StepDefinition[];
}

export type MobilePanel = "canvas" | "output" | "palette" | "properties";

export interface RulesContextValue {
  allFields: AnyFieldDefinition[];
  editingId: null | string;
  editingRule: null | Rule;
  handleChange: (rule: Rule) => void;
  handleCreate: () => void;
  handleDelete: (id: string) => void;
  onBack: () => void;
  openEditor: (id: string) => void;
  rules: Rule[];
}

export interface Selection {
  id: string;
  kind: "field" | "section" | "step";
}

export const BuilderContext = createContext<BuilderContextValue | null>(null);
export const FormContext = createContext<FormContextValue | null>(null);
export const RulesContext = createContext<null | RulesContextValue>(null);

/** Finds a composable part (e.g. `<Builder.Form.Canvas />`) among the
 * builder's children by its static `role` marker. Parts may be nested inside
 * `<Builder.Form>` / `<Builder.Rules>` grouping elements, so the search
 * descends through element children to reach the marked part. */
export const findByRole = (children: ReactNode, role: string): ReactNode => {
  let found: ReactNode = null;
  for (const child of Children.toArray(children)) {
    if (!isValidElement(child)) continue;
    if (
      typeof child.type === "function" &&
      (child.type as { role?: string }).role === role
    ) {
      found = child;
      break;
    }
    found = findByRole(
      (child.props as { children?: ReactNode }).children,
      role,
    );
    if (found !== null) break;
  }
  return found;
};

export function useBuilder(): BuilderContextValue {
  const context = useContext(BuilderContext);
  if (!context) {
    throw new Error("Builder parts must be used within <Builder>.");
  }
  return context;
}

export function useForm(): FormContextValue {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error("<Builder.Form> parts must be used within <Builder.Form>.");
  }
  return context;
}

export function useRules(): RulesContextValue {
  const context = useContext(RulesContext);
  if (!context) {
    throw new Error(
      "<Builder.Rules> parts must be used within <Builder.Rules>.",
    );
  }
  return context;
}
