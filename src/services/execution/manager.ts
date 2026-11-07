// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { PermissionManager } from "@/services/permissions/manager";
import type { PermissionRequest } from "@/services/permissions/types";
import type { AnyToolDefinition, ToolRegistry } from "@/tools/types";
import { CloudExecutionProvider } from "./cloud-contract";
import { LocalExecutionProvider } from "./local-provider";
import type {
  AutoResolution,
  ExecutionMode,
  ExecutionOutcome,
  ExecutionRequest,
} from "./types";

export class ExecutionManager {
  constructor(
    private readonly registry: ToolRegistry,
    private readonly local: LocalExecutionProvider,
    private readonly permissions: PermissionManager,
    private readonly cloud: CloudExecutionProvider | null = null,
  ) {}

  async execute<TOutput>(request: ExecutionRequest<unknown>): Promise<ExecutionOutcome<TOutput>> {
    const startedAt = performance.now();
    const tool = this.registry.get(request.toolId);
    if (!tool) return fail(request.mode, startedAt, "unknown_tool", "That tool is not in the registry.", false);
    if (tool.meta.availability !== "available") {
      return fail(
        request.mode,
        startedAt,
        "tool_unavailable",
        tool.meta.unavailableReason ?? "This tool is not available and was not executed.",
        false,
      );
    }

    const validated = tool.validate(request.input);
    if (!validated.ok) {
      return fail(request.mode, startedAt, "validation_failed", validated.errors.map((error) => error.message).join(" "), true, validated.errors.map((error) => `${error.field}: ${error.message}`));
    }

    const byteLength = new TextEncoder().encode(JSON.stringify(validated.value)).byteLength;
    if (tool.capabilities.maxInputBytes !== undefined && byteLength > tool.capabilities.maxInputBytes) {
      return fail(request.mode, startedAt, "input_too_large", "The input is larger than this tool accepts.", true);
    }
    if (tool.capabilities.requiresFileInput && !hasSelectedFile(validated.value)) {
      return fail(request.mode, startedAt, "file_input_required", "This tool requires a file you select. No file was selected.", true);
    }

    const resolution = this.resolveMode(request.mode, tool);
    if (!resolution.ok) return fail(request.mode, startedAt, resolution.code, resolution.message, resolution.recoverable);

    const permissionRequests = this.permissionRequests(tool, validated.value, request, resolution.resolved);
    const decision = this.permissions.decideAll(permissionRequests);
    if (!decision.allowed) {
      return fail(request.mode, startedAt, "permission_denied", decision.reason, true);
    }

    if (resolution.resolved === "cloud") {
      if (!this.cloud) {
        return fail(request.mode, startedAt, "cloud_unavailable", "Cloud execution is not available in this release.", false);
      }
      const outcome = await this.cloud.execute({ ...request, input: validated.value });
      return stamp(outcome, request.mode, resolution.autoResolution) as ExecutionOutcome<TOutput>;
    }

    const outcome = await this.local.execute({ ...request, input: validated.value }, startedAt);
    if (!outcome.ok) return outcome as ExecutionOutcome<TOutput>;
    const success: ExecutionOutcome<TOutput> = {
      ok: true,
      output: outcome.output as TOutput,
      requestedMode: request.mode,
      resolvedMode: "local",
      durationMs: outcome.durationMs,
      ...(resolution.autoResolution ? { autoResolution: resolution.autoResolution } : {}),
    };
    return success;
  }

  private resolveMode(
    mode: ExecutionMode,
    tool: AnyToolDefinition,
  ):
    | { ok: true; resolved: "local" | "cloud"; autoResolution?: AutoResolution }
    | { ok: false; code: "cloud_unavailable" | "cloud_consent_required" | "mode_unsupported"; message: string; recoverable: boolean } {
    const supportsLocal = tool.capabilities.supportedModes.includes("local") || tool.capabilities.supportedModes.includes("auto");
    const supportsCloud = tool.capabilities.technicalRemoteSupport && tool.capabilities.supportedModes.includes("cloud");
    const cloudReady = this.cloud?.isAvailable() === true && this.cloud.supports(tool.capabilities);
    const consented = cloudReady && this.cloud ? this.permissions.hasActiveGrant(cloudConsent(this.cloud.id, tool.meta.id)) : false;

    if (mode === "local") {
      if (!supportsLocal) {
        return { ok: false, code: "mode_unsupported", message: "This tool does not support local execution.", recoverable: false };
      }
      return { ok: true, resolved: "local" };
    }

    if (mode === "cloud") {
      if (!supportsCloud) {
        return { ok: false, code: "mode_unsupported", message: "This tool does not declare remote execution support.", recoverable: false };
      }
      if (!cloudReady) {
        return {
          ok: false,
          code: "cloud_unavailable",
          message: "Cloud execution is not available. The local tool was not run as a fallback.",
          recoverable: false,
        };
      }
      if (!consented) {
        return {
          ok: false,
          code: "cloud_consent_required",
          message: "Cloud execution needs an explicit grant for this tool and provider. Local execution was not used as a fallback.",
          recoverable: true,
        };
      }
      return { ok: true, resolved: "cloud" };
    }

    if (!supportsLocal) {
      return { ok: false, code: "mode_unsupported", message: "Automatic mode cannot run this tool locally.", recoverable: false };
    }
    if (supportsCloud && cloudReady && consented) {
      return { ok: true, resolved: "cloud", autoResolution: "cloud-selected" };
    }
    let autoResolution: AutoResolution = "local-no-cloud-provider";
    if (!supportsCloud) autoResolution = "local-tool-is-local-only";
    else if (cloudReady && !consented) autoResolution = "local-cloud-consent-missing";
    return { ok: true, resolved: "local", autoResolution };
  }

  private permissionRequests(
    tool: AnyToolDefinition,
    input: unknown,
    request: ExecutionRequest<unknown>,
    resolved: "local" | "cloud",
  ): PermissionRequest[] {
    const derived = [...tool.derivePermissionRequests(input)];
    if (request.context.origin.type === "workflow") {
      const sensitive = derived.some((item) => item.sensitivity === "sensitive");
      derived.push({
        kind: "workflow.execute",
        sensitivity: sensitive ? "sensitive" : "harmless",
        reason: "A workflow node is running a registered tool.",
        scope: {
          type: "workflow",
          workflowId: request.context.origin.workflowId,
          nodeIds: [request.context.origin.nodeId],
        },
      });
    }
    if (request.context.origin.type === "ai-plan") {
      derived.push({
        kind: "ai.execute-tool",
        sensitivity: "sensitive",
        reason: "An approved AI plan is running a registered tool.",
        scope: {
          type: "ai-tool",
          toolId: tool.meta.id,
          proposalId: request.context.origin.proposalId,
        },
      });
    }
    if (resolved === "cloud" && this.cloud) derived.push(cloudConsent(this.cloud.id, tool.meta.id));
    return derived;
  }
}

function cloudConsent(providerId: string, toolId: string): PermissionRequest {
  return {
    kind: "cloud.upload",
    sensitivity: "sensitive",
    reason: "Cloud execution would send this tool input to a remote destination.",
    scope: { type: "cloud-destination", providerId, destination: `tool:${toolId}` },
  };
}

function hasSelectedFile(input: unknown): boolean {
  if (!input || typeof input !== "object") return false;
  const file = (input as { file?: unknown }).file;
  return !!file && typeof file === "object" && "name" in file && typeof (file as { name?: unknown }).name === "string";
}

function fail<T>(
  requestedMode: ExecutionMode,
  startedAt: number,
  code: Extract<ExecutionOutcome<T>, { ok: false }>["error"]["code"],
  message: string,
  recoverable: boolean,
  details?: readonly string[],
): ExecutionOutcome<T> {
  return {
    ok: false,
    requestedMode,
    durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
    error: { code, message, recoverable, ...(details ? { details } : {}) },
  };
}

function stamp<T>(outcome: ExecutionOutcome<T>, requestedMode: ExecutionMode, autoResolution?: AutoResolution): ExecutionOutcome<T> {
  if (!outcome.ok) return { ...outcome, requestedMode };
  return {
    ...outcome,
    requestedMode,
    ...(autoResolution ? { autoResolution } : {}),
  };
}
