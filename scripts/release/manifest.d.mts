// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

export interface Semver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string | null;
  raw: string;
}

export interface InstallerName {
  version: string;
  os: string;
  arch: string;
  format: string;
  canonicalName: string;
}

export interface ReleaseAsset {
  os: string;
  arch: string;
  format: string;
  fileName: string;
  size: number;
  sha256: string;
  downloadUrl: string | null;
  signing?: string;
}

export interface ReleaseRecord {
  version: string;
  channel: string;
  withdrawn?: boolean;
  commit?: string;
  assets?: ReleaseAsset[];
}

export interface ReleaseDocument {
  schemaVersion: number;
  releases: ReleaseRecord[];
  publicAnonymousDownload?: boolean;
}

export function parseSemver(version: string): Semver;
export function compareSemver(left: string, right: string): number;
export function classifyInstaller(fileName: string): InstallerName | null;
export function latestStable(releases: ReleaseRecord[]): ReleaseRecord | null;
export function validateHistory(document: ReleaseDocument, files?: Map<string, { sha256: string; size: number }>): string[];
export function assembleRelease(options: {
  version: string;
  commit: string;
  channel: string;
  notes?: string;
  signing?: { windows?: string; macos?: string };
  inputDir: string;
  outputDir: string;
}): Promise<ReleaseDocument & { releases: Array<ReleaseRecord & { assets: ReleaseAsset[] }> }>;
