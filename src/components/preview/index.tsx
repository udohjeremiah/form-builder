"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { useState } from "react";

import type { AnyFieldDefinition, FormDefinition } from "@/components/builder";

import {
  getAllFields,
  isFieldDisabled,
  isFieldVisible,
  validateFieldValue,
} from "@/components/builder/form/form-definition";
import { Button } from "@/components/ui/button";

import { ProgressBar } from "./progress-bar";
import { type SectionGroup, SectionTabs } from "./section-tabs";

export function FormPreview({ definition }: { definition: FormDefinition }) {
  const steps = definition.steps;
  // Multi-step is derived from the model, matching the canvas.
  const multiStepEnabled = steps.length > 1;

  const [currentStep, setCurrentStep] = useState(0);
  const [activeSection, setActiveSection] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, null | string>>({});

  const allFields = getAllFields(definition);

  // Fields render grouped by section, shown one section at a time via tabs.
  const renderedSections = multiStepEnabled
    ? (steps[currentStep]?.sections ?? [])
    : steps.flatMap((step) => step.sections);

  const visibleGroups: SectionGroup[] = renderedSections
    .map((section) => ({
      attributes: section.attributes,
      fields: section.fields.filter((f) =>
        isFieldVisible(f, values, allFields),
      ),
      id: section.id,
    }))
    .filter((group) => group.fields.length > 0);

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const stepNextLabel =
    steps[currentStep]?.attributes.nextLabel ??
    (isLastStep ? "Submit" : "Next");
  const stepPreviousLabel =
    steps[currentStep]?.attributes.previousLabel ?? "Back";

  const handleChange = (fieldId: string, value: string) => {
    setValues((previous) => ({ ...previous, [fieldId]: value }));
    const field = allFields.find((f) => f.id === fieldId);
    if (field && touched[fieldId]) {
      setErrors((previous) => ({
        ...previous,
        [fieldId]: validateFieldValue(field, value),
      }));
    }
  };

  const handleBlur = (fieldId: string) => {
    setTouched((previous) => ({ ...previous, [fieldId]: true }));
    const field = allFields.find((f) => f.id === fieldId);
    if (field) {
      setErrors((previous) => ({
        ...previous,
        [fieldId]: validateFieldValue(field, values[fieldId] ?? ""),
      }));
    }
  };

  const validateStep = () => {
    let hasErrors = false;
    const newErrors: Record<string, null | string> = {};
    const newTouched: Record<string, boolean> = {};
    const visibleFields: AnyFieldDefinition[] = visibleGroups.flatMap(
      (group) => group.fields,
    );
    for (const field of visibleFields) {
      // Disabled fields cannot be filled in, so they must not block submit.
      if (isFieldDisabled(field, values, allFields)) continue;
      newTouched[field.id] = true;
      const error = validateFieldValue(field, values[field.id] ?? "");
      newErrors[field.id] = error;
      if (error) hasErrors = true;
    }
    setTouched((previous) => ({ ...previous, ...newTouched }));
    setErrors((previous) => ({ ...previous, ...newErrors }));
    return !hasErrors;
  };

  const goToStep = (next: number) => {
    setActiveSection(0);
    setCurrentStep(Math.max(0, Math.min(next, steps.length - 1)));
  };

  const handleNext = () => {
    if (validateStep() && !isLastStep) {
      goToStep(currentStep + 1);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-y-auto p-6">
        {allFields.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">
              Add fields to see preview
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            {multiStepEnabled && steps.length > 1 && (
              <ProgressBar currentStep={currentStep} steps={steps} />
            )}

            {visibleGroups.length === 0 ? (
              <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                No fields in this step yet
              </p>
            ) : (
              <SectionTabs
                activeSection={activeSection}
                allFields={allFields}
                errors={errors}
                groups={visibleGroups}
                onActiveSection={setActiveSection}
                onBlur={handleBlur}
                onChange={handleChange}
                onSubmitStep={handleNext}
                stepNextLabel={stepNextLabel}
                touched={touched}
                values={values}
              />
            )}

            {multiStepEnabled && (
              <div className="mt-8 flex gap-3">
                {!isFirstStep && (
                  <Button
                    className="gap-1.5"
                    onClick={() => {
                      goToStep(currentStep - 1);
                    }}
                    variant="outline"
                  >
                    <ChevronLeftIcon className="size-3.5" />
                    {stepPreviousLabel}
                  </Button>
                )}
                <Button className="flex-1 gap-1.5" onClick={handleNext}>
                  {stepNextLabel}
                  {!isLastStep && <ChevronRightIcon className="size-3.5" />}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
