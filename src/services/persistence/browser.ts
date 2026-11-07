// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { migratePersisted, applyOperation } from "./reduce";
import { describe } from "./memory";
import { emptyState, type PersistenceOperation, type PersistencePort, type PersistedState, type StorageInfo } from "./types";

export const BROWSER_PREVIEW_KEY = "toolzen.browser-preview";

/**
 * Browser preview persistence. This is localStorage, not SQLite.
 * Desktop builds do not use this adapter.
 */
export class BrowserPreviewPersistence implements PersistencePort {
  load(): Promise<PersistedState> {
    return Promise.resolve(read());
  }

  apply(operation: PersistenceOperation): Promise<PersistedState> {
    const next = applyOperation(read(), operation);
    localStorage.setItem(BROWSER_PREVIEW_KEY, JSON.stringify(next));
    return Promise.resolve(next);
  }

  info(): Promise<StorageInfo> {
    return Promise.resolve(
      describe(
        "browser-preview-localstorage",
        null,
        read(),
        "Browser preview only. This localStorage key is not the desktop SQLite database.",
      ),
    );
  }
}

function read(): PersistedState {
  if (typeof localStorage === "undefined") return emptyState();
  const raw = localStorage.getItem(BROWSER_PREVIEW_KEY);
  if (!raw) return emptyState();
  try {
    return migratePersisted(JSON.parse(raw));
  } catch {
    return emptyState();
  }
}
