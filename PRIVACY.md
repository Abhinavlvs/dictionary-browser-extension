# Privacy Policy

Last updated: 2026-11-17

Dictionary Lookup does not collect, store on a server, sell or share personal data, and contains no analytics or telemetry.

## What leaves your browser
- When you select a **single word** with the mouse on a web page, that word (lowercased) is sent to the dictionary API configured in `config.json`, by default `https://freedictionaryapi.com/api/v1/entries/en/<word>`, to fetch its definition. The request carries no cookies and no referrer. Your IP address is visible to that service as for any web request; see its own policy.
- Text selected inside input fields, textareas and editors, selections of more than one word, and selections made by web page scripts are never sent.
- "Search in Merriam-Webster" opens a Merriam-Webster page for the text you chose in the context menu, only when you click it. Merriam-Webster then sees your request under its own policy.

## What is stored on your device
- Your per-site on/off choices (site host names) in the browser's extension storage (`storage.local`).
- A short-lived in-memory cache of recently looked-up definitions, discarded when the browser stops the extension's background process.
- The extension's own `config.json`, which ships with the extension.

## Permissions and why
- Access to all websites: to show the definition card where you select a word.
- `contextMenu`: the "Search in Merriam-Webster" item.
- `storage`: your per-site toggles.
- Host access to `freedictionaryapi.com`: to fetch definitions.

## Changes and contact
Changes to this policy are listed in `CHANGELOG.md`. Questions: open an issue at https://github.com/Abhinavlvs/dictionary-browser-extension/issues.
