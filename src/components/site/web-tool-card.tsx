// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Class names follow resources/views/components/tool-card.blade.php at b600a8d.

import { toolCopy } from "@/lib/catalog-copy";
import { translate, type Locale } from "@/lib/i18n";
import type { AnyToolDefinition } from "@/tools/types";
import { Glyph } from "./glyph";
import { SiteIcon } from "./icon";

export function WebToolCard({ tool, locale, featured = false, onOpen }: { tool: AnyToolDefinition; locale: Locale; featured?: boolean; onOpen: () => void }) {
  const copy = toolCopy(locale, tool.meta.id);
  const unavailable = tool.meta.availability !== "available";
  const tone = tool.meta.category === "conversion" ? "conversion" : tool.meta.category === "image" ? "image" : tool.meta.category === "ocr" ? "ocr" : "pdf";
  return (
    <button type="button" className={`tool-card${featured ? " tool-card-featured" : ""}`} onClick={onOpen}>
      <Glyph icon={tool.meta.icon} tone={tone} />
      <span className="tool-card-head">
        <span className="tool-card-meta">{unavailable ? translate(locale, "statusUnavailable") : featured ? translate(locale, "catLabel").replace("{id}", tone) : tone.toUpperCase()}</span>
        <h3>{copy.short}</h3>
      </span>
      <p>{copy.blurb}</p>
      {featured ? (
        <span className="tool-card-foot" aria-hidden="true">
          {unavailable ? translate(locale, "viewStatus") : translate(locale, "openTool")}
          <SiteIcon name="arrow-right" className="size-4" />
        </span>
      ) : (
        <span className="tool-card-go" aria-hidden="true"><SiteIcon name="arrow-right" className="size-4" /></span>
      )}
    </button>
  );
}
