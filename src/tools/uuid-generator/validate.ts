// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { validateSchema, type FieldSchema, type SchemaResult } from "@/services/schema/field-schema";
import type { UuidGeneratorInput } from "./process";

export const uuidGeneratorInputSchema = {
  type: "object",
  description: "How many UUIDs to generate and how to format them.",
  additionalProperties: false,
  fields: [
    { name: "count", required: true, schema: { type: "integer", description: "Number of UUIDs.", minimum: 1, maximum: 100 } },
    { name: "uppercase", required: true, schema: { type: "boolean", description: "Use uppercase hexadecimal." } },
    { name: "hyphens", required: true, schema: { type: "boolean", description: "Keep hyphen separators." } },
  ],
} as const satisfies FieldSchema;

export const uuidGeneratorOutputSchema = {
  type: "object",
  description: "Generated UUID strings.",
  additionalProperties: false,
  fields: [
    {
      name: "uuids",
      required: true,
      schema: { type: "array", description: "UUID values.", items: { type: "string", description: "One UUID." }, minItems: 1, maxItems: 100 },
    },
  ],
} as const satisfies FieldSchema;

export function validateUuidGeneratorInput(input: unknown): SchemaResult<UuidGeneratorInput> {
  const structural = validateSchema(uuidGeneratorInputSchema, input);
  if (!structural.ok) return structural;
  const value = structural.value as UuidGeneratorInput;
  return { ok: true, value };
}
