(function () {
  const api = globalThis.browser ?? globalThis.chrome;
  const $ = (id) => document.getElementById(id);
  let tabId = null;

  function show(s) {
    if (!s || !s.host) {
      $("site").textContent = "This page";
      $("state").textContent = "Not available on this page.";
      $("toggle").textContent = "Turn off for this site";
      $("toggle").disabled = true;
      return;
    }
    $("site").textContent = s.host;
    $("state").textContent = s.enabled ? "On: select a word to see its meaning." : "Off for this site.";
    $("toggle").textContent = s.enabled ? "Turn off for this site" : "Turn on for this site";
    $("toggle").disabled = false;
  }

  async function init() {
    const [tab] = await api.tabs.query({ active: true, currentWindow: true });
    tabId = tab && Number.isInteger(tab.id) ? tab.id : null;
    show(tabId === null ? null : await api.runtime.sendMessage({ type: "siteState", tabId }));
    const r = await api.storage.local.get("savedWords");
    const n = Object.keys(r.savedWords || {}).length;
    $("saved").textContent = "View saved words (" + n + ")";
  }

  $("toggle").addEventListener("click", async () => {
    $("toggle").disabled = true;
    show(await api.runtime.sendMessage({ type: "toggleSite", tabId }));
  });
  $("saved").addEventListener("click", async () => {
    await api.tabs.create({ url: api.runtime.getURL("saved.html") });
    window.close();
  });
  init().catch(() => show(null));
})();
