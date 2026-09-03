import type { ConditionOperator, FieldType } from "./index";

export const CONDITION_OPERATOR_LABELS: Readonly<
  Record<ConditionOperator, string>
> = {
  contains: "Contains",
  empty: "Is empty",
  eq: "Equals",
  gt: "Greater than",
  gte: "Greater than or equal",
  in: "Is one of",
  lt: "Less than",
  lte: "Less than or equal",
  neq: "Not equals",
  not_contains: "Does not contain",
  not_empty: "Is not empty",
  not_in: "Is not one of",
};

// Operators for which a stored value is a list of alternatives rather than a
// single scalar (e.g. "Is one of"). Values are one-per-line when edited.
const MULTI_VALUE_OPERATORS: ReadonlySet<ConditionOperator> = new Set([
  "in",
  "not_in",
]);

// Operators that are satisfied by the mere presence/absence of a value, so no
// expected-value input is offered.
const PRESENCE_OPERATORS: ReadonlySet<ConditionOperator> = new Set([
  "empty",
  "not_empty",
]);

// Operators that make sense for free-text-like values.
const TEXT_OPERATORS: readonly ConditionOperator[] = [
  "eq",
  "neq",
  "contains",
  "not_contains",
  "in",
  "not_in",
  "empty",
  "not_empty",
];

// Ordered values support both equality and magnitude comparisons.
const COMPARABLE_OPERATORS: readonly ConditionOperator[] = [
  "eq",
  "neq",
  "gt",
  "gte",
  "lt",
  "lte",
  "in",
  "not_in",
  "empty",
  "not_empty",
];

// Discrete choices compare by equality (or membership in a set) only.
const CHOICE_OPERATORS: readonly ConditionOperator[] = [
  "eq",
  "neq",
  "in",
  "not_in",
  "empty",
  "not_empty",
];

const OPERATORS_BY_FIELD_TYPE: Record<FieldType, readonly ConditionOperator[]> =
  {
    checkbox: CHOICE_OPERATORS,
    color: TEXT_OPERATORS,
    date: COMPARABLE_OPERATORS,
    datetime: COMPARABLE_OPERATORS,
    email: TEXT_OPERATORS,
    file: TEXT_OPERATORS,
    number: COMPARABLE_OPERATORS,
    password: TEXT_OPERATORS,
    radio: CHOICE_OPERATORS,
    rating: COMPARABLE_OPERATORS,
    select: CHOICE_OPERATORS,
    slider: COMPARABLE_OPERATORS,
    tel: TEXT_OPERATORS,
    text: TEXT_OPERATORS,
    textarea: TEXT_OPERATORS,
    time: TEXT_OPERATORS,
    toggle: CHOICE_OPERATORS,
    url: TEXT_OPERATORS,
  };

export const getOperatorsForType = (
  type: FieldType,
): readonly ConditionOperator[] => OPERATORS_BY_FIELD_TYPE[type];

export const isMultiValueOperator = (operator: ConditionOperator): boolean =>
  MULTI_VALUE_OPERATORS.has(operator);

export const isPresenceOperator = (operator: ConditionOperator): boolean =>
  PRESENCE_OPERATORS.has(operator);
