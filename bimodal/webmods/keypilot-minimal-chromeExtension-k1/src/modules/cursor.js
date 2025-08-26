/**
 * Cursor overlay management
 */
export class CursorManager {
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