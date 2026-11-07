// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";
import { translate } from "@/lib/i18n";
import { shortcutLabel } from "@/lib/platform";
import { usePreferencesStore } from "@/stores/preferences-store";

export function SettingsPage() {
  const preferences = usePreferencesStore((state) => state.preferences);
  const info = usePreferencesStore((state) => state.info);
  const update = usePreferencesStore((state) => state.updatePreferences);
  const clearHistory = usePreferencesStore((state) => state.clearHistory);
  const clearFavorites = usePreferencesStore((state) => state.clearFavorites);
  const resetPreferences = usePreferencesStore((state) => state.resetPreferences);
  const resetAll = usePreferencesStore((state) => state.resetAll);
  const locale = preferences.language;
  const [message, setMessage] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  async function run(action: () => Promise<void>, success: string) {
    try {
      await action();
      setMessage(success);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : translate(locale, "changeFailed"));
    }
  }

  return (
    <div className="flex w-full max-w-3xl flex-col gap-6">
      <PageHeader title={translate(locale, "settings")} description={translate(locale, "settingsLead")} />
      <section className="grid gap-3">
        <h2 className="type-title">{translate(locale, "appearance")}</h2>
        <div>
          <Label htmlFor="theme">{translate(locale, "theme")}</Label>
          <Select id="theme" value={preferences.theme} onChange={(event) => void update({ theme: event.target.value as typeof preferences.theme })}>
            <option value="dark">{translate(locale, "dark")}</option>
            <option value="light">{translate(locale, "light")}</option>
            <option value="system">{translate(locale, "system")}</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="language">{translate(locale, "language")}</Label>
          <Select id="language" value={preferences.language} onChange={(event) => void update({ language: event.target.value === "es" ? "es" : "en" })}>
            <option value="en">English</option>
            <option value="es">Español</option>
          </Select>
        </div>
      </section>
      <section className="grid gap-3">
        <h2 className="type-title">{translate(locale, "startup")}</h2>
        <div>
          <Label htmlFor="startup">{translate(locale, "openTo")}</Label>
          <Select id="startup" value={preferences.startupPage} onChange={(event) => void update({ startupPage: event.target.value as typeof preferences.startupPage })}>
            <option value="home">{translate(locale, "openHome")}</option>
            <option value="tools">{translate(locale, "openTools")}</option>
            <option value="last-tool">{translate(locale, "openLast")}</option>
          </Select>
        </div>
      </section>
      <section className="grid gap-2">
        <h2 className="type-title">{translate(locale, "shortcuts")}</h2>
        <p className="type-body">{translate(locale, "shortcutPalette")} <span className="mono">{shortcutLabel()}</span></p>
      </section>
      <section className="grid gap-2">
        <h2 className="type-title">{translate(locale, "execution")}</h2>
        <p className="text-sm">{preferences.executionMode === "auto" ? translate(locale, "autoMode") : translate(locale, "localMode")}</p>
      </section>
      <section className="grid gap-2">
        <h2 className="type-title">{translate(locale, "storage")}</h2>
        <p className="text-sm text-subtle">{info?.note ?? translate(locale, "loading")}</p>
        {info?.path ? <p className="mono text-xs">{info.path}</p> : null}
        <p className="type-meta">{translate(locale, "storageCounts").replace("{backend}", info?.backend ?? "").replace("{schema}", String(info?.schemaVersion ?? "-")).replace("{favorites}", String(info?.favoriteCount ?? 0)).replace("{recent}", String(info?.recentCount ?? 0))}</p>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => void run(clearHistory, translate(locale, "historyCleared"))}>{translate(locale, "clearHistory")}</Button>
          <Button onClick={() => void run(clearFavorites, translate(locale, "favoritesCleared"))}>{translate(locale, "clearFavorites")}</Button>
          <Button onClick={() => void run(resetPreferences, translate(locale, "preferencesReset"))}>{translate(locale, "resetPreferences")}</Button>
          {confirmReset ? (
            <Button variant="danger" onClick={() => void run(async () => { await resetAll(); setConfirmReset(false); }, translate(locale, "metadataReset"))}>{translate(locale, "confirmReset")}</Button>
          ) : (
            <Button variant="danger" onClick={() => setConfirmReset(true)}>{translate(locale, "resetAll")}</Button>
          )}
        </div>
        {message ? <p className="text-sm" role="status">{message}</p> : null}
      </section>
    </div>
  );
}
