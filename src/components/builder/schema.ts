import * as z from "zod";

import type {
  AnyFieldDefinition,
  BuilderDefinition,
} from "@/components/builder";

import {
  getStructureAttributes,
  STRUCTURE_ATTRIBUTES,
  type StructureKind,
  type StructurePosition,
} from "./form/structure-registry";
import { isPresenceOperator } from "./operators";

type FieldAttributeValues = Record<
  string,
  boolean | number | string | string[] | undefined
>;

const fieldValue = (value: unknown): FieldAttributeValues =>
  value as FieldAttributeValues;

export function buildFieldSchema(field: AnyFieldDefinition): z.ZodType {
  const { attributes } = field;

  const shape: Record<string, z.ZodType> = {
    description: z.string().optional(),
    label: z.string().trim().min(1, "Label is required"),
    placeholder: z.string().trim().min(1, "Placeholder is required"),
    required: z.boolean(),
  };

  if ("accept" in attributes) {
    shape["accept"] = z.array(z.string()).optional();
    shape["maxSize"] = z.number().optional();
    shape["multiple"] = z.boolean().optional();
  }

  if ("minDate" in attributes) {
    shape["minDate"] = z.string().optional();
    shape["maxDate"] = z.string().optional();
  }

  if ("minLength" in attributes) {
    shape["minLength"] = z.number().optional();
    shape["maxLength"] = z.number().optional();
  }

  if ("options" in attributes) {
    shape["options"] = z.array(z.string()).optional();
  }

  if ("pattern" in attributes) {
    shape["pattern"] = z.string().optional();
  }

  if ("step" in attributes) {
    shape["step"] = z.number().optional();
  }

  if ("min" in attributes) {
    shape["min"] = z.number().optional();
    shape["max"] = z.number().optional();
  }

  let schema = z.object(shape);
  if ("accept" in attributes) {
    schema = schema.refine(
      (value) =>
        (fieldValue(value)["accept"] as string[] | undefined)?.every(
          (entry) => entry.trim().length > 0,
        ) ?? true,
      { message: "Accepted file types cannot be empty", path: ["accept"] },
    );
  }

  if ("minDate" in attributes) {
    schema = schema.refine(
      (value) => {
        const minDate = fieldValue(value)["minDate"] as string | undefined;
        const maxDate = fieldValue(value)["maxDate"] as string | undefined;
        return (
          minDate === undefined || maxDate === undefined || minDate <= maxDate
        );
      },
      {
        message: "Maximum date cannot be before minimum date",
        path: ["maxDate"],
      },
    );
  }

  if ("minLength" in attributes) {
    schema = schema.refine(
      (value) => {
        const minLength = fieldValue(value)["minLength"] as number | undefined;
        const maxLength = fieldValue(value)["maxLength"] as number | undefined;
        return (
          minLength === undefined ||
          maxLength === undefined ||
          minLength <= maxLength
        );
      },
      {
        message: "Minimum length cannot be greater than maximum length",
        path: ["maxLength"],
      },
    );
  }

  if ("options" in attributes) {
    schema = schema.refine(
      (value) =>
        (fieldValue(value)["options"] as string[] | undefined)?.some(
          (option) => option.trim().length > 0,
        ) ?? false,
      { message: "Add at least one option", path: ["options"] },
    );
  }

  if ("pattern" in attributes) {
    schema = schema.refine(
      (value) => {
        const pattern = fieldValue(value)["pattern"] as string | undefined;
        if (typeof pattern !== "string" || pattern.trim().length === 0) {
          return true;
        }
        try {
          // eslint-disable-next-line security/detect-non-literal-regexp
          new RegExp(pattern);
          return true;
        } catch {
          return false;
        }
      },
      {
        message: "Pattern is not a valid regular expression",
        path: ["pattern"],
      },
    );
  }

  if ("step" in attributes) {
    schema = schema.refine(
      (value) => {
        const step = fieldValue(value)["step"] as number | undefined;
        return typeof step === "number" && step > 0;
      },
      { message: "Step must be greater than 0", path: ["step"] },
    );
  }

  if ("min" in attributes) {
    schema = schema.refine(
      (value) => {
        const min = fieldValue(value)["min"] as number | undefined;
        const max = fieldValue(value)["max"] as number | undefined;
        return min === undefined || max === undefined || min <= max;
      },
      { message: "Minimum cannot be greater than maximum", path: ["max"] },
    );
  }

  return schema;
}

export function buildStructureSchema(
  kind: StructureKind,
  position: StructurePosition,
): z.ZodType {
  const applicable = new Set(
    getStructureAttributes(kind, position).map((meta) => meta.key),
  );
  const shape: Record<string, z.ZodType> = {};

  for (const meta of STRUCTURE_ATTRIBUTES[kind]) {
    shape[meta.key] = applicable.has(meta.key)
      ? z.string().trim().min(1, `${meta.label} is required`)
      : z.string().optional();
  }

  return z.object(shape);
}

const comparisonConditionSchema = z
  .object({
    field: z.string(),
    operator: z.string(),
    type: z.literal("comparison"),
    value: z.string().optional(),
  })
  .refine((condition) => condition.field.trim().length > 0, {
    message: "Select a field",
    path: ["field"],
  })
  .refine(
    (condition) =>
      isPresenceOperator(condition.operator as never) ||
      (condition.value?.trim().length ?? 0) > 0,
    {
      message: "Expected value is required",
      path: ["value"],
    },
  );

const existsConditionSchema = z
  .object({
    field: z.string(),
    present: z.boolean(),
    type: z.literal("exists"),
  })
  .refine((condition) => condition.field.trim().length > 0, {
    message: "Select a field",
    path: ["field"],
  });

const reviewConditionSchema = z.object({
  note: z.string().optional(),
  type: z.literal("review"),
});

const groupConditionSchema: z.ZodType = z.object({
  conditions: z
    .array(z.lazy((): z.ZodType => conditionSchema))
    .min(1, "Add at least one condition"),
  operator: z.string(),
  type: z.literal("group"),
});

const conditionSchema: z.ZodType = z.union([
  comparisonConditionSchema,
  existsConditionSchema,
  reviewConditionSchema,
  groupConditionSchema,
]);

const outcomeSchema = z.object({
  adminReason: z.string().trim().min(1, "Admin reason is required"),
  deadline: z
    .object({
      amount: z.number(),
      unit: z.string(),
    })
    .optional(),
  status: z.string(),
  studentAction: z.string().optional(),
});

export const ruleFormSchema = z.object({
  area: z.string().trim().min(1, "Area is required"),
  condition: conditionSchema,
  outcome: outcomeSchema,
});

const fieldRuleSchema = z
  .object({
    fieldId: z.string(),
    operator: z.string(),
    value: z.string().optional(),
  })
  .refine((rule) => rule.fieldId.trim().length > 0, {
    message: "Select a field",
    path: ["fieldId"],
  })
  .refine(
    (rule) =>
      isPresenceOperator(rule.operator as never) ||
      (rule.value?.trim().length ?? 0) > 0,
    {
      message: "Expected value is required",
      path: ["value"],
    },
  );

const fieldLogicGroupSchema = z.object({
  combinator: z.union([z.literal("and"), z.literal("or")]),
  rules: z.array(fieldRuleSchema),
});

export const fieldLogicSchema = z
  .object({
    disable: fieldLogicGroupSchema.optional(),
    hide: fieldLogicGroupSchema.optional(),
    show: fieldLogicGroupSchema.optional(),
  })
  .optional();

export function buildDefinitionSchema(
  definition: BuilderDefinition,
): z.ZodType {
  const stepCount = definition.steps.length;

  return z.object({
    rules: z.array(ruleFormSchema),
    steps: z.tuple(
      definition.steps.map((step, index) =>
        z.object({
          attributes: buildStructureSchema("step", {
            isFirstStep: index === 0,
            isLastStep: index === stepCount - 1,
          }),
          id: z.string(),
          sections: z.tuple(
            step.sections.map((section) =>
              z.object({
                attributes: buildStructureSchema("section", {
                  isFirstStep: false,
                  isLastStep: false,
                }),
                fields: z.tuple(
                  section.fields.map((field) =>
                    z.object({
                      attributes: buildFieldSchema(field),
                      id: z.string(),
                      logic: fieldLogicSchema,
                    }),
                  ) as unknown as [z.ZodType, ...z.ZodType[]],
                ),
                id: z.string(),
              }),
            ) as unknown as [z.ZodType, ...z.ZodType[]],
          ),
        }),
      ) as unknown as [z.ZodType, ...z.ZodType[]],
    ),
  });
}
