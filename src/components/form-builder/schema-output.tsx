"use client";

import type { FormDefinition } from "@/types/form-definition";

import { getAllFields } from "@/lib/form-definition";

const generateJSON = (definition: FormDefinition): string =>
  JSON.stringify(
    {
      id: definition.id,
      version: definition.version,
      // eslint-disable-next-line perfectionist/sort-objects -- member order is part of the emitted schema contract
      steps: definition.steps,
    },
    null,
    2,
  );

export function SchemaOutput({ definition }: { definition: FormDefinition }) {
  const code = generateJSON(definition);
  const fieldCount = getAllFields(definition).length;

  return (
    <div className="flex h-full flex-1 flex-col">
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
