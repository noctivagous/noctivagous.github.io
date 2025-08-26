/**
 * KeyPilot Chrome Extension - Main Content Script Bundle
 * Generated on 2025-08-26T00:18:27.831Z
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
  ROOT: ['`', 'Backquote'],
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
  HIDDEN: 'kpv2-hidden',
  RIPPLE: 'kpv2-ripple',
  FOCUS_OVERLAY: 'kpv2-focus-overlay',
  DELETE_OVERLAY: 'kpv2-delete-overlay',
  TEXT_FIELD_GLOW: 'kpv2-text-field-glow'
};

const ELEMENT_IDS = {
  CURSOR: 'kpv2-cursor',
  STYLE: 'kpv2-style',
  HUD: 'kpv2-hud'
};

const Z_INDEX = {
  OVERLAYS: 2147483646,
  CURSOR: 2147483647
};

const MODES = {
  NONE: 'none',
  DELETE: 'delete',
  TEXT_FOCUS: 'text_focus'
};

const COLORS = {
  FOCUS: 'rgba(0,180,0,0.95)',
  DELETE: 'rgba(220,0,0,0.95)',
  RIPPLE: 'rgba(0,200,0,0.35)'
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
      isInitialized: false,
      hud: {
        visible: true,        // HUD visibility state
        expanded: false,      // HUD expansion state (collapsed by default)
        activeTab: 'basic'    // Currently active tab in expanded view
      }
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

  clearElements() {
    this.setState({ 
      focusEl: null, 
      deleteEl: null 
    });
  }

  isDeleteMode() {
    return this.state.mode === MODES.DELETE;
  }

  isTextFocusMode() {
    return this.state.mode === MODES.TEXT_FOCUS;
  }

  reset() {
    this.setState({
      mode: MODES.NONE,
      focusEl: null,
      deleteEl: null,
      hud: {
        visible: true,
        expanded: false,
        activeTab: 'basic'
      }
    });
  }

  // HUD-specific state methods
  setHUDVisible(visible) {
    this.setState({ 
      hud: { ...this.state.hud, visible } 
    });
  }

  setHUDExpanded(expanded) {
    this.setState({ 
      hud: { ...this.state.hud, expanded } 
    });
  }

  setHUDActiveTab(activeTab) {
    this.setState({ 
      hud: { ...this.state.hud, activeTab } 
    });
  }

  // HUD convenience methods
  getHUDState() {
    return { ...this.state.hud };
  }

  isHUDVisible() {
    return this.state.hud.visible;
  }

  isHUDExpanded() {
    return this.state.hud.expanded;
  }

  getHUDActiveTab() {
    return this.state.hud.activeTab;
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
    this.currentMode = 'none';
    this.isEnhanced = false;
    this.stateBridge = null;
  }

  ensure() {
    if (this.cursorEl) return;
    
    const wrap = this.createElement('div', { 
      id: 'kpv2-cursor', 
      'aria-hidden': 'true' 
    });
    wrap.appendChild(this.buildSvg('none'));
    document.body.appendChild(wrap);
    this.cursorEl = wrap;
    
    // Start monitoring for stuck cursor
    this.startStuckDetection();
  }

  /**
   * Enhance existing cursor placeholder element with full functionality
   */
  enhanceExistingElement(existingElement, stateBridge = null) {
    try {
      if (!existingElement) {
        console.warn('[CursorManager] No existing element to enhance');
        return false;
      }
      
      console.log('[CursorManager] Enhancing existing cursor element');
      
      // Store state bridge reference for cursor mode persistence
      this.stateBridge = stateBridge;
      
      // Use the existing element as our cursor
      this.cursorEl = existingElement;
      
      // Ensure it has the correct ID and attributes
      this.cursorEl.id = 'kpv2-cursor';
      this.cursorEl.setAttribute('aria-hidden', 'true');
      
      // Detect and preserve current cursor mode from placeholder
      const preservedMode = this.detectPlaceholderMode(existingElement);
      this.currentMode = preservedMode;
      
      // Replace content with proper SVG if needed, preserving mode
      const currentSvg = this.cursorEl.querySelector('svg');
      if (!currentSvg || !this.isValidCursorSvg(currentSvg)) {
        this.cursorEl.replaceChildren(this.buildSvg(this.currentMode));
      } else {
        // Update current mode based on existing SVG
        this.currentMode = this.getCurrentModeFromSvg(currentSvg);
      }
      
      // Ensure proper positioning styles
      this.cursorEl.style.position = 'fixed';
      this.cursorEl.style.pointerEvents = 'none';
      this.cursorEl.style.zIndex = '2147483647';
      this.cursorEl.style.display = 'block';
      this.cursorEl.style.visibility = 'visible';
      
      // Restore cursor state if available from state bridge
      if (this.stateBridge) {
        this.restoreCursorStateFromBridge();
        
        // Try to restore cursor position after a brief delay to allow page to settle
        setTimeout(() => {
          this.restoreCursorPosition();
        }, 100);
      }
      
      // Start monitoring for stuck cursor
      this.startStuckDetection();
      
      // Mark as enhanced
      this.isEnhanced = true;
      
      console.log('[CursorManager] Cursor element enhanced successfully with mode:', this.currentMode);
      return true;
      
    } catch (error) {
      console.error('[CursorManager] Failed to enhance existing element:', error);
      return false;
    }
  }

  /**
   * Detect cursor mode from placeholder element
   */
  detectPlaceholderMode(element) {
    try {
      // Check for data attributes that might indicate mode
      const modeAttr = element.getAttribute('data-cursor-mode');
      if (modeAttr) {
        return modeAttr;
      }
      
      // Check SVG content to determine mode
      const svg = element.querySelector('svg');
      if (svg) {
        return this.getCurrentModeFromSvg(svg);
      }
      
      // Default to normal mode
      return 'none';
    } catch (error) {
      console.warn('[CursorManager] Failed to detect placeholder mode:', error);
      return 'none';
    }
  }

  /**
   * Get current mode from SVG element
   */
  getCurrentModeFromSvg(svg) {
    try {
      if (!svg || svg.tagName !== 'svg') return 'none';
      
      const lines = svg.querySelectorAll('line');
      if (lines.length === 2) {
        // Check if it's an X pattern (delete mode)
        const line1 = lines[0];
        const line2 = lines[1];
        if (this.isXPattern(line1, line2)) {
          return 'delete';
        }
      } else if (lines.length === 4) {
        // Check if it's orange (text focus) or green (normal)
        const firstLine = lines[0];
        const stroke = firstLine.getAttribute('stroke');
        if (stroke && (stroke.includes('255,140,0') || stroke.includes('#ff8c00'))) {
          return 'text_focus';
        }
        return 'none'; // Green crosshair
      }
      
      return 'none';
    } catch (error) {
      console.warn('[CursorManager] Failed to get mode from SVG:', error);
      return 'none';
    }
  }

  /**
   * Check if two lines form an X pattern
   */
  isXPattern(line1, line2) {
    try {
      const x1_1 = parseFloat(line1.getAttribute('x1'));
      const y1_1 = parseFloat(line1.getAttribute('y1'));
      const x2_1 = parseFloat(line1.getAttribute('x2'));
      const y2_1 = parseFloat(line1.getAttribute('y2'));
      
      const x1_2 = parseFloat(line2.getAttribute('x1'));
      const y1_2 = parseFloat(line2.getAttribute('y1'));
      const x2_2 = parseFloat(line2.getAttribute('x2'));
      const y2_2 = parseFloat(line2.getAttribute('y2'));
      
      // Check if lines form diagonal pattern (X)
      const isDiagonal1 = Math.abs((y2_1 - y1_1) / (x2_1 - x1_1)) > 0.5;
      const isDiagonal2 = Math.abs((y2_2 - y1_2) / (x2_2 - x1_2)) > 0.5;
      
      return isDiagonal1 && isDiagonal2;
    } catch (error) {
      return false;
    }
  }

  /**
   * Restore cursor state from state bridge
   */
  restoreCursorStateFromBridge() {
    try {
      if (!this.stateBridge) return;
      
      const earlyState = this.stateBridge.getEarlyState();
      if (earlyState && earlyState.cursorMode) {
        this.currentMode = earlyState.cursorMode;
        console.log('[CursorManager] Restored cursor mode from state bridge:', this.currentMode);
      }
    } catch (error) {
      console.warn('[CursorManager] Failed to restore cursor state from bridge:', error);
    }
  }

  /**
   * Check if an SVG element is a valid cursor SVG
   */
  isValidCursorSvg(svg) {
    try {
      if (!svg || svg.tagName !== 'svg') return false;
      
      // Check if it has the expected viewBox and dimensions
      const viewBox = svg.getAttribute('viewBox');
      if (!viewBox) return false;
      
      // Check for expected line elements (crosshair or X)
      const lines = svg.querySelectorAll('line');
      return lines.length >= 2; // At least 2 lines for any cursor mode
      
    } catch (error) {
      return false;
    }
  }

  setMode(mode) {
    if (!this.cursorEl) return;
    
    // Update current mode
    this.currentMode = mode;
    
    // Update SVG content
    this.cursorEl.replaceChildren(this.buildSvg(mode));
    
    // Add data attribute for mode tracking
    this.cursorEl.setAttribute('data-cursor-mode', mode);
    
    // Persist mode to state bridge if available
    if (this.stateBridge && this.isEnhanced) {
      this.persistCursorMode(mode);
    }
    
    console.log('[CursorManager] Cursor mode set to:', mode);
  }

  /**
   * Persist cursor mode to state bridge for navigation persistence
   */
  persistCursorMode(mode) {
    try {
      if (!this.stateBridge) return;
      
      // Update state bridge with new cursor mode
      this.stateBridge.handleCursorModeUpdate(mode);
      
      // Sync cursor state across tabs
      this.stateBridge.syncCursorStateAcrossTabs({
        mode: mode,
        timestamp: Date.now()
      }).catch(error => {
        console.warn('[CursorManager] Failed to sync cursor state across tabs:', error);
      });
      
      console.log('[CursorManager] Cursor mode persisted:', mode);
    } catch (error) {
      console.warn('[CursorManager] Failed to persist cursor mode:', error);
    }
  }

  get element() {
    return this.cursorEl;
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
    const deltaX = Math.abs(rect.left + rect.width/2 - expectedX);
    const deltaY = Math.abs(rect.top + rect.height/2 - expectedY);
    
    if (deltaX > 5 || deltaY > 5) {
      this.isStuck = true;
      this.forceUpdateCount++;
      
      if (window.KEYPILOT_DEBUG) {
        console.warn('[KeyPilot] Cursor appears stuck, forcing update', {
          expected: this.lastPosition,
          actual: { x: rect.left + rect.width/2, y: rect.top + rect.height/2 },
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
    this.setMode(currentMode);
    this.forceUpdatePosition(x, y);
    
    // Reset counters
    this.forceUpdateCount = 0;
    this.isStuck = false;
  }

  getCurrentMode() {
    // Return cached mode if available
    if (this.currentMode) {
      return this.currentMode;
    }
    
    if (!this.cursorEl) return 'none';
    
    // Check data attribute first
    const modeAttr = this.cursorEl.getAttribute('data-cursor-mode');
    if (modeAttr) {
      this.currentMode = modeAttr;
      return this.currentMode;
    }
    
    // Fallback to SVG analysis
    this.currentMode = this.getCurrentModeFromSvg(this.cursorEl.querySelector('svg'));
    return this.currentMode;
  }

  buildSvg(mode) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    
    if (mode === 'text_focus') {
      // Larger SVG for text mode with message in lower right quadrant
      svg.setAttribute('viewBox', '0 0 200 140');
      svg.setAttribute('width', '200');
      svg.setAttribute('height', '140');
      
      const addLine = (x1, y1, x2, y2, color, w = '4') => {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', color); ln.setAttribute('stroke-width', w);
        ln.setAttribute('stroke-linecap', 'round');
        svg.appendChild(ln);
      };

      // Orange crosshair at center - same size as normal mode
      const centerX = 100; // Center of the SVG
      const centerY = 70;  // Center of the SVG
      const col = '#ff8c00'; // Orange color
      // Same dimensions as normal mode: arms extend ±24 pixels from center
      addLine(centerX, centerY - 24, centerX, centerY - 10, col);
      addLine(centerX, centerY + 10, centerX, centerY + 24, col);
      addLine(centerX - 24, centerY, centerX - 10, centerY, col);
      addLine(centerX + 10, centerY, centerX + 24, centerY, col);

      // Background for message in lower right quadrant
      const bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('x', '110');  // Right side of crosshair
      bg.setAttribute('y', '95');   // Lower quadrant
      bg.setAttribute('width', '85');
      bg.setAttribute('height', '40');
      bg.setAttribute('rx', '6');
      bg.setAttribute('fill', 'rgba(0,0,0,0.85)');
      bg.setAttribute('stroke', 'rgba(255,140,0,0.4)');
      bg.setAttribute('stroke-width', '1');
      svg.appendChild(bg);
      
      // First line of text message
      const text1 = document.createElementNS(NS, 'text');
      text1.setAttribute('x', '152.5'); // Center of message box
      text1.setAttribute('y', '108');   // First line position
      text1.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text1.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text1.setAttribute('font-size', '10');
      text1.setAttribute('font-weight', '500');
      text1.setAttribute('text-anchor', 'middle');
      text1.textContent = 'Cursor is in a text field.';
      svg.appendChild(text1);
      
      // Second line of text message
      const text2 = document.createElementNS(NS, 'text');
      text2.setAttribute('x', '152.5'); // Center of message box
      text2.setAttribute('y', '122');   // Second line position
      text2.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text2.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text2.setAttribute('font-size', '10');
      text2.setAttribute('font-weight', '500');
      text2.setAttribute('text-anchor', 'middle');
      text2.textContent = 'Press ESC to exit.';
      svg.appendChild(text2);
      
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
    
    svg.setAttribute('xmlns', NS);
    return svg;
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

  /**
   * Set state bridge for cursor mode persistence
   */
  setStateBridge(stateBridge) {
    this.stateBridge = stateBridge;
    
    // Restore cursor state if we have an existing cursor
    if (this.cursorEl && this.stateBridge) {
      this.restoreCursorStateFromBridge();
    }
  }

  /**
   * Handle navigation state persistence
   * Called before page navigation to save cursor state
   */
  handleNavigationPersistence() {
    try {
      if (!this.stateBridge) return;
      
      // Save current cursor mode
      this.stateBridge.handleCursorModeUpdate(this.currentMode);
      
      // Save current cursor position
      this.stateBridge.saveCursorPosition(this.lastPosition.x, this.lastPosition.y);
      
      console.log('[CursorManager] Navigation state prepared:', {
        mode: this.currentMode,
        position: this.lastPosition
      });
    } catch (error) {
      console.warn('[CursorManager] Failed to handle navigation persistence:', error);
    }
  }

  /**
   * Restore cursor position when possible
   * Called after navigation to restore cursor state
   */
  restoreCursorPosition() {
    try {
      if (!this.stateBridge) return false;
      
      const savedPosition = this.stateBridge.getSavedCursorPosition();
      if (savedPosition) {
        const { x, y } = savedPosition;
        
        // Only restore if position is reasonable (within viewport)
        if (x >= 0 && y >= 0 && x <= window.innerWidth && y <= window.innerHeight) {
          this.updatePosition(x, y);
          console.log('[CursorManager] Cursor position restored:', { x, y });
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.warn('[CursorManager] Failed to restore cursor position:', error);
      return false;
    }
  }

  /**
   * Handle cursor state synchronization across tabs
   */
  handleCrossTabSync(syncData) {
    try {
      if (!syncData) return;
      
      // Update cursor mode if it changed in another tab
      if (syncData.cursorMode && syncData.cursorMode !== this.currentMode) {
        this.setMode(syncData.cursorMode);
        console.log('[CursorManager] Cursor mode synced from another tab:', syncData.cursorMode);
      }
      
      // Note: Position sync is not implemented as it would be disorienting
      // Each tab maintains its own cursor position
      
    } catch (error) {
      console.warn('[CursorManager] Failed to handle cross-tab sync:', error);
    }
  }

  /**
   * Get cursor state for persistence
   */
  getCursorState() {
    return {
      mode: this.currentMode,
      position: { ...this.lastPosition },
      isEnhanced: this.isEnhanced,
      timestamp: Date.now()
    };
  }

  /**
   * Set cursor state from persistence
   */
  setCursorState(state) {
    try {
      if (!state) return false;
      
      // Restore mode
      if (state.mode && state.mode !== this.currentMode) {
        this.setMode(state.mode);
      }
      
      // Restore position if reasonable
      if (state.position && state.position.x >= 0 && state.position.y >= 0) {
        this.updatePosition(state.position.x, state.position.y);
      }
      
      console.log('[CursorManager] Cursor state restored:', state);
      return true;
    } catch (error) {
      console.warn('[CursorManager] Failed to set cursor state:', error);
      return false;
    }
  }

  cleanup() {
    // Save state before cleanup if we have a state bridge
    if (this.stateBridge && this.isEnhanced) {
      this.handleNavigationPersistence();
    }
    
    if (this.stuckCheckInterval) {
      clearInterval(this.stuckCheckInterval);
      this.stuckCheckInterval = null;
    }
    
    if (this.cursorEl) {
      this.cursorEl.remove();
      this.cursorEl = null;
    }
    
    // Reset state
    this.currentMode = 'none';
    this.isEnhanced = false;
    this.stateBridge = null;
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
    this.CLICKABLE_ROLES = ['link', 'button'];
    this.CLICKABLE_SEL = 'a[href], button, input, select, textarea';
    this.FOCUSABLE_SEL = 'a[href], button, input, select, textarea, [contenteditable="true"]';
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
    
    // Debug logging
    if (window.KEYPILOT_DEBUG && (matchesSelector || hasRole)) {
      console.log('[KeyPilot Debug] isLikelyInteractive:', {
        tagName: el.tagName,
        href: el.href,
        matchesSelector: matchesSelector,
        role: role,
        hasRole: hasRole,
        selector: this.FOCUSABLE_SEL
      });
    }
    
    return matchesSelector || hasRole;
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
      } catch {}
    }

    // Fallback: synthesize realistic event sequence
    return this.synthesizeClickSequence(activator, clientX, clientY);
  }

  synthesizeClickSequence(activator, clientX, clientY) {
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
      try { 
        activator.dispatchEvent(new Ctor(type, opts)); 
      } catch {}
    };

    // Event sequence for realistic interaction
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

  handleSmartActivate(target, x, y) {
    if (!target) return false;

    // Handle label elements
    target = this.resolveLabel(target);

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

    if (this.detector.isTextLike(target)) {
      return this.handleTextField(target);
    }

    if (this.detector.isContentEditable(target)) {
      return this.handleContentEditable(target);
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
    
    // Clean up any remaining glow
    if (this.currentFocusedElement) {
      this.currentFocusedElement.classList.remove(CSS_CLASSES.TEXT_FIELD_GLOW);
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
      console.debug('Text input blurred:', e.target.tagName, e.target.type || 'N/A');
      // Small delay to allow for focus changes
      setTimeout(() => {
        const currentlyFocused = this.getDeepActiveElement();
        if (!this.isTextInput(currentlyFocused)) {
          this.clearTextFocus();
        }
      }, 10);
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
    // Remove glow from previous element if any
    if (this.currentFocusedElement && this.currentFocusedElement !== element) {
      this.currentFocusedElement.classList.remove(CSS_CLASSES.TEXT_FIELD_GLOW);
    }
    
    this.currentFocusedElement = element;
    
    // Add glow to the focused text field
    element.classList.add(CSS_CLASSES.TEXT_FIELD_GLOW);
    
    this.state.setMode('text_focus');
    this.state.setState({ focusedTextElement: element });
  }

  clearTextFocus() {
    // Remove glow from the previously focused element
    if (this.currentFocusedElement) {
      this.currentFocusedElement.classList.remove(CSS_CLASSES.TEXT_FIELD_GLOW);
    }
    
    this.currentFocusedElement = null;
    this.state.setMode('none');
    this.state.setState({ focusedTextElement: null });
  }

  isInTextFocus() {
    return this.state.getState().mode === 'text_focus';
  }

  getFocusedElement() {
    return this.currentFocusedElement;
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
    
    // Intersection observer for overlay visibility optimization
    this.overlayObserver = null;
    
    // Track overlay visibility state
    this.overlayVisibility = {
      focus: true,
      delete: true
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
          }
        });
      },
      {
        rootMargin: '10px',
        threshold: [0, 1.0]
      }
    );
  }

  updateOverlays(focusEl, deleteEl, mode) {
    // Debug logging when debug mode is enabled
    if (window.KEYPILOT_DEBUG && focusEl) {
      console.log('[KeyPilot Debug] Updating overlays:', {
        focusElement: focusEl.tagName,
        mode: mode,
        willShowFocus: mode === 'none' || mode === 'text_focus'
      });
    }
    
    // Show focus overlay in normal mode AND text focus mode
    if (mode === 'none' || mode === 'text_focus') {
      this.updateFocusOverlay(focusEl);
    } else {
      this.hideFocusOverlay();
    }
    
    // Only show delete overlay in delete mode
    if (mode === 'delete') {
      this.updateDeleteOverlay(deleteEl);
    } else {
      this.hideDeleteOverlay();
    }
  }

  updateFocusOverlay(element) {
    if (!element) {
      this.hideFocusOverlay();
      return;
    }

    // Debug logging
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateFocusOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        text: element.textContent?.substring(0, 30)
      });
    }

    if (!this.focusOverlay) {
      this.focusOverlay = this.createElement('div', {
        className: CSS_CLASSES.FOCUS_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid rgba(0,180,0,0.95);
          box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5);
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
    console.log('[KeyPilot Debug] updateDeleteOverlay called with element:', element);
    
    if (!element) {
      console.log('[KeyPilot Debug] No element provided, hiding delete overlay');
      this.hideDeleteOverlay();
      return;
    }

    if (!this.deleteOverlay) {
      console.log('[KeyPilot Debug] Creating delete overlay');
      this.deleteOverlay = this.createElement('div', {
        className: CSS_CLASSES.DELETE_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid rgba(220,0,0,0.95);
          box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45);
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.deleteOverlay);
      
      // Reset visibility to true when creating new overlay
      this.overlayVisibility.delete = true;
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.deleteOverlay);
      }
    }

    const rect = this.getBestRect(element);
    console.log('[KeyPilot Debug] Delete overlay rect:', rect, 'visibility:', this.overlayVisibility.delete);
    
    if (rect.width > 0 && rect.height > 0) {
      // Use transform for better performance during scroll
      this.deleteOverlay.style.transform = `translate(${rect.left}px, ${rect.top}px)`;
      this.deleteOverlay.style.width = `${rect.width}px`;
      this.deleteOverlay.style.height = `${rect.height}px`;
      this.deleteOverlay.style.display = 'block';
      
      console.log('[KeyPilot Debug] Delete overlay positioned and displayed');
      
      // Always make visible when actively updating (override observer optimization)
      this.deleteOverlay.style.visibility = 'visible';
      this.overlayVisibility.delete = true;
      console.log('[KeyPilot Debug] Delete overlay made visible (forced)');
    } else {
      console.log('[KeyPilot Debug] Invalid rect dimensions, hiding delete overlay');
      this.hideDeleteOverlay();
    }
  }

  hideDeleteOverlay() {
    if (this.deleteOverlay) {
      this.deleteOverlay.style.display = 'none';
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

  cleanup() {
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }
    
    if (this.focusOverlay) {
      this.focusOverlay.remove();
      this.focusOverlay = null;
    }
    if (this.deleteOverlay) {
      this.deleteOverlay.remove();
      this.deleteOverlay = null;
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

    // Don't put CSS comments inside the css variable.
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
        background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.22) 60%, rgba(0,200,0,0) 70%); 
        animation: kpv2-ripple 420ms ease-out forwards; 
      }
      
      .${CSS_CLASSES.FOCUS_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid rgba(0,180,0,0.95); 
        box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5); 
        background: transparent; 
      }
      
      .${CSS_CLASSES.DELETE_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid rgba(220,0,0,0.95); 
        box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45); 
        background: transparent; 
      }
      
      .${CSS_CLASSES.TEXT_FIELD_GLOW} { 
        outline: 2px solid rgba(255,165,0,0.8) !important;
        outline-offset: 2px !important;
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
      
      
      .kpv2-hud {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        min-width: 200px;
        max-width: 300px;
        pointer-events: auto;
      }
      
      /* Status Bar */
      .kpv2-hud-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      /* Mode Indicator */
      .kpv2-hud-mode-indicator {
        flex: 1;
      }
      
      .kpv2-hud-mode-text {
        color: #fff;
        font-weight: 500;
        font-size: 12px;
      }
      
      /* Controls Section */
      .kpv2-hud-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      /* Toggle Switches */
      .kpv2-hud-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        cursor: pointer;
      }
      
      .kpv2-hud-toggle-input {
        width: 32px;
        height: 16px;
        appearance: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        position: relative;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .kpv2-hud-toggle-input:checked {
        background: #4CAF50;
      }
      
      .kpv2-hud-toggle-input::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: transform 0.2s ease;
      }
      
      .kpv2-hud-toggle-input:checked::before {
        transform: translateX(16px);
      }
      
      .kpv2-hud-toggle-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 10px;
        font-weight: 400;
        user-select: none;
      }
      
      /* Expand Button */
      .kpv2-hud-expand-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.2s ease, background-color 0.2s ease;
        margin-left: 8px;
      }
      
      .kpv2-hud-expand-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .kpv2-hud-expand-icon {
        display: inline-block;
        font-size: 10px;
        transition: transform 0.2s ease;
      }
      
      .kpv2-hud-expand-btn.expanded .kpv2-hud-expand-icon {
        transform: rotate(180deg);
      }
      
      /* Instructions Panel */
      .kpv2-hud-instructions {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: none;
      }
      
      .kpv2-hud-instructions.expanded {
        display: block;
      }
      
      /* Tabs */
      .kpv2-hud-tabs {
        display: flex;
        background: rgba(255, 255, 255, 0.05);
      }
      
      .kpv2-hud-tab {
        flex: 1;
        padding: 8px 12px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 11px;
        transition: color 0.2s ease, background-color 0.2s ease;
      }
      
      .kpv2-hud-tab:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.08);
      }
      
      .kpv2-hud-tab.active {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }
      
      /* Tab Content */
      .kpv2-hud-tab-content {
        position: relative;
      }
      
      .kpv2-hud-tab-panel {
        display: none;
      }
      
      .kpv2-hud-tab-panel.active {
        display: block;
      }
      
      /* Control List */
      .kpv2-hud-control-list {
        padding: 12px;
      }
      
      .kpv2-hud-control-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      
      .kpv2-hud-control-item:last-child {
        margin-bottom: 0;
      }
      
      .kpv2-hud-control-item kbd {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 10px;
        color: #fff;
        min-width: 24px;
        text-align: center;
        font-family: monospace;
      }
      
      .kpv2-hud-control-item span {
        color: rgba(255, 255, 255, 0.8);
        font-size: 11px;
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
      
      .${CSS_CLASSES.TEXT_FIELD_GLOW} { 
        outline: 2px solid rgba(255,165,0,0.8) !important;
        outline-offset: 2px !important;
      }
    `;

    const style = document.createElement('style');
    style.id = 'keypilot-shadow-styles';
    style.textContent = css;
    shadowRoot.appendChild(style);

    this.injectedStyles.add(shadowRoot);
    this.shadowRootStyles.set(shadowRoot, style);
  }

  
   // Completely remove all KeyPilot CSS styles from the page
   // Used when extension is toggled off
   
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
      CSS_CLASSES.HIDDEN,
      CSS_CLASSES.TEXT_FIELD_GLOW,
      CSS_CLASSES.RIPPLE
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
    console.log('[KeyPilot Debug] Setting up interactiveObserver');
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
      console.log('[KeyPilot Debug] interactiveObserver created successfully');
    } catch (error) {
      console.warn('[KeyPilot Debug] Failed to create IntersectionObserver for interactive elements:', error);
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
    console.log('[KeyPilot Debug] Starting periodic cache update');
    // Periodically refresh the cache of interactive elements
    this.discoverInteractiveElements();

    // Set up periodic updates every 2 seconds
    this.cacheUpdateInterval = setInterval(() => {
      console.log('[KeyPilot Debug] Periodic cache update triggered');
      this.discoverInteractiveElements();
    }, 2000);
    console.log('[KeyPilot Debug] Periodic cache update interval set:', this.cacheUpdateInterval);
  }

  discoverInteractiveElements() {
    // Skip if observer is not initialized
    if (!this.interactiveObserver) {
  //    console.log('[KeyPilot Debug] discoverInteractiveElements: interactiveObserver is null, skipping');
      return;
    }

    // Find all interactive elements in the document
    const interactiveElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"], [onclick], [tabindex]:not([tabindex="-1"])'
    );

//    console.log(`[KeyPilot Debug] discoverInteractiveElements: Found ${interactiveElements.length} elements, observer exists: ${!!this.interactiveObserver}`);

    // Observe new elements
    interactiveElements.forEach((element, index) => {
      if (!this.isElementObserved(element)) {
        // Double-check observer exists right before calling observe
        if (!this.interactiveObserver) {
          console.error(`[KeyPilot Debug] Observer became null during forEach loop at index ${index}/${interactiveElements.length}`);
          return;
        }
        if (!this.interactiveObserver.observe) {
          console.error(`[KeyPilot Debug] Observer exists but observe method is missing at index ${index}`, this.interactiveObserver);
          return;
        }
        try {
          this.interactiveObserver.observe(element);
        } catch (error) {
          console.error(`[KeyPilot Debug] Error calling observe on element ${index}:`, error, 'Observer state:', !!this.interactiveObserver);
        }
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

      // Double-check observer exists right before calling observe
      if (!this.interactiveObserver) {
        console.error('[KeyPilot Debug] trackElementAtPoint: Observer became null before observe call');
        return clickable;
      }

      try {
        this.interactiveObserver.observe(clickable);
        this.updateElementPositionCache(clickable, clickable.getBoundingClientRect());
      } catch (error) {
        console.error('[KeyPilot Debug] trackElementAtPoint: Error calling observe:', error, 'Observer state:', !!this.interactiveObserver);
      }
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
    console.log('[KeyPilot Debug] cleanup() called, clearing observers and intervals');

    if (this.interactiveObserver) {
      console.log('[KeyPilot Debug] Disconnecting interactiveObserver');
      this.interactiveObserver.disconnect();
      this.interactiveObserver = null;
    }

    if (this.overlayObserver) {
      console.log('[KeyPilot Debug] Disconnecting overlayObserver');
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }

    if (this.cacheUpdateTimeout) {
      console.log('[KeyPilot Debug] Clearing cacheUpdateTimeout');
      clearTimeout(this.cacheUpdateTimeout);
      this.cacheUpdateTimeout = null;
    }

    if (this.cacheUpdateInterval) {
      console.log('[KeyPilot Debug] Clearing cacheUpdateInterval');
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

      // Notify HUD manager that KeyPilot is enabled
      if (this.keyPilot.hudManager) {
        this.keyPilot.hudManager.handleKeyPilotEnabled();
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
      // Notify HUD manager that KeyPilot is being disabled (before cleanup)
      if (this.keyPilot.hudManager) {
        this.keyPilot.hudManager.handleKeyPilotDisabled();
      }

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
      backgroundColor: enabled ? '#4CAF50' : '#f44336',
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


  // Module: src/modules/hud-manager.js
/**
 * HUD (Heads-Up Display) interface management
 * Provides real-time status information and quick access to controls
 */
class HUDManager extends EventManager {
  constructor(stateManager, styleManager) {
    super();
    
    this.stateManager = stateManager;
    this.styleManager = styleManager;
    this.hudElement = null;
    this.statusBar = null;
    this.isUpdatingFromSync = false; // Flag to prevent broadcast loops
    
    // Storage keys for HUD state persistence
    this.STORAGE_KEYS = {
      HUD_VISIBLE: 'keypilot_hud_visible',
      HUD_EXPANDED: 'keypilot_hud_expanded',
      HUD_ACTIVE_TAB: 'keypilot_hud_active_tab'
    };
    
    // Mode display mapping
    this.modeDisplayMap = {
      [MODES.NONE]: 'Normal Mode',
      [MODES.DELETE]: 'Delete Mode',
      [MODES.TEXT_FOCUS]: 'Text Focus Mode'
    };
    
    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });
  }

  /**
   * Create the main HUD container element
   */
  createHUDElement() {
    if (this.hudElement) return this.hudElement;
    
    const hud = document.createElement('div');
    hud.id = ELEMENT_IDS.HUD;
    hud.className = 'kpv2-hud';
    
    // Create status bar
    this.statusBar = this.createStatusBar();
    hud.appendChild(this.statusBar);
    
    // Create instructions panel
    const instructionsPanel = this.createInstructionsPanel();
    hud.appendChild(instructionsPanel);
    
    this.hudElement = hud;
    return hud;
  }

  /**
   * Detect existing HUD placeholder elements from early injection
   * @returns {HTMLElement|null} Existing HUD element or null
   */
  detectExistingHUDElement() {
    try {
      // Look for HUD element with early injection marker
      const existingHUD = document.querySelector('#' + ELEMENT_IDS.HUD + '[data-early-injection="true"]');
      if (existingHUD) {
        console.log('[HUDManager] Found existing HUD placeholder from early injection');
        return existingHUD;
      }
      
      // Also check for HUD element without marker (fallback)
      const fallbackHUD = document.getElementById(ELEMENT_IDS.HUD);
      if (fallbackHUD) {
        console.log('[HUDManager] Found existing HUD element (no early injection marker)');
        return fallbackHUD;
      }
      
      console.log('[HUDManager] No existing HUD element found');
      return null;
    } catch (error) {
      console.error('[HUDManager] Error detecting existing HUD element:', error);
      return null;
    }
  }

  /**
   * Create the status bar component
   */
  createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'kpv2-hud-status-bar';
    
    // Mode indicator
    const modeIndicator = document.createElement('div');
    modeIndicator.className = 'kpv2-hud-mode-indicator';
    
    const modeText = document.createElement('span');
    modeText.className = 'kpv2-hud-mode-text';
    modeText.textContent = this.getCurrentModeDisplay();
    
    modeIndicator.appendChild(modeText);
    statusBar.appendChild(modeIndicator);
    
    // Controls section
    const controls = this.createControlsSection();
    statusBar.appendChild(controls);
    
    // Expand button
    const expandBtn = this.createExpandButton();
    statusBar.appendChild(expandBtn);
    
    return statusBar;
  }

  /**
   * Create the controls section with toggle switches
   */
  createControlsSection() {
    const controls = document.createElement('div');
    controls.className = 'kpv2-hud-controls';
    
    // HUD toggle switch - initially checked since HUD is visible when created
    const hudVisible = this.stateManager.isHUDVisible();
    const hudToggle = this.createToggleSwitch('hud', 'HUD', hudVisible);
    controls.appendChild(hudToggle);
    
    // KeyPilot toggle switch - initially checked since extension is active
    const keypilotToggle = this.createToggleSwitch('keypilot', 'KeyPilot', true);
    controls.appendChild(keypilotToggle);
    
    return controls;
  }

  /**
   * Create a toggle switch element
   */
  createToggleSwitch(type, label, checked = false) {
    const toggle = document.createElement('label');
    toggle.className = 'kpv2-hud-toggle';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'kpv2-hud-toggle-input';
    input.setAttribute('data-toggle', type);
    input.checked = checked;
    
    const slider = document.createElement('span');
    slider.className = 'kpv2-hud-toggle-slider';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'kpv2-hud-toggle-label';
    labelSpan.textContent = label;
    
    // Add event listener for toggle switch
    input.addEventListener('change', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleToggleSwitch(type, e.target.checked);
    });
    
    toggle.appendChild(input);
    toggle.appendChild(slider);
    toggle.appendChild(labelSpan);
    
    return toggle;
  }

  /**
   * Create the expand/collapse button
   */
  createExpandButton() {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'kpv2-hud-expand-btn';
    expandBtn.setAttribute('aria-label', 'Expand HUD');
    
    const icon = document.createElement('span');
    icon.className = 'kpv2-hud-expand-icon';
    icon.textContent = '▲';
    
    expandBtn.appendChild(icon);
    
    // Add click event listener for expand/collapse
    expandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleExpansion();
    });
    
    return expandBtn;
  }

  /**
   * Create the instructions panel
   */
  createInstructionsPanel() {
    const instructions = document.createElement('div');
    instructions.className = 'kpv2-hud-instructions';
    
    // Initially hidden (collapsed state)
    instructions.style.display = 'none';
    
    // Create tabs
    const tabs = this.createTabsSection();
    instructions.appendChild(tabs);
    
    // Create tab content
    const tabContent = this.createTabContent();
    instructions.appendChild(tabContent);
    
    return instructions;
  }

  /**
   * Create the tabs navigation section
   */
  createTabsSection() {
    const tabs = document.createElement('div');
    tabs.className = 'kpv2-hud-tabs';
    
    const basicTab = document.createElement('button');
    basicTab.className = 'kpv2-hud-tab active';
    basicTab.setAttribute('data-tab', 'basic');
    basicTab.textContent = 'Basic Controls';
    
    // Add click event listener for tab switching
    basicTab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.setActiveTab('basic');
    });
    
    tabs.appendChild(basicTab);
    
    return tabs;
  }

  /**
   * Create the tab content section
   */
  createTabContent() {
    const tabContent = document.createElement('div');
    tabContent.className = 'kpv2-hud-tab-content';
    
    // Basic controls panel
    const basicPanel = this.createBasicControlsPanel();
    tabContent.appendChild(basicPanel);
    
    return tabContent;
  }

  /**
   * Create the basic controls panel
   */
  createBasicControlsPanel() {
    const panel = document.createElement('div');
    panel.className = 'kpv2-hud-tab-panel active';
    panel.setAttribute('data-panel', 'basic');
    
    const controlList = document.createElement('div');
    controlList.className = 'kpv2-hud-control-list';
    
    // Define control items
    const controls = [
      { key: 'F', description: 'Click/Activate element' },
      { key: 'C', description: 'Browser back' },
      { key: 'V', description: 'Browser forward' },
      { key: 'ESC', description: 'Cancel/Exit mode' },
      { key: 'Alt+K', description: 'Toggle KeyPilot' },
      { key: 'Alt+H', description: 'Toggle HUD' }
    ];
    
    // Create control items
    controls.forEach(control => {
      const item = this.createControlItem(control.key, control.description);
      controlList.appendChild(item);
    });
    
    panel.appendChild(controlList);
    
    return panel;
  }

  /**
   * Create a control item element
   */
  createControlItem(key, description) {
    const item = document.createElement('div');
    item.className = 'kpv2-hud-control-item';
    
    const kbd = document.createElement('kbd');
    kbd.textContent = key;
    
    const span = document.createElement('span');
    span.textContent = description;
    
    item.appendChild(kbd);
    item.appendChild(span);
    
    return item;
  }

  /**
   * Get the display text for the current mode
   */
  getCurrentModeDisplay() {
    const currentMode = this.stateManager.getState().mode;
    return this.modeDisplayMap[currentMode] || 'Unknown Mode';
  }

  /**
   * Show the HUD
   */
  show() {
    if (!this.hudElement) {
      this.createHUDElement();
      document.body.appendChild(this.hudElement);
    }
    
    // Remove hidden class and set display
    this.hudElement.classList.remove('kpv2-hidden');
    this.hudElement.style.display = 'block';
    
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDVisible(true);
  }

  /**
   * Hide the HUD
   */
  hide() {
    if (this.hudElement) {
      // Add hidden class and set display
      this.hudElement.classList.add('kpv2-hidden');
      this.hudElement.style.display = 'none';
    }
    
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDVisible(false);
  }

  /**
   * Preserve state during enhancement process
   * Maintains visibility, expansion, and active tab state
   */
  preserveStateFromPlaceholder(placeholderElement) {
    try {
      const preservedState = {
        visible: !placeholderElement.classList.contains('kpv2-hidden'),
        expanded: placeholderElement.classList.contains('kpv2-hud-expanded'),
        activeTab: 'basic' // Default tab for early injection
      };
      
      // Check for active tab from placeholder
      const activeTabButton = placeholderElement.querySelector('.kpv2-hud-tab-button.active');
      if (activeTabButton && activeTabButton.dataset.tab) {
        preservedState.activeTab = activeTabButton.dataset.tab;
      }
      
      console.log('[HUDManager] State preserved from placeholder:', preservedState);
      return preservedState;
    } catch (error) {
      console.error('[HUDManager] Failed to preserve state from placeholder:', error);
      return {
        visible: true,
        expanded: false,
        activeTab: 'basic'
      };
    }
  }

  /**
   * Toggle HUD visibility
   */
  toggle() {
    const isVisible = this.stateManager.isHUDVisible();
    if (isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Internal method to update DOM for expanded state
   */
  _updateExpandedDOM(expanded) {
    if (!this.hudElement) return;
    
    const instructionsPanel = this.hudElement.querySelector('.kpv2-hud-instructions');
    const expandBtn = this.hudElement.querySelector('.kpv2-hud-expand-btn');
    const expandIcon = this.hudElement.querySelector('.kpv2-hud-expand-icon');
    
    if (expanded) {
      if (instructionsPanel) {
        instructionsPanel.classList.add('expanded');
        instructionsPanel.style.display = 'block';
      }
      
      if (expandBtn) {
        expandBtn.classList.add('expanded');
        expandBtn.setAttribute('aria-label', 'Collapse HUD');
      }
      
      if (expandIcon) {
        expandIcon.textContent = '▼';
      }
    } else {
      if (instructionsPanel) {
        instructionsPanel.classList.remove('expanded');
        instructionsPanel.style.display = 'none';
      }
      
      if (expandBtn) {
        expandBtn.classList.remove('expanded');
        expandBtn.setAttribute('aria-label', 'Expand HUD');
      }
      
      if (expandIcon) {
        expandIcon.textContent = '▲';
      }
    }
  }

  /**
   * Expand the HUD to show instructions panel
   */
  expand() {
    this._updateExpandedDOM(true);
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDExpanded(true);
  }

  /**
   * Collapse the HUD to hide instructions panel
   */
  collapse() {
    this._updateExpandedDOM(false);
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDExpanded(false);
  }

  /**
   * Toggle HUD expansion state
   */
  toggleExpansion() {
    const isExpanded = this.stateManager.isHUDExpanded();
    if (isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Set the active tab in the instructions panel
   */
  setActiveTab(tabName) {
    if (!this.hudElement) return;
    
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDActiveTab(tabName);
    
    // Update tab button states
    const tabs = this.hudElement.querySelectorAll('.kpv2-hud-tab');
    tabs.forEach(tab => {
      const tabType = tab.getAttribute('data-tab');
      if (tabType === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab panel states
    const panels = this.hudElement.querySelectorAll('.kpv2-hud-tab-panel');
    panels.forEach(panel => {
      const panelType = panel.getAttribute('data-panel');
      if (panelType === tabName) {
        panel.classList.add('active');
        panel.style.display = 'block';
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  }

  /**
   * Update the mode display in the status bar
   */
  updateModeDisplay(mode) {
    if (!this.statusBar) return;
    
    const modeText = this.statusBar.querySelector('.kpv2-hud-mode-text');
    if (modeText) {
      modeText.textContent = this.modeDisplayMap[mode] || 'Unknown Mode';
    }
  }

  /**
   * Handle toggle switch interactions
   */
  handleToggleSwitch(type, checked) {
    switch (type) {
      case 'hud':
        this.handleHUDToggle(checked);
        break;
      case 'keypilot':
        this.handleKeyPilotToggle(checked);
        break;
      default:
        console.warn('[HUDManager] Unknown toggle type:', type);
    }
  }

  /**
   * Handle HUD toggle switch (hide/show HUD)
   */
  handleHUDToggle(enabled) {
    if (enabled) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Handle KeyPilot toggle switch (enable/disable extension)
   */
  async handleKeyPilotToggle(enabled) {
    try {
      // Send message to service worker to toggle KeyPilot state
      await chrome.runtime.sendMessage({
        type: 'KP_SET_STATE',
        enabled: enabled
      });
      
      // If KeyPilot is being disabled, hide the HUD
      if (!enabled) {
        this.hide();
        // Update the HUD toggle switch to reflect that HUD is now hidden
        this.updateToggleSwitchState('hud', false);
      }
    } catch (error) {
      console.error('[HUDManager] Failed to toggle KeyPilot state:', error);
      // Revert the toggle switch state on error
      this.updateToggleSwitchState('keypilot', !enabled);
    }
  }

  /**
   * Update the state of a toggle switch
   */
  updateToggleSwitchState(type, checked) {
    if (!this.hudElement) return;
    
    const toggleInput = this.hudElement.querySelector(`input[data-toggle="${type}"]`);
    if (toggleInput) {
      toggleInput.checked = checked;
    }
  }

  /**
   * Update toggle switches based on current state
   */
  updateToggleSwitches() {
    if (!this.hudElement) return;
    
    // Update HUD toggle switch
    const hudVisible = this.stateManager.isHUDVisible();
    this.updateToggleSwitchState('hud', hudVisible);
    
    // Update KeyPilot toggle switch - we'll need to get this from the toggle handler
    // For now, assume it's enabled if HUD is visible
    this.updateToggleSwitchState('keypilot', true);
  }

  /**
   * Handle KeyPilot being disabled externally (e.g., via Alt+K)
   * This should hide the HUD and update toggle switches
   */
  handleKeyPilotDisabled() {
    // Hide the HUD when KeyPilot is disabled
    this.hide();
    
    // Update toggle switches to reflect disabled state
    this.updateToggleSwitchState('hud', false);
    this.updateToggleSwitchState('keypilot', false);
  }

  /**
   * Handle KeyPilot being enabled externally (e.g., via Alt+K)
   * This should restore HUD state and update toggle switches
   */
  async handleKeyPilotEnabled() {
    // Update KeyPilot toggle switch
    this.updateToggleSwitchState('keypilot', true);
    
    try {
      // Load HUD state from storage to restore previous state
      const storedState = await this.loadHUDState();
      
      // Update StateManager with loaded state (this will trigger handleStateChange)
      this.stateManager.setState({
        hud: {
          visible: storedState.visible,
          expanded: storedState.expanded,
          activeTab: storedState.activeTab
        }
      });
      
      console.log('[HUDManager] KeyPilot enabled, restored HUD state:', storedState);
    } catch (error) {
      console.error('[HUDManager] Error restoring HUD state on KeyPilot enable:', error);
      
      // Fallback to current state if loading fails
      const hudState = this.stateManager.getHUDState();
      if (hudState.visible) {
        this.show();
        this.updateToggleSwitchState('hud', true);
      }
    }
  }

  /**
   * Handle state changes from StateManager
   */
  handleStateChange(newState, prevState) {
    // Track if any HUD state changed for storage persistence and cross-tab sync
    let hudStateChanged = false;
    const hudChanges = {};
    
    // Update mode display if mode changed
    if (newState.mode !== prevState.mode) {
      this.updateModeDisplay(newState.mode);
    }
    
    // Handle HUD visibility changes
    if (newState.hud.visible !== prevState.hud.visible) {
      this.preserveVisibilityState(newState.hud.visible);
      
      // Update toggle switch state
      this.updateToggleSwitchState('hud', newState.hud.visible);
      hudStateChanged = true;
      hudChanges.visible = newState.hud.visible;
    }
    
    // Handle HUD expansion changes
    if (newState.hud.expanded !== prevState.hud.expanded) {
      this.preserveExpansionState(newState.hud.expanded);
      hudStateChanged = true;
      hudChanges.expanded = newState.hud.expanded;
    }
    
    // Handle active tab changes
    if (newState.hud.activeTab !== prevState.hud.activeTab) {
      this.preserveActiveTabSelection(newState.hud.activeTab);
      hudStateChanged = true;
      hudChanges.activeTab = newState.hud.activeTab;
    }
    
    // Save HUD state to storage and broadcast to other tabs if any HUD state changed
    // Only broadcast if this change wasn't triggered by a sync message
    if (hudStateChanged) {
      this.saveHUDState();
      
      if (!this.isUpdatingFromSync) {
        this.broadcastHUDStateChange(newState.hud);
      }
    }
  }

  /**
   * Preserve visibility state during placeholder upgrade
   * Maintains smooth transition without flickering
   */
  preserveVisibilityState(visible) {
    try {
      if (!this.hudElement) return;
      
      if (visible) {
        // Show HUD smoothly
        this.hudElement.classList.remove('kpv2-hidden');
        this.hudElement.style.display = 'block';
        
        // Ensure HUD is in DOM if not already
        if (!this.hudElement.parentNode) {
          document.body.appendChild(this.hudElement);
        }
      } else {
        // Hide HUD smoothly
        this.hudElement.classList.add('kpv2-hidden');
        this.hudElement.style.display = 'none';
      }
      
      console.log('[HUDManager] Visibility state preserved:', visible);
    } catch (error) {
      console.error('[HUDManager] Failed to preserve visibility state:', error);
    }
  }

  /**
   * Preserve expansion state across injection phases
   * Maintains expanded/collapsed state during enhancement
   */
  preserveExpansionState(expanded) {
    try {
      if (!this.hudElement) return;
      
      // Update DOM to reflect expansion state
      this._updateExpandedDOM(expanded);
      
      // Ensure expansion state is consistent across all elements
      const instructionsPanel = this.hudElement.querySelector('.kpv2-hud-instructions');
      const expandBtn = this.hudElement.querySelector('.kpv2-hud-expand-btn');
      const expandIcon = this.hudElement.querySelector('.kpv2-hud-expand-icon');
      
      if (expanded) {
        // Expanded state
        if (instructionsPanel) {
          instructionsPanel.classList.add('expanded');
          instructionsPanel.style.display = 'block';
        }
        
        if (expandBtn) {
          expandBtn.classList.add('expanded');
          expandBtn.setAttribute('aria-label', 'Collapse HUD');
        }
        
        if (expandIcon) {
          expandIcon.textContent = '▼';
        }
        
        // Add expanded class to main HUD element
        this.hudElement.classList.add('kpv2-hud-expanded');
      } else {
        // Collapsed state
        if (instructionsPanel) {
          instructionsPanel.classList.remove('expanded');
          instructionsPanel.style.display = 'none';
        }
        
        if (expandBtn) {
          expandBtn.classList.remove('expanded');
          expandBtn.setAttribute('aria-label', 'Expand HUD');
        }
        
        if (expandIcon) {
          expandIcon.textContent = '▲';
        }
        
        // Remove expanded class from main HUD element
        this.hudElement.classList.remove('kpv2-hud-expanded');
      }
      
      console.log('[HUDManager] Expansion state preserved:', expanded);
    } catch (error) {
      console.error('[HUDManager] Failed to preserve expansion state:', error);
    }
  }

  /**
   * Keep active tab selection consistent across injection phases
   * Maintains selected tab during enhancement process
   */
  preserveActiveTabSelection(activeTab) {
    try {
      if (!this.hudElement) return;
      
      // Update tab button states
      const tabs = this.hudElement.querySelectorAll('.kpv2-hud-tab');
      tabs.forEach(tab => {
        const tabType = tab.getAttribute('data-tab');
        if (tabType === activeTab) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Update tab panel states
      const panels = this.hudElement.querySelectorAll('.kpv2-hud-tab-panel');
      panels.forEach(panel => {
        const panelType = panel.getAttribute('data-panel');
        if (panelType === activeTab) {
          panel.classList.add('active');
          panel.style.display = 'block';
        } else {
          panel.classList.remove('active');
          panel.style.display = 'none';
        }
      });
      
      // Also handle placeholder tab buttons if they exist
      const placeholderTabs = this.hudElement.querySelectorAll('.kpv2-hud-tab-button');
      placeholderTabs.forEach(tab => {
        const tabType = tab.getAttribute('data-tab');
        if (tabType === activeTab) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      console.log('[HUDManager] Active tab selection preserved:', activeTab);
    } catch (error) {
      console.error('[HUDManager] Failed to preserve active tab selection:', error);
    }
  }

  /**
   * Enhance existing HUD placeholder element with full functionality
   */
  async enhanceExistingElement(existingElement, earlyState = null, stateBridge = null) {
    try {
      if (!existingElement) {
        console.warn('[HUDManager] No existing element to enhance, falling back to normal initialization');
        return await this.initialize();
      }
      
      console.log('[HUDManager] Enhancing existing HUD element');
      
      // Use the existing element as our HUD
      this.hudElement = existingElement;
      
      // Remove early injection marker
      this.hudElement.removeAttribute('data-early-injection');
      
      // Ensure proper ID and classes
      this.hudElement.id = ELEMENT_IDS.HUD;
      if (!this.hudElement.classList.contains('kpv2-hud')) {
        this.hudElement.classList.add('kpv2-hud');
      }
      
      // Preserve current visibility state from placeholder
      const wasVisible = !this.hudElement.classList.contains('kpv2-hidden');
      const wasExpanded = this.hudElement.classList.contains('kpv2-hud-expanded');
      
      // Find or create status bar
      this.statusBar = this.hudElement.querySelector('.kpv2-hud-status-bar');
      if (!this.statusBar) {
        this.statusBar = this.createStatusBar();
        this.hudElement.appendChild(this.statusBar);
      } else {
        // Enhance existing status bar
        this.enhanceStatusBar();
      }
      
      // Find or create instructions panel
      let instructionsPanel = this.hudElement.querySelector('.kpv2-hud-instructions');
      if (!instructionsPanel) {
        instructionsPanel = this.createInstructionsPanel();
        this.hudElement.appendChild(instructionsPanel);
      }
      
      // Load state from early injection or storage
      let targetState;
      if (earlyState && stateBridge) {
        // Use early state if available, preserving placeholder state as fallback
        targetState = {
          visible: earlyState.hudVisible !== undefined ? earlyState.hudVisible : wasVisible,
          expanded: earlyState.hudExpanded !== undefined ? earlyState.hudExpanded : wasExpanded,
          activeTab: earlyState.hudActiveTab || 'basic'
        };
        console.log('[HUDManager] Using early state for enhancement:', targetState);
      } else {
        // Fall back to storage, preserving placeholder state as final fallback
        try {
          const loadedState = await this.loadHUDState();
          targetState = {
            visible: loadedState.visible !== undefined ? loadedState.visible : wasVisible,
            expanded: loadedState.expanded !== undefined ? loadedState.expanded : wasExpanded,
            activeTab: loadedState.activeTab || 'basic'
          };
        } catch (error) {
          console.warn('[HUDManager] Failed to load stored state, using placeholder state:', error);
          targetState = {
            visible: wasVisible,
            expanded: wasExpanded,
            activeTab: 'basic'
          };
        }
        console.log('[HUDManager] Using stored state for enhancement:', targetState);
      }
      
      // Perform seamless transition from placeholder to full HUD
      const finalState = this.performSeamlessTransition(existingElement, targetState);
      
      // Update StateManager with final state (this will trigger handleStateChange)
      this.stateManager.setState({
        hud: {
          visible: finalState.visible,
          expanded: finalState.expanded,
          activeTab: finalState.activeTab
        }
      });
      
      // Update toggle switches to reflect current state
      this.updateToggleSwitches();
      
      // Set up message listener for cross-tab HUD toggle
      this.setupMessageListener();
      
      console.log('[HUDManager] HUD element enhanced successfully');
      return true;
      
    } catch (error) {
      console.error('[HUDManager] Failed to enhance existing element:', error);
      // Fall back to normal initialization
      return await this.initialize();
    }
  }

  /**
   * Apply state to DOM elements directly
   * Used during enhancement to prevent flickering
   */
  applyStateToDOM(state) {
    try {
      // Apply visibility state using preservation method
      this.preserveVisibilityState(state.visible);
      
      // Apply expansion state using preservation method
      this.preserveExpansionState(state.expanded);
      
      // Apply active tab using preservation method
      this.preserveActiveTabSelection(state.activeTab);
      
      console.log('[HUDManager] State applied to DOM:', state);
    } catch (error) {
      console.error('[HUDManager] Failed to apply state to DOM:', error);
    }
  }

  /**
   * Implement seamless transition from placeholder to full HUD
   * Ensures no visual disruption during enhancement
   */
  performSeamlessTransition(placeholderElement, targetState) {
    try {
      // Step 1: Capture current visual state
      const currentVisibility = !placeholderElement.classList.contains('kpv2-hidden');
      const currentExpansion = placeholderElement.classList.contains('kpv2-hud-expanded');
      
      // Step 2: Preserve visual continuity during DOM manipulation
      const transitionState = {
        visible: targetState.visible !== undefined ? targetState.visible : currentVisibility,
        expanded: targetState.expanded !== undefined ? targetState.expanded : currentExpansion,
        activeTab: targetState.activeTab || 'basic'
      };
      
      // Step 3: Apply transition state immediately to prevent flickering
      this.applyStateToDOM(transitionState);
      
      // Step 4: Update StateManager to reflect the transition
      this.stateManager.setState({
        hud: transitionState
      });
      
      // Step 5: Ensure all interactive elements are properly enhanced
      this.enhanceStatusBar();
      
      console.log('[HUDManager] Seamless transition completed:', transitionState);
      return transitionState;
    } catch (error) {
      console.error('[HUDManager] Failed to perform seamless transition:', error);
      // Return fallback state
      return {
        visible: true,
        expanded: false,
        activeTab: 'basic'
      };
    }
  }

  /**
   * Enhance status bar with full functionality (event listeners, etc.)
   */
  enhanceStatusBar() {
    try {
      // Find expand button and add event listener if not already present
      const expandBtn = this.statusBar.querySelector('.kpv2-hud-expand-btn');
      if (expandBtn && !expandBtn.hasAttribute('data-enhanced')) {
        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleExpansion();
        });
        expandBtn.setAttribute('data-enhanced', 'true');
      } else if (!expandBtn) {
        // Create expand button if it doesn't exist
        const newExpandBtn = this.createExpandButton();
        this.statusBar.appendChild(newExpandBtn);
      }
      
      // Find toggle switches and enhance them
      const toggleSwitches = this.statusBar.querySelectorAll('.kpv2-hud-toggle input[type="checkbox"]');
      toggleSwitches.forEach(toggle => {
        if (!toggle.hasAttribute('data-enhanced')) {
          toggle.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const toggleType = e.target.getAttribute('data-toggle');
            this.handleToggleSwitch(toggleType, e.target.checked);
          });
          toggle.setAttribute('data-enhanced', 'true');
        }
      });
      
      // If no toggle switches exist, create the controls section
      if (toggleSwitches.length === 0) {
        const existingControls = this.statusBar.querySelector('.kpv2-hud-controls');
        if (!existingControls) {
          const controls = this.createControlsSection();
          // Insert controls before expand button
          const expandBtn = this.statusBar.querySelector('.kpv2-hud-expand-btn');
          if (expandBtn) {
            this.statusBar.insertBefore(controls, expandBtn);
          } else {
            this.statusBar.appendChild(controls);
          }
        }
      }
      
      // Ensure mode indicator exists and is updated
      const modeIndicator = this.statusBar.querySelector('.kpv2-hud-mode-indicator');
      if (!modeIndicator) {
        const newModeIndicator = document.createElement('div');
        newModeIndicator.className = 'kpv2-hud-mode-indicator';
        
        const modeText = document.createElement('span');
        modeText.className = 'kpv2-hud-mode-text';
        modeText.textContent = this.getCurrentModeDisplay();
        
        newModeIndicator.appendChild(modeText);
        this.statusBar.insertBefore(newModeIndicator, this.statusBar.firstChild);
      }
      
      console.log('[HUDManager] Status bar enhanced with event listeners');
      
    } catch (error) {
      console.error('[HUDManager] Failed to enhance status bar:', error);
    }
  }

  /**
   * Check if HUD manager is initialized
   */
  isInitialized() {
    return this.hudElement !== null;
  }

  /**
   * Initialize the HUD based on stored state
   * Detects early injection placeholders and enhances them if found
   */
  async initialize(earlyState = null, stateBridge = null) {
    try {
      // First, check for existing HUD element from early injection
      const existingElement = this.detectExistingHUDElement();
      
      if (existingElement) {
        // Enhance existing placeholder element
        console.log('[HUDManager] Found existing HUD element, enhancing...');
        return await this.enhanceExistingElement(existingElement, earlyState, stateBridge);
      }
      
      // No existing element found, proceed with normal initialization
      console.log('[HUDManager] No existing HUD element found, creating new one');
      
      // Load HUD state from storage
      const storedState = await this.loadHUDState();
      
      // Update StateManager with loaded state (this will trigger handleStateChange)
      this.stateManager.setState({
        hud: {
          visible: storedState.visible,
          expanded: storedState.expanded,
          activeTab: storedState.activeTab
        }
      });
      
      // Explicitly show/hide HUD based on loaded state
      // This ensures HUD is shown even if state didn't change
      if (storedState.visible) {
        this.show();
      } else {
        this.hide();
      }
      
      // Set initial expansion state
      this._updateExpandedDOM(storedState.expanded);
      
      // Set initial active tab
      this.setActiveTab(storedState.activeTab);
      
      // Update toggle switches to reflect current state
      this.updateToggleSwitches();
      
      // Set up message listener for cross-tab HUD toggle
      this.setupMessageListener();
      
      console.log('[HUDManager] Initialized with stored state:', storedState);
      return true;
    } catch (error) {
      console.error('[HUDManager] Error during initialization, using current state:', error);
      
      // Fallback to current state if loading fails
      const hudState = this.stateManager.getHUDState();
      
      if (hudState.visible) {
        this.show();
      } else {
        this.hide();
      }
      
      // Set initial expansion state
      this._updateExpandedDOM(hudState.expanded);
      
      // Set initial active tab
      this.setActiveTab(hudState.activeTab);
      
      // Update toggle switches to reflect current state
      this.updateToggleSwitches();
      
      // Set up message listener for cross-tab HUD toggle
      this.setupMessageListener();
      
      return false;
    }
  }

  /**
   * Broadcast HUD state changes to other tabs via service worker
   */
  async broadcastHUDStateChange(hudState) {
    try {
      // Send complete HUD state to service worker for broadcasting
      await chrome.runtime.sendMessage({
        type: 'KP_SET_COMPLETE_HUD_STATE',
        hudState: hudState
      });
      
      console.log('[HUDManager] Broadcasted HUD state change:', hudState);
    } catch (error) {
      console.error('[HUDManager] Failed to broadcast HUD state change:', error);
      // Don't throw - allow the application to continue even if broadcasting fails
    }
  }

  /**
   * Set up Chrome runtime message listener for HUD synchronization messages
   */
  setupMessageListener() {
    // Remove existing listener if it exists
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
    }
    
    // Create new message listener
    this.messageListener = (message, sender, sendResponse) => {
      if (message.type === 'KP_HUD_TOGGLE') {
        console.log('[HUDManager] Received HUD toggle message:', message);
        
        // Set flag to prevent broadcast loop
        this.isUpdatingFromSync = true;
        
        // Update HUD visibility based on message (without triggering broadcast)
        this.stateManager.setState({
          hud: { ...this.stateManager.getHUDState(), visible: message.visible }
        });
        
        // Reset flag after state update
        this.isUpdatingFromSync = false;
        
        // Send acknowledgment
        sendResponse({
          type: 'KP_HUD_TOGGLE_ACK',
          visible: message.visible,
          timestamp: Date.now()
        });
        
        return true; // Indicate we'll send a response
      } else if (message.type === 'KP_HUD_STATE_SYNC') {
        console.log('[HUDManager] Received complete HUD state sync message:', message);
        
        // Set flag to prevent broadcast loop
        this.isUpdatingFromSync = true;
        
        // Update complete HUD state based on message (without triggering broadcast)
        this.stateManager.setState({
          hud: {
            visible: message.hudState.visible,
            expanded: message.hudState.expanded,
            activeTab: message.hudState.activeTab
          }
        });
        
        // Reset flag after state update
        this.isUpdatingFromSync = false;
        
        // Send acknowledgment
        sendResponse({
          type: 'KP_HUD_STATE_SYNC_ACK',
          hudState: message.hudState,
          timestamp: Date.now()
        });
        
        return true; // Indicate we'll send a response
      }
    };
    
    // Add the message listener
    chrome.runtime.onMessage.addListener(this.messageListener);
    console.log('[HUDManager] Message listener set up for cross-tab HUD synchronization');
  }

  /**
   * Save HUD state to Chrome storage
   * Uses sync storage with local storage fallback
   */
  async saveHUDState() {
    try {
      const hudState = this.stateManager.getHUDState();
      const stateData = {
        [this.STORAGE_KEYS.HUD_VISIBLE]: hudState.visible,
        [this.STORAGE_KEYS.HUD_EXPANDED]: hudState.expanded,
        [this.STORAGE_KEYS.HUD_ACTIVE_TAB]: hudState.activeTab,
        hud_timestamp: Date.now()
      };

      try {
        // Try chrome.storage.sync first
        await chrome.storage.sync.set(stateData);
        console.log('[HUDManager] HUD state saved to sync storage:', hudState);
      } catch (syncError) {
        console.warn('[HUDManager] Failed to save to sync storage, trying local:', syncError);
        
        try {
          // Fallback to chrome.storage.local
          await chrome.storage.local.set(stateData);
          console.log('[HUDManager] HUD state saved to local storage:', hudState);
        } catch (localError) {
          console.error('[HUDManager] Failed to save HUD state to any storage:', localError);
          throw localError;
        }
      }
    } catch (error) {
      console.error('[HUDManager] Error saving HUD state:', error);
      // Don't throw - allow the application to continue even if storage fails
    }
  }

  /**
   * Load HUD state from Chrome storage
   * Uses sync storage with local storage fallback
   * @returns {Promise<Object>} HUD state object with visible, expanded, and activeTab properties
   */
  async loadHUDState() {
    const defaultState = {
      visible: true,
      expanded: false,
      activeTab: 'basic'
    };

    try {
      let storageResult = {};

      try {
        // Try chrome.storage.sync first
        storageResult = await chrome.storage.sync.get([
          this.STORAGE_KEYS.HUD_VISIBLE,
          this.STORAGE_KEYS.HUD_EXPANDED,
          this.STORAGE_KEYS.HUD_ACTIVE_TAB
        ]);
        
        // Check if we got any HUD data from sync storage
        if (storageResult[this.STORAGE_KEYS.HUD_VISIBLE] === undefined) {
          throw new Error('No HUD data in sync storage');
        }
        
        console.log('[HUDManager] HUD state loaded from sync storage:', storageResult);
      } catch (syncError) {
        console.warn('[HUDManager] Failed to load from sync storage, trying local:', syncError);
        
        try {
          // Fallback to chrome.storage.local
          storageResult = await chrome.storage.local.get([
            this.STORAGE_KEYS.HUD_VISIBLE,
            this.STORAGE_KEYS.HUD_EXPANDED,
            this.STORAGE_KEYS.HUD_ACTIVE_TAB
          ]);
          
          console.log('[HUDManager] HUD state loaded from local storage:', storageResult);
        } catch (localError) {
          console.error('[HUDManager] Failed to load from local storage:', localError);
          throw localError;
        }
      }

      // Build state object with fallbacks to defaults
      const loadedState = {
        visible: storageResult[this.STORAGE_KEYS.HUD_VISIBLE] !== undefined 
          ? storageResult[this.STORAGE_KEYS.HUD_VISIBLE] 
          : defaultState.visible,
        expanded: storageResult[this.STORAGE_KEYS.HUD_EXPANDED] !== undefined 
          ? storageResult[this.STORAGE_KEYS.HUD_EXPANDED] 
          : defaultState.expanded,
        activeTab: storageResult[this.STORAGE_KEYS.HUD_ACTIVE_TAB] || defaultState.activeTab
      };

      console.log('[HUDManager] Final loaded HUD state:', loadedState);
      return loadedState;
    } catch (error) {
      console.error('[HUDManager] Error loading HUD state, using defaults:', error);
      return defaultState;
    }
  }

  /**
   * Clean up HUD elements and event listeners
   */
  cleanup() {
    super.cleanup();
    
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    
    this.hudElement = null;
    this.statusBar = null;
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // Remove message listener
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
  }

  /**
   * Override EventManager methods (not used for HUD but required by base class)
   */
  handleKeyDown(e) {
    // HUD doesn't handle keyboard events directly
    // Keyboard shortcuts will be handled by the main KeyPilot class
  }

  handleMouseMove(e) {
    // HUD doesn't need mouse move handling
  }

  handleScroll(e) {
    // HUD is fixed positioned, no scroll handling needed
  }
}


  // Module: src/modules/state-bridge.js
/**
 * State Bridge for Early Injection
 * Manages state synchronization between early injection and full initialization phases
 * Handles storage operations and service worker communication for early injection
 */

// Minimal event emitter for early injection (when EventManager is not available)
class MinimalEventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[MinimalEventEmitter] Error in ${event} listener:`, error);
        }
      });
    }
  }
  
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }
  
  removeAllListeners() {
    this.listeners.clear();
  }
}

class StateBridge extends (typeof EventManager !== 'undefined' ? EventManager : MinimalEventEmitter) {
  constructor() {
    super();
    
    // Storage keys for early injection state
    this.STORAGE_KEYS = {
      EXTENSION_ENABLED: 'keypilot_enabled',
      HUD_VISIBLE: 'keypilot_hud_visible',
      HUD_EXPANDED: 'keypilot_hud_expanded',
      HUD_ACTIVE_TAB: 'keypilot_hud_active_tab',
      CURSOR_MODE: 'keypilot_cursor_mode',
      EARLY_STATE_TIMESTAMP: 'keypilot_early_state_timestamp'
    };
    
    // Default state values
    this.DEFAULT_STATE = {
      extensionEnabled: true,
      hudVisible: true,
      hudExpanded: false,
      hudActiveTab: 'basic',
      cursorMode: 'none',
      timestamp: Date.now()
    };
    
    // Current early state cache
    this.earlyState = { ...this.DEFAULT_STATE };
    
    // Service worker communication status
    this.serviceWorkerAvailable = false;
    
    // State synchronization status
    this.syncInProgress = false;
    
    console.log('[StateBridge] Initialized with default state:', this.earlyState);
  }

  /**
   * Initialize the state bridge
   * Sets up service worker communication and loads initial state
   */
  async initialize() {
    try {
      // Test service worker availability
      await this.testServiceWorkerConnection();
      
      // Load initial state from storage
      await this.loadEarlyState();
      
      // Set up message listener for state updates
      this.setupMessageListener();
      
      console.log('[StateBridge] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[StateBridge] Failed to initialize:', error);
      // Continue with cached state even if initialization fails
      return false;
    }
  }

  /**
   * Test service worker connection
   */
  async testServiceWorkerConnection() {
    try {
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('Chrome runtime not available');
      }
      
      // Test with a simple ping message
      const response = await chrome.runtime.sendMessage({ 
        type: 'KP_GET_STATE',
        source: 'early-injection'
      });
      
      if (response && typeof response.enabled === 'boolean') {
        this.serviceWorkerAvailable = true;
        console.log('[StateBridge] Service worker connection established');
        return true;
      } else {
        throw new Error('Invalid response from service worker');
      }
    } catch (error) {
      console.warn('[StateBridge] Service worker unavailable:', error.message);
      this.serviceWorkerAvailable = false;
      return false;
    }
  }

  /**
   * Load early state from storage
   * Tries service worker first, then direct storage access
   */
  async loadEarlyState() {
    try {
      let loadedState = null;
      
      // Try service worker first if available
      if (this.serviceWorkerAvailable) {
        loadedState = await this.loadStateFromServiceWorker();
      }
      
      // Fallback to direct storage access
      if (!loadedState) {
        loadedState = await this.loadStateFromStorage();
      }
      
      // Merge loaded state with defaults
      if (loadedState) {
        this.earlyState = {
          ...this.DEFAULT_STATE,
          ...loadedState,
          timestamp: Date.now()
        };
        console.log('[StateBridge] State loaded:', this.earlyState);
      } else {
        console.log('[StateBridge] Using default state');
      }
      
      return this.earlyState;
    } catch (error) {
      console.error('[StateBridge] Failed to load early state:', error);
      // Return default state on failure
      return this.earlyState;
    }
  }

  /**
   * Load state from service worker
   */
  async loadStateFromServiceWorker() {
    try {
      // Get extension enabled state
      const extensionResponse = await chrome.runtime.sendMessage({ 
        type: 'KP_GET_STATE' 
      });
      
      // Get complete HUD state
      const hudResponse = await chrome.runtime.sendMessage({ 
        type: 'KP_GET_COMPLETE_HUD_STATE' 
      });
      
      if (extensionResponse && hudResponse) {
        return {
          extensionEnabled: extensionResponse.enabled,
          hudVisible: hudResponse.hudState.visible,
          hudExpanded: hudResponse.hudState.expanded,
          hudActiveTab: hudResponse.hudState.activeTab,
          cursorMode: 'none', // Default cursor mode for early injection
          timestamp: Math.max(extensionResponse.timestamp || 0, hudResponse.timestamp || 0)
        };
      }
      
      return null;
    } catch (error) {
      console.warn('[StateBridge] Failed to load from service worker:', error);
      return null;
    }
  }

  /**
   * Load state directly from Chrome storage
   */
  async loadStateFromStorage() {
    try {
      // Try sync storage first
      let result = await this.getFromStorage('sync');
      
      // Fallback to local storage
      if (!result || Object.keys(result).length === 0) {
        result = await this.getFromStorage('local');
      }
      
      if (result && Object.keys(result).length > 0) {
        return {
          extensionEnabled: result[this.STORAGE_KEYS.EXTENSION_ENABLED] ?? this.DEFAULT_STATE.extensionEnabled,
          hudVisible: result[this.STORAGE_KEYS.HUD_VISIBLE] ?? this.DEFAULT_STATE.hudVisible,
          hudExpanded: result[this.STORAGE_KEYS.HUD_EXPANDED] ?? this.DEFAULT_STATE.hudExpanded,
          hudActiveTab: result[this.STORAGE_KEYS.HUD_ACTIVE_TAB] ?? this.DEFAULT_STATE.hudActiveTab,
          cursorMode: result[this.STORAGE_KEYS.CURSOR_MODE] ?? this.DEFAULT_STATE.cursorMode,
          timestamp: result[this.STORAGE_KEYS.EARLY_STATE_TIMESTAMP] ?? Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.warn('[StateBridge] Failed to load from storage:', error);
      return null;
    }
  }

  /**
   * Get data from Chrome storage
   */
  async getFromStorage(storageType) {
    try {
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const keys = Object.values(this.STORAGE_KEYS);
      
      return await storage.get(keys);
    } catch (error) {
      console.warn(`[StateBridge] Failed to access ${storageType} storage:`, error);
      return {};
    }
  }

  /**
   * Save early state to storage
   */
  async saveEarlyState(state = null) {
    if (this.syncInProgress) {
      console.log('[StateBridge] Sync already in progress, skipping save');
      return false;
    }
    
    try {
      this.syncInProgress = true;
      
      const stateToSave = state || this.earlyState;
      stateToSave.timestamp = Date.now();
      
      // Update local cache
      this.earlyState = { ...stateToSave };
      
      // Try service worker first if available
      if (this.serviceWorkerAvailable) {
        const saved = await this.saveStateViaServiceWorker(stateToSave);
        if (saved) {
          console.log('[StateBridge] State saved via service worker');
          return true;
        }
      }
      
      // Fallback to direct storage
      const saved = await this.saveStateToStorage(stateToSave);
      if (saved) {
        console.log('[StateBridge] State saved to storage');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to save early state:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Save state via service worker
   */
  async saveStateViaServiceWorker(state) {
    try {
      // Save extension enabled state
      const extensionResponse = await chrome.runtime.sendMessage({
        type: 'KP_SET_STATE',
        enabled: state.extensionEnabled
      });
      
      // Save complete HUD state
      const hudResponse = await chrome.runtime.sendMessage({
        type: 'KP_SET_COMPLETE_HUD_STATE',
        hudState: {
          visible: state.hudVisible,
          expanded: state.hudExpanded,
          activeTab: state.hudActiveTab
        }
      });
      
      return extensionResponse?.enabled === state.extensionEnabled && 
             hudResponse?.hudState?.visible === state.hudVisible;
    } catch (error) {
      console.warn('[StateBridge] Failed to save via service worker:', error);
      return false;
    }
  }

  /**
   * Save state directly to Chrome storage
   */
  async saveStateToStorage(state) {
    const stateData = {
      [this.STORAGE_KEYS.EXTENSION_ENABLED]: state.extensionEnabled,
      [this.STORAGE_KEYS.HUD_VISIBLE]: state.hudVisible,
      [this.STORAGE_KEYS.HUD_EXPANDED]: state.hudExpanded,
      [this.STORAGE_KEYS.HUD_ACTIVE_TAB]: state.hudActiveTab,
      [this.STORAGE_KEYS.CURSOR_MODE]: state.cursorMode,
      [this.STORAGE_KEYS.EARLY_STATE_TIMESTAMP]: state.timestamp
    };
    
    try {
      // Try sync storage first
      await chrome.storage.sync.set(stateData);
      return true;
    } catch (syncError) {
      console.warn('[StateBridge] Sync storage failed, trying local:', syncError);
      
      try {
        // Fallback to local storage
        await chrome.storage.local.set(stateData);
        return true;
      } catch (localError) {
        console.error('[StateBridge] Both storage methods failed:', localError);
        return false;
      }
    }
  }

  /**
   * Set up message listener for state synchronization
   */
  setupMessageListener() {
    try {
      if (!chrome?.runtime?.onMessage) {
        console.warn('[StateBridge] Chrome runtime messaging not available');
        return;
      }
      
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Handle state synchronization messages
        if (message.type === 'KP_TOGGLE_STATE') {
          this.handleExtensionToggle(message.enabled);
          sendResponse({ success: true });
          return true;
        }
        
        if (message.type === 'KP_HUD_STATE_SYNC') {
          this.handleHUDStateSync(message.hudState);
          sendResponse({ success: true });
          return true;
        }
        
        if (message.type === 'KP_CURSOR_MODE_UPDATE') {
          this.handleCursorModeUpdate(message.mode);
          sendResponse({ success: true });
          return true;
        }
        
        if (message.type === 'KP_EARLY_STATE_REQUEST') {
          sendResponse({ 
            success: true, 
            state: this.earlyState 
          });
          return true;
        }
        
        if (message.type === 'KP_NAVIGATION_STATE_UPDATE') {
          this.handleNavigationStateUpdate(message.navigationState);
          sendResponse({ success: true });
          return true;
        }
      });
      
      console.log('[StateBridge] Message listener set up');
    } catch (error) {
      console.error('[StateBridge] Failed to set up message listener:', error);
    }
  }

  /**
   * Handle extension toggle from service worker
   */
  handleExtensionToggle(enabled) {
    try {
      this.earlyState.extensionEnabled = enabled;
      this.earlyState.timestamp = Date.now();
      
      // Emit event for early injection components
      this.emit('extensionToggle', { enabled });
      
      console.log('[StateBridge] Extension toggle handled:', enabled);
    } catch (error) {
      console.error('[StateBridge] Failed to handle extension toggle:', error);
    }
  }

  /**
   * Handle cursor mode updates for persistence
   */
  handleCursorModeUpdate(mode) {
    try {
      this.earlyState.cursorMode = mode;
      this.earlyState.timestamp = Date.now();
      
      // Save to storage for navigation persistence
      this.saveEarlyState().catch(error => {
        console.warn('[StateBridge] Failed to save cursor mode:', error);
      });
      
      // Emit event for components
      this.emit('cursorModeUpdate', { mode });
      
      console.log('[StateBridge] Cursor mode updated:', mode);
    } catch (error) {
      console.error('[StateBridge] Failed to handle cursor mode update:', error);
    }
  }

  /**
   * Handle HUD state synchronization from service worker
   */
  handleHUDStateSync(hudState) {
    try {
      this.earlyState.hudVisible = hudState.visible;
      this.earlyState.hudExpanded = hudState.expanded;
      this.earlyState.hudActiveTab = hudState.activeTab;
      this.earlyState.timestamp = Date.now();
      
      // Emit event for early injection components
      this.emit('hudStateSync', { hudState });
      
      console.log('[StateBridge] HUD state sync handled:', hudState);
    } catch (error) {
      console.error('[StateBridge] Failed to handle HUD state sync:', error);
    }
  }

  /**
   * Get current early state
   */
  getEarlyState() {
    return { ...this.earlyState };
  }

  /**
   * Update early state
   */
  updateEarlyState(updates) {
    try {
      const prevState = { ...this.earlyState };
      this.earlyState = {
        ...this.earlyState,
        ...updates,
        timestamp: Date.now()
      };
      
      // Emit state change event
      this.emit('stateChange', {
        prevState,
        newState: this.earlyState,
        updates
      });
      
      console.log('[StateBridge] Early state updated:', updates);
      return true;
    } catch (error) {
      console.error('[StateBridge] Failed to update early state:', error);
      return false;
    }
  }

  /**
   * Alias for updateEarlyState for compatibility with main script
   */
  updateState(updates) {
    return this.updateEarlyState(updates);
  }

  /**
   * Sync with service worker
   * Forces a fresh state load from service worker
   */
  async syncWithServiceWorker() {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker not available for sync');
        return false;
      }
      
      const freshState = await this.loadStateFromServiceWorker();
      if (freshState) {
        this.earlyState = {
          ...this.DEFAULT_STATE,
          ...freshState,
          timestamp: Date.now()
        };
        
        // Emit sync event
        this.emit('serviceWorkerSync', { state: this.earlyState });
        
        console.log('[StateBridge] Synced with service worker:', this.earlyState);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to sync with service worker:', error);
      return false;
    }
  }

  /**
   * Handle state transition from early injection to full initialization
   * Returns state for main script to use
   */
  handleStateTransition() {
    try {
      const transitionState = {
        ...this.earlyState,
        transitionTimestamp: Date.now(),
        source: 'early-injection'
      };
      
      // Emit transition event
      this.emit('stateTransition', { state: transitionState });
      
      console.log('[StateBridge] State transition handled:', transitionState);
      return transitionState;
    } catch (error) {
      console.error('[StateBridge] Failed to handle state transition:', error);
      return this.earlyState;
    }
  }

  /**
   * Create fallback state management
   * Used when service worker is unavailable
   */
  createFallbackState() {
    try {
      const fallbackState = {
        ...this.DEFAULT_STATE,
        timestamp: Date.now(),
        fallback: true
      };
      
      this.earlyState = fallbackState;
      
      console.log('[StateBridge] Fallback state created:', fallbackState);
      return fallbackState;
    } catch (error) {
      console.error('[StateBridge] Failed to create fallback state:', error);
      return this.DEFAULT_STATE;
    }
  }

  /**
   * Check if service worker is available
   */
  isServiceWorkerAvailable() {
    return this.serviceWorkerAvailable;
  }

  /**
   * Get state age in milliseconds
   */
  getStateAge() {
    return Date.now() - (this.earlyState.timestamp || 0);
  }

  /**
   * Check if state is stale (older than 5 seconds)
   */
  isStateStale() {
    return this.getStateAge() > 5000;
  }

  /**
   * Handle navigation state updates from other tabs
   */
  handleNavigationStateUpdate(navigationState) {
    try {
      // Check if this is a more recent state
      if (navigationState.navigationTimestamp > (this.earlyState.timestamp || 0)) {
        // Update early state with navigation state
        this.earlyState = {
          ...this.earlyState,
          extensionEnabled: navigationState.extensionEnabled,
          hudVisible: navigationState.hudVisible,
          hudExpanded: navigationState.hudExpanded,
          hudActiveTab: navigationState.hudActiveTab,
          cursorMode: navigationState.cursorMode,
          timestamp: navigationState.navigationTimestamp
        };
        
        // Emit navigation state update event
        this.emit('navigationStateUpdate', { 
          navigationState,
          updatedState: this.earlyState 
        });
        
        console.log('[StateBridge] Navigation state update handled:', navigationState);
      } else {
        console.log('[StateBridge] Ignoring older navigation state update');
      }
    } catch (error) {
      console.error('[StateBridge] Failed to handle navigation state update:', error);
    }
  }

  /**
   * Save state before navigation
   * @param {string} url - URL being navigated to
   */
  async savePreNavigationState(url = 'unknown') {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker unavailable for pre-navigation state save');
        return false;
      }
      
      const response = await chrome.runtime.sendMessage({
        type: 'KP_PRE_NAVIGATION_STATE',
        url: url,
        state: this.earlyState
      });
      
      if (response && response.type === 'KP_PRE_NAVIGATION_STATE_SAVED') {
        console.log('[StateBridge] Pre-navigation state saved');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to save pre-navigation state:', error);
      return false;
    }
  }

  /**
   * Sync state during navigation
   * Ensures state persists across page transitions
   */
  async syncNavigationState() {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker unavailable for navigation sync');
        return false;
      }
      
      const navigationState = {
        ...this.earlyState,
        navigationTimestamp: Date.now(),
        sourceTabId: null // Will be set by service worker
      };
      
      const response = await chrome.runtime.sendMessage({
        type: 'KP_NAVIGATION_STATE_SYNC',
        state: navigationState
      });
      
      if (response && response.success) {
        console.log('[StateBridge] Navigation state synchronized');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to sync navigation state:', error);
      return false;
    }
  }

  /**
   * Handle rapid navigation conflicts
   * @param {Object} incomingState - Incoming navigation state
   * @returns {boolean} Whether the incoming state was applied
   */
  handleNavigationConflict(incomingState) {
    try {
      const currentTimestamp = this.earlyState.timestamp || 0;
      const incomingTimestamp = incomingState.navigationTimestamp || 0;
      
      // If incoming state is newer, apply it
      if (incomingTimestamp > currentTimestamp) {
        this.earlyState = {
          ...this.earlyState,
          ...incomingState,
          timestamp: incomingTimestamp
        };
        
        this.emit('navigationConflictResolved', {
          resolvedState: this.earlyState,
          incomingState
        });
        
        console.log('[StateBridge] Navigation conflict resolved - applied incoming state');
        return true;
      }
      
      console.log('[StateBridge] Navigation conflict resolved - kept current state');
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to handle navigation conflict:', error);
      return false;
    }
  }

  /**
   * Ensure state persistence during page transitions
   * Called during beforeunload or similar events
   */
  async ensureStatePersistence() {
    try {
      // Save current state to storage
      const saved = await this.saveEarlyState();
      
      // Also sync with service worker if available
      if (this.serviceWorkerAvailable) {
        await this.syncNavigationState();
      }
      
      console.log('[StateBridge] State persistence ensured:', saved);
      return saved;
    } catch (error) {
      console.error('[StateBridge] Failed to ensure state persistence:', error);
      return false;
    }
  }

  /**
   * Save cursor position for restoration after navigation
   */
  saveCursorPosition(x, y) {
    try {
      this.earlyState.cursorPosition = { x, y };
      this.earlyState.timestamp = Date.now();
      
      // Save to storage for navigation persistence
      this.saveEarlyState().catch(error => {
        console.warn('[StateBridge] Failed to save cursor position:', error);
      });
      
      console.log('[StateBridge] Cursor position saved:', { x, y });
    } catch (error) {
      console.error('[StateBridge] Failed to save cursor position:', error);
    }
  }

  /**
   * Get saved cursor position
   */
  getSavedCursorPosition() {
    try {
      return this.earlyState.cursorPosition || null;
    } catch (error) {
      console.error('[StateBridge] Failed to get saved cursor position:', error);
      return null;
    }
  }

  /**
   * Sync cursor state across tabs
   */
  async syncCursorStateAcrossTabs(cursorState) {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker unavailable for cursor sync');
        return false;
      }
      
      const response = await chrome.runtime.sendMessage({
        type: 'KP_CURSOR_STATE_BROADCAST',
        cursorState: cursorState
      });
      
      if (response && response.success) {
        console.log('[StateBridge] Cursor state synced across tabs');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to sync cursor state across tabs:', error);
      return false;
    }
  }

  /**
   * Clean up the state bridge
   */
  cleanup() {
    try {
      // Remove event listeners
      this.removeAllListeners();
      
      // Clear state cache
      this.earlyState = { ...this.DEFAULT_STATE };
      
      console.log('[StateBridge] Cleaned up');
    } catch (error) {
      console.error('[StateBridge] Error during cleanup:', error);
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
    this.hudManager = new HUDManager(this.state, this.styleManager);
    
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
    // Step 1: Detect early injection and get placeholders
    const earlyInjectionResult = this.detectEarlyInjection();
    
    // Step 2: Set up styles and shadow DOM support (skip if early injection handled styles)
    if (!earlyInjectionResult.stylesInjected) {
      this.setupStyles();
    }
    this.setupShadowDOMSupport();
    
    // Step 3: Handle cursor initialization based on early injection
    if (earlyInjectionResult.detected) {
      // Enhance existing cursor placeholder with state bridge
      await this.enhanceCursorPlaceholder(
        earlyInjectionResult.placeholders.cursor, 
        earlyInjectionResult.stateBridge
      );
    } else {
      // Create cursor normally (fallback)
      this.cursor.ensure();
    }
    
    // Step 4: Handle placeholder transition and migrate state if early injection occurred
    if (earlyInjectionResult.detected) {
      this.handlePlaceholderTransition(earlyInjectionResult);
      this.migrateStateFromPlaceholders(earlyInjectionResult);
    }
    
    // Step 5: Query service worker for current enabled state
    await this.queryInitialState();
    
    // Step 6: Handle fallback scenarios if needed
    if (!earlyInjectionResult.detected || 
        document.documentElement.getAttribute('data-kpv2-early-injection') === 'failed') {
      this.handleEarlyInjectionFallback(earlyInjectionResult);
    }
    
    // Step 7: Initialize functionality based on enabled state
    if (this.enabled) {
      await this.initializeEnabledState(earlyInjectionResult);
    } else {
      this.initializeDisabledState();
    }
    
    // Step 8: Set up navigation persistence for cursor state
    this.setupNavigationPersistence(earlyInjectionResult);

    // Step 8: Always set up communication and state management
    this.state.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });

    this.setupPopupCommunication();
    this.setupOptimizedEventListeners();
    this.setupContinuousCursorSync();

    this.initializationComplete = true;
    this.state.setState({ isInitialized: true });
  }

  /**
   * Detect if early injection occurred successfully
   * Returns information about placeholders and injection status
   */
  detectEarlyInjection() {
    const result = {
      detected: false,
      stylesInjected: false,
      placeholders: {
        hud: null,
        cursor: null
      },
      earlyState: null,
      stateBridge: null
    };

    try {
      // Check for early injection marker
      const injectionStatus = document.documentElement.getAttribute('data-kpv2-early-injection');
      
      if (injectionStatus === 'complete') {
        result.detected = true;
        console.log('[KeyPilot] Early injection detected successfully');
        
        // Look for placeholder elements
        result.placeholders.hud = document.getElementById('kpv2-hud');
        result.placeholders.cursor = document.getElementById('kpv2-cursor');
        
        // Check if placeholders have early injection markers
        if (result.placeholders.hud && result.placeholders.hud.getAttribute('data-early-injection') === 'true') {
          console.log('[KeyPilot] HUD placeholder found');
        }
        
        if (result.placeholders.cursor && result.placeholders.cursor.getAttribute('data-early-injection') === 'true') {
          console.log('[KeyPilot] Cursor placeholder found');
        }
        
        // Check if critical styles were injected
        const criticalStylesElement = document.getElementById('kpv2-critical-styles');
        if (criticalStylesElement) {
          result.stylesInjected = true;
          console.log('[KeyPilot] Critical styles detected');
        }
        
        // Try to get early injector instance and state bridge
        if (window.kpv2EarlyInjector) {
          result.stateBridge = window.kpv2EarlyInjector.getStateBridge();
          result.earlyState = window.kpv2EarlyInjector.getEarlyState();
          console.log('[KeyPilot] Early injector instance found, state:', result.earlyState);
        }
        
      } else if (injectionStatus === 'failed') {
        console.warn('[KeyPilot] Early injection failed, using fallback initialization');
      } else {
        console.log('[KeyPilot] No early injection detected, using normal initialization');
      }
      
    } catch (error) {
      console.error('[KeyPilot] Error detecting early injection:', error);
      // Continue with fallback
    }
    
    return result;
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
   * Enhance cursor placeholder with full functionality
   */
  async enhanceCursorPlaceholder(cursorPlaceholder, stateBridge = null) {
    try {
      if (!cursorPlaceholder) {
        console.warn('[KeyPilot] No cursor placeholder to enhance, creating new cursor');
        this.cursor.ensure();
        return;
      }
      
      console.log('[KeyPilot] Enhancing cursor placeholder');
      
      // Tell cursor manager to use existing element with state bridge
      this.cursor.enhanceExistingElement(cursorPlaceholder, stateBridge);
      
      // Remove early injection marker
      cursorPlaceholder.removeAttribute('data-early-injection');
      
      console.log('[KeyPilot] Cursor placeholder enhanced successfully');
      
    } catch (error) {
      console.error('[KeyPilot] Failed to enhance cursor placeholder:', error);
      // Fallback to creating new cursor
      this.cursor.ensure();
    }
  }

  /**
   * Initialize KeyPilot in enabled state
   */
  async initializeEnabledState(earlyInjectionResult = null) {
    this.focusDetector.start();
    this.intersectionManager.init();
    this.scrollManager.init();
    
    // Handle HUD initialization based on early injection
    if (earlyInjectionResult && earlyInjectionResult.detected && earlyInjectionResult.placeholders.hud) {
      // Enhance existing HUD placeholder
      await this.hudManager.enhanceExistingElement(
        earlyInjectionResult.placeholders.hud,
        earlyInjectionResult.earlyState,
        earlyInjectionResult.stateBridge
      );
    } else {
      // Initialize HUD normally (fallback)
      await this.hudManager.initialize();
    }
    
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

  /**
   * Handle fallback scenarios when early injection fails or is incomplete
   */
  handleEarlyInjectionFallback(earlyInjectionResult) {
    try {
      console.log('[KeyPilot] Handling early injection fallback');
      
      // Determine fallback strategy based on injection status
      const injectionStatus = document.documentElement.getAttribute('data-kpv2-early-injection');
      
      if (injectionStatus === 'failed') {
        console.log('[KeyPilot] Early injection failed, performing cleanup and full fallback');
        this.handleFailedInjectionFallback(earlyInjectionResult);
      } else if (!earlyInjectionResult.detected) {
        console.log('[KeyPilot] No early injection detected, using normal initialization');
        this.handleNoInjectionFallback();
      } else {
        console.log('[KeyPilot] Partial early injection detected, ensuring completeness');
        this.handlePartialInjectionFallback(earlyInjectionResult);
      }
      
      // Always ensure all functionality works regardless of injection timing
      this.ensureFunctionalityAvailable();
      
      // Verify critical components are working
      this.verifyComponentIntegrity();
      
      console.log('[KeyPilot] Fallback handling completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error during fallback handling:', error);
      // Continue with basic functionality
      this.handleCriticalFallback();
    }
  }

  /**
   * Handle fallback when early injection completely failed
   */
  handleFailedInjectionFallback(earlyInjectionResult) {
    try {
      console.log('[KeyPilot] Handling failed injection fallback');
      
      // Clean up any partial state from failed injection
      this.cleanupFailedEarlyInjection();
      
      // Reset to clean state for normal initialization
      this.resetToCleanState();
      
      // Ensure no early injection artifacts remain
      this.removeEarlyInjectionArtifacts();
      
    } catch (error) {
      console.error('[KeyPilot] Error in failed injection fallback:', error);
    }
  }

  /**
   * Handle fallback when no early injection was attempted
   */
  handleNoInjectionFallback() {
    try {
      console.log('[KeyPilot] Handling no injection fallback - normal initialization');
      
      // This is the normal case - just ensure everything is set up correctly
      // No special handling needed, just log for debugging
      
    } catch (error) {
      console.error('[KeyPilot] Error in no injection fallback:', error);
    }
  }

  /**
   * Handle fallback when early injection was partial or incomplete
   */
  handlePartialInjectionFallback(earlyInjectionResult) {
    try {
      console.log('[KeyPilot] Handling partial injection fallback');
      
      // Check what's missing and fill in the gaps
      if (!earlyInjectionResult.placeholders.hud) {
        console.log('[KeyPilot] HUD placeholder missing, will create normally');
      }
      
      if (!earlyInjectionResult.placeholders.cursor) {
        console.log('[KeyPilot] Cursor placeholder missing, will create normally');
      }
      
      if (!earlyInjectionResult.stylesInjected) {
        console.log('[KeyPilot] Critical styles missing, will inject normally');
      }
      
      // Let the normal initialization handle missing pieces
      
    } catch (error) {
      console.error('[KeyPilot] Error in partial injection fallback:', error);
    }
  }

  /**
   * Handle critical fallback when all other fallbacks fail
   */
  handleCriticalFallback() {
    try {
      console.warn('[KeyPilot] Executing critical fallback - minimal functionality mode');
      
      // Ensure absolute minimum functionality
      if (!this.state) {
        console.error('[KeyPilot] State manager missing in critical fallback');
        return;
      }
      
      if (!this.cursor) {
        console.error('[KeyPilot] Cursor manager missing in critical fallback');
        return;
      }
      
      // Try to create cursor with minimal functionality
      try {
        this.cursor.ensure();
      } catch (error) {
        console.error('[KeyPilot] Failed to create cursor in critical fallback:', error);
      }
      
      // Try to inject basic styles
      try {
        if (this.styleManager) {
          this.styleManager.injectSharedStyles();
        }
      } catch (error) {
        console.error('[KeyPilot] Failed to inject styles in critical fallback:', error);
      }
      
      console.log('[KeyPilot] Critical fallback completed');
      
    } catch (error) {
      console.error('[KeyPilot] Critical fallback failed:', error);
      // At this point, we can't do much more
    }
  }

  /**
   * Reset to clean state for normal initialization
   */
  resetToCleanState() {
    try {
      // Reset any flags or state that might interfere with normal initialization
      this.initializationComplete = false;
      
      // Clear any cached elements that might be from failed injection
      if (this.hudManager) {
        this.hudManager.hudElement = null;
      }
      
      if (this.cursor) {
        this.cursor.cursorEl = null;
      }
      
      console.log('[KeyPilot] Reset to clean state for normal initialization');
      
    } catch (error) {
      console.error('[KeyPilot] Error resetting to clean state:', error);
    }
  }

  /**
   * Remove any artifacts from early injection attempts
   */
  removeEarlyInjectionArtifacts() {
    try {
      // Remove early injection markers
      document.documentElement.removeAttribute('data-kpv2-early-injection');
      
      // Remove any global early injection variables
      if (window.kpv2EarlyInjector) {
        try {
          // Try to cleanup early injector if it has cleanup method
          if (typeof window.kpv2EarlyInjector.cleanup === 'function') {
            window.kpv2EarlyInjector.cleanup();
          }
        } catch (error) {
          console.warn('[KeyPilot] Error cleaning up early injector:', error);
        }
        
        delete window.kpv2EarlyInjector;
      }
      
      console.log('[KeyPilot] Early injection artifacts removed');
      
    } catch (error) {
      console.error('[KeyPilot] Error removing early injection artifacts:', error);
    }
  }

  /**
   * Clean up any partial state from failed early injection
   */
  cleanupFailedEarlyInjection() {
    try {
      // Remove any partial placeholder elements
      const partialHUD = document.getElementById('kpv2-hud');
      if (partialHUD && partialHUD.getAttribute('data-early-injection') === 'true') {
        partialHUD.remove();
        console.log('[KeyPilot] Removed partial HUD placeholder');
      }
      
      const partialCursor = document.getElementById('kpv2-cursor');
      if (partialCursor && partialCursor.getAttribute('data-early-injection') === 'true') {
        partialCursor.remove();
        console.log('[KeyPilot] Removed partial cursor placeholder');
      }
      
      // Remove partial critical styles
      const partialStyles = document.getElementById('kpv2-critical-styles');
      if (partialStyles) {
        partialStyles.remove();
        console.log('[KeyPilot] Removed partial critical styles');
      }
      
      // Clear early injection marker
      document.documentElement.removeAttribute('data-kpv2-early-injection');
      
    } catch (error) {
      console.error('[KeyPilot] Error cleaning up failed early injection:', error);
    }
  }

  /**
   * Ensure all functionality is available regardless of injection timing
   */
  ensureFunctionalityAvailable() {
    try {
      console.log('[KeyPilot] Ensuring all functionality is available');
      
      // Ensure cursor exists and is functional
      this.ensureCursorFunctionality();
      
      // Ensure styles are injected
      this.ensureStylesFunctionality();
      
      // Ensure HUD functionality
      this.ensureHUDFunctionality();
      
      // Ensure event handling is set up
      this.ensureEventHandling();
      
      // Ensure state management is working
      this.ensureStateManagement();
      
      console.log('[KeyPilot] All functionality availability ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring functionality availability:', error);
    }
  }

  /**
   * Ensure cursor functionality is available
   */
  ensureCursorFunctionality() {
    try {
      if (!this.cursor) {
        console.error('[KeyPilot] Cursor manager not available');
        return;
      }
      
      // Check if cursor element exists and is in DOM
      if (!this.cursor.element || !document.contains(this.cursor.element)) {
        console.log('[KeyPilot] Creating cursor element');
        this.cursor.ensure();
      }
      
      // Verify cursor can be positioned
      if (this.cursor.element) {
        const testX = 100, testY = 100;
        this.cursor.updatePosition(testX, testY);
        
        // Check if position was applied
        const rect = this.cursor.element.getBoundingClientRect();
        if (Math.abs(rect.left + rect.width/2 - testX) > 10 || 
            Math.abs(rect.top + rect.height/2 - testY) > 10) {
          console.warn('[KeyPilot] Cursor positioning may not be working correctly');
        }
      }
      
      console.log('[KeyPilot] Cursor functionality ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring cursor functionality:', error);
    }
  }

  /**
   * Ensure styles functionality is available
   */
  ensureStylesFunctionality() {
    try {
      if (!this.styleManager) {
        console.error('[KeyPilot] Style manager not available');
        return;
      }
      
      // Check if styles are injected
      const hasSharedStyles = document.getElementById('kpv2-shared-styles');
      const hasCriticalStyles = document.getElementById('kpv2-critical-styles');
      
      if (!hasSharedStyles && !hasCriticalStyles) {
        console.log('[KeyPilot] Injecting styles');
        this.styleManager.injectSharedStyles();
      }
      
      // Verify styles were injected
      const stylesAfterInjection = document.getElementById('kpv2-shared-styles') || 
                                   document.getElementById('kpv2-critical-styles');
      
      if (!stylesAfterInjection) {
        console.warn('[KeyPilot] Styles injection may have failed');
      }
      
      console.log('[KeyPilot] Styles functionality ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring styles functionality:', error);
    }
  }

  /**
   * Ensure HUD functionality is available
   */
  ensureHUDFunctionality() {
    try {
      if (!this.hudManager) {
        console.error('[KeyPilot] HUD manager not available');
        return;
      }
      
      // HUD initialization will be handled by the main initialization flow
      // Just verify the manager is ready
      if (typeof this.hudManager.initialize !== 'function') {
        console.error('[KeyPilot] HUD manager initialize method not available');
        return;
      }
      
      console.log('[KeyPilot] HUD functionality ready for initialization');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring HUD functionality:', error);
    }
  }

  /**
   * Ensure event handling is set up
   */
  ensureEventHandling() {
    try {
      // Verify event manager base functionality
      if (typeof this.addEventListener !== 'function') {
        console.error('[KeyPilot] Event handling not available');
        return;
      }
      
      // Event listeners will be set up by the main initialization flow
      console.log('[KeyPilot] Event handling functionality ready');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring event handling:', error);
    }
  }

  /**
   * Ensure state management is working
   */
  ensureStateManagement() {
    try {
      if (!this.state) {
        console.error('[KeyPilot] State manager not available');
        return;
      }
      
      // Test basic state functionality
      if (typeof this.state.getState !== 'function' || 
          typeof this.state.setState !== 'function') {
        console.error('[KeyPilot] State manager methods not available');
        return;
      }
      
      // Test state access
      const currentState = this.state.getState();
      if (!currentState || typeof currentState !== 'object') {
        console.warn('[KeyPilot] State manager may not be working correctly');
      }
      
      console.log('[KeyPilot] State management functionality ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring state management:', error);
    }
  }

  /**
   * Handle seamless transition from placeholders to full functionality
   */
  handlePlaceholderTransition(earlyInjectionResult) {
    try {
      if (!earlyInjectionResult.detected) {
        console.log('[KeyPilot] No placeholder transition needed');
        return;
      }
      
      console.log('[KeyPilot] Handling placeholder transition to full functionality');
      
      // Preserve visual continuity during transition
      this.preserveVisualContinuity(earlyInjectionResult);
      
      // Ensure no flickering during enhancement
      this.preventTransitionFlicker(earlyInjectionResult);
      
      // Set up state bridge integration if available
      if (earlyInjectionResult.stateBridge) {
        this.integrateStateBridge(earlyInjectionResult.stateBridge);
      }
      
      console.log('[KeyPilot] Placeholder transition completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error during placeholder transition:', error);
      // Continue with normal functionality
    }
  }

  /**
   * Preserve visual continuity during placeholder enhancement
   */
  preserveVisualContinuity(earlyInjectionResult) {
    try {
      // Ensure HUD remains visible during enhancement
      if (earlyInjectionResult.placeholders.hud) {
        const hud = earlyInjectionResult.placeholders.hud;
        
        // Temporarily prevent any visibility changes
        hud.style.transition = 'none';
        
        // Restore transitions after enhancement
        setTimeout(() => {
          if (hud.style) {
            hud.style.transition = '';
          }
        }, 100);
      }
      
      // Ensure cursor remains visible during enhancement
      if (earlyInjectionResult.placeholders.cursor) {
        const cursor = earlyInjectionResult.placeholders.cursor;
        
        // Temporarily prevent any visibility changes
        cursor.style.transition = 'none';
        
        // Restore transitions after enhancement
        setTimeout(() => {
          if (cursor.style) {
            cursor.style.transition = '';
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('[KeyPilot] Error preserving visual continuity:', error);
    }
  }

  /**
   * Prevent flickering during transition from placeholders to full elements
   */
  preventTransitionFlicker(earlyInjectionResult) {
    try {
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        // Any visual updates should happen here to prevent flickering
        if (earlyInjectionResult.placeholders.hud) {
          // Ensure HUD maintains its position and visibility
          const hud = earlyInjectionResult.placeholders.hud;
          const computedStyle = window.getComputedStyle(hud);
          
          // Preserve current visibility state
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            hud.style.opacity = '1';
          }
        }
        
        if (earlyInjectionResult.placeholders.cursor) {
          // Ensure cursor maintains its position and visibility
          const cursor = earlyInjectionResult.placeholders.cursor;
          const computedStyle = window.getComputedStyle(cursor);
          
          // Preserve current visibility state
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            cursor.style.opacity = '1';
          }
        }
      });
      
    } catch (error) {
      console.error('[KeyPilot] Error preventing transition flicker:', error);
    }
  }

  /**
   * Integrate with state bridge from early injection
   */
  integrateStateBridge(stateBridge) {
    try {
      if (!stateBridge) return;
      
      console.log('[KeyPilot] Integrating with state bridge from early injection');
      
      // Set up event listeners for state bridge events
      stateBridge.on('stateChange', (data) => {
        this.handleStateBridgeStateChange(data.newState, data.prevState);
      });
      
      stateBridge.on('extensionToggle', (data) => {
        if (data.enabled !== this.enabled) {
          if (data.enabled) {
            this.enable();
          } else {
            this.disable();
          }
        }
      });
      
      // Sync current state with state bridge
      const currentState = this.state.getState();
      stateBridge.updateState({
        mode: currentState.mode,
        extensionEnabled: this.enabled,
        hudVisible: currentState.hud?.visible,
        hudExpanded: currentState.hud?.expanded,
        hudActiveTab: currentState.hud?.activeTab
      });
      
      console.log('[KeyPilot] State bridge integration completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error integrating state bridge:', error);
    }
  }

  /**
   * Handle state changes from state bridge
   */
  handleStateBridgeStateChange(newState, prevState) {
    try {
      // Update local state based on state bridge changes
      if (newState.mode !== prevState.mode) {
        this.state.setState({ mode: newState.mode });
      }
      
      if (newState.hudVisible !== prevState.hudVisible ||
          newState.hudExpanded !== prevState.hudExpanded ||
          newState.hudActiveTab !== prevState.hudActiveTab) {
        this.state.setState({
          hud: {
            visible: newState.hudVisible,
            expanded: newState.hudExpanded,
            activeTab: newState.hudActiveTab
          }
        });
      }
      
    } catch (error) {
      console.error('[KeyPilot] Error handling state bridge state change:', error);
    }
  }

  /**
   * Migrate state from placeholders to full elements
   */
  migrateStateFromPlaceholders(earlyInjectionResult) {
    try {
      if (!earlyInjectionResult.detected || !earlyInjectionResult.earlyState) {
        console.log('[KeyPilot] No early state to migrate');
        return;
      }
      
      console.log('[KeyPilot] Migrating state from placeholders to full elements');
      
      const earlyState = earlyInjectionResult.earlyState;
      
      // Migrate HUD state
      if (earlyState.hudVisible !== undefined || earlyState.hudExpanded !== undefined) {
        const hudState = {
          visible: earlyState.hudVisible !== undefined ? earlyState.hudVisible : true,
          expanded: earlyState.hudExpanded !== undefined ? earlyState.hudExpanded : false,
          activeTab: earlyState.hudActiveTab || 'status'
        };
        
        // Update state manager with migrated HUD state
        this.state.setState({ hud: hudState });
        console.log('[KeyPilot] HUD state migrated:', hudState);
      }
      
      // Migrate cursor mode state
      if (earlyState.cursorMode) {
        this.state.setState({ mode: earlyState.cursorMode });
        console.log('[KeyPilot] Cursor mode migrated:', earlyState.cursorMode);
      }
      
      // Migrate extension enabled state
      if (earlyState.extensionEnabled !== undefined) {
        this.enabled = earlyState.extensionEnabled;
        console.log('[KeyPilot] Extension enabled state migrated:', this.enabled);
      }
      
      console.log('[KeyPilot] State migration completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error migrating state from placeholders:', error);
      // Continue with default state
    }
  }

  /**
   * Verify that critical components are working properly
   */
  verifyComponentIntegrity() {
    try {
      console.log('[KeyPilot] Verifying component integrity');
      
      const issues = [];
      const warnings = [];
      
      // Check cursor manager
      const cursorCheck = this.verifyCursorIntegrity();
      if (cursorCheck.issues.length > 0) issues.push(...cursorCheck.issues);
      if (cursorCheck.warnings.length > 0) warnings.push(...cursorCheck.warnings);
      
      // Check state manager
      const stateCheck = this.verifyStateIntegrity();
      if (stateCheck.issues.length > 0) issues.push(...stateCheck.issues);
      if (stateCheck.warnings.length > 0) warnings.push(...stateCheck.warnings);
      
      // Check style manager
      const styleCheck = this.verifyStyleIntegrity();
      if (styleCheck.issues.length > 0) issues.push(...styleCheck.issues);
      if (styleCheck.warnings.length > 0) warnings.push(...styleCheck.warnings);
      
      // Check HUD manager
      const hudCheck = this.verifyHUDIntegrity();
      if (hudCheck.issues.length > 0) issues.push(...hudCheck.issues);
      if (hudCheck.warnings.length > 0) warnings.push(...hudCheck.warnings);
      
      // Check other critical components
      const otherCheck = this.verifyOtherComponentsIntegrity();
      if (otherCheck.issues.length > 0) issues.push(...otherCheck.issues);
      if (otherCheck.warnings.length > 0) warnings.push(...otherCheck.warnings);
      
      // Report results
      if (issues.length > 0) {
        console.error('[KeyPilot] Component integrity issues detected:', issues);
        // Continue anyway - partial functionality is better than none
      }
      
      if (warnings.length > 0) {
        console.warn('[KeyPilot] Component integrity warnings:', warnings);
      }
      
      if (issues.length === 0 && warnings.length === 0) {
        console.log('[KeyPilot] All components verified as functional');
      }
      
      return { issues, warnings };
      
    } catch (error) {
      console.error('[KeyPilot] Error verifying component integrity:', error);
      return { issues: ['Component integrity verification failed'], warnings: [] };
    }
  }

  /**
   * Verify cursor manager integrity
   */
  verifyCursorIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.cursor) {
        issues.push('Cursor manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['ensure', 'updatePosition', 'setMode', 'show', 'hide'];
      for (const method of requiredMethods) {
        if (typeof this.cursor[method] !== 'function') {
          issues.push(`Cursor manager missing ${method} method`);
        }
      }
      
      // Check if cursor element can be created
      if (!this.cursor.element) {
        warnings.push('Cursor element not yet created');
      }
      
    } catch (error) {
      issues.push(`Cursor integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify state manager integrity
   */
  verifyStateIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.state) {
        issues.push('State manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['getState', 'setState', 'subscribe', 'reset'];
      for (const method of requiredMethods) {
        if (typeof this.state[method] !== 'function') {
          issues.push(`State manager missing ${method} method`);
        }
      }
      
      // Test basic state operations
      try {
        const currentState = this.state.getState();
        if (!currentState || typeof currentState !== 'object') {
          warnings.push('State manager returning invalid state');
        }
      } catch (error) {
        issues.push(`State manager getState failed: ${error.message}`);
      }
      
    } catch (error) {
      issues.push(`State integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify style manager integrity
   */
  verifyStyleIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.styleManager) {
        issues.push('Style manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['injectSharedStyles'];
      for (const method of requiredMethods) {
        if (typeof this.styleManager[method] !== 'function') {
          issues.push(`Style manager missing ${method} method`);
        }
      }
      
    } catch (error) {
      issues.push(`Style integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify HUD manager integrity
   */
  verifyHUDIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.hudManager) {
        issues.push('HUD manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['initialize', 'show', 'hide'];
      for (const method of requiredMethods) {
        if (typeof this.hudManager[method] !== 'function') {
          issues.push(`HUD manager missing ${method} method`);
        }
      }
      
      // Check if enhance method is available for early injection
      if (typeof this.hudManager.enhanceExistingElement !== 'function') {
        warnings.push('HUD manager missing enhanceExistingElement method');
      }
      
    } catch (error) {
      issues.push(`HUD integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify other critical components integrity
   */
  verifyOtherComponentsIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      // Check detector
      if (!this.detector || typeof this.detector.deepElementFromPoint !== 'function') {
        issues.push('Element detector not functional');
      }
      
      // Check activator
      if (!this.activator || typeof this.activator.smartClick !== 'function') {
        issues.push('Activation handler not functional');
      }
      
      // Check focus detector
      if (!this.focusDetector || typeof this.focusDetector.start !== 'function') {
        issues.push('Focus detector not functional');
      }
      
      // Check overlay manager
      if (!this.overlayManager || typeof this.overlayManager.updateOverlays !== 'function') {
        issues.push('Overlay manager not functional');
      }
      
    } catch (error) {
      issues.push(`Other components integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
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

  /**
   * Set up navigation persistence for cursor state
   */
  setupNavigationPersistence(earlyInjectionResult = null) {
    try {
      // Set up state bridge for cursor if available
      if (earlyInjectionResult && earlyInjectionResult.stateBridge) {
        this.cursor.setStateBridge(earlyInjectionResult.stateBridge);
      }
      
      // Handle page navigation events
      window.addEventListener('beforeunload', () => {
        if (this.cursor) {
          this.cursor.handleNavigationPersistence();
        }
      });
      
      // Handle visibility changes (tab switching, etc.)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.cursor) {
          this.cursor.handleNavigationPersistence();
        }
      });
      
      // Set up cross-tab cursor state synchronization
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'KP_CURSOR_STATE_SYNC') {
            this.cursor.handleCrossTabSync(message.cursorState);
            sendResponse({ success: true });
            return true;
          }
        });
      }
      
      console.log('[KeyPilot] Navigation persistence set up for cursor');
    } catch (error) {
      console.error('[KeyPilot] Failed to set up navigation persistence:', error);
    }
  }

  handleStateChange(newState, prevState) {
    // Update cursor mode
    if (newState.mode !== prevState.mode) {
      this.cursor.setMode(newState.mode);
      this.updatePopupStatus(newState.mode);
      
      // Update HUD mode display when KeyPilot mode changes
      if (this.hudManager && this.enabled) {
        this.hudManager.updateModeDisplay(newState.mode);
      }
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
        this.handleEscapeFromTextFocus();
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

    // Handle our keyboard shortcuts
    if (KEYBINDINGS.CANCEL.includes(e.key)) {
      e.preventDefault();
      this.cancelModes();
    } else if (KEYBINDINGS.BACK.includes(e.key) || KEYBINDINGS.BACK2.includes(e.key)) {
      e.preventDefault();
      history.back();
    } else if (KEYBINDINGS.FORWARD.includes(e.key)) {
      e.preventDefault();
      history.forward();
    } else if (KEYBINDINGS.ROOT.includes(e.key)) {
      e.preventDefault();
      this.handleRootKey();
    } else if (KEYBINDINGS.DELETE.includes(e.key)) {
      e.preventDefault();
      this.handleDeleteKey();
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
    const clickable = this.detector.findClickable(under);
    
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
      this.state.setDeleteElement(under);
    } else {
      // Clear delete element when not in delete mode
      this.state.setDeleteElement(null);
    }
  }

  handleDeleteKey() {
    const currentState = this.state.getState();
    console.log('[KeyPilot Debug] Delete key pressed, current mode:', currentState.mode);

    if (!this.state.isDeleteMode()) {
      console.log('[KeyPilot Debug] Entering delete mode');
      this.state.setMode(MODES.DELETE);
    } else {
      console.log('[KeyPilot Debug] Already in delete mode, executing delete');
      const victim = currentState.deleteEl ||
        this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

      console.log('[KeyPilot Debug] Delete victim:', victim);
      this.cancelModes();
      this.deleteElement(victim);
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
      window.location.href = rootUrl;
    } else {
      console.log('[KeyPilot] Already at root, no navigation needed');
    }
  }

  handleActivateKey() {
    const currentState = this.state.getState();
    const target = currentState.focusEl ||
      this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

    if (!target || target === document.documentElement || target === document.body) {
      return;
    }

    // Try semantic activation first
    if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      return;
    }

    // Fallback to click
    this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
    this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
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

  handleEscapeFromTextFocus() {
    console.debug('Escape pressed in text focus mode, attempting to exit');

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

  cancelModes() {
    // Don't reset if we're in text focus mode - that should only be cleared by ESC or blur
    if (this.state.getState().mode !== MODES.TEXT_FOCUS) {
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

  updateOverlays(focusEl, deleteEl) {
    const currentState = this.state.getState();
    console.log('[KeyPilot Debug] updateOverlays called:', {
      focusEl: focusEl?.tagName,
      deleteEl: deleteEl?.tagName,
      mode: currentState.mode
    });
    this.overlayManager.updateOverlays(focusEl, deleteEl, currentState.mode);
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
  async enable() {
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
      
      // Initialize HUD manager and restore HUD state from storage
      if (this.hudManager) {
        await this.hudManager.handleKeyPilotEnabled();
      }
      
      // Reset only the KeyPilot state to normal mode, preserve HUD state
      this.state.setState({
        mode: MODES.NONE,
        focusEl: null,
        deleteEl: null
        // Don't reset HUD state - it was restored by hudManager.initialize()
      });
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
      
      // Notify HUD manager that KeyPilot is being disabled
      if (this.hudManager) {
        this.hudManager.handleKeyPilotDisabled();
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

    // Clean up HUD manager
    if (this.hudManager) {
      this.hudManager.cleanup();
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
