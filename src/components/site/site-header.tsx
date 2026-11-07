// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Header structure follows resources/views/components/navbar.blade.php at b600a8d.
// Guides, ads, and the public locale URL are omitted. Language is a local preference.

import { useMemo, useState } from "react";
import { toolCopy } from "@/lib/catalog-copy";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { CATEGORIES } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";
import { Glyph } from "./glyph";
import { SiteIcon } from "./icon";

export function SiteHeader() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const theme = usePreferencesStore((state) => state.preferences.theme);
  const update = usePreferencesStore((state) => state.updatePreferences);
  const navigate = usePreferencesStore((state) => state.navigate);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const tools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return [];
    return toolRegistry.list().filter((tool) => {
      const copy = toolCopy(locale, tool.meta.id);
      return `${copy.short} ${copy.blurb} ${tool.meta.id}`.toLowerCase().includes(needle);
    }).slice(0, 8);
  }, [locale, query]);

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <button type="button" className="brand brand-on-dark" onClick={() => void navigate({ name: "home" })}>
          <span className="brand-mark" aria-hidden="true">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 4.5h12l-8.6 8.4H18l-3.4 6.6" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="6.6" cy="18.4" r="1.7" fill="currentColor" />
            </svg>
          </span>
          <span className="brand-word"><b>Tool</b><i>Zen</i></span>
        </button>
        <nav className="nav-desktop" aria-label={translate(locale, "categories")}>
          {CATEGORIES.map((category) => (
            <button key={category.id} type="button" className="nav-link" onClick={() => void navigate({ name: "category", category: category.id })}>
              {translate(locale, category.id === "pdf" ? "catPdf" : category.id === "conversion" ? "catConvert" : category.id === "image" ? "catImage" : "catOcr")}
            </button>
          ))}
        </nav>
        <div className="header-actions">
          <div className="search-wrap">
            <div className="search-field">
              <SiteIcon name="search" className="size-4 search-icon" />
              <label className="sr-only" htmlFor="nav-tool-search">{translate(locale, "searchTools")}</label>
              <input
                id="nav-tool-search"
                className="search-input"
                type="search"
                value={query}
                placeholder={translate(locale, "searchPlaceholder")}
                role="combobox"
                aria-expanded={open && tools.length > 0}
                aria-controls="nav-search-results"
                onChange={(event) => {
                  setQuery(event.target.value);
                  setOpen(true);
                }}
                onFocus={() => setOpen(true)}
              />
            </div>
            {open && query.trim() ? (
              <div id="nav-search-results" className="search-results" role="listbox">
                {tools.length === 0 ? <p className="empty-state">{translate(locale, "noSearch")}</p> : tools.map((tool) => {
                  const copy = toolCopy(locale, tool.meta.id);
                  return (
                    <button
                      key={tool.meta.id}
                      type="button"
                      role="option"
                      onClick={() => {
                        setOpen(false);
                        setQuery("");
                        void navigate({ name: "tool", toolId: tool.meta.id });
                      }}
                    >
                      <strong>{copy.short}</strong>
                      <span className="field-help">{copy.blurb}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>
          <button type="button" className="nav-link" onClick={() => void update({ language: locale === "es" ? "en" : "es" })}>
            {locale === "es" ? "English" : "Español"}
          </button>
          <button type="button" className="icon-btn" aria-label={translate(locale, "theme")} onClick={() => void update({ theme: theme === "dark" ? "light" : "dark" })}>
            <SiteIcon name={theme === "dark" ? "sun" : "moon"} className="size-5" />
          </button>
          <button type="button" className="btn btn-primary btn-sm nav-cta" onClick={() => void navigate({ name: "tools" })}>
            {translate(locale, "allTools")}
            <SiteIcon name="arrow-right" className="size-4 icon-arrow" />
          </button>
        </div>
      </div>
      <nav className="nav-desktop desktop-local-nav" aria-label={translate(locale, "appNav")}>
        <button type="button" className="nav-link" onClick={() => void navigate({ name: "favorites" })}>{translate(locale, "favorites")}</button>
        <button type="button" className="nav-link" onClick={() => void navigate({ name: "recent" })}>{translate(locale, "recent")}</button>
        <button type="button" className="nav-link" onClick={() => void navigate({ name: "settings" })}>{translate(locale, "settings")}</button>
      </nav>
      <span className="sr-only"><Glyph icon="layers" /></span>
    </header>
  );
}
