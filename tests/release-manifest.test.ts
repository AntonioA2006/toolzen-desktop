import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { assembleRelease, classifyInstaller, compareSemver, latestStable, parseSemver, validateHistory } from "../scripts/release/manifest.mjs";

const commit = "964332644d85cbaa20bb71bca272b0a66e4afaea";

describe("release manifest", () => {
  it("sorts stable versions above prereleases", () => {
    expect(compareSemver("0.2.0", "0.1.1")).toBeGreaterThan(0);
    expect(compareSemver("0.1.0", "0.1.0-rc.1")).toBeGreaterThan(0);
    expect(parseSemver("0.1.1").prerelease).toBeNull();
  });

  it("picks the newest stable release and ignores prereleases and withdrawn rows", () => {
    const latest = latestStable([
      { version: "0.1.0", channel: "stable", withdrawn: false },
      { version: "0.1.1", channel: "stable", withdrawn: true },
      { version: "0.2.0-rc.1", channel: "prerelease", withdrawn: false },
    ]);
    expect(latest?.version).toBe("0.1.0");
  });

  it("rejects duplicate versions, bad hashes, withdrawn links, and hash mismatches", () => {
    const asset = {
      os: "windows",
      arch: "x64",
      format: "nsis",
      fileName: "ToolZen_0.1.1_windows_x64-setup.exe",
      size: 4,
      sha256: "a".repeat(64),
      downloadUrl: null,
    };
    const release = { version: "0.1.1", channel: "stable", withdrawn: false, commit, assets: [asset] };
    expect(validateHistory({ schemaVersion: 1, releases: [release, release] })).toContain("duplicate version 0.1.1");
    const badHash = { ...asset, sha256: "zz" };
    const hashErrors = validateHistory({ schemaVersion: 1, releases: [{ ...release, assets: [badHash] }] });
    expect(hashErrors.some((error: string) => error.startsWith("sha256"))).toBe(true);
    const withdrawn = {
      ...release,
      withdrawn: true,
      assets: [{ ...asset, downloadUrl: "https://example.invalid/file" }],
    };
    expect(validateHistory({ schemaVersion: 1, releases: [withdrawn] })).toContain("withdrawn url 0.1.1");
    const mismatch = new Map([[asset.fileName, { sha256: "b".repeat(64), size: asset.size }]]);
    const mismatchErrors = validateHistory({ schemaVersion: 1, releases: [release] }, mismatch);
    expect(mismatchErrors).toContain(`hash mismatch ${asset.fileName}`);
    const wrongChannel = { ...release, channel: "prerelease" };
    expect(validateHistory({ schemaVersion: 1, releases: [wrongChannel] })).toContain("channel 0.1.1");
  });

  it("omits an operating system that has no file and records the real hash", async () => {
    const input = await mkdtemp(path.join(tmpdir(), "toolzen-rel-in-"));
    const output = await mkdtemp(path.join(tmpdir(), "toolzen-rel-out-"));
    try {
      await writeFile(path.join(input, "ToolZen_0.1.1_x64-setup.exe"), Buffer.from("exe-bytes"));
      const document = await assembleRelease({
        version: "0.1.1",
        commit,
        channel: "stable",
        notes: "test",
        inputDir: input,
        outputDir: output,
        signing: { windows: "unsigned", macos: "unsigned" },
      });
      expect(document.releases[0].assets.map((asset: { os: string }) => asset.os)).toEqual(["windows"]);
      expect(document.releases[0].assets[0].downloadUrl).toBeNull();
      expect(document.releases[0].assets[0].fileName).toBe("ToolZen_0.1.1_windows_x64-setup.exe");
      expect(classifyInstaller("ToolZen_0.1.1_aarch64.dmg")?.os).toBe("macos");
      const sums = await readFile(path.join(output, "SHA256SUMS"), "utf8");
      expect(sums.startsWith(document.releases[0].assets[0].sha256)).toBe(true);
      expect(document.publicAnonymousDownload).toBe(false);
    } finally {
      await rm(input, { recursive: true, force: true });
      await rm(output, { recursive: true, force: true });
    }
  });
});
