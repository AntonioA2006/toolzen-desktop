// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { describe, expect, it } from "vitest";
import { jpegPagesToPdf } from "@/tools/mvp/pdf-images";
import { parsePageSpec } from "@/tools/mvp/pages";
import { MVP_TOOLS } from "@/tools/mvp/specs";

const JPEG = Uint8Array.from(atob("/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDABALDA4MChAODQ4SERATGCgaGBYWGDEjJR0oOjM9PDkzODdASFxOQERXRTc4UG1RV19iZ2hnPk1xeXBkeFxlZ2P/2wBDARESEhgVGC8aGi9jQjhCY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2NjY2P/wgARCAABAAEDASIAAhEBAxEB/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKp//9k="), (char) => char.charCodeAt(0));

describe("reference catalogue", () => {
  it("lists the twenty tools from the reference definitions and no developer examples", () => {
    expect(MVP_TOOLS).toHaveLength(20);
    expect(MVP_TOOLS.map((tool) => tool.id)).toContain("merge-pdf");
    expect(MVP_TOOLS.map((tool) => tool.id)).not.toContain("json-formatter");
    expect(MVP_TOOLS.map((tool) => tool.id)).not.toContain("uuid-generator");
    expect(MVP_TOOLS.map((tool) => tool.id)).not.toContain("base64");
  });

  it("rejects an empty page range", () => {
    expect(parsePageSpec("").ok).toBe(false);
    expect(parsePageSpec("1,3-5").ok).toBe(true);
  });

  it("builds a PDF that contains the JPEG bytes", () => {
    const pdf = jpegPagesToPdf([{ width: 1, height: 1, jpeg: JPEG }]);
    const text = new TextDecoder().decode(pdf);
    expect(text.startsWith("%PDF")).toBe(true);
    expect(pdf.includes(JPEG[0] ?? 0)).toBe(true);
  });
});
