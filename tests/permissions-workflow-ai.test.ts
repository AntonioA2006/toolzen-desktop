// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { describe, expect, it } from "vitest";
import { executeApprovedProposal } from "@/services/ai/approve";
import { buildToolCatalog, toolCallToIntentStep } from "@/services/ai/catalog";
import { approvalMatches, proposeWorkflowFromIntent } from "@/services/ai/planner";
import { AiProviderRegistry, UnavailableAiProvider } from "@/services/ai/provider";
import { ExecutionManager } from "@/services/execution/manager";
import { LocalExecutionProvider } from "@/services/execution/local-provider";
import { PermissionManager } from "@/services/permissions/manager";
import { normalizePath, scopeCovers } from "@/services/permissions/scope";
import { executeWorkflow } from "@/services/workflows/execute";
import { duplicateWorkflow, jsonThenBase64Template } from "@/services/workflows/template";
import type { WorkflowDefinition } from "@/services/workflows/types";
import { planWorkflow } from "@/services/workflows/plan";
import { registerLocalToolHandlers } from "@/tools/register-handlers";
import { toolRegistry } from "@/tools/registry";
import { jsonFormatterTool } from "@/tools/json-formatter/definition";

function stack() {
  const local = new LocalExecutionProvider();
  registerLocalToolHandlers(local);
  const permissions = new PermissionManager();
  const manager = new ExecutionManager(toolRegistry, local, permissions, null);
  return { local, permissions, manager };
}

describe("permissions", () => {
  it("denies filesystem deletion until a grant matches the path and operation", () => {
    const manager = new PermissionManager();
    const request = {
      kind: "filesystem.delete" as const,
      sensitivity: "sensitive" as const,
      reason: "Delete the selected file.",
      scope: { type: "filesystem" as const, path: "/tmp/project/file.txt", operations: ["delete" as const] },
    };
    expect(manager.decide(request).allowed).toBe(false);
    manager.grant({ kind: "filesystem.read", scope: { type: "filesystem", path: "/tmp/project", operations: ["read"] }, note: "Read the project." });
    expect(manager.decide(request).allowed).toBe(false);
    manager.grant({ kind: "filesystem.delete", scope: { type: "filesystem", path: "/tmp/project-other", operations: ["delete"] }, note: "Different directory." });
    expect(manager.decide(request).allowed).toBe(false);
    const grant = manager.grant({ kind: "filesystem.delete", scope: { type: "filesystem", path: "/tmp/project", operations: ["delete"] }, note: "Delete inside the selected project." });
    const allowed = manager.decide(request);
    expect(allowed.allowed).toBe(true);
    expect(allowed.grantId).toBe(grant.id);
    expect(manager.listAudit().some((event) => event.allowed === false)).toBe(true);
  });

  it("matches paths on a segment boundary and cloud destinations exactly", () => {
    expect(normalizePath("/tmp/project/../secret")).toBeNull();
    expect(scopeCovers({ type: "filesystem", path: "/tmp/data", operations: ["read"] }, { type: "filesystem", path: "/tmp/data-other", operations: ["read"] })).toBe(false);
    expect(scopeCovers({ type: "filesystem", path: "/tmp/data", operations: ["read"] }, { type: "filesystem", path: "/tmp/data/child", operations: ["read"] })).toBe(true);
    expect(scopeCovers({ type: "cloud-destination", providerId: "example", destination: "job-1" }, { type: "cloud-destination", providerId: "example", destination: "job-2" })).toBe(false);
  });
});

describe("workflows", () => {
  it("reuses registry tools through the execution manager", async () => {
    const { manager } = stack();
    let providerCalls = 0;
    const watched = new ExecutionManager(toolRegistry, new LocalExecutionProvider(), new PermissionManager(), null);
    const local = new LocalExecutionProvider();
    registerLocalToolHandlers(local);
    const original = local.execute.bind(local);
    local.execute = async (request, startedAt) => {
      providerCalls += 1;
      return original(request, startedAt);
    };
    const live = new ExecutionManager(toolRegistry, local, new PermissionManager(), null);
    const definition = jsonThenBase64Template("2026-11-07T00:00:00.000Z");
    const run = await executeWorkflow(definition, {
      manager: live,
      registry: toolRegistry,
      parameters: { source: '{"b":1,"a":2}' },
    });
    expect(providerCalls).toBe(2);
    expect(run.status).toBe("succeeded");
    expect(run.outputs.encoded).toBe(btoa('{\n  "b": 1,\n  "a": 2\n}'));
    expect(JSON.stringify(run.history)).not.toContain('"b": 1');
    expect(run.history.nodeResults.every((result) => !("output" in result))).toBe(true);
    expect(watched).not.toBe(manager);
  });

  it("rejects an unimplemented trigger and a cloud node does not run locally", async () => {
    const { manager } = stack();
    const template = jsonThenBase64Template("2026-11-07T00:00:00.000Z");
    const scheduled: WorkflowDefinition = {
      ...template,
      version: {
        ...template.version,
        nodes: template.version.nodes.map((node) => (node.id === "start" ? { ...node, config: { kind: "trigger", trigger: "scheduled" } } : node)),
      },
    };
    expect(planWorkflow(scheduled, toolRegistry).ok).toBe(false);

    const cloudNode: WorkflowDefinition = {
      ...template,
      version: {
        ...template.version,
        nodes: template.version.nodes.map((node) => (node.id === "format" ? { ...node, requirements: { ...node.requirements, mode: "cloud" } } : node)),
      },
    };
    const run = await executeWorkflow(cloudNode, { manager, registry: toolRegistry, parameters: { source: "{}" } });
    expect(run.status).toBe("failed");
    expect(run.history.errorCode).toBe("mode_unsupported");
    expect(run.history.nodeResults.find((result) => result.nodeId === "encode")?.status).not.toBe("succeeded");
  });

  it("follows only the matching conditional branch and can be duplicated", async () => {
    const local = new LocalExecutionProvider();
    const manager = new ExecutionManager(toolRegistry, local, new PermissionManager(), null);
    const definition: WorkflowDefinition = {
      metadata: { id: "branch", name: "Branch", description: "Conditional", createdAt: "2026-11-07T00:00:00.000Z", updatedAt: "2026-11-07T00:00:00.000Z", tags: [] },
      version: {
        version: 1,
        parameters: [{ id: "flag", name: "Flag", required: true, schema: { type: "boolean", description: "Flag" } }],
        execution: { defaultMode: "local" },
        errorPolicy: { maxAttempts: 1, retryOn: [], fallbackToCloud: false },
        outputMappings: [
          { id: "yes", nodeId: "yes", port: "value", name: "taken" },
          { id: "no", nodeId: "no", port: "value", name: "taken" },
        ],
        nodes: [
          { id: "start", kind: "trigger", name: "Start", inputs: [], outputs: [], requirements: { mode: "local", requiresInternet: false }, config: { kind: "trigger", trigger: "manual" } },
          { id: "check", kind: "conditional", name: "Check", inputs: [{ port: "value", source: { type: "workflow-parameter", parameterId: "flag" } }], outputs: [], requirements: { mode: "local", requiresInternet: false }, config: { kind: "conditional", operator: "truthy" } },
          { id: "yes", kind: "output", name: "Yes", inputs: [{ port: "value", source: { type: "literal", value: "yes" } }], outputs: [], requirements: { mode: "local", requiresInternet: false }, config: { kind: "output" } },
          { id: "no", kind: "output", name: "No", inputs: [{ port: "value", source: { type: "literal", value: "no" } }], outputs: [], requirements: { mode: "local", requiresInternet: false }, config: { kind: "output" } },
        ],
        connections: [
          { id: "c1", fromNodeId: "start", fromPort: "next", toNodeId: "check", toPort: "in" },
          { id: "c2", fromNodeId: "check", fromPort: "true", toNodeId: "yes", toPort: "in" },
          { id: "c3", fromNodeId: "check", fromPort: "false", toNodeId: "no", toPort: "in" },
        ],
      },
    };
    const run = await executeWorkflow(definition, { manager, registry: toolRegistry, parameters: { flag: false } });
    expect(run.outputs.taken).toBe("no");
    expect(run.history.nodeResults.find((result) => result.nodeId === "yes")?.status).toBe("skipped");
    const copy = duplicateWorkflow(definition, "branch-copy", "2026-11-07T00:00:01.000Z");
    expect(copy.metadata.id).toBe("branch-copy");
    expect(copy.version.version).toBe(1);
  });

  it("retries the same local mode and does not change providers", async () => {
    const local = new LocalExecutionProvider();
    let attempts = 0;
    local.register("json-formatter", () => {
      attempts += 1;
      if (attempts === 1) throw new Error("temporary");
      return { formatted: "{}", byteLength: 2 };
    });
    const manager = new ExecutionManager(toolRegistry, local, new PermissionManager(), null);
    const definition = jsonThenBase64Template("2026-11-07T00:00:00.000Z");
    definition.version.nodes[1]?.requirements && (definition.version.nodes[1].requirements.mode = "local");
    const retrying: WorkflowDefinition = {
      ...definition,
      version: {
        ...definition.version,
        errorPolicy: { maxAttempts: 2, retryOn: ["execution_failed"], fallbackToCloud: false },
        nodes: definition.version.nodes.filter((node) => node.id !== "encode" && node.id !== "output"),
        connections: definition.version.connections.filter((connection) => connection.toNodeId === "format"),
      },
    };
    const run = await executeWorkflow(retrying, { manager, registry: toolRegistry, parameters: { source: "{}" } });
    expect(attempts).toBe(2);
    expect(run.status).toBe("succeeded");
    expect(run.history.nodeResults.find((result) => result.nodeId === "format")?.attempts).toBe(2);
  });
});

describe("AI planning foundation", () => {
  it("does not call the network when an unavailable provider is asked to complete", async () => {
    let fetches = 0;
    const original = globalThis.fetch;
    globalThis.fetch = () => {
      fetches += 1;
      return Promise.reject(new Error("network disabled"));
    };
    try {
      const registry = new AiProviderRegistry();
      registry.register(new UnavailableAiProvider("example", "user-configured"));
      registry.register(new UnavailableAiProvider("hosted", "toolzen-hosted", "ToolZen hosted"));
      const result = await registry.get("example")?.complete({ modelId: "none", messages: [{ role: "user", text: "format json" }] });
      expect(result?.ok).toBe(false);
      expect(fetches).toBe(0);
      expect(registry.list()).toHaveLength(2);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("builds proposals from the registry schema and executes only after a matching approval", async () => {
    const { manager, permissions } = stack();
    const catalog = buildToolCatalog(toolRegistry);
    const json = catalog.find((entry) => entry.toolId === "json-formatter");
    expect(json?.parameters).toBe(jsonFormatterTool.contract.input);
    expect(toolCallToIntentStep({ id: "call", toolId: "missing", arguments: {} }, toolRegistry).ok).toBe(false);

    const proposed = await proposeWorkflowFromIntent(
      { label: "Format JSON", steps: [{ toolId: "json-formatter", literals: { source: '{"a":1}', indent: 2 } }] },
      toolRegistry,
      "2026-11-07T00:00:00.000Z",
    );
    expect(proposed.ok).toBe(true);
    if (!proposed.ok) return;
    expect(proposed.proposal.operations.map((operation) => operation.toolId)).toEqual(["json-formatter"]);
    const rejected = await executeApprovedProposal({
      proposal: proposed.proposal,
      approval: { planHash: "nope", statement: "Run this local workflow", accepted: [] },
      manager,
      permissions,
      registry: toolRegistry,
    });
    expect(rejected.ok).toBe(false);

    expect(approvalMatches(proposed.proposal, { planHash: proposed.proposal.planHash, statement: "short", accepted: proposed.proposal.operations.map((operation) => ({ nodeId: operation.nodeId, toolId: operation.toolId })) })).toBe(false);
    const approved = await executeApprovedProposal({
      proposal: proposed.proposal,
      approval: {
        planHash: proposed.proposal.planHash,
        statement: "Run this local workflow",
        accepted: proposed.proposal.operations.map((operation) => ({ nodeId: operation.nodeId, toolId: operation.toolId })),
      },
      manager,
      permissions,
      registry: toolRegistry,
    });
    expect(approved.ok).toBe(true);
    if (approved.ok) {
      expect(approved.explanation).toContain("json-formatter succeeded");
      expect(approved.run.status).toBe("succeeded");
    }
  });
});
