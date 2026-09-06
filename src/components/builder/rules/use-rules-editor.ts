"use client";

import { useCallback, useState } from "react";

import type {
  AnyFieldDefinition,
  BuilderDefinition,
  RuleDefinition,
} from "../index";

import { addRule, newRule, removeRule, updateRule } from "./rule-definition";

export interface RulesEditorState {
  allFields: AnyFieldDefinition[];
  editingId: null | string;
  editingRule: null | RuleDefinition;
  handleChange: (rule: RuleDefinition) => void;
  handleCreate: () => void;
  handleDelete: (id: string) => void;
  onBack: () => void;
  openEditor: (id: string) => void;
  rules: RuleDefinition[];
}

interface UseRulesEditorArguments {
  allFields: AnyFieldDefinition[];
  formState: BuilderDefinition;
  setFormState: (
    updater:
      ((previous: BuilderDefinition) => BuilderDefinition) | BuilderDefinition,
  ) => void;
}

export function useRulesEditor({
  allFields,
  formState,
  setFormState,
}: UseRulesEditorArguments): RulesEditorState {
  const [editingId, setEditingId] = useState<null | string>(null);
  const rules = formState.rules;
  const editingRule = rules.find((rule) => rule.id === editingId) ?? null;

  const handleCreate = useCallback(() => {
    const rule = newRule();
    setFormState((previous) => ({
      ...previous,
      rules: addRule(previous.rules, rule),
    }));
    setEditingId(rule.id);
  }, [setFormState]);

  const handleChange = useCallback(
    (rule: RuleDefinition) => {
      setFormState((previous) => ({
        ...previous,
        rules: updateRule(previous.rules, rule.id, rule),
      }));
    },
    [setFormState],
  );

  const handleDelete = useCallback(
    (id: string) => {
      setFormState((previous) => ({
        ...previous,
        rules: removeRule(previous.rules, id),
      }));
      setEditingId(null);
    },
    [setFormState],
  );

  return {
    allFields,
    editingId,
    editingRule,
    handleChange,
    handleCreate,
    handleDelete,
    onBack: () => {
      setEditingId(null);
    },
    openEditor: setEditingId,
    rules,
  };
}
