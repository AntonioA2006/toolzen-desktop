<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Architecture

## Implemented now

The desktop shell is a Tauri webview around a React application. The three tools run in the webview through a local execution provider. Preferences, favorites, recents, workflow records, AI retention rows, and permission grants are stored in SQLite when the app runs inside Tauri. A browser preview uses a different adapter.

```text
UI (sidebar, pages, palette)
  -> Zustand session and preference mirrors
  -> PersistencePort (SQLite or browser preview)
  -> Tool registry
  -> ExecutionManager
       -> PermissionManager
       -> LocalExecutionProvider -> pure tool handlers
       -> CloudExecutionProvider (contract only; not registered)
```

Workflow execution and approved AI plans call the same `ExecutionManager`. They do not call providers directly.

## Frontend

| Path | Responsibility |
| --- | --- |
| `src/app` | Boot, theme, keyboard shortcut, route switch |
| `src/components/layout` | Sidebar, top bar, page header |
| `src/components/ui` | Original Radix-based controls |
| `src/features` | Dashboard, explorer, favorites, recent, settings, about, command palette |
| `src/tools` | Registry, metadata, validation, pure processors, pages |
| `src/services/execution` | Manager, local provider, cloud contract, native adapter seam |
| `src/services/permissions` | Grant matching and audit |
| `src/services/workflows` | Definition, validation, planning, execution, templates |
| `src/services/ai` | Provider contract, catalog, structured planner, approval |
| `src/services/persistence` | Shared operations, browser preview, SQLite command client |
| `src/stores` | Transient UI and the hydrated preference mirror |

Routing is an in-memory `AppRoute`. It is not a URL router. The last route can be restored from preferences. Restoring a page does not invent a new usage event.

## Native

`src-tauri` opens `toolzen.sqlite` inside the OS app data directory. JavaScript cannot run arbitrary SQL. It calls `load_state`, `apply_op`, and `storage_info`. `apply_op` is a closed set of validated operations.

Migrations live in `src-tauri/migrations` and are applied in order. Version 1 creates preferences, favorites, recents, and usage counts. Version 2 creates workflows, workflow executions, AI conversations and messages, and permission tables.

Rust also defines a native execution request type. `prepare_native_request` rejects cloud mode and does not fall back to a fake local run when cloud was requested. No tool command is exposed for it yet.

## Registry

Each tool has one profile: metadata, a field schema for input and output, permissions, execution capabilities, and a validator. The React page is attached by the registry, not by the processor. Unavailable tools are profiles with `availability: "unavailable"`. Their validators fail, and no local handler is registered.

## Lifecycle

1. `App` registers local handlers and constructs `ExecutionManager` with a null cloud provider.
2. Preferences hydrate from the active persistence port.
3. Opening a tool records the tool id and time.
4. Running a tool validates input, checks capabilities and permissions, then calls the local provider.
5. The page renders the returned output or the returned error. It never synthesizes a success.

## Persistence boundary

Desktop SQLite and the browser preview key `toolzen.browser-preview` are different stores. The preview adapter's storage info says it is not SQLite. Theme flash prevention in `public/preview-theme.js` reads only that preview key.

History rows do not contain tool input or output. Workflow execution rows reject node results that include `input` or `output`.

## Not built in this release

- A workflow canvas. XYFlow is the recommended library when an editor is actually started. It is not a dependency now.
- An AI chat surface or a model client.
- Cloud upload, accounts, or remote execution.
- OS autostart. The setting is disabled and the copy says it is not implemented.
