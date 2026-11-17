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
    return trimToMax(out, max);
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

  function trimToMax(out, max) {
    const keys = Object.keys(out);
    if (keys.length > max) {
      keys.sort((a, b) => out[a].lastSeen - out[b].lastSeen);
      for (const k of keys.slice(0, keys.length - max)) delete out[k];
    }
    return out;
  }

  // Combine two lists (e.g. one exported from the other browser). Counts add up.
  function mergeStores(a, b, max) {
    const out = copy(a);
    for (const [k, e] of Object.entries(copy(b))) {
      const mine = Object.getOwnPropertyDescriptor(out, k);
      if (!mine) { put(out, k, e); continue; }
      const m = mine.value;
      put(out, k, {
        ...m,
        count: (m.count || 0) + (e.count || 0),
        firstSeen: Math.min(m.firstSeen, e.firstSeen),
        lastSeen: Math.max(m.lastSeen, e.lastSeen),
      });
    }
    return trimToMax(out, max);
  }

  const FORMAT = "dictionary-lookup-saved-words";
  const LIMITS = { word: 100, text: 2000, words: 50000 };

  function toJson(store) {
    return JSON.stringify({ format: FORMAT, version: 1, words: sortedEntries(store) }, null, 2);
  }

  const time = (v) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : null);

  // Never trust a file from disk: check shape and clamp every field.
  function parseImport(text) {
    let data;
    try { data = JSON.parse(text); } catch { return { ok: false, error: "not a JSON file" }; }
    if (!isObj(data) || data.format !== FORMAT || !Array.isArray(data.words)) {
      return { ok: false, error: "not a Dictionary Lookup saved words file" };
    }
    const store = {};
    for (const e of data.words.slice(0, LIMITS.words)) {
      if (!isObj(e)) continue;
      const word = str(e.word).trim().slice(0, LIMITS.word);
      if (!word) continue;
      const first = time(e.firstSeen), last = time(e.lastSeen);
      const f = first ?? last ?? 0, l = last ?? first ?? 0;
      put(store, word.toLowerCase(), {
        word,
        definition: str(e.definition).slice(0, LIMITS.text),
        partOfSpeech: str(e.partOfSpeech).slice(0, LIMITS.word),
        count: Number.isInteger(e.count) && e.count > 0 ? e.count : 1,
        firstSeen: Math.min(f, l),
        lastSeen: Math.max(f, l),
      });
    }
    return { ok: true, store };
  }

  const api = { recordWord, removeWord, sortedEntries, toCsv, mergeStores, toJson, parseImport };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
