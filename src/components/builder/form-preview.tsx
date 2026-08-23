"use client";

import { format } from "date-fns";
import {
  AlertCircleIcon,
  CalendarIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  StarIcon,
  UploadIcon,
} from "lucide-react";
import { Fragment, useCallback, useState } from "react";

import type {
  AnyFieldDefinition,
  FormDefinition,
  StepDefinition,
} from "@/types/form-definition";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import {
  getAllFields,
  isFieldDisabled,
  isFieldVisible,
  validateFieldValue,
} from "@/lib/form-definition";

const FieldInput = ({
  disabled,
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: {
  disabled: boolean;
  error: null | string;
  field: AnyFieldDefinition;
  onBlur: () => void;
  onChange: (value: string) => void;
  touched: boolean;
  value: string;
}) => {
  const hasError = touched && !!error;
  const errorClass = hasError
    ? "border-destructive/60 focus-visible:ring-destructive/30"
    : "";

  switch (field.type) {
    case "checkbox": {
      return (
        <div className="flex items-center gap-3">
          <Checkbox
            checked={value === "true"}
            disabled={disabled}
            id={field.id}
            onCheckedChange={(checked) => {
              onChange(String(checked));
              onBlur();
            }}
          />
          <Label
            className={cn(
              "text-sm font-normal text-foreground",
              disabled ? "cursor-default opacity-60" : "cursor-pointer",
            )}
            htmlFor={field.id}
          >
            {field.attributes.placeholder ?? field.attributes.label}
          </Label>
        </div>
      );
    }

    case "color": {
      return (
        <div className="flex items-center gap-3">
          <div
            className="size-10 cursor-pointer overflow-hidden rounded-lg border border-border"
            style={{ backgroundColor: value || "#3b82f6" }}
          >
            <input
              className="size-full cursor-pointer opacity-0"
              disabled={disabled}
              onChange={(event) => {
                onChange(event.target.value);
                onBlur();
              }}
              type="color"
              value={value || "#3b82f6"}
            />
          </div>
          <Input
            className={cn("flex-1 font-mono text-xs", errorClass)}
            disabled={disabled}
            onBlur={onBlur}
            onChange={(event) => {
              onChange(event.target.value);
            }}
            placeholder="#000000"
            value={value || "#3b82f6"}
          />
        </div>
      );
    }

    case "date": {
      const dateValue = value ? new Date(value) : undefined;
      return (
        <Popover>
          <PopoverTrigger
            render={
              <Button
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !dateValue && "text-muted-foreground",
                  hasError && "border-destructive/60",
                )}
                disabled={disabled}
                variant="outline"
              />
            }
          >
            <CalendarIcon className="mr-2 size-4" />
            {dateValue ? (
              format(dateValue, "PPP")
            ) : (
              <span>{field.attributes.placeholder ?? "Pick a date"}</span>
            )}
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              className={cn("pointer-events-auto p-3")}
              mode="single"
              onSelect={(d) => {
                onChange(d ? d.toISOString() : "");
                onBlur();
              }}
              selected={dateValue}
            />
          </PopoverContent>
        </Popover>
      );
    }

    case "datetime": {
      return (
        <Input
          className={errorClass}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          type="datetime-local"
          value={value}
        />
      );
    }

    case "email":
    case "password":
    case "text": {
      const { autoComplete, maxLength, placeholder } = field.attributes;
      return (
        <Input
          autoComplete={autoComplete}
          className={errorClass}
          disabled={disabled}
          maxLength={maxLength}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          type={field.type}
          value={value}
        />
      );
    }

    case "file": {
      return (
        <div
          className={cn(
            "rounded-lg border-2 border-dashed p-8 text-center transition-colors",
            disabled
              ? "pointer-events-none border-border opacity-50"
              : "cursor-pointer hover:border-primary/30",
            hasError
              ? "border-destructive/40 bg-destructive/5"
              : "border-border",
          )}
        >
          <UploadIcon className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground">
            Drop files or click to upload
          </p>
        </div>
      );
    }

    case "number": {
      const { max, min, placeholder, step } = field.attributes;
      return (
        <Input
          className={errorClass}
          disabled={disabled}
          max={max}
          min={min}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={placeholder}
          step={step}
          type="number"
          value={value}
        />
      );
    }

    case "phone": {
      return (
        <Input
          className={errorClass}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.attributes.placeholder ?? "+1 (555) 000-0000"}
          type="tel"
          value={value}
        />
      );
    }

    case "radio": {
      return (
        <RadioGroup
          disabled={disabled}
          onValueChange={(v: string) => {
            onChange(v);
            onBlur();
          }}
          value={value}
        >
          {(field.attributes.options ?? ["Option 1", "Option 2"])
            .filter(Boolean)
            .map((o) => (
              <div className="flex items-center gap-3" key={o}>
                <RadioGroupItem id={`${field.id}-${o}`} value={o} />
                <Label
                  className={cn(
                    "text-sm font-normal text-foreground",
                    disabled ? "cursor-default opacity-60" : "cursor-pointer",
                  )}
                  htmlFor={`${field.id}-${o}`}
                >
                  {o}
                </Label>
              </div>
            ))}
        </RadioGroup>
      );
    }

    case "rating": {
      const { max = 5, min = 1 } = field.attributes;
      const ratingValue = value ? Number(value) : 0;
      return (
        <div className="flex items-center gap-1">
          {Array.from({ length: max - min + 1 }, (_, index) => min + index).map(
            (star) => (
              <button
                className="p-0.5 transition-colors"
                disabled={disabled}
                key={star}
                onClick={() => {
                  onChange(String(star));
                  onBlur();
                }}
                type="button"
              >
                <StarIcon
                  className={cn(
                    "size-6 transition-colors",
                    star <= ratingValue
                      ? "fill-primary text-primary"
                      : "text-border hover:text-primary/40",
                  )}
                />
              </button>
            ),
          )}
          {ratingValue > 0 && (
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {ratingValue}/{max}
            </span>
          )}
        </div>
      );
    }

    case "select": {
      return (
        <Select
          disabled={disabled}
          onValueChange={(v) => {
            if (!v) return;
            onChange(v);
            onBlur();
          }}
          value={value || undefined}
        >
          <SelectTrigger
            className={
              hasError ? "border-destructive/60 focus:ring-destructive/30" : ""
            }
          >
            <SelectValue
              placeholder={field.attributes.placeholder ?? "Select..."}
            />
          </SelectTrigger>
          <SelectContent>
            {(field.attributes.options ?? []).filter(Boolean).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "slider": {
      const { max = 100, min = 0, step = 1 } = field.attributes;
      const sliderValue = value
        ? Number(value)
        : Math.min(Math.max(50, min), max);
      return (
        <div className="space-y-3">
          <Slider
            className="w-full"
            disabled={disabled}
            max={max}
            min={min}
            onValueChange={(v: number | readonly number[]) => {
              if (Array.isArray(v)) {
                onChange(String(v[0]));
              } else {
                onChange(String(v));
              }
              onBlur();
            }}
            step={step}
            value={[sliderValue]}
          />
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>{min}</span>
            <span className="font-medium text-foreground">{sliderValue}</span>
            <span>{max}</span>
          </div>
        </div>
      );
    }

    case "textarea": {
      return (
        <Textarea
          className={errorClass}
          disabled={disabled}
          maxLength={field.attributes.maxLength}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.attributes.placeholder}
          rows={3}
          value={value}
        />
      );
    }

    case "time": {
      return (
        <Input
          className={errorClass}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          type="time"
          value={value}
        />
      );
    }

    case "toggle": {
      return (
        <div className="flex items-center gap-3">
          <Switch
            checked={value === "true"}
            disabled={disabled}
            id={field.id}
            onCheckedChange={(checked) => {
              onChange(String(checked));
              onBlur();
            }}
          />
          <Label
            className={cn(
              "text-sm font-normal text-foreground",
              disabled ? "cursor-default opacity-60" : "cursor-pointer",
            )}
            htmlFor={field.id}
          >
            {field.attributes.placeholder ?? field.attributes.label}
          </Label>
        </div>
      );
    }

    case "url": {
      return (
        <Input
          className={errorClass}
          disabled={disabled}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.attributes.placeholder ?? "https://example.com"}
          type="url"
          value={value}
        />
      );
    }

    default: {
      return null;
    }
  }
};

const ProgressBar = ({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: StepDefinition[];
}) => (
  <div className="mb-8">
    <div className="mb-3 flex items-center justify-between">
      {steps.map((step, index) => {
        const circleClass = cn(
          "flex size-7 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-all",
          index < currentStep && "bg-primary text-primary-foreground",
          index === currentStep &&
            "border-2 border-primary bg-primary/10 text-primary",
          index > currentStep &&
            "border border-border bg-muted text-muted-foreground",
        );
        return (
          <div
            className="flex flex-1 items-center last:flex-initial"
            key={step.id}
          >
            <div className="flex flex-col items-center">
              <div className={circleClass}>
                {index < currentStep ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-1.5 font-mono text-[10px] whitespace-nowrap",
                  index <= currentStep
                    ? "text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {step.attributes.title ?? `Step ${index + 1}`}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-2 mt-[-14px] flex-1">
                <div className="relative h-px bg-border">
                  <div
                    className="absolute inset-y-0 left-0 bg-primary transition-[width] duration-300"
                    style={{
                      height: 1,
                      width: index < currentStep ? "100%" : "0%",
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  </div>
);

export function FormPreview({ definition }: { definition: FormDefinition }) {
  const steps = definition.steps;
  // Multi-step is derived from the model, matching the canvas.
  const multiStepEnabled = steps.length > 1;

  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, null | string>>({});

  const allFields = getAllFields(definition);

  // Fields render grouped by section, with a divider between sections.
  const renderedSections = multiStepEnabled
    ? (steps[currentStep]?.sections ?? [])
    : steps.flatMap((step) => step.sections);

  const visibleGroups = renderedSections
    .map((section) => ({
      attributes: section.attributes,
      fields: section.fields.filter((f) => isFieldVisible(f, values)),
      id: section.id,
    }))
    .filter((group) => group.fields.length > 0);

  const visibleFields = visibleGroups.flatMap((group) => group.fields);

  // Running field index per group so the entry stagger stays continuous.
  const groupOffsets: number[] = [];
  let accumulator = 0;
  for (const group of visibleGroups) {
    groupOffsets.push(accumulator);
    accumulator += group.fields.length;
  }

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleChange = useCallback(
    (fieldId: string, value: string) => {
      setValues((previous) => ({ ...previous, [fieldId]: value }));
      const field = allFields.find((f) => f.id === fieldId);
      if (field && touched[fieldId]) {
        setErrors((previous) => ({
          ...previous,
          [fieldId]: validateFieldValue(field, value),
        }));
      }
    },
    [allFields, touched],
  );

  const handleBlur = useCallback(
    (fieldId: string) => {
      setTouched((previous) => ({ ...previous, [fieldId]: true }));
      const field = allFields.find((f) => f.id === fieldId);
      if (field) {
        setErrors((previous) => ({
          ...previous,
          [fieldId]: validateFieldValue(field, values[fieldId] ?? ""),
        }));
      }
    },
    [allFields, values],
  );

  const validateStep = () => {
    let hasErrors = false;
    const newErrors: Record<string, null | string> = {};
    const newTouched: Record<string, boolean> = {};
    for (const field of visibleFields) {
      // Disabled fields cannot be filled in, so they must not block submit.
      if (isFieldDisabled(field, values)) continue;
      newTouched[field.id] = true;
      const error = validateFieldValue(field, values[field.id] ?? "");
      newErrors[field.id] = error;
      if (error) hasErrors = true;
    }
    setTouched((previous) => ({ ...previous, ...newTouched }));
    setErrors((previous) => ({ ...previous, ...newErrors }));
    return !hasErrors;
  };

  const handleNext = () => {
    if (validateStep() && !isLastStep) {
      setCurrentStep((s) => s + 1);
    }
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-3">
        <h3 className="font-mono text-xs tracking-wider text-muted-foreground uppercase">
          Preview
        </h3>
        {multiStepEnabled && (
          <span className="font-mono text-[11px] text-muted-foreground">
            {currentStep + 1} / {steps.length}
          </span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-8">
        {allFields.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">
              Add fields to see preview
            </p>
          </div>
        ) : (
          <div className="mx-auto max-w-md">
            {multiStepEnabled && steps.length > 1 && (
              <ProgressBar currentStep={currentStep} steps={steps} />
            )}

            <div
              className="animate-in space-y-5 duration-200 fade-in slide-in-from-right-4"
              key={currentStep}
            >
              {multiStepEnabled && (
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-foreground">
                    {steps[currentStep]?.attributes.title ??
                      `Step ${currentStep + 1}`}
                  </h4>
                  {steps[currentStep]?.attributes.description && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {steps[currentStep].attributes.description}
                    </p>
                  )}
                </div>
              )}

              {visibleFields.length === 0 && multiStepEnabled ? (
                <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                  No fields in this step yet
                </p>
              ) : (
                visibleGroups.map((group, groupIndex) => {
                  const showHeader =
                    group.attributes.title !== undefined ||
                    group.attributes.description !== undefined;
                  return (
                    <Fragment key={group.id}>
                      {groupIndex > 0 && <Separator className="my-6" />}
                      {showHeader && (
                        <div>
                          {group.attributes.title && (
                            <h5 className="text-[13px] font-semibold text-foreground">
                              {group.attributes.title}
                            </h5>
                          )}
                          {group.attributes.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {group.attributes.description}
                            </p>
                          )}
                        </div>
                      )}
                      {group.fields.map((field, fieldIndex) => {
                        const fieldError = errors[field.id];
                        const fieldTouched = touched[field.id];
                        const fieldDisabled = isFieldDisabled(field, values);
                        const index =
                          (groupOffsets[groupIndex] ?? 0) + fieldIndex;
                        return (
                          <div
                            className={cn(
                              "animate-in space-y-1.5 duration-300 fill-mode-both fade-in slide-in-from-bottom-2",
                              fieldDisabled && "opacity-50",
                            )}
                            key={field.id}
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            {field.type !== "checkbox" &&
                              field.type !== "toggle" && (
                                <>
                                  <Label className="flex items-center gap-1 text-sm font-medium text-foreground">
                                    {field.attributes.label}
                                    {field.attributes.required && (
                                      <span className="text-xs text-primary">
                                        *
                                      </span>
                                    )}
                                  </Label>
                                  {field.attributes.description && (
                                    <p className="text-xs text-muted-foreground">
                                      {field.attributes.description}
                                    </p>
                                  )}
                                </>
                              )}
                            <FieldInput
                              disabled={fieldDisabled}
                              error={fieldError ?? null}
                              field={field}
                              onBlur={() => {
                                handleBlur(field.id);
                              }}
                              onChange={(value) => {
                                handleChange(field.id, value);
                              }}
                              touched={!!fieldTouched}
                              value={values[field.id] ?? ""}
                            />
                            {(field.type === "checkbox" ||
                              field.type === "toggle") &&
                              field.attributes.description && (
                                <p className="text-xs text-muted-foreground">
                                  {field.attributes.description}
                                </p>
                              )}
                            {fieldTouched && fieldError && (
                              <div className="flex items-center gap-1.5 pt-1 text-xs text-destructive">
                                <AlertCircleIcon className="size-3 shrink-0" />
                                <span>{fieldError}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </Fragment>
                  );
                })
              )}
            </div>

            <div className="mt-8 flex gap-3">
              {!isFirstStep && (
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    setCurrentStep((s) => Math.max(0, s - 1));
                  }}
                  variant="outline"
                >
                  <ChevronLeftIcon className="size-3.5" />
                  {steps[currentStep]?.attributes.previousLabel ?? "Back"}
                </Button>
              )}
              <Button
                className="flex-1 gap-1.5 shadow-glow transition-shadow hover:shadow-glow-strong"
                onClick={handleNext}
              >
                {isLastStep ? (
                  (steps[currentStep]?.attributes.nextLabel ?? "Submit")
                ) : (
                  <>
                    {steps[currentStep]?.attributes.nextLabel ?? "Next"}{" "}
                    <ChevronRightIcon className="size-3.5" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
