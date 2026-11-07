// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ComponentType } from "react";
import type { ExecutionCapabilities } from "@/services/execution/types";
import type { PermissionRequest, PermissionRequirement } from "@/services/permissions/types";
import type { FieldSchema, SchemaResult } from "@/services/schema/field-schema";
import type { CategoryId, ToolIconName } from "./categories";

export interface ToolMetadata {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: ToolIconName;
  tags: readonly string[];
  availability: "available" | "unavailable";
  unavailableReason?: string;
  processingMode: "local";
  formats: { input: readonly string[]; output: readonly string[] };
}

export interface ToolContract {
  purpose: string;
  input: FieldSchema;
  output: FieldSchema;
  permissions: readonly PermissionRequirement[];
}

export interface ToolProfile {
  meta: ToolMetadata;
  contract: ToolContract;
  capabilities: ExecutionCapabilities;
  validate: (input: unknown) => SchemaResult<unknown>;
  derivePermissionRequests: (input: unknown) => readonly PermissionRequest[];
}

export interface AnyToolDefinition extends ToolProfile {
  Component: ComponentType;
}

export interface ToolRegistry {
  list(): readonly AnyToolDefinition[];
  get(id: string): AnyToolDefinition | undefined;
}

export const HARMLESS_LOCAL_PERMISSION: PermissionRequirement = {
  kind: "tool.execute",
  sensitivity: "harmless",
  description: "Runs entirely in memory on text you type. No files, network, or shell access.",
};

export function localTextCapabilities(inputFormat: string, outputFormat: string): ExecutionCapabilities {
  return {
    supportedModes: ["local", "auto"],
    requiresInternet: false,
    supportsCancellation: true,
    supportsProgress: false,
    requiresFileInput: false,
    inputFormats: [inputFormat],
    outputFormats: [outputFormat],
    maxInputBytes: 1_000_000,
    memoryRequirement: "low",
    cpuRequirement: "low",
    gpuRequirement: "none",
    technicalRemoteSupport: false,
  };
}

export function harmlessRequests(toolId: string, input: unknown): readonly PermissionRequest[] {
  const inputBytes = new TextEncoder().encode(JSON.stringify(input ?? null)).byteLength;
  return [
    {
      kind: "tool.execute",
      sensitivity: "harmless",
      reason: "In-memory text processing.",
      scope: { type: "tool-input", toolId, inputBytes },
    },
  ];
}
