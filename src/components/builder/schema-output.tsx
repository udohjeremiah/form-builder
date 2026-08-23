"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";

import type { FormDefinition } from "@/types/form-definition";

import { getAllFields } from "@/lib/form-definition";

const generateJSON = (definition: FormDefinition): string => {
  const exportable: FormDefinition = {
    attributes: {
      autosave: definition.attributes.autosave ?? true,
      ...(definition.attributes.description
        ? { description: definition.attributes.description }
        : {}),
      multiStep: !!definition.attributes.multiStep,
      name: definition.attributes.name ?? "My Form",
      submitLabel: definition.attributes.submitLabel ?? "Submit",
    },
    id: definition.id,
    steps: definition.steps,
    version: definition.version,
  };
  return JSON.stringify(exportable, null, 2);
};

export function SchemaOutput({ definition }: { definition: FormDefinition }) {
  const [copied, setCopied] = useState(false);

  const code = generateJSON(definition);
  const fieldCount = getAllFields(definition).length;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-muted/50 px-6 py-3">
        <span className="font-mono text-xs text-muted-foreground">JSON</span>
        <button
          className="flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            void handleCopy();
          }}
        >
          {copied ? (
            <CheckIcon className="size-3 text-primary" />
          ) : (
            <CopyIcon className="size-3" />
          )}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>

      <div className="flex-1 overflow-auto p-6">
        {fieldCount === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">
              Add fields to generate schema
            </p>
          </div>
        ) : (
          <pre className="font-mono text-xs leading-relaxed text-foreground">
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
