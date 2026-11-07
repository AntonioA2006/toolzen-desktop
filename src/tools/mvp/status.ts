// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export type ToolReadiness = "ready" | "partial" | "unavailable";

/** Ready tools are the ones this build can run without an external program. */
export const TOOL_READINESS: Record<string, ToolReadiness> = {
  "merge-pdf": "ready",
  "extract-pdf-pages": "ready",
  "delete-pdf-pages": "ready",
  "rotate-pdf": "ready",
  "compress-image": "ready",
  "resize-image": "ready",
  "crop-image": "ready",
  "webp-converter": "ready",
  "remove-image-metadata": "ready",
  "jpg-to-pdf": "ready",
  "split-pdf": "partial",
  "compress-pdf": "unavailable",
  "crop-pdf": "unavailable",
  "watermark-pdf": "unavailable",
  "protect-pdf": "unavailable",
  "unlock-pdf": "unavailable",
  "pdf-to-jpg": "unavailable",
  "word-to-pdf": "unavailable",
  "pdf-to-word": "unavailable",
  "image-to-text": "unavailable",
};

export function readinessOf(id: string): ToolReadiness {
  return TOOL_READINESS[id] ?? "unavailable";
}
