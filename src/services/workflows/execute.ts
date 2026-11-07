// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { createId, nowIso } from "@/lib/ids";
import type { ExecutionManager } from "@/services/execution/manager";
import type {
  WorkflowDefinition,
  WorkflowExecutionRecord,
  WorkflowNode,
  WorkflowNodeResultMeta,
  WorkflowProgress,
  WorkflowRunResult,
} from "./types";
import { planWorkflow } from "./plan";
import type { ToolRegistry } from "@/tools/types";

export interface WorkflowRunOptions {
  manager: ExecutionManager;
  registry: ToolRegistry;
  parameters?: Record<string, unknown>;
  signal?: AbortSignal;
  onProgress?: (progress: WorkflowProgress) => void;
  now?: () => string;
  proposalId?: string;
}

/**
 * Runs a validated plan. Processing nodes call ExecutionManager only.
 * This module does not import local or cloud providers.
 */
export async function executeWorkflow(definition: WorkflowDefinition, options: WorkflowRunOptions): Promise<WorkflowRunResult> {
  const startedAt = (options.now ?? nowIso)();
  const planned = planWorkflow(definition, options.registry);
  if (!planned.ok) {
    return finish(definition, startedAt, "failed", planned.code, planned.message, [], {}, options.now);
  }

  const memory = new Map<string, Record<string, unknown>>();
  const results: WorkflowNodeResultMeta[] = [];
  const outputs: Record<string, unknown> = {};
  const reachable = new Set<string>();
  const trigger = definition.version.nodes.find((node) => node.kind === "trigger");
  if (!trigger) return finish(definition, startedAt, "failed", "invalid_workflow", "Missing trigger.", results, outputs, options.now);

  const queue = [trigger.id];
  reachable.add(trigger.id);
  let completed = 0;
  const total = definition.version.nodes.length;

  while (queue.length > 0) {
    const nodeId = queue.shift();
    if (!nodeId) break;
    const node = definition.version.nodes.find((item) => item.id === nodeId);
    if (!node) continue;
    if (options.signal?.aborted) {
      results.push(meta(node, "cancelled", "cancelled", 0, null, 0));
      return finish(definition, startedAt, "cancelled", "cancelled", "Cancelled.", results, outputs, options.now);
    }

    options.onProgress?.({ nodeId: node.id, completed, total, message: node.name });
    const nodeStarted = performance.now();
    const step = await runNode(node, definition, memory, options);
    completed += 1;
    results.push(meta(node, step.status, step.errorCode, Math.round(performance.now() - nodeStarted), step.resolvedMode, step.attempts));
    if (step.status === "cancelled") {
      return finish(definition, startedAt, "cancelled", "cancelled", step.message ?? "Cancelled.", results, outputs, options.now);
    }
    if (step.status === "failed") {
      return finish(definition, startedAt, "failed", step.errorCode ?? "execution_failed", step.message ?? "The workflow failed.", results, outputs, options.now);
    }
    if (step.outputs) memory.set(node.id, step.outputs);
    if (node.kind === "output" && step.outputs && "value" in step.outputs) {
      const mapping = definition.version.outputMappings.find((item) => item.nodeId === node.id);
      outputs[mapping?.name ?? node.name] = step.outputs.value;
    }
    for (const next of nextNodes(definition, node, step.branch)) {
      if (!reachable.has(next)) {
        reachable.add(next);
        queue.push(next);
      }
    }
  }

  for (const node of definition.version.nodes) {
    if (!reachable.has(node.id)) results.push(meta(node, "skipped", null, 0, null, 0));
  }
  return finish(definition, startedAt, "succeeded", null, null, results, outputs, options.now);
}

interface NodeRun {
  status: "succeeded" | "failed" | "cancelled";
  errorCode: string | null;
  message?: string;
  resolvedMode: "local" | "cloud" | null;
  attempts: number;
  outputs?: Record<string, unknown>;
  branch?: string;
}

async function runNode(
  node: WorkflowNode,
  definition: WorkflowDefinition,
  memory: Map<string, Record<string, unknown>>,
  options: WorkflowRunOptions,
): Promise<NodeRun> {
  if (node.kind === "trigger" || node.kind === "utility") {
    return { status: "succeeded", errorCode: null, resolvedMode: null, attempts: 1, outputs: {} };
  }
  if (node.config.kind === "input") {
    const parameterId = node.config.parameterId;
    const value = options.parameters?.[parameterId];
    const parameter = definition.version.parameters.find((item) => item.id === parameterId);
    if (parameter?.required && (value === undefined || value === null || value === "")) {
      return failed("validation_failed", `Missing workflow parameter ${parameter.name}.`);
    }
    return { status: "succeeded", errorCode: null, resolvedMode: null, attempts: 1, outputs: { value } };
  }
  if (node.kind === "transformation") {
    if (node.config.kind !== "transformation") return failed("invalid_workflow", "Transformation node is misconfigured.");
    const input = resolvePort(node, "value", memory, options.parameters ?? {});
    if (!input.ok) return failed("validation_failed", input.message);
    if (!input.value || typeof input.value !== "object" || Array.isArray(input.value) || !(node.config.key in (input.value as object))) {
      return failed("validation_failed", `Cannot pick ${node.config.key}.`);
    }
    return {
      status: "succeeded",
      errorCode: null,
      resolvedMode: null,
      attempts: 1,
      outputs: { value: (input.value as Record<string, unknown>)[node.config.key] },
    };
  }
  if (node.kind === "conditional") {
    if (node.config.kind !== "conditional") return failed("invalid_workflow", "Conditional node is misconfigured.");
    const input = resolvePort(node, "value", memory, options.parameters ?? {});
    if (!input.ok) return failed("validation_failed", input.message);
    const branch = evaluate(node.config, input.value);
    return { status: "succeeded", errorCode: null, resolvedMode: null, attempts: 1, outputs: {}, branch };
  }
  if (node.kind === "output") {
    const input = resolvePort(node, "value", memory, options.parameters ?? {});
    if (!input.ok) return failed("validation_failed", input.message);
    return { status: "succeeded", errorCode: null, resolvedMode: null, attempts: 1, outputs: { value: input.value } };
  }

  if (!node.toolId) return failed("missing_tool", "Processing node has no tool.");
  const assembled = assembleInput(node, memory, options.parameters ?? {});
  if (!assembled.ok) return failed("validation_failed", assembled.message);

  const policy = definition.version.errorPolicy;
  let attempts = 0;
  let lastMessage = "The tool failed.";
  let lastCode = "execution_failed";
  while (attempts < policy.maxAttempts) {
    attempts += 1;
    if (options.signal?.aborted) return { status: "cancelled", errorCode: "cancelled", message: "Cancelled.", resolvedMode: null, attempts };
    const outcome = await options.manager.execute({
      toolId: node.toolId,
      input: assembled.value,
      mode: node.requirements.mode,
      context: {
        ...(options.signal ? { signal: options.signal } : {}),
        origin: options.proposalId
          ? { type: "ai-plan", proposalId: options.proposalId, workflowId: definition.metadata.id, nodeId: node.id }
          : { type: "workflow", workflowId: definition.metadata.id, nodeId: node.id },
      },
    });
    if (outcome.ok) {
      return { status: "succeeded", errorCode: null, resolvedMode: outcome.resolvedMode, attempts, outputs: asRecord(outcome.output) };
    }
    lastCode = outcome.error.code;
    lastMessage = outcome.error.message;
    if (outcome.error.code === "cancelled") {
      return { status: "cancelled", errorCode: "cancelled", message: outcome.error.message, resolvedMode: null, attempts };
    }
    if (!policy.retryOn.includes(outcome.error.code)) break;
  }
  return failed(lastCode, lastMessage, attempts);
}

function assembleInput(
  node: WorkflowNode,
  memory: Map<string, Record<string, unknown>>,
  parameters: Record<string, unknown>,
): { ok: true; value: Record<string, unknown> } | { ok: false; message: string } {
  const value: Record<string, unknown> = {};
  for (const binding of node.inputs) {
    const resolved = resolveBinding(binding, memory, parameters);
    if (!resolved.ok) return resolved;
    value[binding.port] = resolved.value;
  }
  return { ok: true, value };
}

function resolvePort(
  node: WorkflowNode,
  port: string,
  memory: Map<string, Record<string, unknown>>,
  parameters: Record<string, unknown>,
): { ok: true; value: unknown } | { ok: false; message: string } {
  const binding = node.inputs.find((item) => item.port === port);
  if (!binding) return { ok: false, message: `Node ${node.name} is missing input ${port}.` };
  return resolveBinding(binding, memory, parameters);
}

function resolveBinding(
  binding: WorkflowNode["inputs"][number],
  memory: Map<string, Record<string, unknown>>,
  parameters: Record<string, unknown>,
): { ok: true; value: unknown } | { ok: false; message: string } {
  if (binding.source.type === "literal") return { ok: true, value: binding.source.value };
  if (binding.source.type === "workflow-parameter") {
    return { ok: true, value: parameters[binding.source.parameterId] };
  }
  const produced = memory.get(binding.source.nodeId);
  if (!produced || !(binding.source.port in produced)) {
    return { ok: false, message: `Input ${binding.port} is not available from ${binding.source.nodeId}.` };
  }
  return { ok: true, value: produced[binding.source.port] };
}

function evaluate(config: Extract<WorkflowNode["config"], { kind: "conditional" }>, value: unknown): "true" | "false" {
  if (config.operator === "truthy") return value ? "true" : "false";
  if (config.operator === "falsy") return value ? "false" : "true";
  return value === config.compareTo ? "true" : "false";
}

function nextNodes(definition: WorkflowDefinition, node: WorkflowNode, branch: string | undefined): string[] {
  return definition.version.connections
    .filter((connection) => connection.fromNodeId === node.id)
    .filter((connection) => (node.kind === "conditional" ? connection.fromPort === branch : true))
    .map((connection) => connection.toNodeId);
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) return value as Record<string, unknown>;
  return { value };
}

function failed(errorCode: string, message: string, attempts = 1): NodeRun {
  return { status: "failed", errorCode, message, resolvedMode: null, attempts };
}

function meta(
  node: WorkflowNode,
  status: WorkflowNodeResultMeta["status"],
  errorCode: string | null,
  durationMs: number,
  resolvedMode: "local" | "cloud" | null,
  attempts: number,
): WorkflowNodeResultMeta {
  return { nodeId: node.id, kind: node.kind, toolId: node.toolId ?? null, status, errorCode, durationMs, resolvedMode, attempts };
}

function finish(
  definition: WorkflowDefinition,
  startedAt: string,
  status: WorkflowRunResult["status"],
  errorCode: string | null,
  errorMessage: string | null,
  nodeResults: WorkflowNodeResultMeta[],
  outputs: Record<string, unknown>,
  now?: () => string,
): WorkflowRunResult {
  const history: WorkflowExecutionRecord = {
    id: createId("run"),
    workflowId: definition.metadata.id,
    version: definition.version.version,
    startedAt,
    finishedAt: (now ?? nowIso)(),
    status,
    nodeResults,
    errorCode,
  };
  return { status, outputs, history, errorMessage };
}
