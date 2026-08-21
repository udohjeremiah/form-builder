export interface FieldCondition {
  fieldId: string;
  operator: "contains" | "empty" | "equals" | "not_empty" | "not_equals";
  value?: string;
}

export interface FormField {
  condition?: FieldCondition;
  id: string;
  label: string;
  options?: string[];
  placeholder?: string;
  required?: boolean;
  step?: number;
  type: FieldType;
  validation?: ValidationRule[];
}

export const CONDITION_OPERATORS: {
  label: string;
  value: FieldCondition["operator"];
}[] = [
  { label: "Equals", value: "equals" },
  { label: "Not equals", value: "not_equals" },
  { label: "Contains", value: "contains" },
  { label: "Is not empty", value: "not_empty" },
  { label: "Is empty", value: "empty" },
];

export type FieldType =
  | "checkbox"
  | "color"
  | "date"
  | "datetime"
  | "email"
  | "file"
  | "heading"
  | "hidden"
  | "number"
  | "paragraph"
  | "password"
  | "phone"
  | "radio"
  | "rating"
  | "select"
  | "separator"
  | "slider"
  | "text"
  | "textarea"
  | "time"
  | "toggle"
  | "url";

export interface FormSchema {
  description?: string;
  fields: FormField[];
  id: string;
  name: string;
  settings: FormSettings;
  steps?: FormStep[];
}

export interface FormSettings {
  autosave: boolean;
  multiStep: boolean;
  submitLabel: string;
}

export interface FormStep {
  fieldIds: string[];
  id: string;
  title: string;
}

export interface ValidationRule {
  message: string;
  type: "custom" | "email" | "max" | "min" | "pattern" | "required";
  value?: number | string;
}

export function evaluateCondition(
  condition: FieldCondition | undefined,
  values: Record<string, string>,
): boolean {
  if (!condition?.fieldId) return true;
  const value = values[condition.fieldId] ?? "";
  switch (condition.operator) {
    case "contains": {
      return value.includes(condition.value ?? "");
    }
    case "empty": {
      return value.trim().length === 0;
    }
    case "equals": {
      return value === (condition.value ?? "");
    }
    case "not_empty": {
      return value.trim().length > 0;
    }
    case "not_equals": {
      return value !== (condition.value ?? "");
    }
    default: {
      return true;
    }
  }
}

export const VALIDATION_OPTIONS: Record<FieldType, ValidationRule["type"][]> = {
  checkbox: ["required"],
  color: ["required"],
  date: ["required"],
  datetime: ["required"],
  email: ["required", "email"],
  file: ["required"],
  heading: [],
  hidden: [],
  number: ["required", "min", "max"],
  paragraph: [],
  password: ["required", "min", "max", "pattern"],
  phone: ["required", "pattern"],
  radio: ["required"],
  rating: ["required", "min", "max"],
  select: ["required"],
  separator: [],
  slider: ["required", "min", "max"],
  text: ["required", "min", "max", "pattern"],
  textarea: ["required", "min", "max"],
  time: ["required"],
  toggle: ["required"],
  url: ["required", "pattern"],
};

export const VALIDATION_LABELS: Record<ValidationRule["type"], string> = {
  custom: "Custom",
  email: "Email Format",
  max: "Max Length",
  min: "Min Length",
  pattern: "Regex Pattern",
  required: "Required",
};

export function validateField(field: FormField, value: string): null | string {
  if (["heading", "hidden", "paragraph", "separator"].includes(field.type))
    return null;

  if (field.required && !value.trim()) {
    const customMessage = field.validation?.find(
      (v) => v.type === "required",
    )?.message;
    return customMessage ?? `${field.label} is required`;
  }

  if (!value && !field.required) return null;

  const rules = field.validation ?? [];
  for (const rule of rules) {
    switch (rule.type) {
      case "email": {
        if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value)) {
          return rule.message || "Invalid email address";
        }
        break;
      }
      case "max": {
        if (field.type === "number" || field.type === "slider") {
          if (Number(value) > Number(rule.value))
            return rule.message || `Maximum value is ${rule.value}`;
        } else {
          if (value.length > Number(rule.value))
            return rule.message || `Maximum ${rule.value} characters`;
        }
        break;
      }
      case "min": {
        if (field.type === "number" || field.type === "slider") {
          if (Number(value) < Number(rule.value))
            return rule.message || `Minimum value is ${rule.value}`;
        } else {
          if (value.length < Number(rule.value))
            return rule.message || `Minimum ${rule.value} characters`;
        }
        break;
      }
      case "pattern": {
        try {
          // eslint-disable-next-line security/detect-non-literal-regexp -- pattern comes from a user-defined validation rule
          if (rule.value && !new RegExp(String(rule.value)).test(value)) {
            return rule.message || "Invalid format";
          }
        } catch {
          break;
        }
        break;
      }
    }
  }
  return null;
}

export const FIELD_TYPES: { icon: string; label: string; type: FieldType }[] = [
  { icon: "Type", label: "Text", type: "text" },
  { icon: "Mail", label: "Email", type: "email" },
  { icon: "Lock", label: "Password", type: "password" },
  { icon: "Hash", label: "Number", type: "number" },
  { icon: "Phone", label: "Phone", type: "phone" },
  { icon: "Link", label: "URL", type: "url" },
  { icon: "AlignLeft", label: "Textarea", type: "textarea" },
  { icon: "ChevronDown", label: "Select", type: "select" },
  { icon: "CheckSquare", label: "Checkbox", type: "checkbox" },
  { icon: "Circle", label: "Radio", type: "radio" },
  { icon: "Calendar", label: "Date", type: "date" },
  { icon: "CalendarClock", label: "Date & Time", type: "datetime" },
  { icon: "Clock", label: "Time", type: "time" },
  { icon: "Upload", label: "File", type: "file" },
  { icon: "ToggleLeft", label: "Toggle", type: "toggle" },
  { icon: "SlidersHorizontal", label: "Slider", type: "slider" },
  { icon: "Star", label: "Rating", type: "rating" },
  { icon: "Palette", label: "Color", type: "color" },
  { icon: "EyeOff", label: "Hidden", type: "hidden" },
  { icon: "Heading", label: "Heading", type: "heading" },
  { icon: "FileText", label: "Paragraph", type: "paragraph" },
  { icon: "Minus", label: "Divider", type: "separator" },
];
