// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ToolRegistry } from "@/tools/types";
import type { WorkflowDefinition, WorkflowPlan } from "./types";
import { triggerIsImplemented, validateWorkflow } from "./validate";

export function planWorkflow(
  definition: WorkflowDefinition,
  registry: ToolRegistry,
): { ok: true; plan: WorkflowPlan } | { ok: false; code: string; message: string } {
  const structural = validateWorkflow(definition);
  if (!structural.ok) {
    return { ok: false, code: "invalid_workflow", message: structural.errors.map((error) => error.message).join(" ") };
  }
  if (!triggerIsImplemented(definition)) {
    return {
      ok: false,
      code: "trigger_not_implemented",
      message: "Only the manual trigger can start a workflow in this release. File, folder, schedule, and app-event triggers are not active.",
    };
  }

  for (const node of definition.version.nodes) {
    if (node.kind !== "processing") continue;
    if (!node.toolId) return { ok: false, code: "missing_tool", message: `Node ${node.name} does not reference a tool.` };
    const tool = registry.get(node.toolId);
    if (!tool) return { ok: false, code: "unknown_tool", message: `Node ${node.name} references an unknown tool.` };
    if (tool.meta.availability !== "available") {
      return { ok: false, code: "tool_unavailable", message: `${tool.meta.name} is not available and cannot be planned.` };
    }
  }

  return {
    ok: true,
    plan: {
      workflowId: definition.metadata.id,
      version: definition.version.version,
      definition,
      steps: definition.version.nodes.map((node) => ({
        nodeId: node.id,
        kind: node.kind,
        toolId: node.toolId ?? null,
        mode: node.requirements.mode,
        permissionRequirements: [],
      })),
    },
  };
}
