// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { localExecutionProvider, type LocalExecutionProvider } from "@/services/execution";
import { MVP_TOOLS } from "./mvp/specs";
import { runMvpTool } from "./mvp/run";

let registered = false;

export function registerLocalToolHandlers(provider: LocalExecutionProvider = localExecutionProvider): void {
  if (registered && provider === localExecutionProvider) return;
  for (const tool of MVP_TOOLS) {
    provider.register(tool.id, (input) => runMvpTool(tool.id, input as { files?: []; options?: Record<string, unknown> }));
  }
  if (provider === localExecutionProvider) registered = true;
}
