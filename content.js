(async function () {
  const api = globalThis.browser ?? globalThis.chrome;
  const { normalizeWord, isPrimaryClick, cardModel, showCard, hideCard, isInsideCard, configureCard } = DictExt;

  let cfg;
  try {
    cfg = await api.runtime.sendMessage({ type: "getConfig" });
  } catch (e) {
    return; // extension context unavailable
  }
  if (!cfg || !cfg.popup || !cfg.popup.enabled) return;
  const popup = cfg.popup;
  configureCard({ width: popup.width, theme: popup.theme, showAttribution: popup.showAttribution });

  let currentWord = null;

  function dismiss() {
    currentWord = null;
    hideCard();
  }

  async function onSelect(event) {
    if (isInsideCard(event)) return;
    const sel = window.getSelection();
    const word = sel && sel.rangeCount ? normalizeWord(sel.toString(), popup.maxWordLength) : null;
    if (!word) return dismiss();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    currentWord = word;
    showCard(rect, { state: "loading" });
    let result;
    try {
      result = await api.runtime.sendMessage({ type: "lookup", word });
    } catch (e) {
      result = { ok: false, error: String(e) };
    }
    if (currentWord !== word) return; // selection changed or card dismissed meanwhile
    showCard(rect, cardModel(result, {
      limit: popup.maxDefinitions,
      showExamples: popup.showExamples,
      showPronunciation: popup.showPronunciation,
    }));
  }

  // wait a tick so the selection is final (double-click select)
  const trigger = (e) => setTimeout(() => onSelect(e), 0);
  if (popup.trigger === "doubleClick") {
    document.addEventListener("dblclick", (e) => { if (isPrimaryClick(e)) trigger(e); });
  } else {
    document.addEventListener("mouseup", (e) => { if (isPrimaryClick(e)) trigger(e); });
  }
  document.addEventListener("contextmenu", dismiss, true);
  document.addEventListener("mousedown", (e) => { if (!isInsideCard(e)) dismiss(); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dismiss(); }, true);
  window.addEventListener("scroll", dismiss, true);
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) dismiss();
  });
})();
