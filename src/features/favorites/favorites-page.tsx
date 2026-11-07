// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { PageHeader } from "@/components/layout/page-header";
import { ToolCard } from "@/components/tools/tool-card";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { toolRegistry } from "@/tools/registry";

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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader title={translate(locale, "favorites")} description={translate(locale, "emptyFavorites")} />
      {tools.length === 0 ? <p className="empty">{translate(locale, "emptyFavorites")}</p> : null}
      <div className="grid gap-3 md:grid-cols-2">
        {tools.map((tool) => (
          <ToolCard key={tool.meta.id} tool={tool} favorite onOpen={() => void navigate({ name: "tool", toolId: tool.meta.id })} onToggleFavorite={() => void toggleFavorite(tool.meta.id)} />
        ))}
      </div>
    </div>
  );
}
