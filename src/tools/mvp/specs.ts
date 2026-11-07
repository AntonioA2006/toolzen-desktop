// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import type { CategoryId, ToolIconName } from "@/tools/categories";

export type EngineId = "canvas" | "qpdf" | "ghostscript" | "poppler" | "libreoffice" | "tesseract";

export interface ToolOptionField {
  name: string;
  label: string;
  kind: "text" | "integer";
  required: boolean;
}

/** English catalogue taken from the reference ToolDirectory at commit b600a8d. */
export interface MvpToolSpec {
  id: string;
  name: string;
  description: string;
  category: CategoryId;
  icon: ToolIconName;
  popular: boolean;
  accept: string;
  minFiles: number;
  maxFiles: number;
  maxFileBytes: number;
  engine: EngineId;
  engineBinary: string;
  outputExtension: string;
  outputMime: string;
  options: readonly ToolOptionField[];
}

const PDF = "application/pdf";
const IMAGE = "image/jpeg,image/png,image/webp";
const WORD = "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.doc,.docx";
const LIMIT = 25 * 1024 * 1024;

export const MVP_TOOLS: readonly MvpToolSpec[] = [
  { id: "merge-pdf", name: "Merge PDF", description: "Join several PDFs into one document.", category: "pdf", icon: "layers", popular: true, accept: PDF, minFiles: 2, maxFiles: 20, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [] },
  { id: "split-pdf", name: "Split PDF", description: "Split a PDF into page ranges.", category: "pdf", icon: "split", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "pages", label: "Pages (example 1,3-5)", kind: "text", required: true }] },
  { id: "compress-pdf", name: "Compress PDF", description: "Shrink a PDF with the ebook profile.", category: "pdf", icon: "archive", popular: true, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "ghostscript", engineBinary: "gs", outputExtension: "pdf", outputMime: PDF, options: [] },
  { id: "word-to-pdf", name: "Word to PDF", description: "Turn DOC or DOCX into PDF without an account.", category: "conversion", icon: "file-input", popular: true, accept: WORD, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "libreoffice", engineBinary: "libreoffice", outputExtension: "pdf", outputMime: PDF, options: [] },
  { id: "pdf-to-jpg", name: "PDF to JPG", description: "Rasterize PDF pages into JPEG images.", category: "pdf", icon: "image", popular: true, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "poppler", engineBinary: "pdftoppm", outputExtension: "jpg", outputMime: "image/jpeg", options: [] },
  { id: "compress-image", name: "Compress image", description: "Lighten JPG, PNG or WEBP.", category: "image", icon: "image", popular: true, accept: IMAGE, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "canvas", engineBinary: "webview-canvas", outputExtension: "img", outputMime: "application/octet-stream", options: [] },
  { id: "image-to-text", name: "Image to text", description: "Extract text from an image into a .txt file.", category: "ocr", icon: "scan-text", popular: true, accept: IMAGE, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "tesseract", engineBinary: "tesseract", outputExtension: "txt", outputMime: "text/plain", options: [] },
  { id: "rotate-pdf", name: "Rotate PDF", description: "Rotate pages 90, 180 or 270 degrees.", category: "pdf", icon: "rotate-cw", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "rotation", label: "Rotation (90, 180, or 270)", kind: "integer", required: true }, { name: "pages", label: "Pages, optional", kind: "text", required: false }] },
  { id: "delete-pdf-pages", name: "Delete PDF pages", description: "Remove the pages you specify.", category: "pdf", icon: "file-minus", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "pages", label: "Pages to delete", kind: "text", required: true }] },
  { id: "extract-pdf-pages", name: "Extract PDF pages", description: "Copy pages into a new PDF.", category: "pdf", icon: "file-plus", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "pages", label: "Pages to keep", kind: "text", required: true }] },
  { id: "crop-pdf", name: "Crop PDF", description: "Crop margins in millimetres.", category: "pdf", icon: "crop", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "ghostscript", engineBinary: "gs", outputExtension: "pdf", outputMime: PDF, options: [{ name: "top_mm", label: "Top mm", kind: "integer", required: true }, { name: "right_mm", label: "Right mm", kind: "integer", required: true }, { name: "bottom_mm", label: "Bottom mm", kind: "integer", required: true }, { name: "left_mm", label: "Left mm", kind: "integer", required: true }] },
  { id: "watermark-pdf", name: "Watermark PDF", description: "Add visible text to the pages.", category: "pdf", icon: "stamp", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "text", label: "Watermark text", kind: "text", required: true }] },
  { id: "protect-pdf", name: "Protect PDF", description: "Encrypt the PDF with a password you choose.", category: "pdf", icon: "lock", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "password", label: "Password", kind: "text", required: true }] },
  { id: "unlock-pdf", name: "Unlock PDF", description: "Open a PDF when you already know the key.", category: "pdf", icon: "unlock", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "qpdf", engineBinary: "qpdf", outputExtension: "pdf", outputMime: PDF, options: [{ name: "password", label: "Password", kind: "text", required: true }] },
  { id: "resize-image", name: "Resize image", description: "Fit the image into a maximum size.", category: "image", icon: "scaling", popular: false, accept: IMAGE, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "canvas", engineBinary: "webview-canvas", outputExtension: "img", outputMime: "application/octet-stream", options: [{ name: "width", label: "Max width", kind: "integer", required: true }, { name: "height", label: "Max height", kind: "integer", required: true }] },
  { id: "crop-image", name: "Crop image", description: "Crop a rectangle in pixels.", category: "image", icon: "crop", popular: false, accept: IMAGE, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "canvas", engineBinary: "webview-canvas", outputExtension: "img", outputMime: "application/octet-stream", options: [{ name: "x", label: "X", kind: "integer", required: true }, { name: "y", label: "Y", kind: "integer", required: true }, { name: "width", label: "Width", kind: "integer", required: true }, { name: "height", label: "Height", kind: "integer", required: true }] },
  { id: "webp-converter", name: "WebP converter", description: "Convert JPG or PNG to WebP.", category: "image", icon: "image", popular: false, accept: IMAGE, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "canvas", engineBinary: "webview-canvas", outputExtension: "webp", outputMime: "image/webp", options: [] },
  { id: "remove-image-metadata", name: "Remove image metadata", description: "Re-encode the image so EXIF and GPS are not kept.", category: "image", icon: "eraser", popular: false, accept: IMAGE, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "canvas", engineBinary: "webview-canvas", outputExtension: "img", outputMime: "application/octet-stream", options: [] },
  { id: "jpg-to-pdf", name: "JPG to PDF", description: "Join images into a PDF.", category: "conversion", icon: "file-output", popular: false, accept: IMAGE, minFiles: 1, maxFiles: 20, maxFileBytes: LIMIT, engine: "canvas", engineBinary: "webview-canvas", outputExtension: "pdf", outputMime: PDF, options: [] },
  { id: "pdf-to-word", name: "PDF to Word", description: "Turn a PDF into a .docx document.", category: "conversion", icon: "file-output", popular: false, accept: PDF, minFiles: 1, maxFiles: 1, maxFileBytes: LIMIT, engine: "libreoffice", engineBinary: "libreoffice", outputExtension: "docx", outputMime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", options: [] },
];

export function mvpTool(id: string): MvpToolSpec | undefined {
  return MVP_TOOLS.find((tool) => tool.id === id);
}
