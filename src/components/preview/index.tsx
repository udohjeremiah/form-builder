"use client";

import { useForm } from "@tanstack/react-form";
import { useEffect, useMemo, useState } from "react";

import type { StepDefinition } from "@/components/builder";

import {
  getFields,
  isFieldVisible,
} from "@/components/builder/form/form-definition";

import { buildDefaultValues, buildFormSchema } from "./schema";
import { type SectionGroup, SectionTabs } from "./section-tabs";
import { Stepper } from "./stepper";

interface FormPreviewProps {
  steps: StepDefinition[];
}

export function FormPreview({ steps }: FormPreviewProps) {
  const multiStepEnabled = steps.length > 1;

  const [activeSection, setActiveSection] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const fields = getFields(steps);

  const defaultValues = useMemo(
    () => buildDefaultValues(fields),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- allFields changes when steps change
    [steps],
  );

  const form = useForm({
    defaultValues: defaultValues,
    onSubmit: ({ value }) => {
      console.log("Form submitted:", value);
    },
  });

  const values = form.state.values;

  // Rebuild the schema against the current form values so conditionally
  // shown/disabled fields participate in (or are exempt from) validation.
  const formSchema = useMemo(
    () => buildFormSchema(fields, values),
    [fields, values],
  );

  useEffect(() => {
    form.update({ validators: { onSubmit: formSchema as never } });
  }, [form, formSchema]);

  const renderedSections = multiStepEnabled
    ? (steps[currentStep]?.sections ?? [])
    : steps.flatMap((step) => step.sections);

  const visibleGroups: SectionGroup[] = renderedSections
    .map((section) => ({
      attributes: section.attributes,
      fields: section.fields.filter((f) => isFieldVisible(fields, values, f)),
      id: section.id,
    }))
    .filter((group) => group.fields.length > 0);

  return (
    <Stepper currentStep={currentStep} onChange={setCurrentStep} steps={steps}>
      <div className="p-6">
        {fields.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">
              Add fields to see preview
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl">
            {visibleGroups.length === 0 ? (
              <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                No fields in this step yet
              </p>
            ) : (
              <SectionTabs
                activeSection={activeSection}
                fields={fields}
                form={form}
                groups={visibleGroups}
                onActiveSection={setActiveSection}
                values={values}
              />
            )}
          </div>
        )}
      </div>
    </Stepper>
  );
}
