// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { PageHeader } from "@/components/layout/page-header";
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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
      <PageHeader title={translate(locale, "recent")} description={translate(locale, "emptyRecent")} />
      {entries.length === 0 ? <p className="empty">{translate(locale, "emptyRecent")}</p> : null}
      <ul className="divide-y divide-line rounded-lg border border-line">
        {entries.map((entry) => {
          const tool = toolRegistry.get(entry.toolId);
          return (
            <li key={entry.toolId}>
              <button type="button" className="flex w-full items-center justify-between px-3 py-3 text-left hover:bg-muted" onClick={() => void navigate({ name: "tool", toolId: entry.toolId })}>
                <span>
                  <span className="block text-sm font-medium">{tool?.meta.name ?? entry.toolId}</span>
                  <span className="block text-xs text-faint">Opened, not a record of what you processed.</span>
                </span>
                <span className="text-xs text-subtle">{new Date(entry.openedAt).toLocaleString()}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
