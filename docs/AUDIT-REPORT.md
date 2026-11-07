<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Audit report

Date: 2026-11-07 UTC. Repository: AntonioA2006/toolzen-desktop.

Pull requests 1 and 2 are already merged. Pull request 3 (`https://github.com/AntonioA2006/toolzen-desktop/pull/3`, head `2cef3113e37c79ef7c59b26eb3fe01a7f81efb5d`) is the open consolidation branch. **It does not contain this phase 2 validation.** These notes live only in the local worktree `/tmp/toolzen-phase2`. Nothing from this pass was pushed, and no release was published.

**Distribution status: NOT READY.** There is no Windows installer and no clean-Windows install log.

## Ten enabled tools

Ready means the catalogue marks the tool ready and this build can run it without an external program. Split PDF stays partial. Nine tools stay visible and unavailable.

| Tool | Operations | Status before this pass | Tests that already existed | Tests added and executed | Expected | Actual |
| --- | --- | --- | --- | --- | --- | --- |
| merge-pdf | Join 2–20 PDFs | lopdf in process | Rust: merged page count is 2 | Same test, re-run. Malformed pair returns `not_pdf` | 2 pages, `%PDF` output | Pass. `get_pages().len() == 2` |
| extract-pdf-pages | Keep a page list | Implemented, no separate test | None for page count | Rust: page `2` of a 2-page file | 1 page remains, MediaBox still an array | Pass |
| delete-pdf-pages | Remove a page list | Rust: delete page 1 leaves 1 | That test | Re-run, plus deleting the only page | One page left; deleting every page errors | Pass. `delete_all` when the only page is removed. Page `9` of a 1-page file returns `pages` |
| rotate-pdf | 90 / 180 / 270, optional pages | Implemented, no Rotate assertion | None | Rust: rotation 90 | `/Rotate` integer 90 | Pass for 90. 180 and 270 were not given their own cases |
| compress-image | Re-encode one image at canvas quality 0.75 | One earlier browser compress | Not repeated after i18n | Chrome on the worktree app, 8×8 PNG | Same pixel size, a real image file | PNG 8×8 RGBA, 111 bytes. Shrink is not guaranteed |
| resize-image | Fit inside max width and height, no enlarge | Canvas, no fixture | None | Chrome: 8×8 into 4×4. Width 0 rejected | 4×4 image. 0 rejected | `4 4`. Error `Width and height must be at least 1.` |
| crop-image | Pixel rectangle | Canvas, no fixture | None | Chrome: x0 y0 w2 h2 of an 8×8 image with a red origin pixel | 2×2, origin pixel red | `2 2 255 0 0`. A 100×100 crop errors `does not fit inside the image` |
| webp-converter | PNG or JPEG to WebP | Canvas, no fixture | None | Chrome on the 8×8 PNG | RIFF/WebP file | `RIFF`, 574 bytes, name ends in `.webp` |
| remove-image-metadata | Re-encode so EXIF is dropped | Canvas, no fixture | None | Chrome. Source JPEG contained `Exif` (755 bytes) | No `Exif` in the output | Output 797 bytes, no `Exif` marker. File grew |
| jpg-to-pdf | One or more images, page size equals pixels | Canvas plus a small PDF writer | None on a real file | Chrome, one 8×8 JPEG | `%PDF` with a JPEG stream and an 8×8 page | `pdfinfo`: 1 page, 8×8 pts. Bytes include a JPEG SOI. Multiple images were not run |

## Edge behavior that was executed

- Compress image with no file: `Use 1 to 1 files.` No download.
- Text renamed to `.png`: `That file is not a readable image.`
- Empty file: `A selected file is empty.` No download.
- Merge of two non-PDF payloads: `not_pdf`.
- Empty base64 on rotate (rotation 90 supplied): `not_pdf` or `file_data`. The assertion accepts either; the run passed.
- Base64 longer than 25 MiB × 2: `file_too_large` before decode.
- Compress PDF in Chrome: the card says Unavailable, the button is `View status`, and the run button is disabled.
- Rust `compress-pdf`: `not_in_this_build:compress-pdf`, no output file.

## Not executed

- A browser upload at the 25 MB limit. The execution manager rejects an oversized JSON payload in `tests/execution.test.ts` (`input_too_large` when the result is an error). That is not a 25 MB image through the file control.
- Resize above the source size. The code uses `Math.min(scale, 1)`, matching the label “maximum size”. No enlarge fixture was run.
- JPG to PDF with more than one image.
- Rotate 180 and 270 as separate cases.
- A dedicated split-PDF two-range test. Split is still one PDF, not one file per group.
- ESLint. The project has no ESLint config.
- `npm run tauri build` for an installer.
- Any Windows install.

## Native application

Environment: Linux, Xvfb, WebKitGTK 2.52.6, debug binary `src-tauri/target/debug/toolzen-desktop` built with `cargo build --offline --bin toolzen-desktop`. This is not a Windows WebView2 run, and it is not an install test.

What happened:

- A first launch attached to port 1420 while an older `vite preview` of the published tree was still bound there. That screenshot is not phase 2 evidence. The preview was stopped, and the worktree dev server was bound to 1420.
- The relaunch loaded the worktree UI. Compress PDF showed Unavailable and View status. Merge PDF and Compress image showed Open. Screenshot: `native-phase2-light.png` in the artifact set.
- Rust `setup` created `toolzen.sqlite` (preferences, favorites, recent, workflows, AI, permissions). A fresh database now stores theme `light`, language `en`, execution mode `local`. The previous SQL seed was `dark`, which made the first native window dark while the browser store defaulted to light. The seed and `default_preferences()` now use `light`. Databases that already had a row are left as they are.
- `xdotool` could not activate the window (`_NET_ACTIVE_WINDOW` unsupported under Xvfb). A click landed on Recent, which correctly says nothing is stored until a tool is opened.
- `WebKitWebDriver` is not installed. File selection inside the native window was not automated, so frontend `invoke("run_engine")` was **not** observed. Cargo tests call `engines::run_engine` directly. That is the function the command uses. It is not a window IPC pass.
- The engine keeps file bytes in memory. It does not take a filesystem path and does not spawn a shell. No engine temp directory is created to clean up. The WebKit cache under the test `XDG_DATA_HOME` is the webview’s own cache.

## Windows NSIS

Config only, in this worktree: NSIS, `currentUser`, English and Spanish, `offlineInstaller`, `silent: false`. Schema source: `@tauri-apps/cli/config.schema.json` (`offlineInstaller` increases installer size by about 127 MB and does not need network at install time).

The redistributable was not fetched. No certificate was created. The `.exe` is **unavailable**.

Clean Windows evidence: **absent**. No OS build, architecture, WebView2 initial state, installer hash, or install screenshot. This Linux session is not that evidence.

## Commands and results (worktree `/tmp/toolzen-phase2`)

| Command | Result |
| --- | --- |
| `cargo test --offline --lib engines::tests::malformed_empty_and_oversized_inputs_fail` | pass, after the empty-file case included `rotation: 90` |
| `cargo fmt --check` | pass after `cargo fmt` |
| `cargo clippy --offline --all-targets -- -D warnings` | pass |
| `cargo test --offline` | 12 passed, 0 failed |
| `cargo test --offline --lib db::tests::migrations_are_versioned_and_idempotent` | pass after the light-theme seed |
| `./node_modules/.bin/tsc --noEmit` | pass (before the lopdf label edit; re-run after the doc pass) |
| `./node_modules/.bin/vitest run` | 5 files, 34 tests passed |
| `./node_modules/.bin/vite build` | pass. Warning: `@tauri-apps/api/core.js` is both dynamic and static |
| Chrome `tests/phase2-images.mjs` against `http://127.0.0.1:1421` | 6 image tools passed. Outputs parsed with Pillow and `pdfinfo` |
| Chrome `tests/phase2-edges.mjs` | 6 edge cases passed |
| `rustup target list --installed` | `x86_64-unknown-linux-gnu` only |
| `command -v makensis` / MinGW / `cargo-xwin` | not found |
| Xvfb launch of `target/debug/toolzen-desktop` | window and SQLite created. IPC file round trip not driven |

`node_modules` in the worktree is a symlink to the existing install. It was not modified.

## License notes for this pass

- Project license remains Apache-2.0. `LICENSE` was not edited.
- `lopdf` 0.47.0 MIT is the PDF implementation.
- Plus Jakarta Sans remains OFL-1.1 (`third-party/fonts/plus-jakarta-sans-OFL.txt`).
- WebView2 offline installer, if a later Windows build embeds it, is Microsoft software (~127 MB per the Tauri schema) and is not in git.
- No AGPL or GPL engine was added.

## Files changed in this unpublished pass

- `src/tools/mvp/images.ts` — reject resize width or height below 1
- `src/tools/mvp/specs.ts` — label the in-process PDF tools as `lopdf` instead of `qpdf`
- `src-tauri/src/engines.rs` — structural tests for extract, rotate, malformed, empty, and oversized input
- `src-tauri/src/db.rs` and `src-tauri/migrations/001_initial.sql` — new databases default to light
- `src-tauri/tauri.conf.json` — `offlineInstaller`, `silent: false`
- `docs/AUDIT-REPORT.md`, `docs/DISTRIBUTION.md`, `docs/TECHNICAL-BACKLOG.md`, `docs/INSTALL.md`, `docs/LICENSING.md`, `docs/licensing/dependency-inventory.md`
- `README.md` — light theme for a new database, link to the install guide, Windows package marked not ready
- `tests/phase2-images.mjs`, `tests/phase2-edges.mjs`
