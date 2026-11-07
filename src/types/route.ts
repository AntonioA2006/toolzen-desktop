// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { CATEGORY_IDS, type CategoryId } from "@/tools/categories";

export type AppRoute =
  | { name: "home" }
  | { name: "tools" }
  | { name: "category"; category: CategoryId }
  | { name: "favorites" }
  | { name: "recent" }
  | { name: "settings" }
  | { name: "about" }
  | { name: "tool"; toolId: string };

const ROUTE_NAMES = new Set(["home", "tools", "category", "favorites", "recent", "settings", "about", "tool"]);

export function parseRoute(value: unknown): AppRoute | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  if (typeof record.name !== "string" || !ROUTE_NAMES.has(record.name)) return null;
  if (record.name === "category") {
    if (typeof record.category !== "string" || !(CATEGORY_IDS as readonly string[]).includes(record.category)) return null;
    return { name: "category", category: record.category as CategoryId };
  }
  if (record.name === "tool") {
    if (typeof record.toolId !== "string" || !/^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$/.test(record.toolId)) return null;
    return { name: "tool", toolId: record.toolId };
  }
  return { name: record.name as Exclude<AppRoute["name"], "category" | "tool"> };
}

export function routeKey(route: AppRoute): string {
  if (route.name === "category") return `category:${route.category}`;
  if (route.name === "tool") return `tool:${route.toolId}`;
  return route.name;
}
