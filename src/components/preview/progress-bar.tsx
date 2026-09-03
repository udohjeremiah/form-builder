import { CheckIcon } from "lucide-react";

import type { StepDefinition } from "@/components/builder";

import { cn } from "@/lib/cn";

export function ProgressBar({
  currentStep,
  steps,
}: {
  currentStep: number;
  steps: StepDefinition[];
}) {
  return (
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
}
