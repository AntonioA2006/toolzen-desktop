// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { Locale } from "@/lib/i18n";

/** Formats in the selected locale and the user's local timezone. No timezone is forced. */
export function formatLocal(locale: Locale, iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale === "es" ? "es" : "en", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function countReady(locale: Locale, count: number): string {
  if (locale === "es") return count === 1 ? "1 disponible" : `${count} disponibles`;
  return count === 1 ? "1 ready" : `${count} ready`;
}

export function countPartial(locale: Locale, count: number): string {
  if (locale === "es") return count === 1 ? "1 parcial" : `${count} parciales`;
  return count === 1 ? "1 partial" : `${count} partials`;
}

export function countUnavailable(locale: Locale, count: number): string {
  if (locale === "es") return count === 1 ? "1 no incluida" : `${count} no incluidas`;
  return count === 1 ? "1 not included" : `${count} not included`;
}

export function categoryAvailability(locale: Locale, ready: number, partial: number, unavailable: number): string {
  return `${countReady(locale, ready)} · ${countPartial(locale, partial)} · ${countUnavailable(locale, unavailable)}`;
}

export function base64Bytes(value: string): number {
  const padding = value.endsWith("==") ? 2 : value.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((value.length * 3) / 4) - padding);
}
