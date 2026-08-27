import type {
  ComparisonCondition,
  ComparisonOperator,
  Condition,
  Duration,
  ExistsCondition,
  GroupCondition,
  ReviewCondition,
  Rule,
  RulesDefinition,
  RuleStatus,
} from "@/types/rule-definition";

const RULES_DEFINITION_VERSION = 1;

// Random, position-independent identifiers: nothing encodes order or time,
// so ids survive reordering and never collide across restored drafts.
const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

const randomId = (prefix: string): string => {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(
    bytes,
    (byte) => ID_ALPHABET[byte % ID_ALPHABET.length],
  ).join("");
  return `${prefix}_${suffix}`;
};

const newRuleId = () => randomId("rule");

const newRulesId = () => randomId("rules");

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
  operator: "all",
  type: "group",
});

/**
 * A fresh, blank rule with an empty WHEN tree and READY outcome.
 */
export const newRule = (): Rule => ({
  area: "",
  condition: newGroupCondition(),
  id: newRuleId(),
  outcome: {
    adminReason: "",
    status: "READY",
  },
});

/**
 * A fresh, empty rules schema document with its own stable id and version.
 */
export const newRulesDefinition = (): RulesDefinition => ({
  id: newRulesId(),
  rules: [],
  version: RULES_DEFINITION_VERSION,
});

export const addRule = (
  definition: RulesDefinition,
  rule: Rule,
): RulesDefinition => ({
  ...definition,
  rules: [...definition.rules, rule],
});

export const removeRule = (
  definition: RulesDefinition,
  id: string,
): RulesDefinition => ({
  ...definition,
  rules: definition.rules.filter((rule) => rule.id !== id),
});

export const updateRule = (
  definition: RulesDefinition,
  id: string,
  patch: Partial<Rule>,
): RulesDefinition => ({
  ...definition,
  rules: definition.rules.map((rule) =>
    rule.id === id ? { ...rule, ...patch } : rule,
  ),
});

/**
 * Copies the tree and replaces a single node located by `path` (an array of
 * child indexes from the root). Returns immutable copies on the way down.
 */
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

/**
 * Inserts `child` into `root` at the position named by `path` (the path to
 * the target group node), appending to that group's children.
 */
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

/**
 * Removes the child at `path` from its parent group.
 */
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

export const COMPARISON_OPERATOR_LABELS: Readonly<
  Record<ComparisonOperator, string>
> = {
  eq: "Equals",
  gt: "Greater than",
  gte: "Greater than or equal",
  in: "Is one of",
  lt: "Less than",
  lte: "Less than or equal",
  neq: "Does not equal",
  not_in: "Is not one of",
};

export const COMPARISON_OPERATOR_LIST = Object.keys(
  COMPARISON_OPERATOR_LABELS,
) as ComparisonOperator[];

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
