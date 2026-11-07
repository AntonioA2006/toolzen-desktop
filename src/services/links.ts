// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { ALLOWED_EXTERNAL_URLS, type AllowedExternalUrl } from "@/lib/app-info";
import { isTauriRuntime } from "@/services/runtime/tauri";

export async function openAllowedUrl(url: AllowedExternalUrl): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  if (!(ALLOWED_EXTERNAL_URLS as readonly string[]).includes(url)) {
    return { ok: false, message: "That address is not in the allow list. Nothing was opened." };
  }
  try {
    if (isTauriRuntime()) {
      const opener = await import("@tauri-apps/plugin-opener");
      await opener.openUrl(url);
      return { ok: true, message: "Opened in the default browser." };
    }
    const opened = window.open(url, "_blank", "noopener,noreferrer");
    if (!opened) return { ok: false, message: "The browser blocked the new tab. Nothing was opened." };
    return { ok: true, message: "Opened a new browser tab." };
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "The link could not be opened." };
  }
}
