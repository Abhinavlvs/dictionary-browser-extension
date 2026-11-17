# Dictionary Lookup (Chrome + Firefox)

Select an English word on any page to see up to 5 definitions. Right-click a selection (word or phrase) and choose "Search in Merriam-Webster" to open it in a new tab.

Definitions: https://freedictionaryapi.com (Wiktionary, CC BY-SA 4.0).

## Load it
- Chrome: `chrome://extensions` -> Developer mode -> Load unpacked -> this folder.
- Firefox: `about:debugging` -> This Firefox -> Load Temporary Add-on -> `manifest.json`.

## Test
`npm test` (Node 18+, no dependencies).

## Show examples later
`cardModel(result, { showExamples: true })` in `content.js` includes examples; `card.js` already renders them.
