<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Privacy

## Offline

This release does not contact a ToolZen service, a model host, or an analytics endpoint while tools run. Opening the website, the repository, or the Apache license page is a button you press. Those URLs are allow-listed. A failed open is reported as a failure.

Build machines download npm and Cargo packages. That is not runtime behavior.

## Network

The Tauri CSP allows the webview itself, Tauri IPC, and the local Vite port used in development. It does not allow a remote API. There is no telemetry SDK.

Automatic execution stays on the device. If a cloud provider is registered in a future build, cloud mode still requires an explicit grant naming the provider and destination. A local failure is not retried remotely.

## Files

The current tools do not read or write user files. The only file the app creates for its own data is the SQLite database in the OS app data directory. JavaScript does not receive a general filesystem permission.

Future file tools must derive a filesystem permission from the path the user selected. A grant for one directory does not cover a sibling path. Deletion is a separate permission from reading. The app does not watch folders in this release.

## What is stored

Stored: theme, language (English only), startup page, execution preference (`local` or `auto`), last route, favorite tool ids, recent tool ids and timestamps, open counts, workflow definitions, workflow execution metadata, permission grants and audit rows, and AI conversations only after an explicit retention opt-in.

Not stored: tool input, tool output, file contents, or seeded sample activity. AI retention defaults to off. Enabling the setting does not create a conversation or contact a model.

## Permissions

App-level permissions and Tauri capabilities are different. Both are described in [PERMISSIONS.md](PERMISSIONS.md).
