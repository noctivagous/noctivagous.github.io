
/*
=========================================================================
   KeyPilot v2.2 — Keyboard-first helper (shadow-DOM aware) with
   SVG overlay cursor.
   ----------------------------------------------------------------------
   Keys:
     F    → Click the link under the cursor (links only)
     C    → Go back (browser history)
     V    → Go forward (browser history)
     D    → Delete mode; press D again to remove the hovered element
     ESC  → Cancel current mode (delete)
   Visuals:
     • SVG crosshair overlay that follows the mouse at max z-index
       (changes design in Delete mode)
     • Green focus overlay on clickable candidates (F, links only)
     • Red delete overlay on delete target (D)
     • CSS filter applied to hovered elements
     • Ripple animation where clicks occur (incl. F)

   Shadow DOM:
     • Traverses nested open shadow roots to find the deepest element
     • Injects helper CSS into open shadow roots (focus/delete ring visibility)
     • Patches attachShadow to auto-inject CSS for future open roots
     • Clicks are dispatched with composed: true for better shadow handling
   Notes:
     • Built without innerHTML to satisfy Trusted Types CSP.
     • Deleting avoids <html> and <body>
========================================================================= */

/*
Below is a concise, technical description suitable for placing at the top of an AI-assistant workspace. It explains how KeyPilot’s injected script behaves at runtime and how the Chrome extension is structured.

# KeyPilot (Chrome Extension) — Runtime Behavior & Structure

**Overview.**
KeyPilot enables keyboard-first browsing by overlaying a high-visibility cursor, identifying interactive targets under the mouse, and dispatching robust, shadow-DOM-aware activation events. It provides single-key shortcuts for link activation, history navigation, and an explicit delete mode. The content script operates without `innerHTML` to respect strict CSP/Trusted Types environments and avoids removing root document nodes.&#x20;

## Primary capabilities

| Capability              | Details                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Link/Control activation | Press **F** to activate the interactive element under the pointer. The script first performs semantic activation for radios, checkboxes, sliders, text inputs, and contenteditable; if not applicable, it performs a realistic pointer/click event sequence with `composed: true` for shadow DOM compatibility. A single programmatic `click()` is attempted first; if the page prevents default, no duplicate synthetic click is sent.  |
| History navigation      | **C** = Back, **V** = Forward.                                                                                                                                                                                                                                                                                                                                                                                                           |
| Delete mode             | **D** toggles “delete” targeting; pressing **D** again removes the currently hovered element (never `<html>` or `<body>`). **ESC** cancels. Remaining elements may be force-hidden if removal fails.                                                                                                                                                                                                                                     |
| Mode cancel             | **ESC** exits delete mode and clears overlays/focus rings. Typing in text fields is preserved; only **ESC** is intercepted there.                                                                                                                                                                                                                                                                                                        |

## Visual feedback

| Element            | Purpose                                                                                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| SVG cursor overlay | A fixed-position, max-z-index cursor that follows the mouse. Crosshair in normal mode; “X” in delete mode. The document cursor is hidden while active.  |
| Focus overlay      | A green bounding overlay that highlights the clickable candidate detected under the pointer.                                                            |
| Delete overlay     | A red bounding overlay that highlights the current delete target.                                                                                       |
| Ripple animation   | A radial ripple appears at the activation point for visual confirmation.                                                                                |

## Target detection & activation

| Aspect               | Method                                                                                                                                                                                                                                            |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Deep hit-testing     | Walks through nested **open** shadow roots using `elementFromPoint` to resolve the deepest element under the cursor.                                                                                                                              |
| Clickable heuristics | Considers native selectors (`a[href], button, input, select, textarea`) and ARIA roles (`link`, `button`), walking up through DOM/host boundaries to find the nearest activator.                                                                  |
| Semantic handling    | Radios, checkboxes, ranges, text inputs/areas, labels (explicit/implicit), and contenteditable receive type-appropriate focus/value changes plus `input`/`change` dispatch. Others receive a pointer→mouse→click sequence with `composed: true`.  |

## Shadow DOM support

| Behavior          | Details                                                                                                                                                                                            |
| ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Style propagation | Shared helper CSS (cursor hide, overlays, ripple, highlight filters) is injected into the main document and into **open** shadow roots.                                                            |
| Future roots      | `Element.prototype.attachShadow` is patched so newly created open roots automatically receive the shared CSS. This patch is executed in the **page context** to ensure it runs in the main world.  |
| Event composition | Pointer/mouse/click events use `composed: true` to cross shadow boundaries reliably.                                                                                                               |

## Keyboard map

| Key     | Action                                                |
| ------- | ----------------------------------------------------- |
| **F**   | Activate link/control under cursor                    |
| **C**   | Browser Back                                          |
| **V**   | Browser Forward                                       |
| **D**   | Toggle Delete targeting; press again to remove target |
| **ESC** | Cancel current mode (e.g., delete)                    |

(Implemented as document-level listeners; typing in inputs/textareas is not disrupted except for **ESC**.)&#x20;

## Extension packaging & surfaces

| File            | Role                                                                                                                                                                                                                         |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `manifest.json` | MV3 manifest. Declares action popup, runs `content.js` at `document_idle`, requests `<all_urls>` host permissions, and includes icons.                                                                                       |
| `content.js`    | Main injected logic: builds the SVG cursor/overlays, handles keyboard/mouse, performs deep hit-testing, semantic activation, delete safeguards, and (also) injects helper CSS + patches for existing/new open shadow roots.  |
| `page.js`       | Ensures shared CSS injection and `attachShadow` patching in the **main world**; it is added via a transient `<script>` tag from the content script so it executes with page privileges.                                      |
| `popup.html`    | Minimal in-extension reference sheet displaying the key bindings and an “ON” status pill.                                                                                                                                    |

## Notable safeguards & constraints

| Topic               | Notes                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CSP / Trusted Types | No `innerHTML` usage for helper UI; elements are constructed via `createElement`/text nodes.                                                            |
| DOM safety          | Delete mode never removes `<html>` or `<body>`.                                                                                                         |
| Event discipline    | Avoids duplicate activations by preferring a single native `click()` and honoring `preventDefault()` before falling back to a full synthetic sequence.  |

This description reflects the shipped behavior of the current files and is intended to help AI tools reason about KeyPilot’s execution model, input handling, and shadow-DOM strategy within typical web applications.

*/


(() => {
  if (window.__KeyPilotV22) {
    try { console.warn('[KeyPilot] Already loaded.'); } catch { }
    return;
  }
  window.__KeyPilotV22 = true;

  // ------------------------------ Utilities ------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const CLICKABLE_ROLES = ['link','button'];
 // const CLICKABLE_SEL = 'a[href]';
const CLICKABLE_SEL = 'a[href], button, input, select, textarea';

  const KP = {
    mode: 'none', // 'none' | 'delete'
    lastMouse: { x: 0, y: 0 },
    focusEl: null,
    deleteEl: null,
    listeners: [],
    shadowRoots: new Set(),
    focusOverlay: null,
    deleteOverlay: null,
    cursorEl: null,
  };

  function dbg() { /* debug removed */ }

  function isLikelyInteractive(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(CLICKABLE_SEL)) return true;
    const role = (el.getAttribute && (el.getAttribute('role') || '').trim().toLowerCase()) || '';
    if (role && CLICKABLE_ROLES.includes(role)) return true;
    return false;
  }
  function findClickable(el) {
    let n = el;
    while (n && n !== document.body && n.nodeType === 1) {
      if (isLikelyInteractive(n)) return n;
      n = n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null);
    }
    return el && isLikelyInteractive(el) ? el : null;
  }

  // Deepest element at point through nested open shadow roots
  function deepElementFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    let guard = 0;
    while (el && el.shadowRoot && guard++ < 10) {
      const nested = el.shadowRoot.elementFromPoint(x, y);
      if (!nested || nested === el) break;
      el = nested;
    }
    return el;
  }

 /* function smartClick(el, clientX, clientY) {
    if (!el) return false;
    try { if (typeof el.click === 'function') { el.click(); } } catch { }
    const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX, clientY };
    try { el.dispatchEvent(new MouseEvent('pointerdown', opts)); } catch { }
    try { el.dispatchEvent(new MouseEvent('mousedown', opts)); } catch { }
    try { el.dispatchEvent(new MouseEvent('mouseup', opts)); } catch { }
    try { el.dispatchEvent(new MouseEvent('click', opts)); } catch { }
    return true;
  }*/
  
  function smartClick(el, clientX, clientY) {
  if (!el) return false;

  // Prefer an actual activator element (anchor or button) if the click
  // originated on a nested child such as an icon/label/span.
  const activator =
    (el.closest && (el.closest('a[href]') || el.closest('button,[role="button"]'))) || el;

  // 1) Try a *single* programmatic activation. Frameworks that want to
  // intercept navigation will call preventDefault() on this click.
  let prevented = false;
  const onClickCapture = (ev) => {
    if (ev.defaultPrevented) prevented = true;
  };

  try {
    activator.addEventListener('click', onClickCapture, { capture: true, once: true });
    if (typeof activator.click === 'function') {
      activator.click();
      // If the app/router intercepted this (preventDefault), do nothing else.
      if (prevented) return true;
      // If not prevented, the browser/native behavior (including <a> navigation)
      // will proceed. Avoid sending a second synthetic click.
      return true;
    }
  } catch {
    // fall through to synthetic path
  } finally {
    try { activator.removeEventListener('click', onClickCapture, { capture: true }); } catch {}
  }

  // 2) Fallback: synthesize a fuller, realistic event sequence once.
  // This helps elements that rely on pointer/hover state or mousedown handlers.
  const base = {
    bubbles: true,
    cancelable: true,
    composed: true,
    view: window,
    clientX,
    clientY,
    button: 0,
  };
  const pBase = {
    ...base,
    pointerId: 1,
    isPrimary: true,
    pointerType: 'mouse',
    width: 1,
    height: 1,
    pressure: 0.5,
    tangentialPressure: 0,
    tiltX: 0,
    tiltY: 0,
    twist: 0,
  };

  const tryDispatch = (type, Ctor, opts) => {
    try { activator.dispatchEvent(new Ctor(type, opts)); } catch {}
  };

  // Pre-hover (some sites set state on over/enter)
  if ('PointerEvent' in window) {
    tryDispatch('pointerover', PointerEvent, pBase);
    tryDispatch('pointerenter', PointerEvent, pBase);
  }
  tryDispatch('mouseover', MouseEvent, base);

  if ('PointerEvent' in window) tryDispatch('pointerdown', PointerEvent, pBase);
  tryDispatch('mousedown', MouseEvent, base);

  if ('PointerEvent' in window) tryDispatch('pointerup', PointerEvent, pBase);
  tryDispatch('mouseup', MouseEvent, base);

  tryDispatch('click', MouseEvent, base);

  return true;
}


  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null) continue;
      if (k === 'className') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }




  function clamp(n, lo, hi) { return Math.min(hi, Math.max(lo, n)); }
  function asNum(v, d) { const n = Number(v); return Number.isFinite(n) ? n : d; }
  function dispatchInputChange(el) {
    const opts = { bubbles: true, composed: true };
    el.dispatchEvent(new Event('input', opts));
    el.dispatchEvent(new Event('change', opts));
  }
  function isNativeType(el, type) {
    return el && el.tagName === 'INPUT' && (el.getAttribute('type') || '').toLowerCase() === type;
  }
  function isTextarea(el) { return el && el.tagName === 'TEXTAREA'; }
  function isTextLike(el) {
    if (!el || el.nodeType !== 1) return false;
    if (isTextarea(el)) return true;
    if (el.tagName === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      // Typical text-entry types
      return ['text', 'search', 'url', 'email', 'tel', 'password', 'number'].includes(t);
    }
    return false;
  }

  /* Set the caret for text inputs/areas. If possible, position at the end. */
  function focusTextField(el) {
    try { el.focus({ preventScroll: true }); } catch { try { el.focus(); } catch { } }
    try {
      // Place caret at end; avoids intrusive selection for most cases.
      const v = el.value ?? '';
      el.setSelectionRange(v.length, v.length);
    } catch { }
  }

  /* Move a horizontal slider knob to x within its bounding box. */
  function setRangeAtPoint(el, clientX) {
    const rect = el.getBoundingClientRect();
    const min = asNum(el.min, 0);
    const max = asNum(el.max, 100);
    const stepAttr = el.step && el.step !== 'any' ? asNum(el.step, 1) : 'any';

    if (rect.width <= 0) return false;
    const pct = clamp((clientX - rect.left) / rect.width, 0, 1);
    let val = min + pct * (max - min);

    if (stepAttr !== 'any' && Number.isFinite(stepAttr) && stepAttr > 0) {
      const steps = Math.round((val - min) / stepAttr);
      val = min + steps * stepAttr;
    }
    val = clamp(val, min, max);
    const before = el.value;
    el.value = String(val);
    if (el.value !== before) dispatchInputChange(el);
    return true;
  }

  /* Attempt semantic activation based on control type. Returns true if handled. */
  function handleSmartActivate(target, x, y) {
    if (!target) return false;

    // If the pointer is over a label linked to a control, prefer that control.
    if (target.tagName === 'LABEL') {
      const forId = target.getAttribute('for');
      if (forId) {
        const labelCtl = (target.getRootNode() || document).getElementById(forId);
        if (labelCtl) target = labelCtl;
      } else {
        // Implicit label: search descendants for a control
        const ctl = target.querySelector('input, textarea, select');
        if (ctl) target = ctl;
      }
    }

    // Radios
    if (isNativeType(target, 'radio')) {
      if (!target.checked) {
        target.checked = true;
        dispatchInputChange(target);
      }
      return true;
    }

    // Checkboxes
    if (isNativeType(target, 'checkbox')) {
      target.checked = !target.checked;
      dispatchInputChange(target);
      return true;
    }

    // Sliders (input[type=range]) — horizontal assumption
    if (isNativeType(target, 'range')) {
      setRangeAtPoint(target, x);
      return true;
    }

    // Text fields / textareas
    if (isTextLike(target)) {
      focusTextField(target);
      return true;
    }

    // Contenteditable (basic caret placement: focus only)
    if (target.isContentEditable) {
      try { target.focus({ preventScroll: true }); } catch { try { target.focus(); } catch { } }
      return true;
    }

    return false;
  }


  // ------------------------------- Styles --------------------------------
  const SHARED_CSS = `
html.kpv2-cursor-hidden, html.kpv2-cursor-hidden * { cursor: none !important; }
.kpv2-focus { filter: brightness(1.2) !important; }
.kpv2-delete { filter: brightness(0.8) contrast(1.2) !important; }
.kpv2-hidden { display: none !important; }
@keyframes kpv2-ripple { 0%{transform:translate(-50%,-50%) scale(.25); opacity:.35;} 60%{transform:translate(-50%,-50%) scale(1); opacity:.2;} 100%{transform:translate(-50%,-50%) scale(1.6); opacity:0;} }
.kpv2-ripple { position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none; width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.22) 60%, rgba(0,200,0,0) 70%); animation: kpv2-ripple 420ms ease-out forwards; }
#kpv2-status.ok { color: #86f089; }
#kpv2-status.warn { color: #ffd36a; }
#kpv2-status.err { color: #ff7f7f; }
.kpv2-focus-overlay { position: fixed; pointer-events: none; z-index: 2147483646; border: 3px solid rgba(0,180,0,0.95); box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5); background: transparent; }
.kpv2-delete-overlay { position: fixed; pointer-events: none; z-index: 2147483646; border: 3px solid rgba(220,0,0,0.95); box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45); background: transparent; }
#kpv2-cursor { position: fixed; left: 0; top: 0; width: 94px; height: 94px; transform: translate(-50%, -50%); z-index: 2147483647; pointer-events: none; }
`;

  function ensureSharedStylesIn(docOrRoot = document) {
    const root = docOrRoot instanceof ShadowRoot ? docOrRoot : docOrRoot.documentElement;
    if (!root) return;
    const id = 'kpv2-style';
    const existing = (docOrRoot instanceof ShadowRoot ? docOrRoot : document).getElementById?.(id);
    if (existing) return; // Avoid duplicates
    const styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.textContent = SHARED_CSS;
    (docOrRoot instanceof ShadowRoot ? docOrRoot : document.head).appendChild(styleEl);
  }

  // Inject styles to current open shadow roots and patch attachShadow for future ones
  (function patchAttachShadow() {
    const orig = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
      const root = orig.call(this, init);
      try { ensureSharedStylesIn(root); KP.shadowRoots.add(root); } catch { }
      return root;
    };
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.shadowRoot) {
        try { ensureSharedStylesIn(n.shadowRoot); KP.shadowRoots.add(n.shadowRoot); } catch { }
      }
    }
  })();

 
  // ------------------------- Ripple (click feedback) ----------------------
  function rippleAt(x, y) {
    const r = el('div', { className: 'kpv2-ripple' });
    r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  }

  // ------------------------- SVG Cursor Overlay ---------------------------
  function buildSvg(mode) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);
    svg.setAttribute('viewBox', '0 0 94 94');
    svg.setAttribute('width', '94');
    svg.setAttribute('height', '94');

    // Base ring
  /*
    const ringA = document.createElementNS(NS, 'circle');
    ringA.setAttribute('cx', '47'); ringA.setAttribute('cy', '47'); ringA.setAttribute('r', '44');
    ringA.setAttribute('fill', 'none'); ringA.setAttribute('stroke', 'rgba(0,0,0,0.35)'); ringA.setAttribute('stroke-width', '2');
    svg.appendChild(ringA);

    const accent = document.createElementNS(NS, 'circle');
    accent.setAttribute('cx', '47'); accent.setAttribute('cy', '47'); accent.setAttribute('r', '44');
    accent.setAttribute('fill', 'none');
    accent.setAttribute('stroke', mode === 'delete' ? 'rgba(220,0,0,0.5)' : 'rgba(0,128,0,0.25)');
    accent.setAttribute('stroke-width', '6');
    svg.appendChild(accent);
*/

    function addLine(x1, y1, x2, y2, color, w = '4') {
      const ln = document.createElementNS(NS, 'line');
      ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
      ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
      ln.setAttribute('stroke', color); ln.setAttribute('stroke-width', w);
      ln.setAttribute('stroke-linecap', 'round');
      svg.appendChild(ln);
    }

    if (mode === 'delete') {
      // Cross (X) for delete
      addLine(18, 18, 76, 76, 'rgba(220,0,0,0.95)', '5');
      addLine(76, 18, 18, 76, 'rgba(220,0,0,0.95)', '5');
    } else {
      // Crosshair
      const col = 'rgba(0,128,0,0.95)';
      addLine(47, 10, 47, 34, col);
      addLine(47, 60, 47, 84, col);
      addLine(10, 47, 34, 47, col);
      addLine(60, 47, 84, 47, col);
    }
    return svg;
  }

  function ensureCursor() {
    if (KP.cursorEl) return;
    const wrap = el('div', { id: 'kpv2-cursor', 'aria-hidden': 'true' });
    wrap.appendChild(buildSvg('none'));
    document.body.appendChild(wrap);
    KP.cursorEl = wrap;
  }

  function setCursorMode(mode) {
    if (!KP.cursorEl) return;
    KP.cursorEl.replaceChildren(buildSvg(mode === 'delete' ? 'delete' : 'none'));
  }

  // ----------------------------- Event logic ------------------------------
  function updateFocusRings(candidate, deletingTarget) {
    // Remove prior
    KP.focusEl?.classList.remove('kpv2-focus');
    KP.deleteEl?.classList.remove('kpv2-delete');

    KP.focusEl = candidate || null;
    KP.deleteEl = deletingTarget || null;

    if (KP.focusEl) KP.focusEl.classList.add('kpv2-focus');
    if (KP.deleteEl) KP.deleteEl.classList.add('kpv2-delete');

    // Update overlays
    if (KP.focusOverlay) KP.focusOverlay.style.display = 'none';
    if (candidate) {
      if (!KP.focusOverlay) {
        KP.focusOverlay = el('div', { className: 'kpv2-focus-overlay' });
        document.body.appendChild(KP.focusOverlay);
      }
      const rect = candidate.getBoundingClientRect();
      KP.focusOverlay.style.left = `${rect.left}px`;
      KP.focusOverlay.style.top = `${rect.top}px`;
      KP.focusOverlay.style.width = `${rect.width}px`;
      KP.focusOverlay.style.height = `${rect.height}px`;
      KP.focusOverlay.style.display = 'block';
    }

    if (KP.deleteOverlay) KP.deleteOverlay.style.display = 'none';
    if (deletingTarget) {
      if (!KP.deleteOverlay) {
        KP.deleteOverlay = el('div', { className: 'kpv2-delete-overlay' });
        document.body.appendChild(KP.deleteOverlay);
      }
      const rect = deletingTarget.getBoundingClientRect();
      KP.deleteOverlay.style.left = `${rect.left}px`;
      KP.deleteOverlay.style.top = `${rect.top}px`;
      KP.deleteOverlay.style.width = `${rect.width}px`;
      KP.deleteOverlay.style.height = `${rect.height}px`;
      KP.deleteOverlay.style.display = 'block';
    }
  }

  function onMouseMove(e) {
	handleMouseMove(e);
  }
  
  function handleMouseMove(e){
      KP.lastMouse.x = e.clientX; KP.lastMouse.y = e.clientY;

    // Cursor overlay follows the mouse
    if (KP.cursorEl) {
      KP.cursorEl.style.left = e.clientX + 'px';
      KP.cursorEl.style.top = e.clientY + 'px';
    }

    const under = deepElementFromPoint(e.clientX, e.clientY);
    const clickable = findClickable(under) || null;

    const targetForDelete = KP.mode === 'delete' && under ? under : null;
    updateFocusRings(clickable, targetForDelete);
  }

  function cancelModes() {
    KP.mode = 'none';
    updateFocusRings(null, null);

    setCursorMode('none');
  }

  function onKeyDown(e) {
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
      if (e.key === 'Escape') cancelModes();
      return; // permit typing
    }

    if (e.key === 'Escape') { e.preventDefault(); cancelModes(); return; }

    if (e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      history.back();
      return;
    }

    if (e.key === 'v' || e.key === 'V') {
      e.preventDefault();
      history.forward();
      return;
    }

    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      if (KP.mode !== 'delete') {
        KP.mode = 'delete';

        KP.deleteEl = null;
        setCursorMode('delete');
        dbg('delete mode entered');
      } else {

        const victim = KP.deleteEl || deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
        cancelModes();
        if (!victim || victim === document.documentElement || victim === document.body) {
          dbg('delete aborted: invalid target');
          return;
        }
        try { victim.remove(); dbg('element removed', victim.tagName); } catch (err) { dbg('remove() failed; fallback', err && err.message); }
        if (document.contains(victim)) {
          try { victim.classList.add('kpv2-hidden'); victim.setAttribute('aria-hidden', 'true'); dbg('element force-hidden'); } catch { }
        }
      }
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();

      // Prefer the detected link candidate; otherwise use the deepest element at the point.
      let target = KP.focusEl || deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
      if (!target || target === document.documentElement || target === document.body) return;

      // Try semantic activation first (radio/checkbox/range/text).
      const handled = handleSmartActivate(target, KP.lastMouse.x, KP.lastMouse.y);
      if (!handled) {
        rippleAt(KP.lastMouse.x, KP.lastMouse.y);
        smartClick(target, KP.lastMouse.x, KP.lastMouse.y);
      } else {
        rippleAt(KP.lastMouse.x, KP.lastMouse.y);
      }
      return;
    }
    
    
  if (e.code === 'Backquote') {    // reliably detects the ` key
    e.preventDefault();
    const origin = location.origin;   // scheme + host
    window.location.href = origin + '/';
  }



  }

  // ------------------------------- Enable --------------------------------
  function addL(t, type, fn, opts) { t.addEventListener(type, fn, opts); KP.listeners.push(() => t.removeEventListener(type, fn, opts)); }

  function enable() {
    ensureSharedStylesIn(document);
    KP.shadowRoots.forEach(r => { try { ensureSharedStylesIn(r); } catch { } });

    ensureCursor();
    document.documentElement.classList.add('kpv2-cursor-hidden');
    addL(document, 'mousemove', onMouseMove, true);
    addL(document, 'keydown', onKeyDown, true);
  }




  // ------------------------------- Bootstrap ------------------------------
  enable();
})();


