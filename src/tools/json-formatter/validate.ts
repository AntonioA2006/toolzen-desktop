// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { validateSchema, type FieldSchema, type SchemaResult } from "@/services/schema/field-schema";
import { jsonErrorLocation, type JsonFormatterInput } from "./process";

export const jsonFormatterInputSchema = {
  type: "object",
  description: "JSON text and indent width.",
  additionalProperties: false,
  fields: [
    { name: "source", required: true, schema: { type: "string", description: "JSON text to format.", minLength: 1, maxLength: 1_000_000 } },
    { name: "indent", required: true, schema: { type: "integer", description: "Spaces per nesting level. Only 2 or 4.", minimum: 2, maximum: 4 } },
  ],
} as const satisfies FieldSchema;

export const jsonFormatterOutputSchema = {
  type: "object",
  description: "Formatted JSON and its UTF-8 size.",
  additionalProperties: false,
  fields: [
    { name: "formatted", required: true, schema: { type: "string", description: "Pretty-printed JSON." } },
    { name: "byteLength", required: true, schema: { type: "integer", description: "UTF-8 byte length.", minimum: 0 } },
  ],
} as const satisfies FieldSchema;

export function validateJsonFormatterInput(input: unknown): SchemaResult<JsonFormatterInput> {
  const structural = validateSchema(jsonFormatterInputSchema, input);
  if (!structural.ok) return structural;
  const value = structural.value as { source: string; indent: number };
  if (value.indent !== 2 && value.indent !== 4) {
    return { ok: false, errors: [{ field: "input.indent", message: "Indent must be 2 or 4." }] };
  }
  try {
    JSON.parse(value.source);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid JSON.";
    const position = jsonErrorLocation(message);
    return {
      ok: false,
      errors: [{ field: "input.source", message: position === null ? message : `${message} (character ${position}).` }],
    };
  }
  return { ok: true, value: { source: value.source, indent: value.indent } };
}
