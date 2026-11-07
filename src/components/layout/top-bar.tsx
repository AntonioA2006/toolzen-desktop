// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Monitor, Moon, Search, Sun } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translate } from "@/lib/i18n";
import { shortcutLabel } from "@/lib/platform";
import { usePreferencesStore } from "@/stores/preferences-store";
import { useUiStore } from "@/stores/ui-store";
import type { ThemePreference } from "@/services/persistence";

export function TopBar() {
  const setPaletteOpen = useUiStore((state) => state.setPaletteOpen);
  const theme = usePreferencesStore((state) => state.preferences.theme);
  const locale = usePreferencesStore((state) => state.preferences.language);
  const updatePreferences = usePreferencesStore((state) => state.updatePreferences);
  return (
    <header className="flex h-14 items-center gap-3 border-b border-line px-4">
      <button
        type="button"
        className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-line bg-elevated px-3 text-left text-sm text-faint"
        onClick={() => setPaletteOpen(true)}
      >
        <Search className="size-4" aria-hidden="true" />
        <span className="truncate">{translate(locale, "search")}</span>
        <kbd className="ml-auto rounded border border-line px-1.5 py-0.5 font-sans text-[11px] text-subtle">{shortcutLabel()}</kbd>
      </button>
      <DropdownMenu.Root>
        <DropdownMenu.Trigger asChild>
          <Button variant="ghost" size="icon" aria-label={`Theme: ${theme}`}>
            {theme === "light" ? <Sun className="size-4" /> : theme === "dark" ? <Moon className="size-4" /> : <Monitor className="size-4" />}
          </Button>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content className="z-50 min-w-40 rounded-md border border-line bg-elevated p-1 shadow-sm" align="end" sideOffset={6}>
            <ThemeItem value="dark" current={theme} label="Dark" onSelect={() => void updatePreferences({ theme: "dark" })} />
            <ThemeItem value="light" current={theme} label="Light" onSelect={() => void updatePreferences({ theme: "light" })} />
            <ThemeItem value="system" current={theme} label="System" onSelect={() => void updatePreferences({ theme: "system" })} />
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}

function ThemeItem({ label, value, current, onSelect }: { label: string; value: ThemePreference; current: ThemePreference; onSelect: () => void }) {
  return (
    <DropdownMenu.Item
      className="flex cursor-pointer items-center justify-between rounded px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-muted"
      onSelect={onSelect}
    >
      <span>{label}</span>
      {current === value ? <span className="text-xs text-faint">Current</span> : null}
    </DropdownMenu.Item>
  );
}
