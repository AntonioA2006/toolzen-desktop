// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { invoke } from "@tauri-apps/api/core";
import type { PersistedState, PersistenceOperation, PersistencePort, StorageInfo } from "./types";

/** Desktop adapter. All structured data goes through typed Tauri commands into app-local SQLite. */
export class SqlitePersistence implements PersistencePort {
  load(): Promise<PersistedState> {
    return invoke<PersistedState>("load_state");
  }

  apply(operation: PersistenceOperation): Promise<PersistedState> {
    return invoke<PersistedState>("apply_op", { operation });
  }

  info(): Promise<StorageInfo> {
    return invoke<StorageInfo>("storage_info");
  }
}
