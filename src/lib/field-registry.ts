import type {
  BaseFieldAttributes,
  ConditionOperator,
  FieldAttributesByType,
  FieldType,
  ValidationRuleType,
} from "@/types/form-definition";

interface AttributeEditorMeta<Type extends FieldType = FieldType> {
  key: Exclude<keyof FieldAttributesByType[Type], keyof BaseFieldAttributes>;
  kind: "boolean" | "csv" | "lines" | "number" | "text";
  label: string;
  placeholder?: string;
}

interface FieldRegistryEntry<Type extends FieldType = FieldType> {
  attributes: readonly AttributeEditorMeta<Type>[];
  defaults: () => Partial<FieldAttributesByType[Type]>;
  icon: string;
  label: string;
  type: Type;
  validation: readonly ValidationRuleType[];
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
    validation: ["required"],
  },
  color: {
    attributes: [],
    defaults: () => ({}),
    icon: "PaletteIcon",
    label: "Color",
    type: "color",
    validation: ["required"],
  },
  date: {
    attributes: [],
    defaults: () => ({}),
    icon: "CalendarIcon",
    label: "Date",
    type: "date",
    validation: ["required"],
  },
  datetime: {
    attributes: [],
    defaults: () => ({}),
    icon: "CalendarClockIcon",
    label: "Date & Time",
    type: "datetime",
    validation: ["required"],
  },
  email: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "AutoComplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Max Length" },
      { key: "minLength", kind: "number", label: "Min Length" },
    ],
    defaults: () => ({}),
    icon: "MailIcon",
    label: "Email",
    type: "email",
    validation: ["required", "email"],
  },
  file: {
    attributes: [
      {
        key: "accept",
        kind: "csv",
        label: "Accept",
        placeholder: ".pdf, .png",
      },
      { key: "maxSize", kind: "number", label: "Max Size (bytes)" },
      { key: "multiple", kind: "boolean", label: "Multiple Files" },
    ],
    defaults: () => ({}),
    icon: "UploadIcon",
    label: "File",
    type: "file",
    validation: ["required"],
  },
  number: {
    attributes: [
      { key: "max", kind: "number", label: "Max Value" },
      { key: "min", kind: "number", label: "Min Value" },
      { key: "step", kind: "number", label: "Step" },
    ],
    defaults: () => ({}),
    icon: "HashIcon",
    label: "Number",
    type: "number",
    validation: ["required", "min", "max"],
  },
  password: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "AutoComplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Max Length" },
      { key: "minLength", kind: "number", label: "Min Length" },
    ],
    defaults: () => ({}),
    icon: "LockIcon",
    label: "Password",
    type: "password",
    validation: ["required", "min", "max", "pattern"],
  },
  phone: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "AutoComplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Max Length" },
      { key: "minLength", kind: "number", label: "Min Length" },
    ],
    defaults: () => ({}),
    icon: "PhoneIcon",
    label: "Phone",
    type: "phone",
    validation: ["required", "pattern"],
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
    validation: ["required"],
  },
  rating: {
    attributes: [
      { key: "max", kind: "number", label: "Max Value" },
      { key: "min", kind: "number", label: "Min Value" },
    ],
    defaults: () => ({}),
    icon: "StarIcon",
    label: "Rating",
    type: "rating",
    validation: ["required", "min", "max"],
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
    validation: ["required"],
  },
  slider: {
    attributes: [
      { key: "max", kind: "number", label: "Max Value" },
      { key: "min", kind: "number", label: "Min Value" },
      { key: "step", kind: "number", label: "Step" },
    ],
    defaults: () => ({}),
    icon: "SlidersHorizontalIcon",
    label: "Slider",
    type: "slider",
    validation: ["required", "min", "max"],
  },
  text: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "AutoComplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Max Length" },
      { key: "minLength", kind: "number", label: "Min Length" },
    ],
    defaults: () => ({}),
    icon: "TypeIcon",
    label: "Text",
    type: "text",
    validation: ["required", "min", "max", "pattern"],
  },
  textarea: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "AutoComplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Max Length" },
      { key: "minLength", kind: "number", label: "Min Length" },
    ],
    defaults: () => ({}),
    icon: "AlignLeftIcon",
    label: "Textarea",
    type: "textarea",
    validation: ["required", "min", "max"],
  },
  time: {
    attributes: [],
    defaults: () => ({}),
    icon: "ClockIcon",
    label: "Time",
    type: "time",
    validation: ["required"],
  },
  toggle: {
    attributes: [],
    defaults: () => ({}),
    icon: "ToggleLeftIcon",
    label: "Toggle",
    type: "toggle",
    validation: ["required"],
  },
  url: {
    attributes: [
      {
        key: "autoComplete",
        kind: "text",
        label: "AutoComplete",
        placeholder: "e.g. email",
      },
      { key: "maxLength", kind: "number", label: "Max Length" },
      { key: "minLength", kind: "number", label: "Min Length" },
    ],
    defaults: () => ({}),
    icon: "LinkIcon",
    label: "URL",
    type: "url",
    validation: ["required", "pattern"],
  },
};

export const CONDITION_OPERATORS: {
  label: string;
  value: ConditionOperator;
}[] = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "not_equals" },
  { label: "Contains", value: "contains" },
  { label: "Is not empty", value: "not_empty" },
  { label: "Is empty", value: "empty" },
];

export const VALIDATION_LABELS: Record<ValidationRuleType, string> = {
  custom: "Custom",
  email: "Email Format",
  max: "Max Length",
  min: "Min Length",
  pattern: "Regex Pattern",
  required: "Required",
};

export const FIELD_TYPE_LIST = Object.values(FIELD_REGISTRY);

export const getFieldEntry = <Type extends FieldType>(
  type: Type,
): FieldRegistryEntry<Type> => FIELD_REGISTRY[type];

export const hasAttribute = (
  type: FieldType,
  key: { [Type in FieldType]: AttributeEditorMeta<Type>["key"] }[FieldType],
): boolean =>
  FIELD_REGISTRY[type].attributes.some((editor) => editor.key === key);
