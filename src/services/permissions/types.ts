// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export type PermissionKind =
  | "tool.execute"
  | "workflow.execute"
  | "filesystem.read"
  | "filesystem.modify"
  | "filesystem.delete"
  | "filesystem.monitor"
  | "cloud.upload"
  | "ai.execute-tool";

export type FilesystemOperation = "read" | "modify" | "delete" | "monitor";

/**
 * Scope identifies the actual operation. Authorization never accepts a detached
 * "already granted" boolean from the caller.
 */
export type PermissionScope =
  | { type: "none" }
  | { type: "tool-input"; toolId: string; inputBytes: number }
  | { type: "filesystem"; path: string; operations: readonly FilesystemOperation[] }
  | { type: "cloud-destination"; providerId: string; destination: string }
  | { type: "ai-tool"; toolId: string; proposalId: string }
  | { type: "workflow"; workflowId: string; nodeIds: readonly string[] };

export interface PermissionRequirement {
  kind: PermissionKind;
  sensitivity: "harmless" | "sensitive";
  description: string;
}

export interface PermissionRequest {
  kind: PermissionKind;
  sensitivity: "harmless" | "sensitive";
  reason: string;
  scope: PermissionScope;
}

export interface PermissionGrant {
  id: string;
  kind: PermissionKind;
  scope: PermissionScope;
  grantedAt: string;
  expiresAt: string | null;
  revokedAt: string | null;
  source: "user";
  note: string;
}

export interface AuditEvent {
  id: string;
  occurredAt: string;
  kind: PermissionKind;
  scope: PermissionScope;
  allowed: boolean;
  reason: string;
  grantId: string | null;
}

export interface PermissionDecision {
  allowed: boolean;
  reason: string;
  grantId: string | null;
  auditId: string;
}
