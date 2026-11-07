// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="6" fill="currentColor" opacity="0.14" />
      <path d="M7 15.5V8.5h10" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.5" cy="15.5" r="1.35" fill="currentColor" />
    </svg>
  );
}
