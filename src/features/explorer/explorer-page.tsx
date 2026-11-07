// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useMemo, useState } from "react";
import { toolCopy } from "@/lib/catalog-copy";
import { translate, type Locale } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import type { CategoryId } from "@/tools/categories";
import { ToolIcon } from "@/tools/icons";
import { toolRegistry } from "@/tools/registry";
import { readinessOf } from "@/tools/mvp/status";

export function ExplorerPage({ category }: { category?: CategoryId }) {
  const [query, setQuery] = useState("");
  const locale = usePreferencesStore((state) => state.preferences.language);
  const navigate = usePreferencesStore((state) => state.navigate);
  const favorites = usePreferencesStore((state) => state.favorites);
  const toggleFavorite = usePreferencesStore((state) => state.toggleFavorite);
  const tools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return toolRegistry.list().filter((tool) => {
      if (category && tool.meta.category !== category) return false;
      if (!needle) return true;
      const copy = toolCopy(locale, tool.meta.id);
      return `${copy.short} ${copy.blurb}`.toLowerCase().includes(needle);
    });
  }, [category, locale, query]);
  const title = category ? categoryLabel(locale, category) : translate(locale, "allTools");

  return (
    <div className="flex w-full flex-col gap-4">
      <header>
        <h1 className="type-display">{title}</h1>
        <p className="type-meta mt-1">{translate(locale, "catalogLead")}</p>
      </header>
      <input className="field-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={translate(locale, "searchPlaceholder")} aria-label={translate(locale, "searchTools")} />
      {tools.length === 0 ? <p className="empty">{translate(locale, "noSearch")}</p> : null}
      <ul className="grid gap-2">
        {tools.map((tool) => {
          const copy = toolCopy(locale, tool.meta.id);
          const readiness = readinessOf(tool.meta.id);
          const starred = favorites.includes(tool.meta.id);
          return (
            <li key={tool.meta.id} className="panel flex items-center gap-2 p-2">
              <button type="button" className="row-btn min-w-0 flex-1" onClick={() => void navigate({ name: "tool", toolId: tool.meta.id })}>
                <ToolIcon name={tool.meta.icon} className="size-4 shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block type-title">{copy.short}</span>
                  <span className="type-meta block truncate">{copy.blurb}</span>
                </span>
                {readiness === "ready" ? null : (
                  <span className={`shrink-0 ${readiness === "partial" ? "status status-warn" : "status status-bad"}`}>
                    {translate(locale, readiness === "partial" ? "statusPartial" : "statusUnavailable")}
                  </span>
                )}
              </button>
              <button type="button" className="row-btn shrink-0" aria-pressed={starred} aria-label={starred ? translate(locale, "unfavorite") : translate(locale, "favoriteAction")} onClick={() => void toggleFavorite(tool.meta.id)}>
                {starred ? "★" : "☆"}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function categoryLabel(locale: Locale, id: CategoryId): string {
  if (id === "pdf") return translate(locale, "catPdf");
  if (id === "conversion") return translate(locale, "catConvert");
  if (id === "image") return translate(locale, "catImage");
  if (id === "ocr") return translate(locale, "catOcr");
  return id;
}
