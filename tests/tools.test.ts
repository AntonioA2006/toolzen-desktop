// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { describe, expect, it } from "vitest";
import { decodeBase64, encodeBase64, runBase64 } from "@/tools/base64/process";
import { validateBase64Input } from "@/tools/base64/validate";
import { formatJson, jsonErrorLocation } from "@/tools/json-formatter/process";
import { validateJsonFormatterInput } from "@/tools/json-formatter/validate";
import { formatUuid, generateUuids } from "@/tools/uuid-generator/process";
import { validateUuidGeneratorInput } from "@/tools/uuid-generator/validate";

describe("JSON formatter", () => {
  it("formats and reports byte length", () => {
    const result = formatJson({ source: '{"b":1,"a":2}', indent: 2 });
    expect(result.formatted).toBe('{\n  "b": 1,\n  "a": 2\n}');
    expect(result.byteLength).toBe(new TextEncoder().encode(result.formatted).byteLength);
  });

  it("rejects invalid JSON with a character position when the runtime provides one", () => {
    const result = validateJsonFormatterInput({ source: '{"a": }', indent: 2 });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors[0]?.message.length).toBeGreaterThan(0);
    expect(jsonErrorLocation("Unexpected token } in JSON at position 6")).toBe(6);
  });

  it("rejects an indent other than 2 or 4", () => {
    const result = validateJsonFormatterInput({ source: "{}", indent: 3 });
    expect(result.ok).toBe(false);
  });
});

describe("UUID generator", () => {
  it("sets the version and variant bits", () => {
    const bytes = new Uint8Array(16);
    const formatted = formatUuid(generateUuids({ count: 1, uppercase: false, hyphens: true }).uuids[0] ? parseUuid(generateUuids({ count: 1, uppercase: false, hyphens: true }).uuids[0] ?? "") : bytes, { uppercase: false, hyphens: true });
    expect(formatted[14]).toBe("4");
    expect(["8", "9", "a", "b"]).toContain(formatted[19]);
  });

  it("generates unique lowercase hyphenated ids and honors formatting", () => {
    const { uuids } = generateUuids({ count: 20, uppercase: false, hyphens: true });
    expect(new Set(uuids).size).toBe(20);
    for (const uuid of uuids) {
      expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    }
    const compact = generateUuids({ count: 1, uppercase: true, hyphens: false }).uuids[0] ?? "";
    expect(compact).toMatch(/^[0-9A-F]{32}$/);
    expect(compact.includes("-")).toBe(false);
  });

  it("rejects a count outside 1 to 100", () => {
    expect(validateUuidGeneratorInput({ count: 0, uppercase: false, hyphens: true }).ok).toBe(false);
    expect(validateUuidGeneratorInput({ count: 101, uppercase: false, hyphens: true }).ok).toBe(false);
  });
});

describe("Base64", () => {
  it("round-trips Unicode text", () => {
    for (const text of ["hello", "你好", "🙂", "a\u0000b", "line\nbreak"]) {
      expect(decodeBase64(encodeBase64(text, "standard"), "standard")).toBe(text);
      expect(decodeBase64(encodeBase64(text, "url"), "url")).toBe(text);
    }
  });

  it("rejects invalid input", () => {
    expect(validateBase64Input({ text: "@@@@", action: "decode", alphabet: "standard" }).ok).toBe(false);
    expect(validateBase64Input({ text: "abc", action: "decode", alphabet: "standard" }).ok).toBe(false);
    expect(validateBase64Input({ text: "a+b/", action: "decode", alphabet: "url" }).ok).toBe(false);
  });

  it("encodes through the pure function used by the local handler", () => {
    expect(runBase64({ text: "hi", action: "encode", alphabet: "standard" }).text).toBe("aGk=");
  });
});

function parseUuid(value: string): Uint8Array {
  const hex = value.replaceAll("-", "");
  const bytes = new Uint8Array(16);
  for (let index = 0; index < 16; index += 1) bytes[index] = Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16);
  return bytes;
}
