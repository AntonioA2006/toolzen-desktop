// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export const CATEGORY_IDS = ["pdf", "conversion", "image", "ocr", "developer-tools", "converters", "text", "images", "file-utilities", "productivity"] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  description: string;
  icon: ToolIconName;
}

export type ToolIconName =
  | "layers"
  | "split"
  | "archive"
  | "file-input"
  | "image"
  | "scan-text"
  | "rotate-cw"
  | "file-minus"
  | "file-plus"
  | "crop"
  | "stamp"
  | "lock"
  | "unlock"
  | "scaling"
  | "eraser"
  | "file-output"
  | "home"
  | "star"
  | "clock"
  | "settings"
  | "info"
  | "search"
  | "shield"
  | "braces"
  | "fingerprint"
  | "binary"
  | "file-text"
  | "type"
  | "folder"
  | "repeat"
  | "timer";

export const CATEGORIES: readonly CategoryDefinition[] = [
  { id: "pdf", name: "PDF", description: "Merge, split, compress, rotate, crop, watermark, protect, and unlock documents.", icon: "layers" },
  { id: "conversion", name: "Convert", description: "Word to PDF, PDF to Word, and images to PDF.", icon: "file-input" },
  { id: "image", name: "Image", description: "Compress, resize, crop, convert to WebP, and strip metadata.", icon: "image" },
  { id: "ocr", name: "OCR", description: "Extract text from an image into a .txt file.", icon: "scan-text" },
];

export function categoryById(id: CategoryId): CategoryDefinition {
  const category = CATEGORIES.find((item) => item.id === id);
  if (!category) throw new Error(`Unknown category ${id}`);
  return category;
}
