// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { PermissionManager } from "@/services/permissions/manager";
import { LocalExecutionProvider } from "./local-provider";
import { ExecutionManager } from "./manager";

export const localExecutionProvider = new LocalExecutionProvider();
export const permissionManager = new PermissionManager();

let activeManager: ExecutionManager | null = null;

export function setExecutionManager(manager: ExecutionManager): void {
  activeManager = manager;
}

export function getExecutionManager(): ExecutionManager {
  if (!activeManager) throw new Error("Execution manager is not ready.");
  return activeManager;
}

export { CloudExecutionProvider } from "./cloud-contract";
export { ExecutionManager } from "./manager";
export { LocalExecutionProvider, ToolError } from "./local-provider";
export { registerNativeLocalHandler } from "./native-adapter";
export type { NativeInvoke } from "./native-adapter";
