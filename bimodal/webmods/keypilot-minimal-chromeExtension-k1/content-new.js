/**
 * KeyPilot Content Script - Modular Version
 * Keyboard-first navigation with improved text field handling
 */

// Check if already loaded
if (window.__KeyPilotV22) {
  console.warn('[KeyPilot] Already loaded.');
} else {
  window.__KeyPilotV22 = true;

  // State management
  const state = {
    mode: 'none', // 'none' | 'delete' | 'text_focus'
    lastMouse: { x: 0, y: 0 },
    focusEl: null,
    deleteEl: null,
    focusedTextElement: null,
    cursorEl: null,
    focusOverlay: null,
    deleteOverlay: null
  };

  // Constants
  const KEYBINDINGS = {
    ACTIVATE: ['f', 'F'],
    BACK: ['c', 'C'],
    FORWARD: ['v', 'V'],
    DELETE: ['d', 'D'],
    CANCEL: ['Escape']
  };

  const SELECTORS = {
    CLICKABLE: 'a[href], button, input, select, textarea',
    FOCUSABLE_TEXT: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]'
  };

  // Utility functions
  function isTextInput(element) {
    if (!element || element.nodeType !== 1) return false;
    try {
      return element.matches(SELECTORS.FOCUSABLE_TEXT);
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

  // Focus detection
  function checkTextFocus() {
    const activeElement = getDeepActiveElement();
    
    if (isTextInput(activeElement)) {
      if (state.focusedTextElement !== activeElement) {
        setTextFocus(activeElement);
      }
    } else if (state.focusedTextElement) {
      clearTextFocus();
    }
  }

  function setTextFocus(element) {
    state.focusedTextElement = element;
    state.mode = 'text_focus';
    updateCursor();
    updatePopupStatus();
  }

  function clearTextFocus() {
    state.focusedTextElement = null;
    if (state.mode === 'text_focus') {
      state.mode = 'none';
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
    
    if (mode === 'text_focus') {
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

      if (mode === 'delete') {
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
    // Don't interfere with modifier key combinations
    if (hasModifierKeys(e)) {
      return;
    }

    // In text focus mode, only handle ESC
    if (state.mode === 'text_focus') {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        e.preventDefault();
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
    
    // Don't update focus when in text mode
    if (state.mode !== 'text_focus') {
      // Basic element detection (simplified for this version)
      const under = document.elementFromPoint(e.clientX, e.clientY);
      // Update focus/delete elements as needed
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
    if (state.focusedTextElement) {
      state.focusedTextElement.blur();
    }
    clearTextFocus();
  }

  function handleDeleteKey() {
    if (state.mode !== 'delete') {
      state.mode = 'delete';
      updateCursor();
      updatePopupStatus();
    } else {
      // Delete element logic here
      cancelModes();
    }
  }

  function handleActivateKey() {
    // Activation logic here
    console.log('Activate key pressed');
  }

  function cancelModes() {
    if (state.mode !== 'text_focus') {
      state.mode = 'none';
      updateCursor();
      updatePopupStatus();
    }
  }

  // Initialize
  function init() {
    // Add styles
    const style = document.createElement('style');
    style.textContent = `
      html.kpv2-cursor-hidden, html.kpv2-cursor-hidden * { cursor: none !important; }
    `;
    document.head.appendChild(style);
    document.documentElement.classList.add('kpv2-cursor-hidden');

    // Create cursor
    createCursor();

    // Set up event listeners
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('focusin', handleFocusIn, true);
    document.addEventListener('focusout', handleFocusOut, true);

    // Check focus periodically
    setInterval(checkTextFocus, 500);
    checkTextFocus(); // Initial check

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
}