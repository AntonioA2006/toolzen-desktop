// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { Locale } from "@/lib/i18n";

export const LOCALE_RESOLVED_FLAG = "toolzen.locale-resolved";

/** First launch follows the OS language. An explicit choice is left alone. */
export function resolveLocale(navigatorLanguage: string, stored: Locale, alreadyResolved: boolean): Locale {
  if (alreadyResolved) return stored;
  const value = navigatorLanguage.toLowerCase();
  if (value.startsWith("es")) return "es";
  if (value.startsWith("en")) return "en";
  return stored;
}
