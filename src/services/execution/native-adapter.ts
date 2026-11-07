// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { LocalExecutionProvider } from "./local-provider";

export type NativeInvoke = (command: string, args: Record<string, unknown>) => Promise<unknown>;

/**
 * Future Rust-backed tools register through this function.
 * Tool definitions stay free of Tauri imports. No native tool is registered today.
 *
 * Example, not active:
 *   registerNativeLocalHandler(localProvider, {
 *     toolId: "pdf-merge",
 *     command: "execute_pdf_merge",
 *     invoke,
 *   });
 */
export function registerNativeLocalHandler(
  provider: LocalExecutionProvider,
  options: { toolId: string; command: string; invoke: NativeInvoke },
): void {
  provider.register(options.toolId, async (input, context) => {
    if (context.signal?.aborted) throw new DOMException("Aborted", "AbortError");
    return options.invoke(options.command, { toolId: options.toolId, input });
  });
}
