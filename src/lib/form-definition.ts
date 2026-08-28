import type {
  AnyFieldDefinition,
  ConditionGroup,
  FieldRule,
  FieldType,
  FormDefinition,
  PersistedFormDefinition,
  SectionAttributes,
  SectionDefinition,
  StepAttributes,
  StepDefinition,
} from "@/types/form-definition";
import type { RulesDefinition } from "@/types/rule-definition";

import { getFieldEntry } from "@/lib/field-registry";
import { newRulesDefinition } from "@/lib/rule-definition";

const FORM_DEFINITION_VERSION = 2;

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

const newFieldId = () => randomId("fld");

const newSectionId = () => randomId("sec");

const newStepId = () => randomId("st");

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
  // Deterministic ids keep the prerendered scaffold identical on the server
  // and client; anything added through the builder gets random ids instead.
  id: "frm_seed",
  rules: newRulesDefinition(),
  steps: [
    {
      attributes: {},
      id: "st_seed",
      sections: [{ attributes: {}, fields: [], id: "sec_seed" }],
    },
  ],
  version: FORM_DEFINITION_VERSION,
});

export const newField = (type: FieldType): AnyFieldDefinition => {
  const entry = getFieldEntry(type);
  return {
    attributes: {
      ...entry.defaults(),
      label: entry.label,
      placeholder: `Enter ${entry.label.toLowerCase()}...`,
      required: true,
    },
    id: newFieldId(),
    logic: {},
    type,
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

/** Reorders a field within a single section by local (section-relative)
 * indexes. Used for intra-section sortable drops where dnd-kit's live index
 * matches the optimistic visual order. */
export const moveFieldWithinSection = (
  definition: FormDefinition,
  sectionId: string,
  fromIndex: number,
  toIndex: number,
): FormDefinition => {
  if (fromIndex === toIndex) return definition;
  return {
    ...definition,
    steps: definition.steps.map((step) => ({
      ...step,
      sections: step.sections.map((section) => {
        if (section.id !== sectionId) return section;
        const ordered = [...section.fields];
        const [moved] = ordered.splice(fromIndex, 1);
        if (moved) ordered.splice(toIndex, 0, moved);
        return { ...section, fields: ordered };
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

/** Patches the attributes of a step identified by id. */
export const updateStepAttributes = (
  definition: FormDefinition,
  stepId: string,
  patch: Partial<StepAttributes>,
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
  patch: Partial<SectionAttributes>,
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

/** Moves a step to a new position within the form. */
export const moveStep = (
  definition: FormDefinition,
  fromIndex: number,
  toIndex: number,
): FormDefinition => {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= definition.steps.length ||
    toIndex >= definition.steps.length
  ) {
    return definition;
  }
  const steps = [...definition.steps];
  const [moved] = steps.splice(fromIndex, 1);
  if (!moved) return definition;
  steps.splice(toIndex, 0, moved);
  return { ...definition, steps };
};

/** Moves a section to a new position within one step of the form. */
export const moveSection = (
  definition: FormDefinition,
  stepIndex: number,
  fromIndex: number,
  toIndex: number,
): FormDefinition => ({
  ...definition,
  steps: definition.steps.map((step, index) => {
    if (
      index !== stepIndex ||
      fromIndex === toIndex ||
      fromIndex < 0 ||
      toIndex < 0 ||
      fromIndex >= step.sections.length ||
      toIndex >= step.sections.length
    ) {
      return step;
    }
    const sections = [...step.sections];
    const [moved] = sections.splice(fromIndex, 1);
    if (!moved) return step;
    sections.splice(toIndex, 0, moved);
    return { ...step, sections };
  }),
});

// Magnitude comparisons work numerically when both sides are numbers and
// lexicographically otherwise, which also covers ISO date strings.
const asNumber = (raw: string): null | number => {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareValues = (left: string, right: string): number => {
  const leftNumber = asNumber(left);
  const rightNumber = asNumber(right);
  if (leftNumber !== null && rightNumber !== null) {
    if (leftNumber === rightNumber) return 0;
    return leftNumber < rightNumber ? -1 : 1;
  }
  if (left === right) return 0;
  return left < right ? -1 : 1;
};

/**
 * Resolves the options that should be shown for an options-bearing field.
 */
export function getActiveOptions(field: AnyFieldDefinition): string[] {
  if (field.type !== "radio" && field.type !== "select") return [];
  return field.attributes.options ?? [];
}

export function isFieldDisabled(
  field: AnyFieldDefinition,
  values: Record<string, string>,
): boolean {
  const { disable } = field.logic;
  return disable ? evaluateGroup(disable, values) : false;
}

export function isFieldVisible(
  field: AnyFieldDefinition,
  values: Record<string, string>,
): boolean {
  const { hide, show } = field.logic;
  if (show && !evaluateGroup(show, values)) return false;
  if (hide && evaluateGroup(hide, values)) return false;
  return true;
}

function evaluateGroup(
  group: ConditionGroup,
  values: Record<string, string>,
): boolean {
  if (group.rules.length === 0) return true;

  // A row without a target field cannot constrain anything.
  const passes = (rule: FieldRule) =>
    !rule.fieldId || evaluateRule(rule, values);

  return group.combinator === "or"
    ? group.rules.some((rule) => passes(rule))
    : group.rules.every((rule) => passes(rule));
}

function evaluateRule(
  rule: FieldRule,
  values: Record<string, string>,
): boolean {
  const value = values[rule.fieldId] ?? "";
  const expected = rule.value ?? "";
  switch (rule.operator) {
    case "contains": {
      return value.includes(expected);
    }
    case "empty": {
      return value.trim().length === 0;
    }
    case "eq": {
      return value === expected;
    }
    case "gt": {
      return compareValues(value, expected) > 0;
    }
    case "gte": {
      return compareValues(value, expected) >= 0;
    }
    case "lt": {
      return compareValues(value, expected) < 0;
    }
    case "lte": {
      return compareValues(value, expected) <= 0;
    }
    case "neq": {
      return value !== expected;
    }
    case "not_contains": {
      return !value.includes(expected);
    }
    case "not_empty": {
      return value.trim().length > 0;
    }
  }
}

const EMAIL_FORMAT = /^[^\s@]+@[^\s@][^\s.@]*\.[^\s@]+$/;

export function validateFieldValue(
  field: AnyFieldDefinition,
  value: string,
): null | string {
  const { attributes } = field;
  if (attributes.required && !value.trim()) {
    return `${attributes.label} is required`;
  }

  if (!value && !attributes.required) return null;

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
      if ("pattern" in field.attributes && field.attributes.pattern) {
        try {
          // eslint-disable-next-line security/detect-non-literal-regexp -- pattern is a user-defined attribute
          if (!new RegExp(field.attributes.pattern).test(value)) {
            return "Invalid format";
          }
        } catch {
          break;
        }
      }
      if (field.type === "email" && !EMAIL_FORMAT.test(value)) {
        return "Invalid email address";
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

  return null;
}

/**
 * Coerces the persisted `rules` member into a standalone `RulesDefinition`.
 * Handles both the current object shape ({ id, version, rules }) and the
 * legacy bare array that predates the standalone rules schema.
 */
const normalizeRules = (raw: unknown): RulesDefinition => {
  if (typeof raw === "object" && raw !== null) {
    const candidate = raw as {
      id?: unknown;
      rules?: unknown;
      version?: unknown;
    };
    if (
      typeof candidate.id === "string" &&
      typeof candidate.version === "number" &&
      Array.isArray(candidate.rules)
    ) {
      return {
        id: candidate.id,
        rules: candidate.rules as RulesDefinition["rules"],
        version: candidate.version,
      };
    }
  }
  if (Array.isArray(raw)) {
    return { ...newRulesDefinition(), rules: raw as RulesDefinition["rules"] };
  }
  return newRulesDefinition();
};

/**
 * Validates persisted JSON against the current canonical structure and
 * normalizes `savedAt`. Returns null when the payload does not match.
 */
export const normalizePersisted = (
  raw: unknown,
): null | PersistedFormDefinition => {
  if (typeof raw !== "object" || raw === null) return null;
  // Deliberately permissive view of the payload: persisted JSON is untrusted,
  // so every member stays nullable until validated below.
  const data = raw as {
    id?: unknown;
    rules?: unknown;
    savedAt?: unknown;
    steps?: unknown;
    version?: unknown;
  };
  const savedAt = typeof data.savedAt === "number" ? data.savedAt : 0;

  // Accept both the current schema version and the legacy v1 payloads (which
  // predate rules) so persisted drafts keep loading after the field is added.
  const versionNumber =
    typeof data.version === "number" ? data.version : FORM_DEFINITION_VERSION;
  const versionSupported =
    versionNumber === FORM_DEFINITION_VERSION || versionNumber === 1;

  if (
    versionSupported &&
    typeof data.id === "string" &&
    Array.isArray(data.steps) &&
    (data.steps as FormDefinition["steps"]).every(
      (step) =>
        typeof step.id === "string" &&
        Array.isArray(step.sections) &&
        step.sections.length > 0,
    )
  ) {
    return {
      id: data.id,
      rules: normalizeRules(data.rules),
      savedAt,
      steps: data.steps as FormDefinition["steps"],
      version: FORM_DEFINITION_VERSION,
    };
  }
  return null;
};
