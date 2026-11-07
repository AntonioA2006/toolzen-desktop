// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { createId, nowIso } from "@/lib/ids";
import { scopeCovers } from "./scope";
import type { AuditEvent, PermissionDecision, PermissionGrant, PermissionRequest } from "./types";

const HARMLESS_IMPLICIT = new Set(["tool.execute", "workflow.execute"]);

export class PermissionManager {
  private grants: PermissionGrant[] = [];
  private audit: AuditEvent[] = [];

  load(grants: readonly PermissionGrant[], audit: readonly AuditEvent[] = []): void {
    this.grants = grants.map((grant) => ({ ...grant, scope: structuredClone(grant.scope) }));
    this.audit = audit.map((event) => ({ ...event, scope: structuredClone(event.scope) }));
  }

  listGrants(): readonly PermissionGrant[] {
    return this.grants.map((grant) => ({ ...grant, scope: structuredClone(grant.scope) }));
  }

  listAudit(): readonly AuditEvent[] {
    return this.audit.map((event) => ({ ...event, scope: structuredClone(event.scope) }));
  }

  grant(input: {
    kind: PermissionGrant["kind"];
    scope: PermissionGrant["scope"];
    note: string;
    expiresAt?: string | null;
    now?: string;
  }): PermissionGrant {
    const grant: PermissionGrant = {
      id: createId("grant"),
      kind: input.kind,
      scope: structuredClone(input.scope),
      grantedAt: input.now ?? nowIso(),
      expiresAt: input.expiresAt ?? null,
      revokedAt: null,
      source: "user",
      note: input.note,
    };
    this.grants.push(grant);
    return { ...grant, scope: structuredClone(grant.scope) };
  }

  revoke(id: string, now = nowIso()): boolean {
    const grant = this.grants.find((item) => item.id === id && item.revokedAt === null);
    if (!grant) return false;
    grant.revokedAt = now;
    return true;
  }

  hasActiveGrant(request: PermissionRequest, now = nowIso()): boolean {
    return this.matchGrant(request, now) !== undefined;
  }

  decide(request: PermissionRequest, now = nowIso()): PermissionDecision {
    const implicit = this.implicitAllow(request);
    if (implicit) return this.record(request, true, implicit, null, now);
    const grant = this.matchGrant(request, now);
    if (grant) return this.record(request, true, "An explicit grant matches this operation.", grant.id, now);
    return this.record(
      request,
      false,
      "Denied. Sensitive or unrecognized operations stay blocked until a matching explicit grant exists.",
      null,
      now,
    );
  }

  decideAll(requests: readonly PermissionRequest[], now = nowIso()): PermissionDecision {
    if (requests.length === 0) {
      return {
        allowed: false,
        reason: "Denied. An empty permission check is not treated as approval.",
        grantId: null,
        auditId: createId("audit"),
      };
    }
    let last: PermissionDecision | null = null;
    for (const request of requests) {
      last = this.decide(request, now);
      if (!last.allowed) return last;
    }
    return last ?? { allowed: false, reason: "Denied.", grantId: null, auditId: createId("audit") };
  }

  private implicitAllow(request: PermissionRequest): string | null {
    if (
      request.kind === "filesystem.read" &&
      request.scope.type === "filesystem" &&
      request.scope.operations.length === 1 &&
      request.scope.operations[0] === "read" &&
      request.scope.path.startsWith("selection:")
    ) {
      return "Allowed. You chose this file and started the tool. Only that selected name is in scope.";
    }
    if (request.sensitivity !== "harmless") return null;
    if (!HARMLESS_IMPLICIT.has(request.kind)) return null;
    if (request.kind === "tool.execute" && request.scope.type === "tool-input") {
      return "Allowed. This tool only processes the in-memory input and does not touch files, the network, or the shell.";
    }
    if (request.kind === "workflow.execute" && request.scope.type === "workflow") {
      return "Allowed. This workflow step has no sensitive permission requirements.";
    }
    return null;
  }

  private matchGrant(request: PermissionRequest, now: string): PermissionGrant | undefined {
    return this.grants.find((grant) => {
      if (grant.revokedAt !== null || grant.kind !== request.kind) return false;
      if (grant.expiresAt !== null && Date.parse(grant.expiresAt) <= Date.parse(now)) return false;
      return scopeCovers(grant.scope, request.scope);
    });
  }

  private record(
    request: PermissionRequest,
    allowed: boolean,
    reason: string,
    grantId: string | null,
    now: string,
  ): PermissionDecision {
    const event: AuditEvent = {
      id: createId("audit"),
      occurredAt: now,
      kind: request.kind,
      scope: structuredClone(request.scope),
      allowed,
      reason,
      grantId,
    };
    this.audit.push(event);
    if (this.audit.length > 500) this.audit.splice(0, this.audit.length - 500);
    return { allowed, reason, grantId, auditId: event.id };
  }
}
