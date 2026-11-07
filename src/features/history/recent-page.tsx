// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { toolCopy } from "@/lib/catalog-copy";
import { formatLocal } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { toolRegistry } from "@/tools/registry";

export function RecentPage() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const recent = usePreferencesStore((state) => state.recent);
  const navigate = usePreferencesStore((state) => state.navigate);
  const seen = new Set<string>();
  const entries = recent.filter((entry) => {
    if (seen.has(entry.toolId)) return false;
    seen.add(entry.toolId);
    return true;
  });
  return (
    <div className="flex w-full flex-col gap-5">
      <header>
        <h1 className="type-display">{translate(locale, "recent")}</h1>
        {entries.length === 0 ? <p className="type-body mt-2 text-subtle">{translate(locale, "emptyRecent")}</p> : null}
      </header>
      <ul className="divide-y divide-line overflow-hidden rounded-md border border-line">
        {entries.map((entry) => {
          const tool = toolRegistry.get(entry.toolId);
          return (
            <li key={entry.toolId}>
              <button type="button" className="row-btn min-h-12" onClick={() => void navigate({ name: "tool", toolId: entry.toolId })}>
                <span className="min-w-0 flex-1">
                  <span className="block type-title">{tool ? toolCopy(locale, tool.meta.id).short : entry.toolId}</span>
                  <span className="type-meta">{translate(locale, "recentHint")}</span>
                </span>
                <span className="type-meta shrink-0">{formatLocal(locale, entry.openedAt)}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
