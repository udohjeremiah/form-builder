import * as z from "zod";

import type { AnyFieldDefinition } from "@/components/builder";

import {
  type FormValue,
  isFieldDisabled,
  isFieldVisible,
} from "@/components/builder/form/form-definition";

import { formatBytes } from "./field/file";

export function buildDefaultValues(
  fields: AnyFieldDefinition[],
): Record<string, FormValue> {
  const values: Record<string, FormValue> = {};

  for (const field of fields) {
    if (field.type === "toggle") {
      values[field.id] = "false";
    } else if (field.type === "file" && field.attributes.multiple) {
      values[field.id] = [];
    } else {
      values[field.id] = "";
    }
  }

  return values;
}

export function buildFormSchema(
  fields: AnyFieldDefinition[],
  values: Record<string, FormValue>,
): z.ZodObject<Record<string, z.ZodType>> {
  const shape: Record<string, z.ZodType> = {};

  for (const field of fields) {
    shape[field.id] = buildFieldSchema(fields, values, field);
  }

  return z.object(shape);
}

function buildFieldSchema(
  fields: AnyFieldDefinition[],
  values: Record<string, FormValue>,
  field: AnyFieldDefinition,
): z.ZodType {
  const { attributes } = field;

  const disabled = isFieldDisabled(fields, values, field);
  const hidden = !isFieldVisible(fields, values, field);
  if (disabled || hidden) return z.any();

  switch (field.type) {
    case "email": {
      let s = z.email();

      if (field.attributes.required) {
        s = s.min(1, `${attributes.label} is required`);
      }
      if (field.attributes.minLength !== undefined) {
        s = s.min(field.attributes.minLength);
      }
      if (field.attributes.maxLength !== undefined) {
        s = s.max(field.attributes.maxLength);
      }

      return s;
    }
    case "file": {
      let s = z.file();

      const { accept, maxSize } = field.attributes;

      if (accept && accept.length > 0) {
        s = s.mime(accept);
      }
      if (maxSize !== undefined) {
        s = s.max(
          maxSize,
          `File exceeds the maximum size of ${formatBytes(maxSize)}`,
        );
      }
      if (field.attributes.multiple) {
        let arraySchema = z.array(s);

        if (field.attributes.required) {
          arraySchema = arraySchema.min(1, `${attributes.label} is required`);
        }

        return arraySchema;
      }

      return s;
    }
    case "number":
    case "rating":
    case "slider": {
      let s = z.number();

      if (field.attributes.min !== undefined) {
        s = s.min(field.attributes.min);
      }
      if (field.attributes.max !== undefined) {
        s = s.max(field.attributes.max);
      }

      return z.preprocess(
        (value: string) => (value === "" ? undefined : Number(value)),
        field.attributes.required ? s : s.optional(),
      );
    }
    case "password":
    case "tel":
    case "text": {
      let s = z.string().trim();

      if (field.attributes.required) {
        s = s.min(1, `${attributes.label} is required`);
      }
      if (field.attributes.minLength !== undefined) {
        s = s.min(field.attributes.minLength);
      }
      if (field.attributes.maxLength !== undefined) {
        s = s.max(field.attributes.maxLength);
      }
      if ("pattern" in attributes && attributes.pattern) {
        // eslint-disable-next-line security/detect-non-literal-regexp
        s = s.regex(new RegExp(attributes.pattern));
      }

      return s;
    }
    case "textarea": {
      let s = z.string().trim();

      if (field.attributes.required) {
        s = s.min(1, `${attributes.label} is required`);
      }
      if (field.attributes.minLength !== undefined) {
        s = s.min(field.attributes.minLength);
      }
      if (field.attributes.maxLength !== undefined) {
        s = s.max(field.attributes.maxLength);
      }

      return s;
    }
    case "url": {
      let s = z.url();

      if (field.attributes.required) {
        s = s.min(1, `${attributes.label} is required`);
      }
      if (field.attributes.minLength !== undefined) {
        s = s.min(field.attributes.minLength);
      }
      if (field.attributes.maxLength !== undefined) {
        s = s.max(field.attributes.maxLength);
      }

      return s;
    }
    default: {
      let s = z.string().trim();

      if (field.attributes.required) {
        s = s.min(1, `${attributes.label} is required`);
      }

      return s;
    }
  }
}
