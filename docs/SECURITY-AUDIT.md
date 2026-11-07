<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Security audit

Reviewed on 2026-11-07 against the desktop tree after the catalogue alignment. This is not a claim that the application is secure.

## Findings

| ID | Severity | Evidence | Impact | Status |
| --- | --- | --- | --- | --- |
| S1 | High | `src-tauri/src/engines.rs` previously built `qpdf`/`gs` argument lists from caller options and spawned those binaries. | A crafted page string or a missing binary path could reach a process. Ghostscript is also AGPL if bundled. | Fixed for the tools that remain runnable. PDF work uses lopdf in-process. The command no longer spawns a shell. Unavailable tools return `not_in_this_build` and do not start a process. |
| S2 | Medium | File bytes still arrive from the webview over IPC as base64. | A compromised webview can submit file bytes. It cannot name an arbitrary filesystem path: the engine decodes bytes only and rejects names with `..` separators and NUL. | Accepted. Size is capped at 25 MB per file and 20 files. |
| S3 | Medium | `PermissionManager` allows `filesystem.read` when the scope path starts with `selection:`. | That string is chosen by the frontend. It is not a check of an OS path. | The native engine does not use that string as a path. Documented so it is not treated as an OS grant. |
| S4 | Low | Tauri CSP allows `http://127.0.0.1:1420` for the dev server. | A local process could be contacted from the webview. | Kept for `tauri dev`. Production content is still `self` plus IPC. No remote API host. |
| S5 | Low | Opener plugin can open three allow-listed https URLs from About. | User-initiated only. | Unchanged. |
| S6 | Info | SQLite lives in the app data directory. History rejects `input` and `output` fields. | Tool payloads are not stored. | Unchanged. |
| S7 | Info | Temporary directories are not used by the lopdf path. | Less leftover data than the previous qpdf workspace. | Fixed for PDF tools. |

## Not checked

- A packaged Windows or macOS binary was not inspected.
- No third-party penetration test was done.
- WebView2 and OS sandbox behavior were not measured on those platforms.
