# Code signing policy

Free code signing provided by SignPath.io, certificate by SignPath Foundation.

## Project scope

- Project: **VE Video Converter**
- Repository: `https://github.com/tnrud99/videoconverter_webm`
- Signed artifacts: Windows portable executable files produced from this repository's source code and CI build scripts.

## Team roles

- Committers and reviewers: repository maintainers and collaborators with write access.
- Approvers: repository owner(s) and maintainers responsible for release/signing approval.

Current primary maintainer: **@tnrud99**.

## Build and release requirements

- All release binaries must be built from source in GitHub Actions.
- Build workflow: `.github/workflows/build-release-win.yml`
- Reproducible steps: `BUILD.md`
- Releases are tied to Git tags (for example, `v1.1.2`) and must map to the exact source revision.

## Privacy policy

This program will not transfer any information to other networked systems unless specifically requested by the user or the person installing or operating it.

Notes:
- The app performs local file conversion.
- The app has no telemetry and no account system.
- Clicking an external website link is a user-initiated action.

## Security and contributor requirements

- Repository access should use multi-factor authentication (MFA).
- SignPath access should use MFA.
- Changes from non-maintainers should be reviewed before release/signing approval.
