<!-- SPDX-License-Identifier: Apache-2.0 -->
<!-- Copyright 2026 ToolZen Contributors -->

# Releases

Nothing in this repository publishes a GitHub Release. There is no tag step, no draft, and no `gh release create` in the workflows. The 0.1.1 Windows file, when the package job finishes, is an Actions artifact. Those artifact URLs expire and are not the public download contract below.

## What a published version would contain

For one immutable version record:

- Version, `stable` or `prerelease`, 40-character commit, and notes.
- Installer files renamed to `ToolZen_<version>_<os>_<arch>_<format>` as implemented in `scripts/release/manifest.mjs`.
- `SHA256SUMS` and `downloads.json` generated from the file bytes. Missing operating systems are omitted. They are not empty links.
- `signing.windows` and `signing.macos` are `unsigned` until a real signature exists. This repo has no certificate and this workflow does not create one.
- `publishedAt` stays null and `downloadUrl` stays null until a person publishes that exact record.
- A withdrawn version stays in the history with `withdrawn: true` and no download URL. The site can say it was withdrawn. It must not keep serving the file under the old name as if it were current.

`latest` for the website is the highest stable semver that is not withdrawn and not a prerelease. `0.2.0-rc.1` does not replace `0.1.1`.

## Operator steps

1. Let `.github/workflows/ci.yml` build installers. Download the Actions artifacts for the commit you intend to ship. Do not treat those URLs as permanent.
2. Put the Tauri outputs (`ToolZen_<version>_x64-setup.exe` and the other package files you actually have) in one directory.
3. Run:

```bash
node scripts/release/assemble.mjs --version 0.1.1 --commit <40-hex> --channel stable --input <dir> --output <bundle> --notes "notes"
```

4. Check `downloads.json` and `SHA256SUMS`. The script does not upload anything.
5. Optional: run the **Release bundle** workflow by hand on that commit. It runs the manifest tests and stops. It does not publish.

## Publishing gate

`.github/workflows/release-publish.yml` is manual only. It does not run on push or on tags.

- The job is skipped unless the repository variable `RELEASE_PUBLISH_ENABLED` is the string `true`. That variable is not set by this change.
- The workflow names an environment `release`. Writing that name in YAML does not create required reviewers. Protection exists only after someone adds it in GitHub settings.
- If the variable is turned on anyway, the job exits with an error and still does not create a release.

Do not enable that variable until you have reviewed a separate change that actually uploads assets, and until the environment has required reviewers.

## Website contract

The site should read a manifest with `schemaVersion: 1`. `docs/examples/downloads.example.json` shows the shape. It is marked `example: true` and `notPublished: true`. Those rows are not downloads.

When a release is really public, a canonical asset URL looks like:

`https://github.com/AntonioA2006/toolzen-desktop/releases/download/<tag>/<file>`

Do not write those URLs into the manifest before the release exists.

## Private repository

`AntonioA2006/toolzen-desktop` is private. A public website cannot anonymously download its Releases or Actions artifacts. Do not put a GitHub token in the browser. This change does not make the repository public and does not create another repository.

Before the website can offer files, choose one of these and say so:

- A public distribution place you control, with the same file names and checksums.
- The website server downloads from GitHub with a server-side credential and serves the bytes itself.

Until that choice, the desktop installers stay private Actions artifacts.
