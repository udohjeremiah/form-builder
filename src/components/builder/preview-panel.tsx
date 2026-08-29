"use client";

import type { ReactNode } from "react";

import type { FormDefinition } from "./index";

export type PreviewRenderer = (definition: FormDefinition) => ReactNode;

export function PreviewPanel({
  definition,
  renderPreview,
}: {
  definition: FormDefinition;
  renderPreview?: PreviewRenderer;
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      {renderPreview?.(definition)}
    </div>
  );
}
