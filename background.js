if (typeof importScripts === "function") {
  importScripts("lib/parse.js", "lib/words.js", "lib/lookup.js");
}

const api = globalThis.browser ?? globalThis.chrome;
const lookup = DictExt.createLookup((url) => fetch(url));
const MENU_ID = "mw-search";

api.runtime.onInstalled.addListener(() => {
  api.contextMenus.create({
    id: MENU_ID,
    title: "Search in Merriam-Webster",
    contexts: ["selection"],
  });
});

api.contextMenus.onClicked.addListener((info) => {
  if (info.menuItemId !== MENU_ID) return;
  const text = (info.selectionText || "").trim();
  if (!text) return;
  api.tabs.create({ url: DictExt.mwUrl(text) });
});

api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (!msg || msg.type !== "lookup" || typeof msg.word !== "string") return false;
  lookup(msg.word).then(sendResponse);
  return true; // keep channel open for async reply (Chrome and Firefox)
});
