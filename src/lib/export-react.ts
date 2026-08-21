import type { FieldCondition, FormField, FormStep } from "@/types/form";

const LAYOUT_TYPES = new Set<FormField["type"]>([
  "heading",
  "paragraph",
  "separator",
]);

const toKey = (label: string) =>
  label
    .toLowerCase()
    .replaceAll(/\s+/g, "_")
    .replaceAll(/[^a-z0-9_]/g, "") || "field";

const defaultValueExpr = (f: FormField): string => {
  switch (f.type) {
    case "checkbox":
    case "toggle": {
      return "false";
    }
    case "file": {
      return "null";
    }
    case "number":
    case "rating":
    case "slider": {
      return "0";
    }
    default: {
      return '""';
    }
  }
};

const tsType = (f: FormField): string => {
  switch (f.type) {
    case "checkbox":
    case "toggle": {
      return "boolean";
    }
    case "file": {
      return "File | null";
    }
    case "number":
    case "rating":
    case "slider": {
      return "number";
    }
    default: {
      return "string";
    }
  }
};

const validatorExpr = (f: FormField): null | string => {
  if (
    LAYOUT_TYPES.has(f.type) ||
    f.type === "checkbox" ||
    f.type === "toggle" ||
    f.type === "hidden"
  ) {
    return null;
  }

  let rule: string;
  switch (f.type) {
    case "email": {
      rule = 'z.string().email({ message: "Invalid email" })';
      break;
    }
    case "file": {
      rule = f.required
        ? `z.any().refine(Boolean, { message: "${f.label} is required" })`
        : "z.any()";
      break;
    }
    case "number":
    case "rating":
    case "slider": {
      rule = "z.coerce.number()";
      break;
    }
    case "radio":
    case "select": {
      rule =
        f.required && f.options?.length
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

  const ruleAppliable =
    rule.startsWith("z.string()") || rule.startsWith("z.coerce.number()");

  if (ruleAppliable && f.validation?.length) {
    for (const v of f.validation) {
      const messageOption = v.message ? `, { message: "${v.message}" }` : "";
      if (v.type === "min" && v.value != undefined) {
        rule += `.min(${v.value}${messageOption})`;
      }
      if (v.type === "max" && v.value != undefined) {
        rule += `.max(${v.value}${messageOption})`;
      }
      if (v.type === "pattern" && v.value) {
        rule += `.regex(/${v.value}/${messageOption})`;
      }
    }
  }

  const optionalize = !f.required || !!f.condition?.fieldId;
  if (optionalize) {
    if (rule.startsWith("z.coerce.number()")) {
      rule += ".optional()";
    } else if (!rule.includes("refine")) {
      rule += '.optional().or(z.literal(""))';
    }
  } else if (rule.startsWith("z.string()")) {
    rule += `.min(1, { message: "${f.label} is required" })`;
  }

  return rule;
};

const conditionCheck = (
  condition: FieldCondition,
  keyMap: Map<string, string>,
): string => {
  const depKey = keyMap.get(condition.fieldId);
  if (!depKey) return "";
  const v = `values.${depKey}`;
  switch (condition.operator) {
    case "contains": {
      return `String(${v} ?? "").includes("${condition.value ?? ""}")`;
    }
    case "empty": {
      return `!String(${v} ?? "").trim()`;
    }
    case "equals": {
      return `String(${v} ?? "") === "${condition.value ?? ""}"`;
    }
    case "not_empty": {
      return `String(${v} ?? "").trim().length > 0`;
    }
    case "not_equals": {
      return `String(${v} ?? "") !== "${condition.value ?? ""}"`;
    }
    default: {
      return "true";
    }
  }
};

const wrapConditional = (
  jsx: string,
  field: FormField,
  keyMap: Map<string, string>,
): string => {
  if (!field.condition?.fieldId) return jsx;
  const check = conditionCheck(field.condition, keyMap);
  if (!check) return jsx;
  return `        {${check} && (
${jsx
  .split("\n")
  .map((l) => "  " + l)
  .join("\n")}
        )}`;
};

const indentBlock = (code: string, spaces: number): string => {
  const pad = " ".repeat(spaces);
  return code
    .split("\n")
    .map((l) => (l.trim() ? pad + l : l))
    .join("\n");
};

const fieldJSX = (f: FormField, key: string): string => {
  const errorBlock = `{field.state.meta.errors.length > 0 && (
              <p className="text-sm text-red-500">
                {String(field.state.meta.errors[0])}
              </p>
            )}`;
  const labelText = `${f.label}${f.required ? " *" : ""}`;
  const inputClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm";

  let body: string;

  switch (f.type) {
    case "checkbox":
    case "toggle": {
      body = `
<div className="flex items-center gap-2">
  <input
    id={field.name}
    name={field.name}
    type="checkbox"
    checked={field.state.value}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.checked)}
  />
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  ${errorBlock}
</div>`;
      break;
    }

    case "color": {
      body = `
<div className="space-y-2">
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  <input
    id={field.name}
    name={field.name}
    type="color"
    value={String(field.state.value ?? "#000000")}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.value)}
    className="h-10 w-20 rounded-md border border-input cursor-pointer"
  />
  ${errorBlock}
</div>`;
      break;
    }

    case "file": {
      body = `
<div className="space-y-2">
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  <input
    id={field.name}
    name={field.name}
    type="file"
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.files?.[0] ?? null)}
    className="text-sm"
  />
  ${errorBlock}
</div>`;
      break;
    }

    case "heading": {
      return `      <h3 className="text-lg font-semibold pt-2">${f.label}</h3>`;
    }

    case "hidden": {
      return "";
    }
    case "paragraph": {
      return `      <p className="text-sm text-gray-500">${f.placeholder ?? f.label}</p>`;
    }

    case "radio": {
      body = `
<div className="space-y-2">
  <label className="text-sm font-medium">${labelText}</label>
  <div className="flex flex-col gap-2">
${(f.options ?? [])
  .map(
    (o) => `    <label className="flex items-center gap-2 text-sm">
      <input
        type="radio"
        value="${o}"
        checked={field.state.value === "${o}"}
        onBlur={field.handleBlur}
        onChange={() => field.handleChange("${o}")}
      />
      ${o}
    </label>`,
  )
  .join("\n")}
  </div>
  ${errorBlock}
</div>`;
      break;
    }

    case "rating": {
      body = `
<div className="space-y-2">
  <label className="text-sm font-medium">${labelText}</label>
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        onClick={() => field.setValue(star)}
        className={\`text-2xl \${
          (Number(field.state.value) || 0) >= star
            ? "text-yellow-400"
            : "text-gray-300"
        }\`}
      >
        ★
      </button>
    ))}
  </div>
  ${errorBlock}
</div>`;
      break;
    }

    case "select": {
      body = `
<div className="space-y-2">
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  <select
    id={field.name}
    name={field.name}
    value={String(field.state.value ?? "")}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.value)}
    className="${inputClass}"
  >
    <option value="">${f.placeholder ?? "Select..."}</option>
${(f.options ?? [])
  .map((o) => `    <option value="${o}">${o}</option>`)
  .join("\n")}
  </select>
  ${errorBlock}
</div>`;
      break;
    }

    case "separator": {
      return `      <hr className="border-border" />`;
    }

    case "slider": {
      body = `
<div className="space-y-2">
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  <input
    id={field.name}
    name={field.name}
    type="range"
    min="0"
    max="100"
    value={Number(field.state.value) || 0}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(Number(e.target.value))}
    className="w-full"
  />
  ${errorBlock}
</div>`;
      break;
    }

    case "textarea": {
      body = `
<div className="space-y-2">
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  <textarea
    id={field.name}
    name={field.name}
    placeholder="${f.placeholder ?? ""}"
    value={field.state.value}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.value)}
    className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
  />
  ${errorBlock}
</div>`;
      break;
    }

    default: {
      const typeAttribute = f.type === "datetime" ? "datetime-local" : f.type;
      let placeholder = f.placeholder ?? "";
      if (f.type === "url") {
        placeholder = "https://example.com";
      } else if (f.type === "phone") {
        placeholder = "+1 (555) 000-0000";
      }
      body = `
<div className="space-y-2">
  <label htmlFor={field.name} className="text-sm font-medium">
    ${labelText}
  </label>
  <input
    id={field.name}
    name={field.name}
    type="${typeAttribute}"
    placeholder="${placeholder}"
    value={String(field.state.value ?? "")}
    onBlur={field.handleBlur}
    onChange={(e) => field.handleChange(e.target.value)}
    className="${inputClass}"
  />
  ${errorBlock}
</div>`;
    }
  }

  const rule = validatorExpr(f);
  const validatorsAttribute = rule
    ? `
        validators={{
          onChange: ${rule},
        }}`
    : "";

  return `      <form.Field
        name="${key}"${validatorsAttribute}
      >
        {(field) => (${indentBlock(body, 12)}
          )}
      </form.Field>`;
};

export function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: "text/typescript" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.append(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function generateReactComponent(
  fields: FormField[],
  steps: FormStep[],
  multiStep: boolean,
): string {
  const dataFields = fields.filter((f) => !LAYOUT_TYPES.has(f.type));

  const usedKeys = new Map<string, number>();
  const keyMap = new Map<string, string>();
  const uniqueKeys = dataFields.map((f) => {
    const k = toKey(f.label);
    const count = usedKeys.get(k) ?? 0;
    usedKeys.set(k, count + 1);
    const unique = count > 0 ? `${k}_${count}` : k;
    keyMap.set(f.id, unique);
    return unique;
  });

  const needsValues = fields.some((f) => f.condition?.fieldId);
  const needsZod = fields.some((f) => validatorExpr(f) !== null);

  const tsFields = dataFields
    .map((f, index) => `  ${uniqueKeys[index]}: ${tsType(f)};`)
    .join("\n");

  const defaultFields = dataFields
    .map((f, index) => `    ${uniqueKeys[index]}: ${defaultValueExpr(f)},`)
    .join("\n");

  const renderField = (f: FormField): string => {
    const index = dataFields.indexOf(f);
    const key = uniqueKeys[index];
    if (!key) return "";
    return wrapConditional(fieldJSX(f, key), f, keyMap);
  };

  const stepLogic = multiStep && steps.length > 1;

  let stepContent = "";
  let formBody = "";

  if (stepLogic) {
    const stepBlocks = steps
      .map((step, si) => {
        const stepFields = fields.filter((f) => f.step === si);
        const jsx = stepFields
          .map((f) => renderField(f))
          .filter(Boolean)
          .join("\n\n");
        return `      {step === ${si} && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">${step.title}</h2>
${indentBlock(jsx, 10)}
        </div>
      )}`;
      })
      .join("\n\n");

    stepContent = `
  const [step, setStep] = useState(0);
  const totalSteps = ${steps.length};
`;

    formBody = `      {/* Step indicators */}
      <div className="flex gap-2">
        {Array.from({ length: totalSteps }).map((_, i) => (
          <div
            key={i}
            className={\`h-1 flex-1 rounded-full \${
              i <= step ? "bg-blue-500" : "bg-gray-200"
            }\`}
          />
        ))}
      </div>

${stepBlocks}

      <div className="flex gap-3 pt-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-md border px-4 py-2 text-sm"
          >
            Back
          </button>
        )}
        {step < totalSteps - 1 ? (
          <button
            type="button"
            onClick={() => setStep((s) => s + 1)}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white"
          >
            Next
          </button>
        ) : (
          <button
            type="submit"
            disabled={form.state.isSubmitting}
            className="rounded-md bg-blue-500 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {form.state.isSubmitting ? "Submitting..." : "Submit"}
          </button>
        )}
      </div>`;
  } else {
    formBody = `${fields
      .map((f) => renderField(f))
      .filter(Boolean)
      .join("\n\n")}

      <button
        type="submit"
        disabled={form.state.isSubmitting}
        className="w-full rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 disabled:opacity-50"
      >
        {form.state.isSubmitting ? "Submitting..." : "Submit"}
      </button>`;
  }

  return `"use client";

import { useForm } from "@tanstack/react-form";
${stepLogic ? 'import { useState } from "react";\n' : ""}${needsZod ? 'import { z } from "zod";\n' : ""}
type FormValues = {
${tsFields}
};

export default function GeneratedForm() {
  const form = useForm({
    defaultValues: {
${defaultFields}
    } as FormValues,
    onSubmit: ({ value }) => {
      console.log("Form submitted:", value);
      // TODO: Handle form submission
    },
  });
${stepContent}${needsValues ? "  const values = form.useStore((state) => state.values);\n" : ""}
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="mx-auto max-w-lg space-y-6 p-6"
    >
${formBody}
    </form>
  );
}
`;
}
