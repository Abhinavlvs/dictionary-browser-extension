(function () {
  function hostOf(url) {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:" ? u.hostname.toLowerCase() : null;
    } catch {
      return null;
    }
  }

  function inList(host, list) {
    return (list || []).some((h) => String(h).toLowerCase() === String(host).toLowerCase());
  }

  // overrides: { host: boolean } set by the toolbar toggle; wins over config.popup.disabledHosts
  function isEnabled(host, disabledHosts, overrides) {
    const key = String(host).toLowerCase();
    if (overrides && typeof overrides[key] === "boolean") return overrides[key];
    return !inList(key, disabledHosts);
  }

  function toggleOverrides(host, disabledHosts, overrides) {
    const key = String(host).toLowerCase();
    const next = { ...(overrides || {}) };
    const wanted = !isEnabled(key, disabledHosts, overrides);
    const configDefault = !inList(key, disabledHosts);
    if (wanted === configDefault) delete next[key];
    else next[key] = wanted;
    return next;
  }

  const api = { hostOf, isEnabled, toggleOverrides };
  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, api);
  if (typeof module !== "undefined") module.exports = api;
})();
