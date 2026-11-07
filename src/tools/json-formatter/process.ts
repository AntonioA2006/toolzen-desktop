// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { ToolError } from "@/services/execution/local-provider";

export interface JsonFormatterInput {
  source: string;
  indent: 2 | 4;
}

export interface JsonFormatterOutput {
  formatted: string;
  byteLength: number;
}

export function formatJson(input: JsonFormatterInput): JsonFormatterOutput {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.source);
  } catch (error) {
    throw new ToolError("invalid_json", error instanceof Error ? error.message : "Invalid JSON.");
  }
  const formatted = JSON.stringify(parsed, null, input.indent);
  return { formatted, byteLength: new TextEncoder().encode(formatted).byteLength };
}

export function jsonErrorLocation(message: string): number | null {
  const match = /position (\d+)/i.exec(message);
  if (!match?.[1]) return null;
  const position = Number(match[1]);
  return Number.isInteger(position) ? position : null;
}
