// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { isTauriRuntime } from "@/services/runtime/tauri";

export interface SaveOutcome {
  saved: boolean;
}

/** Desktop asks the OS save dialog inside Rust and writes only that path. The preview uses one blob click. */
export async function saveOutput(fileName: string, mime: string, bytesBase64: string): Promise<SaveOutcome> {
  if (!isTauriRuntime()) return previewSave(fileName, mime, bytesBase64);
  const { invoke } = await import("@tauri-apps/api/core");
  return invoke<SaveOutcome>("save_output", { suggestedName: fileName, bytesBase64 });
}

function previewSave(fileName: string, mime: string, bytesBase64: string): SaveOutcome {
  const binary = atob(bytesBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) bytes[index] = binary.charCodeAt(index);
  const url = URL.createObjectURL(new Blob([bytes], { type: mime || "application/octet-stream" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  return { saved: true };
}
