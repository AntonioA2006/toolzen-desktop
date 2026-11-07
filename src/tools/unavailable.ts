// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { CategoryId, ToolIconName } from "./categories";
import { localTextCapabilities, type ToolProfile } from "./types";

const emptyObject = {
  type: "object" as const,
  description: "No input is accepted because this tool is not implemented.",
  additionalProperties: false as const,
  fields: [],
};

function unavailable(input: {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: ToolIconName;
  tags: readonly string[];
  purpose: string;
}): ToolProfile {
  return {
    meta: {
      ...input,
      availability: "unavailable",
      unavailableReason: `${input.name} is not implemented in this release. ToolZen will not pretend to run it.`,
      processingMode: "local",
      formats: { input: [], output: [] },
    },
    contract: {
      purpose: input.purpose,
      input: emptyObject,
      output: emptyObject,
      permissions: [
        {
          kind: "tool.execute",
          sensitivity: "harmless",
          description: "Not executable. No permission is used because the tool does not run.",
        },
      ],
    },
    capabilities: { ...localTextCapabilities("application/octet-stream", "application/octet-stream"), supportedModes: ["local"] },
    validate: () => ({ ok: false, errors: [{ field: "tool", message: "This tool is not implemented." }] }),
    derivePermissionRequests: () => [],
  };
}

export const unavailableTools: readonly ToolProfile[] = [
  unavailable({
    id: "pdf-merge",
    name: "PDF Merge",
    description: "Combine PDF files on this device.",
    category: "pdf",
    icon: "file-text",
    tags: ["pdf", "merge"],
    purpose: "Future local PDF merge. Not implemented.",
  }),
  unavailable({
    id: "image-compress",
    name: "Image Compress",
    description: "Reduce image file size locally.",
    category: "images",
    icon: "image",
    tags: ["image", "compress"],
    purpose: "Future local image compression. Not implemented.",
  }),
  unavailable({
    id: "text-sort-lines",
    name: "Sort Lines",
    description: "Sort lines of text.",
    category: "text",
    icon: "type",
    tags: ["text", "sort"],
    purpose: "Future local line sorting. Not implemented.",
  }),
  unavailable({
    id: "file-checksum",
    name: "File Checksum",
    description: "Hash a file you select.",
    category: "file-utilities",
    icon: "folder",
    tags: ["file", "hash"],
    purpose: "Future local file hash. Not implemented and has no filesystem access.",
  }),
  unavailable({
    id: "unit-converter",
    name: "Unit Converter",
    description: "Convert common units.",
    category: "converters",
    icon: "repeat",
    tags: ["units", "convert"],
    purpose: "Future local unit conversion. Not implemented.",
  }),
  unavailable({
    id: "pomodoro",
    name: "Pomodoro",
    description: "A local focus timer.",
    category: "productivity",
    icon: "timer",
    tags: ["timer", "focus"],
    purpose: "Future local timer. Not implemented.",
  }),
];
