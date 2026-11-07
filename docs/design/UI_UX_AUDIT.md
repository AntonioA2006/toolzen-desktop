<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# UI and UX audit

Evidence is the desktop build before this branch: screenshots `home-en-light.png` and `split-es-light.png` in the phase 2 UI set, plus the components those screens rendered (`site-header`, `home-hero`, `tool-flow` classes from the copied website CSS).

| Screen | Problem | Severity | Proposal | Impact | Priority |
| --- | --- | --- | --- | --- | --- |
| Home | Full-bleed marketing hero, oversized heading, decorative grid and blobs inside a desktop window. | High | Compact title, search, favorites, recent, categories. | Starts work without scrolling a landing page. | P0 |
| Header | Website nav (categories, language pill, gradient catalog button) plus a second local row. | High | Collapsible sidebar and one search field. Native window controls stay the OS ones. | Matches a desktop tool, not a site. | P0 |
| Tool | Drop zone is large and the page repeats marketing chips. | Medium | Same actions in a shorter workspace: file, options, run, save. | Less scrolling. Honesty labels stay. | P0 |
| Explorer | Featured web cards and “not included” badges on a dark catalog. | Medium | List rows with availability and favorite. | Easier to scan twenty tools. | P1 |
| Settings, favorites, recent, about | Already compact, but English strings and a website shell around them. | Medium | Keep the screens, translate headings, put them in the sidebar. | One navigation model. | P1 |
| Save | The website download link caused a WebView multi-download prompt. | High | Keep the native save dialog. Do not restore the anchor. | Already fixed in 0.1.1. This branch keeps it. | P0 |
| Icon | Bundle icons are the installer/dock identity. A second runtime mark was not set. | Low | Add a separate taskbar icon without replacing bundle files. | Window icon can differ where the OS allows it. | P2 |

This audit is not a claim that every pixel was measured. Contrast of the new tokens is checked by using the token pairs in the stylesheet, not by an automated WCAG scanner.
