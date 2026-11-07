<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Audit report

Date: 2026-11-07. Repository: AntonioA2006/toolzen-desktop. Branch: `cursor/audit-consolidation-99ce`. Pull requests 1 and 2 were already merged, so this work is a new branch from `main`.

## Area status

| Area | Initial | Final | Pending |
| --- | --- | --- | --- |
| Catalogue honesty | Twenty tools visible, several spawned missing CLIs or returned hard-coded refusals. | Ten tools marked ready. Split marked partial. Nine marked not in this build and cannot run. | P1-1 split groups. |
| PDF engine | External `qpdf`/`gs` with caller-influenced arguments. | In-process lopdf (MIT). Rust tests: merge page count 2, delete leaves 1 page, compress returns an error. | Not tested inside a Tauri window. |
| Image tools | Canvas path. Compress verified in a browser once. | Same path, still the ready image set. | Automated resize/crop/WebP fixtures. |
| i18n | English strings in components. Language stored but only `en` accepted. | `src/lib/i18n/en.ts` and `es.ts`. Rust accepts `es`. | Not every settings paragraph is translated. |
| Security | Process spawn and temp workspaces. | Spawn removed for the engine command. See `docs/SECURITY-AUDIT.md`. | Packaged binary not reviewed. |
| Distribution | `targets: all`, no NSIS policy, no checksums. | NSIS per-user config and a CI package job that uploads artifacts and does not publish a release. | Windows install UNVERIFIED. No installer file was produced here. |
| CI | Linux typecheck, vitest, cargo test. | Adds fmt, clippy `-D warnings`, and three package jobs. | Those jobs have not run. |
| Performance | Not measured. | Still not measured as 4/8/16/32 GB ratings. Those figures are goals, not results. | Measure on a desktop build. |

## Verified

- `cargo test --manifest-path src-tauri/Cargo.toml --lib engines::` after the lopdf change: merge, delete, and the unavailable-tool refusal.
- Earlier in this branch's history, browser compress of a PNG produced a download. That check was not repeated after the i18n edit.

## Implemented but not tested in a desktop window

- Rotate and extract use the same page-tree helpers as delete. They were not given a separate Rust test in this pass.
- Language switching persists through the existing preference adapter. The Spanish catalog compiles; the UI was not re-screenshotted.

## Partial

- Split PDF returns one PDF containing the requested pages.

## Environment blocked

- Windows clean install, shortcuts, upgrade, and uninstall.
- macOS signing and notarization.
- A produced `.exe`, `.dmg`, AppImage, or `.deb` from this VM.
- Memory measurements of the Tauri process.

## Functional tools and dependencies

Ready without a user-installed CLI: merge PDF, extract PDF pages, delete PDF pages, rotate PDF (lopdf, MIT, linked into the app), compress image, resize image, crop image, WebP converter, remove image metadata, JPG to PDF (webview canvas).

Not run, and shown as such: compress PDF, crop PDF, watermark, protect, unlock, PDF to JPG, Word to PDF, PDF to Word, image to text. Ghostscript is AGPL and Poppler is GPL; they are not bundled. LibreOffice and Tesseract are not bundled either.
