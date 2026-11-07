// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { PermissionRequest } from "@/services/permissions/types";
import type { SchemaResult } from "@/services/schema/field-schema";
import { localTextCapabilities, type ToolProfile } from "./types";
import { MVP_TOOLS, type MvpToolSpec } from "./mvp/specs";
import { readinessOf } from "./mvp/status";

const profiles: readonly ToolProfile[] = MVP_TOOLS.map(toProfile);

export const toolProfiles = profiles;

export function findProfile(id: string): ToolProfile | undefined {
  return profiles.find((tool) => tool.meta.id === id);
}

function toProfile(spec: MvpToolSpec): ToolProfile {
  return {
    meta: {
      id: spec.id,
      name: spec.name,
      description: spec.description,
      category: spec.category,
      icon: spec.icon,
      tags: [spec.category, spec.engine],
      availability: readinessOf(spec.id) === "unavailable" ? "unavailable" : "available",
      ...(readinessOf(spec.id) === "unavailable"
        ? { unavailableReason: "This build does not run this tool. Nothing is processed if you open it." }
        : {}),
      processingMode: "local",
      formats: { input: spec.accept.split(","), output: [spec.outputMime] },
    },
    contract: {
      purpose: spec.description,
      input: {
        type: "object",
        description: "Selected files and options.",
        additionalProperties: false,
        fields: [
          { name: "files", required: true, schema: { type: "array", description: "Files", items: { type: "object", description: "File", additionalProperties: false, fields: [] }, minItems: spec.minFiles, maxItems: spec.maxFiles } },
          { name: "options", required: true, schema: { type: "object", description: "Options", additionalProperties: false, fields: [] } },
        ],
      },
      output: {
        type: "object",
        description: "A produced file.",
        additionalProperties: false,
        fields: [
          { name: "fileName", required: true, schema: { type: "string", description: "Name" } },
          { name: "mime", required: true, schema: { type: "string", description: "MIME" } },
          { name: "bytesBase64", required: true, schema: { type: "string", description: "Contents" } },
        ],
      },
      permissions: [
        {
          kind: "filesystem.read",
          sensitivity: "sensitive",
          description: "Reads only the files you select for this run.",
        },
      ],
    },
    capabilities: {
      ...localTextCapabilities(spec.accept, spec.outputMime),
      requiresFileInput: false,
      maxInputBytes: spec.maxFileBytes * spec.maxFiles * 2,
      technicalRemoteSupport: false,
    },
    validate: (input) => validateMvp(spec, input),
    derivePermissionRequests: (input) => permissionsFor(spec.id, input),
  };
}

function validateMvp(spec: MvpToolSpec, input: unknown): SchemaResult<unknown> {
  if (!input || typeof input !== "object") return { ok: false, errors: [{ field: "input", message: "Choose a file." }] };
  const record = input as { files?: unknown; options?: unknown };
  if (!Array.isArray(record.files)) return { ok: false, errors: [{ field: "files", message: "Choose a file." }] };
  if (record.files.length < spec.minFiles || record.files.length > spec.maxFiles) {
    return { ok: false, errors: [{ field: "files", message: `Use ${spec.minFiles} to ${spec.maxFiles} files.` }] };
  }
  for (const file of record.files) {
    if (!file || typeof file !== "object") return { ok: false, errors: [{ field: "files", message: "A selected file is unreadable." }] };
    const item = file as { name?: unknown; bytesBase64?: unknown };
    if (typeof item.name !== "string" || typeof item.bytesBase64 !== "string" || item.bytesBase64.length === 0) {
      return { ok: false, errors: [{ field: "files", message: "A selected file is empty." }] };
    }
  }
  if (!record.options || typeof record.options !== "object" || Array.isArray(record.options)) {
    return { ok: false, errors: [{ field: "options", message: "Options must be an object." }] };
  }
  return { ok: true, value: input };
}

function permissionsFor(toolId: string, input: unknown): readonly PermissionRequest[] {
  const files = (input as { files?: { name?: string }[] }).files ?? [];
  return files.map((file) => ({
    kind: "filesystem.read" as const,
    sensitivity: "sensitive" as const,
    reason: `Read ${file.name ?? "the selected file"} for ${toolId}.`,
    scope: { type: "filesystem" as const, path: `selection:${file.name ?? "file"}`, operations: ["read" as const] },
  }));
}
