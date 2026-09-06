import type {
  AnyFieldDefinition,
  BuilderDefinition,
  Condition,
  ConditionGroup,
  FieldLogic,
  FieldRule,
  FieldType,
  RuleDefinition,
  SectionAttributes,
  SectionDefinition,
  StepAttributes,
  StepDefinition,
} from "../index";

import { buildDefinitionSchema } from "../schema";
import { getFieldEntry } from "./field-registry";

export interface FieldComponentProps {
  definition: AnyFieldDefinition;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: any;
}

export type FormValue = File | File[] | string;

const ID_ALPHABET = "0123456789abcdefghijklmnopqrstuvwxyz";

const randomId = (prefix: string): string => {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(8));
  const suffix = Array.from(
    bytes,
    (byte) => ID_ALPHABET[byte % ID_ALPHABET.length],
  ).join("");
  return `${prefix}_${suffix}`;
};

const STEP_DESCRIPTION = "Add a description for this step";
const SECTION_DESCRIPTION = "Add a description for this section";

const createSection = (
  title: string,
  description: string,
  fields: AnyFieldDefinition[] = [],
): SectionDefinition => ({
  attributes: { description, title },
  fields,
  id: randomId("sec"),
});

const createStepDefinition = (
  title: string,
  description: string,
): StepDefinition => {
  const id = randomId("st");
  return {
    attributes: {
      description,
      nextLabel: "Next",
      previousLabel: "Back",
      submitLabel: "Submit",
      title,
    },
    id,
    sections: [createSection("Section 1", SECTION_DESCRIPTION)],
  };
};

export const newField = (type: FieldType): AnyFieldDefinition => {
  const entry = getFieldEntry(type);
  return {
    attributes: {
      ...entry.defaults(),
      label: entry.label,
      placeholder: `Enter ${entry.label.toLowerCase()}...`,
      required: true,
    },
    id: randomId("fld"),
    logic: {},
    type,
  };
};

export const getFields = (steps: StepDefinition[]): AnyFieldDefinition[] =>
  steps.flatMap((step) => step.sections.flatMap((section) => section.fields));

export const getField = (
  definition: BuilderDefinition,
  id: string,
): AnyFieldDefinition | null =>
  getFields(definition.steps).find((field) => field.id === id) ?? null;

export const updateField = (
  definition: BuilderDefinition,
  id: string,
  updater: (field: AnyFieldDefinition) => AnyFieldDefinition,
): BuilderDefinition => ({
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
  definition: BuilderDefinition,
  id: string,
): BuilderDefinition => ({
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
  definition: BuilderDefinition,
  id: string,
): BuilderDefinition => ({
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
        id: randomId("fld"),
      };
      const next = [...section.fields];
      next.splice(index + 1, 0, clone);
      return { ...section, fields: next };
    }),
  })),
});

export const appendField = (
  definition: BuilderDefinition,
  stepIndex: number,
  field: AnyFieldDefinition,
): BuilderDefinition => {
  if (definition.steps.length === 0) {
    const step = createStepDefinition("Step 1", STEP_DESCRIPTION);
    step.sections = [createSection("Section 1", SECTION_DESCRIPTION, [field])];
    return { ...definition, steps: [step] };
  }

  return {
    ...definition,
    steps: definition.steps.map((step, index) => {
      if (index !== stepIndex) return step;

      if (step.sections.length === 0) {
        return {
          ...step,
          sections: [createSection("Section 1", SECTION_DESCRIPTION, [field])],
        };
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
  };
};

export const moveField = (
  definition: BuilderDefinition,
  fromId: string,
  toId: string,
): BuilderDefinition => {
  if (fromId === toId) return definition;

  const flat = getFields(definition.steps);
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

export const moveFieldWithinSection = (
  definition: BuilderDefinition,
  sectionId: string,
  fromIndex: number,
  toIndex: number,
): BuilderDefinition => {
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

export const appendFieldToSection = (
  definition: BuilderDefinition,
  sectionId: string,
  field: AnyFieldDefinition,
): BuilderDefinition => ({
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

export const moveFieldIntoSection = (
  definition: BuilderDefinition,
  fieldId: string,
  sectionId: string,
): BuilderDefinition => {
  const flat = getFields(definition.steps);

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

export const addStep = (definition: BuilderDefinition): BuilderDefinition => ({
  ...definition,
  steps: [
    ...definition.steps,
    createStepDefinition(
      `Step ${definition.steps.length + 1}`,
      STEP_DESCRIPTION,
    ),
  ],
});

export const addSection = (
  definition: BuilderDefinition,
  stepIndex: number,
): BuilderDefinition => ({
  ...definition,
  steps: definition.steps.map((step, index) =>
    index === stepIndex
      ? {
          ...step,
          sections: [
            ...step.sections,
            createSection(
              `Section ${step.sections.length + 1}`,
              SECTION_DESCRIPTION,
            ),
          ],
        }
      : step,
  ),
});

export const removeSection = (
  definition: BuilderDefinition,
  id: string,
): BuilderDefinition => ({
  ...definition,
  steps: definition.steps.map((step) => ({
    ...step,
    sections: step.sections.filter((section) => section.id !== id),
  })),
});

export const updateStepAttributes = (
  definition: BuilderDefinition,
  stepId: string,
  patch: Partial<StepAttributes>,
): BuilderDefinition => ({
  ...definition,
  steps: definition.steps.map((step) =>
    step.id === stepId
      ? { ...step, attributes: { ...step.attributes, ...patch } }
      : step,
  ),
});

export const updateSectionAttributes = (
  definition: BuilderDefinition,
  sectionId: string,
  patch: Partial<SectionAttributes>,
): BuilderDefinition => ({
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
  definition: BuilderDefinition,
  index: number,
): BuilderDefinition => ({
  ...definition,
  steps: definition.steps.filter((_, stepIndex) => stepIndex !== index),
});

export const moveStep = (
  definition: BuilderDefinition,
  fromIndex: number,
  toIndex: number,
): BuilderDefinition => {
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

export const moveSection = (
  definition: BuilderDefinition,
  stepIndex: number,
  fromIndex: number,
  toIndex: number,
): BuilderDefinition => ({
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

const asNumber = (raw: string) => {
  if (!raw.trim()) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
};

const compareValues = (left: string, right: string) => {
  const leftNumber = asNumber(left);
  const rightNumber = asNumber(right);

  if (leftNumber !== null && rightNumber !== null) {
    if (leftNumber === rightNumber) return 0;
    return leftNumber < rightNumber ? -1 : 1;
  }

  if (left === right) return 0;

  return left < right ? -1 : 1;
};

export function getActiveOptions(field: AnyFieldDefinition) {
  return "options" in field.attributes ? (field.attributes.options ?? []) : [];
}

export function isFieldDisabled(
  allFields: AnyFieldDefinition[],
  values: Record<string, FormValue>,
  field: AnyFieldDefinition,
) {
  const { disable } = field.logic;
  return disable ? evaluateGroup(disable, values, allFields) : false;
}

export function isFieldVisible(
  allFields: AnyFieldDefinition[],
  values: Record<string, FormValue>,
  field: AnyFieldDefinition,
) {
  const { hide, show } = field.logic;
  if (show && !evaluateGroup(show, values, allFields)) return false;
  if (hide && evaluateGroup(hide, values, allFields)) return false;
  return true;
}

function checkedOptions(value: string): string[] {
  return value
    .split(",")
    .map((option) => option.trim())
    .filter((option) => option.length > 0);
}

function evaluateGroup(
  group: ConditionGroup,
  values: Record<string, FormValue>,
  allFields: AnyFieldDefinition[],
) {
  if (group.rules.length === 0) return true;

  // A row without a target field cannot constrain anything.
  const passes = (rule: FieldRule) =>
    !rule.fieldId || evaluateRule(rule, values, allFields);

  return group.combinator === "or"
    ? group.rules.some((rule) => passes(rule))
    : group.rules.every((rule) => passes(rule));
}

function evaluateRule(
  rule: FieldRule,
  values: Record<string, FormValue>,
  allFields: AnyFieldDefinition[],
) {
  const raw = values[rule.fieldId] ?? "";
  const value = typeof raw === "string" ? raw : "";
  const expected = rule.value ?? "";
  const isCheckbox =
    allFields.find((field) => field.id === rule.fieldId)?.type === "checkbox";

  switch (rule.operator) {
    case "contains": {
      return value.includes(expected);
    }
    case "empty": {
      return value.trim().length === 0;
    }
    case "eq": {
      if (isCheckbox)
        return setsEqual(checkedOptions(value), checkedOptions(expected));
      return value === expected;
    }
    case "gt": {
      return compareValues(value, expected) > 0;
    }
    case "gte": {
      return compareValues(value, expected) >= 0;
    }
    case "in": {
      return isCheckbox
        ? intersects(checkedOptions(value), listValues(expected))
        : listIncludes(expected, value);
    }
    case "lt": {
      return compareValues(value, expected) < 0;
    }
    case "lte": {
      return compareValues(value, expected) <= 0;
    }
    case "neq": {
      if (isCheckbox)
        return !setsEqual(checkedOptions(value), checkedOptions(expected));
      return value !== expected;
    }
    case "not_contains": {
      return !value.includes(expected);
    }
    case "not_empty": {
      return value.trim().length > 0;
    }
    case "not_in": {
      return isCheckbox
        ? !intersects(checkedOptions(value), listValues(expected))
        : !listIncludes(expected, value);
    }
  }
}

function intersects(left: string[], right: string[]): boolean {
  return left.some((item) => right.includes(item));
}

function listIncludes(list: string, candidate: string): boolean {
  return list
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0)
    .includes(candidate.trim());
}

function listValues(list: string): string[] {
  return list
    .split("\n")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function setsEqual(left: string[], right: string[]): boolean {
  if (left.length !== right.length) return false;
  return left.every((item) => right.includes(item));
}

const referencesValidField = (target: string, fieldIds: ReadonlySet<string>) =>
  target === "" || fieldIds.has(target);

export const normalizeDefinition = (
  definition: BuilderDefinition,
): BuilderDefinition => {
  const fieldIds = new Set(
    getFields(definition.steps).map((field) => field.id),
  );

  const pruneRuleGroup = (group: ConditionGroup): ConditionGroup => ({
    ...group,
    rules: group.rules.filter((rule) =>
      referencesValidField(rule.fieldId, fieldIds),
    ),
  });

  const pruneLogic = (logic: FieldLogic): FieldLogic => {
    const next: FieldLogic = {};
    for (const key of ["disable", "hide", "show"] as const) {
      const group = logic[key];
      if (group) next[key] = pruneRuleGroup(group);
    }
    return next;
  };

  const pruneRuleConditions = (conditions: Condition[]): Condition[] =>
    conditions.flatMap((condition): Condition[] => {
      switch (condition.type) {
        case "comparison":
        case "exists": {
          return referencesValidField(condition.field, fieldIds)
            ? [condition]
            : [];
        }
        case "group": {
          return [
            {
              ...condition,
              conditions: pruneRuleConditions(condition.conditions),
            },
          ];
        }
        case "review": {
          return [condition];
        }
      }
    });

  const pruneRule = (rule: RuleDefinition): RuleDefinition =>
    rule.condition.type === "group"
      ? {
          ...rule,
          condition: {
            ...rule.condition,
            conditions: pruneRuleConditions(rule.condition.conditions),
          },
        }
      : rule;

  return {
    ...definition,
    rules: definition.rules.map((rule) => pruneRule(rule)),
    steps: definition.steps.map((step) => ({
      ...step,
      sections: step.sections.map((section) => ({
        ...section,
        fields: section.fields.map((field) => ({
          ...field,
          logic: pruneLogic(field.logic),
        })),
      })),
    })),
  };
};

/**
 * Source-of-truth gate used by the Publish action: every step, section, field
 * and rule must be complete before a definition may be published. The editor
 * panels show the same requirements as the zod schemas in ./schema; this is
 * the final whole-definition check.
 */
export const validateDefinition = (definition: BuilderDefinition): boolean =>
  getFields(definition.steps).length > 0 &&
  buildDefinitionSchema(definition).safeParse(definition).success;
