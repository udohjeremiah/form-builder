"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";

import type { FormField, FormSchema, FormStep } from "@/types/form";

const generateJSON = (
  fields: FormField[],
  steps: FormStep[],
  multiStep: boolean,
): string => {
  const schema: FormSchema = {
    fields: fields.map((f) => ({
      id: f.id,
      label: f.label,
      options: f.options,
      placeholder: f.placeholder,
      required: f.required,
      step: f.step,
      type: f.type,
    })),
    id: "form_" + Date.now().toString(36),
    name: "My Form",
    settings: {
      autosave: true,
      multiStep,
      submitLabel: "Submit",
    },
    steps: multiStep ? steps : undefined,
  };
  return JSON.stringify(schema, null, 2);
};

export function SchemaOutput({
  fields,
  multiStepEnabled,
  steps,
}: {
  fields: FormField[];
  multiStepEnabled: boolean;
  steps: FormStep[];
}) {
  const [copied, setCopied] = useState(false);

  const code = generateJSON(fields, steps, multiStepEnabled);

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
        {fields.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">
              Add fields to generate schema
            </p>
          </div>
        ) : (
          <motion.pre
            animate={{ opacity: 1 }}
            className="font-mono text-xs leading-relaxed text-foreground"
            initial={{ opacity: 0 }}
            key={[multiStepEnabled, fields.length].join("-")}
          >
            <code>{code}</code>
          </motion.pre>
        )}
      </div>
    </div>
  );
}
