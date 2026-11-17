if (typeof importScripts === "function") {
  importScripts("lib/parse.js", "lib/words.js", "lib/config.js", "lib/lookup.js");
}

const api = globalThis.browser ?? globalThis.chrome;
const MENU_ID = "mw-search";

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

api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg) return false;
  if (msg.type === "getConfig") {
    configPromise.then(sendResponse);
    return true;
  }
  if (msg.type === "lookup" && typeof msg.word === "string") {
    lookupPromise.then((lookup) => lookup(msg.word)).then(sendResponse);
    return true; // keep channel open for async reply (Chrome and Firefox)
  }
  return false;
});
