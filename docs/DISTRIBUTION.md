<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Distribution

Date: 2026-11-07 UTC.

**NOT READY.** No installer was built. No SHA-256 exists. Windows acceptance was not run. This file describes the unpublished local configuration in the phase 2 worktree. Pull request 3 (head `2cef311`) still has `downloadBootstrapper` and does not contain these notes.

## Installer choice

| Option | Maintenance | User install | Notes |
| --- | --- | --- | --- |
| NSIS (Tauri default) | Low. Tauri generates it. | Per-user without administrator is supported. | Chosen for the Windows `.exe`. |
| WiX / MSI | Higher. XML authoring. | Better for enterprise Group Policy. | Not used. |
| Inno Setup | Separate toolchain. | Good UX. | Not used. |

`src-tauri/tauri.conf.json` in this worktree sets:

- `bundle.targets`: `nsis`, `app`, `dmg`, `deb`, `appimage`
- `windows.nsis.installMode`: `currentUser`
- `windows.nsis.languages`: English and Spanish, with the language selector shown
- `windows.webviewInstallMode`: `{ "type": "offlineInstaller", "silent": false }`

Tauri 2.12 schema (`@tauri-apps/cli` `config.schema.json`) describes `offlineInstaller` as embedding the offline WebView2 installer, with no internet connection required at install time, and an increase of about 127 MB. `silent` defaults to `true` in that schema. This config sets `silent` to `false` so a future installer does not hide the WebView2 setup.

The Microsoft standalone redistributable is not in the git tree. No copy was downloaded. A real Windows `tauri build` would fetch it at build time from Microsoft’s link inside Tauri’s bundler. That download was not performed. There is no silent user-data upload in this design.

Upgrades are expected to keep the per-user app data directory, which holds `toolzen.sqlite`. The NSIS script was not generated or run, so uninstall and upgrade were not observed.

## Why no `.exe` was produced

This machine has only the Rust target `x86_64-unknown-linux-gnu`. `makensis`, `x86_64-w64-mingw32-gcc`, and `cargo-xwin` are not installed. No Windows SDK is present. Cross-building the NSIS installer was not started. The CI package jobs were not dispatched. Publishing a GitHub Release was not done.

Installer file: **unavailable**. Hash: **none**.

## Other platforms

macOS signing and notarization need an Apple Developer certificate. None is stored. No `.dmg`, `.deb`, or AppImage was produced in this pass. Flatpak was not added.

## Updates and signing

There is no updater plugin and no update endpoint. There is no Authenticode certificate. Do not describe a future build as signed until a certificate exists and the signed file’s hash is published beside it.

## CI

`.github/workflows/ci.yml` can run `npm run tauri build` on Linux, Windows, and macOS, write SHA-256 sums, and upload artifacts. It does not create a GitHub Release. Those jobs were not started from this validation. Their previous status is unchanged: they have not been observed.
