# Contributing

Thanks for helping. This is a small, dependency-free extension; the goal is to keep it that way.

## Setup
Requirements: Node.js 18+ and the `zip` command.
```
git clone https://github.com/Abhinavlvs/dictionary-browser-extension.git
cd dictionary-browser-extension
npm test         # unit tests (node:test); there are no dependencies to install
npm run build    # writes dist/chrome, dist/firefox and the zip/xpi packages
```
Load `dist/chrome` (Chrome: `chrome://extensions` -> Load unpacked) or the `.xpi` (Firefox: `about:debugging` -> Load Temporary Add-on). See the README.

## Project rules
- Pure logic lives in `lib/` as classic scripts that attach to `globalThis.DictExt` and `module.exports`, so Node can test them. Keep `lib/` free of browser APIs. `background.js`, `content.js` and `card.js` stay thin.
- **Write the test first** for any change in `lib/` (red, then green).
- Never use `innerHTML` or insert untrusted text as HTML. Card text goes through `textContent`.
- Any new message between content script and background must be validated in the background (it is the trust boundary).
- Changes that send data anywhere new need a README "Privacy and security" and `PRIVACY.md` update.
- `manifest.json` is the Chrome form. The Firefox manifest is derived in `scripts/build.js`; do not add `background.scripts` to the root manifest.
- Bump `version` in both `package.json` and `manifest.json` together and add a `CHANGELOG.md` entry (a test enforces both).

## Pull requests
1. Open an issue first for anything larger than a small fix.
2. Branch from `main`, keep commits focused, use Conventional Commit style (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
3. `npm test` and `npm run build` must pass; CI runs them.
4. Describe how you tested it in Chrome and Firefox if the change touches runtime code.

## Reporting security issues
Please do not open a public issue. See `SECURITY.md`.
