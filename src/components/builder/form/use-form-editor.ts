"use client";

import type { DragEndEvent } from "@dnd-kit/react";

import { isSortable } from "@dnd-kit/react/sortable";
import { useCallback, useState } from "react";

import type {
  AnyFieldDefinition,
  BuilderDefinition,
  FieldType,
  SectionAttributes,
  StepAttributes,
  StepDefinition,
} from "../index";
import type { StructureNode } from "./field-properties";

import {
  addSection,
  addStep,
  appendField,
  appendFieldToSection,
  duplicateField,
  getField,
  moveField,
  moveFieldIntoSection,
  moveFieldWithinSection,
  moveSection,
  moveStep,
  newField,
  removeField,
  removeSection,
  removeStep,
  updateField,
  updateSectionAttributes,
  updateStepAttributes,
} from "./form-definition";

export interface FormEditorState {
  activeStepIndex: number;
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
  handleRemoveStep: (id: string) => void;
  handleStructureChange: (
    id: string,
    patch: SectionAttributes | StepAttributes,
  ) => void;
  handleTapAdd: (type: FieldType) => void;
  mobilePanel: MobilePanel;
  renderedSections: {
    section: StepDefinition["sections"][number];
    stepIndex: number;
  }[];
  selectedField: AnyFieldDefinition | null;
  selectedId: null | string;
  selectedNode: null | StructureNode;
  selectedSectionId: null | string;
  selectField: (id: null | string) => void;
  selectSection: (id: string) => void;
  selectStep: (id: string) => void;
  setActiveStepIndex: (index: number) => void;
  setMobilePanel: (panel: MobilePanel) => void;
  steps: StepDefinition[];
}

export type MobilePanel = "canvas" | "output" | "palette" | "properties";

type FormUpdater =
  ((previous: BuilderDefinition) => BuilderDefinition) | BuilderDefinition;

interface Selection {
  id: string;
  kind: "field" | "section" | "step";
}

export function useFormEditor(arguments_: {
  formState: BuilderDefinition;
  isMobile: boolean;
  setFormState: (updater: FormUpdater) => void;
}): FormEditorState {
  const { formState, isMobile, setFormState } = arguments_;

  const steps = formState.steps;
  const multiStepEnabled = steps.length > 1;

  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [selection, setSelection] = useState<null | Selection>(null);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("canvas");

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

      const sourceId = String(source.id);

      if (sourceId.startsWith("palette-")) {
        const type = source.data["type"] as FieldType | undefined;
        if (!type) return;

        const field = newField(type);
        if (targetId !== null && droppedOnSection) {
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

      let sourceSectionId: null | string = null;
      let sourceOffset = 0;

      for (const entry of renderedSections) {
        if (entry.section.fields.some((field) => field.id === fieldId)) {
          sourceSectionId = entry.section.id;
          break;
        }
        sourceOffset += entry.section.fields.length;
      }

      let targetSectionId: null | string =
        targetId !== null && droppedOnSection ? targetId : null;

      if (targetSectionId === null && targetId !== null) {
        for (const entry of renderedSections) {
          if (entry.section.fields.some((field) => field.id === targetId)) {
            targetSectionId = entry.section.id;
            break;
          }
        }
      }

      if (
        sourceSectionId !== null &&
        sourceSectionId === targetSectionId &&
        isSortable(source)
      ) {
        const fromLocal = source.initialIndex - sourceOffset;
        const toLocal = source.index - sourceOffset;
        setFormState((previous) =>
          moveFieldWithinSection(previous, sourceSectionId, fromLocal, toLocal),
        );
        return;
      }

      if (targetId !== null && droppedOnSection) {
        setFormState((previous) =>
          moveFieldIntoSection(previous, fieldId, targetId),
        );
        return;
      }

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
      selectField,
      setFormState,
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
      setFormState((previous) => removeSection(previous, id));

      const removed = renderedSections.find(
        (entry) => entry.section.id === id,
      )?.section;

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
    (id: string) => {
      if (steps.length <= 1) return;

      const index = steps.findIndex((step) => step.id === id);
      if (index === -1) return;

      setFormState((previous) => removeStep(previous, index));
      setActiveStepIndex((previous) => Math.min(previous, steps.length - 2));

      const removed = steps[index];

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
    (id: string, patch: SectionAttributes | StepAttributes) => {
      if (!selection || selection.kind === "field") return;

      const kind = selection.kind;
      setFormState((previous) =>
        kind === "step"
          ? updateStepAttributes(previous, id, patch)
          : updateSectionAttributes(previous, id, patch),
      );
    },
    [selection, setFormState],
  );

  const handleTapAdd = useCallback(
    (type: FieldType) => {
      const field = newField(type);
      setFormState((previous) => appendField(previous, activeStepIndex, field));
      selectField(field.id);
      setMobilePanel("canvas");
    },
    [activeStepIndex, setFormState, selectField],
  );

  return {
    activeStepIndex,
    handleAddSection,
    handleAddStep,
    handleDragEnd,
    handleDuplicate,
    handleFieldChange,
    handleRemove,
    handleRemoveSection,
    handleRemoveStep,
    handleStructureChange,
    handleTapAdd,
    mobilePanel,
    renderedSections,
    selectedField,
    selectedId: selection?.kind === "field" ? selection.id : null,
    selectedNode,
    selectedSectionId: selection?.kind === "section" ? selection.id : null,
    selectField,
    selectSection,
    selectStep,
    setActiveStepIndex,
    setMobilePanel,
    steps,
  };
}
