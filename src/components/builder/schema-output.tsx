"use client";

import { motion } from "framer-motion";
import { Check, Copy } from "lucide-react";
import { useState } from "react";

import type { FormField, FormSchema, FormStep } from "@/types/form";

const generateZodSchema = (
  fields: FormField[],
  steps: FormStep[],
  multiStep: boolean,
): string => {
  const fieldToZod = (f: FormField) => {
    if (["heading", "hidden", "paragraph", "separator"].includes(f.type))
      return null;
    let rule = "";
    switch (f.type) {
      case "checkbox":
      case "toggle": {
        rule = "z.boolean()";
        break;
      }
      case "color":
      case "phone":
      case "time":
      case "url": {
        rule = "z.string()";
        break;
      }
      case "date":
      case "datetime": {
        rule = "z.date()";
        break;
      }
      case "email": {
        rule = "z.string().email()";
        break;
      }
      case "file": {
        rule = "z.instanceof(File)";
        break;
      }
      case "number":
      case "rating":
      case "slider": {
        rule = "z.number()";
        break;
      }
      case "radio":
      case "select": {
        rule = f.options?.length
          ? `z.enum([${f.options
              .filter(Boolean)
              .map((o) => `"${o}"`)
              .join(", ")}])`
          : "z.string()";
        break;
      }
      default: {
        rule = "z.string()";
      }
    }
    if (!f.required && f.type !== "checkbox" && f.type !== "toggle") {
      rule += ".optional()";
    }
    const key = f.label
      .toLowerCase()
      .replaceAll(/\s+/g, "_")
      .replaceAll(/[^a-z0-9_]/g, "");
    return `  ${key}: ${rule},`;
  };

  if (multiStep && steps.length > 1) {
    const stepSchemas = steps.map((step, index) => {
      const stepFields = fields.filter((f) => f.step === index);
      const stepKey = step.title
        .toLowerCase()
        .replaceAll(/\s+/g, "_")
        .replaceAll(/[^a-z0-9_]/g, "");
      const lines = stepFields.map((f) => fieldToZod(f)).filter(Boolean);
      return `const ${stepKey}Schema = z.object({\n${lines.join("\n")}\n});`;
    });

    const stepKeys = steps.map((s) =>
      s.title
        .toLowerCase()
        .replaceAll(/\s+/g, "_")
        .replaceAll(/[^a-z0-9_]/g, ""),
    );
    const schemaLines = stepKeys.map((k) => `  ${k}: ${k}Schema,`).join("\n");
    const combined = `const formSchema = z.object({\n${schemaLines}\n});`;

    return `import { z } from "zod";\n\n${stepSchemas.join("\n\n")}\n\n${combined}`;
  }

  const lines = fields.map((f) => fieldToZod(f)).filter(Boolean);
  return `import { z } from "zod";\n\nconst formSchema = z.object({\n${lines.join("\n")}\n});`;
};

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

const SchemaOutput = ({
  fields,
  multiStepEnabled,
  steps,
}: {
  fields: FormField[];
  multiStepEnabled: boolean;
  steps: FormStep[];
}) => {
  const [tab, setTab] = useState<"json" | "zod">("zod");
  const [copied, setCopied] = useState(false);

  const code =
    tab === "zod"
      ? generateZodSchema(fields, steps, multiStepEnabled)
      : generateJSON(fields, steps, multiStepEnabled);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border bg-surface-1 px-6 py-3">
        <div className="flex gap-1">
          {(["zod", "json"] as const).map((t) => (
            <button
              className={`rounded px-3 py-1 font-mono text-xs transition-colors ${
                tab === t
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              key={t}
              onClick={() => {
                setTab(t);
              }}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
        <button
          className="flex items-center gap-1.5 rounded px-2.5 py-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
          onClick={() => {
            void handleCopy();
          }}
        >
          {copied ? (
            <Check className="size-3 text-primary" />
          ) : (
            <Copy className="size-3" />
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
            key={[multiStepEnabled, fields.length, tab].join("-")}
          >
            <code>{code}</code>
          </motion.pre>
        )}
      </div>
    </div>
  );
};

export { SchemaOutput };
