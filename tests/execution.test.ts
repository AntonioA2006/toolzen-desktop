// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { describe, expect, it } from "vitest";
import { ExecutionManager } from "@/services/execution/manager";
import { CloudExecutionProvider } from "@/services/execution/cloud-contract";
import { LocalExecutionProvider } from "@/services/execution/local-provider";
import { registerNativeLocalHandler } from "@/services/execution/native-adapter";
import type { ExecutionCapabilities, ExecutionOutcome, ExecutionRequest } from "@/services/execution/types";
import { PermissionManager } from "@/services/permissions/manager";
import { localTextCapabilities, type AnyToolDefinition, type ToolRegistry } from "@/tools/types";
import { registerLocalToolHandlers } from "@/tools/register-handlers";
import { toolRegistry } from "@/tools/registry";

class SpyCloud extends CloudExecutionProvider {
  readonly id = "spy-cloud";
  calls = 0;
  isAvailable(): boolean {
    return true;
  }
  supports(): boolean {
    return true;
  }
  execute(request: ExecutionRequest<unknown>): Promise<ExecutionOutcome<unknown>> {
    this.calls += 1;
    return Promise.resolve({
      ok: false,
      requestedMode: request.mode,
      durationMs: 1,
      error: { code: "execution_failed", message: "Spy cloud was invoked.", recoverable: true },
    });
  }
}

function registry(tools: AnyToolDefinition[]): ToolRegistry {
  return { list: () => tools, get: (id) => tools.find((tool) => tool.meta.id === id) };
}

function makeTool(overrides: Partial<AnyToolDefinition> & { id?: string; capabilities?: ExecutionCapabilities } = {}): AnyToolDefinition {
  const id = overrides.meta?.id ?? overrides.id ?? "sample";
  const base = localTextCapabilities("text/plain", "text/plain");
  return {
    meta: {
      id,
      name: "Sample",
      description: "Sample tool",
      category: "text",
      icon: "type",
      tags: [],
      availability: "available",
      processingMode: "local",
      formats: { input: ["text/plain"], output: ["text/plain"] },
      ...overrides.meta,
    },
    contract: {
      purpose: "Test tool",
      input: { type: "object", description: "input", additionalProperties: false, fields: [] },
      output: { type: "object", description: "output", additionalProperties: false, fields: [] },
      permissions: [],
      ...overrides.contract,
    },
    capabilities: { ...base, ...overrides.capabilities },
    validate: overrides.validate ?? ((input) => ({ ok: true, value: input })),
    derivePermissionRequests: overrides.derivePermissionRequests ?? (() => [{ kind: "tool.execute", sensitivity: "harmless", reason: "memory", scope: { type: "tool-input", toolId: id, inputBytes: 1 } }]),
    Component: () => null,
  };
}

function request(toolId: string, mode: ExecutionRequest["mode"], input: unknown = { value: 1 }, origin: ExecutionRequest["context"]["origin"] = { type: "tool-ui", toolId }): ExecutionRequest {
  return { toolId, input, mode, context: { origin } };
}

describe("execution manager", () => {
  it("runs a local handler and resolves automatic mode locally when no cloud provider exists", async () => {
    const local = new LocalExecutionProvider();
    local.register("sample", () => ({ value: "done" }));
    const manager = new ExecutionManager(registry([makeTool()]), local, new PermissionManager(), null);
    const outcome = await manager.execute({ ...request("sample", "auto") });
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      expect(outcome.resolvedMode).toBe("local");
      expect(outcome.autoResolution).toBe("local-tool-is-local-only");
      expect(outcome.output).toEqual({ value: "done" });
    }
  });

  it("does not fall back to cloud when local execution fails", async () => {
    const local = new LocalExecutionProvider();
    local.register("remoteable", () => {
      throw new Error("local failed");
    });
    const cloud = new SpyCloud();
    const tool = makeTool({
      id: "remoteable",
      capabilities: { ...localTextCapabilities("text/plain", "text/plain"), supportedModes: ["local", "cloud", "auto"], technicalRemoteSupport: true },
    });
    const manager = new ExecutionManager(registry([tool]), local, new PermissionManager(), cloud);
    const outcome = await manager.execute(request("remoteable", "local"));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.code).toBe("execution_failed");
    expect(cloud.calls).toBe(0);
  });

  it("rejects cloud mode without a provider and does not run the local handler", async () => {
    const local = new LocalExecutionProvider();
    let calls = 0;
    local.register("remoteable", () => {
      calls += 1;
      return { value: "local" };
    });
    const tool = makeTool({
      id: "remoteable",
      capabilities: { ...localTextCapabilities("text/plain", "text/plain"), supportedModes: ["local", "cloud", "auto"], technicalRemoteSupport: true },
    });
    const manager = new ExecutionManager(registry([tool]), local, new PermissionManager(), null);
    const outcome = await manager.execute(request("remoteable", "cloud"));
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.code).toBe("cloud_unavailable");
    expect(calls).toBe(0);
  });

  it("requires a destination grant before cloud mode and keeps automatic on local without consent", async () => {
    const local = new LocalExecutionProvider();
    local.register("remoteable", () => ({ value: "local" }));
    const cloud = new SpyCloud();
    const permissions = new PermissionManager();
    const tool = makeTool({
      id: "remoteable",
      capabilities: { ...localTextCapabilities("text/plain", "text/plain"), supportedModes: ["local", "cloud", "auto"], technicalRemoteSupport: true },
    });
    const manager = new ExecutionManager(registry([tool]), local, permissions, cloud);
    const denied = await manager.execute(request("remoteable", "cloud"));
    expect(denied.ok).toBe(false);
    if (!denied.ok) expect(denied.error.code).toBe("cloud_consent_required");
    expect(cloud.calls).toBe(0);

    const automatic = await manager.execute(request("remoteable", "auto"));
    expect(automatic.ok).toBe(true);
    if (automatic.ok) expect(automatic.autoResolution).toBe("local-cloud-consent-missing");
    expect(cloud.calls).toBe(0);

    permissions.grant({
      kind: "cloud.upload",
      scope: { type: "cloud-destination", providerId: "spy-cloud", destination: "tool:remoteable" },
      note: "Upload this tool input to spy-cloud.",
    });
    const selected = await manager.execute(request("remoteable", "auto"));
    expect(selected.ok).toBe(false);
    expect(cloud.calls).toBe(1);
  });

  it("rejects oversized input, missing files, unavailable tools, and unknown tools", async () => {
    const local = new LocalExecutionProvider();
    const big = makeTool({ id: "big", capabilities: { ...localTextCapabilities("text/plain", "text/plain"), maxInputBytes: 4 } });
    const file = makeTool({ id: "file", capabilities: { ...localTextCapabilities("text/plain", "text/plain"), requiresFileInput: true } });
    const unavailable = makeTool({ meta: { id: "later", name: "Later", description: "", category: "pdf", icon: "file-text", tags: [], availability: "unavailable", unavailableReason: "Not implemented.", processingMode: "local", formats: { input: [], output: [] } } });
    const manager = new ExecutionManager(registry([big, file, unavailable]), local, new PermissionManager(), null);
    expect((await manager.execute(request("missing", "local"))).ok).toBe(false);
    const tooBig = await manager.execute(request("big", "local", { source: "0123456789" }));
    expect(tooBig.ok).toBe(false);
    if (!tooBig.ok) expect(tooBig.error.code).toBe("input_too_large");
    const needsFile = await manager.execute(request("file", "local", { text: "no file" }));
    expect(needsFile.ok).toBe(false);
    if (!needsFile.ok) expect(needsFile.error.code).toBe("file_input_required");
    const blocked = await manager.execute(request("later", "local"));
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("tool_unavailable");
  });

  it("cancels when the signal is already aborted", async () => {
    const local = new LocalExecutionProvider();
    let calls = 0;
    local.register("sample", () => {
      calls += 1;
      return { value: 1 };
    });
    const manager = new ExecutionManager(registry([makeTool()]), local, new PermissionManager(), null);
    const controller = new AbortController();
    controller.abort();
    const outcome = await manager.execute({ ...request("sample", "local"), context: { origin: { type: "tool-ui", toolId: "sample" }, signal: controller.signal } });
    expect(outcome.ok).toBe(false);
    if (!outcome.ok) expect(outcome.error.code).toBe("cancelled");
    expect(calls).toBe(0);
  });

  it("runs the real JSON formatter through the registered local handler", async () => {
    const local = new LocalExecutionProvider();
    registerLocalToolHandlers(local);
    const manager = new ExecutionManager(toolRegistry, local, new PermissionManager(), null);
    const outcome = await manager.execute(request("json-formatter", "local", { source: '{"z":true}', indent: 2 }));
    expect(outcome.ok).toBe(true);
    if (outcome.ok) {
      const output = outcome.output as { formatted: string; byteLength: number };
      expect(output.formatted).toBe('{\n  "z": true\n}');
      expect(output.byteLength).toBe(new TextEncoder().encode(output.formatted).byteLength);
    }
  });

  it("registers a native adapter without changing the tool definition", async () => {
    const local = new LocalExecutionProvider();
    const calls: string[] = [];
    registerNativeLocalHandler(local, {
      toolId: "sample",
      command: "execute_sample",
      invoke: async (command, args) => {
        calls.push(command);
        return { echoed: args.toolId };
      },
    });
    const manager = new ExecutionManager(registry([makeTool()]), local, new PermissionManager(), null);
    const outcome = await manager.execute(request("sample", "local"));
    expect(calls).toEqual(["execute_sample"]);
    expect(outcome.ok).toBe(true);
  });
});
