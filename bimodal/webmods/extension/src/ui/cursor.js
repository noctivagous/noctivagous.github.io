/**
 * Cursor overlay management
 */
import { COLORS, Z_INDEX } from '../config/index.js';

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

    // Check if early injection cursor exists and take it over
    const existingCursor = document.getElementById('kpv2-cursor');
    if (existingCursor && window.KEYPILOT_EARLY) {
      // Take over the early cursor
      this.cursorEl = existingCursor;
      
      // Get the current position from early injection
      const earlyPosition = window.KEYPILOT_EARLY.getPosition();
      this.lastPosition = earlyPosition;
      
      // Preserve current styles before updating content
      const currentStyles = {
        position: this.cursorEl.style.position,
        left: this.cursorEl.style.left,
        top: this.cursorEl.style.top,
        transform: this.cursorEl.style.transform,
        display: this.cursorEl.style.display,
        visibility: this.cursorEl.style.visibility,
        zIndex: this.cursorEl.style.zIndex
      };
      
      // Update cursor with full functionality
      this.cursorEl.replaceChildren(this.buildSvg('none', {}));
      
      // Restore and ensure proper styling
      Object.assign(this.cursorEl.style, {
        position: 'fixed',
        left: `${earlyPosition.x}px`,
        top: `${earlyPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: '2147483647',
        display: 'block',
        visibility: 'visible'
      });
      
      // Notify early injection that main extension has loaded (but don't cleanup yet)
      window.dispatchEvent(new CustomEvent('keypilot-main-loaded'));
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Took over early injection cursor at position:', earlyPosition);
      }
    } else {
      // Create new cursor if no early injection
      const wrap = this.createElement('div', {
        id: 'kpv2-cursor',
        'aria-hidden': 'true'
      });
      wrap.appendChild(this.buildSvg('none', {}));
      document.body.appendChild(wrap);
      this.cursorEl = wrap;
      
      // Ensure proper styling for full cursor functionality
      Object.assign(this.cursorEl.style, {
        position: 'fixed',
        left: `${this.lastPosition.x}px`,
        top: `${this.lastPosition.y}px`,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: '2147483647',
        display: 'block',
        visibility: 'visible'
      });
    }

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

      // Orange crosshair at center for text focus mode - same size as normal mode
      const centerX = 100; // Center of the SVG
      const centerY = 70;  // Center of the SVG
      const col = COLORS.ORANGE; // Always orange in text focus mode
      // Same dimensions as normal mode: arms extend ±24 pixels from center
      addLine(centerX, centerY - 24, centerX, centerY - 10, col);
      addLine(centerX, centerY + 10, centerX, centerY + 24, col);
      addLine(centerX - 24, centerY, centerX - 10, centerY, col);
      addLine(centerX + 10, centerY, centerX + 24, centerY, col);

      // Create container to hold both SVG and background div
      const container = document.createElement('div');
      container.style.position = 'relative';
      container.appendChild(svg);

      let showBG = false;
      if(showBG)
      {
        container.appendChild(bg);
      }

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
        // Green cursor for normal mode
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