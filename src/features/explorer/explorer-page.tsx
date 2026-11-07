// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { ToolCard } from "@/components/tools/tool-card";
import { Input } from "@/components/ui/field";
import { usePreferencesStore } from "@/stores/preferences-store";
import { CATEGORIES, categoryById, type CategoryId } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";
import { cn } from "@/lib/cn";

export function ExplorerPage({ category }: { category?: CategoryId }) {
  const [query, setQuery] = useState("");
  const favorites = usePreferencesStore((state) => state.favorites);
  const navigate = usePreferencesStore((state) => state.navigate);
  const toggleFavorite = usePreferencesStore((state) => state.toggleFavorite);
  const tools = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return toolRegistry.list().filter((tool) => {
      if (category && tool.meta.category !== category) return false;
      if (!needle) return true;
      const haystack = `${tool.meta.name} ${tool.meta.description} ${tool.meta.tags.join(" ")}`.toLowerCase();
      return haystack.includes(needle);
    });
  }, [category, query]);

  const title = category ? categoryById(category).name : "All tools";
  const description = category ? categoryById(category).description : "Browse implemented tools and planned tools that are marked unavailable.";

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader
        title={title}
        description={description}
        {...(category ? { crumbs: [{ label: "All tools", route: { name: "tools" as const } }, { label: title }] } : {})}
      />
      <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Filter by name or description" aria-label="Filter tools" />
      <div className="flex flex-wrap gap-1.5">
        <FilterChip label="All" current={!category} onClick={() => void navigate({ name: "tools" })} />
        {CATEGORIES.map((item) => (
          <FilterChip key={item.id} label={item.name} current={category === item.id} onClick={() => void navigate({ name: "category", category: item.id })} />
        ))}
      </div>
      {tools.length === 0 ? <p className="text-sm text-subtle">No tools match that filter.</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard
            key={tool.meta.id}
            tool={tool}
            favorite={favorites.includes(tool.meta.id)}
            onOpen={() => void navigate({ name: "tool", toolId: tool.meta.id })}
            onToggleFavorite={() => void toggleFavorite(tool.meta.id)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterChip({ label, current, onClick }: { label: string; current: boolean; onClick: () => void }) {
  return (
    <button type="button" aria-pressed={current} className={cn("rounded-md border px-2 py-1 text-xs", current ? "border-ink bg-ink text-canvas" : "border-line text-subtle")} onClick={onClick}>
      {label}
    </button>
  );
}
