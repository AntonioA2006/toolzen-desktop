// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Short names and blurbs follow ToolDirectory.php at b600a8d6646cd9bf39b2d20f3fff117b914ce4f2.
// Drop and submit labels follow the tool Blade views. "Online" is omitted in the desktop chrome.

import type { Locale } from "@/lib/i18n";

export interface ToolCopy {
  short: string;
  blurb: string;
  drop: string;
  idle: string;
  ready: string;
  error: string;
  submit: string;
  formats: string;
}

const es: Record<string, ToolCopy> = {
  "merge-pdf": { short: "Unir PDF", blurb: "Junta varios PDF en un solo documento.", drop: "Arrastra tus PDFs aquí", idle: "Selecciona tus PDFs", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Unir los PDF", formats: "PDF" },
  "split-pdf": { short: "Dividir PDF", blurb: "Separa un PDF en rangos de páginas.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF y crea grupos de páginas", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Generar PDF", formats: "PDF" },
  "compress-pdf": { short: "Comprimir PDF", blurb: "Reduce el peso de un PDF con un perfil.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Comprimir el PDF", formats: "PDF" },
  "word-to-pdf": { short: "Word a PDF", blurb: "Pasa DOC o DOCX a PDF sin cuenta.", drop: "Arrastra tu documento aquí", idle: "Selecciona un documento", ready: "Tu PDF está listo", error: "No se pudo procesar el documento", submit: "Convertir a PDF", formats: "DOC · DOCX" },
  "pdf-to-jpg": { short: "PDF a JPG", blurb: "Rasteriza páginas de un PDF a imagen.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tus imágenes están listas", error: "No se pudo procesar el PDF", submit: "Convertir a JPG", formats: "PDF" },
  "compress-image": { short: "Comprimir imagen", blurb: "Aligera JPG, PNG o WEBP.", drop: "Arrastra tu imagen aquí", idle: "Selecciona una imagen", ready: "Tu imagen está lista", error: "No se pudo comprimir la imagen", submit: "Comprimir la imagen", formats: "JPG · PNG · WEBP" },
  "image-to-text": { short: "OCR", blurb: "Extrae texto de una imagen a un .txt.", drop: "Arrastra tu imagen aquí", idle: "Selecciona una imagen", ready: "Tu texto está listo", error: "No se pudo leer la imagen", submit: "Extraer texto", formats: "JPG · PNG · WEBP" },
  "rotate-pdf": { short: "Rotar PDF", blurb: "Gira páginas 90, 180 o 270 grados.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF y elige el giro", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Rotar el PDF", formats: "PDF" },
  "delete-pdf-pages": { short: "Borrar páginas", blurb: "Quita las páginas que indiques.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Borrar páginas", formats: "PDF" },
  "extract-pdf-pages": { short: "Extraer páginas", blurb: "Saca páginas a un PDF nuevo.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Extraer páginas", formats: "PDF" },
  "crop-pdf": { short: "Recortar PDF", blurb: "Recorta márgenes en milímetros.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Recortar el PDF", formats: "PDF" },
  "watermark-pdf": { short: "Marca de agua", blurb: "Añade un texto visible a las páginas.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Añadir marca", formats: "PDF" },
  "protect-pdf": { short: "Proteger PDF", blurb: "Cifra el PDF con la clave que tú eliges.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Proteger el PDF", formats: "PDF" },
  "unlock-pdf": { short: "Desbloquear PDF", blurb: "Abre un PDF si ya conoces la clave.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu PDF está listo", error: "No se pudo procesar el PDF", submit: "Desbloquear el PDF", formats: "PDF" },
  "resize-image": { short: "Redimensionar", blurb: "Encaja la imagen en un tamaño máximo.", drop: "Arrastra tu imagen aquí", idle: "Selecciona una imagen", ready: "Tu imagen está lista", error: "No se pudo redimensionar la imagen", submit: "Redimensionar", formats: "JPG · PNG · WEBP" },
  "crop-image": { short: "Recortar imagen", blurb: "Recorta un rectángulo en píxeles.", drop: "Arrastra tu imagen aquí", idle: "Selecciona una imagen", ready: "Tu imagen está lista", error: "No se pudo recortar la imagen", submit: "Recortar", formats: "JPG · PNG · WEBP" },
  "webp-converter": { short: "Imagen a WebP", blurb: "Convierte JPG o PNG a WebP.", drop: "Arrastra tu imagen aquí", idle: "Selecciona una imagen", ready: "Tu imagen está lista", error: "No se pudo convertir la imagen", submit: "Convertir a WebP", formats: "JPG · PNG · WEBP" },
  "remove-image-metadata": { short: "Quitar metadatos", blurb: "Elimina EXIF y GPS cuando el formato lo permite.", drop: "Arrastra tu imagen aquí", idle: "Selecciona una imagen", ready: "Tu imagen está lista", error: "No se pudo limpiar la imagen", submit: "Quitar metadatos", formats: "JPG · PNG · WEBP" },
  "jpg-to-pdf": { short: "JPG a PDF", blurb: "Junta imágenes en un PDF.", drop: "Arrastra tus imágenes aquí", idle: "Selecciona imágenes", ready: "Tu PDF está listo", error: "No se pudo crear el PDF", submit: "Crear PDF", formats: "JPG · PNG · WEBP" },
  "pdf-to-word": { short: "PDF a Word", blurb: "Pasa un PDF a documento .docx.", drop: "Arrastra tu PDF aquí", idle: "Selecciona un PDF", ready: "Tu documento está listo", error: "No se pudo procesar el PDF", submit: "Convertir a Word", formats: "PDF" },
};

const en: Record<string, ToolCopy> = {
  "merge-pdf": { short: "Merge PDF", blurb: "Join several PDFs into one document.", drop: "Drag your PDFs here", idle: "Select your PDFs", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Merge the PDFs", formats: "PDF" },
  "split-pdf": { short: "Split PDF", blurb: "Split a PDF into page ranges.", drop: "Drag your PDF here", idle: "Select a PDF and name the pages", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Create PDF", formats: "PDF" },
  "compress-pdf": { short: "Compress PDF", blurb: "Shrink a PDF with a single profile.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Compress the PDF", formats: "PDF" },
  "word-to-pdf": { short: "Word to PDF", blurb: "Turn DOC or DOCX into PDF without an account.", drop: "Drag your document here", idle: "Select a document", ready: "Your PDF is ready", error: "The document could not be processed", submit: "Convert to PDF", formats: "DOC · DOCX" },
  "pdf-to-jpg": { short: "PDF to JPG", blurb: "Rasterize PDF pages into images.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your images are ready", error: "The PDF could not be processed", submit: "Convert to JPG", formats: "PDF" },
  "compress-image": { short: "Compress image", blurb: "Lighten JPG, PNG or WEBP.", drop: "Drag your image here", idle: "Select an image", ready: "Your image is ready", error: "The image could not be compressed", submit: "Compress the image", formats: "JPG · PNG · WEBP" },
  "image-to-text": { short: "OCR", blurb: "Extract text from an image into a .txt file.", drop: "Drag your image here", idle: "Select an image", ready: "Your text is ready", error: "The image could not be read", submit: "Extract text", formats: "JPG · PNG · WEBP" },
  "rotate-pdf": { short: "Rotate PDF", blurb: "Rotate pages 90, 180 or 270 degrees.", drop: "Drag your PDF here", idle: "Select a PDF and choose the turn", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Rotate the PDF", formats: "PDF" },
  "delete-pdf-pages": { short: "Delete pages", blurb: "Remove the pages you specify.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Delete pages", formats: "PDF" },
  "extract-pdf-pages": { short: "Extract pages", blurb: "Copy pages into a new PDF.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Extract pages", formats: "PDF" },
  "crop-pdf": { short: "Crop PDF", blurb: "Crop margins in millimetres.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Crop the PDF", formats: "PDF" },
  "watermark-pdf": { short: "Watermark", blurb: "Add visible text to the pages.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Add watermark", formats: "PDF" },
  "protect-pdf": { short: "Protect PDF", blurb: "Encrypt the PDF with a password you choose.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Protect the PDF", formats: "PDF" },
  "unlock-pdf": { short: "Unlock PDF", blurb: "Open a PDF when you already know the key.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your PDF is ready", error: "The PDF could not be processed", submit: "Unlock the PDF", formats: "PDF" },
  "resize-image": { short: "Resize", blurb: "Fit the image into a maximum size.", drop: "Drag your image here", idle: "Select an image", ready: "Your image is ready", error: "The image could not be resized", submit: "Resize", formats: "JPG · PNG · WEBP" },
  "crop-image": { short: "Crop image", blurb: "Crop a rectangle in pixels.", drop: "Drag your image here", idle: "Select an image", ready: "Your image is ready", error: "The image could not be cropped", submit: "Crop", formats: "JPG · PNG · WEBP" },
  "webp-converter": { short: "Image to WebP", blurb: "Convert JPG or PNG to WebP.", drop: "Drag your image here", idle: "Select an image", ready: "Your image is ready", error: "The image could not be converted", submit: "Convert to WebP", formats: "JPG · PNG · WEBP" },
  "remove-image-metadata": { short: "Strip metadata", blurb: "Strip EXIF and GPS when the format allows it.", drop: "Drag your image here", idle: "Select an image", ready: "Your image is ready", error: "The image could not be cleaned", submit: "Strip metadata", formats: "JPG · PNG · WEBP" },
  "jpg-to-pdf": { short: "JPG to PDF", blurb: "Join images into a PDF.", drop: "Drag your images here", idle: "Select images", ready: "Your PDF is ready", error: "The PDF could not be created", submit: "Create PDF", formats: "JPG · PNG · WEBP" },
  "pdf-to-word": { short: "PDF to Word", blurb: "Turn a PDF into a .docx document.", drop: "Drag your PDF here", idle: "Select a PDF", ready: "Your document is ready", error: "The PDF could not be processed", submit: "Convert to Word", formats: "PDF" },
};

const optionEs: Record<string, string> = {
  "split-pdf.pages": "Páginas (ejemplo 1, 3-5)",
  "extract-pdf-pages.pages": "Páginas a conservar",
  "delete-pdf-pages.pages": "Páginas a borrar",
  "rotate-pdf.pages": "Páginas, opcional",
  "rotate-pdf.rotation": "Rotación (90, 180 o 270)",
  "resize-image.width": "Ancho máximo",
  "resize-image.height": "Alto máximo",
  "crop-image.x": "X",
  "crop-image.y": "Y",
  "crop-image.width": "Ancho",
  "crop-image.height": "Alto",
  "crop-pdf.top_mm": "Arriba, mm",
  "crop-pdf.right_mm": "Derecha, mm",
  "crop-pdf.bottom_mm": "Abajo, mm",
  "crop-pdf.left_mm": "Izquierda, mm",
  "watermark-pdf.text": "Texto de la marca",
  "protect-pdf.password": "Contraseña",
  "unlock-pdf.password": "Contraseña",
};

export function optionLabel(locale: Locale, toolId: string, name: string, fallback: string): string {
  if (locale !== "es") return fallback;
  return optionEs[`${toolId}.${name}`] ?? fallback;
}

export function toolCopy(locale: Locale, id: string): ToolCopy {
  const table = locale === "es" ? es : en;
  return table[id] ?? table["merge-pdf"]!;
}
