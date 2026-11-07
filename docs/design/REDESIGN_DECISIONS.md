<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Redesign decisions

The website layout that shipped in 0.1.1 is retired in this branch. The processing path, catalog honesty, SQLite, and native save dialog stay.

The sidebar is the navigation: home, all tools, favorites, recent, categories, privacy, settings, about. The window title bar and traffic lights or caption buttons are the OS controls. Search opens the existing command palette (`Ctrl+K` or `Cmd+K`).

## Icons

Bundle icons were not replaced. SHA-256 of `src-tauri/icons/32x32.png` remains `50e508286aa6ead32b6c9f8fc5f43bed23da8092e23e06428888433924149309`. `icon.ico` and `icon.icns` hashes were recorded before this branch and were not edited. `tauri.conf.json` still lists those bundle icons.

`Image::from_bytes` exists only when Tauri is built with `image-png`. That feature depends on the `image` crate, which is not in this lockfile. Enabling it would add a new dependency. `png` 0.18 is already in the resolved graph, so the window icon is decoded with that crate and passed to `Image::new_owned`. No further dependency was added.

A separate runtime mark is in `src-tauri/icons/runtime/` at 16, 24, 32, 48, and 256 pixels, plus an ICO. It is a rounded square with two offset rectangles. It is not a letter and not a circle with a letter. On startup the main window calls `set_icon` with the 32px PNG. That can change the window and taskbar icon on Windows and some Linux setups. macOS dock and the installed bundle icon stay the files in `tauri.conf.json`. This branch does not claim two independent icons on every OS.

## What is not claimed

Browser screenshots are not Windows, macOS, or Linux native validation. The save dialog was not clicked in a desktop window for this pass. Opening a file’s folder is not offered, because there is no scoped command for that.
