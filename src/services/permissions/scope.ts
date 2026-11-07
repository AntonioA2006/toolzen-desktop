// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { canonicalJson } from "@/lib/ids";
import type { FilesystemOperation, PermissionScope } from "./types";

export function scopesEqual(left: PermissionScope, right: PermissionScope): boolean {
  return canonicalJson(left) === canonicalJson(right);
}

export function scopeCovers(grant: PermissionScope, requested: PermissionScope): boolean {
  if (grant.type !== requested.type) return false;
  switch (grant.type) {
    case "none":
      return requested.type === "none";
    case "tool-input":
      return requested.type === "tool-input" && grant.toolId === requested.toolId;
    case "filesystem":
      return (
        requested.type === "filesystem" &&
        operationsCover(grant.operations, requested.operations) &&
        pathCovers(grant.path, requested.path)
      );
    case "cloud-destination":
      return (
        requested.type === "cloud-destination" &&
        grant.providerId === requested.providerId &&
        grant.destination === requested.destination
      );
    case "ai-tool":
      return (
        requested.type === "ai-tool" &&
        grant.toolId === requested.toolId &&
        grant.proposalId === requested.proposalId
      );
    case "workflow":
      return (
        requested.type === "workflow" &&
        grant.workflowId === requested.workflowId &&
        requested.nodeIds.every((nodeId) => grant.nodeIds.includes(nodeId))
      );
    default: {
      const unreachable: never = grant;
      return unreachable;
    }
  }
}

export function normalizePath(input: string): string | null {
  if (input.includes("\0")) return null;
  const replaced = input.replace(/\\/g, "/");
  const parts = replaced.split("/");
  if (parts.some((part) => part === "..")) return null;
  const absolute = replaced.startsWith("/");
  const cleaned = parts.filter((part) => part !== "" && part !== ".").join("/");
  if (cleaned.length === 0) return absolute ? "/" : null;
  return absolute ? `/${cleaned}` : cleaned;
}

function pathCovers(grantPath: string, requestedPath: string): boolean {
  const grant = normalizePath(grantPath);
  const requested = normalizePath(requestedPath);
  if (!grant || !requested) return false;
  return requested === grant || requested.startsWith(`${grant}/`);
}

function operationsCover(
  granted: readonly FilesystemOperation[],
  requested: readonly FilesystemOperation[],
): boolean {
  return requested.every((operation) => granted.includes(operation));
}
