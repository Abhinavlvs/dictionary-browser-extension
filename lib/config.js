(function () {
  const DEFAULTS = {
    popup: {
      enabled: true,
      maxDefinitions: 5,
      showExamples: false,
      showPronunciation: true,
      showAttribution: true,
      trigger: "selection",
      maxWordLength: 45,
      width: 320,
      theme: "auto",
    },
    contextMenu: {
      enabled: true,
      title: "Search in Merriam-Webster",
      urlTemplate: "https://www.merriam-webster.com/dictionary/{query}",
    },
    dictionary: {
      apiUrlTemplate: "https://freedictionaryapi.com/api/v1/entries/en/{word}",
      timeoutMs: 8000,
    },
  };

  const isObj = (v) => v !== null && typeof v === "object" && !Array.isArray(v);
  const posInt = (v) => Number.isInteger(v) && v > 0;
  const bool = (v) => typeof v === "boolean";
  const nonEmptyStr = (v) => typeof v === "string" && v.trim() !== "";
  const oneOf = (...vals) => (v) => vals.includes(v);
  const template = (key) => (v) => nonEmptyStr(v) && v.includes("{" + key + "}");

  const VALIDATORS = {
    popup: {
      enabled: bool, maxDefinitions: posInt, showExamples: bool, showPronunciation: bool,
      showAttribution: bool, trigger: oneOf("selection", "doubleClick"), maxWordLength: posInt,
      width: posInt, theme: oneOf("auto", "light", "dark"),
    },
    contextMenu: { enabled: bool, title: nonEmptyStr, urlTemplate: template("query") },
    dictionary: { apiUrlTemplate: template("word"), timeoutMs: posInt },
  };

  function mergeConfig(raw) {
    const out = JSON.parse(JSON.stringify(DEFAULTS));
    if (!isObj(raw)) return out;
    for (const section of Object.keys(VALIDATORS)) {
      if (!isObj(raw[section])) continue;
      for (const [key, valid] of Object.entries(VALIDATORS[section])) {
        if (valid(raw[section][key])) out[section][key] = raw[section][key];
      }
    }
    return out;
  }

  function fillTemplate(tpl, key, value) {
    return tpl.split("{" + key + "}").join(encodeURIComponent(value));
  }

  const api = { DEFAULTS, mergeConfig, fillTemplate };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
