# Releasing

1. Update `version` in `package.json` and `manifest.json` (they must match) and move the `## [Unreleased]` notes in `CHANGELOG.md` under a new `## [x.y.z] - YYYY-MM-DD` heading.
2. `npm test && npm run build`, and try `dist/chrome` and the Firefox xpi once.
3. Commit, then tag and push: `git tag -a vX.Y.Z -m "vX.Y.Z" && git push origin main vX.Y.Z`.
4. The **Release** workflow (`.github/workflows/release.yml`) checks the tag matches both versions, runs tests, builds, and publishes a GitHub Release with the Chrome zip, the Firefox xpi and `SHA256SUMS.txt`, using the matching CHANGELOG section as notes.

## Store publishing (manual, not automated)
- **Chrome Web Store:** upload the `-chrome.zip` in the developer dashboard (one-time registration fee). A privacy policy URL is required: use `PRIVACY.md`.
- **Firefox (addons.mozilla.org):** upload the `-firefox.xpi`. Choose "On your own" for a signed self-distributed `.xpi`, or list it publicly. Change the add-on id in `scripts/build.js` (`dictionary-lookup@local`) to one you own before the first public submission.
- Automating store uploads needs API credentials stored as repository secrets (Chrome Web Store API, AMO JWT issuer/secret). Add them only when you decide to publish publicly.
