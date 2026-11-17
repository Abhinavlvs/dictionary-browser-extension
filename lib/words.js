(function () {
  const MAX_LEN = 45;
  const WORD_RE = /^[a-z]+(?:[-'’][a-z]+)*$/;

  function normalizeWord(selectionText) {
    if (typeof selectionText !== "string") return null;
    const w = selectionText.trim().replace(/[.,;:!?]+$/, "").toLowerCase();
    if (!w || w.length > MAX_LEN || !WORD_RE.test(w)) return null;
    return w;
  }

  function mwUrl(text) {
    return "https://www.merriam-webster.com/dictionary/" + encodeURIComponent(text);
  }

  const api = { normalizeWord, mwUrl };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
