// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { PanelLeft } from "lucide-react";
import { LogoMark, Wordmark } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { translate } from "@/lib/i18n";
import { CATEGORIES, type ToolIconName } from "@/tools/categories";
import { ToolIcon } from "@/tools/icons";
import type { AppRoute } from "@/types/route";

const PRIMARY: readonly { key: "home" | "allTools" | "favorites" | "recent"; label: string; icon: ToolIconName; route: AppRoute }[] = [
  { key: "home", label: "Home", icon: "home", route: { name: "home" } },
  { key: "allTools", label: "All Tools", icon: "search", route: { name: "tools" } },
  { key: "favorites", label: "Favorites", icon: "star", route: { name: "favorites" } },
  { key: "recent", label: "Recent", icon: "clock", route: { name: "recent" } },
];

const SECONDARY: readonly { label: string; icon: ToolIconName; route: AppRoute }[] = [
  { label: "Settings", icon: "settings", route: { name: "settings" } },
  { label: "About", icon: "info", route: { name: "about" } },
];

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const toggle = useUiStore((state) => state.toggleSidebar);
  const route = useSessionStore((state) => state.route);
  const navigate = usePreferencesStore((state) => state.navigate);
  const locale = usePreferencesStore((state) => state.preferences.language);

  return (
    <aside className={cn("flex h-full shrink-0 flex-col border-r border-white/10 bg-sidebar text-white", collapsed ? "w-16" : "w-60")}>
      <div className={cn("flex h-14 items-center gap-2 px-3", collapsed && "justify-center")}>
        <span className="grid size-8 place-items-center rounded-lg bg-[linear-gradient(135deg,#1b5cf3,#22c9f2)] text-white">
          <LogoMark className="size-5" />
        </span>
        {collapsed ? null : <Wordmark />}
        <Button className={cn(!collapsed && "ml-auto")} variant="ghost" size="icon" aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"} onClick={toggle}>
          <PanelLeft className="size-4" />
        </Button>
      </div>
      <nav aria-label="Primary" className="flex flex-col gap-0.5 px-2">
        {PRIMARY.map((item) => (
          <NavButton key={item.key} label={translate(locale, item.key)} icon={item.icon} collapsed={collapsed} current={sameRoute(route, item.route)} onClick={() => void navigate(item.route)} />
        ))}
      </nav>
      <div className="mt-4 px-3 text-[11px] font-medium tracking-wide text-white/50 uppercase">{collapsed ? "" : translate(locale, "categories")}</div>
      <nav aria-label="Categories" className="mt-1 flex flex-col gap-0.5 px-2">
        {CATEGORIES.map((category) => {
          const target: AppRoute = { name: "category", category: category.id };
          return (
            <NavButton
              key={category.id}
              label={category.name}
              icon={category.icon}
              collapsed={collapsed}
              current={sameRoute(route, target)}
              onClick={() => void navigate(target)}
            />
          );
        })}
      </nav>
      <div className="mt-auto flex flex-col gap-0.5 px-2 pb-3">
        {SECONDARY.map((item) => (
          <NavButton key={item.label} {...item} collapsed={collapsed} current={sameRoute(route, item.route)} onClick={() => void navigate(item.route)} />
        ))}
      </div>
    </aside>
  );
}

function NavButton({
  label,
  icon,
  collapsed,
  current,
  onClick,
}: {
  label: string;
  icon: ToolIconName;
  collapsed: boolean;
  current: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-current={current ? "page" : undefined}
      title={collapsed ? label : undefined}
      className={cn(
        "flex h-8 items-center gap-2 rounded-md px-2 text-left text-sm text-[#b9c8e8] hover:bg-white/10 hover:text-white",
        current && "bg-white/10 text-white",
        collapsed && "justify-center px-0",
      )}
      onClick={onClick}
    >
      <ToolIcon name={icon} className="size-4 shrink-0" />
      {collapsed ? <span className="sr-only">{label}</span> : <span className="truncate">{label}</span>}
    </button>
  );
}

function sameRoute(left: AppRoute, right: AppRoute): boolean {
  if (left.name !== right.name) return false;
  if (left.name === "category" && right.name === "category") return left.category === right.category;
  if (left.name === "tool" && right.name === "tool") return left.toolId === right.toolId;
  return true;
}
