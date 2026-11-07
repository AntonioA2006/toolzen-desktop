// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ExecutionMode } from "@/services/execution/types";
import type { PermissionRequest } from "@/services/permissions/types";
import type { FieldSchema } from "@/services/schema/field-schema";

export const IMPLEMENTED_TRIGGERS = ["manual"] as const;
export const FUTURE_TRIGGERS = ["file-selection", "folder-monitoring", "scheduled", "app-event"] as const;
export type TriggerKind = (typeof IMPLEMENTED_TRIGGERS)[number] | (typeof FUTURE_TRIGGERS)[number];
export type NodeKind = "trigger" | "input" | "processing" | "transformation" | "conditional" | "output" | "utility";

export type NodeConfig =
  | { kind: "trigger"; trigger: TriggerKind }
  | { kind: "input"; parameterId: string }
  | { kind: "processing" }
  | { kind: "transformation"; operator: "pick"; key: string }
  | { kind: "conditional"; operator: "truthy" | "falsy" | "eq"; compareTo?: unknown }
  | { kind: "output" }
  | { kind: "utility"; operator: "annotation"; note: string };

export interface NodeInputBinding {
  port: string;
  source:
    | { type: "literal"; value: unknown }
    | { type: "node-output"; nodeId: string; port: string }
    | { type: "workflow-parameter"; parameterId: string };
}

export interface NodeOutputPort {
  id: string;
  schema: FieldSchema;
}

export interface NodeExecutionRequirements {
  mode: ExecutionMode;
  requiresInternet: boolean;
}

export interface WorkflowNode {
  id: string;
  kind: NodeKind;
  name: string;
  toolId?: string;
  inputs: readonly NodeInputBinding[];
  outputs: readonly NodeOutputPort[];
  requirements: NodeExecutionRequirements;
  config: NodeConfig;
}

export interface WorkflowConnection {
  id: string;
  fromNodeId: string;
  fromPort: string;
  toNodeId: string;
  toPort: string;
}

export interface WorkflowParameter {
  id: string;
  name: string;
  schema: FieldSchema;
  required: boolean;
}

export interface OutputMapping {
  id: string;
  nodeId: string;
  port: string;
  name: string;
}

export interface WorkflowExecutionConfig {
  defaultMode: ExecutionMode;
}

export interface ErrorRetryPolicy {
  maxAttempts: number;
  retryOn: readonly string[];
  /** Local failure must never switch the node to a remote provider. */
  fallbackToCloud: false;
}

export interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  tags: readonly string[];
}

export interface WorkflowVersion {
  version: number;
  nodes: readonly WorkflowNode[];
  connections: readonly WorkflowConnection[];
  parameters: readonly WorkflowParameter[];
  outputMappings: readonly OutputMapping[];
  execution: WorkflowExecutionConfig;
  errorPolicy: ErrorRetryPolicy;
}

export interface WorkflowDefinition {
  metadata: WorkflowMetadata;
  version: WorkflowVersion;
}

export interface PlannedStep {
  nodeId: string;
  kind: NodeKind;
  toolId: string | null;
  mode: ExecutionMode;
  permissionRequirements: readonly PermissionRequest[];
}

export interface WorkflowPlan {
  workflowId: string;
  version: number;
  steps: readonly PlannedStep[];
  definition: WorkflowDefinition;
}

export interface WorkflowNodeResultMeta {
  nodeId: string;
  kind: NodeKind;
  toolId: string | null;
  status: "succeeded" | "failed" | "skipped" | "cancelled";
  errorCode: string | null;
  durationMs: number;
  resolvedMode: "local" | "cloud" | null;
  attempts: number;
}

export interface WorkflowExecutionRecord {
  id: string;
  workflowId: string;
  version: number;
  startedAt: string;
  finishedAt: string | null;
  status: "running" | "succeeded" | "failed" | "cancelled";
  nodeResults: readonly WorkflowNodeResultMeta[];
  errorCode: string | null;
}

export interface WorkflowProgress {
  nodeId: string;
  completed: number;
  total: number;
  message: string;
}

export interface WorkflowRunResult {
  status: "succeeded" | "failed" | "cancelled";
  outputs: Readonly<Record<string, unknown>>;
  history: WorkflowExecutionRecord;
  errorMessage: string | null;
}
