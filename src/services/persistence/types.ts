// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { AiConversationRecord, AiMessageRecord } from "@/services/ai/types";
import type { PermissionGrant, AuditEvent } from "@/services/permissions/types";
import type { WorkflowDefinition, WorkflowExecutionRecord } from "@/services/workflows/types";
import type { AppRoute } from "@/types/route";

export type ThemePreference = "dark" | "light" | "system";
export type StartupPage = "home" | "tools" | "last-tool";
export type PreferredExecutionMode = "local" | "auto";

export interface UserPreferences {
  theme: ThemePreference;
  language: "en";
  startupPage: StartupPage;
  executionMode: PreferredExecutionMode;
  lastRoute: AppRoute | null;
  aiRetentionOptIn: boolean;
  aiRetentionDays: number | null;
}

export interface RecentEntry {
  toolId: string;
  openedAt: string;
}

export interface UsageEntry {
  toolId: string;
  openCount: number;
  lastOpenedAt: string;
}

export interface PersistedState {
  schemaVersion: 2;
  preferences: UserPreferences;
  favorites: string[];
  recent: RecentEntry[];
  usage: UsageEntry[];
  workflows: WorkflowDefinition[];
  workflowExecutions: WorkflowExecutionRecord[];
  aiConversations: AiConversationRecord[];
  aiMessages: AiMessageRecord[];
  permissionGrants: PermissionGrant[];
  permissionAudit: AuditEvent[];
}

export type PersistenceOperation =
  | { type: "setPreferences"; preferences: UserPreferences }
  | { type: "setFavorite"; toolId: string; favorite: boolean }
  | { type: "recordToolOpen"; toolId: string; openedAt: string }
  | { type: "clearHistory" }
  | { type: "clearFavorites" }
  | { type: "resetPreferences" }
  | { type: "resetAllLocalData" }
  | { type: "upsertWorkflow"; record: WorkflowDefinition }
  | { type: "deleteWorkflow"; id: string }
  | { type: "appendWorkflowExecution"; record: WorkflowExecutionRecord }
  | { type: "upsertAiConversation"; record: AiConversationRecord }
  | { type: "appendAiMessage"; message: AiMessageRecord }
  | { type: "deleteAiConversation"; id: string }
  | { type: "insertGrant"; grant: PermissionGrant }
  | { type: "revokeGrant"; id: string; revokedAt: string }
  | { type: "appendAudit"; event: AuditEvent };

export interface StorageInfo {
  backend: "sqlite" | "browser-preview-localstorage" | "memory";
  path: string | null;
  schemaVersion: number;
  favoriteCount: number;
  recentCount: number;
  workflowCount: number;
  aiConversationCount: number;
  grantCount: number;
  note: string;
}

export interface PersistencePort {
  load(): Promise<PersistedState>;
  apply(operation: PersistenceOperation): Promise<PersistedState>;
  info(): Promise<StorageInfo>;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: "dark",
  language: "en",
  startupPage: "home",
  executionMode: "local",
  lastRoute: null,
  aiRetentionOptIn: false,
  aiRetentionDays: null,
};

export function emptyState(): PersistedState {
  return {
    schemaVersion: 2,
    preferences: { ...DEFAULT_PREFERENCES },
    favorites: [],
    recent: [],
    usage: [],
    workflows: [],
    workflowExecutions: [],
    aiConversations: [],
    aiMessages: [],
    permissionGrants: [],
    permissionAudit: [],
  };
}
