// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { Base64Page } from "./base64/page";
import { toolProfiles } from "./catalog";
import { JsonFormatterPage } from "./json-formatter/page";
import { UnavailableToolPage } from "./unavailable-page";
import { UuidGeneratorPage } from "./uuid-generator/page";
import type { AnyToolDefinition, ToolRegistry } from "./types";

const pages = {
  "json-formatter": JsonFormatterPage,
  "uuid-generator": UuidGeneratorPage,
  base64: Base64Page,
} as const;

const tools: readonly AnyToolDefinition[] = toolProfiles.map((profile) => ({
  ...profile,
  Component: pages[profile.meta.id as keyof typeof pages] ?? UnavailableToolPage,
}));

export const toolRegistry: ToolRegistry = {
  list: () => tools,
  get: (id) => tools.find((tool) => tool.meta.id === id),
};

export function availableTools(): readonly AnyToolDefinition[] {
  return tools.filter((tool) => tool.meta.availability === "available");
}
