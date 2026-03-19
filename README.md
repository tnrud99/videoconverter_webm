# VE Video Converter

A simple desktop app to convert **WebM to MP4** for use in common video editors. Built with Electron; runs offline with no account or limits.

- **Platforms:** Windows (portable `.exe`), macOS (`.dmg`)
- **Input:** WebM files  
- **Output:** MP4 (H.264/AAC, editing-friendly)

## For users

1. Download the latest release from [Releases](https://github.com/tnrud99/videoconverter_webm/releases).
2. **Windows:** Run `VE Video Converter X.X.X.exe` (portable, no install).
3. **macOS:** Open the DMG, drag the app to Applications.

See [USER_GUIDE.md](./USER_GUIDE.md) for usage.

## Build from source (reproducible)

Requirements: **Node.js 18+**, npm.

### Windows (portable exe)

```cmd
npm ci
npm run build:win
```

Output: `dist/VE Video Converter X.X.X.exe` (portable).

### macOS

```bash
npm ci
npm run build:mac
```

Output: `dist/VE Video Converter-X.X.X-arm64.dmg` (or equivalent for Intel).

See [BUILD.md](./BUILD.md) for detailed, step-by-step build instructions.

## Development

```bash
npm install
npm start
```

## Technical notes

- **FFmpeg:** Bundled via `ffmpeg-static` and `ffprobe-static` (see [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md)).
- No installation required on Windows; single portable executable.
- No telemetry, no account, no network use except for opening external links in the browser.

## License

MIT. Third-party licenses (e.g. FFmpeg) are listed in [THIRD_PARTY_NOTICES.md](./THIRD_PARTY_NOTICES.md).
