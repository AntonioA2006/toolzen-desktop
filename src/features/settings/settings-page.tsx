// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import { IMPLEMENTED_LOCALES } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";

export function SettingsPage() {
  const preferences = usePreferencesStore((state) => state.preferences);
  const info = usePreferencesStore((state) => state.info);
  const update = usePreferencesStore((state) => state.updatePreferences);
  const clearHistory = usePreferencesStore((state) => state.clearHistory);
  const clearFavorites = usePreferencesStore((state) => state.clearFavorites);
  const resetPreferences = usePreferencesStore((state) => state.resetPreferences);
  const resetAll = usePreferencesStore((state) => state.resetAll);
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function run(action: () => Promise<void>, success: string) {
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "The change failed.");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8">
      <PageHeader title="Settings" description="Preferences are stored locally. Browser preview uses localStorage and says so. The desktop app uses SQLite." />
      <section className="grid gap-4">
        <h2 className="text-sm font-semibold">Appearance</h2>
        <div>
          <Label htmlFor="theme">Theme</Label>
          <Select id="theme" value={preferences.theme} onChange={(event) => void update({ theme: event.target.value as typeof preferences.theme })}>
            <option value="dark">Dark</option>
            <option value="light">Light</option>
            <option value="system">System</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="language">Language</Label>
          <Select id="language" value={preferences.language} onChange={() => undefined}>
            {IMPLEMENTED_LOCALES.map((locale) => (
              <option key={locale} value={locale}>English</option>
            ))}
          </Select>
          <p className="mt-1 text-xs text-faint">No other languages are shipped. The selector only lists catalogs that exist.</p>
        </div>
      </section>
      <section className="grid gap-4">
        <h2 className="text-sm font-semibold">Startup</h2>
        <div>
          <Label htmlFor="startup">Open to</Label>
          <Select id="startup" value={preferences.startupPage} onChange={(event) => void update({ startupPage: event.target.value as typeof preferences.startupPage })}>
            <option value="home">Home</option>
            <option value="tools">All tools</option>
            <option value="last-tool">Last opened page</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="autostart">Launch at login</Label>
          <Select id="autostart" value="unavailable" disabled>
            <option value="unavailable">Not implemented</option>
          </Select>
          <p className="mt-1 text-xs text-faint">ToolZen does not register an operating-system autostart entry.</p>
        </div>
      </section>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Execution</h2>
        <fieldset className="grid gap-2">
          <legend className="text-xs font-medium text-subtle">Preferred mode</legend>
          <label className="flex items-start gap-2 text-sm"><input type="radio" name="mode" checked={preferences.executionMode === "local"} onChange={() => void update({ executionMode: "local" })} /> Local. Runs on this device.</label>
          <label className="flex items-start gap-2 text-sm text-faint"><input type="radio" name="mode" disabled /> Cloud. Unavailable. No provider is registered, and selecting it is disabled.</label>
          <label className="flex items-start gap-2 text-sm"><input type="radio" name="mode" checked={preferences.executionMode === "auto"} onChange={() => void update({ executionMode: "auto" })} /> Automatic. Uses local execution until a cloud provider exists. It does not send work remotely.</label>
        </fieldset>
      </section>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Foundations not in the interface</h2>
        <p className="text-sm text-subtle">Workflow definitions and an AI planning contract exist in the codebase. There is no workflow editor and no assistant. Turning on AI retention does not start a model, a chat, or a network client.</p>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={preferences.aiRetentionOptIn} onChange={(event) => void update({ aiRetentionOptIn: event.target.checked })} />
          <span>Allow future AI conversation storage on this device. Default is off. No messages are created by this control.</span>
        </label>
      </section>
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Local data</h2>
        <p className="text-sm text-subtle">{info?.note ?? "Storage information is not available yet."}</p>
        {info?.path ? <p className="font-mono text-xs text-faint">{info.path}</p> : null}
        <p className="text-xs text-faint">Backend: {info?.backend ?? "unknown"}. Schema {info?.schemaVersion ?? "-"}. Favorites {info?.favoriteCount ?? 0}. Recent rows {info?.recentCount ?? 0}. Workflows {info?.workflowCount ?? 0}.</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void run(clearHistory, "History cleared.")}>Clear history</Button>
          <Button onClick={() => void run(clearFavorites, "Favorites cleared.")}>Clear favorites</Button>
          <Button onClick={() => void run(resetPreferences, "Preferences reset.")}>Reset preferences</Button>
          {confirmReset ? (
            <Button variant="danger" onClick={() => void run(async () => { await resetAll(); setConfirmReset(false); }, "Local metadata reset.")}>Confirm reset of local metadata</Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>Reset all local metadata</Button>
          )}
        </div>
        {message ? <p className="text-sm text-subtle">{message}</p> : null}
      </section>
      <section className="grid gap-2">
        <h2 className="text-sm font-semibold">Privacy</h2>
        <p className="text-sm text-subtle">ToolZen does not upload tool inputs, file contents, or history payloads. History stores tool ids and timestamps only. See the privacy document in the repository for the permission split between the app and Tauri.</p>
      </section>
    </div>
  );
}
