// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { ReactNode } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { categoryById } from "@/tools/categories";
import type { ToolProfile } from "@/tools/types";
import { usePreferencesStore } from "@/stores/preferences-store";

export function ToolWorkspace({
  tool,
  children,
}: {
  tool: ToolProfile;
  children: ReactNode;
}) {
  const mode = usePreferencesStore((state) => state.preferences.executionMode);
  const category = categoryById(tool.meta.category);
  const modeCopy =
    mode === "auto"
      ? "Automatic is local in this release. No cloud provider is registered."
      : "Local execution. Input stays in this window.";
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <PageHeader
        title={tool.meta.name}
        description={tool.meta.description}
        crumbs={[
          { label: "All tools", route: { name: "tools" } },
          { label: category.name, route: { name: "category", category: category.id } },
          { label: tool.meta.name },
        ]}
      />
      <div className="flex flex-wrap gap-1.5">
        <Badge>{tool.meta.availability === "available" ? "Available" : "Unavailable"}</Badge>
        <Badge>Processing: local</Badge>
        <Badge>{mode === "auto" ? "Mode: automatic" : "Mode: local"}</Badge>
      </div>
      <p className="text-sm text-subtle">{modeCopy}</p>
      {children}
    </div>
  );
}

export function ResultBlock({ title, value, error }: { title: string; value: string | null; error: string | null }) {
  return (
    <section className="rounded-lg border border-line bg-elevated p-4" aria-live="polite">
      <h2 className="text-sm font-semibold">{title}</h2>
      {error ? <p className="mt-3 text-sm text-danger">{error}</p> : null}
      {!error && value === null ? <p className="mt-3 text-sm text-subtle">No result yet. Run the tool to produce one.</p> : null}
      {value !== null && !error ? <pre className="mt-3 overflow-auto rounded-md border border-line bg-canvas p-3 font-mono text-[13px] leading-6 whitespace-pre-wrap">{value}</pre> : null}
    </section>
  );
}
