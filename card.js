(function () {
  let host = null;
  let root = null; // closed shadow root: page scripts cannot reach into the card
  let settings = { width: 320, theme: "auto", showAttribution: true };
  let current = null; // { rect, model } of the card on screen
  let examplesOpen = false;

  function configureCard(opts) {
    settings = { ...settings, ...opts };
  }

  const CSS = `
    :host { all: initial; }
    .card { box-sizing: border-box; width: var(--w, 320px); max-width: calc(100vw - 16px); max-height: 360px; overflow: auto;
      background: #fff; color: #1a1a1a; border: 1px solid #d0d0d0; border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,.2); padding: 12px 14px;
      font: 14px/1.45 system-ui, -apple-system, "Segoe UI", sans-serif; }
    .head { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .toggle { all: unset; box-sizing: border-box; flex: none; cursor: pointer; font-size: 11px; color: #1a56b0;
      border: 1px solid #c5d3ea; border-radius: 4px; padding: 2px 6px; }
    .toggle:hover { background: #eef3fb; }
    .toggle:focus-visible { outline: 2px solid #1a56b0; outline-offset: 1px; }
    .card.dark .toggle { color: #8ab4f8; border-color: #4a5a78; }
    .card.dark .toggle:hover { background: #2a3447; }
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
    if (text !== undefined && text !== null) e.textContent = text;
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
      card.append(el("div", "muted", "Could not fetch the definition."));
      if (model.error) card.append(el("div", "muted", "Reason: " + model.error.slice(0, 160)));
      card.append(el("div", "muted", "If this keeps happening, reload the extension and then this page."));
      return card;
    }
    if (model.state === "notfound") {
      card.append(el("div", "word", model.word || ""), el("div", "muted", "No definition found."));
    } else {
      const head = el("div", "head");
      const title = el("div", "title");
      title.append(el("span", "word", model.word));
      if (model.ipa) title.append(document.createTextNode(" "), el("span", "ipa", model.ipa));
      head.append(title);
      if (model.hasExamples) {
        const btn = el("button", "toggle", examplesOpen ? "Hide examples" : "Show examples");
        btn.type = "button";
        btn.setAttribute("aria-expanded", String(examplesOpen));
        btn.addEventListener("click", (event) => {
          event.stopPropagation();
          examplesOpen = !examplesOpen;
          render();
        });
        head.append(btn);
      }
      card.append(head);
      const ol = el("ol");
      for (const it of model.items) {
        const li = el("li");
        if (it.partOfSpeech) li.append(el("span", "pos", it.partOfSpeech));
        li.append(document.createTextNode(it.definition));
        if (examplesOpen) for (const ex of it.examples) li.append(el("div", "ex", "“" + ex + "”"));
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
    const left = Math.min(Math.max(margin, rect.left), window.innerWidth - w - margin);
    const top = rect.bottom + margin;
    host.style.setProperty("left", left + "px", "important");
    host.style.setProperty("top", top + "px", "important");
    // flip above the selection if it would overflow the bottom
    const h = host.getBoundingClientRect().height;
    if (top + h > window.innerHeight - margin && rect.top - h - margin > 0) {
      host.style.setProperty("top", rect.top - h - margin + "px", "important");
    }
  }

  function showCard(rect, model) {
    if (!host) {
      // Custom tag name + !important so page CSS selectors (div, html > div, ...) do not restyle the host.
      host = document.createElement("dictext-card");
      host.style.cssText = "all:initial!important;position:fixed!important;z-index:2147483647!important;display:block!important;";
      root = host.attachShadow({ mode: "closed" });
      root.append(el("style", null, CSS), el("div", "slot"));
      document.documentElement.append(host);
    }
    host.style.setProperty("--w", settings.width + "px");
    current = { rect, model };
    examplesOpen = !!model.examplesOpen;
    render();
  }

  // Re-draw the current model (also used by the examples toggle) and re-position the card.
  function render() {
    if (!host || !current) return;
    root.querySelector(".slot").replaceChildren(build(current.model));
    place(current.rect);
  }

  function hideCard() {
    if (host) {
      host.remove();
      host = null;
      root = null;
      current = null;
    }
  }

  function isInsideCard(event) {
    return !!host && event.composedPath().includes(host);
  }

  globalThis.DictExt = Object.assign(globalThis.DictExt || {}, { showCard, hideCard, isInsideCard, configureCard });
})();
