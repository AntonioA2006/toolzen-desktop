<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Technical backlog

Effort is S, M, or L. It is not a calendar estimate.

## P0

### P0-1 Windows clean-install proof
- Problem: The NSIS configuration exists, but no Windows machine has installed an artifact.
- Solution: Run the CI package job, install the `.exe` on a clean Windows user account, launch, run merge and compress image, uninstall.
- Files: `.github/workflows/ci.yml`, `src-tauri/tauri.conf.json`, `docs/DISTRIBUTION.md`.
- Dependencies: a Windows runner or a maintainer machine. WebView2 strategy.
- Acceptance: the steps in section 10.1.G of the audit brief succeed, or the failure is recorded with the installer log.
- Effort: M.

### P0-2 Offline WebView2
- Problem: `downloadBootstrapper` needs network if WebView2 is absent.
- Solution: Obtain Microsoft's standalone installer under its license and switch to `offlineInstaller`, or document a supported Windows baseline that already includes WebView2.
- Files: `src-tauri/tauri.conf.json`.
- Dependencies: Microsoft redistribution terms.
- Acceptance: a documented offline path or an explicit supported baseline.
- Effort: M.

## P1

### P1-1 Split PDF groups
- Problem: Split returns one PDF of the selected pages, not one file per group.
- Evidence: `src-tauri/src/engines.rs` `extract-pdf-pages | split-pdf` arm.
- Solution: emit a zip of one PDF per range, tested with two ranges.
- Acceptance: two ranges produce two PDFs and the UI says so.
- Effort: M.

### P1-2 Image tests outside the browser
- Problem: Canvas tools are verified by one browser compress. Resize, crop, and WebP lack automated fixtures.
- Solution: add a headless check for each ready image tool.
- Effort: M.

### P1-3 Clippy and fmt in the default local loop
- Problem: CI will fail if formatting drifts. Local `cargo fmt` must be applied before the first CI run.
- Effort: S.

## P2

### P2-1 Optional engine installer UI
- Problem: Ghostscript (AGPL), Poppler (GPL), LibreOffice (MPL), and Tesseract (Apache-2.0) are not bundled, correctly, but there is no GUI that explains a future optional install.
- Solution: a screen that names the engine, license, size, and source, and never downloads silently.
- Effort: L.

### P2-2 ESLint
- Problem: CI typechecks and tests. It does not run ESLint because the project has no ESLint config.
- Effort: S.

### P2-3 Extract `toolzen-pdf` crate
- Problem: PDF code is inside the Tauri crate.
- Solution: see `docs/SHARED-CORE-ROADMAP.md`.
- Effort: M.

## P3

### P3-1 Signed updates
- Problem: no updater and no certificates.
- Solution: design only until a certificate exists. See `docs/DISTRIBUTION.md`.
- Effort: L.

### P3-2 Mobile shell
- Problem: no Android or iOS app, by decision.
- Effort: L.

## Roadmap

1. Consolidation: ten reliable tools, honest unavailable states, in-process PDF, i18n.
2. Distribution: observed Windows NSIS install, offline WebView2 decision, checksums, no auto-release.
3. Cross-platform: signed macOS and Linux packages after the CI jobs have actually succeeded.
4. Mobile: shared PDF crate first, then a shell.
