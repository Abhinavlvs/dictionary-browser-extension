(function () {
  // Saved words are a plain object { lowercasedWord: entry }. All functions are pure.
  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const str = (v) => (typeof v === "string" ? v : "");

  // defineProperty so a key like "__proto__" is stored as data and never changes a prototype.
  function put(obj, key, value) {
    Object.defineProperty(obj, key, { value, enumerable: true, writable: true, configurable: true });
  }

  function copy(store) {
    const out = {};
    if (isObj(store)) for (const [k, v] of Object.entries(store)) put(out, k, v);
    return out;
  }

  function recordWord(store, item, now, max) {
    const out = copy(store);
    const word = str(item && item.word).trim();
    if (!word) return out;
    const key = word.toLowerCase();
    const old = Object.getOwnPropertyDescriptor(out, key);
    if (old && isObj(old.value)) {
      put(out, key, { ...old.value, count: (old.value.count || 0) + 1, lastSeen: now });
    } else {
      put(out, key, {
        word, definition: str(item.definition), partOfSpeech: str(item.partOfSpeech),
        count: 1, firstSeen: now, lastSeen: now,
      });
    }
    const keys = Object.keys(out);
    if (keys.length > max) {
      keys.sort((a, b) => out[a].lastSeen - out[b].lastSeen);
      for (const k of keys.slice(0, keys.length - max)) delete out[k];
    }
    return out;
  }

  function removeWord(store, word) {
    const out = copy(store);
    delete out[str(word).trim().toLowerCase()];
    return out;
  }

  function sortedEntries(store) {
    return Object.values(copy(store)).sort((a, b) => b.lastSeen - a.lastSeen);
  }

  // A leading = + - @ (or tab/CR) would be run as a formula by spreadsheets; prefix a quote.
  function cell(v) {
    let s = String(v);
    if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
    return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  function toCsv(entries) {
    const iso = (t) => new Date(t).toISOString();
    const rows = entries.map((e) =>
      [e.word, e.partOfSpeech, e.definition, e.count, iso(e.firstSeen), iso(e.lastSeen)].map(cell).join(",")
    );
    return ["word,part_of_speech,definition,count,first_seen,last_seen", ...rows].join("\r\n");
  }

  const api = { recordWord, removeWord, sortedEntries, toCsv };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
