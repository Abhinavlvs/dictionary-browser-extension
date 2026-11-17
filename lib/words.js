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

  // Never look up text the user is typing or selecting inside form fields / editors (privacy).
  function isEditable(el) {
    if (!el) return false;
    const tag = String(el.tagName || "").toUpperCase();
    return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable === true;
  }

  const api = { normalizeWord, isPrimaryClick, isEditable };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
