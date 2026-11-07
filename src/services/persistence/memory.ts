// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { applyOperation } from "./reduce";
import { emptyState, type PersistedState, type PersistenceOperation, type PersistencePort, type StorageInfo } from "./types";

export class MemoryPersistence implements PersistencePort {
  private state: PersistedState;

  constructor(initial?: PersistedState) {
    this.state = initial ?? emptyState();
  }

  load(): Promise<PersistedState> {
    return Promise.resolve(structuredClone(this.state));
  }

  apply(operation: PersistenceOperation): Promise<PersistedState> {
    this.state = applyOperation(this.state, operation);
    return Promise.resolve(structuredClone(this.state));
  }

  info(): Promise<StorageInfo> {
    return Promise.resolve(describe("memory", null, this.state, "In-memory store used by tests and unsaved sessions."));
  }
}

export function describe(
  backend: StorageInfo["backend"],
  path: string | null,
  state: PersistedState,
  note: string,
): StorageInfo {
  return {
    backend,
    path,
    schemaVersion: state.schemaVersion,
    favoriteCount: state.favorites.length,
    recentCount: state.recent.length,
    workflowCount: state.workflows.length,
    aiConversationCount: state.aiConversations.length,
    grantCount: state.permissionGrants.length,
    note,
  };
}
