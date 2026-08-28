"use client";

import type { ReactNode } from "react";

import {
  Code2Icon,
  EyeIcon,
  ListChecksIcon,
  type LucideIcon,
} from "lucide-react";

import type { FormDefinition } from "@/types/form-definition";

import { FormPreview } from "@/components/form-builder/form-preview";
import { SchemaOutput } from "@/components/form-builder/schema-output";
import { RulesSchemaOutput } from "@/components/rules-builder/rules-schema-output";
import { cn } from "@/lib/cn";

export type PreviewPanelTab = "rules-schema" | "schema" | "ui";

const PREVIEW_TABS: {
  icon: LucideIcon;
  key: PreviewPanelTab;
  label: string;
}[] = [
  { icon: EyeIcon, key: "ui", label: "UI" },
  { icon: Code2Icon, key: "schema", label: "Form Schema" },
  { icon: ListChecksIcon, key: "rules-schema", label: "Rules Schema" },
];

export function PreviewPanel({
  definition,
  onTabChange,
  tab,
}: {
  definition: FormDefinition;
  onTabChange: (tab: PreviewPanelTab) => void;
  tab: PreviewPanelTab;
}) {
  let content: ReactNode;
  switch (tab) {
    case "rules-schema": {
      content = <RulesSchemaOutput definition={definition.rules} />;
      break;
    }
    case "schema": {
      content = <SchemaOutput definition={definition} />;
      break;
    }
    default: {
      content = <FormPreview definition={definition} />;
      break;
    }
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center bg-muted/50 p-2">
        {PREVIEW_TABS.map(({ icon: Icon, key, label }) => (
          <button
            className={cn(
              "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium transition-all",
              tab === key
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground/50 hover:text-foreground",
            )}
            key={key}
            onClick={() => {
              onTabChange(key);
            }}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">{content}</div>
    </div>
  );
}
