// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export type FieldSchema =
  | {
      type: "string";
      description: string;
      minLength?: number;
      maxLength?: number;
    }
  | {
      type: "integer";
      description: string;
      minimum?: number;
      maximum?: number;
    }
  | {
      type: "boolean";
      description: string;
    }
  | {
      type: "enum";
      description: string;
      values: readonly string[];
    }
  | {
      type: "object";
      description: string;
      fields: readonly FieldDef[];
      additionalProperties: false;
    }
  | {
      type: "array";
      description: string;
      items: FieldSchema;
      minItems?: number;
      maxItems?: number;
    };

export interface FieldDef {
  name: string;
  required: boolean;
  schema: FieldSchema;
}

export interface FieldError {
  field: string;
  message: string;
}

export type SchemaResult<T> = { ok: true; value: T } | { ok: false; errors: readonly FieldError[] };

export function validateSchema(schema: FieldSchema, value: unknown, path = "input"): SchemaResult<unknown> {
  switch (schema.type) {
    case "string":
      return validateString(schema, value, path);
    case "integer":
      return validateInteger(schema, value, path);
    case "boolean":
      return typeof value === "boolean"
        ? { ok: true, value }
        : { ok: false, errors: [{ field: path, message: "Enter a boolean value." }] };
    case "enum":
      return typeof value === "string" && schema.values.includes(value)
        ? { ok: true, value }
        : {
            ok: false,
            errors: [{ field: path, message: `Choose one of: ${schema.values.join(", ")}.` }],
          };
    case "array":
      return validateArray(schema, value, path);
    case "object":
      return validateObject(schema, value, path);
    default: {
      const unreachable: never = schema;
      return { ok: false, errors: [{ field: path, message: `Unsupported schema ${String(unreachable)}.` }] };
    }
  }
}

function validateString(
  schema: Extract<FieldSchema, { type: "string" }>,
  value: unknown,
  path: string,
): SchemaResult<string> {
  if (typeof value !== "string") {
    return { ok: false, errors: [{ field: path, message: "Enter text." }] };
  }
  if (schema.minLength !== undefined && value.length < schema.minLength) {
    return { ok: false, errors: [{ field: path, message: `Use at least ${schema.minLength} characters.` }] };
  }
  if (schema.maxLength !== undefined && value.length > schema.maxLength) {
    return { ok: false, errors: [{ field: path, message: `Use at most ${schema.maxLength} characters.` }] };
  }
  return { ok: true, value };
}

function validateInteger(
  schema: Extract<FieldSchema, { type: "integer" }>,
  value: unknown,
  path: string,
): SchemaResult<number> {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    return { ok: false, errors: [{ field: path, message: "Enter a whole number." }] };
  }
  if (schema.minimum !== undefined && value < schema.minimum) {
    return { ok: false, errors: [{ field: path, message: `Use a value of at least ${schema.minimum}.` }] };
  }
  if (schema.maximum !== undefined && value > schema.maximum) {
    return { ok: false, errors: [{ field: path, message: `Use a value of at most ${schema.maximum}.` }] };
  }
  return { ok: true, value };
}

function validateArray(
  schema: Extract<FieldSchema, { type: "array" }>,
  value: unknown,
  path: string,
): SchemaResult<unknown[]> {
  if (!Array.isArray(value)) {
    return { ok: false, errors: [{ field: path, message: "Enter a list." }] };
  }
  if (schema.minItems !== undefined && value.length < schema.minItems) {
    return { ok: false, errors: [{ field: path, message: `Provide at least ${schema.minItems} items.` }] };
  }
  if (schema.maxItems !== undefined && value.length > schema.maxItems) {
    return { ok: false, errors: [{ field: path, message: `Provide at most ${schema.maxItems} items.` }] };
  }
  const items: unknown[] = [];
  const errors: FieldError[] = [];
  value.forEach((item, index) => {
    const result = validateSchema(schema.items, item, `${path}[${index}]`);
    if (result.ok) items.push(result.value);
    else errors.push(...result.errors);
  });
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: items };
}

function validateObject(
  schema: Extract<FieldSchema, { type: "object" }>,
  value: unknown,
  path: string,
): SchemaResult<Record<string, unknown>> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { ok: false, errors: [{ field: path, message: "Enter an object." }] };
  }
  const record = value as Record<string, unknown>;
  const known = new Set(schema.fields.map((field) => field.name));
  const errors: FieldError[] = [];
  if (!schema.additionalProperties) {
    for (const key of Object.keys(record)) {
      if (!known.has(key)) errors.push({ field: joinPath(path, key), message: "This field is not accepted." });
    }
  }
  const output: Record<string, unknown> = {};
  for (const field of schema.fields) {
    const present = Object.prototype.hasOwnProperty.call(record, field.name);
    if (!present || record[field.name] === undefined) {
      if (field.required) errors.push({ field: joinPath(path, field.name), message: "This field is required." });
      continue;
    }
    const result = validateSchema(field.schema, record[field.name], joinPath(path, field.name));
    if (result.ok) output[field.name] = result.value;
    else errors.push(...result.errors);
  }
  return errors.length > 0 ? { ok: false, errors } : { ok: true, value: output };
}

function joinPath(parent: string, name: string): string {
  return parent ? `${parent}.${name}` : name;
}

export function objectField(schema: FieldSchema, name: string): FieldDef | undefined {
  if (schema.type !== "object") return undefined;
  return schema.fields.find((field) => field.name === name);
}
