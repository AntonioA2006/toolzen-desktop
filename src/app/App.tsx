// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useEffect } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { CommandPalette } from "@/features/command-palette/command-palette";
import { DashboardPage } from "@/features/dashboard/dashboard-page";
import { ExplorerPage } from "@/features/explorer/explorer-page";
import { FavoritesPage } from "@/features/favorites/favorites-page";
import { RecentPage } from "@/features/history/recent-page";
import { AboutPage } from "@/features/settings/about-page";
import { SettingsPage } from "@/features/settings/settings-page";
import { useMediaQuery } from "@/hooks/use-media-query";
import { ExecutionManager, localExecutionProvider, permissionManager, setExecutionManager } from "@/services/execution";
import { registerLocalToolHandlers } from "@/tools/register-handlers";
import { toolRegistry } from "@/tools/registry";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useSessionStore } from "@/stores/session-store";
import { useUiStore } from "@/stores/ui-store";
import { routeKey } from "@/types/route";

let booted = false;

function boot(): void {
  if (booted) return;
  booted = true;
  registerLocalToolHandlers();
  setExecutionManager(new ExecutionManager(toolRegistry, localExecutionProvider, permissionManager, null));
}

export function App() {
  boot();
  const hydrate = usePreferencesStore((state) => state.hydrate);
  const status = usePreferencesStore((state) => state.status);
  const error = usePreferencesStore((state) => state.error);
  const theme = usePreferencesStore((state) => state.preferences.theme);
  const route = useSessionStore((state) => state.route);
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);
  const paletteOpen = useUiStore((state) => state.paletteOpen);
  const narrow = useMediaQuery("(max-width: 960px)");
  const setSidebarCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (narrow) setSidebarCollapsed(true);
  }, [narrow, setSidebarCollapsed]);

  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const apply = () => {
      const resolved = theme === "system" ? (media.matches ? "dark" : "light") : theme;
      root.classList.toggle("dark", resolved === "dark");
      root.style.colorScheme = resolved;
    };
    apply();
    media.addEventListener("change", apply);
    return () => media.removeEventListener("change", apply);
  }, [theme]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    const titles: Record<string, string> = {
      home: "Home",
      tools: "All tools",
      favorites: "Favorites",
      recent: "Recent",
      settings: "Settings",
      about: "About",
    };
    const suffix = route.name === "tool" ? (toolRegistry.get(route.toolId)?.meta.name ?? "Tool") : route.name === "category" ? route.category : titles[route.name];
    document.title = `${suffix} · ToolZen`;
  }, [route]);

  return (
    <div className="flex h-full min-h-0 bg-canvas text-ink">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded focus:bg-elevated focus:px-3 focus:py-2">Skip to content</a>
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main" className="min-h-0 flex-1 overflow-auto px-6 py-6" key={routeKey(route)}>
          {status === "error" ? <p className="mb-4 text-sm text-danger">{error}</p> : null}
          {status === "loading" ? <p className="text-sm text-subtle">Loading local preferences.</p> : <RouteView />}
        </main>
      </div>
      <CommandPalette />
    </div>
  );
}

function RouteView() {
  const route = useSessionStore((state) => state.route);
  if (route.name === "home") return <DashboardPage />;
  if (route.name === "tools") return <ExplorerPage />;
  if (route.name === "category") return <ExplorerPage category={route.category} />;
  if (route.name === "favorites") return <FavoritesPage />;
  if (route.name === "recent") return <RecentPage />;
  if (route.name === "settings") return <SettingsPage />;
  if (route.name === "about") return <AboutPage />;
  const tool = toolRegistry.get(route.toolId);
  if (!tool) return <p className="text-sm text-subtle">That tool is not in the registry.</p>;
  const Page = tool.Component;
  return <Page />;
}
