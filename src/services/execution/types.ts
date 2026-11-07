// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export type ExecutionMode = "local" | "cloud" | "auto";

export type AutoResolution =
  | "local-no-cloud-provider"
  | "local-tool-is-local-only"
  | "local-cloud-consent-missing"
  | "cloud-selected";

export interface ExecutionCapabilities {
  supportedModes: readonly ExecutionMode[];
  requiresInternet: boolean;
  supportsCancellation: boolean;
  supportsProgress: boolean;
  requiresFileInput: boolean;
  inputFormats: readonly string[];
  outputFormats: readonly string[];
  maxInputBytes?: number;
  memoryRequirement: "low" | "moderate" | "high";
  cpuRequirement: "low" | "moderate" | "high";
  gpuRequirement: "none" | "optional" | "required";
  /** Declares that a future remote worker could run the tool. It does not enable cloud. */
  technicalRemoteSupport: boolean;
}

export type ExecutionOrigin =
  | { type: "tool-ui"; toolId: string }
  | { type: "workflow"; workflowId: string; nodeId: string }
  | { type: "ai-plan"; proposalId: string; workflowId: string; nodeId: string };

export interface ExecutionProgress {
  fraction?: number;
  message?: string;
  indeterminate?: boolean;
}

export interface ExecutionContext {
  signal?: AbortSignal;
  onProgress?: (progress: ExecutionProgress) => void;
  origin: ExecutionOrigin;
}

export interface ExecutionRequest<TInput = unknown> {
  toolId: string;
  input: TInput;
  mode: ExecutionMode;
  context: ExecutionContext;
}

export type ExecutionErrorCode =
  | "unknown_tool"
  | "tool_unavailable"
  | "validation_failed"
  | "mode_unsupported"
  | "cloud_unavailable"
  | "cloud_consent_required"
  | "permission_denied"
  | "capability_rejected"
  | "input_too_large"
  | "file_input_required"
  | "handler_missing"
  | "cancelled"
  | "execution_failed";

export interface ExecutionError {
  code: ExecutionErrorCode;
  message: string;
  recoverable: boolean;
  details?: readonly string[];
}

export type ExecutionOutcome<T> =
  | {
      ok: true;
      output: T;
      requestedMode: ExecutionMode;
      resolvedMode: "local" | "cloud";
      durationMs: number;
      autoResolution?: AutoResolution;
    }
  | {
      ok: false;
      error: ExecutionError;
      requestedMode: ExecutionMode;
      durationMs: number;
    };

export interface HandlerContext {
  signal?: AbortSignal;
  reportProgress: (progress: ExecutionProgress) => void;
}

export type LocalHandler = (input: unknown, context: HandlerContext) => Promise<unknown> | unknown;
