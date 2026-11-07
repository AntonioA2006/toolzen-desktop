// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { create } from "zustand";
import { nowIso } from "@/lib/ids";
import { createPersistence } from "@/services/persistence";
import { permissionManager } from "@/services/execution";
import type { PersistencePort, PersistedState, StorageInfo, UserPreferences } from "@/services/persistence";
import type { AppRoute } from "@/types/route";
import { useSessionStore } from "./session-store";

interface PreferencesState {
  status: "loading" | "ready" | "error";
  preferences: UserPreferences;
  favorites: string[];
  recent: PersistedState["recent"];
  usage: PersistedState["usage"];
  info: StorageInfo | null;
  error: string | null;
  port: PersistencePort;
  hydrate: () => Promise<void>;
  updatePreferences: (patch: Partial<UserPreferences>) => Promise<void>;
  toggleFavorite: (toolId: string) => Promise<void>;
  recordOpen: (toolId: string) => Promise<void>;
  clearHistory: () => Promise<void>;
  clearFavorites: () => Promise<void>;
  resetPreferences: () => Promise<void>;
  resetAll: () => Promise<void>;
  navigate: (route: AppRoute, options?: { record?: boolean; persist?: boolean }) => Promise<void>;
}

function applyState(state: PersistedState, info: StorageInfo | null, port: PersistencePort): Partial<PreferencesState> {
  permissionManager.load(state.permissionGrants, state.permissionAudit);
  return {
    status: "ready",
    preferences: state.preferences,
    favorites: state.favorites,
    recent: state.recent,
    usage: state.usage,
    info,
    error: null,
    port,
  };
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  status: "loading",
  preferences: {
    theme: "dark",
    language: "en",
    startupPage: "home",
    executionMode: "local",
    lastRoute: null,
    aiRetentionOptIn: false,
    aiRetentionDays: null,
  },
  favorites: [],
  recent: [],
  usage: [],
  info: null,
  error: null,
  port: createPersistence(),
  hydrate: async () => {
    const port = get().port;
    try {
      const state = await port.load();
      const info = await port.info();
      set(applyState(state, info, port));
      useSessionStore.getState().setRoute(startupRoute(state.preferences));
    } catch (error) {
      set({ status: "error", error: error instanceof Error ? error.message : "Preferences could not be loaded." });
    }
  },
  updatePreferences: async (patch) => {
    const preferences = { ...get().preferences, ...patch };
    const state = await get().port.apply({ type: "setPreferences", preferences });
    set({ preferences: state.preferences, error: null });
  },
  toggleFavorite: async (toolId) => {
    const favorite = !get().favorites.includes(toolId);
    const state = await get().port.apply({ type: "setFavorite", toolId, favorite });
    set({ favorites: state.favorites });
  },
  recordOpen: async (toolId) => {
    const state = await get().port.apply({ type: "recordToolOpen", toolId, openedAt: nowIso() });
    set({ recent: state.recent, usage: state.usage });
  },
  clearHistory: async () => {
    const state = await get().port.apply({ type: "clearHistory" });
    set({ recent: state.recent, usage: state.usage });
  },
  clearFavorites: async () => {
    const state = await get().port.apply({ type: "clearFavorites" });
    set({ favorites: state.favorites });
  },
  resetPreferences: async () => {
    const state = await get().port.apply({ type: "resetPreferences" });
    set({ preferences: state.preferences });
  },
  resetAll: async () => {
    const state = await get().port.apply({ type: "resetAllLocalData" });
    const info = await get().port.info();
    set(applyState(state, info, get().port));
    useSessionStore.getState().setRoute({ name: "home" });
  },
  navigate: async (route, options) => {
    useSessionStore.getState().setRoute(route);
    if (options?.persist !== false) {
      await get().updatePreferences({ lastRoute: route });
    }
    if (options?.record !== false && route.name === "tool") await get().recordOpen(route.toolId);
  },
}));

function startupRoute(preferences: UserPreferences): AppRoute {
  if (preferences.startupPage === "tools") return { name: "tools" };
  if (preferences.startupPage === "last-tool" && preferences.lastRoute) return preferences.lastRoute;
  return { name: "home" };
}
