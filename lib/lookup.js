(function () {
  const lib = (name) => (typeof module !== "undefined" ? require("./" + name + ".js") : globalThis.DictExt);

  function createLookup(fetchFn, options) {
    const { apiUrlTemplate, timeoutMs } = { ...lib("config").DEFAULTS.dictionary, ...options };
    const cache = new Map();
    return async function lookup(word) {
      if (cache.has(word)) return { ok: true, data: cache.get(word) };
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      try {
        const url = lib("config").fillTemplate(apiUrlTemplate, "word", word);
        const res = await fetchFn(url, { signal: controller.signal });
        if (!res.ok) return { ok: false, error: "HTTP " + res.status };
        const data = lib("parse").parseResponse(await res.json());
        cache.set(word, data);
        return { ok: true, data };
      } catch (e) {
        return { ok: false, error: timedOut ? "timeout" : String((e && e.message) || e) };
      } finally {
        clearTimeout(timer);
      }
    };
  }

  const api = { createLookup };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
