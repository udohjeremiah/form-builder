"use client";

import type { ReactNode } from "react";

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

import {
  findByRole,
  FormContext,
  type FormContextValue,
  type MobilePanel,
  useBuilder,
} from "../builder-context";
import { PreviewPanel } from "../preview-panel";
import { FieldProperties } from "./field-properties";
import { StructureProperties } from "./structure-properties";
import { useFormEditor } from "./use-form-editor";

interface FormProps {
  children?: ReactNode;
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

export function Form({ children }: FormProps) {
  const editor = useFormEditor();
  const { allFields, formState, isMobile, preview } = useBuilder();

  const renderProperties = (fullWidth?: boolean) => {
    if (editor.selectedField) {
      return (
        <FieldProperties
          allFields={allFields}
          field={editor.selectedField}
          fullWidth={fullWidth}
          onChange={editor.handleFieldChange}
        />
      );
    }
    if (editor.selectedNode) {
      return (
        <StructureProperties
          fullWidth={fullWidth}
          node={editor.selectedNode}
          onChange={editor.handleStructureChange}
        />
      );
    }
    return (
      <FieldProperties
        allFields={allFields}
        field={null}
        fullWidth={fullWidth}
        onChange={editor.handleFieldChange}
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

  const formContext: FormContextValue = {
    ...editor,
    dragOverlay,
    isMobile,
    renderProperties,
  };

  const palette = findByRole(children, "palette");
  const canvas = findByRole(children, "canvas");
  const properties = findByRole(children, "properties");

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

  return (
    <FormContext.Provider value={formContext}>
      {isMobile ? (
        <div className="flex h-full flex-1 flex-col overflow-hidden">
          <div className="flex-1 overflow-hidden">
            <div
              className="h-full animate-in duration-150 fade-in slide-in-from-right-4"
              key={editor.mobilePanel}
            >
              {editor.mobilePanel === "palette" && palette}
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
                <div className="flex h-full flex-col">
                  <PreviewPanel
                    definition={formState}
                    renderPreview={preview}
                  />
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
      ) : (
        <div className="flex h-full flex-1 overflow-hidden">
          <DragDropProvider
            onDragEnd={editor.handleDragEnd}
            sensors={dragSensors}
          >
            {palette}
            {canvas}
            <DragOverlay>{dragOverlay}</DragOverlay>
          </DragDropProvider>
          {properties}
        </div>
      )}
    </FormContext.Provider>
  );
}
