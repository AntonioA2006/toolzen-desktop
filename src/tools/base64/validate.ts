// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { validateSchema, type FieldSchema, type SchemaResult } from "@/services/schema/field-schema";
import { decodeBase64, type Base64Input } from "./process";
import { ToolError } from "@/services/execution/local-provider";

export const base64InputSchema = {
  type: "object",
  description: "Text to encode or Base64 text to decode.",
  additionalProperties: false,
  fields: [
    { name: "text", required: true, schema: { type: "string", description: "Input text.", maxLength: 1_000_000 } },
    { name: "action", required: true, schema: { type: "enum", description: "Encode or decode.", values: ["encode", "decode"] } },
    { name: "alphabet", required: true, schema: { type: "enum", description: "Standard or URL-safe Base64.", values: ["standard", "url"] } },
  ],
} as const satisfies FieldSchema;

export const base64OutputSchema = {
  type: "object",
  description: "Encoded or decoded text.",
  additionalProperties: false,
  fields: [{ name: "text", required: true, schema: { type: "string", description: "Result text." } }],
} as const satisfies FieldSchema;

export function validateBase64Input(input: unknown): SchemaResult<Base64Input> {
  const structural = validateSchema(base64InputSchema, input);
  if (!structural.ok) return structural;
  const value = structural.value as Base64Input;
  if (value.action === "decode") {
    try {
      decodeBase64(value.text, value.alphabet);
    } catch (error) {
      const message = error instanceof ToolError ? error.message : "The text is not valid Base64.";
      return { ok: false, errors: [{ field: "input.text", message }] };
    }
  }
  return { ok: true, value };
}
