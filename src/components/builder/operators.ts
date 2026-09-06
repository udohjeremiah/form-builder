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

const MULTI_VALUE_OPERATORS: ReadonlySet<ConditionOperator> = new Set([
  "in",
  "not_in",
]);

const PRESENCE_OPERATORS: ReadonlySet<ConditionOperator> = new Set([
  "empty",
  "not_empty",
]);

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

export const getOperatorsForType = (type: FieldType) =>
  OPERATORS_BY_FIELD_TYPE[type];

export const isMultiValueOperator = (operator: ConditionOperator) =>
  MULTI_VALUE_OPERATORS.has(operator);

export const isPresenceOperator = (operator: ConditionOperator) =>
  PRESENCE_OPERATORS.has(operator);
