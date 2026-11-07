<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Contributing

ToolZen Desktop is licensed under the Apache License, Version 2.0. See [LICENSE](LICENSE) and [docs/LICENSING.md](docs/LICENSING.md).

## Copyright and contributions

- Contributors retain copyright in their contributions.
- Contributions incorporated into the project are distributed under the Apache License 2.0.
- You must have the right to submit the contribution.
- Third-party code may be added only when its license is compatible with Apache-2.0 distribution and its required notices are preserved.
- Do not add proprietary code or code under a license that would restrict the project incompatibly, including GPL-only code.
- This project does not require copyright assignment.
- Do not send an unsolicited contributor license agreement.

## Branches and pull requests

- Branch from `main`.
- Keep pull requests focused. Include tests for behavior you change.
- Run `npm run typecheck`, `npm test`, and `npm run build` before requesting review.
- Run `cargo test --manifest-path src-tauri/Cargo.toml` when you change Rust, SQL, or Tauri configuration.
- Do not commit secrets, telemetry endpoints, or a working cloud or AI client.
- Do not record tool input, tool output, or file contents in history.

## Quality

- Keep tool processing pure and free of Tauri or network imports.
- Route execution through `ExecutionManager`.
- Fail closed for filesystem changes, deletion, monitoring, uploads, cloud execution, and AI tool execution.
- Unavailable tools must stay visibly unavailable.
- Document a new permission instead of widening Tauri capabilities casually.

New tools: [docs/ADDING-TOOLS.md](docs/ADDING-TOOLS.md).
