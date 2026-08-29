"use client";

import { useCallback, useState } from "react";

import type { RulesContextValue } from "../builder-context";
import type { Rule } from "../index";

import { useBuilder } from "../builder-context";
import { addRule, newRule, removeRule, updateRule } from "./rule-definition";

export function useRulesEditor(): RulesContextValue {
  const { allFields, formState, setFormState } = useBuilder();

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
    (rule: Rule) => {
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
