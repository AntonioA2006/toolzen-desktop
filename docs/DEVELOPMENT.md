<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Development

## Dependencies

- Node.js 22 or newer and npm
- Rust stable (1.90 or newer; this environment used 1.99.1)
- Tauri 2 system libraries

On Debian or Ubuntu:

```bash
sudo apt-get update
sudo apt-get install -y libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev patchelf libssl-dev libxdo-dev build-essential pkg-config
```

`fuse3` and `xdg-desktop-portal` failed to finish configuring in the verification environment. The Rust library and tests still compiled against the installed WebKit and GTK development packages. A full desktop session may also need a working portal package.

Build-time package downloads are expected (`npm install`, `cargo fetch`). The running app does not call those networks.

## Commands

| Command | What it does |
| --- | --- |
| `npm install` | Install JavaScript dependencies |
| `npm run dev` | Vite dev server at `http://127.0.0.1:1420` |
| `npm run preview` | Serve the production bundle |
| `npm run typecheck` | `tsc --noEmit` with strict options |
| `npm test` | Vitest unit tests |
| `npm run build` | Typecheck and production bundle |
| `npm run tauri:dev` | Tauri window with the Vite server |
| `npm run tauri:build` | Desktop bundle |
| `cargo test --manifest-path src-tauri/Cargo.toml` | SQLite migrations and native execution checks |

## Debug

- Browser preview: use the Vite server. Persistence is localStorage. The settings page names that backend.
- Desktop: `npm run tauri:dev`. The database path is shown in Settings after the SQLite adapter loads.
- Rust logs: run the cargo test binary or `RUST_LOG=debug npm run tauri:dev`.
- If the webview is blank, check the CSP in `src-tauri/tauri.conf.json`. Script source is `'self'` only. Style source allows inline styles because Tailwind emits them. No remote hosts are allowed.

## Verification

See [VERIFICATION.md](VERIFICATION.md) for the commands that were actually run and their results.
