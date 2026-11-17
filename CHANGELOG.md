# Changelog

All notable changes to this project are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.0] - 2026-11-17

### Added
- Toolbar button now opens a panel showing On or Off for the current site, a toggle, and a link to the saved words (replaces click-to-toggle).
- "Show examples" button on the popup card to reveal or hide examples (`popup.showExamples` sets the initial state).
- Saved words: every word that returns a definition is saved on your device with a lookup count and times. Right-click, then "Open saved words" to search, delete, clear or export them as CSV. Export and import a JSON file to merge the list between Chrome and Firefox. Controlled by `popup.saveWords` and `popup.maxSavedWords`.

## [0.1.1] - 2026-11-17

### Changed
- New toolbar and store icons (from Icons8, credited in the README).
- Error card now shows the actual failure reason.

### Fixed
- A lookup of the same word started twice could show the first reply in the old position.
- Selections wrapped in quotes or brackets and accented words (e.g. café) now work.
- Two quick toolbar clicks could lose one per-site toggle.
- Tabs left over after an extension update no longer show a misleading connection error.

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
