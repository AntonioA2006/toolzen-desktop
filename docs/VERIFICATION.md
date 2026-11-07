<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Verification

This file records what was implemented, which commands were run, and what was not claimed.

## Implemented in this release

- Tauri 2 shell with React 19, strict TypeScript, Vite, Tailwind CSS 4, Radix-based controls, Lucide, Motion, and Zustand.
- Collapsible sidebar, top bar search, theme control, command palette, dashboard, explorer, favorites, recent, settings, and about.
- Dark default, light, and system themes. Browser preview persistence is localStorage and is labeled as such. Desktop persistence is SQLite.
- JSON Formatter, UUID Generator, and Base64, executed only through `ExecutionManager`.
- Unavailable planned tools that do not run.
- Local execution provider, cloud provider contract with no network implementation, permission manager, workflow validator/planner/executor, and a non-operational AI provider plus structured plan approval.
- Versioned SQLite migrations for preferences, favorites, recents, workflows, workflow history, AI rows, and permission rows.
- Apache License 2.0 as the project license. Official `LICENSE` text was not edited.

## Not implemented, on purpose

- No workflow editor, no XYFlow dependency, and no workflow page.
- No AI chat, no model call, and no provider that returns generated text.
- No cloud upload, account, telemetry, or remote tool execution.
- No OS autostart. The control is disabled and says it is not implemented.
- No signed Windows, macOS, or Linux installers.

## Commands and results

Ran from `/workspace` on 2026-11-07.

| Command | Result |
| --- | --- |
| `npx tsc --noEmit --pretty false` | Exit 0. No diagnostics. Also runs inside `npm run build`. |
| `npx vitest run` | Exit 0. 4 files, 31 tests passed. |
| `cargo test --manifest-path src-tauri/Cargo.toml` | Exit 0. 6 tests passed (`cloud_preference_is_rejected`, `auto_resolves_to_local`, `workflow_history_rejects_payloads`, `cloud_mode_is_rejected_without_fallback`, `migrations_are_versioned_and_idempotent`, `ai_messages_require_retention_opt_in`). |
| `npm run build` | Exit 0. `tsc --noEmit` plus Vite 8.3.6 production build. |
| `cmp LICENSE <(curl -fsSL https://www.apache.org/licenses/LICENSE-2.0.txt)` | Files match. SHA-256 `cfc7749b96f63bd31c3c42b5c471bf756814053e847c10f3eb003417bc523d30`. |

Browser checks used the production bundle served by `npm run preview` at `http://127.0.0.1:1420` and Chrome via `puppeteer-core`. The script reported `ok: true`. It confirmed:

- Dark default dashboard, then light theme, then the light theme still applied after reload.
- Explorer, an unavailable tool page with no Format/Generate/Encode/Run button.
- JSON Formatter produced pretty-printed JSON and the text "Completed locally".
- Ctrl+K opened the palette, filtered to UUID Generator, and generation produced a version-4 UUID.
- Base64 encoded `你好` to `5L2g5aW9`.
- Favorites empty state.
- Settings shows launch-at-login as not implemented, names the browser preview store, and keeps Cloud disabled.
- At 900px the sidebar class is the collapsed rail.
- `localStorage` key `toolzen.browser-preview` is present and is not reported as SQLite.

Screenshots from that run:

- `/opt/cursor/artifacts/01-dashboard-dark.png`
- `/opt/cursor/artifacts/02-dashboard-light.png`
- `/opt/cursor/artifacts/03-explorer.png`
- `/opt/cursor/artifacts/04-unavailable-tool.png`
- `/opt/cursor/artifacts/05-json-formatter-result.png`
- `/opt/cursor/artifacts/06-command-palette.png`
- `/opt/cursor/artifacts/07-uuid-result.png`
- `/opt/cursor/artifacts/08-base64-unicode.png`
- `/opt/cursor/artifacts/09-favorites-empty.png`
- `/opt/cursor/artifacts/10-settings.png`
- `/opt/cursor/artifacts/11-narrow-home.png`
- `/opt/cursor/artifacts/ui-checks.json`

These are captures of the running page, not drawn mockups.

## Blocked or not run

- A native Tauri window was not opened. `cargo test` compiled the Tauri crate against the installed WebKitGTK development libraries. `apt-get` reported configuration errors for `fuse3`, `xdg-desktop-portal`, and `xdg-desktop-portal-gtk` after the WebKit and GTK dev packages were installed. That can block a desktop session even though the library tests passed.
- `npm run tauri:build` was not run, so there is no platform installer and no code-signing result.
- GitHub's license detector was not queried before push. Do not treat the local `LICENSE` match as GitHub having labeled the repository.
- CI in `.github/workflows/ci.yml` was not observed on a runner from this environment.

## License metadata checked

- `package.json` `license` is `Apache-2.0`.
- `src-tauri/Cargo.toml` `license` is `Apache-2.0`.
- Root `LICENSE` matches the Apache Software Foundation text byte for byte.
- No previous license or NOTICE existed. Font OFL texts were copied into `third-party/fonts/` and were not rewritten as Apache-2.0.
- Dependency license fields were read from the installed npm tree (116 packages) and `cargo metadata` (456 crates). Findings are in [LICENSING.md](LICENSING.md). MPL-2.0, OFL-1.1, and the system WebKitGTK LGPL are outstanding distribution concerns. No dependency was swapped for licensing reasons.

## File manifest

Tracked after this change with `git ls-files`. Generated schemas under `src-tauri/gen/`, `node_modules/`, `dist/`, and `src-tauri/target/` are ignored.

The source tree created here is the application under `src/` and `src-tauri/`, tests under `tests/`, docs under `docs/`, the workflow under `.github/workflows/ci.yml`, font license copies under `third-party/fonts/`, plus `LICENSE`, `README.md`, `CONTRIBUTING.md`, `package.json`, `package-lock.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, and `public/`.
