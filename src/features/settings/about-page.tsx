// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { useState } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { APP_IDENTIFIER, APP_VERSION, COPYRIGHT_NOTICE, LICENSE_SPDX, LICENSE_URL, REPOSITORY_URL, WEBSITE_URL } from "@/lib/app-info";
import { translate } from "@/lib/i18n";
import { openAllowedUrl } from "@/services/links";
import { usePreferencesStore } from "@/stores/preferences-store";

export function AboutPage() {
  const locale = usePreferencesStore((state) => state.preferences.language);
  const [message, setMessage] = useState<string | null>(null);

  async function open(url: typeof WEBSITE_URL) {
    const result = await openAllowedUrl(url);
    setMessage(result.message);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-5">
      <PageHeader title={translate(locale, "about")} description={translate(locale, "aboutLead")} />
      <dl className="grid gap-3 text-sm">
        <div><dt className="text-faint">Version</dt><dd>{APP_VERSION}</dd></div>
        <div><dt className="text-faint">Identifier</dt><dd className="font-mono text-xs">{APP_IDENTIFIER}</dd></div>
        <div><dt className="text-faint">License</dt><dd>{LICENSE_SPDX}. {COPYRIGHT_NOTICE}.</dd></div>
      </dl>
      <p className="max-w-2xl text-sm text-subtle">You can use, modify, and distribute this project, including for commercial use, under the Apache License 2.0. Keep the applicable copyright and license notices. The license includes a patent grant that ends if you file litigation claiming the work infringes a patent. The names ToolZen and tools-zen.com are not granted as trademarks by the license.</p>
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => void open(WEBSITE_URL)}>{translate(locale, "openWebsite")}</Button>
        <Button onClick={() => void open(REPOSITORY_URL)}>{translate(locale, "openRepository")}</Button>
        <Button onClick={() => void open(LICENSE_URL)}>{translate(locale, "openLicense")}</Button>
      </div>
      {message ? <p className="text-sm text-subtle">{message}</p> : null}
    </div>
  );
}
