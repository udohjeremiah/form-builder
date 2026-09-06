import type { AnyFormApi } from "@tanstack/react-form";

import type {
  ComparisonCondition,
  Condition,
  Duration,
  ExistsCondition,
  GroupCondition,
  ReviewCondition,
  RuleDefinition,
  RuleOutcome,
  RuleStatus,
} from "../index";

export type RuleFormHandle = AnyFormApi;

export interface RuleFormValues {
  area: string;
  condition: GroupCondition;
  outcome: RuleOutcome;
}

const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

const randomId = (prefix: string): string => {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(
    bytes,
    (byte) => ID_ALPHABET[byte % ID_ALPHABET.length],
  ).join("");
  return `${prefix}_${suffix}`;
};

export const newComparisonCondition = (field = ""): ComparisonCondition => ({
  field,
  operator: "eq",
  type: "comparison",
  value: "",
});

export const newExistsCondition = (field = ""): ExistsCondition => ({
  field,
  present: true,
  type: "exists",
});

export const newReviewCondition = (): ReviewCondition => ({
  note: "",
  type: "review",
});

export const newGroupCondition = (): GroupCondition => ({
  conditions: [],
  operator: "and",
  type: "group",
});

export const newRule = (): RuleDefinition => ({
  area: "",
  condition: newGroupCondition(),
  id: randomId("rule"),
  outcome: {
    adminReason: "",
    status: "READY",
  },
});

export const addRule = (rules: RuleDefinition[], rule: RuleDefinition) => [
  ...rules,
  rule,
];

export const removeRule = (rules: RuleDefinition[], id: string) =>
  rules.filter((rule) => rule.id !== id);

export const updateRule = (
  rules: RuleDefinition[],
  id: string,
  patch: Partial<RuleDefinition>,
) => rules.map((rule) => (rule.id === id ? { ...rule, ...patch } : rule));

export const updateCondition = (
  root: Condition,
  path: readonly number[],
  updater: (condition: Condition) => Condition,
): Condition => {
  if (path.length === 0) return updater(root);

  const [head, ...tail] = path;
  if (root.type !== "group" || head === undefined) return root;

  return {
    ...root,
    conditions: root.conditions.map((condition, index) =>
      index === head ? updateCondition(condition, tail, updater) : condition,
    ),
  };
};

export const appendCondition = (
  root: Condition,
  path: readonly number[],
  child: Condition,
): Condition => {
  if (path.length === 0) {
    if (root.type !== "group") return root;
    return { ...root, conditions: [...root.conditions, child] };
  }

  const [head, ...tail] = path;
  if (root.type !== "group" || head === undefined) return root;

  return {
    ...root,
    conditions: root.conditions.map((condition, index) =>
      index === head ? appendCondition(condition, tail, child) : condition,
    ),
  };
};

export const removeCondition = (
  root: Condition,
  path: readonly number[],
): Condition => {
  if (path.length === 0) return root;
  if (path.length === 1) {
    const [index] = path;
    if (root.type !== "group" || index === undefined) return root;
    return {
      ...root,
      conditions: root.conditions.filter(
        (_, conditionIndex) => conditionIndex !== index,
      ),
    };
  }

  const [head, ...tail] = path;
  if (root.type !== "group" || head === undefined) return root;

  return {
    ...root,
    conditions: root.conditions.map((condition, index) =>
      index === head ? removeCondition(condition, tail) : condition,
    ),
  };
};

export const RULE_STATUS_LABELS: Readonly<Record<RuleStatus, string>> = {
  NOT_QUALIFIED: "Not qualified",
  READY: "Ready",
  REVIEW_REQUIRED: "Review required",
  SUPPORT_REQUIRED: "Support required",
};

export const RULE_STATUS_LIST = Object.keys(RULE_STATUS_LABELS) as RuleStatus[];

export const DURATION_UNIT_LABELS: Readonly<Record<Duration["unit"], string>> =
  {
    day: "Day",
    month: "Month",
    week: "Week",
    year: "Year",
  };

export const DURATION_UNIT_LIST = Object.keys(
  DURATION_UNIT_LABELS,
) as Duration["unit"][];
