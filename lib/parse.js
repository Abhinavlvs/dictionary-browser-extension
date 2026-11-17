(function () {
  const arr = (v) => (Array.isArray(v) ? v : []);
  const str = (v) => (typeof v === "string" ? v : "");

  const MAX_SUBSENSE_DEPTH = 5; // hostile/deeply nested input must not blow the stack

  function parseSense(s, depth = 0) {
    s = s || {};
    return {
      definition: str(s.definition),
      examples: arr(s.examples).filter((e) => typeof e === "string"),
      synonyms: arr(s.synonyms),
      antonyms: arr(s.antonyms),
      subsenses: depth < MAX_SUBSENSE_DEPTH ? arr(s.subsenses).map((x) => parseSense(x, depth + 1)) : [],
    };
  }

  function parseEntry(e) {
    e = e || {};
    return {
      partOfSpeech: str(e.partOfSpeech),
      pronunciations: arr(e.pronunciations).map((p) => ({
        type: str(p && p.type),
        text: str(p && p.text),
        tags: arr(p && p.tags),
      })),
      forms: arr(e.forms).map((f) => ({ word: str(f && f.word), tags: arr(f && f.tags) })),
      senses: arr(e.senses).map((x) => parseSense(x)),
    };
  }

  function parseResponse(json) {
    json = json || {};
    return { word: str(json.word), entries: arr(json.entries).map(parseEntry) };
  }

  function flattenDefinitions(parsed, limit) {
    const out = [];
    for (const entry of parsed.entries) {
      for (const sense of entry.senses) {
        if (out.length >= limit) return out;
        if (!sense.definition) continue;
        out.push({
          partOfSpeech: entry.partOfSpeech,
          definition: sense.definition,
          examples: sense.examples,
        });
      }
    }
    return out;
  }

  function firstIpa(parsed) {
    for (const entry of parsed.entries) {
      const p = entry.pronunciations.find((x) => x.type === "ipa" && x.text);
      if (p) return p.text;
    }
    return null;
  }

  const api = { parseResponse, flattenDefinitions, firstIpa };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
