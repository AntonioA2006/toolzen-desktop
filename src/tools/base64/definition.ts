// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { harmlessRequests, localTextCapabilities, type ToolProfile } from "@/tools/types";
import { base64InputSchema, base64OutputSchema, validateBase64Input } from "./validate";

export const base64Tool: ToolProfile = {
  meta: {
    id: "base64",
    name: "Base64",
    description: "Encode or decode Base64, including Unicode text and URL-safe alphabets.",
    category: "converters",
    icon: "binary",
    tags: ["base64", "encode", "decode", "unicode"],
    availability: "available",
    processingMode: "local",
    formats: { input: ["text/plain"], output: ["text/plain"] },
  },
  contract: {
    purpose: "Convert between Unicode text and standard or URL-safe Base64.",
    input: base64InputSchema,
    output: base64OutputSchema,
    permissions: [
      {
        kind: "tool.execute",
        sensitivity: "harmless",
        description: "Converts the text in the form. Invalid input is rejected and is not stored.",
      },
    ],
  },
  capabilities: localTextCapabilities("text/plain", "text/plain"),
  validate: validateBase64Input,
  derivePermissionRequests: (input) => harmlessRequests("base64", input),
};
