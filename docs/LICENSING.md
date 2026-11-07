<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Licensing

## Project license

SPDX-License-Identifier: Apache-2.0

The root `LICENSE` file is the unmodified Apache License, Version 2.0, fetched from <https://www.apache.org/licenses/LICENSE-2.0.txt>. The appendix placeholder is part of that official text and is intentionally unchanged. Project copyright is `Copyright 2026 ToolZen Contributors` in source headers and in this documentation.

The repository's initial commit contained only a title in `README.md`. It had no `LICENSE`, no `NOTICE`, and no copyright headers. There was no earlier license to preserve and no relicensing conflict to resolve. The year 2026 matches the repository history. No earlier year or legal entity was invented.

`package.json` uses `"license": "Apache-2.0"`. `src-tauri/Cargo.toml` uses `license = "Apache-2.0"`. JSON manifests cannot carry a comment header; the license field is the marker.

## What the license allows

You may use, modify, and distribute the project, including commercially, under the Apache License 2.0. You must keep applicable copyright and license notices. Sections 2 and 3 include a patent license that ends if you file patent litigation claiming the work or a contribution infringes. The license does not grant trademark rights in ToolZen or tools-zen.com.

## Contributions

See [CONTRIBUTING.md](../CONTRIBUTING.md). Contributors keep their copyright. Incorporated contributions are distributed under Apache-2.0. Submitters must have the right to submit. There is no copyright assignment and no contributor license agreement.

## Third-party code in this repository

UI components under `src/components/ui` were written for this project against Radix primitives. They are not copied shadcn registry files, and they are not relicensed from an upstream MIT header. Radix itself stays an npm dependency under its own license.

`third-party/fonts/` contains unmodified SIL Open Font License 1.1 texts for Inter and JetBrains Mono. Those fonts are bundled by the frontend build. They are not Apache-2.0 works. Do not strip those files.

No Apache `NOTICE` file is included. The project did not inherit a NOTICE, and it does not vendor third-party source trees that shipped one. A NOTICE would not replace the font licenses or the dependency obligations below.

## Dependency audit

Audit date: 2026-11-07, on this workspace after `npm install` and `cargo metadata --manifest-path src-tauri/Cargo.toml --format-version 1`.

This is not a claim that every dependency is legally compatible for every distribution channel. It records what the manifests said.

### npm (direct install tree, 116 packages with a license field)

| License as declared | Count |
| --- | ---: |
| MIT | 99 |
| Apache-2.0 | 4 |
| Apache-2.0 OR MIT | 3 |
| ISC | 3 |
| OFL-1.1 | 2 |
| MPL-2.0 | 2 |
| MIT OR Apache-2.0 | 1 |
| BSD-3-Clause | 1 |
| 0BSD | 1 |

OFL-1.1 packages: `@fontsource/inter@5.3.0`, `@fontsource/jetbrains-mono@5.3.0`.

MPL-2.0 packages: `lightningcss@1.33.0` and `lightningcss-linux-x64-gnu@1.33.0`. These are build tools used by Tailwind and Vite. They are not the project license. MPL-2.0 is file-level copyleft for those packages' own source. This audit did not replace them. A distributor who ships lightningcss itself, rather than only CSS it emitted, needs to comply with MPL-2.0.

### Cargo (456 packages in the resolved graph, excluding this crate)

Most crates declare MIT, Apache-2.0, or a combination of those. Also present in the graph: Unicode-3.0, Zlib, BSD-3-Clause, ISC, Unlicense, MPL-2.0, and `Apache-2.0 WITH LLVM-exception`.

MPL-2.0 crates in this resolution: `cssparser@0.37.0`, `cssparser-macros@0.7.1`, `dtoa-short@0.3.5`, `option-ext@0.2.0`, `selectors@0.38.0`. They arrive through the Tauri and WebKitGTK stack. Shipping a binary that statically links them carries MPL source obligations for those files. That was not treated as a reason to remove Tauri.

`r-efi` 5.3.0 and 6.0.0 declare `MIT OR Apache-2.0 OR LGPL-2.1-or-later`. The MIT or Apache-2.0 choice is available. This project does not elect the LGPL option for that crate.

No crate in the metadata dump had an empty license or a GPL-only license. That statement is limited to the `license` field Cargo published for this resolution. It was not a manual reading of every license file.

### PDF library and engines that are not bundled

Runnable PDF tools link `lopdf` 0.47.0 (MIT, `license` field MIT). The app does not spawn `qpdf`, Ghostscript, Poppler, LibreOffice, or Tesseract. Those programs are not vendored. qpdf and Tesseract are Apache-2.0. Ghostscript is AGPL-3.0. Poppler (`pdftoppm`) is GPL-2.0. LibreOffice is MPL-2.0. Bundling Ghostscript or Poppler into a desktop installer would be a separate license decision and is not done here.

Plus Jakarta Sans is shipped through `@fontsource/plus-jakarta-sans` (OFL-1.1). The upstream OFL text is in `third-party/fonts/plus-jakarta-sans-OFL.txt`. Inter and JetBrains Mono remain OFL-1.1 dependencies; the UI loads Plus Jakarta Sans.

A Windows build that uses `webviewInstallMode.type = offlineInstaller` embeds Microsoft’s WebView2 Evergreen standalone installer. Tauri’s config schema describes that payload as about 127 MB. It is Microsoft software under Microsoft’s redistribution terms, not an Apache-2.0 file, and it is not stored in this repository. No such installer was downloaded or built in the 2026-11-07 UTC validation.

## System libraries

Linux builds link to WebKitGTK, which is LGPL. That obligation belongs to the system library and to anyone who distributes the combined desktop build. It is not removed by the project's Apache-2.0 license.

## New dependencies

Before adding a dependency, record its SPDX identifier, whether it is build-time or shipped, and whether it is GPL-only, MPL, OFL, or another license that needs a notice or source offer. Do not add a dependency whose only license is incompatible with Apache-2.0 distribution. Preserve upstream copyright and license files when you vendor or bundle third-party material.

## How to report a concern

Open an issue or pull request that names the package, version, the license text you found, and what you believe is missing. Do not "fix" a license question by deleting attribution.

## Inventory limits

Counts above come from package manifests in this environment. Transitive npm packages are included for the installed tree. Cargo counts come from `cargo metadata`. Platform packages installed by apt are not in those counts except for the WebKit note. No lawyer reviewed this file.
