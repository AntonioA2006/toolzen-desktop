// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { isTauriRuntime } from "@/services/runtime/tauri";
import type { LocalFile, LocalOutput } from "@/tools/mvp/images";

export async function runNativeEngine(toolId: string, files: readonly LocalFile[], options: Record<string, unknown>, binary: string): Promise<LocalOutput> {
  if (!isTauriRuntime()) {
    throw new Error(`${binary} runs only in the desktop app. This preview did not process the file.`);
  }
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<LocalOutput>("run_engine", { job: { toolId, options, files } });
}
