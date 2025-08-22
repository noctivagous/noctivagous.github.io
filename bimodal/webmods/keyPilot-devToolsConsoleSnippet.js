/*

-----------------------------------------------------
(PASTE INTO WEB DEVTOOLS JS CONSOLE OF CHROME/SAFARI)
-----------------------------------------------------

=========================================================================
   KeyPilot v2.1 — Keyboard-first helper with shadow DOM support & debug HUD
   -------------------------------------------------------------------------
   Toggle ON/OFF: Alt + Shift + B
   Toggle DEBUG:  Alt + Shift + P
   Keys when ON:
     F    → Click the element under the cursor (prefers links/buttons/ARIA roles)
     H    → Start text highlight mode; press H again to wrap selection in <mark>
     ESC  → Cancel current mode (highlight/delete)
     D    → Start delete mode; press D again to remove the hovered element
   Visuals:
     • Big crosshair cursor while enabled
     • Green focus ring on clickable candidates (F)
     • Red focus ring on delete target (D)
     • Ripple animation where clicks occur (incl. F)
     • Compact HUD with live status + optional DEBUG log panel
   Shadow DOM:
     • Traverses nested open shadow roots to find the deepest element under the
       cursor (works on sites like Internet Archive that use web components)
     • Injects helper CSS into open shadow roots (focus/delete ring visibility)
     • Patches attachShadow to auto-inject CSS for future open roots
     • Clicks are dispatched with composed: true for better shadow handling
   Notes:
     • Built without innerHTML to satisfy Trusted Types CSP.
     • Highlight mode uses Selection/Range APIs with fallbacks.
     • Deleting avoids <html>, <body>, and the HUD itself.
   ========================================================================= */
(() => {
  if (window.__KeyPilotV21 && window.__KeyPilotV21.bootstrap) {
    console.warn('[KeyPilot] Already loaded.');
    return;
  }

  // ------------------------------ Utilities ------------------------------
  const $ = (s, r=document) => r.querySelector(s);
  const CLICKABLE_ROLES = [
    'button','link','tab','menuitem','menuitemcheckbox','menuitemradio',
    'option','checkbox','radio','switch','treeitem','gridcell','cell','row',
    'combobox','slider','spinbutton'
  ];
  const CLICKABLE_SEL = [
    'a[href]','button','summary',
    'input:not([type="hidden"])','select','textarea',
    '[contenteditable]','[role]','[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const KP = {
    enabled: false,
    mode: 'none', // 'none' | 'highlight' | 'delete'
    lastMouse: { x: 0, y: 0 },
    focusEl: null,
    deleteEl: null,
    listeners: [],
    debug: false,
    shadowRoots: new Set(),
  };

  function dbg(...args) {
    if (!KP.debug) return;
    try { console.debug('[KeyPilot]', ...args); } catch {}
    const pane = $('#kpv2-log');
    if (!pane) return;
    const line = document.createElement('div');
    const ts = new Date().toISOString().split('T')[1].replace('Z','');
    line.textContent = `${ts}  ${args.map(a => {
      try { return typeof a==='string' ? a : JSON.stringify(a); } catch { return String(a); }
    }).join(' ')}`;
    pane.appendChild(line);
    // Trim
    while (pane.childElementCount > 200) pane.removeChild(pane.firstChild);
    pane.scrollTop = pane.scrollHeight;
  }

  function isLikelyInteractive(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(CLICKABLE_SEL)) return true;
    const role = (el.getAttribute('role') || '').trim().toLowerCase();
    if (role && CLICKABLE_ROLES.includes(role)) return true;
    // Heuristic: label/summary/details/custom elements
    if (/^(label|summary|details|option|select)$/i.test(el.tagName)) return true;
    if (el.tagName.includes('-') && typeof el.onclick === 'function') return true;
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

  function smartClick(el, clientX, clientY) {
    if (!el) return false;
    dbg('smartClick target:', el.tagName, el.id || '', el.className || '');
    try { if (typeof el.click === 'function') { el.click(); } } catch {}
    const opts = { bubbles: true, cancelable: true, composed: true, view: window, clientX, clientY };
    try { el.dispatchEvent(new MouseEvent('pointerdown', opts)); } catch {}
    try { el.dispatchEvent(new MouseEvent('mousedown',   opts)); } catch {}
    try { el.dispatchEvent(new MouseEvent('mouseup',     opts)); } catch {}
    try { el.dispatchEvent(new MouseEvent('click',       opts)); } catch {}
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

  // ------------------------------- Styles --------------------------------
  const SHARED_CSS = `
/* Big crosshair cursor (~70pt) while enabled */
:host, :root {}
.kpv2-host-on, .kpv2-host-on * { cursor: url("data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='94' height='94' viewBox='0 0 94 94'>\
  <g>\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2'/>\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(0,128,0,0.25)' stroke-width='6'/>\
    <line x1='47' y1='10' x2='47' y2='34' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\
    <line x1='47' y1='60' x2='47' y2='84' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\
    <line x1='10' y1='47' x2='34' y2='47' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\
    <line x1='60' y1='47' x2='84' y2='47' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\
  </g>\
</svg>") 47 47, crosshair !important; }

.kpv2-focus { outline: 3px solid rgba(0,180,0,0.95) !important; box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5) !important; }
.kpv2-delete { outline: 3px solid rgba(220,0,0,0.95) !important; box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45) !important; }
.kpv2-hidden { display: none !important; }
@keyframes kpv2-ripple { 0%{transform:translate(-50%,-50%) scale(.25); opacity:.35;} 60%{transform:translate(-50%,-50%) scale(1); opacity:.2;} 100%{transform:translate(-50%,-50%) scale(1.6); opacity:0;} }
.kpv2-ripple { position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none; width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.22) 60%, rgba(0,200,0,0) 70%); animation: kpv2-ripple 420ms ease-out forwards; }
mark.kpv2-mark { background: rgba(255,230,0,.85); color: inherit; padding: 0 .05em; border-radius: .15em; }
#kpv2-hud { position: fixed; right: 10px; bottom: 10px; z-index: 2147483647; padding: 8px 10px; border-radius: 10px; font: 12px/1.3 system-ui, Arial, sans-serif; background: rgba(32,32,32,0.92); color: #fff; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 6px 16px rgba(0,0,0,0.3); min-width: 190px; max-width: 36ch; }
#kpv2-hud .row { display: flex; gap: 6px; align-items: baseline; margin: 2px 0; }
#kpv2-hud .k { display:inline-block; min-width: 22px; padding: 2px 6px; border-radius: 5px; background:#1e90ff; }
#kpv2-status.ok { color: #86f089; }
#kpv2-status.warn { color: #ffd36a; }
#kpv2-status.err { color: #ff7f7f; }
#kpv2-log { max-height: 120px; overflow:auto; margin-top: 6px; padding: 6px; background: rgba(0,0,0,0.35); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); }
`;

  function ensureSharedStylesIn(docOrRoot=document) {
    const root = docOrRoot instanceof ShadowRoot ? docOrRoot : docOrRoot.documentElement;
    if (!root) return;
    const id = 'kpv2-style';
    const existing = (docOrRoot instanceof ShadowRoot ? docOrRoot : document).getElementById?.(id);
    if (existing) return; // Avoid duplicating in documents
    const styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.textContent = SHARED_CSS;
    (docOrRoot instanceof ShadowRoot ? docOrRoot : document.head).appendChild(styleEl);
  }

  // Inject styles to current open shadow roots and patch attachShadow for future ones
  (function patchAttachShadow(){
    const orig = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function(init){
      const root = orig.call(this, init);
      // Only open shadow roots are accessible
      try { ensureSharedStylesIn(root); KP.shadowRoots.add(root); dbg('attachShadow patched + injected for', this.tagName); } catch {}
      return root;
    };
    // Inject into existing open roots
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.shadowRoot) {
        try { ensureSharedStylesIn(n.shadowRoot); KP.shadowRoots.add(n.shadowRoot); } catch {}
      }
    }
  })();

  // ------------------------------- HUD -----------------------------------
  function ensureHUD() {
    if ($('#kpv2-hud')) return;
    const hud = el('div', { id: 'kpv2-hud' });

    const head = el('div', { className: 'row' },
      el('span', { text: 'KeyPilot' }),
      el('span', { id: 'kpv2-status', className: 'ok', text: 'ON' })
    );
    const mkRow = (k, msg) => el('div', { className: 'row' }, el('span', { className: 'k', text: k }), el('span', { text: msg }));

    const log = el('div', { id: 'kpv2-log' });

    hud.append(
      head,
      mkRow('F',  'Click under cursor'),
      mkRow('H',  'Start/finish highlight (ESC cancels)'),
      mkRow('D',  'Delete mode (ESC cancels)'),
      mkRow('Alt+Shift+B', 'Toggle ON/OFF'),
      mkRow('Alt+Shift+P', 'Toggle DEBUG log')
    );
    hud.append(log);
    document.body.appendChild(hud);
  }
  function setHUDStatus(text, cls) {
    const s = $('#kpv2-status'); if (!s) return; s.textContent = text; s.className = cls || 'ok';
  }
  function removeHUD(){ $('#kpv2-hud')?.remove(); }

  // ------------------------- Ripple (click feedback) ----------------------
  function rippleAt(x, y) {
    const r = el('div', { className: 'kpv2-ripple' });
    r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  }

  // --------------------------- Highlight helpers --------------------------
  function getActiveSelection() {
    // Prefer selection belonging to the deepest node under cursor (shadow-aware)
    const under = deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
    const root = under ? under.getRootNode() : document;
    if (root instanceof ShadowRoot && root.getSelection) return root.getSelection();
    return document.getSelection();
  }

  function markSelectionPrimary() {
    const sel = getActiveSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    try {
      const range = sel.getRangeAt(0).cloneRange();
      const frag = range.extractContents();
      const wrap = el('mark', { className: 'kpv2-mark' });
      wrap.appendChild(frag);
      range.insertNode(wrap);
      sel.removeAllRanges();
      dbg('highlight primary applied');
      return true;
    } catch (e) { dbg('highlight primary failed', e.message || e); return false; }
  }

  function markSelectionFallback() {
    const sel = getActiveSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);

    const intersects = (textNode) => {
      const r = document.createRange();
      r.selectNodeContents(textNode);
      return !(range.compareBoundaryPoints(Range.END_TO_START, r) <= 0 ||
               range.compareBoundaryPoints(Range.START_TO_END, r) >= 0);
    };

    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return intersects(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes = [];
    let cur; while ((cur = walker.nextNode())) nodes.push(cur);
    if (!nodes.length) return false;

    const first = nodes[0], last = nodes[nodes.length - 1];
    if (first === last) {
      const pre = first.splitText(range.startOffset);
      pre.splitText(range.endOffset - range.startOffset);
      nodes.length = 0; nodes.push(pre);
    } else {
      first.splitText(range.startOffset);
      last.splitText(range.endOffset);
    }

    for (const n of nodes) {
      if (!n.parentNode) continue;
      const m = el('mark', { className: 'kpv2-mark' });
      n.parentNode.insertBefore(m, n);
      m.appendChild(n);
    }
    sel.removeAllRanges();
    dbg('highlight fallback applied');
    return true;
  }

  function applyHighlight() {
    if (markSelectionPrimary()) return true;
    if (markSelectionFallback()) return true;

    // Last resort: mark a single character at caret under cursor
    const caretRange = (function() {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(KP.lastMouse.x, KP.lastMouse.y);
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(KP.lastMouse.x, KP.lastMouse.y);
        if (!pos) return null;
        const r = document.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.setEnd(pos.offsetNode, Math.min(pos.offset + 1, (pos.offsetNode.textContent||'').length));
        return r;
      }
      return null;
    })();

    if (caretRange) {
      const sel = getActiveSelection();
      try { sel.removeAllRanges(); sel.addRange(caretRange); } catch {}
      return markSelectionPrimary() || markSelectionFallback();
    }
    dbg('highlight failed: no selection');
    return false;
  }

  // ----------------------------- Event logic ------------------------------
  function updateFocusRings(candidate, deletingTarget) {
    // Remove prior
    KP.focusEl?.classList.remove('kpv2-focus');
    KP.deleteEl?.classList.remove('kpv2-delete');

    KP.focusEl = candidate || null;
    KP.deleteEl = deletingTarget || null;

    KP.focusEl?.classList.add('kpv2-focus');
    KP.deleteEl?.classList.add('kpv2-delete');
  }

  function onMouseMove(e) {
    KP.lastMouse.x = e.clientX; KP.lastMouse.y = e.clientY;

    const under = deepElementFromPoint(e.clientX, e.clientY);
    const clickable = findClickable(under) || null;

    const targetForDelete = KP.mode === 'delete' && under && !$('#kpv2-hud')?.contains(under) ? under : null;
    updateFocusRings(clickable, targetForDelete);
  }

  function cancelModes() {
    KP.mode = 'none';
    KP.deleteEl?.classList.remove('kpv2-delete'); KP.deleteEl = null;
    setHUDStatus('ON', 'ok');
    // Restore site user-select defaults (best-effort)
    document.documentElement.style.removeProperty('user-select');
    document.body.style.removeProperty('user-select');
  }

  function onKeyDown(e) {
    // Global toggles
    if (e.altKey && e.shiftKey && e.code === 'KeyB') { e.preventDefault(); KP.enabled ? disable() : enable(); return; }
    if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); KP.debug = !KP.debug; setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok'); dbg('debug toggled', KP.debug); return; }

    if (!KP.enabled) return;

    const tag = (e.target && e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable)) {
      if (e.key === 'Escape') cancelModes();
      return; // permit typing
    }

    if (e.key === 'Escape') { e.preventDefault(); cancelModes(); return; }

    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      if (KP.mode !== 'delete') {
        KP.mode = 'delete';
        setHUDStatus('DELETE', 'err');
        KP.deleteEl = null;
        dbg('delete mode entered');
      } else {
        const hud = $('#kpv2-hud');
        const victim = KP.deleteEl || deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
        cancelModes();
        if (!victim || (hud && hud.contains(victim)) || victim === document.documentElement || victim === document.body) {
          dbg('delete aborted: invalid target');
          return;
        }
        try { victim.remove(); dbg('element removed', victim.tagName); } catch (err) { dbg('remove() failed; fallback', err && err.message); }
        if (document.contains(victim)) {
          try { victim.classList.add('kpv2-hidden'); victim.setAttribute('aria-hidden','true'); dbg('element force-hidden'); } catch {}
        }
      }
      return;
    }

    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      if (KP.mode !== 'highlight') {
        KP.mode = 'highlight';
        setHUDStatus('HIGHLIGHT', 'warn');
        document.documentElement.style.userSelect = 'text';
        document.body.style.userSelect = 'text';
        dbg('highlight mode entered');
      } else {
        const ok = applyHighlight();
        cancelModes();
        if (!ok) setHUDStatus('ON', 'ok');
      }
      return;
    }

    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      const el = KP.focusEl || deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
      const target = findClickable(el) || el;
      rippleAt(KP.lastMouse.x, KP.lastMouse.y);
      if (target) smartClick(target, KP.lastMouse.x, KP.lastMouse.y);
      return;
    }
  }

  // ----------------------------- Enable/Disable ---------------------------
  function addL(t, type, fn, opts) { t.addEventListener(type, fn, opts); KP.listeners.push(() => t.removeEventListener(type, fn, opts)); }

  function enable() {
    if (KP.enabled) return;
    KP.enabled = true;
    ensureSharedStylesIn(document);
    // Ensure all known open shadow roots have the helper CSS
    KP.shadowRoots.forEach(r => { try { ensureSharedStylesIn(r); } catch {} });
    ensureHUD();
    setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok');
    document.body.classList.add('kpv2-host-on');
    addL(document, 'mousemove', onMouseMove, true);
    addL(document, 'keydown',  onKeyDown,  true);
    dbg('enabled');
  }

  function disable() {
    if (!KP.enabled) return;
    KP.enabled = false;
    cancelModes();
    KP.focusEl?.classList.remove('kpv2-focus'); KP.focusEl = null;
    KP.listeners.splice(0).forEach(off => { try { off(); } catch {} });
    document.body.classList.remove('kpv2-host-on');
    removeHUD();
    dbg('disabled');
  }

  // ------------------------------- Bootstrap ------------------------------
  function onBootstrapKey(e) {
    if (e.altKey && e.shiftKey && e.code === 'KeyB') { e.preventDefault(); KP.enabled ? disable() : enable(); }
    if (e.altKey && e.shiftKey && e.code === 'KeyP') { e.preventDefault(); KP.debug = !KP.debug; setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok'); }
  }
  window.addEventListener('keydown', onBootstrapKey, true);

  // Public API (minimal)
  window.__KeyPilotV21 = { enable, disable, bootstrap: true, _dbg: () => KP };

  // Start enabled by default
  enable();
})();