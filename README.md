<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# ToolZen Desktop

ToolZen Desktop is an independent open-source utilities application for Windows, macOS, and Linux. This release processes data on the device. It does not require an account, a backend, or a network connection after installation.

The project website is [https://tools-zen.com/](https://tools-zen.com/). Links in the app open only when you choose them, and only for an explicit allow list.

## Screenshots

Screenshots of the running desktop UI are captured during verification and attached to the pull request. This repository does not ship static marketing mockups as if they were the running application.

## Features in this release

- Desktop shell with a collapsible sidebar, global search, and a command palette (`Ctrl+K` on Windows and Linux, `Cmd+K` on macOS).
- Dark theme by default, plus light and system themes. The choice is stored locally.
- Tool explorer, favorites, and recent activity. History stores tool ids and timestamps only, never input or output text.
- The same twenty tools as the ToolZen reference catalogue: PDF, image, conversion, and OCR. See [docs/PARITY.md](docs/PARITY.md) for what actually runs.
- SQLite persistence in the desktop app, with versioned migrations. The browser preview uses a separate localStorage adapter and says so.
- A local execution manager, a cloud provider contract with no implementation, a permission manager, and workflow and AI planning foundations. There is no workflow editor and no assistant.

## Stack

- Tauri 2 and Rust for the native shell and SQLite database
- React 19, strict TypeScript, and Vite
- Tailwind CSS 4
- Radix primitives with project-owned UI components in the shadcn compositional style
- Lucide icons, Motion for restrained transitions, and Zustand for transient UI state

UI primitives in `src/components/ui` are original project source. They are not copied from the shadcn registry. Radix remains a third-party dependency.

## Architecture

Tools, future workflows, and future AI plans share one tool registry, one execution manager, and one permission manager. Tool definitions do not import Tauri commands or a network client. See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/EXECUTION-ARCHITECTURE.md](docs/EXECUTION-ARCHITECTURE.md), [docs/WORKFLOW-ARCHITECTURE.md](docs/WORKFLOW-ARCHITECTURE.md), and [docs/AI-ASSISTANT-ARCHITECTURE.md](docs/AI-ASSISTANT-ARCHITECTURE.md).

## Install and development

Requirements: Node.js 22+, Rust 1.90+ (stable), and the Tauri system packages for your OS. Linux package names are listed in [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md).

```bash
npm install
npm run dev          # browser preview on http://127.0.0.1:1420
npm run tauri:dev    # desktop shell
npm test
npm run build
cargo test --manifest-path src-tauri/Cargo.toml
```

The browser preview is fully interactive and uses localStorage. It is not SQLite. The desktop shell stores structured data in an app-local SQLite file.

## Build

```bash
npm run tauri:build
```

Packaging and code signing for each operating system are not part of this milestone. A release build also needs the platform WebView (WebKitGTK on Linux, WebView2 on Windows, WKWebView on macOS).

## Contributing

Read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. New tools should follow [docs/ADDING-TOOLS.md](docs/ADDING-TOOLS.md).

## License

ToolZen Desktop is licensed under the Apache License, Version 2.0. The complete official text is in [LICENSE](LICENSE) and at <https://www.apache.org/licenses/LICENSE-2.0>. The SPDX identifier is `Apache-2.0`.

You may use, modify, and distribute this project, including for commercial use, under those terms. You must retain applicable copyright and license notices. The license includes a patent license that terminates if you file litigation alleging that the work or a contribution infringes a patent. See sections 2 and 3 of the license.

Copyright 2026 ToolZen Contributors.

The Apache License does not grant trademark rights. The names ToolZen and tools-zen.com are not licensed as trademarks by this repository.

Dependency licenses are separate. Inter and JetBrains Mono are bundled under the SIL Open Font License. See [docs/LICENSING.md](docs/LICENSING.md) and [third-party/fonts](third-party/fonts).
