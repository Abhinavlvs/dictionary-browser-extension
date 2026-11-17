(function () {
  const api = globalThis.browser ?? globalThis.chrome;
  const KEY = "savedWords";
  const $ = (id) => document.getElementById(id);
  let store = {};

  const when = (t) => new Date(t).toLocaleString();

  function render() {
    const q = $("search").value.trim().toLowerCase();
    const all = DictExt.sortedEntries(store);
    const rows = all.filter((e) => !q || (e.word + " " + e.definition).toLowerCase().includes(q));
    $("summary").textContent = all.length + (all.length === 1 ? " word" : " words") + (q ? ", " + rows.length + " shown" : "");
    $("empty").hidden = all.length > 0;
    $("export").disabled = $("exportJson").disabled = $("clear").disabled = all.length === 0;
    const items = rows.map((e) => {
      const li = document.createElement("li");
      const body = document.createElement("div");
      const w = document.createElement("span");
      w.className = "word";
      w.textContent = e.word;
      body.append(w);
      if (e.partOfSpeech) {
        const p = document.createElement("span");
        p.className = "pos";
        p.textContent = e.partOfSpeech;
        body.append(p);
      }
      const d = document.createElement("div");
      d.textContent = e.definition;
      const m = document.createElement("div");
      m.className = "meta";
      m.textContent = "Looked up " + e.count + (e.count === 1 ? " time" : " times") + ", last " + when(e.lastSeen);
      body.append(d, m);
      const del = document.createElement("button");
      del.type = "button";
      del.textContent = "Delete";
      del.addEventListener("click", () => save(DictExt.removeWord(store, e.word)));
      li.append(body, del);
      return li;
    });
    $("list").replaceChildren(...items);
  }

  async function save(next) {
    store = next;
    await api.storage.local.set({ [KEY]: next });
    render();
  }

  function download(text, type, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([text], { type }));
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  const exportCsv = () => download(DictExt.toCsv(DictExt.sortedEntries(store)), "text/csv;charset=utf-8", "saved-words.csv");
  const exportJson = () => download(DictExt.toJson(store), "application/json", "dictionary-lookup-saved-words.json");

  async function maxWords() {
    try {
      const cfg = DictExt.mergeConfig(await (await fetch(api.runtime.getURL("config.json"))).json());
      return cfg.popup.maxSavedWords;
    } catch {
      return DictExt.DEFAULTS.popup.maxSavedWords;
    }
  }

  async function importFile(file) {
    if (!file) return;
    const parsed = DictExt.parseImport(await file.text());
    if (!parsed.ok) { $("status").textContent = "Import failed: " + parsed.error + "."; return; }
    const before = Object.keys(store).length;
    // Re-read storage first so words saved in the meantime are not lost.
    const cur = (await api.storage.local.get(KEY))[KEY] || {};
    await save(DictExt.mergeStores(cur, parsed.store, await maxWords()));
    $("status").textContent = "Imported " + Object.keys(parsed.store).length + " words (" + (Object.keys(store).length - before) + " new).";
  }

  $("search").addEventListener("input", render);
  $("export").addEventListener("click", exportCsv);
  $("exportJson").addEventListener("click", exportJson);
  $("import").addEventListener("click", () => $("importFile").click());
  $("importFile").addEventListener("change", async (e) => { await importFile(e.target.files[0]); e.target.value = ""; });
  $("clear").addEventListener("click", () => {
    if (confirm("Delete all saved words? This cannot be undone.")) save({});
  });
  // Stay in sync when a lookup in another tab saves a word.
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[KEY]) { store = changes[KEY].newValue || {}; render(); }
  });
  api.storage.local.get(KEY).then((r) => { store = r[KEY] || {}; render(); });
})();
