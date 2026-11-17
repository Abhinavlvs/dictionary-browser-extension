(async function () {
  const api = globalThis.browser ?? globalThis.chrome;
  const { normalizeWord, isPrimaryClick, cardModel, showCard, hideCard, isInsideCard, configureCard } = DictExt;

  async function fetchState() {
    try {
      return await api.runtime.sendMessage({ type: "getState" });
    } catch (e) {
      return null; // extension context unavailable
    }
  }

  const state = await fetchState();
  if (!state || !state.config || !state.config.popup.enabled) return;
  const popup = state.config.popup;
  let enabled = state.enabled;
  configureCard({ width: popup.width, theme: popup.theme, showAttribution: popup.showAttribution });

  let currentWord = null;

  function dismiss() {
    currentWord = null;
    hideCard();
  }

  // Toolbar toggle (any tab of this site) changes storage; re-ask the background for our state.
  api.storage.onChanged.addListener(async () => {
    const s = await fetchState();
    if (!s) return;
    enabled = s.enabled;
    if (!enabled) dismiss();
  });

  if (window === window.top) {
    api.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg && msg.type === "getHost") {
        sendResponse(DictExt.hostOf(location.href));
        return true;
      }
      return false;
    });
  }

  async function onSelect(event) {
    if (!enabled || isInsideCard(event)) return;
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
