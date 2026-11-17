# Dictionary Lookup (Chrome + Firefox)

Select an English word on any page to see up to 5 definitions. Right-click a selection (word or phrase) and choose "Search in Merriam-Webster" to open it in a new tab.

Definitions: https://freedictionaryapi.com (Wiktionary, CC BY-SA 4.0).

## Build and load it
`npm run build` writes browser-specific packages to `dist/`. Chrome (MV3) rejects `background.scripts` and Firefox ignores `background.service_worker`, so `manifest.json` in the repo is the Chrome form and the build derives the Firefox one.
- Chrome: `chrome://extensions` -> Developer mode -> Load unpacked -> `dist/chrome` (or this folder, for development). `dist/dictionary-lookup-<version>-chrome.zip` is the Web Store upload; Chrome cannot load a zip directly, unzip it first.
- Firefox 127+: `about:debugging` -> This Firefox -> Load Temporary Add-on -> `dist/dictionary-lookup-<version>-firefox.xpi` (or `dist/firefox/manifest.json`). Do not load the repo's root `manifest.json` in Firefox. Permanent installs need the add-on signed on addons.mozilla.org.
- Firefox only: open `about:addons` -> the extension -> Permissions and allow access to all websites.

## Privacy and security
- Only a single word you select with the mouse is sent, to `dictionary.apiUrlTemplate` (default freedictionaryapi.com), with no cookies and no referrer. Text selected inside inputs, textareas and editors is never sent. Phrases are never sent anywhere automatically; the right-click search only opens a page when you pick it.
- Disable the popup per site with the toolbar button, or turn it off entirely with `popup.enabled`.
- URL templates in `config.json` must be `https://`; anything else is ignored.
- Synthetic events from web pages are ignored, and the card lives in a closed shadow root.
- Firefox 127+ is required (earlier versions do not grant the content-script permission at install).

## Configure
Edit `config.json`, then click **Reload** on the extension (browsers cannot re-read the file while it runs). Missing or invalid values fall back to the defaults, so a typo cannot break it.

| Key | Default | Notes |
|---|---|---|
| `popup.enabled` | true | false turns the popup off |
| `popup.maxDefinitions` | 5 | positive integer |
| `popup.showExamples` | false | |
| `popup.showPronunciation` | true | IPA |
| `popup.showAttribution` | true | keep on to respect the Wiktionary licence |
| `popup.trigger` | "selection" | or "doubleClick" |
| `popup.maxWordLength` | 45 | longer selections are ignored |
| `popup.width` | 320 | pixels |
| `popup.theme` | "auto" | "light" or "dark" |
| `popup.disabledHosts` | [] | sites where the popup starts disabled, e.g. `["mail.google.com"]` |
| `contextMenu.enabled` | true | |
| `contextMenu.title` | "Search in Merriam-Webster" | |
| `contextMenu.urlTemplate` | MW URL | must contain `{query}` (URL-encoded on use) |
| `dictionary.apiUrlTemplate` | freedictionaryapi URL | must contain `{word}` |
| `dictionary.timeoutMs` | 8000 | |

## Turn it off or on for one site
Click the extension's toolbar button while on a page: it toggles the popup for that whole site (hostname). The badge shows `OFF` while disabled; click again to re-enable. The choice is remembered by the browser and beats `popup.disabledHosts`. Right-click search keeps working on disabled sites. The button does nothing on pages where the extension cannot run.

## Private windows
Browsers require a one-time opt-in:
- Chrome: `chrome://extensions` -> Details -> Allow in Incognito (and "Allow access to file URLs" for local files).
- Firefox: `about:addons` -> Dictionary Lookup -> Run in Private Windows.

It cannot run on browser-internal pages (`chrome://`, `about:`), the Chrome Web Store, addons.mozilla.org, or the built-in PDF viewer.

## Test
`npm test` (Node 18+, no dependencies).
