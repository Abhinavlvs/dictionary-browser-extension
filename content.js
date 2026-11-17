(async function () {
  const api = globalThis.browser ?? globalThis.chrome;
  const { normalizeWord, isPrimaryClick, isEditable, cardModel, showCard, hideCard, isInsideCard, configureCard } = DictExt;

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
  let lookupSeq = 0; // distinguishes two lookups of the *same* word started at different places
  let pointerInCard = false; // true while a click that started inside the card is in progress

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

  async function onSelect() {
    if (!enabled) return;
    if (isEditable(document.activeElement)) return dismiss(); // never send text typed/selected in form fields
    const sel = window.getSelection();
    const word = sel && sel.rangeCount ? normalizeWord(sel.toString(), popup.maxWordLength) : null;
    if (!word) return dismiss();
    const rect = sel.getRangeAt(0).getBoundingClientRect();
    currentWord = word;
    const seq = ++lookupSeq;
    showCard(rect, { state: "loading" });
    let result;
    try {
      result = await api.runtime.sendMessage({ type: "lookup", word });
    } catch (e) {
      // After an extension update/reload this page's content script is orphaned: stay quiet, a page
      // refresh fixes it, and "check your connection" would be misleading.
      if (!api.runtime || !api.runtime.id) return dismiss();
      result = { ok: false, error: String(e) };
    }
    if (seq !== lookupSeq || currentWord !== word) return; // selection changed or card dismissed meanwhile
    showCard(rect, cardModel(result, {
      limit: popup.maxDefinitions,
      showExamples: popup.showExamples,
      showPronunciation: popup.showPronunciation,
    }));
  }

  // Only real user gestures count: pages can dispatch synthetic events (isTrusted === false).
  // isInsideCard must be evaluated synchronously: composedPath() is empty once dispatch has finished.
  const trigger = (e) => {
    if (!e.isTrusted || !isPrimaryClick(e) || isInsideCard(e)) return;
    setTimeout(onSelect, 0); // wait a tick so the selection is final (double-click select)
  };
  document.addEventListener(popup.trigger === "doubleClick" ? "dblclick" : "mouseup", trigger);
  document.addEventListener("mouseup", () => setTimeout(() => { pointerInCard = false; }, 0), true);
  document.addEventListener("contextmenu", dismiss, true);
  document.addEventListener("mousedown", (e) => {
    pointerInCard = isInsideCard(e); // clicking inside the card must not close it
    if (!pointerInCard) dismiss();
  }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dismiss(); }, true);
  window.addEventListener("scroll", dismiss, true);
  document.addEventListener("selectionchange", () => {
    if (pointerInCard) return; // clicking in the card collapses the page selection; keep the card
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) dismiss();
  });
})();
