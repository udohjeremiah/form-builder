import type {
  AnyFieldDefinition,
  FieldCondition,
  FieldType,
  FormDefinition,
  PersistedFormDefinition,
  SectionDefinition,
  StepDefinition,
  TitledAttributes,
} from "@/types/form-definition";

const FORM_DEFINITION_VERSION = 1;

let fieldCounter = 0;
let sectionCounter = 0;
let stepCounter = 0;

const newFieldId = () => {
  fieldCounter++;
  return `field_${fieldCounter}_${Date.now()}`;
};

const newSectionId = () => {
  sectionCounter++;
  return `section_${sectionCounter}_${Date.now()}`;
};

const newStepId = () => {
  stepCounter++;
  return `step_${stepCounter}_${Date.now()}`;
};

const newFormId = () => `form_${Date.now().toString(36)}`;

export const resetIdCounters = () => {
  fieldCounter = 0;
  sectionCounter = 0;
  stepCounter = 0;
};

/** Raises the internal id counters so newly generated ids never collide with restored ones. */
export const syncIdCounters = (maxima: { field: number; step: number }) => {
  fieldCounter = Math.max(fieldCounter, maxima.field);
  stepCounter = Math.max(stepCounter, maxima.step);
};

const FIELD_LABELS: Record<FieldType, string> = {
  checkbox: "Checkbox",
  color: "Color Picker",
  date: "Date",
  datetime: "Date & Time",
  email: "Email",
  file: "File Upload",
  number: "Number",
  password: "Password",
  phone: "Phone",
  radio: "Radio Group",
  rating: "Rating",
  select: "Dropdown",
  slider: "Slider",
  text: "Text Field",
  textarea: "Message",
  time: "Time",
  toggle: "Toggle",
  url: "URL",
};

const createSection = (
  fields: AnyFieldDefinition[] = [],
): SectionDefinition => ({
  attributes: {},
  fields,
  id: newSectionId(),
});

const createStepDefinition = (): StepDefinition => {
  const id = newStepId();
  return {
    attributes: {},
    id,
    sections: [createSection()],
  };
};

export const createDefaultDefinition = (): FormDefinition => ({
  attributes: { multiStep: false, sections: false },
  id: newFormId(),
  steps: [createStepDefinition()],
  version: FORM_DEFINITION_VERSION,
});

export const newField = (type: FieldType): AnyFieldDefinition => {
  const label = FIELD_LABELS[type];
  const base = {
    label,
    placeholder: `Enter ${label.toLowerCase()}...`,
    ...(type === "select" || type === "radio"
      ? { options: ["Option 1", "Option 2", "Option 3"] }
      : {}),
  };
  return {
    attributes: base,
    conditions: {},
    id: newFieldId(),
    type,
    validation: [],
  };
};

export const getAllFields = (
  definition: FormDefinition,
): AnyFieldDefinition[] =>
  definition.steps.flatMap((step) =>
    step.sections.flatMap((section) => section.fields),
  );

export const getField = (
  definition: FormDefinition,
  id: string,
): AnyFieldDefinition | null =>
  getAllFields(definition).find((field) => field.id === id) ?? null;

export const updateField = (
  definition: FormDefinition,
  id: string,
  updater: (field: AnyFieldDefinition) => AnyFieldDefinition,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.map((section) => ({
      ...section,
      fields: section.fields.map((field) =>
        field.id === id ? updater(field) : field,
      ),
    })),
  })),
});

export const removeField = (
  definition: FormDefinition,
  id: string,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.map((section) => ({
      ...section,
      fields: section.fields.filter((field) => field.id !== id),
    })),
  })),
});

export const duplicateField = (
  definition: FormDefinition,
  id: string,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.map((section) => {
      const index = section.fields.findIndex((field) => field.id === id);
      if (index === -1) return section;
      const source = section.fields[index];
      if (!source) return section;
      const clone = {
        ...source,
        attributes: {
          ...source.attributes,
          label: `${source.attributes.label} (copy)`,
        },
        id: newFieldId(),
      };
      const next = [...section.fields];
      next.splice(index + 1, 0, clone);
      return { ...section, fields: next };
    }),
  })),
});

export const appendField = (
  definition: FormDefinition,
  stepIndex: number,
  field: AnyFieldDefinition,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step, index) => {
    if (index !== stepIndex) return step;
    if (step.sections.length === 0) {
      return { ...step, sections: [createSection([field])] };
    }
    return {
      ...step,
      sections: step.sections.map((section, sectionIndex) =>
        sectionIndex === step.sections.length - 1
          ? { ...section, fields: [...section.fields, field] }
          : section,
      ),
    };
  }),
});

/**
 * Moves a field so that it takes the global position previously occupied by
 * `toId`, shifting everything in between across step and section boundaries.
 */
export const moveField = (
  definition: FormDefinition,
  fromId: string,
  toId: string,
): FormDefinition => {
  if (fromId === toId) return definition;
  const flat = getAllFields(definition);
  const fromIndex = flat.findIndex((field) => field.id === fromId);
  const toIndex = flat.findIndex((field) => field.id === toId);
  if (fromIndex === -1 || toIndex === -1) return definition;
  // Mirror dnd-kit's optimistic arrayMove exactly: remove the dragged field,
  // then insert it at the target's original index in the shrunk list. Moving
  // down lands after the target, moving up lands before it — matching what
  // the drag preview shows.
  const ordered = [...flat];
  const [moved] = ordered.splice(fromIndex, 1);
  if (!moved) return definition;
  ordered.splice(toIndex, 0, moved);
  let cursor = 0;
  return {
    ...definition,
    steps: definition.steps.map((step) => ({
      ...step,
      sections: step.sections.map((section) => {
        const fields = ordered.slice(cursor, cursor + section.fields.length);
        cursor += section.fields.length;
        return { ...section, fields };
      }),
    })),
  };
};

/** Appends a field to the end of a specific section identified by id. */
export const appendFieldToSection = (
  definition: FormDefinition,
  sectionId: string,
  field: AnyFieldDefinition,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.map((section) =>
      section.id === sectionId
        ? { ...section, fields: [...section.fields, field] }
        : section,
    ),
  })),
});

/**
 * Moves a field out of its current section and appends it to the end of the
 * target section. Used when a drag ends on a section body rather than on
 * another field.
 */
export const moveFieldIntoSection = (
  definition: FormDefinition,
  fieldId: string,
  sectionId: string,
): FormDefinition => {
  const flat = getAllFields(definition);
  const moved = flat.find((field) => field.id === fieldId);
  if (!moved) return definition;
  return {
    ...definition,
    steps: definition.steps.map((step) => ({
      ...step,
      sections: step.sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              fields: [
                ...section.fields.filter((field) => field.id !== fieldId),
                moved,
              ],
            }
          : {
              ...section,
              fields: section.fields.filter((field) => field.id !== fieldId),
            },
      ),
    })),
  };
};

export const addStep = (definition: FormDefinition): FormDefinition => ({
  ...definition,
  steps: [...definition.steps, createStepDefinition()],
});

export const addSection = (
  definition: FormDefinition,
  stepIndex: number,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step, index) =>
    index === stepIndex
      ? { ...step, sections: [...step.sections, createSection()] }
      : step,
  ),
});

export const removeSection = (
  definition: FormDefinition,
  id: string,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.filter((section) => section.id !== id),
  })),
});

/** Patches the title/description attributes of a step identified by id. */
export const updateStepAttributes = (
  definition: FormDefinition,
  stepId: string,
  patch: TitledAttributes,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) =>
    step.id === stepId
      ? { ...step, attributes: { ...step.attributes, ...patch } }
      : step,
  ),
});

/** Patches the title/description attributes of a section identified by id. */
export const updateSectionAttributes = (
  definition: FormDefinition,
  sectionId: string,
  patch: TitledAttributes,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.map((section) =>
      section.id === sectionId
        ? { ...section, attributes: { ...section.attributes, ...patch } }
        : section,
    ),
  })),
});

export const removeStep = (
  definition: FormDefinition,
  index: number,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.filter((_, stepIndex) => stepIndex !== index),
});

export const setMultiStep = (
  definition: FormDefinition,
  enabled: boolean,
): FormDefinition => ({
  ...definition,
  attributes: { ...definition.attributes, multiStep: enabled },
  steps:
    enabled && definition.steps.length === 0
      ? [createStepDefinition()]
      : definition.steps,
});

export const setSections = (
  definition: FormDefinition,
  enabled: boolean,
): FormDefinition => ({
  ...definition,
  attributes: { ...definition.attributes, sections: enabled },
});

const NUMERIC_BOUND_TYPES = new Set(["number", "rating", "slider"]);

export function isFieldVisible(
  field: AnyFieldDefinition,
  values: Record<string, string>,
): boolean {
  const { hide, show } = field.conditions;
  if (show && !evaluateCondition(show, values)) return false;
  if (hide && evaluateCondition(hide, values)) return false;
  return true;
}

export function validateFieldValue(
  field: AnyFieldDefinition,
  value: string,
): null | string {
  const { attributes, validation } = field;
  if (attributes.required && !value.trim()) {
    const customMessage = validation.find(
      (rule) => rule.type === "required",
    )?.message;
    return customMessage ?? `${attributes.label} is required`;
  }

  if (!value && !attributes.required) return null;

  // Native attribute bounds are checked before explicit rules so that
  // user-defined rule messages still take precedence where both apply.
  switch (field.type) {
    case "email":
    case "password":
    case "phone":
    case "text":
    case "textarea":
    case "url": {
      const { maxLength, minLength } = field.attributes;
      if (minLength !== undefined && value.length < minLength) {
        return `Minimum ${minLength} characters`;
      }
      if (maxLength !== undefined && value.length > maxLength) {
        return `Maximum ${maxLength} characters`;
      }
      break;
    }
    case "number":
    case "rating":
    case "slider": {
      const { max, min } = field.attributes;
      if (min !== undefined && Number(value) < min) {
        return `Minimum value is ${min}`;
      }
      if (max !== undefined && Number(value) > max) {
        return `Maximum value is ${max}`;
      }
      break;
    }
    default: {
      break;
    }
  }

  for (const rule of validation) {
    switch (rule.type) {
      case "email": {
        if (!/^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/.test(value)) {
          return rule.message || "Invalid email address";
        }
        break;
      }
      case "max": {
        if (NUMERIC_BOUND_TYPES.has(field.type)) {
          if (Number(value) > Number(rule.value))
            return rule.message || `Maximum value is ${rule.value}`;
        } else {
          if (value.length > Number(rule.value))
            return rule.message || `Maximum ${rule.value} characters`;
        }
        break;
      }
      case "min": {
        if (NUMERIC_BOUND_TYPES.has(field.type)) {
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

function evaluateCondition(
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

/**
 * Validates persisted JSON against the current canonical structure and
 * normalizes `savedAt`. Returns null when the payload does not match —
 * drafts saved by older versions of the builder are discarded, not migrated.
 */
export const normalizePersisted = (
  raw: unknown,
): null | PersistedFormDefinition => {
  if (typeof raw !== "object" || raw === null) return null;
  // Deliberately permissive view of the payload: persisted JSON is untrusted,
  // so every member stays nullable until validated below.
  const data = raw as {
    attributes?: FormDefinition["attributes"] | null;
    id?: unknown;
    savedAt?: unknown;
    steps?: { id?: unknown; sections?: unknown }[];
    version?: unknown;
  };
  const savedAt = typeof data.savedAt === "number" ? data.savedAt : 0;

  if (
    data.version === FORM_DEFINITION_VERSION &&
    typeof data.id === "string" &&
    typeof data.attributes === "object" &&
    data.attributes !== null &&
    Array.isArray(data.steps) &&
    data.steps.every(
      (step) =>
        typeof step.id === "string" &&
        Array.isArray(step.sections) &&
        step.sections.length > 0,
    )
  ) {
    return {
      ...(raw as FormDefinition),
      savedAt,
    };
  }
  return null;
};
