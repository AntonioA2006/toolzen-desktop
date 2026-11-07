// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { APP_VERSION } from "@/lib/app-info";
import { BrowserPreviewPersistence, BROWSER_PREVIEW_KEY } from "@/services/persistence/browser";
import { MemoryPersistence } from "@/services/persistence/memory";
import { applyOperation, migratePersisted } from "@/services/persistence/reduce";
import { emptyState } from "@/services/persistence/types";
import { toolRegistry } from "@/tools/registry";
import { MVP_TOOLS } from "@/tools/mvp/specs";

describe("persistence", () => {
  it("migrates older preview data to schema 2 and drops an unsaved cloud mode", () => {
    const migrated = migratePersisted({ schemaVersion: 0, preferences: { theme: "light", executionMode: "cloud", language: "fr" } });
    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.preferences.theme).toBe("light");
    expect(migrated.preferences.executionMode).toBe("local");
    expect(migrated.preferences.language).toBe("en");
    expect(migrated.workflows).toEqual([]);
    expect(migrated.aiMessages).toEqual([]);
  });

  it("refuses AI messages unless retention is opted in, and refuses history payloads", () => {
    let state = emptyState();
    state = applyOperation(state, {
      type: "upsertAiConversation",
      record: { id: "c1", title: "Draft", createdAt: "2026-11-07T00:00:00.000Z", updatedAt: "2026-11-07T00:00:00.000Z", retentionOptIn: true },
    });
    expect(() => applyOperation(state, { type: "appendAiMessage", message: { id: "m1", conversationId: "c1", role: "user", content: "secret", createdAt: "2026-11-07T00:00:01.000Z" } })).toThrow(/storage is off/);
    state = applyOperation(state, { type: "setPreferences", preferences: { ...state.preferences, aiRetentionOptIn: true } });
    state = applyOperation(state, { type: "appendAiMessage", message: { id: "m1", conversationId: "c1", role: "user", content: "secret", createdAt: "2026-11-07T00:00:01.000Z" } });
    expect(state.aiMessages).toHaveLength(1);
    const record = {
      id: "run",
      workflowId: "format-json",
      version: 1,
      startedAt: "2026-11-07T00:00:00.000Z",
      finishedAt: "2026-11-07T00:00:01.000Z",
      status: "succeeded" as const,
      nodeResults: [{ nodeId: "n", kind: "processing" as const, toolId: "json-formatter", status: "succeeded" as const, errorCode: null, durationMs: 1, resolvedMode: "local" as const, attempts: 1 }],
      errorCode: null,
    };
    (record.nodeResults[0] as { output?: string }).output = "hidden";
    expect(() => applyOperation(state, { type: "appendWorkflowExecution", record })).toThrow(/input or output/);
  });

  it("keeps browser preview storage separate from SQLite claims", async () => {
    const memory = new Map<string, string>();
    const storage = {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => void memory.set(key, value),
      removeItem: (key: string) => void memory.delete(key),
      clear: () => memory.clear(),
      key: () => null,
      length: 0,
    };
    Object.defineProperty(globalThis, "localStorage", { value: storage, configurable: true });
    const preview = new BrowserPreviewPersistence();
    await preview.apply({ type: "setFavorite", toolId: "json-formatter", favorite: true });
    const info = await preview.info();
    expect(info.backend).toBe("browser-preview-localstorage");
    expect(info.path).toBeNull();
    expect(info.note.toLowerCase()).toContain("not the desktop sqlite");
    expect(memory.has(BROWSER_PREVIEW_KEY)).toBe(true);
    const desktop = new MemoryPersistence();
    expect((await desktop.info()).backend).toBe("memory");
  });
});

describe("boundaries", () => {
  it("ships three runnable tools and does not let unavailable tools validate as runnable", () => {
    expect(toolRegistry.list().map((tool) => tool.meta.id).sort()).toEqual(MVP_TOOLS.map((tool) => tool.id).sort());
    expect(toolRegistry.list().some((tool) => tool.meta.id === "json-formatter")).toBe(false);
  });

  it("keeps tool modules free of Tauri and network calls", () => {
    const root = path.resolve("src/tools");
    const files = walk(root).filter((file) => file.endsWith(".ts") || file.endsWith(".tsx"));
    expect(files.length).toBeGreaterThan(0);
    for (const file of files) {
      const source = readFileSync(file, "utf8");
      expect(source, file).not.toContain("@tauri-apps");
      expect(source, file).not.toContain("fetch(");
      expect(source, file).not.toContain("XMLHttpRequest");
      expect(source, file).not.toContain("WebSocket");
    }
    const workflow = readFileSync(path.resolve("src/services/workflows/execute.ts"), "utf8");
    expect(workflow).toContain("manager.execute");
    expect(workflow).not.toContain("local-provider");
    expect(workflow).not.toContain("CloudExecutionProvider");
  });

  it("keeps the app version aligned with the package and Tauri manifest", () => {
    const packageJson = JSON.parse(readFileSync(path.resolve("package.json"), "utf8")) as { version: string; license: string };
    const tauri = JSON.parse(readFileSync(path.resolve("src-tauri/tauri.conf.json"), "utf8")) as { version: string };
    const cargo = readFileSync(path.resolve("src-tauri/Cargo.toml"), "utf8");
    expect(packageJson.version).toBe(APP_VERSION);
    expect(tauri.version).toBe(APP_VERSION);
    expect(packageJson.license).toBe("Apache-2.0");
    expect(cargo).toContain('license = "Apache-2.0"');
  });
});

function walk(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const full = path.join(directory, entry);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });
}
