// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { ToolIcon } from "@/tools/icons";
import { toolRegistry } from "@/tools/registry";
import { readinessOf } from "@/tools/mvp/status";

export function FavoritesPage() {
  const favorites = usePreferencesStore((state) => state.favorites);
  const navigate = usePreferencesStore((state) => state.navigate);
  const toggleFavorite = usePreferencesStore((state) => state.toggleFavorite);
  const locale = usePreferencesStore((state) => state.preferences.language);
  const tools = favorites.flatMap((id) => {
    const tool = toolRegistry.get(id);
    return tool ? [tool] : [];
  });
  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="type-display">{translate(locale, "favorites")}</h1>
        {tools.length === 0 ? <p className="type-body mt-2 text-subtle">{translate(locale, "emptyFavorites")}</p> : null}
      </header>
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
        {tools.map((tool) => {
          const copy = toolCopy(locale, tool.meta.id);
          const readiness = readinessOf(tool.meta.id);
          return (
            <li key={tool.meta.id} className="flex items-center gap-2 pr-2">
              <button type="button" className="row-btn min-w-0 flex-1" onClick={() => void navigate({ name: "tool", toolId: tool.meta.id })}>
                <ToolIcon name={tool.meta.icon} className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block type-title">{copy.short}</span>
                  <span className="type-meta block truncate">{copy.blurb}</span>
                </span>
              </button>
              {readiness === "ready" ? null : <span className={readiness === "partial" ? "status status-warn" : "status status-bad"}>{translate(locale, readiness === "partial" ? "statusPartial" : "statusUnavailable")}</span>}
              <button type="button" className="row-btn w-auto shrink-0" aria-pressed="true" aria-label={translate(locale, "unfavorite")} onClick={() => void toggleFavorite(tool.meta.id)}>★</button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
