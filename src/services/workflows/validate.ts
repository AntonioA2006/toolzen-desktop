// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { FieldError } from "@/services/schema/field-schema";
import { FUTURE_TRIGGERS, IMPLEMENTED_TRIGGERS, type WorkflowDefinition } from "./types";

const ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;

export function validateWorkflow(definition: WorkflowDefinition): { ok: true } | { ok: false; errors: FieldError[] } {
  const errors: FieldError[] = [];
  if (!ID_PATTERN.test(definition.metadata.id)) errors.push({ field: "metadata.id", message: "Use a lowercase workflow id." });
  if (definition.metadata.name.trim().length === 0) errors.push({ field: "metadata.name", message: "Name the workflow." });
  if (!Number.isInteger(definition.version.version) || definition.version.version < 1) {
    errors.push({ field: "version.version", message: "Version must be a positive integer." });
  }
  if (definition.version.errorPolicy.fallbackToCloud !== false) {
    errors.push({ field: "version.errorPolicy.fallbackToCloud", message: "Workflows cannot fall back from local failure to cloud." });
  }
  if (definition.version.errorPolicy.maxAttempts < 1 || definition.version.errorPolicy.maxAttempts > 5) {
    errors.push({ field: "version.errorPolicy.maxAttempts", message: "Use 1 to 5 attempts." });
  }
  if (definition.version.nodes.length === 0 || definition.version.nodes.length > 50) {
    errors.push({ field: "version.nodes", message: "A workflow needs between 1 and 50 nodes." });
  }

  const ids = new Set<string>();
  for (const node of definition.version.nodes) {
    if (ids.has(node.id)) errors.push({ field: `nodes.${node.id}`, message: "Duplicate node id." });
    ids.add(node.id);
    if (node.kind !== node.config.kind) {
      errors.push({ field: `nodes.${node.id}.config`, message: "Node kind and config kind must match." });
    }
  }

  const triggers = definition.version.nodes.filter((node) => node.kind === "trigger");
  if (triggers.length !== 1) errors.push({ field: "nodes", message: "A workflow needs exactly one trigger." });
  for (const trigger of triggers) {
    if (trigger.config.kind !== "trigger") continue;
    const known = [...IMPLEMENTED_TRIGGERS, ...FUTURE_TRIGGERS];
    if (!known.includes(trigger.config.trigger)) {
      errors.push({ field: `nodes.${trigger.id}.config.trigger`, message: "Unknown trigger." });
    }
  }

  const nodeById = new Map(definition.version.nodes.map((node) => [node.id, node]));
  for (const connection of definition.version.connections) {
    if (!nodeById.has(connection.fromNodeId) || !nodeById.has(connection.toNodeId)) {
      errors.push({ field: `connections.${connection.id}`, message: "Connection references a missing node." });
    }
  }

  if (hasCycle(definition)) errors.push({ field: "connections", message: "Workflow connections contain a cycle." });
  return errors.length > 0 ? { ok: false, errors } : { ok: true };
}

export function triggerIsImplemented(definition: WorkflowDefinition): boolean {
  const trigger = definition.version.nodes.find((node) => node.kind === "trigger");
  return trigger?.config.kind === "trigger" && trigger.config.trigger === "manual";
}

function hasCycle(definition: WorkflowDefinition): boolean {
  const outgoing = new Map<string, string[]>();
  for (const node of definition.version.nodes) outgoing.set(node.id, []);
  for (const connection of definition.version.connections) {
    outgoing.get(connection.fromNodeId)?.push(connection.toNodeId);
  }
  const visiting = new Set<string>();
  const visited = new Set<string>();
  const walk = (id: string): boolean => {
    if (visiting.has(id)) return true;
    if (visited.has(id)) return false;
    visiting.add(id);
    for (const next of outgoing.get(id) ?? []) {
      if (walk(next)) return true;
    }
    visiting.delete(id);
    visited.add(id);
    return false;
  };
  return definition.version.nodes.some((node) => walk(node.id));
}
