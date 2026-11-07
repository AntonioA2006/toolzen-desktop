// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { harmlessRequests, localTextCapabilities, type ToolProfile } from "@/tools/types";
import { uuidGeneratorInputSchema, uuidGeneratorOutputSchema, validateUuidGeneratorInput } from "./validate";

export const uuidGeneratorTool: ToolProfile = {
  meta: {
    id: "uuid-generator",
    name: "UUID Generator",
    description: "Generate version-4 UUIDs with the local cryptographic random source.",
    category: "developer-tools",
    icon: "fingerprint",
    tags: ["uuid", "identifier", "random"],
    availability: "available",
    processingMode: "local",
    formats: { input: ["application/json"], output: ["text/plain"] },
  },
  contract: {
    purpose: "Create RFC 4122 version-4 UUIDs locally. No identifier service is contacted.",
    input: uuidGeneratorInputSchema,
    output: uuidGeneratorOutputSchema,
    permissions: [
      {
        kind: "tool.execute",
        sensitivity: "harmless",
        description: "Uses the platform CSPRNG. Generated values are shown only in the page.",
      },
    ],
  },
  capabilities: localTextCapabilities("application/json", "text/plain"),
  validate: validateUuidGeneratorInput,
  derivePermissionRequests: (input) => harmlessRequests("uuid-generator", input),
};
