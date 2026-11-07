// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { createHash } from "node:crypto";
import { readFile, readdir, stat, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

export const SCHEMA_VERSION = 1;

const KNOWN = [
  { os: "windows", arch: "x64", format: "nsis", pattern: /^ToolZen_(.+)_x64-setup\.exe$/, canonical: (version) => `ToolZen_${version}_windows_x64-setup.exe` },
  { os: "macos", arch: "aarch64", format: "dmg", pattern: /^ToolZen_(.+)_aarch64\.dmg$/, canonical: (version) => `ToolZen_${version}_macos_aarch64.dmg` },
  { os: "macos", arch: "x64", format: "dmg", pattern: /^ToolZen_(.+)_x64\.dmg$/, canonical: (version) => `ToolZen_${version}_macos_x64.dmg` },
  { os: "linux", arch: "x64", format: "deb", pattern: /^ToolZen_(.+)_amd64\.deb$/, canonical: (version) => `ToolZen_${version}_linux_x64.deb` },
  { os: "linux", arch: "x64", format: "appimage", pattern: /^ToolZen_(.+)_amd64\.AppImage$/, canonical: (version) => `ToolZen_${version}_linux_x64.AppImage` },
];

export function parseSemver(version) {
  const match = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?$/.exec(version);
  if (!match) throw new Error(`invalid version: ${version}`);
  return {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
    prerelease: match[4] ?? null,
    raw: version,
  };
}

export function compareSemver(left, right) {
  const a = parseSemver(left);
  const b = parseSemver(right);
  if (a.major !== b.major) return a.major - b.major;
  if (a.minor !== b.minor) return a.minor - b.minor;
  if (a.patch !== b.patch) return a.patch - b.patch;
  if (a.prerelease && !b.prerelease) return -1;
  if (!a.prerelease && b.prerelease) return 1;
  if (a.prerelease === b.prerelease) return 0;
  return a.prerelease < b.prerelease ? -1 : 1;
}

export function classifyInstaller(fileName) {
  for (const rule of KNOWN) {
    const match = rule.pattern.exec(fileName);
    if (!match) continue;
    const version = match[1];
    parseSemver(version);
    return {
      version,
      os: rule.os,
      arch: rule.arch,
      format: rule.format,
      canonicalName: rule.canonical(version),
    };
  }
  return null;
}

export function latestStable(releases) {
  const eligible = releases.filter((release) => release.channel === "stable" && release.withdrawn !== true && release.prerelease !== true);
  if (eligible.length === 0) return null;
  return [...eligible].sort((a, b) => compareSemver(b.version, a.version))[0];
}

export function validateHistory(document, files = new Map()) {
  const errors = [];
  if (!document || document.schemaVersion !== SCHEMA_VERSION) errors.push("schemaVersion");
  if (!Array.isArray(document?.releases)) {
    errors.push("releases");
    return errors;
  }
  const seenVersions = new Set();
  for (const release of document.releases) {
    if (seenVersions.has(release.version)) errors.push(`duplicate version ${release.version}`);
    seenVersions.add(release.version);
    try {
      const parsed = parseSemver(release.version);
      if (parsed.prerelease && release.channel !== "prerelease") errors.push(`channel ${release.version}`);
      if (!parsed.prerelease && release.channel !== "stable") errors.push(`channel ${release.version}`);
    } catch {
      errors.push(`version ${release.version}`);
    }
    if (!/^[0-9a-f]{40}$/.test(release.commit ?? "")) errors.push(`commit ${release.version}`);
    if (release.withdrawn === true) {
      if (Array.isArray(release.assets) && release.assets.some((asset) => asset.downloadUrl)) {
        errors.push(`withdrawn url ${release.version}`);
      }
      continue;
    }
    const keys = new Set();
    for (const asset of release.assets ?? []) {
      const key = `${asset.os}/${asset.arch}/${asset.format}`;
      if (keys.has(key)) errors.push(`duplicate asset ${release.version} ${key}`);
      keys.add(key);
      if (!/^[0-9a-f]{64}$/.test(asset.sha256 ?? "")) errors.push(`sha256 ${asset.fileName}`);
      if (!Number.isInteger(asset.size) || asset.size < 1) errors.push(`size ${asset.fileName}`);
      if (asset.downloadUrl) errors.push(`unpublished url ${asset.fileName}`);
      const file = files.get(asset.fileName);
      if (files.size > 0 && !file) errors.push(`missing file ${asset.fileName}`);
      if (file && file.sha256 !== asset.sha256) errors.push(`hash mismatch ${asset.fileName}`);
      if (file && file.size !== asset.size) errors.push(`size mismatch ${asset.fileName}`);
    }
  }
  return errors;
}

export async function sha256File(filePath) {
  const data = await readFile(filePath);
  return { sha256: createHash("sha256").update(data).digest("hex"), size: data.length };
}

export async function assembleRelease({ version, commit, channel, notes, signing, inputDir, outputDir }) {
  parseSemver(version);
  if (!/^[0-9a-f]{40}$/.test(commit)) throw new Error("commit must be 40 hex characters");
  const names = await readdir(inputDir);
  const assets = [];
  for (const name of names) {
    const classified = classifyInstaller(name);
    if (!classified) continue;
    if (classified.version !== version) throw new Error(`file ${name} is version ${classified.version}, expected ${version}`);
    const filePath = path.join(inputDir, name);
    const info = await stat(filePath);
    if (!info.isFile()) continue;
    const hashed = await sha256File(filePath);
    const target = path.join(outputDir, classified.canonicalName);
    await mkdir(outputDir, { recursive: true });
    const bytes = await readFile(filePath);
    await writeFile(target, bytes);
    assets.push({
      os: classified.os,
      arch: classified.arch,
      format: classified.format,
      fileName: classified.canonicalName,
      size: hashed.size,
      sha256: hashed.sha256,
      downloadUrl: null,
      signing: signing?.[classified.os] ?? "unsigned",
    });
  }
  assets.sort((a, b) => a.fileName.localeCompare(b.fileName));
  const release = {
    version,
    channel,
    withdrawn: false,
    commit,
    publishedAt: null,
    notes: notes ?? "",
    signing: {
      windows: signing?.windows ?? "unsigned",
      macos: signing?.macos ?? "unsigned",
    },
    assets,
  };
  const document = {
    schemaVersion: SCHEMA_VERSION,
    example: false,
    repository: "AntonioA2006/toolzen-desktop",
    publicAnonymousDownload: false,
    releases: [release],
  };
  const errors = validateHistory(document, new Map(assets.map((asset) => [asset.fileName, asset])));
  if (errors.length > 0) throw new Error(errors.join("; "));
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, "downloads.json"), `${JSON.stringify(document, null, 2)}\n`);
  const sums = assets.map((asset) => `${asset.sha256}  ${asset.fileName}`).join("\n");
  await writeFile(path.join(outputDir, "SHA256SUMS"), sums.length > 0 ? `${sums}\n` : "");
  return document;
}
