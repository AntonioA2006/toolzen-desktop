// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { harmlessRequests, localTextCapabilities, type ToolProfile } from "@/tools/types";
import { jsonFormatterInputSchema, jsonFormatterOutputSchema, validateJsonFormatterInput } from "./validate";

export const jsonFormatterTool: ToolProfile = {
  meta: {
    id: "json-formatter",
    name: "JSON Formatter",
    description: "Validate JSON and print it with a stable indent.",
    category: "developer-tools",
    icon: "braces",
    tags: ["json", "format", "validate"],
    availability: "available",
    processingMode: "local",
    formats: { input: ["application/json"], output: ["application/json"] },
  },
  contract: {
    purpose: "Check that text is JSON and rewrite it with 2 or 4 space indentation.",
    input: jsonFormatterInputSchema,
    output: jsonFormatterOutputSchema,
    permissions: [
      {
        kind: "tool.execute",
        sensitivity: "harmless",
        description: "Reads only the text in the form. Nothing is stored or sent.",
      },
    ],
  },
  capabilities: localTextCapabilities("application/json", "application/json"),
  validate: validateJsonFormatterInput,
  derivePermissionRequests: (input) => harmlessRequests("json-formatter", input),
};
