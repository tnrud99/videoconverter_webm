# Third-Party Notices

This project uses the following third-party software. Licenses and attribution are summarized below.

## FFmpeg

This application bundles FFmpeg binaries (and optionally ffprobe) via the npm packages `ffmpeg-static` and `ffprobe-static`. Those packages distribute official FFmpeg builds.

- **FFmpeg:** https://ffmpeg.org/
- **License:** FFmpeg is licensed under the GNU LGPL 2.1+ and GPL 2+ (depending on configuration). The builds distributed by `ffmpeg-static` / `ffprobe-static` are typically GPL/LGPL. See the FFmpeg source and the package vendors for exact terms.
- **Attribution:** We do not modify FFmpeg. We use it only to convert media (e.g. WebM to MP4) locally on the user’s machine.

## fluent-ffmpeg

Node.js wrapper used to invoke FFmpeg from this application.

- **Project:** https://github.com/fluent-ffmpeg/node-fluent-ffmpeg
- **License:** MIT

## ffmpeg-static

Provides platform-specific FFmpeg binaries.

- **Project:** https://github.com/eugeneware/ffmpeg-static
- **License:** GPL-3.0 (for the statically linked FFmpeg binary); the npm package and build scripts have their own terms. See the repository for details.

## ffprobe-static

Provides platform-specific ffprobe binaries.

- **Project:** https://github.com/joshwnj/ffprobe-static
- **License:** See the repository; typically matches FFmpeg (GPL/LGPL) for the binary.

---

The rest of this project (application code, UI, build configuration) is licensed under the MIT License. See the root [LICENSE](./LICENSE) file.
