<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Design system

Tokens live in `src/styles/globals.css` on `:root` and `.dark`. Components use those tokens or the classes in that file (`.panel`, `.row-btn`, `.drop`, `.field-input`, `.status`, `.type-display`, `.type-title`, `.type-label`, `.type-body`, `.type-meta`).

Light background is `#f4f5f7`. Ink is `#1a1d24`. Metadata is `#5c6372`. Dark background is `#14161c`. Dark metadata is `#8e96a6`. Accent is `#2f5fd0` in light and `#8eaffa` in dark. Focus is a 2px solid outline in the focus token, offset 2px. Hover is a separate fill. There is no glow, glass, or gradient hero.

Type is Plus Jakarta Sans, loaded from the local `@fontsource` files, and JetBrains Mono for sizes and paths. Measured on the home route after the files loaded: body 14px with line-height 21px (1.5), page heading 24px, section label 14px semibold, metadata 12px. Field labels are 14px semibold. Spacing uses 4, 8, 12, 16, 24, and 32. Sidebar rows are at least 32px tall. A star or other compact control uses `shrink-0` so it does not take `width: 100%` from `.row-btn`.

Dates use `Intl.DateTimeFormat` with `es` or `en`, `dateStyle: "medium"`, and `timeStyle: "short"`. No `timeZone` option is passed, so the user's local zone is used. The app does not change the machine timezone.

Motion is color and border only. `prefers-reduced-motion: reduce` shortens animation and transition duration. Theme `system` follows `prefers-color-scheme`.

The dev server allows the real `node_modules` path so font files still load when `node_modules` is a symlink outside the project root. The production build emits the woff2 files into `dist/assets`.
