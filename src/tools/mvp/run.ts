// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { ToolError } from "@/services/execution/local-provider";
import { runNativeEngine } from "@/services/engines/native";
import { runCanvasTool, type LocalFile, type LocalOutput } from "./images";
import { mvpTool } from "./specs";
import { readinessOf } from "./status";

export async function runMvpTool(toolId: string, input: { files?: LocalFile[]; options?: Record<string, unknown> }): Promise<LocalOutput> {
  const spec = mvpTool(toolId);
  if (!spec) throw new ToolError("unknown_tool", "unknown_tool");
  if (readinessOf(toolId) === "unavailable") throw new ToolError("not_in_build", "not_in_this_build");
  const files = input.files ?? [];
  const options = input.options ?? {};
  try {
    if (spec.engine === "canvas") return await runCanvasTool(toolId, files, options);
    return await runNativeEngine(toolId, files, options, spec.engineBinary);
  } catch (error) {
    throw new ToolError("engine_failed", error instanceof Error ? error.message : "The tool failed.");
  }
}
