// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { messages, type MessageKey } from "./en";

/** Locales with a shipped catalog. Adding a language means adding a catalog, not a label. */
export const IMPLEMENTED_LOCALES = ["en"] as const;
export type Locale = (typeof IMPLEMENTED_LOCALES)[number];

const catalogs: Record<Locale, Record<MessageKey, string>> = {
  en: messages,
};

export function translate(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key];
}

export function isImplementedLocale(value: string): value is Locale {
  return (IMPLEMENTED_LOCALES as readonly string[]).includes(value);
}
