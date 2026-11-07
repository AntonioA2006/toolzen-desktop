<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Distribution

No installer has been built or published from this environment. Windows acceptance is **UNVERIFIED**.

## Installer choice

| Option | Maintenance | User install | Notes |
| --- | --- | --- | --- |
| NSIS (Tauri default) | Low. Tauri generates it. | Per-user without administrator is supported. | Chosen for the Windows `.exe`. |
| WiX / MSI | Higher. XML authoring. | Better for enterprise Group Policy. | Not needed for the first public download. |
| Inno Setup | Separate toolchain. | Good UX. | Duplicates what Tauri NSIS already does. |

`src-tauri/tauri.conf.json` sets NSIS `installMode` to `currentUser`, shows a language selector, and sets WebView2 to `downloadBootstrapper` with `silent: false`. That bootstrapper is not a silent download. A fully offline WebView2 install needs Microsoft's Evergreen Standalone Installer embedded as `offlineInstaller`. That redistributable is not in this repository, so a clean offline Windows machine is not claimed to work without network on first install if WebView2 is missing.

Upgrades keep the per-user app data directory, which is where SQLite preferences live. The installer is not configured to delete that directory. Uninstall behavior of NSIS was not executed here.

## Other platforms

Targets also include `app`, `dmg`, `deb`, and `appimage`. Flatpak was not added. macOS signing and notarization need an Apple Developer certificate that this project does not have. No certificate material is stored in the repo.

## Updates

There is no updater plugin and no update endpoint. A future updater must show the version, the URL, and a SHA-256 before download, and must refuse to run without a user action. Silent updates are out of scope.

## CI

`.github/workflows/ci.yml` runs checks, then `npm run tauri build` on Linux, Windows, and macOS, writes SHA-256 sums, and uploads artifacts. It does not create a GitHub Release. Those packaging jobs have not been observed on a runner yet.

## Checksums and signing

When a maintainer later builds an installer, publish the file name, version, architecture, size, and SHA-256 next to the download. Code signing requires a purchased certificate (Windows Authenticode, Apple Developer ID). None is configured. Do not describe builds as signed.
