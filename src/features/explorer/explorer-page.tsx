// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useMemo, useState } from "react";
import { WebToolCard } from "@/components/site/web-tool-card";
import { toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { categoryById, type CategoryId } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";

export function ExplorerPage({ category }: { category?: CategoryId }) {
  const [query, setQuery] = useState("");
  const locale = usePreferencesStore((state) => state.preferences.language);
  const navigate = usePreferencesStore((state) => state.navigate);
  const tools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return toolRegistry.list().filter((tool) => {
      if (category && tool.meta.category !== category) return false;
      if (!needle) return true;
      const copy = toolCopy(locale, tool.meta.id);
      return `${copy.short} ${copy.blurb} ${tool.meta.id}`.toLowerCase().includes(needle);
    });
  }, [category, locale, query]);
  const title = category ? categoryById(category).name : translate(locale, "allTools");

  return (
    <>
      <section className="page-hero">
        <div className="page-hero-inner">
          <h1>{title}</h1>
          <p className="lead">{translate(locale, "catalogLead")}</p>
          <div className="search-field">
            <input className="search-input" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={translate(locale, "searchPlaceholder")} aria-label={translate(locale, "searchTools")} />
          </div>
        </div>
      </section>
      <div className="site-main">
        <div className="tool-grid cols-3">
          {tools.map((tool) => (
            <WebToolCard key={tool.meta.id} tool={tool} locale={locale} onOpen={() => void navigate({ name: "tool", toolId: tool.meta.id })} />
          ))}
        </div>
        {tools.length === 0 ? <p className="empty-state">{translate(locale, "noSearch")}</p> : null}
      </div>
    </>
  );
}
