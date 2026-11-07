// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export interface JpegPage {
  width: number;
  height: number;
  jpeg: Uint8Array;
}

/** One PDF page per JPEG. Page size follows the pixel size. This is not ImageMagick's 72 dpi layout. */
export function jpegPagesToPdf(pages: readonly JpegPage[]): Uint8Array {
  if (pages.length === 0) throw new Error("At least one image is required.");
  const chunks: Uint8Array[] = [];
  const offsets: number[] = [0];
  let length = 0;
  const push = (text: string | Uint8Array) => {
    const bytes = typeof text === "string" ? new TextEncoder().encode(text) : text;
    chunks.push(bytes);
    length += bytes.length;
  };
  push("%PDF-1.4\n");
  const ids: number[] = [];
  pages.forEach((_, index) => ids.push(index * 3 + 3));
  const catalog = `1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n`;
  offsets.push(length);
  push(catalog);
  const kids = ids.map((id) => `${id} 0 R`).join(" ");
  offsets.push(length);
  push(`2 0 obj\n<< /Type /Pages /Kids [${kids}] /Count ${pages.length} >>\nendobj\n`);
  pages.forEach((page, index) => {
    const pageId = index * 3 + 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const content = `q\n${page.width} 0 0 ${page.height} 0 0 cm\n/Im0 Do\nQ\n`;
    offsets.push(length);
    push(
      `${pageId} 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${page.width} ${page.height}] /Contents ${contentId} 0 R /Resources << /XObject << /Im0 ${imageId} 0 R >> >> >>\nendobj\n`,
    );
    offsets.push(length);
    push(`${contentId} 0 obj\n<< /Length ${content.length} >>\nstream\n${content}endstream\nendobj\n`);
    offsets.push(length);
    push(
      `${imageId} 0 obj\n<< /Type /XObject /Subtype /Image /Width ${page.width} /Height ${page.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${page.jpeg.length} >>\nstream\n`,
    );
    push(page.jpeg);
    push("\nendstream\nendobj\n");
  });
  const xref = length;
  let body = `xref\n0 ${offsets.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < offsets.length; index += 1) {
    body += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${offsets.length} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  push(body);
  const out = new Uint8Array(length);
  let cursor = 0;
  for (const chunk of chunks) {
    out.set(chunk, cursor);
    cursor += chunk.length;
  }
  return out;
}
