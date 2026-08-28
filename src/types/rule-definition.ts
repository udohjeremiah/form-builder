export interface ComparisonCondition {
  field: string;
  operator: ComparisonOperator;
  type: "comparison";
  value: string;
}

export type ComparisonOperator =
  "eq" | "gt" | "gte" | "in" | "lt" | "lte" | "neq" | "not_in";

/**
 * A single node in the rule's WHEN tree. Evaluated against an assessment
 * result; an empty group is always satisfied.
 */
export type Condition =
  ComparisonCondition | ExistsCondition | GroupCondition | ReviewCondition;

export interface Duration {
  amount: number;
  unit: "day" | "month" | "week" | "year";
}

/**
 * Presence check: whether the referenced field was answered.
 */
export interface ExistsCondition {
  field: string;
  present: boolean;
  type: "exists";
}

/**
 * Nests sibling conditions under a single combinator.
 */
export interface GroupCondition {
  conditions: Condition[];
  operator: "and" | "or";
  type: "group";
}

/**
 * Defers the decision to a human review step.
 */
export interface ReviewCondition {
  note: string;
  type: "review";
}

/**
 * The top-level assessment rule. `area` is a free-form grouping label;
 * `condition` (WHEN) drives the outcome (THEN).
 */
export interface Rule {
  area: string;
  condition: Condition;
  id: string;
  outcome: RuleOutcome;
}

export interface RuleOutcome {
  adminReason: string;
  deadline?: Duration;
  status: RuleStatus;
  studentAction?: string;
}

/**
 * The standalone rules schema document. Kept separate from the form schema:
 * it carries its own `id` and `version` plus the list of rules.
 */
export interface RulesDefinition {
  id: string;
  rules: Rule[];
  version: number;
}

export type RuleStatus =
  "NOT_QUALIFIED" | "READY" | "REVIEW_REQUIRED" | "SUPPORT_REQUIRED";
