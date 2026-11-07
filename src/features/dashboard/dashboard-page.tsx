// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useUiStore } from "@/stores/ui-store";
import { CATEGORIES } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";
import { ToolIcon } from "@/tools/icons";
import { readinessOf } from "@/tools/mvp/status";

export function DashboardPage() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const navigate = usePreferencesStore((state) => state.navigate);
  const favorites = usePreferencesStore((state) => state.favorites);
  const recent = usePreferencesStore((state) => state.recent);
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);
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
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6">
      <header>
        <h1 className="type-display">ToolZen</h1>
        <p className="type-meta mt-1">{translate(locale, "appDescription")}</p>
      </header>
      <button type="button" className="panel flex h-10 items-center px-3 text-left text-sm text-faint" onClick={() => setPaletteOpen(true)}>
        {translate(locale, "searchTools")}
      </button>
      <section>
        <h2 className="type-label text-subtle">{translate(locale, "favorites")}</h2>
        {favoriteTools.length === 0 ? <p className="empty">{translate(locale, "emptyFavorites")}</p> : (
          <ul className="mt-2 grid gap-1">
            {favoriteTools.map((tool) => (
              <li key={tool.meta.id}>
                <button type="button" className="row-btn" onClick={() => void navigate({ name: "tool", toolId: tool.meta.id })}>
                  <ToolIcon name={tool.meta.icon} className="size-4" />
                  <span>{toolCopy(locale, tool.meta.id).short}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section>
        <h2 className="type-label text-subtle">{translate(locale, "recent")}</h2>
        {recentTools.length === 0 ? <p className="empty">{translate(locale, "emptyRecent")}</p> : (
          <ul className="mt-2 grid gap-1">
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
        )}
      </section>
      <section>
        <h2 className="type-label text-subtle">{translate(locale, "categories")}</h2>
        <ul className="mt-2 grid gap-2 sm:grid-cols-2">
          {CATEGORIES.map((category) => (
            <li key={category.id}>
              <button type="button" className="panel row-btn" onClick={() => void navigate({ name: "category", category: category.id })}>
                <ToolIcon name={category.icon} className="size-4" />
                <span>
                  <span className="block type-title">{category.name}</span>
                  <span className="type-meta">{category.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>
      <p className="type-meta">{translate(locale, "privacyLead")} <button type="button" className="underline" onClick={() => void navigate({ name: "privacy" })}>{translate(locale, "privacy")}</button></p>
      <p className="sr-only">{readinessOf("merge-pdf")}</p>
    </div>
  );
}
