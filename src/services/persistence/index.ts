// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { isTauriRuntime } from "@/services/runtime/tauri";
import { BrowserPreviewPersistence } from "./browser";
import { SqlitePersistence } from "./sqlite";
import type { PersistencePort } from "./types";

export function createPersistence(): PersistencePort {
  return isTauriRuntime() ? new SqlitePersistence() : new BrowserPreviewPersistence();
}

export { BrowserPreviewPersistence, BROWSER_PREVIEW_KEY } from "./browser";
export { MemoryPersistence } from "./memory";
export { applyOperation, migratePersisted, sanitizePreferences } from "./reduce";
export { DEFAULT_PREFERENCES, emptyState } from "./types";
export type {
  PersistenceOperation,
  PersistencePort,
  PersistedState,
  PreferredExecutionMode,
  StartupPage,
  StorageInfo,
  ThemePreference,
  UserPreferences,
} from "./types";
