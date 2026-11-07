<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Changelog

## Unreleased

- 0.1.1 labels the test installer that includes the website layout and the native save dialog, so it is not the earlier `ToolZen_0.1.0_x64-setup.exe`.
- Limited the reliable set to ten local tools that do not require the user to install qpdf, Ghostscript, Poppler, LibreOffice, or Tesseract.
- PDF merge, extract, rotate, and delete pages run inside the app with lopdf (MIT).
- Image compress, resize, crop, WebP, metadata removal, and JPG to PDF run in the webview.
- The other catalogue tools stay visible and are marked not included. They do not pretend to succeed.
- Spanish and English strings live in `src/lib/i18n`.
- Windows NSIS is configured for a per-user install. No installer has been produced or signed in this environment.
- CI builds installers as artifacts and does not publish a GitHub Release.

## 0.1.0

- Initial desktop shell, SQLite preferences, and the ToolZen visual catalogue.
