// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { jpegPagesToPdf } from "./pdf-images";

export interface LocalFile {
  name: string;
  type: string;
  bytesBase64: string;
}

export interface LocalOutput {
  fileName: string;
  mime: string;
  bytesBase64: string;
}

const QUALITY = 0.75;

export async function runCanvasTool(toolId: string, files: readonly LocalFile[], options: Record<string, unknown>): Promise<LocalOutput> {
  if (typeof document === "undefined") {
    throw new Error("Image tools run in the desktop webview. This environment has no canvas, so nothing was processed.");
  }
  if (toolId === "jpg-to-pdf") {
    const pages = [];
    for (const file of files) pages.push(await fileToJpegPage(file));
    const pdf = jpegPagesToPdf(pages);
    return { fileName: "images.pdf", mime: "application/pdf", bytesBase64: bytesToBase64(pdf) };
  }
  const file = files[0];
  if (!file) throw new Error("Choose an image.");
  const image = await loadImage(file);
  if (toolId === "resize-image") {
    const width = numberOption(options, "width");
    const height = numberOption(options, "height");
    if (width < 1 || height < 1) throw new Error("Width and height must be at least 1.");
    const scale = Math.min(width / image.width, height / image.height, 1);
    return encode(image, Math.max(1, Math.round(image.width * scale)), Math.max(1, Math.round(image.height * scale)), file, "resize");
  }
  if (toolId === "crop-image") {
    return crop(image, file, numberOption(options, "x"), numberOption(options, "y"), numberOption(options, "width"), numberOption(options, "height"));
  }
  if (toolId === "webp-converter") return encode(image, image.width, image.height, file, "webp", "image/webp");
  if (toolId === "compress-image" || toolId === "remove-image-metadata") {
    return encode(image, image.width, image.height, file, toolId === "compress-image" ? "compressed" : "clean");
  }
  throw new Error("This image tool is not implemented.");
}

async function fileToJpegPage(file: LocalFile): Promise<{ width: number; height: number; jpeg: Uint8Array }> {
  const image = await loadImage(file);
  const blob = await canvasBlob(image, image.width, image.height, "image/jpeg");
  return { width: image.width, height: image.height, jpeg: new Uint8Array(await blob.arrayBuffer()) };
}

function crop(image: HTMLImageElement, file: LocalFile, x: number, y: number, width: number, height: number): Promise<LocalOutput> {
  if (x < 0 || y < 0 || width < 1 || height < 1 || x + width > image.width || y + height > image.height) {
    return Promise.reject(new Error("The crop rectangle does not fit inside the image."));
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable."));
  context.drawImage(image, x, y, width, height, 0, 0, width, height);
  return blobOutput(canvas, file, "crop", mimeFor(file));
}

function encode(image: HTMLImageElement, width: number, height: number, file: LocalFile, suffix: string, mime = mimeFor(file)): Promise<LocalOutput> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable."));
  context.drawImage(image, 0, 0, width, height);
  return blobOutput(canvas, file, suffix, mime);
}

function blobOutput(canvas: HTMLCanvasElement, file: LocalFile, suffix: string, mime: string): Promise<LocalOutput> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error("The image could not be encoded."));
          return;
        }
        const bytes = new Uint8Array(await blob.arrayBuffer());
        const extension = mime === "image/webp" ? "webp" : mime === "image/png" ? "png" : "jpg";
        resolve({
          fileName: `${baseName(file.name)}-${suffix}.${extension}`,
          mime,
          bytesBase64: bytesToBase64(bytes),
        });
      },
      mime,
      QUALITY,
    );
  });
}

function canvasBlob(image: HTMLImageElement, width: number, height: number, mime: string): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) return Promise.reject(new Error("Canvas is unavailable."));
  context.drawImage(image, 0, 0, width, height);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("The image could not be encoded."))), mime, QUALITY);
  });
}

function loadImage(file: LocalFile): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("That file is not a readable image."));
    image.src = `data:${file.type || "application/octet-stream"};base64,${file.bytesBase64}`;
  });
}

function mimeFor(file: LocalFile): string {
  if (file.type === "image/png" || file.type === "image/webp" || file.type === "image/jpeg") return file.type;
  return "image/jpeg";
}

function numberOption(options: Record<string, unknown>, name: string): number {
  const value = options[name];
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) throw new Error(`${name} must be a whole number.`);
  return value;
}

function baseName(name: string): string {
  return name.replace(/\.[^.]+$/, "") || "image";
}

export function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}
