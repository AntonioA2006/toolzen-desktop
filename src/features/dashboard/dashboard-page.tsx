// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { toolCopy } from "@/lib/catalog-copy";
import { categoryAvailability, formatLocal } from "@/lib/format";
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
    <div className="flex w-full flex-col gap-6">
      <header>
        <h1 className="type-display">{translate(locale, "startWork")}</h1>
        <p className="type-body mt-2 text-subtle">{translate(locale, "appDescription")}</p>
      </header>
      <section>
        <ul className="grid grid-cols-1 overflow-hidden rounded-md border border-line md:grid-cols-2 xl:grid-cols-3">
          {start.map((tool) => {
            const copy = toolCopy(locale, tool.meta.id);
            return (
              <li key={tool.meta.id} className="border-line md:border-r md:[&:nth-child(2n)]:border-r-0 xl:[&:nth-child(2n)]:border-r xl:[&:nth-child(3n)]:border-r-0 border-b last:border-b-0">
                <button type="button" className="row-btn h-full min-h-12 items-start py-3" onClick={() => void navigate({ name: "tool", toolId: tool.meta.id })}>
                  <ToolIcon name={tool.meta.icon} className="mt-0.5 size-4 shrink-0" />
                  <span className="min-w-0 flex-1">
                    <span className="block type-title">{copy.short}</span>
                    <span className="type-meta">{copy.blurb}</span>
                  </span>
                </button>
              </li>
            );
          })}
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
                    <span className="type-meta">{formatLocal(locale, entry.openedAt)}</span>
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
                  <span className="font-medium">{translate(locale, category.id === "pdf" ? "catPdf" : category.id === "conversion" ? "catConvert" : category.id === "image" ? "catImage" : "catOcr")}</span>
                  <span className="type-meta ml-auto text-right">{categoryAvailability(locale, ready, partial, unavailable)}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
