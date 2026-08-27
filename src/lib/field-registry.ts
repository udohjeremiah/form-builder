import type {
  BaseFieldAttributes,
  ConditionOperator,
  FieldAttributesByType,
  FieldType,
} from "@/types/form-definition";

export const AUTOCOMPLETE_OPTIONS: {
  readonly label: string;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}[] = [
  {
    label: "Personal",
    options: [
      { label: "Full name", value: "name" },
      { label: "First name", value: "given-name" },
      { label: "Last name", value: "family-name" },
      { label: "Email", value: "email" },
      { label: "Phone number", value: "tel" },
      { label: "Birthday", value: "bday" },
    ],
  },
  {
    label: "Address",
    options: [
      { label: "Street address", value: "street-address" },
      { label: "Address line 1", value: "address-line1" },
      { label: "Address line 2", value: "address-line2" },
      { label: "City", value: "address-level2" },
      { label: "State / Province", value: "address-level1" },
      { label: "ZIP / Postal code", value: "postal-code" },
      { label: "Country", value: "country" },
    ],
  },
  {
    label: "Payment",
    options: [
      { label: "Cardholder name", value: "cc-name" },
      { label: "Card number", value: "cc-number" },
      { label: "Expiration date", value: "cc-exp" },
      { label: "Security code", value: "cc-csc" },
    ],
  },
  {
    label: "Auth",
    options: [
      { label: "Username", value: "username" },
      { label: "Current password", value: "current-password" },
      { label: "New password", value: "new-password" },
    ],
  },
];

export const FILE_TYPE_OPTIONS: {
  readonly label: string;
  readonly options: readonly {
    readonly label: string;
    readonly value: string;
  }[];
}[] = [
  {
    label: "Images",
    options: [
      { label: "JPEG", value: "image/jpeg" },
      { label: "PNG", value: "image/png" },
      { label: "GIF", value: "image/gif" },
      { label: "WebP", value: "image/webp" },
      { label: "SVG", value: "image/svg+xml" },
    ],
  },
  {
    label: "Documents",
    options: [
      { label: "PDF", value: "application/pdf" },
      { label: "Word", value: "application/msword" },
      {
        label: "Word (OpenXML)",
        value:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      },
      { label: "Excel", value: "application/vnd.ms-excel" },
      {
        label: "Excel (OpenXML)",
        value:
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      },
      { label: "Plain text", value: "text/plain" },
    ],
  },
  {
    label: "Video",
    options: [
      { label: "MP4", value: "video/mp4" },
      { label: "WebM", value: "video/webm" },
    ],
  },
  {
    label: "Audio",
    options: [
      { label: "MP3", value: "audio/mpeg" },
      { label: "WAV", value: "audio/wav" },
    ],
  },
  {
    label: "Archives",
    options: [
      { label: "ZIP", value: "application/zip" },
      { label: "TAR", value: "application/x-tar" },
      { label: "GZIP", value: "application/gzip" },
    ],
  },
];

interface AttributeEditorMeta<Type extends FieldType = FieldType> {
  inputType?: string;
  key: Exclude<keyof FieldAttributesByType[Type], keyof BaseFieldAttributes>;
  kind:
    | "autocomplete"
    | "boolean"
    | "datetime"
    | "lines"
    | "multi-select"
    | "number"
    | "text";
  label: string;
  options?: readonly {
    readonly label: string;
    readonly options: readonly {
      readonly label: string;
      readonly value: string;
    }[];
  }[];
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
    attributes: [
      {
        inputType: "date",
        key: "maxDate",
        kind: "datetime",
        label: "Maximum date",
      },
      {
        inputType: "date",
        key: "minDate",
        kind: "datetime",
        label: "Minimum date",
      },
    ],
    defaults: () => ({}),
    icon: "CalendarIcon",
    label: "Date",
    type: "date",
  },
  datetime: {
    attributes: [
      {
        inputType: "datetime-local",
        key: "maxDate",
        kind: "datetime",
        label: "Maximum date",
      },
      {
        inputType: "datetime-local",
        key: "minDate",
        kind: "datetime",
        label: "Minimum date",
      },
    ],
    defaults: () => ({}),
    icon: "CalendarClockIcon",
    label: "Date & Time",
    type: "datetime",
  },
  email: {
    attributes: [
      {
        key: "autoComplete",
        kind: "autocomplete",
        label: "Autocomplete",
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
        kind: "multi-select",
        label: "Accepted file types",
        options: FILE_TYPE_OPTIONS,
      },
      { key: "maxSize", kind: "number", label: "Maximum file size" },
      { key: "multiple", kind: "boolean", label: "Multiple" },
    ],
    defaults: () => ({
      accept: ["image/*", "application/pdf"],
    }),
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
        kind: "autocomplete",
        label: "Autocomplete",
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
        kind: "autocomplete",
        label: "Autocomplete",
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
      { key: "multiple", kind: "boolean", label: "Multiple" },
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
        kind: "autocomplete",
        label: "Autocomplete",
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
        kind: "autocomplete",
        label: "Autocomplete",
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
    attributes: [
      {
        inputType: "time",
        key: "maxDate",
        kind: "datetime",
        label: "Maximum time",
      },
      {
        inputType: "time",
        key: "minDate",
        kind: "datetime",
        label: "Minimum time",
      },
    ],
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
        kind: "autocomplete",
        label: "Autocomplete",
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
