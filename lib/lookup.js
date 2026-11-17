(function () {
  const BASE = "https://freedictionaryapi.com/api/v1/entries/en/";

  function parse(json) {
    const p = typeof module !== "undefined" ? require("./parse.js") : globalThis.DictExt;
    return p.parseResponse(json);
  }

  function createLookup(fetchFn) {
    const cache = new Map();
    return async function lookup(word) {
      if (cache.has(word)) return { ok: true, data: cache.get(word) };
      try {
        const res = await fetchFn(BASE + encodeURIComponent(word));
        if (!res.ok) return { ok: false, error: "HTTP " + res.status };
        const data = parse(await res.json());
        cache.set(word, data);
        return { ok: true, data };
      } catch (e) {
        return { ok: false, error: String((e && e.message) || e) };
      }
    };
  }

  const api = { createLookup };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
