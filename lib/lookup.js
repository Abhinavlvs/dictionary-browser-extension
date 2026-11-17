(function () {
  const MAX_BODY_CHARS = 512 * 1024;
  const lib = (name) => (typeof module !== "undefined" ? require("./" + name + ".js") : globalThis.DictExt);

  function createLookup(fetchFn, options) {
    const { apiUrlTemplate, timeoutMs, maxCacheEntries } = {
      ...lib("config").DEFAULTS.dictionary,
      maxCacheEntries: 200,
      ...options,
    };
    const cache = new Map(); // word -> parsed data; insertion order = age
    const inflight = new Map(); // word -> Promise, so concurrent identical lookups share one request

    async function fetchWord(word) {
      const controller = new AbortController();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, timeoutMs);
      try {
        const url = lib("config").fillTemplate(apiUrlTemplate, "word", word);
        const res = await fetchFn(url, {
          signal: controller.signal,
          credentials: "omit",
          referrerPolicy: "no-referrer",
          redirect: "error",
        });
        if (!res.ok) return { ok: false, error: "HTTP " + res.status };
        if (!/json/i.test(res.headers.get("content-type") || "")) return { ok: false, error: "unexpected content type" };
        const text = await res.text();
        if (text.length > MAX_BODY_CHARS) return { ok: false, error: "response too large" };
        const data = lib("parse").parseResponse(JSON.parse(text));
        cache.set(word, data);
        if (cache.size > maxCacheEntries) cache.delete(cache.keys().next().value);
        return { ok: true, data };
      } catch (e) {
        return { ok: false, error: timedOut ? "timeout" : String((e && e.message) || e) };
      } finally {
        clearTimeout(timer);
      }
    }

    return function lookup(word) {
      if (cache.has(word)) return Promise.resolve({ ok: true, data: cache.get(word) });
      if (!inflight.has(word)) {
        inflight.set(word, fetchWord(word).finally(() => inflight.delete(word)));
      }
      return inflight.get(word);
    };
  }

  const api = { createLookup };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
