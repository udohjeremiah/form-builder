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
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

import type { FormField, FormStep } from "@/types/form";

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
import { evaluateCondition, validateField } from "@/types/form";

const FieldInput = ({
  error,
  field,
  onBlur,
  onChange,
  touched,
  value,
}: {
  error: null | string;
  field: FormField;
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
            id={field.id}
            onCheckedChange={(checked) => {
              onChange(String(checked));
              onBlur();
            }}
          />
          <Label
            className="cursor-pointer text-sm font-normal text-foreground"
            htmlFor={field.id}
          >
            {field.placeholder ?? field.label}
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
                variant="outline"
              />
            }
          >
            <CalendarIcon className="mr-2 size-4" />
            {dateValue ? (
              format(dateValue, "PPP")
            ) : (
              <span>{field.placeholder ?? "Pick a date"}</span>
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
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          type="datetime-local"
          value={value}
        />
      );
    }

    case "file": {
      return (
        <div
          className={`cursor-pointer rounded-lg border-2 border-dashed p-8 text-center transition-colors hover:border-primary/30 ${hasError ? "border-destructive/40 bg-destructive/5" : "border-border"}`}
        >
          <UploadIcon className="mx-auto mb-2 size-5 text-muted-foreground" />
          <p className="font-mono text-xs text-muted-foreground">
            Drop files or click to upload
          </p>
        </div>
      );
    }

    case "heading": {
      return (
        <h3 className="pt-2 text-lg font-semibold text-foreground">
          {field.label}
        </h3>
      );
    }

    case "hidden": {
      return (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/50 px-3 py-2">
          <span className="font-mono text-[10px] text-muted-foreground/50">
            Hidden: {field.label}
          </span>
        </div>
      );
    }

    case "paragraph": {
      return (
        <p className="text-sm leading-relaxed text-muted-foreground">
          {field.placeholder ?? field.label}
        </p>
      );
    }

    case "phone": {
      return (
        <Input
          className={errorClass}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.placeholder ?? "+1 (555) 000-0000"}
          type="tel"
          value={value}
        />
      );
    }

    case "radio": {
      return (
        <RadioGroup
          onValueChange={(v: string) => {
            onChange(v);
            onBlur();
          }}
          value={value}
        >
          {(field.options ?? ["Option 1", "Option 2"])
            .filter(Boolean)
            .map((o) => (
              <div className="flex items-center gap-3" key={o}>
                <RadioGroupItem id={`${field.id}-${o}`} value={o} />
                <Label
                  className="cursor-pointer text-sm font-normal text-foreground"
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
      const ratingValue = value ? Number(value) : 0;
      return (
        <div className="flex items-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              className="p-0.5 transition-colors"
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
          ))}
          {ratingValue > 0 && (
            <span className="ml-2 font-mono text-xs text-muted-foreground">
              {ratingValue}/5
            </span>
          )}
        </div>
      );
    }

    case "select": {
      return (
        <Select
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
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {(field.options ?? []).filter(Boolean).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    case "separator": {
      return <Separator className="my-2" />;
    }

    case "slider": {
      const sliderValue = value ? Number(value) : 50;
      return (
        <div className="space-y-3">
          <Slider
            className="w-full"
            max={100}
            min={0}
            onValueChange={(v: number | readonly number[]) => {
              if (Array.isArray(v)) {
                onChange(String(v[0]));
              } else {
                onChange(String(v));
              }
              onBlur();
            }}
            step={1}
            value={[sliderValue]}
          />
          <div className="flex justify-between font-mono text-[11px] text-muted-foreground">
            <span>0</span>
            <span className="font-medium text-foreground">{sliderValue}</span>
            <span>100</span>
          </div>
        </div>
      );
    }

    case "textarea": {
      return (
        <Textarea
          className={errorClass}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.placeholder}
          rows={3}
          value={value}
        />
      );
    }

    case "time": {
      return (
        <Input
          className={errorClass}
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
            id={field.id}
            onCheckedChange={(checked) => {
              onChange(String(checked));
              onBlur();
            }}
          />
          <Label
            className="cursor-pointer text-sm font-normal text-foreground"
            htmlFor={field.id}
          >
            {field.placeholder ?? field.label}
          </Label>
        </div>
      );
    }

    case "url": {
      return (
        <Input
          className={errorClass}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.placeholder ?? "https://example.com"}
          type="url"
          value={value}
        />
      );
    }

    default: {
      return (
        <Input
          className={errorClass}
          onBlur={onBlur}
          onChange={(event) => {
            onChange(event.target.value);
          }}
          placeholder={field.placeholder}
          type={field.type}
          value={value}
        />
      );
    }
  }
};

const ProgressBar = ({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: FormStep[];
}) => (
  <div className="mb-8">
    <div className="mb-3 flex items-center justify-between">
      {steps.map((step, index) => {
        let circleClass = "border border-border bg-muted text-muted-foreground";
        if (index < currentStep) {
          circleClass = "bg-primary text-primary-foreground";
        } else if (index === currentStep) {
          circleClass = "border-2 border-primary bg-primary/10 text-primary";
        }
        return (
          <div
            className="flex flex-1 items-center last:flex-initial"
            key={step.id}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex size-7 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-all ${circleClass}`}
              >
                {index < currentStep ? (
                  <CheckIcon className="size-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`mt-1.5 font-mono text-[10px] whitespace-nowrap ${index <= currentStep ? "text-foreground" : "text-muted-foreground"}`}
              >
                {step.title}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div className="mx-2 mt-[-14px] flex-1">
                <div className="relative h-px bg-border">
                  <motion.div
                    animate={{ width: index < currentStep ? "100%" : "0%" }}
                    className="absolute inset-y-0 left-0 bg-primary"
                    initial={false}
                    style={{ height: 1 }}
                    transition={{ duration: 0.3 }}
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

export function FormPreview({
  fields,
  multiStepEnabled,
  steps,
}: {
  fields: FormField[];
  multiStepEnabled: boolean;
  steps: FormStep[];
}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [values, setValues] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, null | string>>({});

  const stepFields = multiStepEnabled
    ? fields.filter((f) => f.step === currentStep)
    : fields;

  const visibleFields = stepFields.filter((f) =>
    evaluateCondition(f.condition, values),
  );

  const isLastStep = currentStep === steps.length - 1;
  const isFirstStep = currentStep === 0;

  const handleChange = useCallback(
    (fieldId: string, value: string) => {
      setValues((previous) => ({ ...previous, [fieldId]: value }));
      const field = fields.find((f) => f.id === fieldId);
      if (field && touched[fieldId]) {
        setErrors((previous) => ({
          ...previous,
          [fieldId]: validateField(field, value),
        }));
      }
    },
    [fields, touched],
  );

  const handleBlur = useCallback(
    (fieldId: string) => {
      setTouched((previous) => ({ ...previous, [fieldId]: true }));
      const field = fields.find((f) => f.id === fieldId);
      if (field) {
        setErrors((previous) => ({
          ...previous,
          [fieldId]: validateField(field, values[fieldId] ?? ""),
        }));
      }
    },
    [fields, values],
  );

  const validateStep = useCallback(() => {
    let hasErrors = false;
    const newErrors: Record<string, null | string> = {};
    const newTouched: Record<string, boolean> = {};
    for (const field of visibleFields) {
      newTouched[field.id] = true;
      const error = validateField(field, values[field.id] ?? "");
      newErrors[field.id] = error;
      if (error) hasErrors = true;
    }
    setTouched((previous) => ({ ...previous, ...newTouched }));
    setErrors((previous) => ({ ...previous, ...newErrors }));
    return !hasErrors;
  }, [visibleFields, values]);

  const handleNext = () => {
    if (validateStep() && multiStepEnabled && !isLastStep) {
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
        {fields.length === 0 ? (
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

            <AnimatePresence mode="wait">
              <motion.div
                animate={{ opacity: 1, x: 0 }}
                className="space-y-5"
                exit={{ opacity: 0, x: -20 }}
                initial={{ opacity: 0, x: 20 }}
                key={currentStep}
                transition={{ duration: 0.2 }}
              >
                {multiStepEnabled && (
                  <h4 className="mb-4 text-sm font-semibold text-foreground">
                    {steps[currentStep]?.title}
                  </h4>
                )}

                {visibleFields.length === 0 && multiStepEnabled ? (
                  <p className="py-8 text-center font-mono text-xs text-muted-foreground">
                    No fields in this step yet
                  </p>
                ) : (
                  visibleFields.map((field, index) => {
                    const fieldError = errors[field.id];
                    const fieldTouched = touched[field.id];
                    const isLayout = [
                      "heading",
                      "hidden",
                      "paragraph",
                      "separator",
                    ].includes(field.type);
                    return (
                      <motion.div
                        animate={{ opacity: 1, y: 0 }}
                        className={isLayout ? "" : "space-y-1.5"}
                        initial={{ opacity: 0, y: 10 }}
                        key={field.id}
                        transition={{ delay: index * 0.05 }}
                      >
                        {!isLayout &&
                          field.type !== "checkbox" &&
                          field.type !== "toggle" && (
                            <Label className="flex items-center gap-1 text-sm font-medium text-foreground">
                              {field.label}
                              {field.required && (
                                <span className="text-xs text-primary">*</span>
                              )}
                            </Label>
                          )}
                        <FieldInput
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
                        {!isLayout && (
                          <AnimatePresence>
                            {fieldTouched && fieldError && (
                              <motion.div
                                animate={{ height: "auto", opacity: 1 }}
                                className="flex items-center gap-1.5"
                                exit={{ height: 0, opacity: 0 }}
                                initial={{ height: 0, opacity: 0 }}
                              >
                                <AlertCircleIcon className="size-3 flex-shrink-0 text-destructive" />
                                <span className="text-xs text-destructive">
                                  {fieldError}
                                </span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        )}
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </AnimatePresence>

            <div className="mt-8 flex gap-3">
              {multiStepEnabled && !isFirstStep && (
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    setCurrentStep((s) => Math.max(0, s - 1));
                  }}
                  variant="outline"
                >
                  <ChevronLeftIcon className="size-3.5" />
                  Back
                </Button>
              )}
              <Button
                className="flex-1 gap-1.5 shadow-glow transition-shadow hover:shadow-glow-strong"
                onClick={handleNext}
              >
                {multiStepEnabled && !isLastStep ? (
                  <>
                    Next <ChevronRightIcon className="size-3.5" />
                  </>
                ) : (
                  "Submit"
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
