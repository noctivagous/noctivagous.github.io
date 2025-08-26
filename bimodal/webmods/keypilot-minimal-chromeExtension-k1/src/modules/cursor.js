/**
 * Cursor overlay management
 */
export class CursorManager {
  constructor() {
    this.cursorEl = null;
    this.connectionLineEl = null;
    this.bottomLineEl = null;
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

    // Handle connection line for text mode
    if (mode === 'text_focus' && options.focusedElement) {
      this.showConnectionLine(options.focusedElement);
    } else {
      this.hideConnectionLine();
    }
  }

  // Method to update the focused element without changing mode
  updateFocusedElement(focusedElement) {
    if (this.focusedElement !== focusedElement) {
      this.focusedElement = focusedElement;

      // If we're in text focus mode and have connection lines, update them
      if (this.connectionLineEl && this.focusedElement) {
        this.updateConnectionLine(this.lastPosition.x, this.lastPosition.y);
        this.updateBottomLine();
      }
    }
  }

  // Method to force refresh connection lines (useful for initial setup)
  refreshConnectionLines() {
    if (this.focusedElement && this.connectionLineEl) {
      this.updateConnectionLine(this.lastPosition.x, this.lastPosition.y);
      this.updateBottomLine();
    }
  }

  updatePosition(x, y) {
    if (!this.cursorEl) return;

    // Store the intended position
    this.lastPosition = { x, y };

    // Use multiple positioning strategies for maximum compatibility
    this.forceUpdatePosition(x, y);

    // Update connection line position if visible
    this.updateConnectionLine(x, y);
    // Bottom line doesn't need to update with cursor movement, only when element changes

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
      svg.setAttribute('width', '350');
      svg.setAttribute('height', '140');

      const addLine = (x1, y1, x2, y2, color, w = '4') => {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', color); ln.setAttribute('stroke-width', w);
        ln.setAttribute('stroke-linecap', 'round');
        svg.appendChild(ln);
      };



      // Background for message in lower right quadrant
      const bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('x', '100');  // Right side of crosshair
      bg.setAttribute('y', '70');   // Lower quadrant
      bg.setAttribute('width', '165');
      bg.setAttribute('height', '50');
      bg.setAttribute('rx', '6');
      bg.setAttribute('fill', 'rgba(0,0,0,0.85)');
      bg.setAttribute('stroke', 'rgba(255,140,0,0.4)');
      bg.setAttribute('stroke-width', '1');
      bg.style.filter = 'drop-shadow(5px 5px 5px rgba(40, 40, 40, 0.7))';

      svg.appendChild(bg);

      // Determine message based on whether there's a clickable element
      const hasClickableElement = options.hasClickableElement || false;
      const firstLineText = hasClickableElement ? 'Cursor is in a text field.' : 'Cursor is in a text field.';
      const secondLineText = hasClickableElement ? 'Use ESC to click element.' : 'Press ESC to exit.';

      // First line of text message
      const text1 = document.createElementNS(NS, 'text');
      text1.setAttribute('x', '109'); // Center of message box
      text1.setAttribute('y', '90');   // First line position
      text1.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text1.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text1.setAttribute('font-size', '12');
      text1.setAttribute('font-weight', '500');
      text1.setAttribute('text-anchor', 'left');
      text1.textContent = firstLineText;
      svg.appendChild(text1);

      // Second line of text message
      const text2 = document.createElementNS(NS, 'text');
      text2.setAttribute('x', '109'); // Center of message box
      text2.setAttribute('y', '110');   // Second line position

      text2.setAttribute('fill', hasClickableElement ? '#6ced2b' : '#ff8c00');

      //text2.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text2.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text2.setAttribute('font-size', '12');
      text2.setAttribute('font-weight', '500');
      text2.setAttribute('text-anchor', 'left');
      text2.textContent = secondLineText;
      svg.appendChild(text2);



      // Orange crosshair at center - same size as normal mode
      const centerX = 100; // Center of the SVG
      const centerY = 70;  // Center of the SVG
      const col = hasClickableElement ? 'rgba(0,128,0,0.95)' : '#ff8c00'; // Green if clickable, orange if not.
      // Same dimensions as normal mode: arms extend ±24 pixels from center
      addLine(centerX, centerY - 24, centerX, centerY - 10, col);
      addLine(centerX, centerY + 10, centerX, centerY + 24, col);
      addLine(centerX - 24, centerY, centerX - 10, centerY, col);
      addLine(centerX + 10, centerY, centerX + 24, centerY, col);


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

  showConnectionLine(focusedElement) {
    if (!focusedElement) return;

    // Create connection line if it doesn't exist
    if (!this.connectionLineEl) {
      this.connectionLineEl = this.createElement('div', {
        id: 'kpv2-connection-line',
        'aria-hidden': 'true'
      });

      // Style the connection line
      Object.assign(this.connectionLineEl.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '2147483647', // Same as cursor
        width: '5px',
        backgroundColor: '#ff8c00', // Orange color
        transformOrigin: 'top center',
        borderRadius: '2.5px'
      });

      document.body.appendChild(this.connectionLineEl);
    }

    // Create bottom line if it doesn't exist
    if (!this.bottomLineEl) {
      this.bottomLineEl = this.createElement('div', {
        id: 'kpv2-bottom-line',
        'aria-hidden': 'true'
      });

      // Style the bottom line
      Object.assign(this.bottomLineEl.style, {
        position: 'fixed',
        pointerEvents: 'none',
        zIndex: '2147483647', // Same as cursor
        height: '5px',
        backgroundColor: '#ff8c00', // Orange color - same as connection line
        borderRadius: '2.5px'
      });

      document.body.appendChild(this.bottomLineEl);
    }

    // Store reference to focused element for position updates
    this.focusedElement = focusedElement;

    // Update bottom line immediately (doesn't depend on cursor position)
    this.updateBottomLine();

    // Update connection line - if cursor position is (0,0), try to get current mouse position
    let cursorX = this.lastPosition.x;
    let cursorY = this.lastPosition.y;

    // If cursor position is at origin, it might not have been set yet
    // Try to get a reasonable default position (center of viewport)
    if (cursorX === 0 && cursorY === 0) {
      cursorX = window.innerWidth / 2;
      cursorY = window.innerHeight / 2;
    }

    this.updateConnectionLine(cursorX, cursorY);
  }

  hideConnectionLine() {
    if (this.connectionLineEl) {
      this.connectionLineEl.remove();
      this.connectionLineEl = null;
    }
    if (this.bottomLineEl) {
      this.bottomLineEl.remove();
      this.bottomLineEl = null;
    }
    this.focusedElement = null;
  }

  updateConnectionLine(cursorX, cursorY) {
    if (!this.connectionLineEl || !this.focusedElement) return;

    try {
      // Get the focused element's position
      const elementRect = this.focusedElement.getBoundingClientRect();

      // Calculate center of the input element's bottom edge
      const elementCenterX = elementRect.left + elementRect.width / 2;
      const elementBottomY = elementRect.bottom;

      // Calculate line properties - from cursor to bottom center of element
      const deltaX = elementCenterX - cursorX;
      const deltaY = elementBottomY - cursorY;
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

      // Calculate angle in radians, then convert to degrees
      const angleRad = Math.atan2(deltaX, -deltaY); // Swapped and negated for correct orientation
      const angleDeg = 180 + (angleRad * 180 / Math.PI);

      // Position the line at cursor position
      this.connectionLineEl.style.left = `${cursorX}px`;
      this.connectionLineEl.style.top = `${cursorY}px`;
      this.connectionLineEl.style.height = `${distance}px`;
      this.connectionLineEl.style.transform = `translate(-50%, 0) rotate(${angleDeg}deg)`;
      this.connectionLineEl.style.display = 'block';

    } catch (error) {
      // If element is no longer valid, hide the line
      this.hideConnectionLine();
    }
  }

  updateBottomLine() {
    if (!this.bottomLineEl || !this.focusedElement) return;

    try {
      // Get the focused element's position
      const elementRect = this.focusedElement.getBoundingClientRect();

      // Position the bottom line along the bottom edge of the input
      this.bottomLineEl.style.left = `${elementRect.left}px`;
      this.bottomLineEl.style.top = `${elementRect.bottom}px`;
      this.bottomLineEl.style.width = `${elementRect.width}px`;
      this.bottomLineEl.style.display = 'block';

    } catch (error) {
      // If element is no longer valid, hide the line
      this.hideConnectionLine();
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

    if (this.connectionLineEl) {
      this.connectionLineEl.remove();
      this.connectionLineEl = null;
    }

    if (this.bottomLineEl) {
      this.bottomLineEl.remove();
      this.bottomLineEl = null;
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