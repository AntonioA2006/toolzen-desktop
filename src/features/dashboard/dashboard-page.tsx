// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ReactNode } from "react";
import { Lock, Shield, WifiOff } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ToolCard } from "@/components/tools/tool-card";
import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";
import { CATEGORIES } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";

export function DashboardPage() {
  const usage = usePreferencesStore((state) => state.usage);
  const favorites = usePreferencesStore((state) => state.favorites);
  const recent = usePreferencesStore((state) => state.recent);
  const navigate = usePreferencesStore((state) => state.navigate);
  const toggleFavorite = usePreferencesStore((state) => state.toggleFavorite);
  const locale = usePreferencesStore((state) => state.preferences.language);
  const popular = toolRegistry.list().filter((tool) => ["merge-pdf", "compress-pdf", "word-to-pdf", "pdf-to-jpg", "compress-image", "image-to-text"].includes(tool.meta.id));
  const used = [...usage].sort((a, b) => b.openCount - a.openCount);
  const quick = used.length > 0 ? used.flatMap((item) => {
    const tool = toolRegistry.get(item.toolId);
    return tool ? [tool] : [];
  }).slice(0, 6) : popular;

  const distinctRecent = uniqueRecent(recent);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
      <PageHeader title="ToolZen" description={translate(locale, "appDescription")} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Indicator icon={<WifiOff className="size-4" />} title={translate(locale, "offline")} body={translate(locale, "offlineBody")} />
        <Indicator icon={<Lock className="size-4" />} title={translate(locale, "onDevice")} body={translate(locale, "onDeviceBody")} />
        <Indicator icon={<Shield className="size-4" />} title={translate(locale, "noTelemetry")} body={translate(locale, "noTelemetryBody")} />
      </div>
      <section>
        <h2 className="text-sm font-semibold">{used.length > 0 ? translate(locale, "usage") : translate(locale, "popular")}</h2>
        <p className="mt-1 text-sm text-subtle">{used.length > 0 ? translate(locale, "usageNote") : translate(locale, "popularNote")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {quick.map((tool) => (
            <ToolCard
              key={tool.meta.id}
              tool={tool}
              favorite={favorites.includes(tool.meta.id)}
              onOpen={() => void navigate({ name: "tool", toolId: tool.meta.id })}
              onToggleFavorite={() => void toggleFavorite(tool.meta.id)}
            />
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold">Categories</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              type="button"
              className="rounded-lg border border-line bg-elevated px-3 py-3 text-left hover:bg-muted"
              onClick={() => void navigate({ name: "category", category: category.id })}
            >
              <div className="text-sm font-medium">{category.name}</div>
              <div className="mt-1 text-xs text-subtle">{category.description}</div>
            </button>
          ))}
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold">Recent</h2>
        {distinctRecent.length === 0 ? (
          <p className="mt-2 text-sm text-subtle">No recent tools. Open a tool and it will appear here. Nothing is recorded until you do.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line rounded-lg border border-line">
            {distinctRecent.slice(0, 5).map((entry) => {
              const tool = toolRegistry.get(entry.toolId);
              return (
                <li key={entry.toolId}>
                  <button type="button" className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted" onClick={() => void navigate({ name: "tool", toolId: entry.toolId })}>
                    <span>{tool?.meta.name ?? entry.toolId}</span>
                    <span className="text-xs text-faint">Opened {new Date(entry.openedAt).toLocaleString()}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}

function Indicator({ icon, title, body }: { icon: ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-lg border border-line bg-elevated p-3">
      <div className="flex items-center gap-2 text-sm font-medium">{icon}{title}</div>
      <p className="mt-1 text-xs text-subtle">{body}</p>
    </div>
  );
}

function uniqueRecent(entries: readonly { toolId: string; openedAt: string }[]) {
  const seen = new Set<string>();
  const result: { toolId: string; openedAt: string }[] = [];
  for (const entry of entries) {
    if (seen.has(entry.toolId)) continue;
    seen.add(entry.toolId);
    result.push(entry);
  }
  return result;
}
