(() => {
  // --- Shared CSS moved from content.js ---
  const SHARED_CSS = `
  /* paste the full shared rules you previously had, EXCEPT all HUD (#kpv2-hud) rules */
  html.kpv2-cursor-hidden, html.kpv2-cursor-hidden * { cursor: none !important; }
  .kpv2-focus { filter: brightness(1.2) !important; }
  .kpv2-delete { filter: brightness(0.8) contrast(1.2) !important; }
  .kpv2-hidden { display: none !important; }
  @keyframes kpv2-ripple { /* … existing keyframes … */ }
  .kpv2-ripple { /* … existing ripple rules … */ }
  .kpv2-focus-overlay { /* … existing focus overlay rules … */ }
  .kpv2-delete-overlay { /* … existing delete overlay rules … */ }
  /* DO NOT include any #kpv2-hud rules here. */
  `;

  // --- Moved helper: inject shared styles into document or a shadow root ---
  function ensureSharedStylesIn(docOrRoot = document) {
    const isShadow = docOrRoot instanceof ShadowRoot;
    const rootEl = isShadow ? docOrRoot : docOrRoot.documentElement;
    if (!rootEl) return;

    const id = "kpv2-style";
    const hostDoc = isShadow ? docOrRoot : document;
    if (hostDoc.getElementById?.(id)) return;

    const styleEl = document.createElement("style");
    styleEl.id = id;
    styleEl.textContent = SHARED_CSS;
    (isShadow ? docOrRoot : document.head).appendChild(styleEl);
  }

  // --- Moved patch: must run in MAIN world ---
  (function patchAttachShadow() {
    const orig = Element.prototype.attachShadow;
    if (!orig) return;

    Element.prototype.attachShadow = function(init) {
      const root = orig.call(this, init);
      try { ensureSharedStylesIn(root); } catch {}
      return root;
    };

    // Style already-open shadow roots once, and the main document
    try { ensureSharedStylesIn(document); } catch {}

    const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.shadowRoot) {
        try { ensureSharedStylesIn(n.shadowRoot); } catch {}
      }
    }
  })();
})();


const s = document.createElement('script');
s.src = chrome.runtime.getURL('page.js');
s.onload = () => s.remove();
(document.head || document.documentElement).appendChild(s);