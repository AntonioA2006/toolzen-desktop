// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { canonicalJson, createId, sha256Hex } from "@/lib/ids";
import type { FieldSchema } from "@/services/schema/field-schema";
import type { ToolRegistry } from "@/tools/types";
import type { WorkflowDefinition } from "@/services/workflows/types";
import type { PlanApproval, PlannedOperation, StructuredIntent, WorkflowProposal } from "./types";

/**
 * Compiles a structured intent into a workflow proposal using the tool registry.
 * It does not call an AI provider, infer free text, or execute tools.
 */
export async function proposeWorkflowFromIntent(
  intent: StructuredIntent,
  registry: ToolRegistry,
  now: string,
): Promise<{ ok: true; proposal: WorkflowProposal } | { ok: false; message: string }> {
  if (intent.label.trim().length === 0) return { ok: false, message: "Name the intent." };
  if (intent.steps.length === 0) return { ok: false, message: "The intent has no tools." };

  const operations: PlannedOperation[] = [];
  const nodes: WorkflowDefinition["version"]["nodes"][number][] = [
    {
      id: "start",
      kind: "trigger",
      name: "Manual start",
      inputs: [],
      outputs: [],
      requirements: { mode: "local", requiresInternet: false },
      config: { kind: "trigger", trigger: "manual" },
    },
  ];
  const connections: WorkflowDefinition["version"]["connections"][number][] = [];
  let previous = "start";

  for (let index = 0; index < intent.steps.length; index += 1) {
    const step = intent.steps[index];
    if (!step) return { ok: false, message: "Missing step." };
    const tool = registry.get(step.toolId);
    if (!tool || tool.meta.availability !== "available") {
      return { ok: false, message: `Cannot plan unavailable tool ${step.toolId}.` };
    }
    const nodeId = `step-${index + 1}`;
    const mode = tool.capabilities.supportedModes.includes("local") ? "local" : "auto";
    nodes.push({
      id: nodeId,
      kind: "processing",
      name: tool.meta.name,
      toolId: tool.meta.id,
      inputs: [
        ...Object.entries(step.literals ?? {}).map(([port, value]) => ({
          port,
          source: { type: "literal" as const, value },
        })),
        ...Object.entries(step.bindings ?? {}).map(([port, binding]) => ({
          port,
          source: { type: "node-output" as const, nodeId: binding.nodeId, port: binding.port },
        })),
      ],
      outputs: outputPorts(tool.contract.output),
      requirements: { mode, requiresInternet: tool.capabilities.requiresInternet },
      config: { kind: "processing" },
    });
    connections.push({ id: `link-${index + 1}`, fromNodeId: previous, fromPort: "next", toNodeId: nodeId, toPort: "in" });
    operations.push({
      nodeId,
      toolId: tool.meta.id,
      toolName: tool.meta.name,
      mode,
      summary: `${tool.meta.name} would run locally. ${tool.contract.purpose}`,
    });
    previous = nodeId;
  }

  const definition: WorkflowDefinition = {
    metadata: {
      id: `proposal-${createId("wf").slice(-8)}`,
      name: intent.label,
      description: "Proposed from a structured intent. It has not been executed.",
      createdAt: now,
      updatedAt: now,
      tags: ["proposal"],
    },
    version: {
      version: 1,
      nodes,
      connections,
      parameters: [],
      outputMappings: [],
      execution: { defaultMode: "local" },
      errorPolicy: { maxAttempts: 1, retryOn: [], fallbackToCloud: false },
    },
  };

  const planHash = await sha256Hex(
    canonicalJson({
      label: intent.label,
      operations: operations.map((operation) => ({
        nodeId: operation.nodeId,
        toolId: operation.toolId,
        mode: operation.mode,
      })),
    }),
  );

  const summary = operations.map((operation) => operation.summary).join(" ");
  return {
    ok: true,
    proposal: { id: createId("proposal"), planHash, definition, operations, summary },
  };
}

export function approvalMatches(proposal: WorkflowProposal, approval: PlanApproval): boolean {
  if (approval.planHash !== proposal.planHash) return false;
  if (approval.statement.trim().length < 8) return false;
  const proposed = proposal.operations.map((operation) => `${operation.nodeId}:${operation.toolId}`).sort();
  const accepted = approval.accepted.map((item) => `${item.nodeId}:${item.toolId}`).sort();
  return proposed.length === accepted.length && proposed.every((value, index) => value === accepted[index]);
}

function outputPorts(schema: FieldSchema): WorkflowDefinition["version"]["nodes"][number]["outputs"] {
  if (schema.type !== "object") return [{ id: "value", schema }];
  return schema.fields.map((field) => ({ id: field.name, schema: field.schema }));
}
