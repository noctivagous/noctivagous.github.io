/**
 * KeyPilot Chrome Extension - Bundled Version
 * Generated on 2025-08-28T00:28:07.718Z
 */

(() => {
  // Global scope for bundled modules


  // Module: src/config/constants.js
/**
 * Application constants and configuration
 */
const KEYBINDINGS = {
  ACTIVATE: ['f', 'F'],
  BACK: ['c', 'C'],
  BACK2: ['s', 'S'],
  FORWARD: ['v', 'V'],
  DELETE: ['d', 'D'],
  HIGHLIGHT: ['h', 'H'],
  ROOT: ['`', 'Backquote'],
  CLOSE_TAB: ['/', '/'],
  CANCEL: ['Escape']
};

const SELECTORS = {
  CLICKABLE: 'a[href], button, input, select, textarea',
  TEXT_INPUTS: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea',
  FOCUSABLE_TEXT: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]'
};

const ARIA_ROLES = {
  CLICKABLE: ['link', 'button']
};

const CSS_CLASSES = {
  CURSOR_HIDDEN: 'kpv2-cursor-hidden',
  FOCUS: 'kpv2-focus',
  DELETE: 'kpv2-delete',
  HIGHLIGHT: 'kpv2-highlight',
  HIDDEN: 'kpv2-hidden',
  RIPPLE: 'kpv2-ripple',
  FOCUS_OVERLAY: 'kpv2-focus-overlay',
  DELETE_OVERLAY: 'kpv2-delete-overlay',
  HIGHLIGHT_OVERLAY: 'kpv2-highlight-overlay',
  HIGHLIGHT_SELECTION: 'kpv2-highlight-selection',
  TEXT_FIELD_GLOW: 'kpv2-text-field-glow',
  VIEWPORT_MODAL_FRAME: 'kpv2-viewport-modal-frame',
  ACTIVE_TEXT_INPUT_FRAME: 'kpv2-active-text-input-frame',
  ESC_EXIT_LABEL: 'kpv2-esc-exit-label'
};

const ELEMENT_IDS = {
  CURSOR: 'kpv2-cursor',
  STYLE: 'kpv2-style'
};

const Z_INDEX = {
  VIEWPORT_MODAL_FRAME: 2147483645,
  OVERLAYS: 2147483646,
  CURSOR: 2147483647,
  MESSAGE_BOX: 2147483648
};

const MODES = {
  NONE: 'none',
  DELETE: 'delete',
  TEXT_FOCUS: 'text_focus',
  HIGHLIGHT: 'highlight'
};

const COLORS = {
  // Primary cursor colors
  FOCUS_GREEN: 'rgba(0,180,0,0.95)',
  FOCUS_GREEN_BRIGHT: 'rgba(0,128,0,0.95)',
  DELETE_RED: 'rgba(220,0,0,0.95)',
  HIGHLIGHT_BLUE: 'rgba(0,120,255,0.95)',
  ORANGE: '#ff8c00',

  // Text and background colors
  TEXT_WHITE_PRIMARY: 'rgba(255,255,255,0.95)',
  TEXT_WHITE_SECONDARY: 'rgba(255,255,255,0.8)',
  TEXT_GREEN_BRIGHT: '#6ced2b',

  // Background colors
  MESSAGE_BG_BROWN: '#ad6007',
  MESSAGE_BG_GREEN: '#10911b',

  // Border and shadow colors
  ORANGE_BORDER: 'rgba(255,140,0,0.4)',
  ORANGE_SHADOW: 'rgba(255,140,0,0.45)',
  ORANGE_SHADOW_DARK: 'rgba(255,140,0,0.8)',
  ORANGE_SHADOW_LIGHT: 'rgba(255,140,0,0.3)',
  GREEN_SHADOW: 'rgba(0,180,0,0.45)',
  GREEN_SHADOW_BRIGHT: 'rgba(0,180,0,0.5)',
  DELETE_SHADOW: 'rgba(220,0,0,0.35)',
  DELETE_SHADOW_BRIGHT: 'rgba(220,0,0,0.45)',
  HIGHLIGHT_SHADOW: 'rgba(0,120,255,0.35)',
  HIGHLIGHT_SHADOW_BRIGHT: 'rgba(0,120,255,0.45)',
  BLACK_SHADOW: 'rgba(40, 40, 40, 0.7)',

  // Ripple effect colors
  RIPPLE_GREEN: 'rgba(0,200,0,0.35)',
  RIPPLE_GREEN_MID: 'rgba(0,200,0,0.22)',
  RIPPLE_GREEN_TRANSPARENT: 'rgba(0,200,0,0)',

  // Flash animation colors
  FLASH_GREEN: 'rgba(0,255,0,1)',
  FLASH_GREEN_SHADOW: 'rgba(0,255,0,0.8)',
  FLASH_GREEN_GLOW: 'rgba(0,255,0,0.9)',

  // Notification colors
  NOTIFICATION_SUCCESS: '#4CAF50',
  NOTIFICATION_ERROR: '#f44336',
  NOTIFICATION_INFO: '#2196F3',
  NOTIFICATION_SHADOW: 'rgba(0, 0, 0, 0.15)',

  // Text field glow
  TEXT_FIELD_GLOW: 'rgba(255,165,0,0.8)',

  // Highlight selection colors
  HIGHLIGHT_SELECTION_BG: 'rgba(0,120,255,0.3)',
  HIGHLIGHT_SELECTION_BORDER: 'rgba(0,120,255,0.6)'
};

const CURSOR_SETTINGS = {
  DEFAULT_SIZE: 1.0,
  MIN_SIZE: 0.5,
  MAX_SIZE: 2.0,
  SIZE_STEP: 0.1,
  DEFAULT_VISIBLE: true,
  STORAGE_KEYS: {
    SIZE: 'keypilot_cursor_size',
    VISIBLE: 'keypilot_cursor_visible'
  }
};


  // Module: src/modules/state-manager.js
/**
 * Application state management
 */
class StateManager {
  constructor() {
    this.state = {
      mode: MODES.NONE,
      lastMouse: { x: 0, y: 0 },
      focusEl: null,
      deleteEl: null,
      highlightEl: null,
      highlightStartPosition: null,
      currentSelection: null,
      isInitialized: false
    };
    
    this.subscribers = new Set();
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Notify subscribers of state changes
    this.notifySubscribers(prevState, this.state);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers(prevState, newState) {
    for (const callback of this.subscribers) {
      try {
        callback(newState, prevState);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    }
  }

  // Convenience methods
  setMode(mode) {
    this.setState({ mode });
  }

  setMousePosition(x, y) {
    this.setState({ lastMouse: { x, y } });
  }

  setFocusElement(element) {
    this.setState({ focusEl: element });
  }

  setDeleteElement(element) {
    this.setState({ deleteEl: element });
  }

  setHighlightElement(element) {
    this.setState({ highlightEl: element });
  }

  setHighlightStartPosition(position) {
    this.setState({ highlightStartPosition: position });
  }

  setCurrentSelection(selection) {
    this.setState({ currentSelection: selection });
  }

  clearElements() {
    this.setState({ 
      focusEl: null, 
      deleteEl: null,
      highlightEl: null,
      highlightStartPosition: null,
      currentSelection: null
    });
  }

  isDeleteMode() {
    return this.state.mode === MODES.DELETE;
  }

  isHighlightMode() {
    return this.state.mode === MODES.HIGHLIGHT;
  }

  isTextFocusMode() {
    return this.state.mode === MODES.TEXT_FOCUS;
  }

  reset() {
    this.setState({
      mode: MODES.NONE,
      focusEl: null,
      deleteEl: null,
      highlightEl: null,
      highlightStartPosition: null,
      currentSelection: null
    });
  }
}


  // Module: src/modules/event-manager.js
/**
 * Centralized event management
 */
class EventManager {
  constructor() {
    this.listeners = new Map();
    this.isActive = false;
  }

  start() {
    if (this.isActive) return;
    
    this.addListener(document, 'keydown', this.handleKeyDown.bind(this), { capture: true });
    
    // Multiple mouse move listeners to catch events that might be captured
    this.addListener(document, 'mousemove', this.handleMouseMove.bind(this));
    this.addListener(document, 'mousemove', this.handleMouseMove.bind(this), { capture: true });
    this.addListener(window, 'mousemove', this.handleMouseMove.bind(this));
    
    // Additional mouse events for better tracking
    this.addListener(document, 'mouseenter', this.handleMouseMove.bind(this));
    this.addListener(document, 'mouseover', this.handleMouseMove.bind(this));
    
    this.addListener(document, 'scroll', this.handleScroll.bind(this), { passive: true });
    
    this.isActive = true;
  }

  stop() {
    if (!this.isActive) return;
    
    this.removeAllListeners();
    this.isActive = false;
  }

  cleanup() {
    this.stop();
    if (this.focusDetector) {
      this.focusDetector.stop();
    }
  }

  addListener(element, event, handler, options = {}) {
    const key = `${element.constructor.name}-${event}`;
    
    if (this.listeners.has(key)) {
      this.removeListener(element, event);
    }
    
    element.addEventListener(event, handler, options);
    this.listeners.set(key, { element, event, handler, options });
  }

  removeListener(element, event) {
    const key = `${element.constructor.name}-${event}`;
    const listener = this.listeners.get(key);
    
    if (listener) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
      this.listeners.delete(key);
    }
  }

  removeAllListeners() {
    for (const [_key, listener] of this.listeners) {
      listener.element.removeEventListener(listener.event, listener.handler, listener.options);
    }
    this.listeners.clear();
  }

  handleKeyDown(_e) {
    // Override in implementation
  }

  handleMouseMove(_e) {
    // Override in implementation  
  }

  handleScroll(_e) {
    // Override in implementation
  }

  isTypingContext(target) {
    if (!target) return false;
    
    const tag = target.tagName?.toLowerCase();
    return tag === 'input' || 
           tag === 'textarea' || 
           target.isContentEditable;
  }

  hasModifierKeys(e) {
    return e.ctrlKey || e.metaKey || e.altKey || e.shiftKey;
  }
}


  // Module: src/modules/cursor.js
/**
 * Cursor overlay management
 */
class CursorManager {
  constructor() {
    this.cursorEl = null;
    this.lastPosition = { x: 0, y: 0 };
    this.isStuck = false;
    this.stuckCheckInterval = null;
    this.forceUpdateCount = 0;
  }

  ensure() {
    if (this.cursorEl) return;

    const wrap = this.createElement('div', {
      id: 'kpv2-cursor',
      'aria-hidden': 'true'
    });
    wrap.appendChild(this.buildSvg('none', {}));
    document.body.appendChild(wrap);
    this.cursorEl = wrap;

    // Start monitoring for stuck cursor
    this.startStuckDetection();
  }

  setMode(mode, options = {}) {
    if (!this.cursorEl) return;
    this.cursorEl.replaceChildren(this.buildSvg(mode, options));
  }



  updatePosition(x, y) {
    if (!this.cursorEl) return;

    // Store the intended position
    this.lastPosition = { x, y };

    // Use multiple positioning strategies for maximum compatibility
    this.forceUpdatePosition(x, y);

    // Reset stuck detection
    this.isStuck = false;
    this.forceUpdateCount = 0;
  }

  forceUpdatePosition(x, y) {
    if (!this.cursorEl) return;

    // Strategy 1: Standard positioning with transform (most performant)
    this.cursorEl.style.left = `${x}px`;
    this.cursorEl.style.top = `${y}px`;
    this.cursorEl.style.transform = 'translate(-50%, -50%)';

    // Strategy 2: Force reflow to ensure position update
    this.cursorEl.offsetHeight; // Force reflow

    // Strategy 3: Backup positioning using CSS custom properties
    this.cursorEl.style.setProperty('--cursor-x', `${x}px`);
    this.cursorEl.style.setProperty('--cursor-y', `${y}px`);

    // Strategy 4: Ensure z-index is maintained
    this.cursorEl.style.zIndex = '2147483647';

    // Strategy 5: Ensure element is visible and positioned
    this.cursorEl.style.position = 'fixed';
    this.cursorEl.style.pointerEvents = 'none';
    this.cursorEl.style.display = 'block';
    this.cursorEl.style.visibility = 'visible';
  }

  startStuckDetection() {
    // Check every 100ms if cursor might be stuck
    this.stuckCheckInterval = setInterval(() => {
      this.checkIfStuck();
    }, 100);
  }

  checkIfStuck() {
    if (!this.cursorEl) return;

    const rect = this.cursorEl.getBoundingClientRect();
    const expectedX = this.lastPosition.x;
    const expectedY = this.lastPosition.y;

    // Check if cursor is significantly off from expected position
    const deltaX = Math.abs(rect.left + rect.width / 2 - expectedX);
    const deltaY = Math.abs(rect.top + rect.height / 2 - expectedY);

    if (deltaX > 5 || deltaY > 5) {
      this.isStuck = true;
      this.forceUpdateCount++;

      if (window.KEYPILOT_DEBUG) {
        console.warn('[KeyPilot] Cursor appears stuck, forcing update', {
          expected: this.lastPosition,
          actual: { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 },
          delta: { x: deltaX, y: deltaY },
          forceCount: this.forceUpdateCount
        });
      }

      // Try multiple recovery strategies
      this.recoverFromStuck();
    }
  }

  recoverFromStuck() {
    if (!this.cursorEl) return;

    const { x, y } = this.lastPosition;

    // Recovery strategy 1: Force position update
    this.forceUpdatePosition(x, y);

    // Recovery strategy 2: Recreate element if severely stuck
    if (this.forceUpdateCount > 5) {
      if (window.KEYPILOT_DEBUG) {
        console.warn('[KeyPilot] Cursor severely stuck, recreating element');
      }
      this.recreateCursor();
    }

    // Recovery strategy 3: Use requestAnimationFrame for next update
    requestAnimationFrame(() => {
      this.forceUpdatePosition(x, y);
    });
  }

  recreateCursor() {
    if (!this.cursorEl) return;

    const currentMode = this.getCurrentMode();
    const { x, y } = this.lastPosition;

    // Remove old cursor
    this.cursorEl.remove();
    this.cursorEl = null;

    // Recreate cursor
    this.ensure();
    this.setMode(currentMode, {});
    this.forceUpdatePosition(x, y);

    // Reset counters
    this.forceUpdateCount = 0;
    this.isStuck = false;
  }

  getCurrentMode() {
    if (!this.cursorEl) return 'none';

    // Try to determine current mode from SVG content
    const svg = this.cursorEl.querySelector('svg');
    if (!svg) return 'none';

    const lines = svg.querySelectorAll('line');
    if (lines.length === 2) return 'delete'; // X pattern
    if (lines.length === 4) {
      const firstLine = lines[0];
      const stroke = firstLine.getAttribute('stroke');
      if (stroke && stroke.includes('255,140,0')) return 'text_focus'; // Orange
      if (stroke && stroke.includes('0,120,255')) return 'highlight'; // Blue
      return 'none'; // Green crosshair
    }

    return 'none';
  }

  buildSvg(mode, options = {}) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');

    if (mode === 'text_focus') {
      // Larger SVG for text mode with message in lower right quadrant
      svg.setAttribute('viewBox', '0 0 200 140');
      svg.setAttribute('width', '400');
      svg.setAttribute('height', '140');

      const addLine = (x1, y1, x2, y2, color, w = '4') => {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', color); ln.setAttribute('stroke-width', w);
        ln.setAttribute('stroke-linecap', 'round');
        svg.appendChild(ln);
      };


      // Determine message based on whether there's a clickable element
      const hasClickableElement = options.hasClickableElement || false;

      // Background div for message in lower right quadrant
      const bg = document.createElement('div');
      Object.assign(bg.style, {
        position: 'absolute',
        left: '100px',  // Right side of crosshair
        top: '70px',    // Lower quadrant
        width: '195px',
        backgroundColor: COLORS.MESSAGE_BG_BROWN, // hasClickableElement ? COLORS.MESSAGE_BG_GREEN : COLORS.MESSAGE_BG_BROWN
        border: `1px solid ${COLORS.ORANGE_BORDER}`,
        borderRadius: '6px',
        filter: `drop-shadow(5px 5px 5px ${COLORS.BLACK_SHADOW})`,
        zIndex: Z_INDEX.MESSAGE_BOX, // Higher than cursor to ensure visibility
        pointerEvents: 'none',
        padding: '8px 9px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        lineHeight: '1.2'
      });

      const firstLineText = hasClickableElement ? 'Cursor is in a text field.' : 'Cursor is in a text field.';
      const secondLineText = 'Begin typing.';
      const thirdLineText = hasClickableElement ? 'Use ESC to click this element.' : 'Press ESC to exit.';

      // First line of text using normal document flow
      const text1 = document.createElement('div');
      Object.assign(text1.style, {
        color: COLORS.TEXT_WHITE_PRIMARY,
        fontSize: '12px',
        fontWeight: '800',
        marginBottom: '2px'
      });
      text1.textContent = firstLineText;
      bg.appendChild(text1);

      // Second line of text using normal document flow
      const text2 = document.createElement('div');
      Object.assign(text2.style, {
        color: COLORS.TEXT_WHITE_SECONDARY,
        fontSize: '13px',
        fontWeight: '500',
        marginBottom: '2px'
      });
      text2.textContent = secondLineText;
      bg.appendChild(text2);

      // Third line of text using normal document flow
      const text3 = document.createElement('div');
      Object.assign(text3.style, {
        color: hasClickableElement ? COLORS.TEXT_GREEN_BRIGHT : COLORS.ORANGE,
        fontSize: '11px',
        fontWeight: '600'
      });
      text3.textContent = thirdLineText;
      bg.appendChild(text3);

      // Orange crosshair at center - same size as normal mode
      const centerX = 100; // Center of the SVG
      const centerY = 70;  // Center of the SVG
      const col = hasClickableElement ? COLORS.FOCUS_GREEN_BRIGHT : COLORS.ORANGE; // Green if clickable, orange if not.
      // Same dimensions as normal mode: arms extend ±24 pixels from center
      addLine(centerX, centerY - 24, centerX, centerY - 10, col);
      addLine(centerX, centerY + 10, centerX, centerY + 24, col);
      addLine(centerX - 24, centerY, centerX - 10, centerY, col);
      addLine(centerX + 10, centerY, centerX + 24, centerY, col);

      // Create container to hold both SVG and background div
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.appendChild(svg);
      container.appendChild(bg);

      return container;


    } else {
      // Normal size for other modes
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
        addLine(18, 18, 76, 76, COLORS.DELETE_RED, '5');
        addLine(76, 18, 18, 76, COLORS.DELETE_RED, '5');
      } else if (mode === 'highlight') {
        // Blue selection cursor - crosshair style similar to normal mode
        const col = COLORS.HIGHLIGHT_BLUE;
        addLine(47, 10, 47, 34, col);
        addLine(47, 60, 47, 84, col);
        addLine(10, 47, 34, 47, col);
        addLine(60, 47, 84, 47, col);
      } else {
        const col = COLORS.FOCUS_GREEN_BRIGHT;
        addLine(47, 10, 47, 34, col);
        addLine(47, 60, 47, 84, col);
        addLine(10, 47, 34, 47, col);
        addLine(60, 47, 84, 47, col);
      }

      svg.setAttribute('xmlns', NS);
      return svg;
    }
  }

  hide() {
    if (this.cursorEl) {
      this.cursorEl.style.display = 'none';
    }
  }

  show() {
    if (this.cursorEl) {
      this.cursorEl.style.display = 'block';
    }
  }





  cleanup() {
    if (this.stuckCheckInterval) {
      clearInterval(this.stuckCheckInterval);
      this.stuckCheckInterval = null;
    }

    if (this.cursorEl) {
      this.cursorEl.remove();
      this.cursorEl = null;
    }
  }

  createElement(tag, props = {}, ...children) {
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
}


  // Module: src/modules/element-detector.js
/**
 * Element detection and interaction utilities
 */
class ElementDetector {
  constructor() {
    this.CLICKABLE_ROLES = ['link', 'button', 'slider'];
    this.CLICKABLE_SEL = 'a[href], button, input, select, textarea, video, audio';
    this.FOCUSABLE_SEL = 'a[href], button, input, select, textarea, video, audio, [contenteditable="true"]';
  }

  deepElementFromPoint(x, y) {
    let el = document.elementFromPoint(x, y);
    let guard = 0;
    while (el && el.shadowRoot && guard++ < 10) {
      const nested = el.shadowRoot.elementFromPoint(x, y);
      if (!nested || nested === el) break;
      el = nested;
    }
    return el;
  }

  isLikelyInteractive(el) {
    if (!el || el.nodeType !== 1) return false;
    
    const matchesSelector = el.matches(this.FOCUSABLE_SEL);
    const role = (el.getAttribute && (el.getAttribute('role') || '').trim().toLowerCase()) || '';
    const hasRole = role && this.CLICKABLE_ROLES.includes(role);
    
    // Check for other interactive indicators
    const hasClickHandler = el.onclick || el.getAttribute('onclick');
    const hasTabIndex = el.hasAttribute('tabindex') && el.getAttribute('tabindex') !== '-1';
    const hasCursor = window.getComputedStyle && window.getComputedStyle(el).cursor === 'pointer';
    
    // Debug logging
    if (window.KEYPILOT_DEBUG && (matchesSelector || hasRole || hasClickHandler || hasTabIndex || hasCursor)) {
      console.log('[KeyPilot Debug] isLikelyInteractive:', {
        tagName: el.tagName,
        href: el.href,
        matchesSelector: matchesSelector,
        role: role,
        hasRole: hasRole,
        hasClickHandler: !!hasClickHandler,
        hasTabIndex: hasTabIndex,
        hasCursor: hasCursor,
        selector: this.FOCUSABLE_SEL
      });
    }
    
    return matchesSelector || hasRole || hasClickHandler || hasTabIndex || hasCursor;
  }

  findClickable(el) {
    let n = el;
    let depth = 0;
    while (n && n !== document.body && n.nodeType === 1 && depth < 10) {
      if (this.isLikelyInteractive(n)) {
        if (window.KEYPILOT_DEBUG) {
          console.log('[KeyPilot Debug] findClickable found:', {
            tagName: n.tagName,
            href: n.href,
            className: n.className,
            depth: depth
          });
        }
        return n;
      }
      n = n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null);
      depth++;
    }
    
    const finalResult = el && this.isLikelyInteractive(el) ? el : null;
    if (window.KEYPILOT_DEBUG && !finalResult && el) {
      console.log('[KeyPilot Debug] findClickable found nothing for:', {
        tagName: el.tagName,
        href: el.href,
        className: el.className
      });
    }
    
    return finalResult;
  }

  isTextLike(el) {
    if (!el || el.nodeType !== 1) return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      const t = (el.getAttribute('type') || 'text').toLowerCase();
      return ['text', 'search', 'url', 'email', 'tel', 'password', 'number'].includes(t);
    }
    return false;
  }

  isNativeType(el, type) {
    return el && el.tagName === 'INPUT' && (el.getAttribute('type') || '').toLowerCase() === type;
  }

  isContentEditable(el) {
    if (!el || el.nodeType !== 1) return false;
    return el.isContentEditable || el.getAttribute('contenteditable') === 'true';
  }
}


  // Module: src/modules/activation-handler.js
/**
 * Smart element activation with semantic handling
 */
class ActivationHandler {
  constructor(elementDetector) {
    this.detector = elementDetector;
  }

  smartClick(el, clientX, clientY) {
    if (!el) return false;

    // First, try to find a more specific clickable parent (links, buttons)
    // Prioritize links for video/audio elements (common on video websites)
    let activator = el;
    if (el.closest) {
      let specificClickable;

      // For video/audio elements, prioritize finding parent links
      if (el.tagName === 'VIDEO' || el.tagName === 'AUDIO') {
        specificClickable = el.closest('a[href]');
        if (specificClickable) {
          console.log('[KeyPilot] Found parent link for video/audio element:', specificClickable.href);
        }
      }

      // If no specific handling above, look for any clickable parent
      if (!specificClickable) {
        specificClickable = el.closest('a[href], button, [role="button"], [onclick], [tabindex]');
      }

      if (specificClickable) {
        activator = specificClickable;
      }
    }

    // Special handling for links - force them to open in same window
    if (activator.tagName === 'A' && activator.href) {
      console.log('[KeyPilot] Activating link in same window:', activator.href);

      // Store original target and temporarily change it
      const originalTarget = activator.target;
      activator.target = '_self';

      try {
        // Try programmatic click first
        activator.click();
        return true;
      } catch (error) {
        console.log('[KeyPilot] Programmatic click failed, using navigation:', error);
        // Fallback to direct navigation
        window.location.href = activator.href;
        return true;
      } finally {
        // Restore original target
        if (originalTarget !== undefined) {
          activator.target = originalTarget;
        } else {
          activator.removeAttribute('target');
        }
      }
    }

    // Try single programmatic activation for non-links
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

    // Fallback: dispatch essential mouse events on the original element
    // This ensures we try to click whatever element the user is pointing at
    const opts = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX,
      clientY
    };

    try { el.dispatchEvent(new MouseEvent('pointerdown', opts)); } catch { }
    try { el.dispatchEvent(new MouseEvent('mousedown', opts)); } catch { }
    try { el.dispatchEvent(new MouseEvent('mouseup', opts)); } catch { }
    try { el.dispatchEvent(new MouseEvent('click', opts)); } catch { }

    // Also try on the activator if it's different
    if (activator !== el) {
      try { activator.dispatchEvent(new MouseEvent('pointerdown', opts)); } catch { }
      try { activator.dispatchEvent(new MouseEvent('mousedown', opts)); } catch { }
      try { activator.dispatchEvent(new MouseEvent('mouseup', opts)); } catch { }
      try { activator.dispatchEvent(new MouseEvent('click', opts)); } catch { }
    }

    return true;
  }



  handleSmartActivate(target, x, y) {
    if (!target) return false;

    // Handle label elements
    target = this.resolveLabel(target);

    // IMPORTANT: Check if video/audio is wrapped in a link first
    // This handles video preview thumbnails on video websites where clicking should navigate
    if ((target.tagName === 'VIDEO' || target.tagName === 'AUDIO') && target.closest) {
      const parentLink = target.closest('a[href]');
      if (parentLink) {
        // Let the link be handled by smartClick instead of controlling media playback
        console.log('[KeyPilot] Video/audio wrapped in link, deferring to link activation');
        return false;
      }
    }

    // Handle different input types semantically
    if (this.detector.isNativeType(target, 'radio')) {
      return this.handleRadio(target);
    }

    if (this.detector.isNativeType(target, 'checkbox')) {
      return this.handleCheckbox(target);
    }

    if (this.detector.isNativeType(target, 'range')) {
      return this.handleRange(target, x);
    }

    // Handle role="slider" elements
    const role = (target.getAttribute && (target.getAttribute('role') || '').trim().toLowerCase()) || '';
    if (role === 'slider') {
      return this.handleRoleSlider(target, x, y);
    }

    if (this.detector.isTextLike(target)) {
      return this.handleTextField(target);
    }

    if (this.detector.isContentEditable(target)) {
      return this.handleContentEditable(target);
    }

    // Handle video and audio elements (only if not wrapped in a link)
    if (target.tagName === 'VIDEO' || target.tagName === 'AUDIO') {
      return this.handleMediaElement(target);
    }

    return false;
  }

  resolveLabel(target) {
    if (target.tagName === 'LABEL') {
      const forId = target.getAttribute('for');
      if (forId) {
        const labelCtl = (target.getRootNode() || document).getElementById(forId);
        if (labelCtl) return labelCtl;
      } else {
        const ctl = target.querySelector('input, textarea, select');
        if (ctl) return ctl;
      }
    }
    return target;
  }

  handleRadio(target) {
    if (!target.checked) {
      target.checked = true;
      this.dispatchInputChange(target);
    }
    return true;
  }

  handleCheckbox(target) {
    target.checked = !target.checked;
    this.dispatchInputChange(target);
    return true;
  }

  handleRange(target, clientX) {
    const rect = target.getBoundingClientRect();
    const min = this.asNum(target.min, 0);
    const max = this.asNum(target.max, 100);
    const stepAttr = target.step && target.step !== 'any' ? this.asNum(target.step, 1) : 'any';

    if (rect.width <= 0) return false;
    const pct = this.clamp((clientX - rect.left) / rect.width, 0, 1);
    let val = min + pct * (max - min);

    if (stepAttr !== 'any' && Number.isFinite(stepAttr) && stepAttr > 0) {
      const steps = Math.round((val - min) / stepAttr);
      val = min + steps * stepAttr;
    }
    val = this.clamp(val, min, max);
    const before = target.value;
    target.value = String(val);
    if (target.value !== before) this.dispatchInputChange(target);
    return true;
  }

  handleRoleSlider(target, clientX, clientY) {
    // Handle ARIA slider elements with dual approach:
    // 1. Update ARIA attributes for compliant sliders
    // 2. Dispatch mouse events for custom implementations like YouTube

    // First, try ARIA attribute approach for standard sliders
    const rect = target.getBoundingClientRect();
    if (rect.width > 0) {
      const min = this.asNum(target.getAttribute('aria-valuemin'), 0);
      const max = this.asNum(target.getAttribute('aria-valuemax'), 100);
      const step = this.asNum(target.getAttribute('aria-step'), 1);

      // Calculate new value based on click position
      const pct = this.clamp((clientX - rect.left) / rect.width, 0, 1);
      let newValue = min + pct * (max - min);

      // Apply step if specified
      if (step > 0) {
        const steps = Math.round((newValue - min) / step);
        newValue = min + steps * step;
      }

      newValue = this.clamp(newValue, min, max);

      // Update aria-valuenow attribute
      const before = target.getAttribute('aria-valuenow');
      target.setAttribute('aria-valuenow', String(newValue));

      // Dispatch ARIA-compliant events if value changed
      if (String(newValue) !== before) {
        this.dispatchInputChange(target);

        // Dispatch custom slider change event
        try {
          target.dispatchEvent(new CustomEvent('sliderchange', {
            bubbles: true,
            detail: { value: newValue, previousValue: this.asNum(before, min) }
          }));
        } catch { }
      }
    }

    // Also dispatch mouse events for compatibility with custom implementations
    const opts = {
      bubbles: true,
      cancelable: true,
      composed: true,
      view: window,
      clientX,
      clientY
    };

    try { target.dispatchEvent(new MouseEvent('pointerdown', opts)); } catch { }
    try { target.dispatchEvent(new MouseEvent('mousedown', opts)); } catch { }
    try { target.dispatchEvent(new MouseEvent('mouseup', opts)); } catch { }
    try { target.dispatchEvent(new MouseEvent('click', opts)); } catch { }

    return true;
  }

  handleTextField(target) {
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

  handleContentEditable(target) {
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

  handleMediaElement(target) {
    try {
      // Toggle play/pause for video and audio elements
      if (target.paused) {
        target.play();
      } else {
        target.pause();
      }
      return true;
    } catch (error) {
      console.debug('Could not control media element:', error);
      // Fallback to regular click behavior
      return false;
    }
  }

  dispatchInputChange(el) {
    const opts = { bubbles: true, composed: true };
    el.dispatchEvent(new Event('input', opts));
    el.dispatchEvent(new Event('change', opts));
  }

  clamp(n, lo, hi) {
    return Math.min(hi, Math.max(lo, n));
  }

  asNum(v, d) {
    const n = Number(v);
    return Number.isFinite(n) ? n : d;
  }
}


  // Module: src/modules/focus-detector.js
/**
 * Text field focus detection and management
 */
class FocusDetector {
  constructor(stateManager) {
    this.state = stateManager;
    this.currentFocusedElement = null;
    this.focusCheckInterval = null;
    this.textElementObserver = null; // MutationObserver for focused text element
    this.textElementResizeObserver = null; // ResizeObserver for focused text element
  }

  start() {
    // Listen for focus/blur events
    document.addEventListener('focusin', this.handleFocusIn.bind(this), true);
    document.addEventListener('focusout', this.handleFocusOut.bind(this), true);

    // Also check periodically for programmatic focus changes (more frequent)
    this.focusCheckInterval = setInterval(() => {
      this.checkCurrentFocus();
    }, 200);

    // Initial check with delay to catch elements focused on page load
    setTimeout(() => {
      this.checkCurrentFocus();
      console.debug('Initial focus check completed');
    }, 100);

    // Also check when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.checkCurrentFocus(), 100);
      });
    }

    // Check when page is fully loaded (including images, etc.)
    window.addEventListener('load', () => {
      setTimeout(() => this.checkCurrentFocus(), 100);
    });
  }

  stop() {
    document.removeEventListener('focusin', this.handleFocusIn, true);
    document.removeEventListener('focusout', this.handleFocusOut, true);

    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }

    // Clean up observers
    this.cleanupTextElementObservers();

    // Clean up any remaining focused element reference
    if (this.currentFocusedElement) {
      this.currentFocusedElement = null;
    }
  }

  handleFocusIn(e) {
    if (this.isTextInput(e.target)) {
      console.debug('Text input focused:', e.target.tagName, e.target.type || 'N/A');
      this.setTextFocus(e.target);
    }
  }

  handleFocusOut(e) {
    if (this.isTextInput(e.target)) {
      console.debug('Text input blurred:', e.target.tagName, e.target.type || 'N/A', 'ID:', e.target.id);
      // Longer delay to allow for focus changes and prevent premature clearing during slider interaction
      setTimeout(() => {
        const currentlyFocused = this.getDeepActiveElement();
        console.debug('Focus check after blur - currently focused:', currentlyFocused?.tagName, currentlyFocused?.type, currentlyFocused?.id);
        if (!this.isTextInput(currentlyFocused)) {
          console.debug('Clearing text focus - no text input currently focused');
          this.clearTextFocus();
        } else {
          console.debug('Keeping text focus - text input still focused');
        }
      }, 100); // Increased delay to handle slider interactions
    }
  }

  checkCurrentFocus() {
    const activeElement = this.getDeepActiveElement();

    if (this.isTextInput(activeElement)) {
      if (this.currentFocusedElement !== activeElement) {
        console.debug('Text focus detected during check:', activeElement.tagName, activeElement.type || 'N/A', 'ID:', activeElement.id || 'none');
        this.setTextFocus(activeElement);
      }
    } else if (this.currentFocusedElement) {
      console.debug('Text focus cleared during check');
      this.clearTextFocus();
    }
  }

  getDeepActiveElement() {
    let activeElement = document.activeElement;

    // Traverse shadow DOM if needed
    while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
      activeElement = activeElement.shadowRoot.activeElement;
    }

    return activeElement;
  }

  isTextInput(element) {
    if (!element || element.nodeType !== 1) return false;

    // Check if it matches our text input selectors
    try {
      return element.matches(SELECTORS.FOCUSABLE_TEXT);
    } catch {
      return false;
    }
  }

  setTextFocus(element) {
    // Update current focused element reference
    this.currentFocusedElement = element;

    // Set up observers for the focused text element
    this.setupTextElementObservers(element);

    // Set mode and focused element in a single state update to ensure proper cursor initialization
    this.state.setState({
      mode: 'text_focus',
      focusedTextElement: element,
      focusEl: null // Clear to ensure hasClickableElement starts as false
    });
  }

  clearTextFocus() {
    // Clean up observers
    this.cleanupTextElementObservers();

    // Clear focused element reference
    this.currentFocusedElement = null;
    this.state.setState({
      mode: 'none',
      focusedTextElement: null
    });
  }

  isInTextFocus() {
    return this.state.getState().mode === 'text_focus';
  }

  getFocusedElement() {
    return this.currentFocusedElement;
  }

  setupTextElementObservers(element) {
    if (!element) return;

    // Clean up any existing observers first
    this.cleanupTextElementObservers();

    // Store initial position for comparison
    this.lastKnownRect = element.getBoundingClientRect();

    // 1. ResizeObserver for size changes
    if (window.ResizeObserver) {
      this.textElementResizeObserver = new ResizeObserver((entries) => {
        // Debounce resize updates
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          this.triggerOverlayUpdate();
          this.resizeTimeout = null;
        }, 16); // ~60fps
      });

      // Observe the text element itself
      this.textElementResizeObserver.observe(element);
      console.debug('ResizeObserver set up for text element');
    }

    // 2. Input event listener for content changes that affect size
    this.inputEventHandler = () => {
      // Debounce input updates
      if (this.inputTimeout) {
        clearTimeout(this.inputTimeout);
      }
      this.inputTimeout = setTimeout(() => {
        console.debug('Input event detected - triggering overlay update');
        this.triggerOverlayUpdate();
        this.inputTimeout = null;
      }, 16);
    };

    element.addEventListener('input', this.inputEventHandler);
    console.debug('Input event listener set up for text element');

    // 3. MutationObserver for attribute and DOM changes
    if (window.MutationObserver) {
      this.textElementObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        mutations.forEach((mutation) => {
          // Watch for style and class changes that affect position/size
          if (mutation.type === 'attributes') {
            const attrName = mutation.attributeName;
            if (attrName === 'style' || attrName === 'class') {
              console.debug('MutationObserver detected attribute change:', attrName, mutation.target.tagName);
              shouldUpdate = true;
            }
            // Also watch for size-related attributes
            if (['rows', 'cols', 'width', 'height'].includes(attrName)) {
              console.debug('MutationObserver detected size attribute change:', attrName);
              shouldUpdate = true;
            }
          }

          // DOM structure changes
          if (mutation.type === 'childList') {
            console.debug('MutationObserver detected DOM structure change');
            shouldUpdate = true;
          }

          // Content changes
          if (mutation.type === 'characterData') {
            console.debug('MutationObserver detected content change');
            shouldUpdate = true;
          }
        });

        if (shouldUpdate) {
          // Debounce mutation updates
          if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
          }
          this.mutationTimeout = setTimeout(() => {
            this.triggerOverlayUpdate();
            this.mutationTimeout = null;
          }, 16);
        }
      });

      // Observe the element itself with comprehensive options
      this.textElementObserver.observe(element, {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        childList: true,
        subtree: true
      });

      // Observe parent elements for layout changes
      let parent = element.parentElement;
      let observedParents = 0;
      while (parent && observedParents < 2) {
        this.textElementObserver.observe(parent, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true
        });
        parent = parent.parentElement;
        observedParents++;
      }

      console.debug('MutationObserver set up for element and', observedParents, 'parents');
    }

    // 4. Position polling as reliable fallback for position changes
    this.setupPositionPolling(element);
  }

  setupPositionPolling(element) {
    // Fast polling to catch position changes that observers miss
    this.positionPollInterval = setInterval(() => {
      if (this.currentFocusedElement && this.state.getState().mode === 'text_focus') {
        const currentRect = this.currentFocusedElement.getBoundingClientRect();

        // Check if position OR size changed (comprehensive tracking)
        if (this.lastKnownRect.left !== currentRect.left ||
          this.lastKnownRect.top !== currentRect.top ||
          this.lastKnownRect.width !== currentRect.width ||
          this.lastKnownRect.height !== currentRect.height) {

          console.debug('Position polling detected element change:', {
            oldRect: {
              left: this.lastKnownRect.left,
              top: this.lastKnownRect.top,
              width: this.lastKnownRect.width,
              height: this.lastKnownRect.height
            },
            newRect: {
              left: currentRect.left,
              top: currentRect.top,
              width: currentRect.width,
              height: currentRect.height
            }
          });

          this.lastKnownRect = currentRect;
          this.triggerOverlayUpdate();
        }
      }
    }, 16); // 16ms = ~60fps for smooth tracking

    console.debug('Position polling started (16ms interval for 60fps)');
  }

  cleanupTextElementObservers() {
    if (this.textElementObserver) {
      this.textElementObserver.disconnect();
      this.textElementObserver = null;
    }

    if (this.textElementResizeObserver) {
      this.textElementResizeObserver.disconnect();
      this.textElementResizeObserver = null;
    }

    if (this.inputEventHandler && this.currentFocusedElement) {
      this.currentFocusedElement.removeEventListener('input', this.inputEventHandler);
      this.inputEventHandler = null;
    }

    if (this.positionPollInterval) {
      clearInterval(this.positionPollInterval);
      this.positionPollInterval = null;
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    if (this.mutationTimeout) {
      clearTimeout(this.mutationTimeout);
      this.mutationTimeout = null;
    }

    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }

    console.debug('Text element observers cleaned up');
  }

  triggerOverlayUpdate() {
    // Trigger a state update to refresh overlays with current element position
    if (this.currentFocusedElement && this.state.getState().mode === 'text_focus') {
      // Force overlay update by triggering a state change
      this.state.setState({
        mode: 'text_focus',
        focusedTextElement: this.currentFocusedElement,
        _overlayUpdateTrigger: Date.now() // Unique value to force update
      });

      console.debug('Triggered overlay update for text element position/size change');
    }
  }
}


  // Module: src/modules/overlay-manager.js
/**
 * Visual overlay management for focus and delete indicators
 */
class OverlayManager {
  constructor() {
    this.focusOverlay = null;
    this.deleteOverlay = null;
    this.highlightOverlay = null; // Overlay for highlight mode
    this.highlightRectangleOverlay = null; // Real-time highlight rectangle overlay
    this.highlightSelectionOverlays = []; // Array of overlays for selected text regions
    this.highlightModeIndicator = null; // Visual indicator for highlight mode
    this.focusedTextOverlay = null; // New overlay for focused text fields
    this.viewportModalFrame = null; // Viewport modal frame for text focus mode
    this.activeTextInputFrame = null; // Pulsing frame for active text inputs
    this.escExitLabel = null; // ESC exit instruction label
    
    // Intersection observer for overlay visibility optimization
    this.overlayObserver = null;
    this.resizeObserver = null; // ResizeObserver for viewport modal frame
    
    // Track overlay visibility state
    this.overlayVisibility = {
      focus: true,
      delete: true,
      highlight: true,
      highlightRectangle: true,
      focusedText: true,
      activeTextInput: true,
      escExitLabel: true
    };
    
    this.setupOverlayObserver();
  }

  setupOverlayObserver() {
    // Observer to optimize overlay rendering when out of view
    this.overlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const overlay = entry.target;
          const isVisible = entry.intersectionRatio > 0;
          
          // Optimize rendering by hiding completely out-of-view overlays
          if (overlay === this.focusOverlay) {
            this.overlayVisibility.focus = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.deleteOverlay) {
            this.overlayVisibility.delete = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.highlightOverlay) {
            this.overlayVisibility.highlight = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.highlightRectangleOverlay) {
            this.overlayVisibility.highlightRectangle = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.focusedTextOverlay) {
            this.overlayVisibility.focusedText = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.activeTextInputFrame) {
            this.overlayVisibility.activeTextInput = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.escExitLabel) {
            this.overlayVisibility.escExitLabel = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          }
        });
      },
      {
        rootMargin: '10px',
        threshold: [0, 1.0]
      }
    );
  }

  updateOverlays(focusEl, deleteEl, mode, focusedTextElement = null) {
    // Debug logging when debug mode is enabled
    if (window.KEYPILOT_DEBUG && focusEl) {
      console.log('[KeyPilot Debug] Updating overlays:', {
        focusElement: focusEl.tagName,
        mode: mode,
        willShowFocus: mode === 'none' || mode === 'text_focus' || mode === 'highlight',
        focusedTextElement: focusedTextElement?.tagName
      });
    }
    
    // Show focus overlay in normal mode, text focus mode, AND highlight mode
    if (mode === 'none' || mode === 'text_focus' || mode === 'highlight') {
      this.updateFocusOverlay(focusEl, mode);
    } else {
      this.hideFocusOverlay();
    }
    
    // Show focused text overlay when in text focus mode
    if (mode === 'text_focus' && focusedTextElement) {
      this.updateFocusedTextOverlay(focusedTextElement);
      this.updateActiveTextInputFrame(focusedTextElement);
      this.updateEscExitLabel(focusedTextElement);
    } else {
      this.hideFocusedTextOverlay();
      this.hideActiveTextInputFrame();
      this.hideEscExitLabel();
    }
    
    // Show viewport modal frame when in text focus mode
    this.updateViewportModalFrame(mode === 'text_focus');
    
    // Only show delete overlay in delete mode
    if (mode === 'delete') {
      this.updateDeleteOverlay(deleteEl);
    } else {
      this.hideDeleteOverlay();
    }
    
    // Show highlight overlay in highlight mode
    if (mode === 'highlight') {
      this.updateHighlightOverlay(focusEl);
      this.showHighlightModeIndicator();
    } else {
      this.hideHighlightOverlay();
      this.hideHighlightModeIndicator();
      this.hideHighlightRectangleOverlay();
    }
  }

  updateFocusOverlay(element, mode = MODES.NONE) {
    if (!element) {
      this.hideFocusOverlay();
      return;
    }

    // Determine if this is a text input element
    const isTextInput = element.matches && element.matches(SELECTORS.FOCUSABLE_TEXT);
    
    // Determine overlay color based on element type
    let borderColor, shadowColor;
    if (isTextInput) {
      // Orange color for text inputs in both normal mode and text focus mode
      borderColor = COLORS.ORANGE;
      shadowColor = COLORS.ORANGE_SHADOW;
    } else {
      // Green color for all non-text elements
      borderColor = COLORS.FOCUS_GREEN;
      shadowColor = COLORS.GREEN_SHADOW;
    }

    // Debug logging
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateFocusOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        text: element.textContent?.substring(0, 30),
        mode: mode,
        isTextInput: isTextInput,
        borderColor: borderColor
      });
    }

    if (!this.focusOverlay) {
      this.focusOverlay = this.createElement('div', {
        className: CSS_CLASSES.FOCUS_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.focusOverlay);
      
      // Debug logging for overlay creation
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focus overlay created and added to DOM:', {
          element: this.focusOverlay,
          className: this.focusOverlay.className,
          style: this.focusOverlay.style.cssText,
          parent: this.focusOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.focusOverlay);
      }
    }

    // Update overlay colors based on current context
    this.focusOverlay.style.border = `3px solid ${borderColor}`;
    const brightShadowColor = isTextInput ? COLORS.ORANGE_SHADOW : COLORS.GREEN_SHADOW_BRIGHT;
    this.focusOverlay.style.boxShadow = `0 0 0 2px ${shadowColor}, 0 0 10px 2px ${brightShadowColor}`;

    const rect = this.getBestRect(element);
    
    // Debug logging for positioning
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Focus overlay positioning:', {
        rect: rect,
        overlayExists: !!this.focusOverlay,
        overlayVisibility: this.overlayVisibility.focus
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Set position using left/top for now (simpler than transform)
      this.focusOverlay.style.left = `${rect.left}px`;
      this.focusOverlay.style.top = `${rect.top}px`;
      this.focusOverlay.style.width = `${rect.width}px`;
      this.focusOverlay.style.height = `${rect.height}px`;
      this.focusOverlay.style.display = 'block';
      this.focusOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focus overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focus overlay hidden - invalid rect:', rect);
      }
      this.hideFocusOverlay();
    }
  }

  hideFocusOverlay() {
    if (this.focusOverlay) {
      this.focusOverlay.style.display = 'none';
    }
  }

  updateDeleteOverlay(element) {
    if (!element) {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] updateDeleteOverlay: no element provided');
      }
      this.hideDeleteOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateDeleteOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.deleteOverlay) {
      this.deleteOverlay = this.createElement('div', {
        className: CSS_CLASSES.DELETE_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid ${COLORS.DELETE_RED};
          box-shadow: 0 0 0 2px ${COLORS.DELETE_SHADOW}, 0 0 12px 2px ${COLORS.DELETE_SHADOW_BRIGHT};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.deleteOverlay);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete overlay created and added to DOM:', {
          element: this.deleteOverlay,
          className: this.deleteOverlay.className,
          parent: this.deleteOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.deleteOverlay);
      }
    }

    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Delete overlay positioning:', {
        rect: rect,
        overlayExists: !!this.deleteOverlay,
        overlayVisibility: this.overlayVisibility.delete
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Use left/top positioning instead of transform for consistency with focus overlay
      this.deleteOverlay.style.left = `${rect.left}px`;
      this.deleteOverlay.style.top = `${rect.top}px`;
      this.deleteOverlay.style.width = `${rect.width}px`;
      this.deleteOverlay.style.height = `${rect.height}px`;
      this.deleteOverlay.style.display = 'block';
      this.deleteOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete overlay hidden - invalid rect:', rect);
      }
      this.hideDeleteOverlay();
    }
  }

  hideDeleteOverlay() {
    if (this.deleteOverlay) {
      this.deleteOverlay.style.display = 'none';
    }
  }

  updateHighlightOverlay(element) {
    if (!element) {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] updateHighlightOverlay: no element provided');
      }
      this.hideHighlightOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateHighlightOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.highlightOverlay) {
      this.highlightOverlay = this.createElement('div', {
        className: CSS_CLASSES.HIGHLIGHT_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid ${COLORS.HIGHLIGHT_BLUE};
          box-shadow: 0 0 0 2px ${COLORS.HIGHLIGHT_SHADOW}, 0 0 12px 2px ${COLORS.HIGHLIGHT_SHADOW_BRIGHT};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.highlightOverlay);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay created and added to DOM:', {
          element: this.highlightOverlay,
          className: this.highlightOverlay.className,
          parent: this.highlightOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.highlightOverlay);
      }
    }

    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Highlight overlay positioning:', {
        rect: rect,
        overlayExists: !!this.highlightOverlay,
        overlayVisibility: this.overlayVisibility.highlight
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Use left/top positioning instead of transform for consistency with other overlays
      this.highlightOverlay.style.left = `${rect.left}px`;
      this.highlightOverlay.style.top = `${rect.top}px`;
      this.highlightOverlay.style.width = `${rect.width}px`;
      this.highlightOverlay.style.height = `${rect.height}px`;
      this.highlightOverlay.style.display = 'block';
      this.highlightOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay hidden - invalid rect:', rect);
      }
      this.hideHighlightOverlay();
    }
  }

  hideHighlightOverlay() {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';
    }
  }

  /**
   * Update the highlight rectangle overlay showing the selection area
   * @param {Object} startPosition - Starting position {x, y}
   * @param {Object} currentPosition - Current cursor position {x, y}
   */
  updateHighlightRectangleOverlay(startPosition, currentPosition) {
    if (!startPosition || !currentPosition) {
      this.hideHighlightRectangleOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateHighlightRectangleOverlay called:', {
        startPosition,
        currentPosition
      });
    }

    if (!this.highlightRectangleOverlay) {
      this.highlightRectangleOverlay = this.createElement('div', {
        className: 'kpv2-highlight-rectangle-overlay',
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS - 2};
          background: ${COLORS.HIGHLIGHT_SELECTION_BG};
          border: 2px dashed ${COLORS.HIGHLIGHT_BLUE};
          box-shadow: 0 0 0 1px ${COLORS.HIGHLIGHT_SHADOW}, 0 0 8px 1px ${COLORS.HIGHLIGHT_SHADOW_BRIGHT};
          will-change: transform;
          opacity: 0.8;
        `
      });
      document.body.appendChild(this.highlightRectangleOverlay);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay created and added to DOM:', {
          element: this.highlightRectangleOverlay,
          className: this.highlightRectangleOverlay.className,
          parent: this.highlightRectangleOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.highlightRectangleOverlay);
      }
    }

    // Calculate rectangle dimensions
    const left = Math.min(startPosition.x, currentPosition.x);
    const top = Math.min(startPosition.y, currentPosition.y);
    const width = Math.abs(currentPosition.x - startPosition.x);
    const height = Math.abs(currentPosition.y - startPosition.y);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Highlight rectangle overlay positioning:', {
        left, top, width, height,
        startPosition, currentPosition
      });
    }
    
    // Only show if rectangle has meaningful size
    if (width > 5 && height > 5) {
      this.highlightRectangleOverlay.style.left = `${left}px`;
      this.highlightRectangleOverlay.style.top = `${top}px`;
      this.highlightRectangleOverlay.style.width = `${width}px`;
      this.highlightRectangleOverlay.style.height = `${height}px`;
      this.highlightRectangleOverlay.style.display = 'block';
      this.highlightRectangleOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay positioned at:', {
          left, top, width, height
        });
      }
    } else {
      // Hide if rectangle is too small
      this.highlightRectangleOverlay.style.display = 'none';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay hidden - too small:', { width, height });
      }
    }
  }

  /**
   * Hide the highlight rectangle overlay
   */
  hideHighlightRectangleOverlay() {
    if (this.highlightRectangleOverlay) {
      this.highlightRectangleOverlay.style.display = 'none';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay hidden');
      }
    }
  }

  /**
   * Update selection overlays to highlight the actual selected text regions with shadow DOM support
   * @param {Selection} selection - Browser Selection object
   */
  updateHighlightSelectionOverlays(selection) {
    // Clear existing selection overlays
    this.clearHighlightSelectionOverlays();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    try {
      // Create overlays for each range in the selection
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        this.createSelectionOverlaysForRangeWithShadowSupport(range);
      }

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Updated highlight selection overlays with shadow DOM support:', {
          rangeCount: selection.rangeCount,
          overlayCount: this.highlightSelectionOverlays.length,
          selectedText: selection.toString().substring(0, 50)
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error updating highlight selection overlays with shadow DOM support:', error);
      this.clearHighlightSelectionOverlays();
    }
  }

  /**
   * Create selection overlays for a specific range with shadow DOM support
   * @param {Range} range - DOM Range object
   */
  createSelectionOverlaysForRangeWithShadowSupport(range) {
    if (!range || range.collapsed) {
      return;
    }

    try {
      // Get all rectangles for the range (handles multi-line selections)
      const rects = this.getClientRectsWithShadowSupport(range);
      
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        
        // Skip zero-width or zero-height rectangles
        if (rect.width <= 0 || rect.height <= 0) {
          continue;
        }

        // Create overlay element for this rectangle
        const overlay = this.createElement('div', {
          className: CSS_CLASSES.HIGHLIGHT_SELECTION,
          style: `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: ${COLORS.HIGHLIGHT_SELECTION_BG};
            border: 1px solid ${COLORS.HIGHLIGHT_SELECTION_BORDER};
            pointer-events: none;
            z-index: ${Z_INDEX.OVERLAYS - 1};
            will-change: transform;
          `
        });

        // Append to main document body (overlays should always be in main document)
        document.body.appendChild(overlay);
        this.highlightSelectionOverlays.push(overlay);

        // Start observing the overlay for visibility optimization
        if (this.overlayObserver) {
          this.overlayObserver.observe(overlay);
        }
      }

      if (window.KEYPILOT_DEBUG && rects.length > 0) {
        console.log('[KeyPilot Debug] Created selection overlays for range with shadow DOM support:', {
          rectCount: rects.length,
          firstRect: {
            left: rects[0].left,
            top: rects[0].top,
            width: rects[0].width,
            height: rects[0].height
          }
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error creating selection overlays for range with shadow DOM support:', error);
    }
  }

  /**
   * Get client rectangles for a range with shadow DOM support
   * @param {Range} range - DOM Range object
   * @returns {DOMRectList|Array} - Client rectangles
   */
  getClientRectsWithShadowSupport(range) {
    try {
      // First try the standard method
      const rects = range.getClientRects();
      if (rects && rects.length > 0) {
        return rects;
      }

      // If no rectangles found, try alternative methods for shadow DOM
      return this.getAlternativeClientRects(range);
    } catch (error) {
      console.warn('[KeyPilot] Error getting client rects with shadow DOM support:', error);
      return [];
    }
  }

  /**
   * Get alternative client rectangles for shadow DOM ranges
   * @param {Range} range - DOM Range object
   * @returns {Array} - Array of rectangle objects
   */
  getAlternativeClientRects(range) {
    try {
      const rects = [];
      
      // Try to get bounding rect as fallback
      const boundingRect = range.getBoundingClientRect();
      if (boundingRect && boundingRect.width > 0 && boundingRect.height > 0) {
        rects.push(boundingRect);
      }
      
      // For shadow DOM, we might need to manually calculate rectangles
      // by walking through the range contents
      if (rects.length === 0) {
        const shadowRects = this.calculateShadowDOMRects(range);
        rects.push(...shadowRects);
      }
      
      return rects;
    } catch (error) {
      console.warn('[KeyPilot] Error getting alternative client rects:', error);
      return [];
    }
  }

  /**
   * Calculate rectangles for shadow DOM ranges manually
   * @param {Range} range - DOM Range object
   * @returns {Array} - Array of rectangle objects
   */
  calculateShadowDOMRects(range) {
    try {
      const rects = [];
      
      // Get start and end containers
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
        // Single text node selection
        const textRect = this.getTextNodeRect(startContainer, range.startOffset, range.endOffset);
        if (textRect) {
          rects.push(textRect);
        }
      } else {
        // Multi-node selection - this is more complex for shadow DOM
        // For now, use bounding rect as approximation
        try {
          const boundingRect = range.getBoundingClientRect();
          if (boundingRect && boundingRect.width > 0 && boundingRect.height > 0) {
            rects.push(boundingRect);
          }
        } catch (error) {
          // Ignore errors in complex shadow DOM scenarios
        }
      }
      
      return rects;
    } catch (error) {
      console.warn('[KeyPilot] Error calculating shadow DOM rects:', error);
      return [];
    }
  }

  /**
   * Get rectangle for a portion of a text node
   * @param {Text} textNode - Text node
   * @param {number} startOffset - Start character offset
   * @param {number} endOffset - End character offset
   * @returns {DOMRect|null} - Rectangle or null
   */
  getTextNodeRect(textNode, startOffset, endOffset) {
    try {
      const ownerDocument = textNode.ownerDocument || document;
      const tempRange = ownerDocument.createRange();
      tempRange.setStart(textNode, startOffset);
      tempRange.setEnd(textNode, endOffset);
      
      const rect = tempRange.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? rect : null;
    } catch (error) {
      console.warn('[KeyPilot] Error getting text node rect:', error);
      return null;
    }
  }

  /**
   * Create selection overlays for a specific range (legacy method for compatibility)
   * @param {Range} range - DOM Range object
   */
  createSelectionOverlaysForRange(range) {
    // Delegate to the shadow DOM-aware method
    this.createSelectionOverlaysForRangeWithShadowSupport(range);
  }

  /**
   * Clear all highlight selection overlays
   */
  clearHighlightSelectionOverlays() {
    this.highlightSelectionOverlays.forEach(overlay => {
      if (this.overlayObserver) {
        this.overlayObserver.unobserve(overlay);
      }
      if (overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    });
    this.highlightSelectionOverlays = [];

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Cleared all highlight selection overlays');
    }
  }

  /**
   * Show highlight mode indicator
   */
  showHighlightModeIndicator() {
    if (this.highlightModeIndicator) {
      return; // Already showing
    }

    this.highlightModeIndicator = this.createElement('div', {
      className: 'kpv2-highlight-mode-indicator',
      style: `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${COLORS.HIGHLIGHT_BLUE};
        color: white;
        padding: 8px 12px;
        font-size: 14px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-radius: 4px;
        box-shadow: 0 2px 8px ${COLORS.HIGHLIGHT_SHADOW};
        z-index: ${Z_INDEX.MESSAGE_BOX};
        pointer-events: none;
        will-change: transform, opacity;
        animation: kpv2-pulse 1.5s ease-in-out infinite;
      `
    });
    
    this.highlightModeIndicator.textContent = 'HIGHLIGHT MODE - Press H to copy';
    document.body.appendChild(this.highlightModeIndicator);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Highlight mode indicator shown');
    }
  }

  /**
   * Hide highlight mode indicator
   */
  hideHighlightModeIndicator() {
    if (this.highlightModeIndicator) {
      this.highlightModeIndicator.remove();
      this.highlightModeIndicator = null;

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight mode indicator hidden');
      }
    }
  }

  updateFocusedTextOverlay(element) {
    if (!element) {
      this.hideFocusedTextOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateFocusedTextOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.focusedTextOverlay) {
      this.focusedTextOverlay = this.createElement('div', {
        className: 'kpv2-focused-text-overlay',
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS - 1};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.focusedTextOverlay);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focused text overlay created and added to DOM:', {
          element: this.focusedTextOverlay,
          className: this.focusedTextOverlay.className,
          parent: this.focusedTextOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.focusedTextOverlay);
      }
    }

    // Darkened orange color for focused text fields
    const borderColor = COLORS.ORANGE_SHADOW_DARK; // Slightly more opaque
    const shadowColor = COLORS.ORANGE_SHADOW_LIGHT; // Darker shadow
    
    this.focusedTextOverlay.style.border = `3px solid ${borderColor}`;
    this.focusedTextOverlay.style.boxShadow = `0 0 0 2px ${shadowColor}, 0 0 10px 2px ${COLORS.ORANGE_BORDER}`;

    // Always get fresh rect to handle dynamic position/size changes
    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Focused text overlay positioning:', {
        rect: rect,
        overlayExists: !!this.focusedTextOverlay,
        overlayVisibility: this.overlayVisibility.focusedText,
        timestamp: Date.now()
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Position the overlay with fresh coordinates
      this.focusedTextOverlay.style.left = `${rect.left}px`;
      this.focusedTextOverlay.style.top = `${rect.top}px`;
      this.focusedTextOverlay.style.width = `${rect.width}px`;
      this.focusedTextOverlay.style.height = `${rect.height}px`;
      this.focusedTextOverlay.style.display = 'block';
      this.focusedTextOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focused text overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          timestamp: Date.now()
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focused text overlay hidden - invalid rect:', rect);
      }
      this.hideFocusedTextOverlay();
    }
  }

  hideFocusedTextOverlay() {
    if (this.focusedTextOverlay) {
      this.focusedTextOverlay.style.display = 'none';
    }
  }

  updateActiveTextInputFrame(element) {
    if (!element) {
      this.hideActiveTextInputFrame();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateActiveTextInputFrame called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.activeTextInputFrame) {
      this.activeTextInputFrame = this.createElement('div', {
        className: CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS + 1};
          background: transparent;
          will-change: transform, opacity;
        `
      });
      document.body.appendChild(this.activeTextInputFrame);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Active text input frame created and added to DOM:', {
          element: this.activeTextInputFrame,
          className: this.activeTextInputFrame.className,
          parent: this.activeTextInputFrame.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.activeTextInputFrame);
      }
    }

    // Always get fresh rect to handle dynamic position/size changes
    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Active text input frame positioning:', {
        rect: rect,
        overlayExists: !!this.activeTextInputFrame,
        overlayVisibility: this.overlayVisibility.activeTextInput,
        timestamp: Date.now()
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Position the pulsing frame with fresh coordinates
      this.activeTextInputFrame.style.left = `${rect.left}px`;
      this.activeTextInputFrame.style.top = `${rect.top}px`;
      this.activeTextInputFrame.style.width = `${rect.width}px`;
      this.activeTextInputFrame.style.height = `${rect.height}px`;
      this.activeTextInputFrame.style.display = 'block';
      this.activeTextInputFrame.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Active text input frame positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          timestamp: Date.now()
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Active text input frame hidden - invalid rect:', rect);
      }
      this.hideActiveTextInputFrame();
    }
  }

  hideActiveTextInputFrame() {
    if (this.activeTextInputFrame) {
      this.activeTextInputFrame.style.display = 'none';
    }
  }

  updateEscExitLabel(element) {
    if (!element) {
      this.hideEscExitLabel();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateEscExitLabel called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.escExitLabel) {
      this.escExitLabel = this.createElement('div', {
        className: CSS_CLASSES.ESC_EXIT_LABEL,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS + 1};
          will-change: transform, opacity;
        `
      });
      this.escExitLabel.textContent = 'Press ESC to exit';
      document.body.appendChild(this.escExitLabel);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] ESC exit label created and added to DOM:', {
          element: this.escExitLabel,
          className: this.escExitLabel.className,
          parent: this.escExitLabel.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.escExitLabel);
      }
    }

    // Always get fresh rect to handle dynamic position/size changes
    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] ESC exit label positioning:', {
        rect: rect,
        overlayExists: !!this.escExitLabel,
        overlayVisibility: this.overlayVisibility.escExitLabel,
        timestamp: Date.now()
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Position the label at the bottom of the text field
      const labelLeft = rect.left;
      const labelTop = rect.top + rect.height + 8; // 8px gap below the text field
      
      this.escExitLabel.style.left = `${labelLeft}px`;
      this.escExitLabel.style.top = `${labelTop}px`;
      this.escExitLabel.style.display = 'block';
      this.escExitLabel.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] ESC exit label positioned at:', {
          left: labelLeft,
          top: labelTop,
          elementBottom: rect.top + rect.height,
          timestamp: Date.now()
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] ESC exit label hidden - invalid rect:', rect);
      }
      this.hideEscExitLabel();
    }
  }

  hideEscExitLabel() {
    if (this.escExitLabel) {
      this.escExitLabel.style.display = 'none';
    }
  }

  updateElementClasses(focusEl, deleteEl, prevFocusEl, prevDeleteEl) {
    // Remove previous classes
    if (prevFocusEl && prevFocusEl !== focusEl) {
      prevFocusEl.classList.remove(CSS_CLASSES.FOCUS);
    }
    if (prevDeleteEl && prevDeleteEl !== deleteEl) {
      prevDeleteEl.classList.remove(CSS_CLASSES.DELETE);
    }

    // Add new classes
    if (focusEl) {
      focusEl.classList.add(CSS_CLASSES.FOCUS);
    }
    if (deleteEl) {
      deleteEl.classList.add(CSS_CLASSES.DELETE);
    }
  }

  getBestRect(element) {
    if (!element) return { left: 0, top: 0, width: 0, height: 0 };
    
    let rect = element.getBoundingClientRect();
    
    // Debug logging
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] getBestRect for element:', {
        tagName: element.tagName,
        originalRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        }
      });
    }
    
    // If the element has no height (common with links containing other elements),
    // try to find a child element with height
    if (rect.height === 0 && element.children.length > 0) {
      for (const child of element.children) {
        const childRect = child.getBoundingClientRect();
        if (childRect.height > 0) {
          // Use the child's rect but keep the parent's left position if it's a link
          if (element.tagName.toLowerCase() === 'a') {
            const finalRect = {
              left: Math.min(rect.left, childRect.left),
              top: childRect.top,
              width: Math.max(rect.width, childRect.width),
              height: childRect.height
            };
            if (window.KEYPILOT_DEBUG) {
              console.log('[KeyPilot Debug] Using child rect for link:', finalRect);
            }
            return finalRect;
          }
          if (window.KEYPILOT_DEBUG) {
            console.log('[KeyPilot Debug] Using child rect:', childRect);
          }
          return childRect;
        }
      }
    }
    
    // If still no height, try to get text content dimensions
    if (rect.height === 0 && element.textContent && element.textContent.trim()) {
      // For text-only elements, use a minimum height
      const finalRect = {
        left: rect.left,
        top: rect.top,
        width: Math.max(rect.width, 20), // Minimum width
        height: Math.max(rect.height, 20) // Minimum height
      };
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Using minimum dimensions:', finalRect);
      }
      return finalRect;
    }
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Using original rect:', rect);
    }
    return rect;
  }

  flashFocusOverlay() {
    if (!this.focusOverlay || this.focusOverlay.style.display === 'none') {
      return; // No overlay to flash
    }
    
    // Create flash animation by temporarily changing the overlay style
    const originalBorder = this.focusOverlay.style.border;
    const originalBoxShadow = this.focusOverlay.style.boxShadow;
    
    // Flash with brighter colors
    this.focusOverlay.style.border = `3px solid ${COLORS.FLASH_GREEN}`;
    this.focusOverlay.style.boxShadow = `0 0 0 2px ${COLORS.FLASH_GREEN_SHADOW}, 0 0 20px 4px ${COLORS.FLASH_GREEN_GLOW}`;
    this.focusOverlay.style.transition = 'border 0.15s ease-out, box-shadow 0.15s ease-out';
    
    // Reset after animation
    setTimeout(() => {
      if (this.focusOverlay) {
        this.focusOverlay.style.border = originalBorder;
        this.focusOverlay.style.boxShadow = originalBoxShadow;
        
        // Remove transition after reset to avoid interfering with normal updates
        setTimeout(() => {
          if (this.focusOverlay) {
            this.focusOverlay.style.transition = '';
          }
        }, 150);
      }
    }, 150);
  }

  createViewportModalFrame() {
    if (this.viewportModalFrame) {
      return this.viewportModalFrame;
    }

    this.viewportModalFrame = this.createElement('div', {
      className: CSS_CLASSES.VIEWPORT_MODAL_FRAME,
      style: `
        display: none;
      `
    });

    document.body.appendChild(this.viewportModalFrame);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame created and added to DOM:', {
        element: this.viewportModalFrame,
        className: this.viewportModalFrame.className,
        parent: this.viewportModalFrame.parentElement?.tagName
      });
    }

    return this.viewportModalFrame;
  }

  showViewportModalFrame() {
    if (!this.viewportModalFrame) {
      this.createViewportModalFrame();
    }

    this.viewportModalFrame.style.display = 'block';

    // Set up ResizeObserver to handle viewport changes with enhanced monitoring
    if (!this.resizeObserver && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        // Debounce resize updates to avoid excessive calls during continuous resizing
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          this.updateViewportModalFrameSize();
          this.resizeTimeout = null;
        }, 16); // ~60fps for smooth updates
      });
      
      // Observe both document element and body for comprehensive viewport tracking
      this.resizeObserver.observe(document.documentElement);
      if (document.body) {
        this.resizeObserver.observe(document.body);
      }
    }

    // Enhanced fallback to window resize events if ResizeObserver is not available
    if (!window.ResizeObserver) {
      this.windowResizeHandler = this.debounce(() => {
        this.updateViewportModalFrameSize();
      }, 16);
      window.addEventListener('resize', this.windowResizeHandler);
      window.addEventListener('orientationchange', this.windowResizeHandler);
    }

    // Listen for fullscreen changes
    this.fullscreenHandler = () => {
      // Small delay to allow fullscreen transition to complete
      setTimeout(() => {
        this.updateViewportModalFrameSize();
      }, 100);
    };
    document.addEventListener('fullscreenchange', this.fullscreenHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenHandler);
    document.addEventListener('mozfullscreenchange', this.fullscreenHandler);
    document.addEventListener('MSFullscreenChange', this.fullscreenHandler);

    // Listen for zoom changes (via visual viewport API if available)
    if (window.visualViewport) {
      this.visualViewportHandler = () => {
        this.updateViewportModalFrameSize();
      };
      window.visualViewport.addEventListener('resize', this.visualViewportHandler);
    }

    // Initial size update
    this.updateViewportModalFrameSize();

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame shown with enhanced resize handling');
    }
  }

  hideViewportModalFrame() {
    if (this.viewportModalFrame) {
      this.viewportModalFrame.style.display = 'none';
    }

    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Remove window resize listener fallback
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      window.removeEventListener('orientationchange', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }

    // Remove fullscreen change listeners
    if (this.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenHandler);
      this.fullscreenHandler = null;
    }

    // Remove visual viewport listener
    if (this.visualViewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler);
      this.visualViewportHandler = null;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame hidden and all listeners cleaned up');
    }
  }

  updateViewportModalFrame(show) {
    if (show) {
      this.showViewportModalFrame();
    } else {
      this.hideViewportModalFrame();
    }
  }

  updateViewportModalFrameSize() {
    if (!this.viewportModalFrame || this.viewportModalFrame.style.display === 'none') {
      return;
    }

    // Get current viewport dimensions with fallbacks
    let viewportWidth, viewportHeight;

    // Use visual viewport API if available (handles zoom and mobile keyboards)
    if (window.visualViewport) {
      viewportWidth = window.visualViewport.width;
      viewportHeight = window.visualViewport.height;
    } else {
      // Fallback to standard viewport dimensions
      viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    }

    // Handle fullscreen mode detection
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    // Adjust for developer tools if not in fullscreen
    if (!isFullscreen) {
      // Check if developer tools might be open by comparing window dimensions
      const windowWidth = window.outerWidth;
      const windowHeight = window.outerHeight;
      
      // If there's a significant difference, dev tools might be open
      const widthDiff = Math.abs(windowWidth - viewportWidth);
      const heightDiff = Math.abs(windowHeight - viewportHeight);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Viewport size analysis:', {
          viewportWidth,
          viewportHeight,
          windowWidth,
          windowHeight,
          widthDiff,
          heightDiff,
          isFullscreen,
          visualViewportAvailable: !!window.visualViewport
        });
      }
    }

    // Update frame dimensions using calculated viewport size
    this.viewportModalFrame.style.width = `${viewportWidth}px`;
    this.viewportModalFrame.style.height = `${viewportHeight}px`;

    // Ensure frame stays positioned at viewport origin
    this.viewportModalFrame.style.left = '0px';
    this.viewportModalFrame.style.top = '0px';

    // Handle zoom level changes by ensuring the frame covers the visible area
    if (window.visualViewport) {
      // Adjust position for visual viewport offset (mobile keyboards, etc.)
      this.viewportModalFrame.style.left = `${window.visualViewport.offsetLeft}px`;
      this.viewportModalFrame.style.top = `${window.visualViewport.offsetTop}px`;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame size updated:', {
        width: `${viewportWidth}px`,
        height: `${viewportHeight}px`,
        left: this.viewportModalFrame.style.left,
        top: this.viewportModalFrame.style.top,
        isFullscreen,
        zoomLevel: window.devicePixelRatio || 1
      });
    }
  }

  cleanup() {
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Clean up window resize handlers
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      window.removeEventListener('orientationchange', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }

    // Clean up fullscreen handlers
    if (this.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenHandler);
      this.fullscreenHandler = null;
    }

    // Clean up visual viewport handler
    if (this.visualViewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler);
      this.visualViewportHandler = null;
    }
    
    if (this.focusOverlay) {
      this.focusOverlay.remove();
      this.focusOverlay = null;
    }
    if (this.deleteOverlay) {
      this.deleteOverlay.remove();
      this.deleteOverlay = null;
    }
    if (this.highlightOverlay) {
      this.highlightOverlay.remove();
      this.highlightOverlay = null;
    }
    if (this.highlightRectangleOverlay) {
      this.highlightRectangleOverlay.remove();
      this.highlightRectangleOverlay = null;
    }
    // Clear highlight selection overlays
    this.clearHighlightSelectionOverlays();
    if (this.highlightModeIndicator) {
      this.highlightModeIndicator.remove();
      this.highlightModeIndicator = null;
    }
    if (this.focusedTextOverlay) {
      this.focusedTextOverlay.remove();
      this.focusedTextOverlay = null;
    }
    if (this.viewportModalFrame) {
      this.viewportModalFrame.remove();
      this.viewportModalFrame = null;
    }
    if (this.activeTextInputFrame) {
      this.activeTextInputFrame.remove();
      this.activeTextInputFrame = null;
    }
    if (this.escExitLabel) {
      this.escExitLabel.remove();
      this.escExitLabel = null;
    }
  }

  createElement(tag, props = {}) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style') {
        element.style.cssText = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    return element;
  }

  // Utility method for debouncing function calls
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}


  // Module: src/modules/style-manager.js
/**
 * CSS injection and style management
 */
class StyleManager {
  constructor() {
    this.injectedStyles = new Set();
    this.shadowRootStyles = new Map(); // Track shadow root styles for cleanup
    this.isEnabled = true; // Track if styles should be active
  }

  injectSharedStyles() {
    if (this.injectedStyles.has('main') || !this.isEnabled) return;

    const css = `
      html.${CSS_CLASSES.CURSOR_HIDDEN}, 
      html.${CSS_CLASSES.CURSOR_HIDDEN} * { 
        cursor: none !important; 
      }
      
      .${CSS_CLASSES.FOCUS} { 
        filter: brightness(1.2) !important; 
      }
      
      .${CSS_CLASSES.DELETE} { 
        filter: brightness(0.8) contrast(1.2) !important; 
      }
      
      .${CSS_CLASSES.HIDDEN} { 
        display: none !important; 
      }
      
      @keyframes kpv2-ripple { 
        0% { transform: translate(-50%, -50%) scale(0.25); opacity: 0.35; }
        60% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
        100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      }
      
      .${CSS_CLASSES.RIPPLE} { 
        position: fixed; 
        left: 0; 
        top: 0; 
        z-index: 2147483646; 
        pointer-events: none; 
        width: 46px; 
        height: 46px; 
        border-radius: 50%; 
        background: radial-gradient(circle, ${COLORS.RIPPLE_GREEN} 0%, ${COLORS.RIPPLE_GREEN_MID} 60%, ${COLORS.RIPPLE_GREEN_TRANSPARENT} 70%); 
        animation: kpv2-ripple 420ms ease-out forwards; 
      }
      
      .${CSS_CLASSES.FOCUS_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid ${COLORS.FOCUS_GREEN}; 
        box-shadow: 0 0 0 2px ${COLORS.GREEN_SHADOW}, 0 0 10px 2px ${COLORS.GREEN_SHADOW_BRIGHT}; 
        background: transparent; 
      }
      
      .${CSS_CLASSES.DELETE_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid ${COLORS.DELETE_RED}; 
        box-shadow: 0 0 0 2px ${COLORS.DELETE_SHADOW}, 0 0 12px 2px ${COLORS.DELETE_SHADOW_BRIGHT}; 
        background: transparent; 
      }
      
      .${CSS_CLASSES.HIGHLIGHT_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid ${COLORS.HIGHLIGHT_BLUE}; 
        box-shadow: 0 0 0 2px ${COLORS.HIGHLIGHT_SHADOW}, 0 0 12px 2px ${COLORS.HIGHLIGHT_SHADOW_BRIGHT}; 
        background: transparent; 
      }
      
      .${CSS_CLASSES.HIGHLIGHT_SELECTION} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483645; 
        background: ${COLORS.HIGHLIGHT_SELECTION_BG}; 
        border: 1px solid ${COLORS.HIGHLIGHT_SELECTION_BORDER}; 
      }
      

      
      #${ELEMENT_IDS.CURSOR} { 
        position: fixed !important; 
        left: var(--cursor-x, 0) !important; 
        top: var(--cursor-y, 0) !important; 
        transform: translate(-50%, -50%) !important; 
        z-index: 2147483647 !important; 
        pointer-events: none !important;
        display: block !important;
        visibility: visible !important;
        will-change: transform, left, top !important;
      }
      
      .${CSS_CLASSES.VIEWPORT_MODAL_FRAME} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: 9pt solid ${COLORS.ORANGE};
        opacity: 0.7;
        pointer-events: none;
        z-index: ${Z_INDEX.VIEWPORT_MODAL_FRAME};
        box-sizing: border-box;
        will-change: transform;
      }
      
      @keyframes kpv2-pulse { 
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
      
      .${CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME} {
        position: fixed;
        pointer-events: none;
        z-index: ${Z_INDEX.OVERLAYS + 1};
        border: 3px solid ${COLORS.ORANGE};
        box-shadow: 0 0 0 2px ${COLORS.ORANGE_SHADOW}, 0 0 10px 2px ${COLORS.ORANGE_SHADOW_DARK};
        background: transparent;
        animation: kpv2-pulse 1.5s ease-in-out infinite;
        will-change: transform, opacity;
      }
      
      .${CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME}::before {
        content: "ACTIVE TEXT INPUT";
        position: absolute;
        top: -24px;
        left: 0;
        background: ${COLORS.ORANGE};
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        white-space: nowrap;
        border-radius: 2px;
        z-index: 1;
      }
      
      .${CSS_CLASSES.ESC_EXIT_LABEL} {
        position: fixed;
        pointer-events: none;
        z-index: ${Z_INDEX.OVERLAYS + 1};
        background: ${COLORS.ORANGE};
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        white-space: nowrap;
        border-radius: 2px;
        animation: kpv2-pulse 1.5s ease-in-out infinite;
        will-change: transform, opacity;
      }
      
      /* Add left padding to focused text inputs */
      input:focus,
      textarea:focus,
      [contenteditable="true"]:focus,
      [contenteditable=""]:focus {
        padding-left: 5pt !important;
      }
    `;

    this.injectCSS(css, ELEMENT_IDS.STYLE);
    this.injectedStyles.add('main');

    // Hide default cursor
    document.documentElement.classList.add(CSS_CLASSES.CURSOR_HIDDEN);
  }

  injectCSS(css, id) {
    const existing = document.getElementById(id);
    if (existing) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  injectIntoShadowRoot(shadowRoot) {
    if (this.injectedStyles.has(shadowRoot) || !this.isEnabled) return;

    const css = `
      .${CSS_CLASSES.FOCUS} { 
        filter: brightness(1.2) !important; 
      }
      
      .${CSS_CLASSES.DELETE} { 
        filter: brightness(0.8) contrast(1.2) !important; 
      }
      
      .${CSS_CLASSES.HIDDEN} { 
        display: none !important; 
      }
      
      /* Add left padding to focused text inputs in shadow DOM */
      input:focus,
      textarea:focus,
      [contenteditable="true"]:focus,
      [contenteditable=""]:focus {
        padding-left: 5pt !important;
      }

    `;

    const style = document.createElement('style');
    style.id = 'keypilot-shadow-styles';
    style.textContent = css;
    shadowRoot.appendChild(style);

    this.injectedStyles.add(shadowRoot);
    this.shadowRootStyles.set(shadowRoot, style);
  }

  /**
   * Completely remove all KeyPilot CSS styles from the page
   * Used when extension is toggled off
   */
  removeAllStyles() {
    // Remove cursor hidden class
    document.documentElement.classList.remove(CSS_CLASSES.CURSOR_HIDDEN);

    // Remove main stylesheet
    const mainStyle = document.getElementById(ELEMENT_IDS.STYLE);
    if (mainStyle) {
      mainStyle.remove();
    }

    // Remove all shadow root styles
    for (const [shadowRoot, styleElement] of this.shadowRootStyles) {
      if (styleElement && styleElement.parentNode) {
        styleElement.remove();
      }
    }

    // Remove all KeyPilot classes from elements
    this.removeAllKeyPilotClasses();

    // Clear tracking
    this.injectedStyles.clear();
    this.shadowRootStyles.clear();
    this.isEnabled = false;
  }

  /**
   * Restore all KeyPilot CSS styles to the page
   * Used when extension is toggled back on
   */
  restoreAllStyles() {
    this.isEnabled = true;

    // Re-inject main styles
    this.injectSharedStyles();

    // Re-inject shadow root styles for any shadow roots we previously tracked
    // Note: We'll need to re-discover shadow roots since they may have changed
    // This will be handled by the shadow DOM manager during normal operation
  }

  /**
   * Remove all KeyPilot CSS classes from DOM elements
   */
  removeAllKeyPilotClasses() {
    const classesToRemove = [
      CSS_CLASSES.FOCUS,
      CSS_CLASSES.DELETE,
      CSS_CLASSES.HIGHLIGHT,
      CSS_CLASSES.HIDDEN,
      CSS_CLASSES.RIPPLE,
      CSS_CLASSES.VIEWPORT_MODAL_FRAME,
      CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME,
      CSS_CLASSES.ESC_EXIT_LABEL,
      CSS_CLASSES.HIGHLIGHT_OVERLAY,
      CSS_CLASSES.HIGHLIGHT_SELECTION
    ];

    // Remove classes from main document
    classesToRemove.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      elements.forEach(el => el.classList.remove(className));
    });

    // Remove classes from shadow roots
    for (const shadowRoot of this.shadowRootStyles.keys()) {
      classesToRemove.forEach(className => {
        const elements = shadowRoot.querySelectorAll(`.${className}`);
        elements.forEach(el => el.classList.remove(className));
      });
    }
  }

  /**
   * Check if styles are currently enabled
   */
  isStylesEnabled() {
    return this.isEnabled;
  }

  cleanup() {
    this.removeAllStyles();
  }
}


  // Module: src/modules/shadow-dom-manager.js
/**
 * Shadow DOM support and patching
 */
class ShadowDOMManager {
  constructor(styleManager) {
    this.styleManager = styleManager;
    this.shadowRoots = new Set();
    this.originalAttachShadow = null;
  }

  setup() {
    this.patchAttachShadow();
    this.processExistingShadowRoots();
  }

  patchAttachShadow() {
    if (this.originalAttachShadow) return; // Already patched

    this.originalAttachShadow = Element.prototype.attachShadow;
    const styleManager = this.styleManager;
    const shadowRoots = this.shadowRoots;

    Element.prototype.attachShadow = function(init) {
      const root = this.originalAttachShadow.call(this, init);
      
      try {
        if (init.mode === 'open') {
          styleManager.injectIntoShadowRoot(root);
          shadowRoots.add(root);
        }
      } catch (error) {
        console.warn('[KeyPilot] Failed to inject styles into shadow root:', error);
      }
      
      return root;
    }.bind(this);
  }

  processExistingShadowRoots() {
    const walker = document.createTreeWalker(
      document.documentElement,
      NodeFilter.SHOW_ELEMENT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.shadowRoot) {
        try {
          this.styleManager.injectIntoShadowRoot(node.shadowRoot);
          this.shadowRoots.add(node.shadowRoot);
        } catch (error) {
          console.warn('[KeyPilot] Failed to inject styles into existing shadow root:', error);
        }
      }
    }
  }

  cleanup() {
    // Restore original attachShadow
    if (this.originalAttachShadow) {
      Element.prototype.attachShadow = this.originalAttachShadow;
      this.originalAttachShadow = null;
    }
    
    this.shadowRoots.clear();
  }
}


  // Module: src/modules/intersection-observer-manager.js
/**
 * Intersection Observer-based performance optimization manager
 * Tracks element visibility and reduces expensive DOM queries
 */
class IntersectionObserverManager {
  constructor(elementDetector) {
    this.elementDetector = elementDetector;
    
    // Observer for tracking interactive elements in viewport
    this.interactiveObserver = null;
    
    // Observer for tracking overlay visibility
    this.overlayObserver = null;
    
    // Cache of interactive elements currently in viewport
    this.visibleInteractiveElements = new Set();
    
    // Cache of element positions for quick lookups
    this.elementPositionCache = new Map();
    
    // Debounced cache update
    this.cacheUpdateTimeout = null;
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      observerUpdates: 0
    };
  }

  init() {
    this.setupInteractiveElementObserver();
    this.setupOverlayObserver();
    
    // Only start periodic updates after observers are set up
    if (this.interactiveObserver && this.overlayObserver) {
      this.startPeriodicCacheUpdate();
    }
  }

  setupInteractiveElementObserver() {
    try {
      // Observer for interactive elements with expanded root margin for preloading
      this.interactiveObserver = new IntersectionObserver(
        (entries) => {
          this.metrics.observerUpdates++;
          
          entries.forEach(entry => {
            const element = entry.target;
            
            if (entry.isIntersecting) {
              this.visibleInteractiveElements.add(element);
              this.updateElementPositionCache(element, element.getBoundingClientRect());
            } else {
              this.visibleInteractiveElements.delete(element);
              this.elementPositionCache.delete(element);
            }
          });
        },
        {
          // Expanded margins to preload elements before they're visible
          rootMargin: '100px',
          // Multiple thresholds for better granularity
          threshold: [0, 0.1, 0.5, 1.0]
        }
      );
    } catch (error) {
      console.warn('[KeyPilot] Failed to create IntersectionObserver for interactive elements:', error);
      this.interactiveObserver = null;
    }
  }

  setupOverlayObserver() {
    try {
      // Observer specifically for overlay elements to optimize repositioning
      this.overlayObserver = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            const overlay = entry.target;
            
            // Hide overlays that are completely out of view to save rendering
            if (entry.intersectionRatio === 0) {
              overlay.style.visibility = 'hidden';
            } else {
              overlay.style.visibility = 'visible';
            }
          });
        },
        {
          rootMargin: '50px',
          threshold: [0, 1.0]
        }
      );
    } catch (error) {
      console.warn('[KeyPilot] Failed to create IntersectionObserver for overlays:', error);
      this.overlayObserver = null;
    }
  }

  startPeriodicCacheUpdate() {
    // Periodically refresh the cache of interactive elements
    this.discoverInteractiveElements();
    
    // Set up periodic updates every 2 seconds
    this.cacheUpdateInterval = setInterval(() => {
      this.discoverInteractiveElements();
    }, 2000);
  }

  discoverInteractiveElements() {
    // Skip if observer is not initialized
    if (!this.interactiveObserver) {
      return;
    }

    // Find all interactive elements in the document
    const interactiveElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"], [onclick], [tabindex]:not([tabindex="-1"])'
    );

    // Observe new elements
    interactiveElements.forEach(element => {
      if (!this.isElementObserved(element)) {
        this.interactiveObserver.observe(element);
      }
    });

    // Clean up observers for removed elements
    this.cleanupRemovedElements();
  }

  isElementObserved(element) {
    // Check if element is already being observed
    return this.visibleInteractiveElements.has(element) || 
           this.elementPositionCache.has(element);
  }

  cleanupRemovedElements() {
    // Skip if observer is not initialized
    if (!this.interactiveObserver) {
      return;
    }

    // Remove elements that are no longer in the DOM
    for (const element of this.visibleInteractiveElements) {
      if (!document.contains(element)) {
        this.visibleInteractiveElements.delete(element);
        this.elementPositionCache.delete(element);
        this.interactiveObserver.unobserve(element);
      }
    }
  }

  updateElementPositionCache(element, rect) {
    this.elementPositionCache.set(element, {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      timestamp: Date.now()
    });
  }

  // Track element for performance metrics and caching
  trackElementAtPoint(x, y) {
    // This method is called to track elements for performance optimization
    // It doesn't replace the main element detection, just optimizes it
    
    const element = this.elementDetector.deepElementFromPoint(x, y);
    const clickable = this.elementDetector.findClickable(element);
    
    // Check if we found this element in our cache (for metrics)
    if (clickable && this.visibleInteractiveElements.has(clickable)) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }
    
    // Add to cache if it's interactive and visible but not already cached
    if (clickable && this.interactiveObserver && this.isElementVisible(clickable) && !this.visibleInteractiveElements.has(clickable)) {
      this.visibleInteractiveElements.add(clickable);
      this.interactiveObserver.observe(clickable);
      this.updateElementPositionCache(clickable, clickable.getBoundingClientRect());
    }
    
    return clickable;
  }

  // Legacy method name for compatibility
  findInteractiveElementAtPoint(x, y) {
    return this.trackElementAtPoint(x, y);
  }

  isPointInRect(x, y, rect) {
    return x >= rect.left && 
           x <= rect.right && 
           y >= rect.top && 
           y <= rect.bottom;
  }

  rectsAreClose(rect1, rect2, tolerance = 5) {
    return Math.abs(rect1.left - rect2.left) <= tolerance &&
           Math.abs(rect1.top - rect2.top) <= tolerance &&
           Math.abs(rect1.width - rect2.width) <= tolerance &&
           Math.abs(rect1.height - rect2.height) <= tolerance;
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && 
           rect.height > 0 && 
           rect.bottom > 0 && 
           rect.right > 0 && 
           rect.top < window.innerHeight && 
           rect.left < window.innerWidth;
  }

  // Observe overlay elements for visibility optimization
  observeOverlay(overlayElement) {
    if (this.overlayObserver && overlayElement) {
      this.overlayObserver.observe(overlayElement);
    }
  }

  unobserveOverlay(overlayElement) {
    if (this.overlayObserver && overlayElement) {
      this.overlayObserver.unobserve(overlayElement);
    }
  }

  // Get performance metrics
  getMetrics() {
    const totalQueries = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalQueries > 0 ? (this.metrics.cacheHits / totalQueries * 100).toFixed(1) : 0;
    
    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      visibleElements: this.visibleInteractiveElements.size,
      cachedPositions: this.elementPositionCache.size
    };
  }

  // Cleanup method
  cleanup() {
    if (this.interactiveObserver) {
      this.interactiveObserver.disconnect();
      this.interactiveObserver = null;
    }
    
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }
    
    if (this.cacheUpdateTimeout) {
      clearTimeout(this.cacheUpdateTimeout);
      this.cacheUpdateTimeout = null;
    }
    
    if (this.cacheUpdateInterval) {
      clearInterval(this.cacheUpdateInterval);
      this.cacheUpdateInterval = null;
    }
    
    this.visibleInteractiveElements.clear();
    this.elementPositionCache.clear();
  }
}


  // Module: src/modules/optimized-scroll-manager.js
/**
 * Optimized scroll management using Intersection Observer
 * Reduces expensive operations during scroll events
 */
class OptimizedScrollManager {
  constructor(overlayManager, stateManager) {
    this.overlayManager = overlayManager;
    this.stateManager = stateManager;
    
    // Scroll state tracking
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.scrollStartTime = 0;
    
    // Intersection observer for scroll-sensitive elements
    this.scrollObserver = null;
    
    // Elements that need position updates during scroll
    this.scrollSensitiveElements = new Set();
    
    // Throttled scroll handler
    this.throttledScrollHandler = this.throttle(this.handleScrollThrottled.bind(this), 16); // ~60fps
    
    // Performance tracking
    this.scrollMetrics = {
      scrollEvents: 0,
      overlayUpdates: 0,
      throttledCalls: 0,
      averageScrollDuration: 0
    };
  }

  init() {
    this.setupScrollObserver();
    this.setupScrollListeners();
    this.setupStateSubscription();
  }

  setupScrollObserver() {
    // Observer to track when elements move in/out of view during scroll
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const element = entry.target;
          
          if (entry.isIntersecting) {
            // Element is visible, may need overlay updates
            this.scrollSensitiveElements.add(element);
          } else {
            // Element is out of view, can skip overlay updates
            this.scrollSensitiveElements.delete(element);
            
            // Hide any overlays for out-of-view elements
            this.hideOverlaysForElement(element);
          }
        });
      },
      {
        rootMargin: '20px', // Small margin to catch elements just entering/leaving
        threshold: [0, 1.0]
      }
    );
  }

  setupScrollListeners() {
    // Use passive listener for better performance
    document.addEventListener('scroll', this.handleScroll.bind(this), { 
      passive: true,
      capture: true 
    });
    
    // Also listen for wheel events to predict scroll direction
    document.addEventListener('wheel', this.handleWheel.bind(this), { 
      passive: true 
    });
  }

  setupStateSubscription() {
    // Subscribe to state changes to track new elements
    this.stateUnsubscribe = this.stateManager.subscribe((newState, prevState) => {
      // Start observing new elements
      if (newState.focusEl !== prevState.focusEl) {
        if (prevState.focusEl) {
          this.unobserveElementForScroll(prevState.focusEl);
        }
        if (newState.focusEl) {
          this.observeElementForScroll(newState.focusEl);
        }
      }
      
      if (newState.deleteEl !== prevState.deleteEl) {
        if (prevState.deleteEl) {
          this.unobserveElementForScroll(prevState.deleteEl);
        }
        if (newState.deleteEl) {
          this.observeElementForScroll(newState.deleteEl);
        }
      }
      
      if (newState.focusedTextElement !== prevState.focusedTextElement) {
        if (prevState.focusedTextElement) {
          this.unobserveElementForScroll(prevState.focusedTextElement);
        }
        if (newState.focusedTextElement) {
          this.observeElementForScroll(newState.focusedTextElement);
        }
      }
    });
  }

  handleScroll(event) {
    this.scrollMetrics.scrollEvents++;
    
    // Mark scroll start
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.scrollStartTime = performance.now();
    }

    // Use throttled handler for performance
    this.throttledScrollHandler(event);

    // Clear existing timeout and set new one
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Detect scroll end
    this.scrollTimeout = setTimeout(() => {
      this.handleScrollEnd();
    }, 100);
  }

  handleScrollThrottled(event) {
    this.scrollMetrics.throttledCalls++;
    
    const currentState = this.stateManager.getState();
    
    // Only update overlays for elements that are still visible
    if (currentState.focusEl && this.scrollSensitiveElements.has(currentState.focusEl)) {
      this.updateOverlayPosition(currentState.focusEl, 'focus');
    }
    
    if (currentState.deleteEl && this.scrollSensitiveElements.has(currentState.deleteEl)) {
      this.updateOverlayPosition(currentState.deleteEl, 'delete');
    }
    
    // Update focused text element overlays (both focused text overlay and active text input frame)
    if (currentState.focusedTextElement && this.scrollSensitiveElements.has(currentState.focusedTextElement)) {
      this.updateOverlayPosition(currentState.focusedTextElement, 'focusedText');
    }
    
    this.scrollMetrics.overlayUpdates++;
  }

  handleWheel(event) {
    // Predict scroll direction and prepare for smooth updates
    const direction = event.deltaY > 0 ? 'down' : 'up';
    
    // Pre-emptively update overlay positions based on predicted scroll
    this.prepareForScroll(direction);
  }

  prepareForScroll(direction) {
    // Pre-calculate positions for smooth scrolling
    const currentState = this.stateManager.getState();
    
    if (currentState.focusEl) {
      this.observeElementForScroll(currentState.focusEl);
    }
    
    if (currentState.deleteEl) {
      this.observeElementForScroll(currentState.deleteEl);
    }
    
    if (currentState.focusedTextElement) {
      this.observeElementForScroll(currentState.focusedTextElement);
    }
  }

  observeElementForScroll(element) {
    if (element && this.scrollObserver) {
      this.scrollObserver.observe(element);
      this.scrollSensitiveElements.add(element);
    }
  }

  unobserveElementForScroll(element) {
    if (element && this.scrollObserver) {
      this.scrollObserver.unobserve(element);
      this.scrollSensitiveElements.delete(element);
    }
  }

  updateOverlayPosition(element, type) {
    if (!element) return;
    
    // Use requestAnimationFrame for smooth overlay updates
    requestAnimationFrame(() => {
      if (type === 'focus') {
        this.overlayManager.updateFocusOverlay(element);
      } else if (type === 'delete') {
        this.overlayManager.updateDeleteOverlay(element);
      } else if (type === 'focusedText') {
        // Update both the focused text overlay and active text input frame
        this.overlayManager.updateFocusedTextOverlay(element);
        this.overlayManager.updateActiveTextInputFrame(element);
      }
    });
  }

  hideOverlaysForElement(element) {
    const currentState = this.stateManager.getState();
    
    // Hide overlays if they're for elements that are out of view
    if (currentState.focusEl === element) {
      this.overlayManager.hideFocusOverlay();
    }
    
    if (currentState.deleteEl === element) {
      this.overlayManager.hideDeleteOverlay();
    }
    
    if (currentState.focusedTextElement === element) {
      this.overlayManager.hideFocusedTextOverlay();
      this.overlayManager.hideActiveTextInputFrame();
    }
  }

  handleScrollEnd() {
    const scrollDuration = performance.now() - this.scrollStartTime;
    
    // Update average scroll duration
    this.scrollMetrics.averageScrollDuration = 
      (this.scrollMetrics.averageScrollDuration + scrollDuration) / 2;
    
    this.isScrolling = false;
    
    // Force a complete overlay update after scroll ends
    const currentState = this.stateManager.getState();
    
    // Re-query elements at current mouse position for accuracy
    if (currentState.lastMouse.x >= 0 && currentState.lastMouse.y >= 0) {
      // Dispatch a custom event to trigger element re-query
      document.dispatchEvent(new CustomEvent('keypilot:scroll-end', {
        detail: {
          mouseX: currentState.lastMouse.x,
          mouseY: currentState.lastMouse.y
        }
      }));
    }
    
    // Clean up observers for elements that are no longer relevant
    this.cleanupScrollObservers();
  }

  cleanupScrollObservers() {
    // Remove observers for elements that are no longer in the DOM
    for (const element of this.scrollSensitiveElements) {
      if (!document.contains(element)) {
        this.unobserveElementForScroll(element);
      }
    }
  }

  // Throttle utility function
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Get scroll performance metrics
  getScrollMetrics() {
    const throttleRatio = this.scrollMetrics.scrollEvents > 0 ? 
      (this.scrollMetrics.throttledCalls / this.scrollMetrics.scrollEvents * 100).toFixed(1) : 0;
    
    return {
      ...this.scrollMetrics,
      throttleRatio: `${throttleRatio}%`,
      activeSensitiveElements: this.scrollSensitiveElements.size,
      isCurrentlyScrolling: this.isScrolling
    };
  }

  // Cleanup method
  cleanup() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    
    if (this.stateUnsubscribe) {
      this.stateUnsubscribe();
      this.stateUnsubscribe = null;
    }
    
    this.scrollSensitiveElements.clear();
    
    // Remove event listeners
    document.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('wheel', this.handleWheel.bind(this));
  }
}


  // Module: src/modules/keypilot-toggle-handler.js
/**
 * KeyPilotToggleHandler - Manages global toggle functionality for KeyPilot
 * Wraps the KeyPilot instance and provides enable/disable control
 */
class KeyPilotToggleHandler extends EventManager {
  constructor(keyPilotInstance) {
    super();
    
    this.keyPilot = keyPilotInstance;
    this.enabled = true;
    this.initialized = false;
    
    // Store original methods for restoration
    this.originalMethods = {
      handleKeyDown: null,
      handleMouseMove: null,
      handleScroll: null
    };
  }

  /**
   * Initialize the toggle handler
   * Queries service worker for current state and sets up message listener
   */
  async initialize() {
    try {
      // Query service worker for current extension state
      const response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      
      if (response && typeof response.enabled === 'boolean') {
        this.setEnabled(response.enabled, false); // Don't show notification during initialization
      } else {
        // Default to enabled if no response or invalid response
        this.setEnabled(true, false); // Don't show notification during initialization
      }
    } catch (error) {
      console.warn('[KeyPilotToggleHandler] Failed to query service worker state:', error);
      // Default to enabled on communication failure
      this.setEnabled(true, false); // Don't show notification during initialization
    }

    // Set up message listener for toggle state changes from service worker
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === 'KP_TOGGLE_STATE') {
        this.setEnabled(message.enabled); // Show notification for user-initiated toggles
        sendResponse({ success: true });
      }
    });

    this.initialized = true;
  }

  /**
   * Enable or disable KeyPilot functionality
   * @param {boolean} enabled - Whether KeyPilot should be enabled
   * @param {boolean} showNotification - Whether to show toggle notification (default: true)
   */
  setEnabled(enabled, showNotification = true) {
    if (this.enabled === enabled) {
      return; // No change needed
    }

    this.enabled = enabled;

    if (enabled) {
      this.enableKeyPilot();
    } else {
      this.disableKeyPilot();
    }

    // Show notification to user only if requested
    if (showNotification) {
      this.showToggleNotification(enabled);
    }
  }

  /**
   * Enable KeyPilot functionality
   * Restores event listeners, CSS styles, and visual elements
   */
  enableKeyPilot() {
    if (!this.keyPilot) return;

    try {
      // Restore all CSS styles first
      if (this.keyPilot.styleManager) {
        this.keyPilot.styleManager.restoreAllStyles();
      }

      // Restore event listeners
      this.keyPilot.start();

      // Ensure cursor is visible
      if (this.keyPilot.cursor) {
        this.keyPilot.cursor.ensure();
      }

      // Restore focus detector
      if (this.keyPilot.focusDetector) {
        this.keyPilot.focusDetector.start();
      }

      // Restore intersection manager
      if (this.keyPilot.intersectionManager) {
        this.keyPilot.intersectionManager.init();
      }

      // Restore scroll manager
      if (this.keyPilot.scrollManager) {
        this.keyPilot.scrollManager.init();
      }

      console.log('[KeyPilotToggleHandler] KeyPilot enabled');
    } catch (error) {
      console.error('[KeyPilotToggleHandler] Error enabling KeyPilot:', error);
      // Continue with partial functionality even if some components fail
    }
  }

  /**
   * Disable KeyPilot functionality
   * Removes event listeners, CSS styles, and all visual elements
   */
  disableKeyPilot() {
    if (!this.keyPilot) return;

    try {
      // Stop event listeners first
      this.keyPilot.stop();

      // Clean up cursor completely (remove from DOM)
      if (this.keyPilot.cursor) {
        this.keyPilot.cursor.cleanup();
      }

      // Stop focus detector
      if (this.keyPilot.focusDetector) {
        this.keyPilot.focusDetector.stop();
      }

      // Clean up overlays completely
      if (this.keyPilot.overlayManager) {
        this.keyPilot.overlayManager.cleanup();
      }

      // Clean up intersection manager
      if (this.keyPilot.intersectionManager) {
        this.keyPilot.intersectionManager.cleanup();
      }

      // Clean up scroll manager
      if (this.keyPilot.scrollManager) {
        this.keyPilot.scrollManager.cleanup();
      }

      // Reset state to normal mode
      if (this.keyPilot.state) {
        this.keyPilot.state.reset();
      }

      // Remove ALL CSS styles and classes - this is the critical fix
      if (this.keyPilot.styleManager) {
        this.keyPilot.styleManager.removeAllStyles();
      }

      console.log('[KeyPilotToggleHandler] KeyPilot disabled - all styles and elements removed');
    } catch (error) {
      console.error('[KeyPilotToggleHandler] Error disabling KeyPilot:', error);
      // Continue with cleanup even if some components fail
    }
  }

  /**
   * Show toggle notification to user
   * @param {boolean} enabled - Whether KeyPilot was enabled or disabled
   */
  showToggleNotification(enabled) {
    // Create notification overlay
    const notification = document.createElement('div');
    notification.className = 'kpv2-toggle-notification';
    notification.textContent = enabled ? 'KeyPilot Enabled' : 'KeyPilot Disabled';
    
    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      backgroundColor: enabled ? COLORS.NOTIFICATION_SUCCESS : COLORS.NOTIFICATION_ERROR,
      color: 'white',
      padding: '12px 24px',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      zIndex: '2147483647',
      boxShadow: `0 4px 12px ${COLORS.NOTIFICATION_SHADOW}`,
      opacity: '0',
      transition: 'opacity 0.3s ease-in-out',
      pointerEvents: 'none'
    });

    // Add to document
    document.body.appendChild(notification);

    // Fade in
    requestAnimationFrame(() => {
      notification.style.opacity = '1';
    });

    // Fade out and remove after 2 seconds
    setTimeout(() => {
      notification.style.opacity = '0';
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
      }, 300);
    }, 2000);
  }

  /**
   * Get current enabled state
   * @returns {boolean} Whether KeyPilot is currently enabled
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Clean up the toggle handler
   */
  cleanup() {
    // Remove message listeners
    if (chrome.runtime && chrome.runtime.onMessage) {
      chrome.runtime.onMessage.removeListener(this.handleMessage);
    }

    // Clean up KeyPilot if disabled
    if (!this.enabled && this.keyPilot) {
      this.keyPilot.cleanup();
    }
  }
}


  // Module: src/keypilot.js
/**
 * KeyPilot main application class
 */
class KeyPilot extends EventManager {
  constructor() {
    super();

    // Prevent multiple instances
    if (window.__KeyPilotV22) {
      console.warn('[KeyPilot] Already loaded.');
      return;
    }
    window.__KeyPilotV22 = true;

    // Extension enabled state - default to true, will be updated from service worker
    this.enabled = true;
    this.initializationComplete = false;

    this.state = new StateManager();
    this.cursor = new CursorManager();
    this.detector = new ElementDetector();
    this.activator = new ActivationHandler(this.detector);
    this.focusDetector = new FocusDetector(this.state);
    this.overlayManager = new OverlayManager();
    this.styleManager = new StyleManager();
    this.shadowDOMManager = new ShadowDOMManager(this.styleManager);
    
    // Intersection Observer optimizations
    this.intersectionManager = new IntersectionObserverManager(this.detector);
    this.scrollManager = new OptimizedScrollManager(this.overlayManager, this.state);

    // Mouse movement optimization: only query every 3+ pixels (increased threshold)
    this.lastQueryPosition = { x: -1, y: -1 };
    this.MOUSE_QUERY_THRESHOLD = 3;
    
    // Performance monitoring
    this.performanceMetrics = {
      mouseQueries: 0,
      cacheHits: 0,
      lastMetricsLog: Date.now()
    };

    this.init();
  }

  async init() {
    // Always set up styles and shadow DOM support
    this.setupStyles();
    this.setupShadowDOMSupport();
    
    // Always ensure cursor exists (but may be hidden)
    this.cursor.ensure();
    
    // Query service worker for current enabled state
    await this.queryInitialState();
    
    // Only initialize functionality if enabled
    if (this.enabled) {
      this.initializeEnabledState();
    } else {
      this.initializeDisabledState();
    }

    // Always set up communication and state management
    this.state.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });



    this.setupPopupCommunication();
    this.setupOptimizedEventListeners();
    this.setupContinuousCursorSync();

    // Initialize cursor position to center of viewport if not set
    this.initializeCursorPosition();

    this.initializationComplete = true;
    this.state.setState({ isInitialized: true });
  }

  /**
   * Query service worker for initial enabled state
   */
  async queryInitialState() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      if (response && typeof response.enabled === 'boolean') {
        this.enabled = response.enabled;
        console.log('[KeyPilot] Initial state from service worker:', this.enabled ? 'enabled' : 'disabled');
      } else {
        // Default to enabled if no response or invalid response
        this.enabled = true;
        console.log('[KeyPilot] No valid state from service worker, defaulting to enabled');
      }
    } catch (error) {
      // Service worker might not be available, default to enabled
      this.enabled = true;
      console.log('[KeyPilot] Service worker not available, defaulting to enabled:', error.message);
    }
  }

  /**
   * Initialize KeyPilot in enabled state
   */
  initializeEnabledState() {
    this.focusDetector.start();
    this.intersectionManager.init();
    this.scrollManager.init();
    this.start();
    this.cursor.show();
  }

  /**
   * Initialize KeyPilot in disabled state
   */
  initializeDisabledState() {
    // Don't start event listeners or focus detector
    // Hide cursor
    this.cursor.hide();
    
    // Ensure overlays are hidden
    this.overlayManager.hideFocusOverlay();
    this.overlayManager.hideDeleteOverlay();
  }

  setupOptimizedEventListeners() {
    // Listen for scroll end events from optimized scroll manager
    document.addEventListener('keypilot:scroll-end', (event) => {
      const { mouseX, mouseY } = event.detail;
      this.updateElementsUnderCursor(mouseX, mouseY);
    });
    
    // Periodic performance metrics logging
    // Enable by setting window.KEYPILOT_DEBUG = true in console
    setInterval(() => {
      if (window.KEYPILOT_DEBUG) {
        this.logPerformanceMetrics();
      }
    }, 10000); // Log every 10 seconds when debug enabled
  }

  setupContinuousCursorSync() {
    // Fallback cursor sync for problematic sites
    let lastSyncTime = 0;
    const syncCursor = () => {
      const now = Date.now();
      
      // Only sync every 16ms (60fps) to avoid performance issues
      if (now - lastSyncTime > 16) {
        const currentState = this.state.getState();
        if (currentState.lastMouse.x !== -1 && currentState.lastMouse.y !== -1) {
          // Force cursor position update
          this.cursor.updatePosition(currentState.lastMouse.x, currentState.lastMouse.y);
        }
        lastSyncTime = now;
      }
      
      // Continue syncing
      requestAnimationFrame(syncCursor);
    };
    
    // Start the sync loop
    requestAnimationFrame(syncCursor);
  }

  setupStyles() {
    this.styleManager.injectSharedStyles();
  }

  setupShadowDOMSupport() {
    this.shadowDOMManager.setup();
  }

  setupPopupCommunication() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'KP_GET_STATUS') {
        sendResponse({ mode: this.state.getState().mode });
      } else if (msg.type === 'KP_TOGGLE_STATE') {
        // Handle toggle state message from service worker
        if (typeof msg.enabled === 'boolean') {
          if (msg.enabled) {
            this.enable();
          } else {
            this.disable();
          }
        }
      }
    });
  }

  handleStateChange(newState, prevState) {
    // Update cursor mode
    if (newState.mode !== prevState.mode || 
        (newState.mode === MODES.TEXT_FOCUS && newState.focusEl !== prevState.focusEl)) {
      // For text focus mode, pass whether there's a clickable element and the focused element
      const options = newState.mode === MODES.TEXT_FOCUS ? 
        { 
          hasClickableElement: !!newState.focusEl
        } : {};
      this.cursor.setMode(newState.mode, options);
      this.updatePopupStatus(newState.mode);
    }

    // Update overlays when focused text element changes or when overlay update is triggered
    if (newState.focusedTextElement !== prevState.focusedTextElement ||
        newState._overlayUpdateTrigger !== prevState._overlayUpdateTrigger) {
      // Update overlays to show the focused text overlay
      this.updateOverlays(newState.focusEl, newState.deleteEl);
    }

    // Update visual overlays
    if (newState.focusEl !== prevState.focusEl ||
      newState.deleteEl !== prevState.deleteEl) {
      this.updateOverlays(newState.focusEl, newState.deleteEl);
    }
  }

  updatePopupStatus(mode) {
    try {
      chrome.runtime.sendMessage({ type: 'KP_STATUS', mode });
    } catch (error) {
      // Popup might not be open
    }
  }

  handleKeyDown(e) {
    // Don't handle keys if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Debug key presses
    console.log('[KeyPilot] Key pressed:', e.key, 'Code:', e.code);

    // Don't interfere with modifier key combinations (Cmd+C, Ctrl+V, etc.)
    if (this.hasModifierKeys(e)) {
      return;
    }

    const currentState = this.state.getState();

    // In text focus mode, only handle ESC
    if (currentState.mode === MODES.TEXT_FOCUS) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        console.debug('Escape key detected in text focus mode');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.handleEscapeFromTextFocus(currentState);
      }
      return;
    }

    // Don't handle keys if we're in a typing context but not in our text focus mode
    // (This handles edge cases where focus detection might miss something)
    if (this.isTypingContext(e.target)) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        this.cancelModes();
      }
      return;
    }

    // Special handling for highlight mode - cancel on any key except H and ESC
    if (currentState.mode === MODES.HIGHLIGHT) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        // ESC key cancellation in highlight mode
        e.preventDefault();
        this.cancelHighlightMode();
        return;
      } else if (KEYBINDINGS.HIGHLIGHT.includes(e.key)) {
        // H key - complete the selection
        e.preventDefault();
        this.handleHighlightKey();
        return;
      } else {
        // Any other key - cancel highlight mode and let the key execute its normal function
        this.cancelHighlightMode();
        // Don't prevent default - allow the functional key to execute after canceling
        // Fall through to handle the key normally
      }
    }

    // Handle our keyboard shortcuts
    if (KEYBINDINGS.CANCEL.includes(e.key)) {
      e.preventDefault();
      this.cancelModes();
    } else if (KEYBINDINGS.BACK.includes(e.key) || KEYBINDINGS.BACK2.includes(e.key)) {
      e.preventDefault();
      this.handleBackKey();
    } else if (KEYBINDINGS.FORWARD.includes(e.key)) {
      e.preventDefault();
      this.handleForwardKey();
    } else if (KEYBINDINGS.ROOT.includes(e.key)) {
      e.preventDefault();
      this.handleRootKey();
    } else if (KEYBINDINGS.CLOSE_TAB.includes(e.key)) {
      e.preventDefault();
      this.handleCloseTabKey();
    } else if (KEYBINDINGS.DELETE.includes(e.key)) {
      e.preventDefault();
      this.handleDeleteKey();
    } else if (KEYBINDINGS.HIGHLIGHT.includes(e.key)) {
      e.preventDefault();
      this.handleHighlightKey();
    } else if (KEYBINDINGS.ACTIVATE.includes(e.key)) {
      e.preventDefault();
      this.handleActivateKey();
    }
  }

  handleMouseMove(e) {
    // Don't handle mouse events if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Store mouse position immediately to prevent sync issues
    const x = e.clientX;
    const y = e.clientY;
    
    this.state.setMousePosition(x, y);
    this.cursor.updatePosition(x, y);

    // Use optimized element detection with threshold
    this.updateElementsUnderCursorWithThreshold(x, y);
  }

  handleScroll(e) {
    // Don't handle scroll events if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Delegate scroll handling to optimized scroll manager
    // The scroll manager handles all the optimization logic
    return; // OptimizedScrollManager handles scroll events directly
  }

  updateElementsUnderCursorWithThreshold(x, y) {
    // Check if mouse has moved enough to warrant a new query
    const deltaX = Math.abs(x - this.lastQueryPosition.x);
    const deltaY = Math.abs(y - this.lastQueryPosition.y);

    if (deltaX < this.MOUSE_QUERY_THRESHOLD && deltaY < this.MOUSE_QUERY_THRESHOLD) {
      // Mouse hasn't moved enough, skip the query
      return;
    }

    // Update last query position
    this.lastQueryPosition.x = x;
    this.lastQueryPosition.y = y;

    // Perform the actual element query
    this.updateElementsUnderCursor(x, y);
  }

  updateElementsUnderCursor(x, y) {
    const currentState = this.state.getState();

    this.performanceMetrics.mouseQueries++;

    // Use traditional element detection for accuracy
    const under = this.detector.deepElementFromPoint(x, y);
    let clickable = this.detector.findClickable(under);
    
    // In text focus mode, exclude the currently focused text element from being considered clickable
    if (currentState.mode === MODES.TEXT_FOCUS && currentState.focusedTextElement && clickable === currentState.focusedTextElement) {
      clickable = null;
    }
    
    // Track with intersection manager for performance metrics and caching
    this.intersectionManager.trackElementAtPoint(x, y);

    // Debug logging when debug mode is enabled
    if (window.KEYPILOT_DEBUG && clickable) {
      console.log('[KeyPilot Debug] Found clickable element:', {
        tagName: clickable.tagName,
        href: clickable.href,
        className: clickable.className,
        text: clickable.textContent?.substring(0, 50),
        mode: currentState.mode
      });
    }

    // Always update focus element (for overlays in text focus mode too)
    this.state.setFocusElement(clickable);

    if (this.state.isDeleteMode()) {
      // For delete mode, we need the exact element under cursor, not just clickable
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete mode - setting delete element:', {
          tagName: under?.tagName,
          className: under?.className,
          id: under?.id
        });
      }
      this.state.setDeleteElement(under);
    } else {
      // Clear delete element when not in delete mode
      this.state.setDeleteElement(null);
    }

    // Update text selection in highlight mode
    if (this.state.isHighlightMode()) {
      this.updateSelection();
    }
  }

  handleBackKey() {
    history.back();
  }

  handleForwardKey() {
    history.forward();
  }

  handleDeleteKey() {
    const currentState = this.state.getState();

    if (!this.state.isDeleteMode()) {
      console.log('[KeyPilot] Entering delete mode');
      this.state.setMode(MODES.DELETE);
    } else {
      const victim = currentState.deleteEl ||
        this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

      console.log('[KeyPilot] Deleting element:', victim);
      this.cancelModes();
      this.deleteElement(victim);
    }
  }

  handleHighlightKey() {
    const currentState = this.state.getState();

    // Prevent highlight mode activation in text focus mode
    if (currentState.mode === MODES.TEXT_FOCUS) {
      console.log('[KeyPilot] H key ignored - currently in text focus mode');
      return;
    }

    if (!this.state.isHighlightMode()) {
      console.log('[KeyPilot] Entering highlight mode');
      
      // Cancel delete mode if active
      if (this.state.isDeleteMode()) {
        console.log('[KeyPilot] Canceling delete mode to enter highlight mode');
      }
      
      // Enter highlight mode and start highlighting at current cursor position
      this.state.setMode(MODES.HIGHLIGHT);
      this.startHighlighting();
    } else {
      console.log('[KeyPilot] Completing highlight selection');
      this.completeSelection();
    }
  }

  startHighlighting() {
    const currentState = this.state.getState();
    const startPosition = {
      x: currentState.lastMouse.x,
      y: currentState.lastMouse.y,
      element: this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y)
    };

    console.log('[KeyPilot] Starting text selection at:', startPosition);
    this.state.setHighlightStartPosition(startPosition);

    // Initialize text selection at cursor position with comprehensive error handling
    try {
      const textNode = this.findTextNodeAtPosition(startPosition.x, startPosition.y);
      if (textNode) {
        // Create range using appropriate document context with error handling
        const ownerDocument = textNode.ownerDocument || document;
        
        // Validate document context
        if (!ownerDocument || typeof ownerDocument.createRange !== 'function') {
          throw new Error('Invalid document context for range creation');
        }
        
        const range = ownerDocument.createRange();
        const offset = this.getTextOffsetAtPosition(textNode, startPosition.x, startPosition.y);
        
        // Validate offset with bounds checking
        const textLength = textNode.textContent ? textNode.textContent.length : 0;
        if (textLength === 0) {
          throw new Error('Text node has no content');
        }
        
        const validOffset = Math.max(0, Math.min(offset, textLength));
        
        // Set range start position with error handling
        try {
          range.setStart(textNode, validOffset);
          range.setEnd(textNode, validOffset);
        } catch (rangeError) {
          throw new Error(`Failed to set range position: ${rangeError.message}`);
        }
        
        // Get appropriate selection object with validation
        const selection = this.getSelectionForDocument(ownerDocument);
        if (!selection) {
          throw new Error('Could not get selection object for document context');
        }
        
        // Validate selection API availability
        if (typeof selection.removeAllRanges !== 'function' || typeof selection.addRange !== 'function') {
          throw new Error('Selection API methods not available');
        }
        
        // Clear any existing selection and set new range with error handling
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (selectionError) {
          throw new Error(`Failed to set selection range: ${selectionError.message}`);
        }
        
        // Store the selection for updates
        this.state.setCurrentSelection(selection);
        
        // Initialize visual selection overlays with error handling
        try {
          this.overlayManager.updateHighlightSelectionOverlays(selection);
        } catch (overlayError) {
          console.warn('[KeyPilot] Error updating selection overlays:', overlayError);
          // Continue without visual overlays - selection still works
        }
        
        console.log('[KeyPilot] Text selection initialized successfully at offset:', validOffset);
      } else {
        console.log('[KeyPilot] No text node found at position, selection will start when cursor moves to text');
        // This is not an error - just no selectable content at current position
      }
    } catch (error) {
      console.error('[KeyPilot] Error initializing text selection:', error);
      
      // Show user-friendly error message
      this.showFlashNotification(
        'Unable to start text selection at this position', 
        COLORS.NOTIFICATION_ERROR
      );
      
      // Don't exit highlight mode - user can try moving cursor to different position
      // Continue without selection - will try again when cursor moves
    }
  }

  updateSelection() {
    const currentState = this.state.getState();
    const startPos = currentState.highlightStartPosition;
    
    if (!startPos) {
      console.warn('[KeyPilot] No start position for selection update');
      return;
    }

    const currentPos = {
      x: currentState.lastMouse.x,
      y: currentState.lastMouse.y
    };

    // Performance optimization: skip update if cursor hasn't moved much
    const deltaX = Math.abs(currentPos.x - startPos.x);
    const deltaY = Math.abs(currentPos.y - startPos.y);
    if (deltaX < 5 && deltaY < 5) {
      return; // Cursor hasn't moved enough to warrant an update
    }

    // Update the highlight rectangle overlay to show selection area
    try {
      this.overlayManager.updateHighlightRectangleOverlay(startPos, currentPos);
    } catch (overlayError) {
      console.warn('[KeyPilot] Error updating highlight rectangle overlay:', overlayError);
    }

    try {
      // Use rectangle-based selection instead of point-to-point
      const selectionResult = this.createRectangleBasedSelection(startPos, currentPos);
      
      if (selectionResult && selectionResult.success && selectionResult.selection) {
        // Validate selection before storing
        try {
          const selectedText = selectionResult.selection.toString();
          if (selectedText !== null && selectedText !== undefined) {
            // Store updated selection
            this.state.setCurrentSelection(selectionResult.selection);
            
            // Update visual selection overlays for real-time feedback with error handling
            try {
              this.overlayManager.updateHighlightSelectionOverlays(selectionResult.selection);
            } catch (overlayError) {
              console.warn('[KeyPilot] Error updating selection overlays:', overlayError);
            }
          }
        } catch (validationError) {
          console.warn('[KeyPilot] Error validating selection:', validationError);
        }
      } else {
        // Clear selection if no valid selection could be created
        this.clearSelectionSafely();
        try {
          this.overlayManager.clearHighlightSelectionOverlays();
        } catch (overlayError) {
          console.warn('[KeyPilot] Error clearing selection overlays:', overlayError);
        }
      }
    } catch (error) {
      console.error('[KeyPilot] Unexpected error updating selection:', error);
      
      // Show user-friendly error message for unexpected errors
      this.showFlashNotification(
        'Selection update failed - try moving cursor', 
        COLORS.NOTIFICATION_ERROR
      );
      
      // Clear selection on error but stay in highlight mode
      this.clearSelectionSafely();
      try {
        this.overlayManager.clearHighlightSelectionOverlays();
      } catch (overlayError) {
        console.warn('[KeyPilot] Error clearing overlays after unexpected error:', overlayError);
      }
    }
  }

  /**
   * Create a selection across potentially different document boundaries
   * @param {Text} startNode - Starting text node
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Text} currentNode - Current text node
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag, selection, and metadata
   */
  createCrossBoundarySelection(startNode, startPos, currentNode, currentPos) {
    try {
      // Check if nodes are in the same document context
      const startDocument = startNode.ownerDocument || document;
      const currentDocument = currentNode.ownerDocument || document;
      const sameDocument = startDocument === currentDocument;
      
      // For cross-frame content, we can only select within the same document
      if (!sameDocument) {
        console.warn('[KeyPilot] Cross-frame selection not supported, limiting to current document');
        // Try to select within the current document only
        return this.createSingleDocumentSelection(currentNode, currentPos, currentNode, currentPos);
      }
      
      // Check if nodes are in different shadow DOM contexts
      const startRoot = this.getShadowRoot(startNode);
      const currentRoot = this.getShadowRoot(currentNode);
      const crossBoundary = startRoot !== currentRoot;
      
      if (crossBoundary) {
        // Handle cross-shadow-boundary selection
        return this.createCrossShadowSelection(startNode, startPos, currentNode, currentPos);
      } else {
        // Same document and shadow context - use standard selection
        return this.createSingleDocumentSelection(startNode, startPos, currentNode, currentPos);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating cross-boundary selection:', error);
      return { success: false, selection: null, crossBoundary: false };
    }
  }

  /**
   * Create rectangle-based selection that includes all text nodes within the rectangle
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag and selection
   */
  createRectangleBasedSelection(startPos, currentPos) {
    try {
      // Calculate rectangle bounds
      const rect = {
        left: Math.min(startPos.x, currentPos.x),
        top: Math.min(startPos.y, currentPos.y),
        right: Math.max(startPos.x, currentPos.x),
        bottom: Math.max(startPos.y, currentPos.y)
      };

      // Find all text nodes within the rectangle
      const textNodesInRect = this.findTextNodesInRectangle(rect);
      
      if (textNodesInRect.length === 0) {
        return { success: false, selection: null, crossBoundary: false };
      }

      // Sort text nodes by document order
      textNodesInRect.sort((a, b) => {
        const comparison = a.compareDocumentPosition(b);
        if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1; // a comes before b
        } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1; // a comes after b
        }
        return 0; // same node or no clear order
      });

      // Create selection from first to last text node
      const firstNode = textNodesInRect[0];
      const lastNode = textNodesInRect[textNodesInRect.length - 1];
      
      const ownerDocument = firstNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      
      // Set range to encompass all text nodes
      range.setStart(firstNode, 0);
      range.setEnd(lastNode, lastNode.textContent.length);
      
      // Get appropriate selection object
      const selection = this.getSelectionForDocument(ownerDocument);
      if (!selection) {
        return { success: false, selection: null, crossBoundary: false };
      }
      
      // Update selection
      selection.removeAllRanges();
      selection.addRange(range);
      
      return { success: true, selection: selection, crossBoundary: false };
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating rectangle-based selection:', error);
      return { success: false, selection: null, crossBoundary: false };
    }
  }

  /**
   * Find all text nodes that are within or intersect with the given rectangle
   * @param {Object} rect - Rectangle with left, top, right, bottom properties
   * @returns {Array} - Array of text nodes within the rectangle
   */
  findTextNodesInRectangle(rect) {
    const textNodes = [];
    
    try {
      // Get all text nodes in the document
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip empty or whitespace-only text nodes
            if (!node.textContent || !node.textContent.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Check if text node intersects with rectangle
            try {
              const range = document.createRange();
              range.selectNodeContents(node);
              const nodeRect = range.getBoundingClientRect();
              
              // Check if node rectangle intersects with selection rectangle
              const intersects = !(
                nodeRect.right < rect.left ||
                nodeRect.left > rect.right ||
                nodeRect.bottom < rect.top ||
                nodeRect.top > rect.bottom
              );
              
              return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            } catch (error) {
              console.warn('[KeyPilot] Error checking text node intersection:', error);
              return NodeFilter.FILTER_REJECT;
            }
          }
        },
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      // Also check shadow DOM elements
      this.findTextNodesInShadowDOMRectangle(document.body, rect, textNodes);
      
    } catch (error) {
      console.warn('[KeyPilot] Error finding text nodes in rectangle:', error);
    }
    
    return textNodes;
  }

  /**
   * Find text nodes within shadow DOM elements that intersect with the rectangle
   * @param {Element} element - Root element to search
   * @param {Object} rect - Rectangle bounds
   * @param {Array} textNodes - Array to add found text nodes to
   */
  findTextNodesInShadowDOMRectangle(element, rect, textNodes) {
    try {
      // Check if element has shadow root
      if (element.shadowRoot) {
        const walker = document.createTreeWalker(
          element.shadowRoot,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (!node.textContent || !node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              try {
                const range = element.shadowRoot.ownerDocument.createRange();
                range.selectNodeContents(node);
                const nodeRect = range.getBoundingClientRect();
                
                const intersects = !(
                  nodeRect.right < rect.left ||
                  nodeRect.left > rect.right ||
                  nodeRect.bottom < rect.top ||
                  nodeRect.top > rect.bottom
                );
                
                return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              } catch (error) {
                return NodeFilter.FILTER_REJECT;
              }
            }
          },
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
      }
      
      // Recursively check child elements for shadow roots
      for (const child of element.children) {
        this.findTextNodesInShadowDOMRectangle(child, rect, textNodes);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error finding shadow DOM text nodes:', error);
    }
  }

  /**
   * Create selection within a single document context
   * @param {Text} startNode - Starting text node
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Text} currentNode - Current text node
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag and selection
   */
  createSingleDocumentSelection(startNode, startPos, currentNode, currentPos) {
    try {
      const ownerDocument = startNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      
      // Calculate text offsets
      const startOffset = this.getTextOffsetAtPosition(startNode, startPos.x, startPos.y);
      const currentOffset = this.getTextOffsetAtPosition(currentNode, currentPos.x, currentPos.y);
      
      // Validate offsets
      const startTextLength = startNode.textContent.length;
      const currentTextLength = currentNode.textContent.length;
      const validStartOffset = Math.max(0, Math.min(startOffset, startTextLength));
      const validCurrentOffset = Math.max(0, Math.min(currentOffset, currentTextLength));
      
      // Set range based on direction of selection
      if (startNode === currentNode) {
        // Same text node - set range based on offset order
        if (validStartOffset <= validCurrentOffset) {
          range.setStart(startNode, validStartOffset);
          range.setEnd(currentNode, validCurrentOffset);
        } else {
          range.setStart(currentNode, validCurrentOffset);
          range.setEnd(startNode, validStartOffset);
        }
      } else {
        // Different text nodes - use document position to determine order
        const comparison = startNode.compareDocumentPosition(currentNode);
        if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
          // Current node comes after start node
          range.setStart(startNode, validStartOffset);
          range.setEnd(currentNode, validCurrentOffset);
        } else {
          // Current node comes before start node
          range.setStart(currentNode, validCurrentOffset);
          range.setEnd(startNode, validStartOffset);
        }
      }
      
      // Validate range before applying
      if (range.collapsed && validStartOffset === validCurrentOffset && startNode === currentNode) {
        // Don't create empty selections unless we're at the exact start position
        return { success: false, selection: null, crossBoundary: false };
      }
      
      // Get appropriate selection object
      const selection = this.getSelectionForDocument(ownerDocument);
      if (!selection) {
        return { success: false, selection: null, crossBoundary: false };
      }
      
      // Update selection
      selection.removeAllRanges();
      selection.addRange(range);
      
      return { success: true, selection: selection, crossBoundary: false };
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating single document selection:', error);
      return { success: false, selection: null, crossBoundary: false };
    }
  }

  /**
   * Create selection across shadow DOM boundaries
   * @param {Text} startNode - Starting text node
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Text} currentNode - Current text node
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag and selection
   */
  createCrossShadowSelection(startNode, startPos, currentNode, currentPos) {
    try {
      // For cross-shadow selections, we need to be more careful
      // Try to create selection in the main document context
      const mainSelection = window.getSelection();
      
      // Create ranges for both nodes in their respective contexts
      const startRange = this.createRangeForTextNode(startNode);
      const currentRange = this.createRangeForTextNode(currentNode);
      
      if (!startRange || !currentRange) {
        return { success: false, selection: null, crossBoundary: true };
      }
      
      // For cross-shadow selections, we'll select the entire range from start to current
      // This is a limitation of the Selection API across shadow boundaries
      try {
        const combinedRange = document.createRange();
        
        // Try to set the range to span from start to current
        // This may fail for some cross-shadow scenarios
        combinedRange.setStart(startNode, this.getTextOffsetAtPosition(startNode, startPos.x, startPos.y));
        combinedRange.setEnd(currentNode, this.getTextOffsetAtPosition(currentNode, currentPos.x, currentPos.y));
        
        mainSelection.removeAllRanges();
        mainSelection.addRange(combinedRange);
        
        return { success: true, selection: mainSelection, crossBoundary: true };
        
      } catch (crossError) {
        // Cross-shadow selection failed, fall back to selecting in the current node's context
        console.warn('[KeyPilot] Cross-shadow selection failed, falling back to current node context:', crossError);
        return this.createSingleDocumentSelection(currentNode, currentPos, currentNode, currentPos);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating cross-shadow selection:', error);
      return { success: false, selection: null, crossBoundary: true };
    }
  }

  /**
   * Get the shadow root for a given node
   * @param {Node} node - Node to find shadow root for
   * @returns {ShadowRoot|Document} - Shadow root or document
   */
  getShadowRoot(node) {
    let current = node;
    while (current) {
      if (current.nodeType === Node.DOCUMENT_NODE) {
        return current;
      }
      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        return root;
      }
      if (root === document) {
        return document;
      }
      current = current.parentNode;
    }
    return document;
  }

  /**
   * Get the appropriate selection object for a document
   * @param {Document} doc - Document to get selection for
   * @returns {Selection|null} - Selection object or null
   */
  getSelectionForDocument(doc) {
    try {
      if (doc === document) {
        return window.getSelection();
      }
      // For shadow DOM contexts, we typically use the main document selection
      // as shadow roots don't have their own selection objects in most browsers
      return window.getSelection();
    } catch (error) {
      console.warn('[KeyPilot] Error getting selection for document:', error);
      return null;
    }
  }

  /**
   * Safely clear selection with comprehensive error handling
   */
  clearSelectionSafely() {
    // Clear main document selection
    try {
      if (window && typeof window.getSelection === 'function') {
        const selection = window.getSelection();
        if (selection) {
          // Validate selection object before using
          if (typeof selection.rangeCount === 'number' && 
              typeof selection.removeAllRanges === 'function') {
            
            if (selection.rangeCount > 0) {
              selection.removeAllRanges();
              console.log('[KeyPilot] Cleared main document selection');
            }
          } else {
            console.warn('[KeyPilot] Main selection object missing required methods');
          }
        }
      }
    } catch (error) {
      console.warn('[KeyPilot] Error clearing main document selection:', error);
    }
    
    // Clear stored selection from state
    try {
      const currentState = this.state.getState();
      if (currentState && currentState.currentSelection) {
        this.state.setCurrentSelection(null);
        console.log('[KeyPilot] Cleared stored selection from state');
      }
    } catch (error) {
      console.warn('[KeyPilot] Error clearing stored selection from state:', error);
    }
    
    // Clear shadow DOM selections
    try {
      this.clearAllSelectionsWithShadowSupport();
    } catch (error) {
      console.warn('[KeyPilot] Error clearing shadow DOM selections:', error);
    }
  }

  async completeSelection() {
    const currentState = this.state.getState();
    
    console.log('[KeyPilot] Completing text selection with comprehensive error handling');
    
    try {
      // Get the current selection with comprehensive error handling
      let selection, selectedText;
      
      try {
        selection = this.getCurrentSelectionWithShadowSupport();
        if (!selection) {
          throw new Error('No selection object available');
        }
        
        // Validate selection has content
        if (typeof selection.toString !== 'function') {
          throw new Error('Selection object missing toString method');
        }
        
        selectedText = selection.toString();
        if (selectedText === null || selectedText === undefined) {
          throw new Error('Selection returned invalid text content');
        }
      } catch (selectionError) {
        console.warn('[KeyPilot] Error getting current selection:', selectionError);
        
        // Try fallback: get selection from state
        try {
          const stateSelection = currentState.currentSelection;
          if (stateSelection && typeof stateSelection.toString === 'function') {
            selectedText = stateSelection.toString();
            selection = stateSelection;
            console.log('[KeyPilot] Using fallback selection from state');
          } else {
            throw new Error('No valid fallback selection available');
          }
        } catch (fallbackError) {
          console.error('[KeyPilot] Fallback selection also failed:', fallbackError);
          this.showFlashNotification('Unable to access selected text', COLORS.NOTIFICATION_ERROR);
          return;
        }
      }
      
      // Handle empty or whitespace-only selections
      if (!selectedText || !selectedText.trim()) {
        console.log('[KeyPilot] Empty or whitespace-only selection, canceling highlight mode');
        this.cancelHighlightMode();
        this.showFlashNotification('No text selected', COLORS.NOTIFICATION_INFO);
        return;
      }
      
      // Validate text content before copying
      if (typeof selectedText !== 'string') {
        console.error('[KeyPilot] Selected text is not a string:', typeof selectedText);
        this.showFlashNotification('Invalid text selection', COLORS.NOTIFICATION_ERROR);
        return;
      }
      
      // Copy selected text to clipboard with comprehensive error handling
      let copySuccess = false;
      let clipboardError = null;
      
      try {
        copySuccess = await this.copyToClipboard(selectedText);
      } catch (error) {
        clipboardError = error;
        console.error('[KeyPilot] Clipboard operation threw error:', error);
        copySuccess = false;
      }
      
      if (copySuccess) {
        console.log('[KeyPilot] Text successfully copied to clipboard:', selectedText.substring(0, 50));
        
        // Clear selection and exit highlight mode with error handling
        try {
          this.cancelModes();
        } catch (cancelError) {
          console.warn('[KeyPilot] Error canceling modes after successful copy:', cancelError);
          // Force exit highlight mode
          this.state.setMode(MODES.NONE);
        }
        
        // Show success confirmation
        this.showFlashNotification('Text copied to clipboard', COLORS.NOTIFICATION_SUCCESS);
        
        // Flash the focus overlay for additional visual feedback with error handling
        try {
          this.overlayManager.flashFocusOverlay();
        } catch (flashError) {
          console.warn('[KeyPilot] Error flashing focus overlay:', flashError);
          // Continue without visual feedback
        }
      } else {
        console.warn('[KeyPilot] Failed to copy text to clipboard');
        
        // Provide specific error message based on clipboard error
        let errorMessage = 'Failed to copy text';
        if (clipboardError) {
          if (clipboardError.name === 'NotAllowedError' || clipboardError.message.includes('permission')) {
            errorMessage = 'Clipboard access denied - check browser permissions';
          } else if (clipboardError.message.includes('not supported')) {
            errorMessage = 'Clipboard not supported in this context';
          } else if (clipboardError.message.includes('secure context')) {
            errorMessage = 'Clipboard requires secure connection (HTTPS)';
          }
        }
        
        // Don't exit highlight mode on clipboard failure - let user try again
        this.showFlashNotification(errorMessage, COLORS.NOTIFICATION_ERROR);
      }
    } catch (error) {
      console.error('[KeyPilot] Unexpected error completing selection:', error);
      
      // Provide user-friendly error message for unexpected errors
      let errorMessage = 'Error copying text';
      if (error.message.includes('Selection API')) {
        errorMessage = 'Text selection not supported on this page';
      } else if (error.message.includes('shadow')) {
        errorMessage = 'Cannot copy text from this element';
      }
      
      // Don't exit highlight mode on error - let user try again
      this.showFlashNotification(errorMessage, COLORS.NOTIFICATION_ERROR);
    }
  }

  /**
   * Get current selection with comprehensive shadow DOM support and error handling
   * @returns {Selection|null} - Current selection or null
   */
  getCurrentSelectionWithShadowSupport() {
    try {
      // First try the main document selection with validation
      let mainSelection = null;
      try {
        if (window && typeof window.getSelection === 'function') {
          mainSelection = window.getSelection();
          
          // Validate selection object
          if (mainSelection && 
              typeof mainSelection.rangeCount === 'number' && 
              typeof mainSelection.toString === 'function') {
            
            if (mainSelection.rangeCount > 0) {
              const selectionText = mainSelection.toString();
              if (selectionText && selectionText.trim()) {
                console.log('[KeyPilot] Found valid main document selection');
                return mainSelection;
              }
            }
          }
        }
      } catch (mainSelectionError) {
        console.warn('[KeyPilot] Error accessing main document selection:', mainSelectionError);
      }
      
      // If no main selection, check stored selection from state with validation
      try {
        const currentState = this.state.getState();
        if (currentState && currentState.currentSelection) {
          const stateSelection = currentState.currentSelection;
          
          // Validate stored selection
          if (stateSelection && 
              typeof stateSelection.toString === 'function' &&
              typeof stateSelection.rangeCount === 'number') {
            
            const stateSelectionText = stateSelection.toString();
            if (stateSelectionText && stateSelectionText.trim()) {
              console.log('[KeyPilot] Found valid stored selection from state');
              return stateSelection;
            }
          }
        }
      } catch (stateSelectionError) {
        console.warn('[KeyPilot] Error accessing stored selection from state:', stateSelectionError);
      }
      
      // Try to find selection in shadow DOM contexts with comprehensive error handling
      try {
        const shadowSelection = this.findSelectionInShadowDOM();
        if (shadowSelection) {
          console.log('[KeyPilot] Found valid shadow DOM selection');
          return shadowSelection;
        }
      } catch (shadowSelectionError) {
        console.warn('[KeyPilot] Error finding selection in shadow DOM:', shadowSelectionError);
      }
      
      console.log('[KeyPilot] No valid selection found in any context');
      return null;
    } catch (error) {
      console.error('[KeyPilot] Unexpected error getting current selection:', error);
      return null;
    }
  }

  /**
   * Find selection in shadow DOM contexts with comprehensive error handling
   * @returns {Selection|null} - Selection found in shadow DOM or null
   */
  findSelectionInShadowDOM() {
    try {
      // Validate shadow DOM manager availability
      if (!this.shadowDOMManager) {
        console.log('[KeyPilot] Shadow DOM manager not available');
        return null;
      }
      
      // Validate shadow roots collection
      if (!this.shadowDOMManager.shadowRoots || 
          !Array.isArray(this.shadowDOMManager.shadowRoots) ||
          this.shadowDOMManager.shadowRoots.length === 0) {
        console.log('[KeyPilot] No shadow roots available for selection search');
        return null;
      }
      
      // Iterate through shadow roots with comprehensive error handling
      for (let i = 0; i < this.shadowDOMManager.shadowRoots.length; i++) {
        const shadowRoot = this.shadowDOMManager.shadowRoots[i];
        
        try {
          // Validate shadow root
          if (!shadowRoot) {
            console.warn(`[KeyPilot] Shadow root at index ${i} is null or undefined`);
            continue;
          }
          
          // Check if shadow root has selection capability
          if (typeof shadowRoot.getSelection !== 'function') {
            // Most shadow roots don't have their own getSelection method
            // This is normal and not an error
            continue;
          }
          
          // Try to get selection from shadow root
          let shadowSelection = null;
          try {
            shadowSelection = shadowRoot.getSelection();
          } catch (getSelectionError) {
            console.warn(`[KeyPilot] Error calling getSelection on shadow root ${i}:`, getSelectionError);
            continue;
          }
          
          // Validate shadow selection
          if (!shadowSelection) {
            continue;
          }
          
          // Check if selection has required methods and properties
          if (typeof shadowSelection.rangeCount !== 'number' ||
              typeof shadowSelection.toString !== 'function') {
            console.warn(`[KeyPilot] Shadow selection at index ${i} missing required methods`);
            continue;
          }
          
          // Check if selection has content
          if (shadowSelection.rangeCount > 0) {
            let selectionText = '';
            try {
              selectionText = shadowSelection.toString();
            } catch (toStringError) {
              console.warn(`[KeyPilot] Error getting text from shadow selection ${i}:`, toStringError);
              continue;
            }
            
            if (selectionText && selectionText.trim()) {
              console.log(`[KeyPilot] Found valid selection in shadow root ${i}`);
              return shadowSelection;
            }
          }
        } catch (shadowRootError) {
          console.warn(`[KeyPilot] Error processing shadow root ${i}:`, shadowRootError);
          // Continue to next shadow root
          continue;
        }
      }
      
      console.log('[KeyPilot] No valid selection found in any shadow DOM context');
      return null;
    } catch (error) {
      console.error('[KeyPilot] Unexpected error finding selection in shadow DOM:', error);
      return null;
    }
  }

  /**
   * Copy text to clipboard using modern Clipboard API with comprehensive fallback methods and error handling
   * @param {string} text - Text to copy to clipboard
   * @returns {Promise<boolean>} - True if copy was successful, false otherwise
   */
  async copyToClipboard(text) {
    // Comprehensive input validation
    if (!text) {
      console.warn('[KeyPilot] No text provided to copyToClipboard');
      return false;
    }
    
    if (typeof text !== 'string') {
      console.warn('[KeyPilot] Invalid text type provided to copyToClipboard:', typeof text);
      return false;
    }
    
    if (text.length === 0) {
      console.warn('[KeyPilot] Empty text provided to copyToClipboard');
      return false;
    }
    
    // Validate text content (check for null characters or other issues)
    try {
      // Test if text can be properly encoded
      const encoded = encodeURIComponent(text);
      if (!encoded) {
        throw new Error('Text contains invalid characters');
      }
    } catch (encodingError) {
      console.warn('[KeyPilot] Text encoding validation failed:', encodingError);
      return false;
    }

    // Try modern Clipboard API first with comprehensive error handling
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        // Check if we're in a secure context
        if (!window.isSecureContext) {
          console.warn('[KeyPilot] Not in secure context, modern Clipboard API may fail');
        }
        
        // Attempt to write to clipboard with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Clipboard operation timed out')), 5000);
        });
        
        const clipboardPromise = navigator.clipboard.writeText(text);
        
        await Promise.race([clipboardPromise, timeoutPromise]);
        
        console.log('[KeyPilot] Text copied using modern Clipboard API');
        return true;
      } catch (error) {
        console.warn('[KeyPilot] Modern Clipboard API failed:', error.message);
        
        // Categorize the error for better user feedback
        if (error.name === 'NotAllowedError') {
          console.warn('[KeyPilot] Clipboard permission denied');
        } else if (error.name === 'NotSupportedError') {
          console.warn('[KeyPilot] Clipboard API not supported');
        } else if (error.message.includes('secure context')) {
          console.warn('[KeyPilot] Clipboard requires secure context (HTTPS)');
        } else if (error.message.includes('timed out')) {
          console.warn('[KeyPilot] Clipboard operation timed out');
        } else if (error.message.includes('permission')) {
          console.warn('[KeyPilot] Clipboard permission issue');
        }
        
        // Fall through to fallback method
      }
    } else {
      console.log('[KeyPilot] Modern Clipboard API not available, using fallback method');
    }

    // Fallback method using execCommand with comprehensive error handling
    let textarea = null;
    try {
      // Validate document state
      if (!document || !document.body) {
        throw new Error('Document or document.body not available');
      }
      
      // Check if execCommand is available
      if (typeof document.execCommand !== 'function') {
        throw new Error('execCommand not available');
      }
      
      // Create a temporary textarea element with comprehensive setup
      textarea = document.createElement('textarea');
      if (!textarea) {
        throw new Error('Failed to create textarea element');
      }
      
      // Set textarea properties with error handling
      try {
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        textarea.style.zIndex = '-1';
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('tabindex', '-1');
        textarea.setAttribute('aria-hidden', 'true');
      } catch (styleError) {
        throw new Error(`Failed to set textarea properties: ${styleError.message}`);
      }
      
      // Add to DOM with error handling
      try {
        document.body.appendChild(textarea);
      } catch (appendError) {
        throw new Error(`Failed to append textarea to DOM: ${appendError.message}`);
      }
      
      // Focus and select text with error handling
      try {
        textarea.focus();
        textarea.select();
        
        // Ensure selection is set properly
        if (typeof textarea.setSelectionRange === 'function') {
          textarea.setSelectionRange(0, text.length);
        }
        
        // Verify selection was successful
        if (textarea.selectionStart !== 0 || textarea.selectionEnd !== text.length) {
          console.warn('[KeyPilot] Text selection in textarea may be incomplete');
        }
      } catch (selectionError) {
        throw new Error(`Failed to select text in textarea: ${selectionError.message}`);
      }
      
      // Execute copy command with error handling
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (execError) {
        throw new Error(`execCommand failed: ${execError.message}`);
      }
      
      // Clean up textarea
      try {
        if (textarea && textarea.parentNode) {
          document.body.removeChild(textarea);
        }
      } catch (cleanupError) {
        console.warn('[KeyPilot] Error cleaning up textarea:', cleanupError);
        // Don't fail the operation due to cleanup issues
      }
      
      if (success) {
        console.log('[KeyPilot] Text copied using fallback execCommand method');
        return true;
      } else {
        throw new Error('execCommand returned false');
      }
    } catch (error) {
      console.error('[KeyPilot] Fallback clipboard method failed:', error);
      
      // Ensure cleanup even on error
      try {
        if (textarea && textarea.parentNode) {
          document.body.removeChild(textarea);
        }
      } catch (cleanupError) {
        console.warn('[KeyPilot] Error cleaning up textarea after failure:', cleanupError);
      }
      
      return false;
    }
  }

  /**
   * Cancel highlight mode and return to normal mode
   * Clears selection, visual indicators, and state with shadow DOM support
   */
  cancelHighlightMode() {
    console.log('[KeyPilot] Canceling highlight mode with shadow DOM support');
    
    // Clear any active text selection immediately with shadow DOM support
    this.clearAllSelectionsWithShadowSupport();
    
    // Clear visual selection overlays immediately
    try {
      this.overlayManager.clearHighlightSelectionOverlays();
      this.overlayManager.hideHighlightRectangleOverlay();
      console.log('[KeyPilot] Cleared highlight selection overlays and rectangle overlay');
    } catch (error) {
      console.warn('[KeyPilot] Error clearing highlight overlays:', error);
    }
    
    // Clear all highlight-related state
    this.state.setHighlightStartPosition(null);
    this.state.setCurrentSelection(null);
    this.state.setHighlightElement(null);
    
    // Return to normal mode
    this.state.setMode(MODES.NONE);
    
    console.log('[KeyPilot] Highlight mode canceled, returned to normal mode');
  }

  /**
   * Clear all selections including shadow DOM contexts with comprehensive error handling
   */
  clearAllSelectionsWithShadowSupport() {
    // Clear main document selection with validation
    try {
      if (window && typeof window.getSelection === 'function') {
        const mainSelection = window.getSelection();
        if (mainSelection && 
            typeof mainSelection.rangeCount === 'number' &&
            typeof mainSelection.removeAllRanges === 'function') {
          
          if (mainSelection.rangeCount > 0) {
            mainSelection.removeAllRanges();
            console.log('[KeyPilot] Cleared main document selection');
          }
        }
      }
    } catch (error) {
      console.warn('[KeyPilot] Error clearing main document selection:', error);
    }
    
    // Clear selections in shadow DOM contexts with comprehensive validation
    try {
      if (!this.shadowDOMManager) {
        console.log('[KeyPilot] Shadow DOM manager not available for selection clearing');
        return;
      }
      
      if (!this.shadowDOMManager.shadowRoots || 
          !Array.isArray(this.shadowDOMManager.shadowRoots)) {
        console.log('[KeyPilot] No shadow roots available for selection clearing');
        return;
      }
      
      for (let i = 0; i < this.shadowDOMManager.shadowRoots.length; i++) {
        const shadowRoot = this.shadowDOMManager.shadowRoots[i];
        
        try {
          if (!shadowRoot) {
            console.warn(`[KeyPilot] Shadow root at index ${i} is null`);
            continue;
          }
          
          // Check if shadow root has selection capability
          if (typeof shadowRoot.getSelection !== 'function') {
            // Most shadow roots don't have getSelection - this is normal
            continue;
          }
          
          // Try to get and clear shadow selection
          let shadowSelection = null;
          try {
            shadowSelection = shadowRoot.getSelection();
          } catch (getSelectionError) {
            console.warn(`[KeyPilot] Error getting shadow selection ${i}:`, getSelectionError);
            continue;
          }
          
          if (shadowSelection &&
              typeof shadowSelection.rangeCount === 'number' &&
              typeof shadowSelection.removeAllRanges === 'function') {
            
            if (shadowSelection.rangeCount > 0) {
              try {
                shadowSelection.removeAllRanges();
                console.log(`[KeyPilot] Cleared shadow DOM selection ${i}`);
              } catch (removeRangesError) {
                console.warn(`[KeyPilot] Error removing ranges from shadow selection ${i}:`, removeRangesError);
              }
            }
          }
        } catch (shadowRootError) {
          console.warn(`[KeyPilot] Error processing shadow root ${i} for selection clearing:`, shadowRootError);
          continue;
        }
      }
    } catch (error) {
      console.error('[KeyPilot] Unexpected error clearing shadow DOM selections:', error);
    }
  }

  /**
   * Find the text node at the given screen coordinates with comprehensive shadow DOM support and error handling
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {Text|null} - Text node at position or null if none found
   */
  findTextNodeAtPosition(x, y) {
    try {
      // Validate input coordinates
      if (typeof x !== 'number' || typeof y !== 'number' || 
          !isFinite(x) || !isFinite(y) || x < 0 || y < 0) {
        console.warn('[KeyPilot] Invalid coordinates provided to findTextNodeAtPosition:', { x, y });
        return null;
      }
      
      // Get element at position using deep shadow DOM traversal with error handling
      let element = null;
      try {
        if (!this.detector || typeof this.detector.deepElementFromPoint !== 'function') {
          throw new Error('Element detector not available or missing deepElementFromPoint method');
        }
        
        element = this.detector.deepElementFromPoint(x, y);
      } catch (detectorError) {
        console.warn('[KeyPilot] Error using element detector:', detectorError);
        
        // Fallback to standard elementFromPoint
        try {
          element = document.elementFromPoint(x, y);
        } catch (fallbackError) {
          console.warn('[KeyPilot] Fallback elementFromPoint also failed:', fallbackError);
          return null;
        }
      }
      
      if (!element) {
        console.log('[KeyPilot] No element found at position:', { x, y });
        return null;
      }

      // Check if element itself is a text node
      if (element.nodeType === Node.TEXT_NODE) {
        // Validate text node has content
        if (element.textContent && element.textContent.trim()) {
          return element;
        } else {
          console.log('[KeyPilot] Text node at position has no content');
          return null;
        }
      }

      // Skip non-selectable elements gracefully with error handling
      try {
        if (this.isNonSelectableElement(element)) {
          console.log('[KeyPilot] Element at position is non-selectable:', element.tagName);
          return null;
        }
      } catch (selectableError) {
        console.warn('[KeyPilot] Error checking if element is selectable:', selectableError);
        // Continue anyway - assume it might be selectable
      }

      // Find text nodes within the element with comprehensive error handling
      let textNodes = [];
      try {
        textNodes = this.findTextNodesInElementWithShadowDOM(element);
      } catch (textNodesError) {
        console.warn('[KeyPilot] Error finding text nodes in element:', textNodesError);
        
        // Fallback: try simple text node search without shadow DOM
        try {
          textNodes = this.findTextNodesInElementSimple(element);
        } catch (fallbackError) {
          console.warn('[KeyPilot] Fallback text node search also failed:', fallbackError);
          return null;
        }
      }
      
      if (!textNodes || textNodes.length === 0) {
        console.log('[KeyPilot] No text nodes found in element at position');
        return null;
      }
      
      // Find the text node closest to the cursor position with comprehensive error handling
      let bestNode = null;
      let bestDistance = Infinity;
      
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        
        try {
          // Validate text node
          if (!node || node.nodeType !== Node.TEXT_NODE) {
            console.warn(`[KeyPilot] Invalid text node at index ${i}`);
            continue;
          }
          
          // Skip empty text nodes
          if (!node.textContent || !node.textContent.trim()) {
            continue;
          }
          
          // Create a range for this text node to get its position
          let range = null;
          try {
            range = this.createRangeForTextNode(node);
          } catch (rangeError) {
            console.warn(`[KeyPilot] Error creating range for text node ${i}:`, rangeError);
            continue;
          }
          
          if (!range) {
            continue;
          }
          
          // Get bounding rectangle with error handling
          let rect = null;
          try {
            rect = range.getBoundingClientRect();
          } catch (rectError) {
            console.warn(`[KeyPilot] Error getting bounding rect for text node ${i}:`, rectError);
            continue;
          }
          
          // Validate rectangle
          if (!rect || typeof rect.width !== 'number' || typeof rect.height !== 'number' ||
              typeof rect.left !== 'number' || typeof rect.top !== 'number') {
            console.warn(`[KeyPilot] Invalid bounding rect for text node ${i}`);
            continue;
          }
          
          // Skip nodes with no visible area
          if (rect.width <= 0 || rect.height <= 0) {
            continue;
          }
          
          // Calculate distance from cursor to text node with error handling
          try {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Validate calculated center
            if (!isFinite(centerX) || !isFinite(centerY)) {
              console.warn(`[KeyPilot] Invalid center coordinates for text node ${i}`);
              continue;
            }
            
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (!isFinite(distance)) {
              console.warn(`[KeyPilot] Invalid distance calculation for text node ${i}`);
              continue;
            }
            
            if (distance < bestDistance) {
              bestDistance = distance;
              bestNode = node;
            }
          } catch (distanceError) {
            console.warn(`[KeyPilot] Error calculating distance for text node ${i}:`, distanceError);
            continue;
          }
        } catch (nodeError) {
          console.warn(`[KeyPilot] Error processing text node ${i}:`, nodeError);
          continue;
        }
      }
      
      if (bestNode) {
        console.log('[KeyPilot] Found best text node at distance:', bestDistance);
      } else {
        console.log('[KeyPilot] No suitable text node found at position');
      }
      
      return bestNode;
    } catch (error) {
      console.error('[KeyPilot] Unexpected error finding text node at position:', error);
      return null;
    }
  }

  /**
   * Simple fallback method to find text nodes without shadow DOM support
   * @param {Element} element - Root element to search within
   * @returns {Text[]} - Array of text nodes found
   */
  findTextNodesInElementSimple(element) {
    const textNodes = [];
    
    try {
      if (!element) {
        return textNodes;
      }
      
      // Create tree walker for simple text node traversal
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            try {
              // Skip empty or whitespace-only text nodes
              if (!node.textContent || !node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              // Check if text node is visible
              const parent = node.parentElement;
              if (!parent) {
                return NodeFilter.FILTER_REJECT;
              }
              
              return NodeFilter.FILTER_ACCEPT;
            } catch (error) {
              return NodeFilter.FILTER_REJECT;
            }
          }
        }
      );

      // Collect text nodes
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
    } catch (error) {
      console.warn('[KeyPilot] Error in simple text node search:', error);
    }
    
    return textNodes;
  }

  /**
   * Find all text nodes within an element, including shadow DOM boundaries
   * @param {Element} element - Root element to search within
   * @returns {Text[]} - Array of text nodes found
   */
  findTextNodesInElementWithShadowDOM(element) {
    const textNodes = [];
    
    try {
      // Helper function to traverse nodes recursively
      const traverseNodes = (root) => {
        if (!root) return;
        
        // Create tree walker for this root
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip empty or whitespace-only text nodes
              if (!node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              // Check if text node is visible and selectable
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              // Skip non-selectable parent elements
              if (this.isNonSelectableElement(parent)) {
                return NodeFilter.FILTER_REJECT;
              }
              
              try {
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || 
                    style.visibility === 'hidden' || 
                    style.userSelect === 'none') {
                  return NodeFilter.FILTER_REJECT;
                }
              } catch (error) {
                // If we can't get computed style, skip this node
                return NodeFilter.FILTER_REJECT;
              }
              
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        // Collect text nodes from this root
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
        
        // Also traverse shadow DOM boundaries
        if (root.nodeType === Node.ELEMENT_NODE) {
          this.traverseShadowDOMForTextNodes(root, textNodes);
        }
      };
      
      // Start traversal from the given element
      traverseNodes(element);
      
    } catch (error) {
      console.warn('[KeyPilot] Error finding text nodes with shadow DOM support:', error);
    }
    
    return textNodes;
  }

  /**
   * Traverse shadow DOM boundaries to find text nodes
   * @param {Element} element - Element to check for shadow DOM
   * @param {Text[]} textNodes - Array to collect text nodes into
   */
  traverseShadowDOMForTextNodes(element, textNodes) {
    try {
      // Check if element has shadow root
      if (element.shadowRoot) {
        // Traverse the shadow root
        const shadowWalker = document.createTreeWalker(
          element.shadowRoot,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip empty or whitespace-only text nodes
              if (!node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              // Check if text node is visible and selectable
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              // Skip non-selectable parent elements
              if (this.isNonSelectableElement(parent)) {
                return NodeFilter.FILTER_REJECT;
              }
              
              try {
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || 
                    style.visibility === 'hidden' || 
                    style.userSelect === 'none') {
                  return NodeFilter.FILTER_REJECT;
                }
              } catch (error) {
                // If we can't get computed style, skip this node
                return NodeFilter.FILTER_REJECT;
              }
              
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        // Collect text nodes from shadow root
        let shadowNode;
        while (shadowNode = shadowWalker.nextNode()) {
          textNodes.push(shadowNode);
        }
        
        // Recursively check shadow DOM elements for nested shadow roots
        const shadowElements = element.shadowRoot.querySelectorAll('*');
        for (const shadowElement of shadowElements) {
          this.traverseShadowDOMForTextNodes(shadowElement, textNodes);
        }
      }
      
      // Also check child elements for shadow roots
      const childElements = element.querySelectorAll('*');
      for (const childElement of childElements) {
        this.traverseShadowDOMForTextNodes(childElement, textNodes);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error traversing shadow DOM for text nodes:', error);
    }
  }

  /**
   * Create a range for a text node, handling cross-boundary scenarios
   * @param {Text} textNode - Text node to create range for
   * @returns {Range|null} - Range object or null if creation fails
   */
  createRangeForTextNode(textNode) {
    try {
      // Determine which document to use for range creation
      const ownerDocument = textNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      range.selectNodeContents(textNode);
      return range;
    } catch (error) {
      console.warn('[KeyPilot] Error creating range for text node:', error);
      return null;
    }
  }

  /**
   * Check if an element is non-selectable (images, buttons, inputs, etc.)
   * @param {Element} element - Element to check
   * @returns {boolean} - True if element should be skipped for text selection
   */
  isNonSelectableElement(element) {
    if (!element || !element.tagName) return true;
    
    const tagName = element.tagName.toLowerCase();
    
    // Skip form controls, media, and interactive elements
    const nonSelectableTags = [
      'img', 'video', 'audio', 'canvas', 'svg',
      'input', 'button', 'select', 'textarea',
      'iframe', 'embed', 'object'
    ];
    
    if (nonSelectableTags.includes(tagName)) {
      return true;
    }
    
    // Skip elements with specific roles
    const role = element.getAttribute('role');
    if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) {
      return true;
    }
    
    // Skip contenteditable elements (they handle their own selection)
    if (element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate the text offset within a text node at the given screen coordinates
   * @param {Text} textNode - The text node
   * @param {number} x - Screen X coordinate  
   * @param {number} y - Screen Y coordinate
   * @returns {number} - Character offset within the text node
   */
  getTextOffsetAtPosition(textNode, x, y) {
    try {
      const text = textNode.textContent;
      if (!text) return 0;

      // Binary search to find the closest character position
      let left = 0;
      let right = text.length;
      let bestOffset = 0;
      let bestDistance = Infinity;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        try {
          // Create range at this offset
          const range = document.createRange();
          range.setStart(textNode, mid);
          range.setEnd(textNode, Math.min(mid + 1, text.length));
          
          const rect = range.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            // Empty rect, try next position
            left = mid + 1;
            continue;
          }
          
          // Calculate distance from cursor to character position
          const charX = rect.left + rect.width / 2;
          const charY = rect.top + rect.height / 2;
          const distance = Math.sqrt(Math.pow(x - charX, 2) + Math.pow(y - charY, 2));
          
          if (distance < bestDistance) {
            bestDistance = distance;
            bestOffset = mid;
          }
          
          // Adjust search range based on position
          if (x < charX) {
            right = mid - 1;
          } else {
            left = mid + 1;
          }
        } catch (error) {
          // Skip problematic positions
          left = mid + 1;
        }
      }
      
      return bestOffset;
    } catch (error) {
      console.warn('[KeyPilot] Error calculating text offset:', error);
      return 0;
    }
  }

  handleRootKey() {
    console.log('[KeyPilot] Root key pressed!');
    console.log('[KeyPilot] Current URL:', window.location.href);
    console.log('[KeyPilot] Origin:', window.location.origin);

    // Navigate to the site root (origin)
    const rootUrl = window.location.origin;
    if (rootUrl && rootUrl !== window.location.href) {
      console.log('[KeyPilot] Navigating to root:', rootUrl);
      this.showFlashNotification('Navigating to Site Root...', COLORS.NOTIFICATION_INFO);
      window.location.href = rootUrl;
    } else {
      console.log('[KeyPilot] Already at root, no navigation needed');
    }
  }

  handleCloseTabKey() {
    console.log('[KeyPilot] Close tab key pressed!');
    
    try {
      // Send message to background script to close the current tab
      chrome.runtime.sendMessage({ type: 'KP_CLOSE_TAB' });
      this.showFlashNotification('Closing Tab...', COLORS.NOTIFICATION_INFO);
    } catch (error) {
      console.error('[KeyPilot] Failed to close tab:', error);
      this.showFlashNotification('Failed to Close Tab', COLORS.NOTIFICATION_ERROR);
    }
  }

  handleActivateKey() {
    const currentState = this.state.getState();
    const target = currentState.focusEl ||
      this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

    if (!target || target === document.documentElement || target === document.body) {
      return;
    }

    console.log('[KeyPilot] Activating element:', {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      hasClickHandler: !!(target.onclick || target.getAttribute('onclick'))
    });

    // Try semantic activation first
    if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      this.overlayManager.flashFocusOverlay();
      return;
    }

    // Always try to click the element, regardless of whether it's "detected" as interactive
    // This ensures videos, custom elements, and other non-standard interactive elements work
    this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
    this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
    this.overlayManager.flashFocusOverlay();
  }

  deleteElement(element) {
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

  handleEscapeFromTextFocus(currentState) {
    console.debug('Escape pressed in text focus mode');

    // Check if there's a clickable element under the cursor
    if (currentState.focusEl) {
      console.debug('Clickable element found, activating it instead of exiting text focus');
      
      // Activate the clickable element
      const target = currentState.focusEl;
      
      // Try semantic activation first
      if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
        this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
        this.overlayManager.flashFocusOverlay();
        return;
      }

      // Fallback to click
      this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      this.overlayManager.flashFocusOverlay();
      return;
    }

    // No clickable element, exit text focus mode
    console.debug('No clickable element, exiting text focus mode');

    // Use the simple, proven approach that works in DevTools
    // Blur the active element and set focus to the body
    if (document.activeElement) {
      document.activeElement.blur();
    }
    document.body.focus();

    // Clear the text focus state
    this.focusDetector.clearTextFocus();

    console.debug('Text focus escape completed');
  }

  /**
   * Cancel all active modes and return to normal mode
   * Handles mode-specific cleanup logic
   */
  cancelModes() {
    const currentState = this.state.getState();
    
    console.log('[KeyPilot] Canceling modes, current mode:', currentState.mode);
    
    // Handle highlight mode cancellation specifically
    if (currentState.mode === MODES.HIGHLIGHT) {
      this.cancelHighlightMode();
      return;
    }
    
    // Don't reset if we're in text focus mode - that should only be cleared by ESC or blur
    if (currentState.mode !== MODES.TEXT_FOCUS) {
      this.state.reset();
    }
  }

  showRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = CSS_CLASSES.RIPPLE;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  showFlashNotification(message, backgroundColor = COLORS.NOTIFICATION_SUCCESS) {
    try {
      // Validate input parameters
      if (!message || typeof message !== 'string') {
        console.warn('[KeyPilot] Invalid message provided to showFlashNotification:', message);
        return;
      }
      
      if (!backgroundColor || typeof backgroundColor !== 'string') {
        console.warn('[KeyPilot] Invalid backgroundColor provided, using default');
        backgroundColor = COLORS.NOTIFICATION_SUCCESS;
      }
      
      // Validate document availability
      if (!document || !document.body) {
        console.warn('[KeyPilot] Document or document.body not available for notification');
        return;
      }
      
      // Create notification overlay with error handling
      let notification = null;
      try {
        notification = document.createElement('div');
        if (!notification) {
          throw new Error('Failed to create notification element');
        }
      } catch (createError) {
        console.error('[KeyPilot] Error creating notification element:', createError);
        return;
      }
      
      notification.className = 'kpv2-flash-notification';
      notification.textContent = message;
      
      // Style the notification with error handling
      try {
        Object.assign(notification.style, {
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: backgroundColor,
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: '2147483647',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          opacity: '0',
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: 'none',
          maxWidth: '400px',
          wordWrap: 'break-word',
          textAlign: 'center'
        });
      } catch (styleError) {
        console.error('[KeyPilot] Error styling notification:', styleError);
        // Continue with basic styling
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.backgroundColor = backgroundColor;
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.zIndex = '2147483647';
      }

      // Add to document with error handling
      try {
        document.body.appendChild(notification);
      } catch (appendError) {
        console.error('[KeyPilot] Error appending notification to document:', appendError);
        return;
      }

      // Fade in with error handling
      try {
        requestAnimationFrame(() => {
          try {
            notification.style.opacity = '1';
          } catch (fadeInError) {
            console.warn('[KeyPilot] Error fading in notification:', fadeInError);
          }
        });
      } catch (animationError) {
        console.warn('[KeyPilot] Error setting up fade in animation:', animationError);
        // Show notification immediately without animation
        notification.style.opacity = '1';
      }

      // Fade out and remove after appropriate duration based on message type
      const duration = backgroundColor === COLORS.NOTIFICATION_ERROR ? 4000 : 2000; // Show errors longer
      
      setTimeout(() => {
        try {
          if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
              try {
                if (notification && notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              } catch (removeError) {
                console.warn('[KeyPilot] Error removing notification:', removeError);
              }
            }, 300);
          }
        } catch (fadeOutError) {
          console.warn('[KeyPilot] Error fading out notification:', fadeOutError);
          // Try to remove immediately
          try {
            if (notification && notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          } catch (immediateRemoveError) {
            console.warn('[KeyPilot] Error removing notification immediately:', immediateRemoveError);
          }
        }
      }, duration);
      
    } catch (error) {
      console.error('[KeyPilot] Unexpected error showing flash notification:', error);
      
      // Fallback: try to show a basic alert if available
      try {
        if (window.alert && typeof window.alert === 'function') {
          window.alert(`KeyPilot: ${message}`);
        }
      } catch (alertError) {
        console.error('[KeyPilot] Even alert fallback failed:', alertError);
      }
    }
  }

  updateOverlays(focusEl, deleteEl) {
    const currentState = this.state.getState();
    this.overlayManager.updateOverlays(focusEl, deleteEl, currentState.mode, currentState.focusedTextElement);
  }

  logPerformanceMetrics() {
    const now = Date.now();
    const timeSinceLastLog = now - this.performanceMetrics.lastMetricsLog;
    
    if (timeSinceLastLog < 10000) return; // Only log every 10 seconds
    
    const intersectionMetrics = this.intersectionManager.getMetrics();
    const scrollMetrics = this.scrollManager.getScrollMetrics();
    
    console.group('[KeyPilot] Performance Metrics');
    console.log('Mouse Queries:', this.performanceMetrics.mouseQueries);
    console.log('Intersection Observer Cache Hit Rate:', intersectionMetrics.cacheHitRate);
    console.log('Visible Interactive Elements:', intersectionMetrics.visibleElements);
    console.log('Scroll Throttle Ratio:', scrollMetrics.throttleRatio);
    console.log('Average Scroll Duration:', `${scrollMetrics.averageScrollDuration.toFixed(1)}ms`);
    console.groupEnd();
    
    this.performanceMetrics.lastMetricsLog = now;
  }

  /**
   * Enable KeyPilot functionality
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    
    // Only initialize if initialization is complete
    if (this.initializationComplete) {
      // Restart event listeners
      this.start();
      
      // Show cursor
      if (this.cursor) {
        this.cursor.show();
      }
      
      // Restart focus detector
      if (this.focusDetector) {
        this.focusDetector.start();
      }
      
      // Restart intersection manager
      if (this.intersectionManager) {
        this.intersectionManager.init();
      }
      
      // Restart scroll manager
      if (this.scrollManager) {
        this.scrollManager.init();
      }
      
      // Reset state to normal mode
      this.state.reset();
    }
    
    console.log('[KeyPilot] Extension enabled');
  }

  /**
   * Disable KeyPilot functionality
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    // Only cleanup if initialization is complete
    if (this.initializationComplete) {
      // Stop event listeners
      this.stop();
      
      // Hide cursor
      if (this.cursor) {
        this.cursor.hide();
      }
      
      // Hide all overlays
      if (this.overlayManager) {
        this.overlayManager.hideFocusOverlay();
        this.overlayManager.hideDeleteOverlay();
      }
      
      // Stop focus detector
      if (this.focusDetector) {
        this.focusDetector.stop();
      }
      
      // Clean up intersection manager
      if (this.intersectionManager) {
        this.intersectionManager.cleanup();
      }
      
      // Clean up scroll manager
      if (this.scrollManager) {
        this.scrollManager.cleanup();
      }
      
      // Clear any active state
      this.state.reset();
    }
    
    console.log('[KeyPilot] Extension disabled');
  }

  /**
   * Initialize cursor position to center of viewport if not already set
   */
  initializeCursorPosition() {
    const currentState = this.state.getState();
    
    // If mouse position hasn't been set yet (still at 0,0), initialize to center
    if (currentState.lastMouse.x === 0 && currentState.lastMouse.y === 0) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      console.log('[KeyPilot] Initializing cursor position to viewport center:', centerX, centerY);
      
      this.state.setMousePosition(centerX, centerY);
      this.cursor.updatePosition(centerX, centerY);
    }
  }

  /**
   * Check if KeyPilot is currently enabled
   */
  isEnabled() {
    return this.enabled;
  }

  cleanup() {
    this.stop();

    // Clean up intersection observer optimizations
    if (this.intersectionManager) {
      this.intersectionManager.cleanup();
    }
    
    if (this.scrollManager) {
      this.scrollManager.cleanup();
    }

    if (this.focusDetector) {
      this.focusDetector.stop();
    }

    if (this.cursor) {
      this.cursor.cleanup();
    }

    if (this.overlayManager) {
      this.overlayManager.cleanup();
    }

    if (this.styleManager) {
      this.styleManager.cleanup();
    }

    if (this.shadowDOMManager) {
      this.shadowDOMManager.cleanup();
    }
    
    // Remove custom event listeners
    document.removeEventListener('keypilot:scroll-end', this.handleScrollEnd);
  }
}


  // Module: src/content-script.js
/**
 * Content script entry point
 */
// Initialize KeyPilot with toggle functionality
async function initializeKeyPilot() {
  try {
    // Create KeyPilot instance
    const keyPilot = new KeyPilot();
    
    // Create toggle handler and wrap KeyPilot instance
    const toggleHandler = new KeyPilotToggleHandler(keyPilot);
    
    // Initialize toggle handler (queries service worker for state)
    await toggleHandler.initialize();
    
    // Store reference globally for debugging
    window.__KeyPilotToggleHandler = toggleHandler;
    
  } catch (error) {
    console.error('[KeyPilot] Failed to initialize with toggle functionality:', error);
    
    // Fallback: initialize KeyPilot without toggle functionality
    try {
      new KeyPilot();
      console.warn('[KeyPilot] Initialized without toggle functionality as fallback');
    } catch (fallbackError) {
      console.error('[KeyPilot] Complete initialization failure:', fallbackError);
    }
  }
}

// Initialize KeyPilot
initializeKeyPilot();


})();
