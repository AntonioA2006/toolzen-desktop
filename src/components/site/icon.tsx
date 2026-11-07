// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors
// Icon paths reused from ToolZen resources/views/components/icon.blade.php at b600a8d6646cd9bf39b2d20f3fff117b914ce4f2.
// The owner authorized this reuse on 2026-11-07.

const ICONS: Record<string, string> = {
  'menu': '<path d="M4 6h16"/><path d="M4 12h16"/><path d="M4 18h16"/>',
  'close': '<path d="M18 6 6 18"/><path d="m6 6 12 12"/>',
  'search': '<circle cx="11" cy="11" r="7"/><path d="m20 20-3-3"/>',
  'upload': '<path d="M12 17V3"/><path d="m6 9 6-6 6 6"/><path d="M4 21h16"/>',
  'download': '<path d="M12 3v12"/><path d="m7 10 5 5 5-5"/><path d="M5 21h14"/>',
  'file': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/>',
  'check': '<path d="M20 6 9 17l-5-5"/>',
  'check-circle': '<circle cx="12" cy="12" r="9"/><path d="m8.5 12.5 2.5 2.5 4.5-5"/>',
  'alert': '<circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/>',
  'sun': '<circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>',
  'moon': '<path d="M21 14.5A8.5 8.5 0 1 1 9.5 3 7 7 0 0 0 21 14.5z"/>',
  'layers': '<path d="m12.83 2.18 8 4.5c.5.28.5 1 0 1.28l-8 4.5a1.2 1.2 0 0 1-1.16 0l-8-4.5a.75.75 0 0 1 0-1.28l8-4.5a1.2 1.2 0 0 1 1.16 0Z"/><path d="m2.18 12.17 8.01 4.5a1.2 1.2 0 0 0 1.16 0l8-4.5"/><path d="m2.18 16.17 8.01 4.5a1.2 1.2 0 0 0 1.16 0l8-4.5"/>',
  'split': '<path d="M16 3h5v5"/><path d="M8 3H3v5"/><path d="M12 22v-8"/><path d="m21 3-7.5 7.5"/><path d="M3 3l7.5 7.5"/>',
  'archive': '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
  'image': '<rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/>',
  'scan-text': '<path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><path d="M7 8h8"/><path d="M7 12h10"/><path d="M7 16h6"/>',
  'rotate-ccw': '<path d="M3 12a9 9 0 1 0 9-9C9.48 3 7.07 4 5.26 5.74L3 8"/><path d="M3 3v5h5"/>',
  'file-minus': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M9 15h6"/>',
  'file-plus': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M12 18v-6"/><path d="M9 15h6"/>',
  'crop': '<path d="M6 2v14a2 2 0 0 0 2 2h14"/><path d="M18 22V8a2 2 0 0 0-2-2H2"/>',
  'stamp': '<path d="M5 18h14"/><path d="M5 14h14"/><circle cx="12" cy="8" r="4"/>',
  'lock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  'unlock': '<rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
  'scaling': '<path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M14 15H9v-5"/><path d="M16 3h5v5"/><path d="m21 3-7 7"/>',
  'eraser': '<path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21"/><path d="M22 21H7"/><path d="m5 11 9 9"/>',
  'file-input': '<path d="M4 22h14a2 2 0 0 0 2-2V7.5L14.5 2H6a2 2 0 0 0-2 2v4"/><path d="M14 2v6h6"/><path d="M2 15h10"/><path d="m9 18 3-3-3-3"/>',
  'file-output': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M10 18H4"/><path d="m7 21-3-3 3-3"/>',
  'convert': '<path d="m17 2 4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>',
  'ocr': '<path d="M12 20h.01"/><path d="M6 13v-2a6 6 0 1 1 12 0v2"/><rect x="4" y="13" width="16" height="6" rx="2"/>',
  'refresh': '<path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M8 16H3v5"/>',
  'trash': '<path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/>',
  'chevron-left': '<path d="m15 18-6-6 6-6"/>',
  'chevron-right': '<path d="m9 18 6-6-6-6"/>',
  'chevron-down': '<path d="m6 9 6 6 6-6"/>',
  'arrow-right': '<path d="M4 12h15"/><path d="m13 6 6 6-6 6"/>',
  'arrow-down': '<path d="M12 4v15"/><path d="m6 13 6 6 6-6"/>',
  'pdf': '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6"/><path d="M10 13h1.5a1.5 1.5 0 0 1 0 3H10v2"/><path d="M16 13v5"/><path d="M15 13h2"/>',
  'sparkles': '<path d="M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Z"/><path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z"/>',
  'bolt': '<path d="M13 2 4.5 13.5H11l-1 8.5 8.5-11.5H12l1-8.5Z"/>',
  'shield': '<path d="M12 3l7.5 3v5.5c0 4.6-3.1 8.2-7.5 9.5-4.4-1.3-7.5-4.9-7.5-9.5V6L12 3Z"/><path d="m9 12 2 2 4-4"/>',
  'clock': '<circle cx="12" cy="12" r="9"/><path d="M12 7.5V12l3 2"/>',
  'grid': '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  'sliders': '<path d="M4 6h10"/><path d="M18 6h2"/><path d="M4 12h4"/><path d="M12 12h8"/><path d="M4 18h12"/><path d="M20 18h.01"/><circle cx="16" cy="6" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="18" r="2"/>',
  'wand': '<path d="M15 4V2"/><path d="M15 10V8"/><path d="M11.5 6h-2"/><path d="M20.5 6h-2"/><path d="m17.5 3.5-1.4 1.4"/><path d="m13.9 7.1-1.4 1.4"/><path d="M4 20l9-9"/><path d="m13 11 3 3"/>',
  'signature': '<path d="M3 17c3.5 0 4-11 7-11s2.5 9 5 9c1.6 0 2.2-2 3-2"/><path d="M3 21h18"/>',
  'plus': '<path d="M12 5v14"/><path d="M5 12h14"/>',
  'cursor': '<path d="M4 4l6.5 16 2.2-6.3L19 11.5 4 4Z"/>',
  'globe': '<circle cx="12" cy="12" r="9"/><path d="M3.5 9h17"/><path d="M3.5 15h17"/><path d="M12 3c2.5 2.5 2.5 15 0 18"/><path d="M12 3c-2.5 2.5-2.5 15 0 18"/>',
  'server': '<rect x="3" y="4" width="18" height="7" rx="2"/><rect x="3" y="13" width="18" height="7" rx="2"/><path d="M7 7.5h.01"/><path d="M7 16.5h.01"/>',
  'no-account': '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c0-3.3 3.1-5.5 7-5.5s7 2.2 7 5.5"/><path d="m4 4 16 16"/>',
};

export function SiteIcon({ name, className = "size-5" }: { name: string; className?: string }) {
  const svg = ICONS[name] ?? ICONS.file;
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: svg }} />
  );
}

