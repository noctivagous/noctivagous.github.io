/**
 * Cursor overlay management
 */
export class CursorManager {
  constructor() {
    this.cursorEl = null;
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
  }

  setMode(mode) {
    if (!this.cursorEl) return;
    this.cursorEl.replaceChildren(this.buildSvg(mode));
  }

  updatePosition(x, y) {
    if (this.cursorEl) {
      this.cursorEl.style.left = `${x}px`;
      this.cursorEl.style.top = `${y}px`;
    }
  }

  buildSvg(mode) {
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    
    if (mode === 'text_focus') {
      // Larger SVG for text mode with message in bottom half
      svg.setAttribute('viewBox', '0 0 200 140');
      svg.setAttribute('width', '200');
      svg.setAttribute('height', '140');
      
      // Orange crosshair (same as normal mode but orange)
      const addLine = (x1, y1, x2, y2, color, w = '4') => {
        const ln = document.createElementNS(NS, 'line');
        ln.setAttribute('x1', x1); ln.setAttribute('y1', y1);
        ln.setAttribute('x2', x2); ln.setAttribute('y2', y2);
        ln.setAttribute('stroke', color); ln.setAttribute('stroke-width', w);
        ln.setAttribute('stroke-linecap', 'round');
        svg.appendChild(ln);
      };

      // Orange crosshair in lower left corner - same size as normal mode
      const centerX = 47; // Position in lower left area
      const centerY = 113; // Position in lower left area of message box
      const col = '#ff8c00'; // Orange color
      // Same dimensions as normal mode: arms extend ±24 pixels from center
      addLine(centerX, centerY - 24, centerX, centerY - 10, col);
      addLine(centerX, centerY + 10, centerX, centerY + 24, col);
      addLine(centerX - 24, centerY, centerX - 10, centerY, col);
      addLine(centerX + 10, centerY, centerX + 24, centerY, col);
      
      // Background for message in bottom half
      const bg = document.createElementNS(NS, 'rect');
      bg.setAttribute('x', '10');
      bg.setAttribute('y', '90');
      bg.setAttribute('width', '180');
      bg.setAttribute('height', '45');
      bg.setAttribute('rx', '6');
      bg.setAttribute('fill', 'rgba(0,0,0,0.85)');
      bg.setAttribute('stroke', 'rgba(255,140,0,0.4)');
      bg.setAttribute('stroke-width', '1');
      svg.appendChild(bg);
      
      // Text message in bottom half
      const text1 = document.createElementNS(NS, 'text');
      text1.setAttribute('x', '100');
      text1.setAttribute('y', '108');
      text1.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text1.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text1.setAttribute('font-size', '12');
      text1.setAttribute('font-weight', '500');
      text1.setAttribute('text-anchor', 'middle');
      text1.textContent = 'Press ESC to leave';
      svg.appendChild(text1);
      
      const text2 = document.createElementNS(NS, 'text');
      text2.setAttribute('x', '100');
      text2.setAttribute('y', '125');
      text2.setAttribute('fill', 'rgba(255,255,255,0.95)');
      text2.setAttribute('font-family', 'system-ui, -apple-system, sans-serif');
      text2.setAttribute('font-size', '12');
      text2.setAttribute('font-weight', '500');
      text2.setAttribute('text-anchor', 'middle');
      text2.textContent = 'text field focus';
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