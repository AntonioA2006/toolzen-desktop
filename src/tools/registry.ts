// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { toolProfiles } from "./catalog";
import { MvpToolPage } from "./mvp/page";
import type { AnyToolDefinition, ToolRegistry } from "./types";

const tools: readonly AnyToolDefinition[] = toolProfiles.map((profile) => ({ ...profile, Component: MvpToolPage }));

export const toolRegistry: ToolRegistry = {
  list: () => tools,
  get: (id) => tools.find((tool) => tool.meta.id === id),
};

export function availableTools(): readonly AnyToolDefinition[] {
  return tools.filter((tool) => tool.meta.availability === "available");
}
