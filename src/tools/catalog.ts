// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { base64Tool } from "./base64/definition";
import { jsonFormatterTool } from "./json-formatter/definition";
import { unavailableTools } from "./unavailable";
import { uuidGeneratorTool } from "./uuid-generator/definition";
import type { ToolProfile } from "./types";

export const toolProfiles: readonly ToolProfile[] = [jsonFormatterTool, uuidGeneratorTool, base64Tool, ...unavailableTools];

export function findProfile(id: string): ToolProfile | undefined {
  return toolProfiles.find((tool) => tool.meta.id === id);
}
