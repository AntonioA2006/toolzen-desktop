<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Permissions

Two layers exist. Tauri capabilities limit what the webview can ask the operating system to do. The application permission manager limits what a tool, workflow, or AI plan can do with user data. Neither layer is a substitute for the other.

## Tauri capabilities

File: `src-tauri/capabilities/default.json`.

| Permission | Why it exists |
| --- | --- |
| `core:default` | Window, event, and app metadata commands needed by the shell. |
| `opener:allow-open-url` scoped to `https://tools-zen.com/*`, `https://github.com/AntonioA2006/toolzen-desktop`, and `https://www.apache.org/licenses/LICENSE-2.0` | Buttons on the About page. Other URLs are not allowed. |
| `opener:deny-open-path` | The app must not open arbitrary local paths. |
| `opener:deny-reveal-item-in-dir` | The app must not reveal arbitrary filesystem items. |

Not granted: shell, general filesystem plugin, HTTP plugin, or arbitrary SQL. The database path is chosen in Rust from the app data directory. Content Security Policy blocks remote hosts. Inline script is not allowed. Fonts and icons are bundled.

## Application permissions

`PermissionManager` records grants and an audit log. A decision looks up a grant whose kind and scope cover the request. Callers cannot pass `granted: true`.

| Kind | Current behavior |
| --- | --- |
| `tool.execute` | Allowed without a prompt when sensitivity is `harmless` and the scope is in-memory `tool-input`. The three tools use this. |
| `workflow.execute` | Allowed without a prompt when every derived tool request is harmless. Sensitive workflows require a grant listing the workflow id and node ids. |
| `filesystem.read` | Denied unless a grant's path covers the requested path on a segment boundary and includes `read`. |
| `filesystem.modify` | Denied unless a modify grant covers that path. A read grant is not enough. |
| `filesystem.delete` | Denied unless a delete grant covers that path. |
| `filesystem.monitor` | Denied unless a monitor grant covers that path. No watcher is running. |
| `cloud.upload` | Denied unless the provider id and destination match exactly. Required before a resolved cloud call. |
| `ai.execute-tool` | Denied unless the grant matches the tool id and proposal id. Added only for `ai-plan` origin. |

Sensitive operations fail closed. The audit log keeps the latest 500 decisions and does not store tool text, only the scope description such as a byte count, path, or destination.

Grants can be revoked. An expired or revoked grant does not match.

Direct tool pages, workflow nodes, and approved AI plans all enter through `ExecutionManager`, which derives requests from the tool and the origin. A workflow cannot skip the check by calling the local provider.
