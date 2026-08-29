"use client";

import type { ReactNode } from "react";

import { findByRole, RulesContext } from "../builder-context";
import { useRulesEditor } from "./use-rules-editor";

interface RulesProps {
  children?: ReactNode;
}

export function Rules({ children }: RulesProps) {
  const rulesContext = useRulesEditor();

  const list = findByRole(children, "list");
  const editor = findByRole(children, "editor");

  return (
    <RulesContext.Provider value={rulesContext}>
      <div className="flex h-full flex-1 flex-col overflow-hidden">
        <div className="flex-1 overflow-y-auto">
          {rulesContext.editingRule ? editor : list}
        </div>
      </div>
    </RulesContext.Provider>
  );
}
