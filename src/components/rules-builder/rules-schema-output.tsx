"use client";

import type { RulesDefinition } from "@/types/rule-definition";

const generateJSON = (definition: RulesDefinition): string =>
  JSON.stringify(
    {
      id: definition.id,
      version: definition.version,
      // eslint-disable-next-line perfectionist/sort-objects -- member order is part of the emitted schema contract
      rules: definition.rules,
    },
    null,
    2,
  );

export function RulesSchemaOutput({
  definition,
}: {
  definition: RulesDefinition;
}) {
  const code = generateJSON(definition);
  const ruleCount = definition.rules.length;

  return (
    <div className="flex h-full flex-1 flex-col">
      <div className="flex-1 overflow-auto p-6">
        {ruleCount === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="font-mono text-sm text-muted-foreground">
              Add rules to generate schema
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
