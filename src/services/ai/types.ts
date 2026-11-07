// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { FieldSchema } from "@/services/schema/field-schema";
import type { PermissionRequirement } from "@/services/permissions/types";
import type { ExecutionMode } from "@/services/execution/types";
import type { WorkflowDefinition } from "@/services/workflows/types";

export type AiProviderKind = "local-model" | "user-configured" | "toolzen-hosted";

export interface AiModelDescriptor {
  id: string;
  providerId: string;
  displayName: string;
  capabilities: readonly ("chat" | "tool-calling" | "workflow-planning")[];
}

export interface AiMessageDraft {
  role: "user" | "assistant" | "system" | "tool";
  text: string;
}

export interface AiCompletionRequest {
  modelId: string;
  messages: readonly AiMessageDraft[];
}

export type AiCompletionResult =
  | { ok: true; text: string; modelId: string }
  | { ok: false; error: { code: "ai_provider_unavailable" | "ai_provider_missing"; message: string } };

/**
 * Vendor-neutral provider contract.
 * Implementing complete() is a future integration. This release does not call it from the product.
 */
export interface AiProvider {
  readonly id: string;
  readonly kind: AiProviderKind;
  readonly displayName: string;
  isOperational(): boolean;
  listModels(): readonly AiModelDescriptor[];
  complete(request: AiCompletionRequest): Promise<AiCompletionResult>;
}

export interface AiToolCatalogEntry {
  toolId: string;
  name: string;
  purpose: string;
  availability: "available" | "unavailable";
  parameters: FieldSchema;
  output: FieldSchema;
  permissions: readonly PermissionRequirement[];
  requirements: {
    supportedModes: readonly ExecutionMode[];
    requiresInternet: boolean;
    requiresFileInput: boolean;
    technicalRemoteSupport: boolean;
    maxInputBytes: number | null;
  };
}

export interface AiToolCall {
  id: string;
  toolId: string;
  arguments: unknown;
}

export interface IntentStep {
  toolId: string;
  literals?: Record<string, unknown>;
  bindings?: Record<string, { nodeId: string; port: string }>;
}

/** Structured intent compiled locally. It is not sent to a model. */
export interface StructuredIntent {
  label: string;
  steps: readonly IntentStep[];
}

export interface PlannedOperation {
  nodeId: string;
  toolId: string;
  toolName: string;
  mode: ExecutionMode;
  summary: string;
}

export interface WorkflowProposal {
  id: string;
  planHash: string;
  definition: WorkflowDefinition;
  operations: readonly PlannedOperation[];
  summary: string;
}

export interface PlanApproval {
  planHash: string;
  statement: string;
  accepted: readonly { nodeId: string; toolId: string }[];
}

export interface AiConversationRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  retentionOptIn: boolean;
}

export interface AiMessageRecord {
  id: string;
  conversationId: string;
  role: AiMessageDraft["role"];
  content: string;
  createdAt: string;
}
