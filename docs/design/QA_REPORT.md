<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# QA report

Scores are from this pass, after looking at the screenshots and the measurements below. They are not a certification. A 9 is not claimed.

| Area | Score | Why |
| --- | --- | --- |
| Identity | 8 | One wordmark, one accent, local Plus Jakarta Sans. No second title on home. |
| Dashboard | 8 | Descriptions instead of repeated Ready badges. Spanish heading, categories, and plurals match the registry. The last grid cell is empty because there are ten tools. |
| Navigation | 8 | Sidebar collapse, palette trap, and Enter/Escape were driven with key events. |
| Workspaces | 8 | Result replaces the form. Baseline option fields are present. Fixed 0.75 is text, not a new control. |
| Type and spacing | 8 | Measured 14/21 body, 24px heading, 14px section, 12px meta. Rows are at least 32px. |
| Accessibility | 7 | Focus ring, contrast, reduced motion, and keyboard traversal passed in Chrome. No screen reader. |
| Privacy | 8 | The privacy page matches local storage and the absence of an analytics client. |
| Desktop fit | 7 | Linux WebKitGTK rendered the redesign under Xvfb. Windows and macOS were not run. The native Save dialog was not clicked. |
| Icon | 7 | Runtime mark is separate. All 52 original bundle files match `main`. Dock behavior was not checked. |
| Overall | 8 | The defects from the previous review were fixed and rechecked. Platform coverage and the unclicked save dialog keep this under 9. |

## Commands after the edits

| Command | Result |
| --- | --- |
| `tsc --noEmit` | Passed. |
| `vitest run` | 10 files, 44 tests passed. Includes `tests/format.test.ts` and `tests/options.test.ts`. |
| `vite build` | Passed. The build emits Plus Jakarta Sans and JetBrains Mono woff2 files. |
| `cargo fmt --check` | Passed. |
| `cargo test --offline --lib` | 14 passed. |
| `cargo clippy --offline --lib -- -D warnings` | Passed. |

## Browser inventory

Chrome headless, `tests/redesign-pass3.mjs`, against the Vite dev server. Screenshots are tagged `browser-`.

| Case | Result |
| --- | --- |
| Font | `document.fonts.check('14px "Plus Jakarta Sans"')` true. JetBrains Mono true. Body 14px, line-height 21px, h1 24px. |
| Keyboard | Tab and Shift+Tab moved focus. First focused control was “Skip to content” with outline solid 2px `rgb(47, 95, 208)`. |
| Palette | Ctrl+K opened the dialog. Tab stayed inside it. Escape closed it. Enter on “Privacy” opened that page. |
| Sidebar | Collapse and expand both applied (`w-16`, then `w-60`). Shortest sidebar button was 32px. |
| Theme | `system` followed emulated `prefers-color-scheme` dark and light. Explicit light and dark were shot. |
| Reduced motion | With the media feature set, body transition duration was `0.00001s`. |
| Overflow | `scrollWidth` did not exceed the viewport at 960, 1280, or 1680. |
| Spanish home | “Tus herramientas, a mano”. No “sí funciona”. Subtitle does not advertise OCR. Conversión and Imagen are translated. “1 parcial” and “1 no incluida”, not “1 listas” or “1 parciales”. |
| Dates | Recent page in Spanish had no “AM” or “PM”. Formatter passes no `timeZone`. |
| Resize, crop, rotate | Labels present. Width `0` shows the “at least 1” error and the submit button stays disabled. |
| JPG to PDF | Up and down controls show when two images are chosen. |
| Unavailable | Compress PDF and OCR submit buttons are disabled. |
| Compress result | Form, including Select file, is gone. Input, output, and milliseconds are shown. Quality 0.75 is a sentence. One primary Save as, one secondary Change files. |
| Favorites and recent | Populated by starring a tool and opening tools. Empty copy is not shown once an entry exists. |
| Settings, privacy, about, palette | Shot in Spanish. |

Light contrast from `getComputedStyle`: ink on background 15.46:1, metadata `#5c6372` on `#f4f5f7` 5.53:1. Dark metadata `#8e96a6` on `#14161c` is 6.08:1 by the same formula. Sidebar muted `#a7adba` on `#1c1f26` is 7.33:1.

## Native

Linux only. `xvfb-run` with a 1280×800 screen, WebKitGTK 2.52.6, debug binary `src-tauri/target/debug/toolzen-desktop`, frontend `http://127.0.0.1:1420`. Isolated `HOME`. The process stayed alive. The window painted “Tools at hand” and the tool directory. Screenshot: `native-linux-light.png`. libEGL reported that DRI3 is unavailable and fell back; the window still painted. WebKitWebDriver is not installed, so clicks inside that window were not automated. Windows and macOS were not run.

## Screenshots

Browser: `browser-dashboard-es-light.png`, `browser-dashboard-es-dark.png`, `browser-explorer-es-dark.png`, `browser-result-es-light.png`, `browser-result-es-dark.png`, `browser-resize-es-dark.png`, `browser-crop-es-dark.png`, `browser-rotate-es-dark.png`, `browser-jpg-order-es-dark.png`, `browser-unavailable-es-dark.png`, `browser-favorites-es-dark.png`, `browser-recent-es-light.png`, `browser-settings-es-light.png`, `browser-privacy-es-light.png`, `browser-about-es-light.png`, `browser-palette-es-light.png`, `browser-palette-en-light.png`.

Native: `native-linux-light.png`.
