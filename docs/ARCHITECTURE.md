# Architecture

## Overview
```
 web page ──(mouse events)──> content.js ──{type:"getState"|"lookup"}──> background.js ──fetch──> dictionary API
                                  │                                          │
                              card.js (closed shadow DOM)             config.json, storage.local
```

## Modules
| File | Role | Browser APIs? |
|---|---|---|
| `lib/parse.js` | Normalise the API response (bounded depth) | no |
| `lib/words.js` | `normalizeWord`, `isEditable`, `isPrimaryClick` | no |
| `lib/config.js` | Defaults, validation (`mergeConfig`), `fillTemplate`, https-only templates | no |
| `lib/sites.js` | Per-site enable logic (`hostOf`, `isEnabled`, `toggleOverrides`) | no |
| `lib/lookup.js` | Hardened fetch, timeout, de-duplication, bounded cache | no (fetch injected) |
| `lib/cardmodel.js` | Turns a lookup result into what the card shows | no |
| `lib/serial.js` | Serial queue for storage read-modify-write | no |
| `card.js` | Renders the card (closed shadow root, `textContent` only) | DOM |
| `content.js` | Event handling, state, messaging | yes |
| `background.js` | Trust boundary: config, menu, toggle, lookup | yes |
| `scripts/build.js` | Derives Chrome/Firefox manifests, packages zips | Node |

`lib/*.js` are classic scripts: they attach to `globalThis.DictExt` for the browser and `module.exports` for Node tests. No bundler is needed.

## Message protocol (content -> background)
- `{type: "getState"}` -> `{config, enabled}`; also updates the toolbar badge for frame 0.
- `{type: "lookup", word}` -> `{ok: true, data}` or `{ok: false, error}`. The background re-validates `word`.
- Toolbar popup -> background: `{type: "siteState", tabId}` and `{type: "toggleSite", tabId}` -> `{host, enabled}` (`host` is null where no content script runs).
- Background -> content (frame 0 only): `{type: "getHost"}` -> hostname, used by the toolbar toggle so no `tabs` permission is required.
- Toggle state lives in `storage.local` key `siteOverrides` (`{host: boolean}`); `storage.onChanged` tells content scripts to refresh.

## Why two manifests
Chrome MV3 rejects `background.scripts`; Firefox ignores `background.service_worker`. The repo's `manifest.json` is the Chrome form; `scripts/build.js` derives the Firefox one (script list read from `importScripts` in `background.js`, Gecko id, minimum version 127).

## Security model
The web page is untrusted. Only real (`isTrusted`) primary-button gestures trigger lookups. The background accepts messages only from this extension, re-validates input, restricts URL templates to https, and fetches without credentials or referrer. Untrusted text is rendered with `textContent`.
