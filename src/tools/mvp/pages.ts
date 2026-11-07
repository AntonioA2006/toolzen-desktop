// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

const RANGE = /^\d+(?:-\d+)?$/;

/** Accepts the same comma-separated page syntax the reference qpdf tools require. */
export function parsePageSpec(raw: string): { ok: true; spec: string } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (trimmed.length === 0) return { ok: false, message: "At least one page range is required." };
  if (trimmed.length > 200) return { ok: false, message: "Page range is too long." };
  const parts = trimmed.split(",").map((part) => part.trim());
  if (parts.some((part) => part.length === 0 || !RANGE.test(part))) {
    return { ok: false, message: "Use pages like 1 or 3-5, separated by commas." };
  }
  const specs = parts.map((part) => {
    const [start, end] = part.split("-");
    const from = Number(start);
    const to = end === undefined ? from : Number(end);
    if (from < 1 || to < from) return null;
    return end === undefined ? String(from) : `${from}-${to}`;
  });
  if (specs.some((spec) => spec === null)) return { ok: false, message: "Page ranges must start at 1 and not run backwards." };
  const unique = new Set(specs);
  if (unique.size !== specs.length) return { ok: false, message: "Page ranges must be unique." };
  if (specs.length > 20) return { ok: false, message: "Too many page ranges." };
  return { ok: true, spec: specs.join(",") };
}
