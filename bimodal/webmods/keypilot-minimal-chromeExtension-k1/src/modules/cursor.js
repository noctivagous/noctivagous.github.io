/**
 * Cursor overlay management
 */
import { COLORS, Z_INDEX } from '../config/constants.js';

export class CursorManager {
  constructor() {
    this.cursorEl = null;
    this.connectionLineEl = null;
    this.lastPosition = { x: 0, y: 0 };
    this.isStuck = false;
    this.stuckCheckInterval = null;
    this.forceUpdateCount = 0;
    this.overlayUpdateCallback = null; // Callback to update overlay position
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
      }

      // Update overlay position if we have a callback for it
      if (this.overlayUpdateCallback && this.focusedElement) {
        this.overlayUpdateCallback(this.focusedElement);
      }
    }
  }

  // Method to force refresh connection lines (useful for initial setup)
  refreshConnectionLines() {
    if (this.focusedElement && this.connectionLineEl) {
      this.updateConnectionLine(this.lastPosition.x, this.lastPosition.y);
    }

    // Also refresh overlay if we have a callback for it
    if (this.overlayUpdateCallback && this.focusedElement) {
      this.overlayUpdateCallback(this.focusedElement);
    }
  }

  // Method to set callback for updating overlay position
  setOverlayUpdateCallback(callback) {
    this.overlayUpdateCallback = callback;
  }

  updatePosition(x, y) {
    if (!this.cursorEl) return;

    // Store the intended position
    this.lastPosition = { x, y };

    // Use multiple positioning strategies for maximum compatibility
    this.forceUpdatePosition(x, y);

    // Update connection line position if visible
    this.updateConnectionLine(x, y);

    // Update overlay position if we have a callback for it
    if (this.overlayUpdateCallback && this.focusedElement) {
      this.overlayUpdateCallback(this.focusedElement);
    }

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
        color: hasClickableElement ? COLORS.TEXT_GREEN_BRIGHT : COLORS.ORANGE,
        fontSize: '13px',
        fontWeight: '600',
        marginBottom: '2px'
      });
      text2.textContent = secondLineText;
      bg.appendChild(text2);

      // Third line of text using normal document flow
      const text3 = document.createElement('div');
      Object.assign(text3.style, {
        color: COLORS.TEXT_WHITE_SECONDARY,
        fontSize: '11px',
        fontWeight: '500'
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

  showConnectionLine(focusedElement) {
    if (!focusedElement) return;

    // Arrow scale factor - adjust this to make arrow larger/smaller
    const arrowScale = 0.5;

    // Create connection line if it doesn't exist
    if (!this.connectionLineEl) {
      const NS = 'http://www.w3.org/2000/svg';

      // Create SVG container
      this.connectionLineEl = document.createElementNS(NS, 'svg');
      this.connectionLineEl.setAttribute('id', 'kpv2-connection-line');
      this.connectionLineEl.setAttribute('aria-hidden', 'true');

      // Style the SVG container to cover full viewport
      Object.assign(this.connectionLineEl.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: Z_INDEX.CONNECTION_LINE // Lower than cursor and message to appear underneath
      });

      // Create arrowhead marker definition with scaling
      const defs = document.createElementNS(NS, 'defs');
      const marker = document.createElementNS(NS, 'marker');
      marker.setAttribute('id', 'arrowhead');
      marker.setAttribute('markerWidth', 10 * arrowScale);
      marker.setAttribute('markerHeight', 7 * arrowScale);
      marker.setAttribute('refX', 9 * arrowScale);
      marker.setAttribute('refY', 3.5 * arrowScale);
      marker.setAttribute('orient', 'auto');

      const polygon = document.createElementNS(NS, 'polygon');
      const scaledPoints = `0 0, ${10 * arrowScale} ${3.5 * arrowScale}, 0 ${7 * arrowScale}`;
      polygon.setAttribute('points', scaledPoints);
      polygon.setAttribute('fill', COLORS.ORANGE); // Same orange color as line

      marker.appendChild(polygon);
      defs.appendChild(marker);
      this.connectionLineEl.appendChild(defs);

      // Create the line element
      this.connectionLine = document.createElementNS(NS, 'line');
      this.connectionLine.setAttribute('stroke', COLORS.ORANGE); // Orange color
      this.connectionLine.setAttribute('stroke-width', '11');
      this.connectionLine.setAttribute('stroke-linecap', 'round');
      this.connectionLine.setAttribute('marker-end', 'url(#arrowhead)'); // Add arrowhead at end

      this.connectionLineEl.appendChild(this.connectionLine);
      document.body.appendChild(this.connectionLineEl);
    }

    // Store reference to focused element for position updates
    this.focusedElement = focusedElement;

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
      this.connectionLine = null;
    }
    this.focusedElement = null;
  }

  updateConnectionLine(cursorX, cursorY) {
    if (!this.connectionLine || !this.focusedElement) return;

    try {
      // Get the focused element's position
      const elementRect = this.focusedElement.getBoundingClientRect();

      // Calculate center of the input element
      const elementCenterX = elementRect.left + elementRect.width / 2;
      // We want the line drawn to the bottom edge plus 4 because it
      // aligns with the rectangle that has an outline.
      const elementCenterY = elementRect.top + elementRect.height + 4;

      // Simply update the line endpoints
      this.connectionLine.setAttribute('x1', cursorX);
      this.connectionLine.setAttribute('y1', cursorY);
      this.connectionLine.setAttribute('x2', elementCenterX);
      this.connectionLine.setAttribute('y2', elementCenterY);
      this.connectionLine.style.filter = `drop-shadow(5px 5px 5px ${COLORS.BLACK_SHADOW})`;

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
      this.connectionLine = null;
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