(function () {
  const MAX_LEN = 45;
  const WORD_RE = /^[a-z]+(?:[-'’][a-z]+)*$/;

  function normalizeWord(selectionText, maxLen = MAX_LEN) {
    if (typeof selectionText !== "string") return null;
    const w = selectionText.trim().replace(/[.,;:!?]+$/, "").toLowerCase();
    if (!w || w.length > maxLen || !WORD_RE.test(w)) return null;
    return w.replace(/’/g, "'"); // Wiktionary entries use the straight apostrophe
  }

  function isPrimaryClick(event) {
    return !!event && event.button === 0;
  }

  const api = { normalizeWord, isPrimaryClick };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
