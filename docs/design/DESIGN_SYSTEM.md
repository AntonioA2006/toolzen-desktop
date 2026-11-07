<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Design system

Tokens live in `src/styles/globals.css` on `:root` and `.dark`. Components use the Tailwind names mapped from those tokens (`bg-canvas`, `text-ink`, `border-line`, `bg-accent`) or the small set of classes in that file (`.panel`, `.row-btn`, `.drop`, `.field-input`, `.status`, `.type-display`, `.type-title`, `.type-meta`).

Light background is `#f4f5f7`. Dark background is `#14161c`. Accent is `#2f5fd0` in light and `#8eaffa` in dark. Success, warning, and danger have soft backgrounds for status chips. Focus is a 2px outline. Hover and active are separate fills.

Type uses Plus Jakarta Sans for UI text and JetBrains Mono for paths and sizes. Display is 22px. Titles are 15px. Body is 14px. Labels and metadata are 12px. Spacing follows the 4px Tailwind scale.

Motion is color and border changes only. `prefers-reduced-motion: reduce` cuts transitions. There is no decorative glow, glass, or gradient hero.

No new dependency was added for this system. Buttons stay on the existing Radix slot and `class-variance-authority` helper.
