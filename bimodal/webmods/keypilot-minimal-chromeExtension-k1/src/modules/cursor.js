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

  setMode(mode) {
    if (!this.cursorEl) return;
    this.cursorEl.replaceChildren(this.buildSvg(mode));
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