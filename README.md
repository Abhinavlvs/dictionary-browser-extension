# Dictionary Lookup (Chrome + Firefox)

Select an English word on any page to see up to 5 definitions. Right-click a selection (word or phrase) and choose "Search in Merriam-Webster" to open it in a new tab.

Definitions: https://freedictionaryapi.com (Wiktionary, CC BY-SA 4.0).

## Installation
Requirements: Chrome (or another Chromium browser), or Firefox 127+; Node.js 18+ and the `zip` command to build.

**1. Get the code and build it**
```
git clone https://github.com/Abhinavlvs/dictionary-browser-extension.git
cd dictionary-browser-extension
npm run build
```
This writes `dist/chrome/` and `dist/firefox/` plus a zip (Chrome) and an `.xpi` (Firefox). Two builds exist because Chrome rejects `background.scripts` and Firefox ignores `background.service_worker`; `manifest.json` in the repo is the Chrome form and the build derives the Firefox one. There are no dependencies to install.

**2a. Chrome**
1. Open `chrome://extensions` and turn on **Developer mode** (top right).
2. Click **Load unpacked** and select the `dist/chrome` folder (the one containing `manifest.json`). Keep that folder in place: Chrome reads it every time it starts.
3. Pin the toolbar button: puzzle icon, then the pin next to Dictionary Lookup.
4. Reload any tabs that were already open. Extensions only attach to pages loaded after install.

Chrome cannot load a zip directly; unzip `dist/dictionary-lookup-<version>-chrome.zip` first if you want to keep a copy elsewhere.

**2b. Firefox 127 or newer**
1. Open `about:debugging`, click **This Firefox**, then **Load Temporary Add-on...**.
2. Select `dist/dictionary-lookup-<version>-firefox.xpi` (or `dist/firefox/manifest.json`). Do not load the repo's root `manifest.json` in Firefox.
3. Open `about:addons`, click Dictionary Lookup, open **Permissions**, and allow access to all websites. Nothing works until you do.
4. Optional: puzzle icon, gear next to Dictionary Lookup, **Pin to Toolbar**.

A temporary add-on is removed when Firefox quits, so repeat these steps next time. A permanent install needs the add-on signed (free, via addons.mozilla.org "On your own" distribution), or Firefox Developer Edition/Nightly with `xpinstall.signatures.required` set to false.

**3. Try it**
Double-click a word on any normal web page, such as a Wikipedia article. A card with definitions appears. Right-click a selection for "Search in Merriam-Webster". To use it in private windows, see below.

**Updating:** `git pull`, `npm run build`, then click **Reload** on the extension (`chrome://extensions` or `about:debugging`).

**Troubleshooting**
- Nothing happens: reload the page; in Firefox check the all-websites permission; make sure you are not on a `chrome://` or `about:` page.
- Chrome shows an error on load: you probably selected the repo folder or a different one. Select `dist/chrome`.
- The `OFF` badge is showing: the popup is disabled for this site. Click the toolbar button to turn it back on.

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

## License
MIT, see `LICENSE`. The MIT licence covers the code in this repository. The toolbar icon (`icons/`) is a third-party image and is not covered by it; check its original licence and credit the author before redistributing. Definitions come from Wiktionary under CC BY-SA 4.0 (via freedictionaryapi.com).
