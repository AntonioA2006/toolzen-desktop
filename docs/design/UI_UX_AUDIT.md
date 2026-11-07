<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# UI and UX audit

The website shell from 0.1.1 is the baseline this branch replaces. This note records what that shell got wrong and what this pass changed. Scores are in `QA_REPORT.md`.

| Screen | What was wrong | What this pass does |
| --- | --- | --- |
| Home | Marketing hero, a defensive Spanish heading, and a subtitle that advertised OCR. Category names stayed in English. Counts said “1 listas”. Dates used English AM/PM. | Heading is “Tus herramientas, a mano” / “Tools at hand”. Subtitle is “Los archivos se quedan en este equipo.” Categories use the registry keys (Conversión, Imagen). Counts are singular or plural. Dates use `formatLocal`. Ready tools are a directory with a one-line description, not ten “Ready” badges. |
| Tool result | The drop zone, remove, process, and process-another stayed active above the success block. | A successful run replaces the form with measured input bytes, output bytes, duration, one primary Save as, and a secondary Change files. Change files returns to the form so the file can be run again. |
| Options | Compress looked like it had lost a quality control. | `specs.ts` on this branch and on main gives compress-image and webp-converter `options: []`. The canvas encoder uses a fixed quality of 0.75. The page states that. It does not add a slider. Resize, crop, rotate, page lists, and JPG order controls that the specs define are still on the page, with labels and constraints. |
| Explorer | Badges collided with titles. | The row fills the width. The star does not. Badges are only for partial and unavailable. |
| Favorites and recent | English card copy stayed visible next to the empty-state sentence. | Localized rows. The empty sentence shows only when the list is empty. |
| Fonts | Dev server returned 403 for the woff2 files when `node_modules` resolved outside the project, so the family never loaded. | `server.fs.allow` includes the real `node_modules` path. Chrome then reported `document.fonts.check('14px "Plus Jakarta Sans"') === true`. |

Still limited: no screen-reader pass, the native Save dialog was not clicked (WebKitWebDriver is not installed), and Windows and macOS were not launched.
