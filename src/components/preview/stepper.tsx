import type { ReactNode } from "react";

import { CheckIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import type { StepDefinition } from "@/components/builder";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";

export function Stepper({
  children,
  currentStep,
  onChange,
  steps,
}: {
  children: ReactNode;
  currentStep: number;
  onChange: (step: number) => void;
  steps: StepDefinition[];
}) {
  const multiStepEnabled = steps.length > 1;

  const stepAttributes = steps[currentStep]?.attributes;
  const previousLabel = stepAttributes?.previousLabel ?? "Back";
  const isLastStep = currentStep === steps.length - 1;
  const nextLabel = isLastStep
    ? (stepAttributes?.submitLabel ?? "Submit")
    : (stepAttributes?.nextLabel ?? "Next");

  if (!multiStepEnabled) return <div className="flex flex-col">{children}</div>;

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-2xl">
        <div className="flex items-center justify-between py-4 max-lg:px-6">
          {steps.map((step, index) => (
            <div
              className="flex flex-1 items-center last:flex-initial"
              key={step.id}
            >
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex size-7 items-center justify-center rounded-full font-mono text-[11px] font-bold transition-all",
                    index < currentStep && "bg-primary text-primary-foreground",
                    index === currentStep &&
                      "border-2 border-primary bg-primary/10 text-primary",
                    index > currentStep &&
                      "border border-border bg-muted text-muted-foreground",
                  )}
                >
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
                <div className="mx-2 -mt-3.5 flex-1">
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
          ))}
        </div>
      </div>
      {children}
      <div className="mx-auto w-full max-w-2xl px-6 py-4">
        <div
          className={cn(
            "flex items-center gap-3",
            currentStep === 0 ? "justify-end" : "justify-between",
          )}
        >
          {currentStep > 0 && (
            <Button
              className="gap-1.5"
              onClick={() => {
                onChange(Math.max(0, currentStep - 1));
              }}
              variant="outline"
            >
              <ChevronLeftIcon className="size-3.5" />
              {previousLabel}
            </Button>
          )}
          <Button
            className="gap-1.5"
            onClick={() => {
              if (currentStep < steps.length - 1) {
                onChange(currentStep + 1);
              }
            }}
          >
            {nextLabel}
            {!isLastStep && <ChevronRightIcon className="size-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
