<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Parity with AntonioA2006/ToolZen

Reference commit `b600a8d6646cd9bf39b2d20f3fff117b914ce4f2` on `main`. Catalogue source: `src/Catalog/Infrastructure/Persistence/CatalogDefinitions.php` and `src/Web/Presentation/View/ToolDirectory.php`. Routes: `src/Web/Presentation/Http/routes.php`. Visual tokens: `resources/css/app.css` (`--tz-*`). Brand mark: `resources/views/components/brand.blade.php`.

The reference tree has no LICENSE or NOTICE. Desktop code is original and stays Apache-2.0. Engine behavior follows the reference command shapes; the PHP sources were not copied into this repository.

The reference default language is Spanish, with English names at `/en`. This desktop ships the English names only.

| Tool | Reference engine | Desktop now | Limit |
| --- | --- | --- | --- |
| merge-pdf | qpdf `--empty --pages` | Runs qpdf when installed. Rust test merged two PDFs and checked page count 2. | Browser preview does not run qpdf. |
| split-pdf | qpdf, one file per range group | Runs qpdf and returns one PDF for the requested ranges. | Not one file per group. |
| compress-pdf | Ghostscript `/ebook` | Runs `gs` with `-dPDFSETTINGS=/ebook` when installed. | Not verified with a before/after size fixture in this session. Ghostscript is AGPL and is not bundled. |
| rotate-pdf | qpdf `--rotate` | Runs qpdf for 90/180/270, optional page list. | Not verified with a visual fixture. |
| extract-pdf-pages | qpdf `--pages` | Runs qpdf. | Not verified beyond the command shape. |
| delete-pdf-pages | qpdf keep-set | Refuses. The keep-set calculation was not in the export. | Nothing is written. |
| crop-pdf | Ghostscript CropBox plus qpdf | Refuses. The page-box math was not fully exported. | Nothing is written. |
| watermark-pdf | Ghostscript stamp plus qpdf overlay | Refuses. | Nothing is written. |
| protect-pdf | qpdf 256-bit job JSON | Runs qpdf when installed. | Not verified with a decrypt round trip. |
| unlock-pdf | qpdf `--decrypt` | Runs qpdf when installed. | Wrong passwords surface the qpdf error. |
| pdf-to-jpg | pdftoppm 150 dpi | Returns the first page JPEG only. | Later pages are not packed. Poppler is GPL and is not bundled. |
| word-to-pdf | LibreOffice headless | Command is implemented. | `libreoffice` is not installed here, so the call fails and does not invent a PDF. |
| pdf-to-word | LibreOffice headless | Same as word-to-pdf. | Same blocker. Layout parity with the reference is not claimed. |
| image-to-text | Tesseract `spa+eng` | Command is implemented with `-l eng`. | `tesseract` is not installed here. Spanish language data from the reference is not bundled. |
| compress-image | ImageMagick quality 75 and `-strip` | Webview canvas re-encodes at quality 0.75. | Not byte-identical to ImageMagick. |
| resize-image | ImageMagick `-resize` fit | Canvas fit inside the max box, no upscale. | Not byte-identical. |
| crop-image | ImageMagick `-crop` | Canvas crop in pixels. | Not byte-identical. |
| webp-converter | ImageMagick | Canvas WebP. | Needs a browser that can encode WebP. |
| remove-image-metadata | ImageMagick `-strip` | Canvas re-encode, which drops EXIF. | Not a metadata-only strip. |
| jpg-to-pdf | ImageMagick | Canvas JPEG pages embedded in a PDF. | Page size is the pixel size, not a 72 dpi print page. |

JSON Formatter, UUID Generator, and Base64 are not in the reference catalogue. They remain as internal examples under `src/tools/` and are not registered in the visible registry.
