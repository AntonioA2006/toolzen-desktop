// SPDX-License-Identifier: Apache-2.0
// Copyright 2026 ToolZen Contributors

import { assembleRelease } from "./manifest.mjs";

function arg(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? null : process.argv[index + 1] ?? null;
}

const version = arg("--version");
const commit = arg("--commit");
const channel = arg("--channel") ?? "stable";
const inputDir = arg("--input");
const outputDir = arg("--output");
const notes = arg("--notes") ?? "";

if (!version || !commit || !inputDir || !outputDir) {
  console.error("Usage: node scripts/release/assemble.mjs --version 0.1.1 --commit <40-hex> --channel stable --input <dir> --output <dir>");
  console.error("This command writes a local bundle. It does not create a GitHub Release, tag, or draft.");
  process.exit(2);
}

const document = await assembleRelease({ version, commit, channel, notes, inputDir, outputDir, signing: { windows: "unsigned", macos: "unsigned" } });
console.log(`Wrote ${document.releases[0].assets.length} asset records to ${outputDir}. No release was published.`);
