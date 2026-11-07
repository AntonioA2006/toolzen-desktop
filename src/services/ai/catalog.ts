// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ToolRegistry } from "@/tools/types";
import type { AiToolCall, AiToolCatalogEntry, IntentStep } from "./types";

/** Context for planning. Built only from the tool registry, not from files or history payloads. */
export function buildToolCatalog(registry: ToolRegistry): AiToolCatalogEntry[] {
  return registry.list().map((tool) => ({
    toolId: tool.meta.id,
    name: tool.meta.name,
    purpose: tool.contract.purpose,
    availability: tool.meta.availability,
    parameters: tool.contract.input,
    output: tool.contract.output,
    permissions: tool.contract.permissions,
    requirements: {
      supportedModes: tool.capabilities.supportedModes,
      requiresInternet: tool.capabilities.requiresInternet,
      requiresFileInput: tool.capabilities.requiresFileInput,
      technicalRemoteSupport: tool.capabilities.technicalRemoteSupport,
      maxInputBytes: tool.capabilities.maxInputBytes ?? null,
    },
  }));
}

export function toolCallToIntentStep(
  call: AiToolCall,
  registry: ToolRegistry,
): { ok: true; step: IntentStep } | { ok: false; message: string } {
  const tool = registry.get(call.toolId);
  if (!tool) return { ok: false, message: `Tool ${call.toolId} is not in the registry.` };
  if (tool.meta.availability !== "available") return { ok: false, message: `${tool.meta.name} cannot be called.` };
  if (!call.arguments || typeof call.arguments !== "object" || Array.isArray(call.arguments)) {
    return { ok: false, message: "Tool call arguments must be an object." };
  }
  return { ok: true, step: { toolId: call.toolId, literals: call.arguments as Record<string, unknown> } };
}
