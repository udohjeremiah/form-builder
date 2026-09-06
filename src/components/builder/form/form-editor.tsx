"use client";

import { PointerActivationConstraints, PointerSensor } from "@dnd-kit/dom";
import { DragDropProvider, DragOverlay } from "@dnd-kit/react";
import {
  Columns3Icon,
  EyeIcon,
  type LucideIcon,
  PanelLeftIcon,
  Settings2Icon,
} from "lucide-react";

import { cn } from "@/lib/cn";

import type {
  AnyFieldDefinition,
  BuilderDefinition,
  PreviewRenderer,
} from "../index";

import { FieldPalette } from "./field-palette";
import { FieldProperties } from "./field-properties";
import { FormCanvas } from "./form-canvas";
import { type MobilePanel, useFormEditor } from "./use-form-editor";

interface FormEditorProps {
  allFields: AnyFieldDefinition[];
  formState: BuilderDefinition;
  isMobile: boolean;
  onPreview?: () => void;
  preview?: PreviewRenderer;
  setFormState: (
    updater:
      ((previous: BuilderDefinition) => BuilderDefinition) | BuilderDefinition,
  ) => void;
}

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

export function FormEditor({
  allFields,
  formState,
  isMobile,
  onPreview,
  preview,
  setFormState,
}: FormEditorProps) {
  const editor = useFormEditor({ formState, isMobile, setFormState });

  const renderProperties = (isMobile?: boolean) => {
    if (editor.selectedField) {
      return (
        <FieldProperties
          allFields={allFields}
          isMobile={isMobile}
          key={editor.selectedField.id}
          onChange={editor.handleFieldChange}
          onStructureChange={editor.handleStructureChange}
          selection={{ field: editor.selectedField, kind: "field" }}
        />
      );
    }

    if (editor.selectedNode) {
      return (
        <FieldProperties
          allFields={allFields}
          isMobile={isMobile}
          key={editor.selectedNode.id}
          onChange={editor.handleFieldChange}
          onStructureChange={editor.handleStructureChange}
          selection={{ kind: "structure", node: editor.selectedNode }}
        />
      );
    }

    return (
      <FieldProperties
        allFields={allFields}
        isMobile={isMobile}
        key="no-selection"
        onChange={editor.handleFieldChange}
        onStructureChange={editor.handleStructureChange}
        selection={{ field: null, kind: "field" }}
      />
    );
  };

  const dragOverlay = (source: { id: unknown }) => {
    const id = String(source.id);

    if (id.startsWith("palette-")) {
      return (
        <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
          {id.replace("palette-", "")}
        </div>
      );
    }

    const stepIndex = editor.steps.findIndex(
      (item) => `step:${item.id}` === id,
    );
    if (stepIndex !== -1) {
      return (
        <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
          {editor.steps[stepIndex]?.attributes.title ?? `Step ${stepIndex + 1}`}
        </div>
      );
    }

    const entry = editor.renderedSections.find(
      (item) => `section:${item.section.id}` === id,
    );
    if (!entry) return null;

    const sectionIndex = editor.renderedSections
      .filter((item) => item.stepIndex === entry.stepIndex)
      .indexOf(entry);

    return (
      <div className="rounded-lg border border-primary/30 bg-muted px-3 py-2 text-sm font-medium text-foreground">
        {entry.section.attributes.title ?? `Section ${sectionIndex + 1}`}
      </div>
    );
  };

  const mobileTabs: {
    icon: LucideIcon;
    key: MobilePanel;
    label: string;
  }[] = [
    { icon: PanelLeftIcon, key: "palette", label: "Fields" },
    { icon: Columns3Icon, key: "canvas", label: "Canvas" },
    { icon: Settings2Icon, key: "properties", label: "Props" },
    { icon: EyeIcon, key: "output", label: "Preview" },
  ];

  const canvas = (
    <FormCanvas
      activeStepIndex={editor.activeStepIndex}
      onAddSection={editor.handleAddSection}
      onAddStep={editor.handleAddStep}
      onDuplicate={editor.handleDuplicate}
      onPreview={isMobile ? undefined : onPreview}
      onRemove={editor.handleRemove}
      onRemoveSection={editor.handleRemoveSection}
      onRemoveStep={editor.handleRemoveStep}
      onSelect={editor.selectField}
      onSelectSection={editor.selectSection}
      onSelectStep={editor.selectStep}
      onStepChange={editor.setActiveStepIndex}
      sections={editor.renderedSections}
      selectedId={editor.selectedId}
      selectedSectionId={editor.selectedSectionId}
      steps={editor.steps}
    />
  );

  const properties = renderProperties(isMobile);

  if (isMobile) {
    return (
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-hidden">
          <div
            className="h-full animate-in duration-150 fade-in slide-in-from-right-4"
            key={editor.mobilePanel}
          >
            {editor.mobilePanel === "palette" && (
              <FieldPalette onTapAdd={editor.handleTapAdd} />
            )}
            {editor.mobilePanel === "canvas" && (
              <DragDropProvider
                onDragEnd={editor.handleDragEnd}
                sensors={dragSensors}
              >
                {canvas}
                <DragOverlay>{dragOverlay}</DragOverlay>
              </DragDropProvider>
            )}
            {editor.mobilePanel === "properties" && (
              <div className="h-full overflow-y-auto">{properties}</div>
            )}
            {editor.mobilePanel === "output" && (
              <div className="h-full overflow-y-auto">
                {preview?.(formState.steps)}
              </div>
            )}
          </div>
        </div>
        <nav className="flex shrink-0 items-center border-t border-border bg-background">
          {mobileTabs.map(({ icon: Icon, key, label }) => (
            <button
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 transition-colors",
                editor.mobilePanel === key
                  ? "text-primary"
                  : "text-muted-foreground/50 hover:text-muted-foreground",
              )}
              key={key}
              onClick={() => {
                editor.setMobilePanel(key);
              }}
            >
              <Icon className="size-4" />
              <span className="text-[10px] font-medium">{label}</span>
              {editor.mobilePanel === key && (
                <div className="mt-0.5 h-0.5 w-4 animate-in rounded-full bg-primary duration-150 zoom-in-50 fade-in" />
              )}
            </button>
          ))}
        </nav>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-1 overflow-hidden">
      <DragDropProvider onDragEnd={editor.handleDragEnd} sensors={dragSensors}>
        <FieldPalette onTapAdd={editor.handleTapAdd} />
        {canvas}
        <DragOverlay>{dragOverlay}</DragOverlay>
      </DragDropProvider>
      {properties}
    </div>
  );
}
