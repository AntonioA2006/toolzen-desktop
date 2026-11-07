// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { create } from "zustand";
import type { AppRoute } from "@/types/route";

interface SessionState {
  route: AppRoute;
  setRoute: (route: AppRoute) => void;
}

export const useSessionStore = create<SessionState>((set) => ({
  route: { name: "home" },
  setRoute: (route) => set({ route }),
}));
