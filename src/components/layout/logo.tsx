// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

/** Brand mark geometry matches the ToolZen document-Z used on the reference site. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M6 4.5h12l-8.6 8.4H18l-3.4 6.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.6" cy="18.4" r="1.7" fill="currentColor" />
    </svg>
  );
}

export function Wordmark() {
  return (
    <span className="text-sm tracking-tight text-white">
      <b className="font-bold">Tool</b>
      <i className="font-medium text-[var(--tz-cyan-400)]">Zen</i>
    </span>
  );
}
