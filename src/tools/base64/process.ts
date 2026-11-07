// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { ToolError } from "@/services/execution/local-provider";

export interface Base64Input {
  text: string;
  action: "encode" | "decode";
  alphabet: "standard" | "url";
}

export interface Base64Output {
  text: string;
}

export function runBase64(input: Base64Input): Base64Output {
  return { text: input.action === "encode" ? encodeBase64(input.text, input.alphabet) : decodeBase64(input.text, input.alphabet) };
}

export function encodeBase64(text: string, alphabet: Base64Input["alphabet"]): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const standard = btoa(binary);
  return alphabet === "url" ? standard.replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "") : standard;
}

export function decodeBase64(value: string, alphabet: Base64Input["alphabet"]): string {
  const compact = value.trim();
  if (compact.length === 0) return "";
  const standard = alphabet === "url" ? fromUrl(compact) : compact;
  if (!/^[A-Za-z0-9+/]*={0,2}$/.test(standard) || standard.length % 4 !== 0) {
    throw new ToolError("invalid_base64", "The text is not valid Base64.");
  }
  let binary: string;
  try {
    binary = atob(standard);
  } catch {
    throw new ToolError("invalid_base64", "The text is not valid Base64.");
  }
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ToolError("invalid_utf8", "Decoded bytes are not valid UTF-8.");
  }
}

function fromUrl(value: string): string {
  if (!/^[A-Za-z0-9_-]*$/.test(value)) throw new ToolError("invalid_base64", "The text is not valid URL-safe Base64.");
  const replaced = value.replaceAll("-", "+").replaceAll("_", "/");
  const padding = replaced.length % 4 === 0 ? "" : "=".repeat(4 - (replaced.length % 4));
  return replaced + padding;
}
