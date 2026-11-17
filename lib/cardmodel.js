(function () {
  function parseLib() {
    return typeof module !== "undefined" ? require("./parse.js") : globalThis.DictExt;
  }

  function cardModel(result, opts) {
    const { limit = 5, showExamples = false, showPronunciation = true } = opts || {};
    if (!result || !result.ok) return { state: "error", error: result && result.error ? String(result.error) : "no response" };
    const lib = parseLib();
    // Examples are always kept so the card's toggle can reveal them; showExamples is only the initial state.
    const items = lib.flattenDefinitions(result.data, limit);
    if (items.length === 0) return { state: "notfound", word: result.data.word };
    return {
      state: "ok",
      word: result.data.word,
      ipa: showPronunciation ? lib.firstIpa(result.data) : null,
      items,
      hasExamples: items.some((i) => i.examples.length > 0),
      examplesOpen: !!showExamples,
    };
  }

  const api = { cardModel };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
