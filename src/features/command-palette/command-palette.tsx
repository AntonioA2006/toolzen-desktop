// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import * as Dialog from "@radix-ui/react-dialog";
import { useEffect, useMemo, useRef, useState } from "react";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useUiStore } from "@/stores/ui-store";
import { CATEGORIES } from "@/tools/categories";
import { toolRegistry } from "@/tools/registry";
import type { AppRoute } from "@/types/route";

interface Command {
  id: string;
  group: string;
  label: string;
  hint: string;
  run: () => void;
}

export function CommandPalette() {
  const open = useUiStore((state) => state.paletteOpen);
  const setOpen = useUiStore((state) => state.setPaletteOpen);
  const navigate = usePreferencesStore((state) => state.navigate);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  const theme = usePreferencesStore((state) => state.preferences.theme);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands = useMemo<Command[]>(() => {
    const go = (route: AppRoute) => () => {
      void navigate(route);
      setOpen(false);
    };
    const navigation: Command[] = [
      { id: "home", group: "Navigate", label: "Home", hint: "Dashboard", run: go({ name: "home" }) },
      { id: "tools", group: "Navigate", label: "All tools", hint: "Explorer", run: go({ name: "tools" }) },
      { id: "favorites", group: "Navigate", label: "Favorites", hint: "Starred tools", run: go({ name: "favorites" }) },
      { id: "recent", group: "Navigate", label: "Recent", hint: "Opened tools", run: go({ name: "recent" }) },
      { id: "settings", group: "Navigate", label: "Settings", hint: "Preferences", run: go({ name: "settings" }) },
      { id: "about", group: "Navigate", label: "About", hint: "Version and license", run: go({ name: "about" }) },
      { id: "privacy", group: "Navigate", label: "Privacy", hint: "Local data", run: go({ name: "privacy" }) },
      ...CATEGORIES.map((category) => ({
        id: `category-${category.id}`,
        group: "Categories",
        label: category.name,
        hint: "Category",
        run: go({ name: "category", category: category.id }),
      })),
    ];
    const tools = toolRegistry.list().map((tool) => ({
      id: `tool-${tool.meta.id}`,
      group: "Tools",
      label: tool.meta.name,
      hint: tool.meta.availability === "available" ? tool.meta.description : "Unavailable",
      run: go({ name: "tool", toolId: tool.meta.id }),
    }));
    const actions: Command[] = [
      {
        id: "theme",
        group: "Actions",
        label: theme === "dark" ? "Switch theme to light" : "Switch theme to dark",
        hint: "Appearance",
        run: () => {
          void updatePreferences({ theme: theme === "dark" ? "light" : "dark" });
          setOpen(false);
        },
      },
    ];
    return [...navigation, ...tools, ...actions];
  }, [navigate, setOpen, theme, updatePreferences]);

  const filtered = commands.filter((command) => `${command.label} ${command.hint} ${command.group}`.toLowerCase().includes(query.trim().toLowerCase()));
  const current = filtered[Math.min(active, Math.max(filtered.length - 1, 0))];

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
  }, [open]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40" />
        <Dialog.Content
          className="fixed top-[18%] left-1/2 z-50 w-[min(560px,calc(100%-2rem))] -translate-x-1/2 rounded-lg border border-line bg-elevated shadow-sm"
          aria-describedby={undefined}
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            inputRef.current?.focus();
          }}
        >
          <Dialog.Title className="sr-only">Command palette</Dialog.Title>
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(0);
            }}
            placeholder="Search tools and actions"
            className="h-11 w-full border-b border-line bg-transparent px-3 text-sm outline-none"
            aria-controls="command-list"
            aria-activedescendant={current ? `command-${current.id}` : undefined}
            onKeyDown={(event) => {
              if (event.key === "ArrowDown") {
                event.preventDefault();
                setActive((value) => Math.min(value + 1, Math.max(filtered.length - 1, 0)));
              } else if (event.key === "ArrowUp") {
                event.preventDefault();
                setActive((value) => Math.max(value - 1, 0));
              } else if (event.key === "Enter" && current) {
                event.preventDefault();
                current.run();
              }
            }}
          />
          <ul id="command-list" role="listbox" aria-label="Commands" className="max-h-80 overflow-auto p-1">
            {filtered.length === 0 ? <li className="px-3 py-6 text-center text-sm text-subtle">No matching commands.</li> : null}
            {filtered.map((command, index) => (
              <li key={command.id}>
                <button
                  id={`command-${command.id}`}
                  type="button"
                  role="option"
                  aria-selected={index === active}
                  className={`flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm ${index === active ? "bg-muted" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => command.run()}
                >
                  <span>{command.label}</span>
                  <span className="text-xs text-faint">{command.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
