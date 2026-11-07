<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Install ToolZen Desktop

Status on 2026-11-07 UTC: **NOT READY**. There is no Windows installer file to download. Nothing in this guide is a release.

ToolZen Desktop is a local application. It does not ask for an account, and the ten tools that run do not upload the files you select. Nine other catalogue entries stay visible and do not run.

## What you would install

The intended Windows package is one NSIS `.exe` for the current user:

- It does not need a separate install of Node.js, Rust, Python, qpdf, Ghostscript, Poppler, LibreOffice, or Tesseract.
- The ten tools that run use code inside the app: PDF work uses the MIT library lopdf, and image work uses the webview canvas.
- The installer is meant to include Microsoft’s WebView2 offline installer so a PC without WebView2 can still finish setup. Tauri’s configuration schema describes that extra payload as about 127 MB. It was not downloaded here, and no `.exe` was produced.
- Install scope is per user. An administrator password should not be required for a normal account.
- The installer language selector offers English and Spanish.
- WebView2 setup, when a future build embeds it, is configured with `silent: false`, so it is not a hidden download.
- The build is unsigned. Windows SmartScreen can warn about an unsigned file. There is no update service.

Preferences are stored in a per-user SQLite file (`toolzen.sqlite`) under the app data directory. Uninstall is not supposed to delete that file. That behavior was not executed, because no installer exists.

## Windows

Do not look for a download link yet. A clean Windows 10 or 11 (64-bit) install, first launch, the ten tools, shortcuts, and uninstall have not been done. Linux was not treated as a substitute.

When a maintainer later publishes a build, check the file name, version `0.1.0` until that changes, architecture, size, and SHA-256 against the note shipped with that build. This validation has no SHA-256 because it has no installer.

## macOS and Linux

`tauri.conf.json` also lists `.app`, `.dmg`, `.deb`, and AppImage targets. None of those packages were built in this validation. macOS signing is not configured.

## If a tool says it is not in this build

Compress PDF, crop PDF, watermark, protect, unlock, PDF to JPG, Word to PDF, PDF to Word, and image to text are listed on purpose and do not produce a file. Split PDF is only partly implemented: it returns one PDF of the pages you name, not one file per range.

## Files stay on the computer

Choose a file in the tool. The app reads those bytes to do the work. It does not send them to a server. Closing the tool does not upload anything. There is no account to sign in to.
