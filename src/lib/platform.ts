// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad/i.test(navigator.userAgent);
}

export function shortcutLabel(): string {
  return isMacPlatform() ? "⌘K" : "Ctrl+K";
}
