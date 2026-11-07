// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export const CATEGORY_IDS = [
  "pdf",
  "images",
  "text",
  "developer-tools",
  "file-utilities",
  "converters",
  "productivity",
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface CategoryDefinition {
  id: CategoryId;
  name: string;
  description: string;
  icon: ToolIconName;
}

export type ToolIconName =
  | "braces"
  | "fingerprint"
  | "binary"
  | "file-text"
  | "image"
  | "type"
  | "code"
  | "folder"
  | "repeat"
  | "timer"
  | "home"
  | "star"
  | "clock"
  | "settings"
  | "info"
  | "search";

export const CATEGORIES: readonly CategoryDefinition[] = [
  { id: "pdf", name: "PDF", description: "Document tools planned for a later release.", icon: "file-text" },
  { id: "images", name: "Images", description: "Image tools planned for a later release.", icon: "image" },
  { id: "text", name: "Text", description: "Text tools planned for a later release.", icon: "type" },
  { id: "developer-tools", name: "Developer Tools", description: "Format, generate, and inspect local developer data.", icon: "code" },
  { id: "file-utilities", name: "File Utilities", description: "File tools planned for a later release.", icon: "folder" },
  { id: "converters", name: "Converters", description: "Convert data locally.", icon: "repeat" },
  { id: "productivity", name: "Productivity", description: "Productivity tools planned for a later release.", icon: "timer" },
];

export function categoryById(id: CategoryId): CategoryDefinition {
  const category = CATEGORIES.find((item) => item.id === id);
  if (!category) throw new Error(`Unknown category ${id}`);
  return category;
}
