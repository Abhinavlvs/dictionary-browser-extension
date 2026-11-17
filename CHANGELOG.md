# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Changed
- New toolbar and store icons.

## [0.1.0] - 2026-11-17

### Added
- Select an English word to see up to 5 definitions in a card (data from freedictionaryapi.com / Wiktionary).
- Right-click "Search in Merriam-Webster" for words and phrases.
- `config.json` to control popup, context menu and dictionary API behavior; invalid values fall back to defaults.
- Per-site enable/disable via the toolbar button, plus `popup.disabledHosts`.
- Chrome (Manifest V3 service worker) and Firefox 127+ builds from one codebase (`npm run build`).
- Works in all frames; opt-in for private windows.

### Security
- Only real user gestures trigger lookups (synthetic page events are ignored).
- Text selected in inputs, textareas and editors is never sent.
- The background validates sender and input; URL templates must be `https://`.
- Hardened fetch: no credentials, no referrer, no redirects, JSON content-type and size limits, timeout.
- Bounded cache with request de-duplication; the card renders in a closed shadow root using `textContent` only.
