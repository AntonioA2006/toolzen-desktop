// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Markup matches resources/views/components/glyph.blade.php at b600a8d.

import { SiteIcon } from "./icon";

const TONES = new Set(["pdf", "image", "conversion", "ocr", "navy", "soft"]);

export function Glyph({ icon, tone = "pdf", size, className = "" }: { icon: string; tone?: string; size?: "sm" | "lg"; className?: string }) {
  const toneClass = `glyph-${TONES.has(tone) ? tone : "pdf"}`;
  const sizeClass = size === "lg" ? " glyph-lg" : size === "sm" ? " glyph-sm" : "";
  return (
    <span className={`glyph ${toneClass}${sizeClass} ${className}`.trim()} aria-hidden="true">
      <SiteIcon name={icon} className="size-6" />
    </span>
  );
}
