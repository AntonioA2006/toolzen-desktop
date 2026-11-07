<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Redesign decisions

The website layout that shipped in 0.1.1 stays in that release. This branch does not replace it, does not merge, and does not publish an installer. Processing, the 20-tool catalog, SQLite, and the native save dialog stay.

The sidebar is home, all tools, favorites, recent, categories, privacy, settings, and about. Search in the top bar opens the command palette. It is not a second catalog filter. The explorer keeps its own filter because that list is the catalog. The home heading is the task, not a second “ToolZen”.

## Options that were already supported

These fields come from `src/tools/mvp/specs.ts`. The page renders every field in `spec.options`. Empty `options` means the tool never had a control.

| Tool | Controls this build shows |
| --- | --- |
| merge-pdf | Two or more files, reorder. No extra fields. |
| split-pdf, extract-pdf-pages, delete-pdf-pages | Required page text (`1` or `3-5`). Split stays partial: one PDF, not one file per group. |
| rotate-pdf | Rotation 90, 180, or 270, and optional pages. |
| resize-image | Max width and max height, integers of at least 1. |
| crop-image | X, Y (0 or more) and width, height (at least 1). |
| jpg-to-pdf | Several images, reorder. No extra fields. |
| compress-image, webp-converter | No quality or format field. `images.ts` passes `QUALITY = 0.75` to `canvas.toBlob`. The page says so. |
| remove-image-metadata | No fields. Re-encode drops EXIF when the canvas path does. |
| compress-pdf, crop-pdf, watermark-pdf, protect-pdf, unlock-pdf, pdf-to-jpg, word-to-pdf, pdf-to-word, image-to-text | The form is visible and the actions are disabled. Unavailable tools do not run. |

Invalid numbers and page lists show a field error and do not start a run.

## Result

After a real run the form is hidden. The panel shows input bytes (sum of `file.size`), output bytes (decoded from the base64 payload), and `durationMs` from the runner. Save as is the primary button. Change files is secondary and shows the form again. Reset still clears the files. Nothing writes a file until Save as returns a path. Cancel copy is “Save cancelled. Nothing was written.” This pass did not click the native dialog; WebKitWebDriver is not installed.

## Dates and timezone

`formatLocal` uses `Intl.DateTimeFormat` for the selected locale and does not pass `timeZone`. The clock is the user's. The app does not set the process or machine timezone.

## Icons

Bundle icons were not replaced. `git diff origin/main` lists no file under `src-tauri/icons` outside `icons/runtime`. The five files named in `tauri.conf.json` hash to:

| File | SHA-256 |
| --- | --- |
| icons/32x32.png | `50e508286aa6ead32b6c9f8fc5f43bed23da8092e23e06428888433924149309` |
| icons/128x128.png | `1777d8a22fd49bf37b1b21667d2af2f46155b9724e3404023a6ced6598d05105` |
| icons/128x128@2x.png | `c1db45a882847d5edddd5cfb91e8efdaa882bf5d433cca0a0f1d566c330a50fe` |
| icons/icon.icns | `d07eba0e607a570eeda567fba8858e45fce3eacda10cfef7a08e68566cb9fe4d` |
| icons/icon.ico | `85ccb72099685adde3a40dea6dd1dcb81dffa3f6e0cb060c17757f7291a54d60` |

There are 52 original icon files outside `icons/runtime`. None of them differ from `main`.

`Image::from_bytes` needs Tauri's `image-png` feature, which pulls the `image` crate. That crate is not in this lockfile. `png` 0.18 is already in the graph, so `runtime_window_icon` decodes `icons/runtime/icon-32.png` with `png` and passes the pixels to `Image::new_owned`. A decode failure returns `None` and the window keeps the bundle icon. No new dependency was added.

The runtime mark is four corner brackets and a blue square. It is not a letter. Startup calls `set_icon` on the main window only. macOS dock and the installer stay on the bundle icons. This branch does not claim the window icon and the dock icon differ on every OS.

## What is not claimed

Windows and macOS were not run. The Linux native shot is one WebKitGTK window under Xvfb, light theme, default window size, with a black margin because the window does not fill the 1280×800 screen. Opening a result folder is not offered. There is no scoped command for that.
