import type {
  BaseFieldAttributes,
  ConditionOperator,
  FieldAttributesByType,
  FieldType,
} from "@/types/form-definition";

interface AttributeEditorMeta<Type extends FieldType = FieldType> {
  key: Exclude<keyof FieldAttributesByType[Type], keyof BaseFieldAttributes>;
  kind: "boolean" | "lines" | "number" | "text";
  label: string;
  placeholder?: string;
}

interface FieldRegistryEntry<Type extends FieldType = FieldType> {
  attributes: readonly AttributeEditorMeta<Type>[];
  defaults: () => Partial<FieldAttributesByType[Type]>;
  icon: string;
  label: string;
  type: Type;
}

const FIELD_REGISTRY: {
  readonly [Type in FieldType]: FieldRegistryEntry<Type>;
} = {
  checkbox: {
    attributes: [],
    defaults: () => ({}),
    icon: "CheckSquareIcon",
    label: "Checkbox",
    type: "checkbox",
  },
  color: {
    attributes: [],
    defaults: () => ({}),
    icon: "PaletteIcon",
    label: "Color",
    type: "color",
  },
  date: {
    attributes: [],
    defaults: () => ({}),
    icon: "CalendarIcon",
    label: "Date",
    type: "date",
  },
  datetime: {
    attributes: [],
    defaults: () => ({}),
    icon: "CalendarClockIcon",
    label: "Date & Time",
    type: "datetime",
  },
  email: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "Autocomplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Maximum length" },
      { key: "minLength", kind: "number", label: "Minimum length" },
    ],
    defaults: () => ({}),
    icon: "MailIcon",
    label: "Email",
    type: "email",
  },
  file: {
    attributes: [
      {
        key: "accept",
        kind: "lines",
        label: "Accepted file types",
        placeholder: "One per line",
      },
      { key: "maxSize", kind: "number", label: "Maximum file size" },
      { key: "multiple", kind: "boolean", label: "Multiple" },
    ],
    defaults: () => ({}),
    icon: "UploadIcon",
    label: "File",
    type: "file",
  },
  number: {
    attributes: [
      { key: "max", kind: "number", label: "Maximum" },
      { key: "min", kind: "number", label: "Minimum" },
      { key: "step", kind: "number", label: "Step" },
    ],
    defaults: () => ({}),
    icon: "HashIcon",
    label: "Number",
    type: "number",
  },
  password: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "Autocomplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Maximum length" },
      { key: "minLength", kind: "number", label: "Minimum length" },
      {
        key: "pattern",
        kind: "text",
        label: "Pattern",
        placeholder: "^[A-Za-z]+$",
      },
    ],
    defaults: () => ({}),
    icon: "LockIcon",
    label: "Password",
    type: "password",
  },
  phone: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "Autocomplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Maximum length" },
      { key: "minLength", kind: "number", label: "Minimum length" },
      {
        key: "pattern",
        kind: "text",
        label: "Pattern",
        placeholder: "^[A-Za-z]+$",
      },
    ],
    defaults: () => ({}),
    icon: "PhoneIcon",
    label: "Phone",
    type: "phone",
  },
  radio: {
    attributes: [
      {
        key: "options",
        kind: "lines",
        label: "Options",
        placeholder: "One per line",
      },
    ],
    defaults: () => ({ options: ["Option 1", "Option 2", "Option 3"] }),
    icon: "CircleIcon",
    label: "Radio",
    type: "radio",
  },
  rating: {
    attributes: [
      { key: "max", kind: "number", label: "Maximum" },
      { key: "min", kind: "number", label: "Minimum" },
    ],
    defaults: () => ({}),
    icon: "StarIcon",
    label: "Rating",
    type: "rating",
  },
  select: {
    attributes: [
      {
        key: "options",
        kind: "lines",
        label: "Options",
        placeholder: "One per line",
      },
    ],
    defaults: () => ({ options: ["Option 1", "Option 2", "Option 3"] }),
    icon: "ChevronDownIcon",
    label: "Select",
    type: "select",
  },
  slider: {
    attributes: [
      { key: "max", kind: "number", label: "Maximum" },
      { key: "min", kind: "number", label: "Minimum" },
      { key: "step", kind: "number", label: "Step" },
    ],
    defaults: () => ({}),
    icon: "SlidersHorizontalIcon",
    label: "Slider",
    type: "slider",
  },
  text: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "Autocomplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Maximum length" },
      { key: "minLength", kind: "number", label: "Minimum length" },
      {
        key: "pattern",
        kind: "text",
        label: "Pattern",
        placeholder: "^[A-Za-z]+$",
      },
    ],
    defaults: () => ({}),
    icon: "TypeIcon",
    label: "Text",
    type: "text",
  },
  textarea: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "Autocomplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Maximum length" },
      { key: "minLength", kind: "number", label: "Minimum length" },
    ],
    defaults: () => ({}),
    icon: "AlignLeftIcon",
    label: "Textarea",
    type: "textarea",
  },
  time: {
    attributes: [],
    defaults: () => ({}),
    icon: "ClockIcon",
    label: "Time",
    type: "time",
  },
  toggle: {
    attributes: [],
    defaults: () => ({}),
    icon: "ToggleLeftIcon",
    label: "Toggle",
    type: "toggle",
  },
  url: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "Autocomplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Maximum length" },
      { key: "minLength", kind: "number", label: "Minimum length" },
      {
        key: "pattern",
        kind: "text",
        label: "Pattern",
        placeholder: "^[A-Za-z]+$",
      },
    ],
    defaults: () => ({}),
    icon: "LinkIcon",
    label: "URL",
    type: "url",
  },
};

export const CONDITION_OPERATOR_LABELS: Readonly<
  Record<ConditionOperator, string>
> = {
  contains: "Contains",
  empty: "Is empty",
  eq: "Equals",
  gt: "Greater than",
  gte: "Greater than or equal",
  lt: "Less than",
  lte: "Less than or equal",
  neq: "Not equals",
  not_contains: "Does not contain",
  not_empty: "Is not empty",
};

// Operators that make sense for free-text-like values.
const TEXT_OPERATORS: readonly ConditionOperator[] = [
  "eq",
  "neq",
  "contains",
  "not_contains",
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
  "empty",
  "not_empty",
];

// Discrete choices compare by equality only.
const CHOICE_OPERATORS: readonly ConditionOperator[] = [
  "eq",
  "neq",
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
    phone: TEXT_OPERATORS,
    radio: CHOICE_OPERATORS,
    rating: COMPARABLE_OPERATORS,
    select: CHOICE_OPERATORS,
    slider: COMPARABLE_OPERATORS,
    text: TEXT_OPERATORS,
    textarea: TEXT_OPERATORS,
    time: TEXT_OPERATORS,
    toggle: CHOICE_OPERATORS,
    url: TEXT_OPERATORS,
  };

export const getOperatorsForType = (
  type: FieldType,
): readonly ConditionOperator[] => OPERATORS_BY_FIELD_TYPE[type];

export const FIELD_TYPE_LIST = Object.values(FIELD_REGISTRY);

export const getFieldEntry = <Type extends FieldType>(
  type: Type,
): FieldRegistryEntry<Type> => FIELD_REGISTRY[type];
