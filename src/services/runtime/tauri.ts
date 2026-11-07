// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
