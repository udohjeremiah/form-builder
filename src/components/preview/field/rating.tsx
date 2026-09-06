/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */
import { StarIcon } from "lucide-react";

import type { FieldComponentProps } from "@/components/builder/form/form-definition";

import { cn } from "@/lib/cn";

export function RatingField({ definition, field }: FieldComponentProps) {
  const attributes = definition.attributes as { max?: number; min?: number };
  const { max = 5, min = 1 } = attributes;
  const ratingValue = field.state.value ? Number(field.state.value) : 0;

  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: max - min + 1 }, (_, index) => min + index).map(
        (star) => (
          <button
            className="p-0.5 transition-colors"
            key={star}
            onClick={() => {
              field.handleChange(String(star));
              field.handleBlur();
            }}
            title={`Rate ${star}`}
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
