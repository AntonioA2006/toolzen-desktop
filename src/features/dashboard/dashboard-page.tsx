// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { CATEGORIES } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";
import { ToolIcon } from "@/tools/icons";
import { readinessOf } from "@/tools/mvp/status";

const START_IDS = [
  "merge-pdf",
  "resize-image",
  "compress-image",
  "crop-image",
  "webp-converter",
  "remove-image-metadata",
  "jpg-to-pdf",
  "extract-pdf-pages",
  "delete-pdf-pages",
  "rotate-pdf",
] as const;

export function DashboardPage() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const navigate = usePreferencesStore((state) => state.navigate);
  const favorites = usePreferencesStore((state) => state.favorites);
  const recent = usePreferencesStore((state) => state.recent);
  const start = START_IDS.flatMap((id) => {
    const tool = toolRegistry.get(id);
    return tool && readinessOf(id) === "ready" ? [tool] : [];
  });
  const favoriteTools = favorites.flatMap((id) => {
    const tool = toolRegistry.get(id);
    return tool ? [tool] : [];
  }).slice(0, 4);
  const seen = new Set<string>();
  const recentTools = recent.filter((entry) => {
    if (seen.has(entry.toolId)) return false;
    seen.add(entry.toolId);
    return true;
  }).slice(0, 4);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <header>
        <h1 className="type-title">ToolZen</h1>
        <p className="type-meta">{translate(locale, "appDescription")}</p>
      </header>
      <section>
        <h2 className="type-label text-subtle">{translate(locale, "startWork")}</h2>
        <ul className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {start.map((tool) => (
            <li key={tool.meta.id}>
              <button type="button" className="panel row-btn h-full" onClick={() => void navigate({ name: "tool", toolId: tool.meta.id })}>
                <ToolIcon name={tool.meta.icon} className="size-4 shrink-0" />
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{toolCopy(locale, tool.meta.id).short}</span>
                  <span className="type-meta">{translate(locale, "statusReady")}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      {favoriteTools.length > 0 ? (
        <section>
          <h2 className="type-label text-subtle">{translate(locale, "favorites")}</h2>
          <ul className="mt-1">
            {favoriteTools.map((tool) => (
              <li key={tool.meta.id}>
                <button type="button" className="row-btn" onClick={() => void navigate({ name: "tool", toolId: tool.meta.id })}>
                  <ToolIcon name={tool.meta.icon} className="size-4" />
                  {toolCopy(locale, tool.meta.id).short}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {recentTools.length > 0 ? (
        <section>
          <h2 className="type-label text-subtle">{translate(locale, "recent")}</h2>
          <ul className="mt-1">
            {recentTools.map((entry) => {
              const tool = toolRegistry.get(entry.toolId);
              return (
                <li key={entry.toolId}>
                  <button type="button" className="row-btn" onClick={() => void navigate({ name: "tool", toolId: entry.toolId })}>
                    <span className="min-w-0 flex-1 truncate">{tool ? toolCopy(locale, tool.meta.id).short : entry.toolId}</span>
                    <span className="type-meta">{new Date(entry.openedAt).toLocaleString()}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      ) : null}
      <section>
        <h2 className="type-label text-subtle">{translate(locale, "categories")}</h2>
        <ul className="mt-1 divide-y divide-line rounded-md border border-line">
          {CATEGORIES.map((category) => {
            const tools = toolRegistry.list().filter((tool) => tool.meta.category === category.id);
            const ready = tools.filter((tool) => readinessOf(tool.meta.id) === "ready").length;
            const partial = tools.filter((tool) => readinessOf(tool.meta.id) === "partial").length;
            const unavailable = tools.length - ready - partial;
            return (
              <li key={category.id}>
                <button type="button" className="row-btn" onClick={() => void navigate({ name: "category", category: category.id })}>
                  <ToolIcon name={category.icon} className="size-4" />
                  <span className="font-medium">{category.name}</span>
                  <span className="type-meta ml-auto">{translate(locale, "categoryCounts").replace("{ready}", String(ready)).replace("{partial}", String(partial)).replace("{unavailable}", String(unavailable))}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
