// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { ToolWorkspace } from "@/components/tools/tool-workspace";
import { useSessionStore } from "@/stores/session-store";
import { findProfile } from "./catalog";

export function UnavailableToolPage() {
  const route = useSessionStore((state) => state.route);
  const tool = route.name === "tool" ? findProfile(route.toolId) : undefined;
  if (!tool) return <p className="text-sm text-subtle">This tool is not in the registry.</p>;
  return (
    <ToolWorkspace tool={tool}>
      <section className="rounded-lg border border-line bg-elevated p-4">
        <h2 className="text-sm font-semibold">Not implemented</h2>
        <p className="mt-2 max-w-2xl text-sm text-subtle">
          {tool.meta.unavailableReason} There is no run action on this page.
        </p>
      </section>
    </ToolWorkspace>
  );
}
