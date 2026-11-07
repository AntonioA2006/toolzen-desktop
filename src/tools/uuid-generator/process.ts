// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export interface UuidGeneratorInput {
  count: number;
  uppercase: boolean;
  hyphens: boolean;
}

export interface UuidGeneratorOutput {
  uuids: string[];
}

export function generateUuids(input: UuidGeneratorInput): UuidGeneratorOutput {
  return { uuids: Array.from({ length: input.count }, () => formatUuid(randomUuidBytes(), input)) };
}

export function randomUuidBytes(): Uint8Array {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  return bytes;
}

export function formatUuid(bytes: Uint8Array, options: Pick<UuidGeneratorInput, "uppercase" | "hyphens">): string {
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  const canonical = `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  const value = options.hyphens ? canonical : canonical.replaceAll("-", "");
  return options.uppercase ? value.toUpperCase() : value;
}
