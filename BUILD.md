# Reproducible build instructions

This document describes how to build **VE Video Converter** from source so that the same steps produce the same output (e.g. for CI or audits).

## Requirements

- **Node.js:** 18.x or 20.x (LTS recommended)
- **npm:** 8 or later (comes with Node)
- **Windows build:** Must be run on Windows to produce a working portable `.exe` (FFmpeg binaries are platform-specific)
- **macOS build:** Run on macOS for `.dmg` / `.app`

## Windows (portable exe)

1. Clone the repository and enter the project directory:
   ```cmd
   git clone https://github.com/tnrud99/videoconverter_webm.git
   cd videoconverter_webm
   ```

2. Install dependencies (use `npm ci` for reproducible installs):
   ```cmd
   npm ci
   ```
   If `npm ci` fails (e.g. missing `package-lock.json`), use `npm install` and commit the generated lockfile.

3. Build the Windows portable executable:
   ```cmd
   npm run build:win
   ```

4. Output:
   - `dist/VE Video Converter 1.1.0.exe` (version from `package.json`)

The executable is self-contained and includes FFmpeg via `ffmpeg-static` / `ffprobe-static` (unpacked from asar).

## macOS (dmg)

1. Clone and enter the project:
   ```bash
   git clone https://github.com/tnrud99/videoconverter_webm.git
   cd videoconverter_webm
   ```

2. Install and build:
   ```bash
   npm ci
   npm run build:mac
   ```

3. Output:
   - `dist/VE Video Converter-1.1.0-arm64.dmg` (or equivalent for Intel)

## CI (GitHub Actions)

The same commands are used in CI:

- **Install:** `npm ci`
- **Windows build:** `npm run build:win`
- **Artifact:** The `.exe` under `dist/` is uploaded as the build artifact / release asset.

To enable this in the **videoconverter_webm** repo:

1. In **videoconverter_webm**, create `.github/workflows/` if it does not exist.
2. Copy the workflow template into that repo:
   - From: `video-converter/.github-workflow-template-build-release-win.yml` (in the viewer repo or wherever you have the converter source).
   - To: `videoconverter_webm/.github/workflows/build-release-win.yml`.
3. On every push of a tag like `v1.1.0` or `v1.1.1`, the workflow will build the Windows exe and attach it to a **draft** release for that tag. Publish the release from the GitHub Releases page when ready.

No administrator privileges or code-signing tools are required to produce the unsigned build. Code signing (e.g. SignPath) can be added as a later step in the same workflow if you use it.

## Troubleshooting

- **"ffmpeg.dll not found" (Windows):** Build on Windows; a Mac-built exe may not include the correct FFmpeg DLLs.
- **VCRUNTIME140 / MSVCP140:** Install [Visual C++ Redistributable](https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist) on the machine where the exe runs.
- **Symlink / permission errors (Windows):** Run the terminal as Administrator for `npm ci`, or enable Developer Mode in Windows Settings.
