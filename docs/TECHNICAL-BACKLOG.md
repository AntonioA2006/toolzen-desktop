<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Technical backlog

Date: 2026-11-07 UTC. Effort is S, M, or L. It is not a calendar estimate.

## P0

### P0-1 Windows clean-install proof
- Problem: No NSIS `.exe` exists, and no clean Windows machine has installed one.
- Evidence this pass: `rustup target list --installed` printed only `x86_64-unknown-linux-gnu`. `makensis`, MinGW, and `cargo-xwin` were absent. No Windows VM was available. Linux and Wine were not used as a substitute.
- Solution: On a Windows toolchain, run `npm run tauri build`, record the `.exe` size and SHA-256, then install it on a clean 64-bit Windows user account that starts without WebView2 if that state can be arranged. Launch, run all ten ready tools, check shortcuts, uninstall, and keep the preference database.
- Files: `.github/workflows/ci.yml`, `src-tauri/tauri.conf.json`, `docs/DISTRIBUTION.md`, `docs/INSTALL.md`.
- Acceptance: the install log, OS build, architecture, WebView2 state before install, artifact hash, and screenshots exist. Until then the product is **NOT READY**.
- Effort: M.

### P0-2 Offline WebView2 payload
- Problem: The published pull request 3 config uses `downloadBootstrapper`, which needs network when WebView2 is missing.
- This worktree: `webviewInstallMode` is `offlineInstaller` with `silent: false`. The ~127 MB Microsoft redistributable named by Tauri’s schema was not downloaded and is not committed.
- Solution: Let a Windows `tauri build` fetch the official standalone installer at build time, record its size and hash, and keep Microsoft’s license terms with the release notes. Do not flip `silent` back to true.
- Acceptance: the built `.exe` contains the offline installer, or the release notes name a Windows baseline that already includes WebView2. Neither was shown here.
- Effort: M.

## P1

### P1-1 Split PDF groups
- Problem: Split returns one PDF of the selected pages, not one file per group.
- Evidence: `extract-pdf-pages | split-pdf` share `keep_pages` in `src-tauri/src/engines.rs`. Extract of page 2 from a 2-page file was tested. A dedicated two-range split was not.
- Solution: emit a zip of one PDF per range, tested with two ranges.
- Effort: M.

### P1-2 Image compress is a canvas re-encode
- Problem: Compress image draws through the webview canvas at quality 0.75. An 8×8 PNG stayed 8×8 (111 bytes). A 755-byte JPEG that contained an Exif marker became a 797-byte JPEG without that marker. Smaller output is not guaranteed, especially for PNG, where canvas quality is often ignored.
- Solution: Keep the honest label, or change the encoder only with fixtures that show a real reduction and intact pixels.
- Effort: M.

### P1-3 Native window file round trip
- Problem: The debug binary launched under Xvfb and drew the phase 2 UI, and Rust created `toolzen.sqlite`. The window was not driven through file selection into `invoke("run_engine")`. `WebKitWebDriver` is not installed, and `xdotool` could not activate the window.
- Solution: A WebKit or Windows WebView2 driver run that merges two PDFs and checks the page count of the saved file.
- Effort: M.

### P1-4 Clippy and fmt
- Done locally on 2026-11-07 UTC: `cargo fmt --check` and `cargo clippy --offline --all-targets -- -D warnings` passed in the worktree. CI itself was not run.

## P2

### P2-1 Optional engine installer UI
- Problem: Ghostscript (AGPL), Poppler (GPL), LibreOffice (MPL), and Tesseract (Apache-2.0) are not bundled. There is no screen that offers a future optional install.
- Solution: a screen that names the engine, license, size, and source, and never downloads silently.
- Effort: L.

### P2-2 ESLint
- Problem: There is no ESLint config. `tsc --noEmit` and Vitest ran. ESLint did not.
- Effort: S.

### P2-3 Extract `toolzen-pdf` crate
- Problem: PDF code is inside the Tauri crate.
- Solution: see `docs/SHARED-CORE-ROADMAP.md`.
- Effort: M.

## P3

### P3-1 Signed updates
- Problem: no updater and no certificates. No key was created to fill that gap.
- Effort: L.

### P3-2 Mobile shell
- Problem: no Android or iOS app, by decision.
- Effort: L.

## Roadmap

1. Ten local tools, honest unavailable states, in-process PDF. Functional checks from this pass are in `docs/AUDIT-REPORT.md`.
2. A real Windows NSIS `.exe` with the offline WebView2 installer, checksum, and a clean-machine install log.
3. Signed macOS and Linux packages after those CI jobs have actually succeeded.
4. Mobile only after a shared PDF crate exists.
