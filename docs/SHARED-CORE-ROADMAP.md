<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Shared core roadmap

No mobile application is included. This note is only the split that would let a later Android or iOS shell reuse logic.

## Shareable now

- `src/services/execution` contracts and `ExecutionManager` (TypeScript, no Tauri import).
- `src/services/permissions` (TypeScript).
- `src/tools/mvp/pdf-images.ts` and page-range checks.
- `src-tauri/src/engines.rs` PDF operations once moved into a library crate. Today they sit in the Tauri crate, so they are desktop-only by packaging, not by algorithm.

## Desktop only

- Tauri commands, capabilities, NSIS/DMG/AppImage bundling.
- Webview canvas image tools (`src/tools/mvp/images.ts`). A mobile port needs the same pixel operations behind a different canvas.
- SQLite via the Tauri command surface. The schema can be reused; the plugin cannot.

## Mobile constraints

- File picking and storage permissions differ per OS. The current IPC model (bytes in, bytes out) avoids path traversal and is the safer shape to keep.
- PDF page counts above 200 and files above 25 MB are rejected on purpose. Phones should keep that cap until memory is measured.
- OCR, Office conversion, and Ghostscript compression are not in the shared core.

## Order

1. Extract `engines` into a `toolzen-pdf` crate with the existing Rust tests.
2. Keep image operations in TypeScript until a shared raster crate is justified.
3. Add an Android or iOS shell only after the crate boundary exists. Do not start that shell in this repository yet.
