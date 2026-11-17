if (typeof importScripts === "function") {
  importScripts("lib/parse.js", "lib/words.js", "lib/config.js", "lib/sites.js", "lib/lookup.js");
}

const api = globalThis.browser ?? globalThis.chrome;
const MENU_ID = "mw-search";
const OVERRIDES_KEY = "siteOverrides"; // { host: boolean } set by the toolbar toggle

// Load config.json once per background start; fall back to defaults on any error.
const configPromise = (async () => {
  try {
    const res = await fetch(api.runtime.getURL("config.json"));
    return DictExt.mergeConfig(await res.json());
  } catch (e) {
    console.warn("Dictionary Lookup: could not read config.json, using defaults", e);
    return DictExt.mergeConfig(null);
  }
})();

const lookupPromise = configPromise.then((cfg) =>
  DictExt.createLookup((url, opts) => fetch(url, opts), cfg.dictionary)
);

// Rebuild the menu on every background start (this also covers install/update), so config edits
// apply after an extension reload. A separate onInstalled call would race with this one.
async function buildMenu() {
  const cfg = await configPromise;
  await api.contextMenus.removeAll();
  if (!cfg.contextMenu.enabled) return;
  api.contextMenus.create({ id: MENU_ID, title: cfg.contextMenu.title, contexts: ["selection"] });
}
buildMenu();

api.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== MENU_ID) return;
  const text = (info.selectionText || "").trim();
  if (!text) return;
  const cfg = await configPromise;
  api.tabs.create({ url: DictExt.fillTemplate(cfg.contextMenu.urlTemplate, "query", text) });
});

async function getOverrides() {
  const r = await api.storage.local.get(OVERRIDES_KEY);
  return r[OVERRIDES_KEY] || {};
}

// URL of the page the message came from; for iframes prefer the tab (top page) URL when available.
function pageUrl(sender) {
  if (sender.frameId === 0) return sender.url;
  return (sender.tab && sender.tab.url) || sender.url;
}

async function getState(sender) {
  const cfg = await configPromise;
  const host = DictExt.hostOf(pageUrl(sender));
  const enabled = host ? DictExt.isEnabled(host, cfg.popup.disabledHosts, await getOverrides()) : true;
  if (sender.tab && sender.frameId === 0) {
    api.action.setBadgeText({ tabId: sender.tab.id, text: enabled ? "" : "OFF" }).catch(() => {});
  }
  return { config: cfg, enabled };
}

// Toolbar button: toggle the popup for the current site. The host is requested from the page's
// content script (frame 0) instead of reading tab.url, so no "tabs" permission is needed.
api.action.onClicked.addListener(async (tab) => {
  let host;
  try {
    host = await api.tabs.sendMessage(tab.id, { type: "getHost" }, { frameId: 0 });
  } catch (e) {
    return; // no content script on this page (browser-internal page, PDF viewer, ...)
  }
  if (!host) return;
  const cfg = await configPromise;
  const next = DictExt.toggleOverrides(host, cfg.popup.disabledHosts, await getOverrides());
  await api.storage.local.set({ [OVERRIDES_KEY]: next });
});

async function handleLookup(rawWord) {
  const cfg = await configPromise;
  const word = DictExt.normalizeWord(rawWord, cfg.popup.maxWordLength);
  if (!word) return { ok: false, error: "invalid word" };
  return (await lookupPromise)(word);
}

// The background is the trust boundary: only this extension's own scripts may talk to it,
// and every field is re-validated here regardless of what the content script already checked.
api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || sender.id !== api.runtime.id) return false;
  if (msg.type === "getState") {
    getState(sender).then(sendResponse);
    return true;
  }
  if (msg.type === "lookup") {
    handleLookup(msg.word).then(sendResponse);
    return true; // keep channel open for async reply (Chrome and Firefox)
  }
  return false;
});
