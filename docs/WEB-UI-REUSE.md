<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Web UI reuse

On 2026-11-07 the owner of AntonioA2006/ToolZen authorized reusing that project's own CSS, tokens, and component markup in toolzen-desktop. The source pin is `b600a8d6646cd9bf39b2d20f3fff117b914ce4f2`. The web repository was not modified.

| Web source | Desktop |
| --- | --- |
| `resources/css/app.css` | `src/styles/toolzen-web.css` (Laravel `@source` lines and the `/fonts` face omitted; Plus Jakarta Sans still loads) |
| `resources/views/components/icon.blade.php` | `src/components/site/icon.tsx` |
| `resources/views/components/glyph.blade.php` | `src/components/site/glyph.tsx` |
| `resources/views/components/brand.blade.php` | header mark in `src/components/site/site-header.tsx` |
| `resources/views/components/navbar.blade.php` | `src/components/site/site-header.tsx` |
| `resources/views/components/tool-card.blade.php` | `src/components/site/web-tool-card.tsx` |
| `resources/views/components/tool-flow.blade.php` | `src/components/site/tool-flow.tsx` |
| `resources/views/pages/home.blade.php` | `src/features/dashboard/dashboard-page.tsx` |
| `resources/views/components/page-hero.blade.php` | tool page hero in `src/tools/mvp/page.tsx` |
| `src/Web/Presentation/View/ToolDirectory.php` short names | `src/lib/catalog-copy.ts` |

Not brought across: PHP, Laravel, job queues, ads, SEO, guides, and the claim that files are processed on a server. Split still returns one PDF. Unavailable tools stay disabled. Saving uses a native dialog (`src-tauri/src/output.rs`) instead of an `<a download>` link. The visual page-thumbnail picker in `split-pdf-picker.blade.php` is not ported; the shared tool-flow form is.

Third-party notices already in this repo stay in force. This note does not relicense Tailwind, Plus Jakarta Sans, or any other dependency.
