// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { AppRoute } from "@/types/route";
import { usePreferencesStore } from "@/stores/preferences-store";

export function PageHeader({
  title,
  description,
  crumbs,
}: {
  title: string;
  description?: string;
  crumbs?: readonly { label: string; route?: AppRoute }[];
}) {
  const navigate = usePreferencesStore((state) => state.navigate);
  return (
    <header className="flex flex-col gap-2">
      {crumbs && crumbs.length > 0 ? (
        <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 text-xs text-faint">
          {crumbs.map((crumb, index) => (
            <span key={`${crumb.label}-${index}`} className="flex items-center gap-1">
              {index > 0 ? <span aria-hidden="true">/</span> : null}
              {crumb.route ? (
                <button type="button" className="hover:text-ink" onClick={() => void navigate(crumb.route!)}>
                  {crumb.label}
                </button>
              ) : (
                <span className="text-subtle">{crumb.label}</span>
              )}
            </span>
          ))}
        </nav>
      ) : null}
      <h1 className="text-[22px] font-semibold tracking-tight">{title}</h1>
      {description ? <p className="max-w-2xl text-sm text-subtle">{description}</p> : null}
    </header>
  );
}
