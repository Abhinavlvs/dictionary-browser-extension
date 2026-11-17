(function () {
  const api = globalThis.browser ?? globalThis.chrome;
  const { normalizeWord, cardModel, showCard, hideCard, isInsideCard } = DictExt;
  let currentWord = null;

  function dismiss() {
    currentWord = null;
    hideCard();
  }

  async function onSelect(event) {
    if (isInsideCard(event)) return;
    const sel = window.getSelection();
    const word = sel && sel.rangeCount ? normalizeWord(sel.toString()) : null;
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
    showCard(rect, cardModel(result));
  }

  // mouseup: wait a tick so the selection is final (double-click select)
  document.addEventListener("mouseup", (e) => setTimeout(() => onSelect(e), 0));
  document.addEventListener("contextmenu", dismiss, true);
  document.addEventListener("mousedown", (e) => { if (!isInsideCard(e)) dismiss(); }, true);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") dismiss(); }, true);
  window.addEventListener("scroll", dismiss, true);
  document.addEventListener("selectionchange", () => {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed) dismiss();
  });
})();
