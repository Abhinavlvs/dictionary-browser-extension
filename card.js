(function () {
  let host = null;
  let settings = { width: 320, theme: "auto", showAttribution: true };

  function configureCard(opts) {
    settings = { ...settings, ...opts };
  }

  const CSS = `
    :host { all: initial; }
    .card { box-sizing: border-box; width: var(--w, 320px); max-width: calc(100vw - 16px); max-height: 360px; overflow: auto;
      background: #fff; color: #1a1a1a; border: 1px solid #d0d0d0; border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,.2); padding: 12px 14px;
      font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .word { font-size: 18px; font-weight: 600; }
    .ipa, .muted { color: #666; font-size: 12px; }
    ol { margin: 8px 0 0; padding-left: 20px; }
    li { margin-bottom: 6px; }
    .pos { color: #1a56b0; font-style: italic; font-size: 12px; margin-right: 4px; }
    .ex { color: #666; font-style: italic; font-size: 13px; }
    .attr { margin-top: 8px; font-size: 11px; color: #888; }
    .card.dark { background: #1e1e1e; color: #eee; border-color: #444; }
    .card.dark .pos { color: #8ab4f8; }
    .card.dark .ipa, .card.dark .muted, .card.dark .ex { color: #aaa; }
    .card.dark .attr { color: #999; }
  `;

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function build(model) {
    const dark = settings.theme === "dark" || (settings.theme === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    const card = el("div", dark ? "card dark" : "card");
    if (model.state === "loading") {
      card.append(el("div", "muted", "Looking up…"));
      return card;
    }
    if (model.state === "error") {
      card.append(el("div", "muted", "Could not fetch the definition. Check your connection."));
      return card;
    }
    if (model.state === "notfound") {
      card.append(el("div", "word", model.word || ""), el("div", "muted", "No definition found."));
    } else {
      card.append(el("span", "word", model.word));
      if (model.ipa) card.append(document.createTextNode(" "), el("span", "ipa", model.ipa));
      const ol = el("ol");
      for (const it of model.items) {
        const li = el("li");
        if (it.partOfSpeech) li.append(el("span", "pos", it.partOfSpeech));
        li.append(document.createTextNode(it.definition));
        for (const ex of it.examples) li.append(el("div", "ex", "“" + ex + "”"));
        ol.append(li);
      }
      card.append(ol);
    }
    if (settings.showAttribution) card.append(el("div", "attr", "Definitions from Wiktionary (CC BY-SA 4.0)"));
    return card;
  }

  function place(rect) {
    const margin = 8;
    const w = settings.width;
    let left = Math.min(Math.max(margin, rect.left), window.innerWidth - w - margin);
    let top = rect.bottom + margin;
    host.style.left = left + "px";
    host.style.top = top + "px";
    // flip above the selection if it would overflow the bottom
    const h = host.getBoundingClientRect().height;
    if (top + h > window.innerHeight - margin && rect.top - h - margin > 0) {
      host.style.top = rect.top - h - margin + "px";
    }
  }

  function showCard(rect, model) {
    if (!host) {
      host = document.createElement("div");
      host.style.cssText = "position:fixed;z-index:2147483647;";
      const root = host.attachShadow({ mode: "open" });
      root.append(el("style", null, CSS), el("div", "slot"));
      document.documentElement.append(host);
    }
    const slot = host.shadowRoot.querySelector(".slot");
    host.style.setProperty("--w", settings.width + "px");
    slot.replaceChildren(build(model));
    place(rect);
  }

  function hideCard() {
    if (host) {
      host.remove();
      host = null;
    }
  }

  function isInsideCard(event) {
    return !!host && event.composedPath().includes(host);
  }

  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, { showCard, hideCard, isInsideCard, configureCard });
})();
