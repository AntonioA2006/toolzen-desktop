// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { WorkflowExecutionRecord } from "@/services/workflows/types";
import { parseRoute } from "@/types/route";
import { DEFAULT_PREFERENCES, emptyState, type PersistedState, type PersistenceOperation, type UserPreferences } from "./types";

const TOOL_ID = /^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/;
const MAX_DEFINITION_CHARS = 256 * 1024;
const MAX_MESSAGE_CHARS = 16 * 1024;

export function applyOperation(state: PersistedState, operation: PersistenceOperation): PersistedState {
  switch (operation.type) {
    case "setPreferences":
      return { ...state, preferences: sanitizePreferences(operation.preferences) };
    case "setFavorite": {
      if (!TOOL_ID.test(operation.toolId)) throw new Error("Invalid tool id.");
      const favorites = operation.favorite
        ? [...new Set([...state.favorites, operation.toolId])]
        : state.favorites.filter((id) => id !== operation.toolId);
      return { ...state, favorites };
    }
    case "recordToolOpen": {
      if (!TOOL_ID.test(operation.toolId)) throw new Error("Invalid tool id.");
      const recent = [{ toolId: operation.toolId, openedAt: operation.openedAt }, ...state.recent].slice(0, 200);
      const existing = state.usage.find((item) => item.toolId === operation.toolId);
      const usage = existing
        ? state.usage.map((item) =>
            item.toolId === operation.toolId
              ? { toolId: item.toolId, openCount: item.openCount + 1, lastOpenedAt: operation.openedAt }
              : item,
          )
        : [...state.usage, { toolId: operation.toolId, openCount: 1, lastOpenedAt: operation.openedAt }];
      return { ...state, recent, usage };
    }
    case "clearHistory":
      return { ...state, recent: [], usage: [] };
    case "clearFavorites":
      return { ...state, favorites: [] };
    case "resetPreferences":
      return { ...state, preferences: { ...DEFAULT_PREFERENCES } };
    case "resetAllLocalData":
      return emptyState();
    case "upsertWorkflow": {
      const serialized = JSON.stringify(operation.record);
      if (serialized.length > MAX_DEFINITION_CHARS) throw new Error("Workflow definition is too large.");
      const workflows = state.workflows.some((item) => item.metadata.id === operation.record.metadata.id)
        ? state.workflows.map((item) => (item.metadata.id === operation.record.metadata.id ? operation.record : item))
        : [...state.workflows, operation.record];
      return { ...state, workflows };
    }
    case "deleteWorkflow":
      return {
        ...state,
        workflows: state.workflows.filter((item) => item.metadata.id !== operation.id),
        workflowExecutions: state.workflowExecutions.filter((item) => item.workflowId !== operation.id),
      };
    case "appendWorkflowExecution": {
      assertMetadataOnly(operation.record);
      return { ...state, workflowExecutions: [...state.workflowExecutions, operation.record].slice(-200) };
    }
    case "upsertAiConversation":
      return {
        ...state,
        aiConversations: upsertById(state.aiConversations, operation.record),
      };
    case "appendAiMessage": {
      if (!state.preferences.aiRetentionOptIn) {
        throw new Error("AI message storage is off. Nothing was saved.");
      }
      const conversation = state.aiConversations.find((item) => item.id === operation.message.conversationId);
      if (!conversation?.retentionOptIn) throw new Error("This conversation is not opted in to retention.");
      if (operation.message.content.length > MAX_MESSAGE_CHARS) throw new Error("AI message is too large.");
      return { ...state, aiMessages: [...state.aiMessages, operation.message] };
    }
    case "deleteAiConversation":
      return {
        ...state,
        aiConversations: state.aiConversations.filter((item) => item.id !== operation.id),
        aiMessages: state.aiMessages.filter((item) => item.conversationId !== operation.id),
      };
    case "insertGrant":
      return { ...state, permissionGrants: [...state.permissionGrants, operation.grant] };
    case "revokeGrant":
      return {
        ...state,
        permissionGrants: state.permissionGrants.map((grant) =>
          grant.id === operation.id ? { ...grant, revokedAt: operation.revokedAt } : grant,
        ),
      };
    case "appendAudit":
      return { ...state, permissionAudit: [...state.permissionAudit, operation.event].slice(-500) };
    default: {
      const unreachable: never = operation;
      throw new Error(`Unknown operation ${String(unreachable)}`);
    }
  }
}

export function migratePersisted(raw: unknown): PersistedState {
  if (!raw || typeof raw !== "object") return emptyState();
  const record = raw as Partial<PersistedState> & { schemaVersion?: number };
  const base = emptyState();
  const preferences = sanitizePreferences({ ...base.preferences, ...(record.preferences ?? {}) });
  return {
    schemaVersion: 2,
    preferences,
    favorites: Array.isArray(record.favorites) ? record.favorites.filter((id) => typeof id === "string" && TOOL_ID.test(id)) : [],
    recent: Array.isArray(record.recent) ? record.recent.filter(isRecent) : [],
    usage: Array.isArray(record.usage) ? record.usage.filter(isUsage) : [],
    workflows: Array.isArray(record.workflows) ? (record.workflows as PersistedState["workflows"]) : [],
    workflowExecutions: Array.isArray(record.workflowExecutions)
      ? (record.workflowExecutions as PersistedState["workflowExecutions"])
      : [],
    aiConversations: Array.isArray(record.aiConversations) ? (record.aiConversations as PersistedState["aiConversations"]) : [],
    aiMessages: Array.isArray(record.aiMessages) ? (record.aiMessages as PersistedState["aiMessages"]) : [],
    permissionGrants: Array.isArray(record.permissionGrants) ? (record.permissionGrants as PersistedState["permissionGrants"]) : [],
    permissionAudit: Array.isArray(record.permissionAudit) ? (record.permissionAudit as PersistedState["permissionAudit"]) : [],
  };
}

export function sanitizePreferences(input: Partial<UserPreferences>): UserPreferences {
  const theme = input.theme === "light" || input.theme === "system" ? input.theme : "dark";
  const startupPage = input.startupPage === "tools" || input.startupPage === "last-tool" ? input.startupPage : "home";
  const executionMode = input.executionMode === "auto" ? "auto" : "local";
  const days = input.aiRetentionDays;
  return {
    theme,
    language: "en",
    startupPage,
    executionMode,
    lastRoute: parseRoute(input.lastRoute),
    aiRetentionOptIn: input.aiRetentionOptIn === true,
    aiRetentionDays: typeof days === "number" && Number.isInteger(days) && days >= 1 && days <= 3650 ? days : null,
  };
}

function isRecent(value: unknown): value is PersistedState["recent"][number] {
  if (!value || typeof value !== "object") return false;
  const record = value as { toolId?: unknown; openedAt?: unknown };
  return typeof record.toolId === "string" && TOOL_ID.test(record.toolId) && typeof record.openedAt === "string";
}

function isUsage(value: unknown): value is PersistedState["usage"][number] {
  if (!value || typeof value !== "object") return false;
  const record = value as { toolId?: unknown; openCount?: unknown; lastOpenedAt?: unknown };
  return typeof record.toolId === "string" && typeof record.openCount === "number" && typeof record.lastOpenedAt === "string";
}

function upsertById<T extends { id: string }>(items: readonly T[], record: T): T[] {
  return items.some((item) => item.id === record.id) ? items.map((item) => (item.id === record.id ? record : item)) : [...items, record];
}

function assertMetadataOnly(record: WorkflowExecutionRecord): void {
  const serialized = JSON.stringify(record);
  if (serialized.length > 64 * 1024) throw new Error("Workflow history is too large.");
  for (const result of record.nodeResults) {
    if ("output" in result || "input" in result) throw new Error("Workflow history cannot store input or output contents.");
  }
}
