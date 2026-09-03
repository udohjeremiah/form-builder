import { StarIcon } from "lucide-react";

import { cn } from "@/lib/cn";

import type { FieldInputPropsFor } from "../types";

export function RatingField({
  disabled,
  field,
  onBlur,
  onChange,
  value,
}: FieldInputPropsFor<"rating">) {
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
