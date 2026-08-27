"use client";

import { useState } from "react";

import type { AnyFieldDefinition } from "@/types/form-definition";
import type { Rule, RulesDefinition } from "@/types/rule-definition";

import {
  addRule,
  newRule,
  removeRule,
  updateRule,
} from "@/lib/rule-definition";

import { RuleEditor } from "./rule-editor";
import { RuleList } from "./rule-list";

export function RulesBuilderView({
  allFields,
  onRulesChange,
  rules,
}: {
  allFields: AnyFieldDefinition[];
  onRulesChange: (rules: RulesDefinition) => void;
  rules: RulesDefinition;
}) {
  const [editingId, setEditingId] = useState<null | string>(null);

  const editingRule = rules.rules.find((rule) => rule.id === editingId) ?? null;

  const handleCreate = () => {
    const rule = newRule();
    onRulesChange(addRule(rules, rule));
    setEditingId(rule.id);
  };

  const handleChange = (rule: Rule) => {
    onRulesChange(updateRule(rules, rule.id, rule));
  };

  const handleDelete = (id: string) => {
    onRulesChange(removeRule(rules, id));
    setEditingId(null);
  };

  return (
    <div className="flex h-full flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {editingRule ? (
          <RuleEditor
            allFields={allFields}
            onBack={() => {
              setEditingId(null);
            }}
            onChange={handleChange}
            onDelete={() => {
              handleDelete(editingRule.id);
            }}
            rule={editingRule}
          />
        ) : (
          <RuleList
            onCreate={handleCreate}
            onEdit={setEditingId}
            rules={rules.rules}
          />
        )}
      </div>
    </div>
  );
}
