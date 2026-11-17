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
    $("export").disabled = $("clear").disabled = all.length === 0;
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

  function exportCsv() {
    const blob = new Blob([DictExt.toCsv(DictExt.sortedEntries(store))], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "saved-words.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  $("search").addEventListener("input", render);
  $("export").addEventListener("click", exportCsv);
  $("clear").addEventListener("click", () => {
    if (confirm("Delete all saved words? This cannot be undone.")) save({});
  });
  // Stay in sync when a lookup in another tab saves a word.
  api.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && changes[KEY]) { store = changes[KEY].newValue || {}; render(); }
  });
  api.storage.local.get(KEY).then((r) => { store = r[KEY] || {}; render(); });
})();
