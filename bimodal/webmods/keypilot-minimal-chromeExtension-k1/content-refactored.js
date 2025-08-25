/**
 * KeyPilot Content Script - Refactored Version
 * Keyboard-first navigation with improved text field handling
 */

(() => {
  // Prevent multiple instances
  if (window.__KeyPilotV22) {
    console.warn('[KeyPilot] Already loaded.');
    return;
  }
  window.__KeyPilotV22 = true;

  // Constants
  const KEYBINDINGS = {
    ACTIVATE: ['f', 'F'],
    BACK: ['c', 'C'],
    FORWARD: ['v', 'V'],
    DELETE: ['d', 'D'],
    ROOT: ['`', 'Backquote'],
    CANCEL: ['Escape']
  };

  const SELECTORS = {
    CLICKABLE: 'a[href], button, input, select, textarea',
    FOCUSABLE_TEXT: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]',
    INTERACTIVE: 'a[href], button, input, select, textarea, [contenteditable="true"]'
  };

  const MODES = {
    NONE: 'none',
    DELETE: 'delete',
    TEXT_FOCUS: 'text_focus'
  };

  // State
  const state = {
    mode: MODES.NONE,
    lastMouse: { x: 0, y: 0 },
    focusEl: null,
    deleteEl: null,
    focusedTextElement: null,
    cursorEl: null,
    focusOverlay: null,
    deleteOverlay: null
  };

  // Utility functions
  function isTextInput(element) {
    if (!element || element.nodeType !== 1) return false;

    try {
      // Check if it matches our selector
      if (element.matches(SELECTORS.FOCUSABLE_TEXT)) return true;

      // Additional checks for edge cases
      if (element.tagName === 'TEXTAREA') return true;
      if (element.tagName === 'INPUT') {
        const type = (element.getAttribute('type') || 'text').toLowerCase();
        return ['text', 'search', 'url', 'email', 'tel', 'password', 'number'].includes(type);
      }
      if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') return true;

      return false;
    } catch {
      return false;
    }
  }

  function hasModifierKeys(e) {
    return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
  }

  function getDeepActiveElement() {
    let activeElement = document.activeElement;
    while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
      activeElement = activeElement.shadowRoot.activeElement;
    }
    return activeElement;
  }

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

  function isLikelyInteractive(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.matches(SELECTORS.INTERACTIVE)) return true;
    const role = (el.getAttribute && (el.getAttribute('role') || '').trim().toLowerCase()) || '';
    return role && ['link', 'button'].includes(role);
  }

  function findClickable(el) {
    let n = el;
    while (n && n !== document.body && n.nodeType === 1) {
      if (isLikelyInteractive(n)) return n;
      n = n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null);
    }
    return el && isLikelyInteractive(el) ? el : null;
  }

  function isTextLike(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'url', 'email', 'tel', 'password', 'number'].includes(t);
    }
    return false;
  }

  function isContentEditableElement(el) {
    if (!el || el.nodeType !== 1) return false;
    return el.isContentEditable || el.getAttribute('contenteditable') === 'true';
  }

  function getBestRect(element) {
    if (!element) return { left: 0, top: 0, width: 0, height: 0 };

    let rect = element.getBoundingClientRect();

    // If the element has no height (common with links containing other elements),
    // try to find a child element with height
    if (rect.height === 0 && element.children.length > 0) {
      for (const child of element.children) {
        const childRect = child.getBoundingClientRect();
        if (childRect.height > 0) {
          // Use the child's rect but keep the parent's left position if it's a link
          if (element.tagName.toLowerCase() === 'a') {
            return {
              left: Math.min(rect.left, childRect.left),
              top: childRect.top,
              width: Math.max(rect.width, childRect.width),
              height: childRect.height
            };
          }
          return childRect;
        }
      }
    }

    // If still no height, try to get text content dimensions
    if (rect.height === 0 && element.textContent && element.textContent.trim()) {
      // For text-only elements, use a minimum height
      return {
        left: rect.left,
        top: rect.top,
        width: Math.max(rect.width, 20), // Minimum width
        height: Math.max(rect.height, 20) // Minimum height
      };
    }

    return rect;
  }

  // Focus detection
  function checkTextFocus() {
    const activeElement = getDeepActiveElement();

    if (isTextInput(activeElement)) {
      if (state.focusedTextElement !== activeElement) {
        console.debug('Text focus detected during check:', activeElement.tagName, activeElement.type || 'N/A', 'ID:', activeElement.id || 'none');
        setTextFocus(activeElement);
      }
    } else if (state.focusedTextElement) {
      // Double-check that the stored element is really not focused
      if (state.focusedTextElement !== activeElement) {
        console.debug('Text focus cleared during check');
        clearTextFocus();
      }
    }
  }

  function setTextFocus(element) {
    state.focusedTextElement = element;
    state.mode = MODES.TEXT_FOCUS;
    updateCursor();
    updatePopupStatus();
  }

  function clearTextFocus() {
    state.focusedTextElement = null;
    if (state.mode === MODES.TEXT_FOCUS) {
      state.mode = MODES.NONE;
      updateCursor();
      updatePopupStatus();
    }
  }

  // Cursor management
  function createCursor() {
    if (state.cursorEl) return;

    const wrap = document.createElement('div');
    wrap.id = 'kpv2-cursor';
    wrap.setAttribute('aria-hidden', 'true');
    wrap.style.cssText = 'position: fixed; left: 0; top: 0; transform: translate(-50%, -50%); z-index: 2147483647; pointer-events: none;';

    document.body.appendChild(wrap);
    state.cursorEl = wrap;
    updateCursor();
  }

  function updateCursor() {
    if (!state.cursorEl) return;

    const svg = buildCursorSVG(state.mode);
    state.cursorEl.replaceChildren(svg);
  }

  function buildCursorSVG(mode) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('xmlns', NS);

    if (mode === MODES.TEXT_FOCUS) {
      // Large cursor with text
      svg.setAttribute('viewBox', '0 0 280 120');
      svg.setAttribute('width', '280');
      svg.setAttribute('height', '120');

      // Background
      const bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('x', '5');
      bg.setAttribute('y', '5');
      bg.setAttribute('width', '270');
      bg.setAttribute('height', '110');
      bg.setAttribute('rx', '8');
      bg.setAttribute('fill', 'rgba(0,0,0,0.85)');
      bg.setAttribute('stroke', 'rgba(255,255,255,0.3)');
      bg.setAttribute('stroke-width', '2');
      svg.appendChild(bg);

      // I-beam cursor icon
      const ibeam = document.createElementNS(NS, 'g');
      ibeam.setAttribute('transform', 'translate(25, 35)');

      const line = document.createElementNS(NS, 'line');
      line.setAttribute('x1', '15'); line.setAttribute('y1', '10');
      line.setAttribute('x2', '15'); line.setAttribute('y2', '40');
      line.setAttribute('stroke', 'rgba(255,255,255,0.9)');
      line.setAttribute('stroke-width', '3');
      ibeam.appendChild(line);

      const top = document.createElementNS(NS, 'line');
      top.setAttribute('x1', '10'); top.setAttribute('y1', '10');
      top.setAttribute('x2', '20'); top.setAttribute('y2', '10');
      top.setAttribute('stroke', 'rgba(255,255,255,0.9)');
      top.setAttribute('stroke-width', '3');
      ibeam.appendChild(top);

      const bottom = document.createElementNS(NS, 'line');
      bottom.setAttribute('x1', '10'); bottom.setAttribute('y1', '40');
      bottom.setAttribute('x2', '20'); bottom.setAttribute('y2', '40');
      bottom.setAttribute('stroke', 'rgba(255,255,255,0.9)');
      bottom.setAttribute('stroke-width', '3');
      ibeam.appendChild(bottom);

      svg.appendChild(ibeam);

      // Text
      const text1 = document.createElementNS(NS, 'text');
      text1.setAttribute('x', '60');
      text1.setAttribute('y', '35');
      text1.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text1.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text1.setAttribute('font-size', '14');
      text1.setAttribute('font-weight', '500');
      text1.textContent = 'Press ESC to leave';
      svg.appendChild(text1);

      const text2 = document.createElementNS(NS, 'text');
      text2.setAttribute('x', '60');
      text2.setAttribute('y', '55');
      text2.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text2.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text2.setAttribute('font-size', '14');
      text2.setAttribute('font-weight', '500');
      text2.textContent = 'text field focus';
      svg.appendChild(text2);

      // ESC key
      const escKey = document.createElementNS(NS, 'rect');
      escKey.setAttribute('x', '60');
      escKey.setAttribute('y', '70');
      escKey.setAttribute('width', '35');
      escKey.setAttribute('height', '20');
      escKey.setAttribute('rx', '3');
      escKey.setAttribute('fill', 'rgba(255,255,255,0.1)');
      escKey.setAttribute('stroke', 'rgba(255,255,255,0.4)');
      escKey.setAttribute('stroke-width', '1');
      svg.appendChild(escKey);

      const escText = document.createElementNS(NS, 'text');
      escText.setAttribute('x', '77.5');
      escText.setAttribute('y', '83');
      escText.setAttribute('fill', 'rgba(255,255,255,0.9)');
      escText.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      escText.setAttribute('font-size', '11');
      escText.setAttribute('font-weight', '600');
      escText.setAttribute('text-anchor', 'middle');
      escText.textContent = 'ESC';
      svg.appendChild(escText);

      // Orange crosshair in lower left corner - same size as normal crosshair
      const crosshair = document.createElementNS(NS, 'g');
      crosshair.setAttribute('transform', 'translate(15, 95)');

      // Horizontal line - same length as normal crosshair (24 pixels each arm)
      const hLine1 = document.createElementNS(NS, 'line');
      hLine1.setAttribute('x1', '-24');
      hLine1.setAttribute('y1', '0');
      hLine1.setAttribute('x2', '-10');
      hLine1.setAttribute('y2', '0');
      hLine1.setAttribute('stroke', '#ff8c00');
      hLine1.setAttribute('stroke-width', '4');
      hLine1.setAttribute('stroke-linecap', 'round');
      crosshair.appendChild(hLine1);

      const hLine2 = document.createElementNS(NS, 'line');
      hLine2.setAttribute('x1', '10');
      hLine2.setAttribute('y1', '0');
      hLine2.setAttribute('x2', '24');
      hLine2.setAttribute('y2', '0');
      hLine2.setAttribute('stroke', '#ff8c00');
      hLine2.setAttribute('stroke-width', '4');
      hLine2.setAttribute('stroke-linecap', 'round');
      crosshair.appendChild(hLine2);

      // Vertical line - same length as normal crosshair (24 pixels each arm)
      const vLine1 = document.createElementNS(NS, 'line');
      vLine1.setAttribute('x1', '0');
      vLine1.setAttribute('y1', '-24');
      vLine1.setAttribute('x2', '0');
      vLine1.setAttribute('y2', '-10');
      vLine1.setAttribute('stroke', '#ff8c00');
      vLine1.setAttribute('stroke-width', '4');
      vLine1.setAttribute('stroke-linecap', 'round');
      crosshair.appendChild(vLine1);

      const vLine2 = document.createElementNS(NS, 'line');
      vLine2.setAttribute('x1', '0');
      vLine2.setAttribute('y1', '10');
      vLine2.setAttribute('x2', '0');
      vLine2.setAttribute('y2', '24');
      vLine2.setAttribute('stroke', '#ff8c00');
      vLine2.setAttribute('stroke-width', '4');
      vLine2.setAttribute('stroke-linecap', 'round');
      crosshair.appendChild(vLine2);

      svg.appendChild(crosshair);

    } else {
      // Normal crosshair or delete X
      svg.setAttribute('viewBox', '0 0 94 94');
      svg.setAttribute('width', '94');
      svg.setAttribute('height', '94');

      const addLine = (x1, y1, x2, y2, color, w = '4') => {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', color); ln.setAttribute('stroke-width', w);
        ln.setAttribute('stroke-linecap', 'round');
        svg.appendChild(ln);
      };

      if (mode === MODES.DELETE) {
        addLine(18, 18, 76, 76, 'rgba(220,0,0,0.95)', '5');
        addLine(76, 18, 18, 76, 'rgba(220,0,0,0.95)', '5');
      } else {
        const col = 'rgba(0,128,0,0.95)';
        addLine(47, 10, 47, 34, col);
        addLine(47, 60, 47, 84, col);
        addLine(10, 47, 34, 47, col);
        addLine(60, 47, 84, 47, col);
      }
    }

    return svg;
  }

  function updateCursorPosition(x, y) {
    if (state.cursorEl) {
      state.cursorEl.style.left = `${x}px`;
      state.cursorEl.style.top = `${y}px`;
    }
  }

  // Overlays
  function updateOverlays() {
    updateFocusOverlay();
    updateDeleteOverlay();
  }

  function updateFocusOverlay() {
    // Only show focus overlay in normal mode
    if (state.mode !== MODES.NONE || !state.focusEl) {
      if (state.focusOverlay) {
        state.focusOverlay.style.display = 'none';
      }
      return;
    }

    if (!state.focusOverlay) {
      state.focusOverlay = document.createElement('div');
      state.focusOverlay.className = 'kpv2-focus-overlay';
      state.focusOverlay.style.cssText = `
        position: fixed; pointer-events: none; z-index: 2147483646;
        border: 3px solid rgba(0,180,0,0.95);
        box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5);
        background: transparent;
      `;
      document.body.appendChild(state.focusOverlay);
    }

    const rect = getBestRect(state.focusEl);
    if (rect.width > 0 && rect.height > 0) {
      state.focusOverlay.style.left = `${rect.left}px`;
      state.focusOverlay.style.top = `${rect.top}px`;
      state.focusOverlay.style.width = `${rect.width}px`;
      state.focusOverlay.style.height = `${rect.height}px`;
      state.focusOverlay.style.display = 'block';
    } else {
      state.focusOverlay.style.display = 'none';
    }
  }

  function updateDeleteOverlay() {
    // Only show delete overlay in delete mode
    if (state.mode !== MODES.DELETE || !state.deleteEl) {
      if (state.deleteOverlay) {
        state.deleteOverlay.style.display = 'none';
      }
      return;
    }

    if (!state.deleteOverlay) {
      state.deleteOverlay = document.createElement('div');
      state.deleteOverlay.className = 'kpv2-delete-overlay';
      state.deleteOverlay.style.cssText = `
        position: fixed; pointer-events: none; z-index: 2147483646;
        border: 3px solid rgba(220,0,0,0.95);
        box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45);
        background: transparent;
      `;
      document.body.appendChild(state.deleteOverlay);
    }

    const rect = getBestRect(state.deleteEl);
    if (rect.width > 0 && rect.height > 0) {
      state.deleteOverlay.style.left = `${rect.left}px`;
      state.deleteOverlay.style.top = `${rect.top}px`;
      state.deleteOverlay.style.width = `${rect.width}px`;
      state.deleteOverlay.style.height = `${rect.height}px`;
      state.deleteOverlay.style.display = 'block';
    } else {
      state.deleteOverlay.style.display = 'none';
    }
  }

  // Smart click implementation
  function smartClick(el, clientX, clientY) {
    if (!el) return false;

    const activator = (el.closest && (el.closest('a[href]') || el.closest('button,[role="button"]'))) || el;

    // Try single programmatic activation first
    let prevented = false;
    const onClickCapture = (ev) => {
      if (ev.defaultPrevented) prevented = true;
    };

    try {
      activator.addEventListener('click', onClickCapture, { capture: true, once: true });
      if (typeof activator.click === 'function') {
        activator.click();
        if (prevented) return true;
        return true;
      }
    } catch {
      // fall through to synthetic path
    } finally {
      try {
        activator.removeEventListener('click', onClickCapture, { capture: true });
      } catch { }
    }

    // Fallback: synthesize realistic event sequence
    const base = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX,
      clientY,
      button: 0,
    };

    const tryDispatch = (type, Ctor, opts) => {
      try {
        activator.dispatchEvent(new Ctor(type, opts));
      } catch { }
    };

    tryDispatch('mouseover', MouseEvent, base);
    tryDispatch('mousedown', MouseEvent, base);
    tryDispatch('mouseup', MouseEvent, base);
    tryDispatch('click', MouseEvent, base);
    return true;
  }

  // Popup communication
  function updatePopupStatus() {
    try {
      chrome.runtime.sendMessage({ type: 'KP_STATUS', mode: state.mode });
    } catch (error) {
      // Popup might not be open
    }
  }

  // Event handlers
  function handleKeyDown(e) {
    // Debug key presses
    console.log('[KeyPilot] Key pressed:', e.key, 'Code:', e.code);

    // Don't interfere with modifier key combinations
    if (hasModifierKeys(e)) {
      return;
    }

    // In text focus mode, only handle ESC
    if (state.mode === MODES.TEXT_FOCUS) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        console.debug('Escape key detected in text focus mode');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handleEscapeFromTextFocus();
      }
      return;
    }

    // Handle shortcuts
    if (KEYBINDINGS.CANCEL.includes(e.key)) {
      e.preventDefault();
      cancelModes();
    } else if (KEYBINDINGS.BACK.includes(e.key)) {
      e.preventDefault();
      history.back();
    } else if (KEYBINDINGS.FORWARD.includes(e.key)) {
      e.preventDefault();
      history.forward();
    } else if (KEYBINDINGS.ROOT.includes(e.key)) {
      e.preventDefault();
      handleRootKey();
    } else if (KEYBINDINGS.DELETE.includes(e.key)) {
      e.preventDefault();
      handleDeleteKey();
    } else if (KEYBINDINGS.ACTIVATE.includes(e.key)) {
      e.preventDefault();
      handleActivateKey();
    }
  }

  function handleMouseMove(e) {
    state.lastMouse.x = e.clientX;
    state.lastMouse.y = e.clientY;
    updateCursorPosition(e.clientX, e.clientY);

    updateElementsUnderCursor(e.clientX, e.clientY);
  }

  function handleScroll(e) {
    // Update overlays when scrolling to keep them positioned correctly
    updateElementsUnderCursor(state.lastMouse.x, state.lastMouse.y);
  }

  function updateElementsUnderCursor(x, y) {
    // Don't update focus when in text mode
    if (state.mode !== MODES.TEXT_FOCUS) {
      const under = deepElementFromPoint(x, y);
      const clickable = findClickable(under);

      state.focusEl = clickable;

      if (state.mode === MODES.DELETE) {
        state.deleteEl = under;
      } else {
        // Clear delete element when not in delete mode
        state.deleteEl = null;
      }

      updateOverlays();
    }
  }

  function handleFocusIn(e) {
    if (isTextInput(e.target)) {
      setTextFocus(e.target);
    }
  }

  function handleFocusOut(e) {
    if (isTextInput(e.target)) {
      clearTextFocus();
    }
  }

  function handleEscapeFromTextFocus() {
    console.debug('Escape pressed in text focus mode, attempting to exit');

    // Use the simple, proven approach that works in DevTools
    // Blur the active element and set focus to the body
    if (document.activeElement) {
      document.activeElement.blur();
    }
    document.body.focus();

    // Force clear the text focus state
    clearTextFocus();

    console.debug('Text focus escape completed');
  }

  function handleDeleteKey() {
    if (state.mode !== MODES.DELETE) {
      state.mode = MODES.DELETE;
      updateCursor();
      updatePopupStatus();
    } else {
      const victim = state.deleteEl || deepElementFromPoint(state.lastMouse.x, state.lastMouse.y);
      cancelModes();
      deleteElement(victim);
    }
  }

  function handleRootKey() {
    console.log('[KeyPilot] Root key pressed!');
    console.log('[KeyPilot] Current URL:', window.location.href);
    console.log('[KeyPilot] Origin:', window.location.origin);

    // Navigate to the site root (origin)
    const rootUrl = window.location.origin;
    if (rootUrl && rootUrl !== window.location.href) {
      console.log('[KeyPilot] Navigating to root:', rootUrl);
      window.location.href = rootUrl;
    } else {
      console.log('[KeyPilot] Already at root, no navigation needed');
    }
  }

  function handleActivateKey() {
    const target = state.focusEl || deepElementFromPoint(state.lastMouse.x, state.lastMouse.y);

    if (!target || target === document.documentElement || target === document.body) {
      return;
    }

    // Try semantic activation first
    if (handleSmartActivate(target, state.lastMouse.x, state.lastMouse.y)) {
      showRipple(state.lastMouse.x, state.lastMouse.y);
      return;
    }

    // Fallback to click
    smartClick(target, state.lastMouse.x, state.lastMouse.y);
    showRipple(state.lastMouse.x, state.lastMouse.y);
  }

  function handleSmartActivate(target, x, y) {
    if (!target) return false;

    // Handle label elements
    target = resolveLabel(target);

    // Handle different input types semantically
    if (target.tagName === 'INPUT') {
      const type = (target.getAttribute('type') || 'text').toLowerCase();

      if (type === 'radio') {
        if (!target.checked) {
          target.checked = true;
          dispatchInputChange(target);
        }
        return true;
      }

      if (type === 'checkbox') {
        target.checked = !target.checked;
        dispatchInputChange(target);
        return true;
      }

      if (type === 'range') {
        return handleRange(target, x);
      }
    }

    if (isTextLike(target)) {
      return handleTextField(target);
    }

    if (isContentEditableElement(target)) {
      return handleContentEditable(target);
    }

    return false;
  }

  function resolveLabel(target) {
    if (target.tagName === 'LABEL') {
      const forId = target.getAttribute('for');
      if (forId) {
        const labelCtl = document.getElementById(forId);
        if (labelCtl) return labelCtl;
      } else {
        const ctl = target.querySelector('input, textarea, select');
        if (ctl) return ctl;
      }
    }
    return target;
  }

  function handleTextField(target) {
    try {
      target.focus({ preventScroll: true });
    } catch {
      try { target.focus(); } catch { }
    }
    try {
      const v = target.value ?? '';
      target.setSelectionRange(v.length, v.length);
    } catch { }
    return true;
  }

  function handleContentEditable(target) {
    try {
      target.focus({ preventScroll: true });
    } catch {
      try { target.focus(); } catch { }
    }

    // Try to position cursor at the end of content
    try {
      const selection = window.getSelection();
      const range = document.createRange();

      // If there's text content, position at the end
      if (target.childNodes.length > 0) {
        const lastNode = target.childNodes[target.childNodes.length - 1];
        if (lastNode.nodeType === Node.TEXT_NODE) {
          range.setStart(lastNode, lastNode.textContent.length);
        } else {
          range.setStartAfter(lastNode);
        }
      } else {
        // Empty contenteditable, position at the beginning
        range.setStart(target, 0);
      }

      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } catch (error) {
      // Fallback: just focus without cursor positioning
      console.debug('Could not position cursor in contenteditable:', error);
    }

    return true;
  }

  function handleRange(target, clientX) {
    const rect = target.getBoundingClientRect();
    const min = Number(target.min) || 0;
    const max = Number(target.max) || 100;
    const stepAttr = target.step && target.step !== 'any' ? Number(target.step) : 1;

    if (rect.width <= 0) return false;
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    let val = min + pct * (max - min);

    if (stepAttr && stepAttr > 0) {
      const steps = Math.round((val - min) / stepAttr);
      val = min + steps * stepAttr;
    }
    val = Math.max(min, Math.min(max, val));
    const before = target.value;
    target.value = String(val);
    if (target.value !== before) dispatchInputChange(target);
    return true;
  }

  function dispatchInputChange(el) {
    const opts = { bubbles: true, composed: true };
    el.dispatchEvent(new Event('input', opts));
    el.dispatchEvent(new Event('change', opts));
  }

  function deleteElement(element) {
    if (!element || element === document.documentElement || element === document.body) {
      return;
    }

    try {
      element.remove();
    } catch (error) {
      // Fallback: hide element
      try {
        element.classList.add('kpv2-hidden');
        element.setAttribute('aria-hidden', 'true');
      } catch { }
    }
  }

  function cancelModes() {
    if (state.mode !== MODES.TEXT_FOCUS) {
      state.mode = MODES.NONE;
      // Don't clear focusEl in normal mode, but clear deleteEl
      state.deleteEl = null;
      updateCursor();
      updateOverlays();
      updatePopupStatus();
    }
  }

  function showRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = 'kpv2-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  // Initialize
  function init() {
    // Add styles
    const style = document.createElement('style');
    style.id = 'kpv2-style';
    style.textContent = `
      html.kpv2-cursor-hidden, html.kpv2-cursor-hidden * { cursor: none !important; }
      .kpv2-focus { filter: brightness(1.2) !important; }
      .kpv2-delete { filter: brightness(0.8) contrast(1.2) !important; }
      .kpv2-hidden { display: none !important; }
      @keyframes kpv2-ripple { 
        0% { transform: translate(-50%, -50%) scale(0.25); opacity: 0.35; }
        60% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
        100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      }
      .kpv2-ripple { 
        position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none; 
        width: 46px; height: 46px; border-radius: 50%; 
        background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.22) 60%, rgba(0,200,0,0) 70%); 
        animation: kpv2-ripple 420ms ease-out forwards; 
      }
      .kpv2-focus-overlay { 
        position: fixed; pointer-events: none; z-index: 2147483646; 
        border: 3px solid rgba(0,180,0,0.95); 
        box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5); 
        background: transparent; 
      }
      .kpv2-delete-overlay { 
        position: fixed; pointer-events: none; z-index: 2147483646; 
        border: 3px solid rgba(220,0,0,0.95); 
        box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45); 
        background: transparent; 
      }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('kpv2-cursor-hidden');

    // Create cursor
    createCursor();

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('scroll', handleScroll, { passive: true });
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    // Check focus periodically (more frequent for better responsiveness)
    setInterval(checkTextFocus, 200);

    // Initial check with delay to catch elements focused on page load
    setTimeout(() => {
      checkTextFocus();
      console.debug('Initial focus check completed');
    }, 100);

    // Also check when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(checkTextFocus, 100);
      });
    }

    // Check when page is fully loaded (including images, etc.)
    window.addEventListener('load', () => {
      setTimeout(checkTextFocus, 100);
    });

    // Popup communication
    chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
      if (msg.type === 'KP_GET_STATUS') {
        sendResponse({ mode: state.mode });
      }
    });

    console.log('[KeyPilot] Initialized with text focus detection');
  }

  // Start when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();