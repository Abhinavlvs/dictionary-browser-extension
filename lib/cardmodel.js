(function () {
  function parseLib() {
    return typeof module !== "undefined" ? require("./parse.js") : globalThis.DictExt;
  }

  function cardModel(result, opts) {
    const { limit = 5, showExamples = false } = opts || {};
    if (!result || !result.ok) return { state: "error" };
    const lib = parseLib();
    const items = lib
      .flattenDefinitions(result.data, limit)
      .map((i) => ({ ...i, examples: showExamples ? i.examples : [] }));
    if (items.length === 0) return { state: "notfound", word: result.data.word };
    return { state: "ok", word: result.data.word, ipa: lib.firstIpa(result.data), items };
  }

  const api = { cardModel };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
