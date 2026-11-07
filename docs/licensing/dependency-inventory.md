<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Dependency license inventory

Generated from the local install on 2026-11-07. Regenerate with the commands in [LICENSING.md](../LICENSING.md). This file is a summary, not a copy of every upstream license.

## npm license field counts

- MIT: 99
- Apache-2.0: 4
- Apache-2.0 OR MIT: 3
- ISC: 3
- OFL-1.1: 2 (`@fontsource/inter`, `@fontsource/jetbrains-mono`) in the 2026-11-07 count above. `@fontsource/plus-jakarta-sans` is also an OFL-1.1 dependency and is the face the UI loads. Its OFL text is in `third-party/fonts/plus-jakarta-sans-OFL.txt`. That package was not folded back into the "2" count; the count was not regenerated.
- MPL-2.0: 2 (`lightningcss`, `lightningcss-linux-x64-gnu`)
- MIT OR Apache-2.0: 1
- BSD-3-Clause: 1
- 0BSD: 1

Total packages counted: 116.

## Cargo license field highlights

456 third-party crates in the resolved graph.

Notable non-MIT/Apache-only entries:

- MPL-2.0: `cssparser`, `cssparser-macros`, `dtoa-short`, `option-ext`, `selectors`
- `MIT OR Apache-2.0 OR LGPL-2.1-or-later`: `r-efi` (dual-licensed; LGPL is not the only option)
- Unicode-3.0, Zlib, BSD-3-Clause, ISC, Unlicense, and Apache-2.0 WITH LLVM-exception also appear

No empty license field and no GPL-only license field were found in this metadata snapshot.

`lopdf` 0.47.0 is a direct dependency (MIT) used by the runnable PDF tools. It was resolved in this workspace on 2026-11-07 UTC. The earlier npm count of 116 was not regenerated in this pass; the Plus Jakarta Sans package was already installed and is called out above.
