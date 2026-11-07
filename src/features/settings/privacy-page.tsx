// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { translate } from "@/lib/i18n";
import { usePreferencesStore } from "@/stores/preferences-store";

export function PrivacyPage() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const info = usePreferencesStore((state) => state.info);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
      <header>
        <h1 className="type-display">{translate(locale, "privacy")}</h1>
        <p className="type-meta mt-1">{translate(locale, "privacyLead")}</p>
      </header>
      <section className="panel grid gap-2 p-3 text-sm">
        <h2 className="type-title">{translate(locale, "onDevice")}</h2>
        <p>{translate(locale, "localTrust")}</p>
        <p>{translate(locale, "localRetention")}</p>
      </section>
      <section className="panel grid gap-2 p-3 text-sm">
        <h2 className="type-title">{translate(locale, "noTelemetry")}</h2>
        <p>{translate(locale, "noTelemetryBody")}</p>
        <p className="type-meta">{translate(locale, "privacyStorage")}</p>
        {info?.path ? <p className="mono text-xs">{info.path}</p> : null}
        <p className="type-meta">{info?.backend ?? ""} · {translate(locale, "privacyNote")}</p>
      </section>
    </div>
  );
}
