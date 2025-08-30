/**
 * Element detection and interaction utilities
 */
export class ElementDetector {
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

  /**
   * Find text node at position
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {Text|null} - Text node or null
   */
  findTextNodeAtPosition(x, y) {
    try {
      const element = this.deepElementFromPoint(x, y);
      if (!element) return null;
      
      // Find the first text node within the element
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            return node.textContent && node.textContent.trim() 
              ? NodeFilter.FILTER_ACCEPT 
              : NodeFilter.FILTER_REJECT;
          }
        }
      );
      
      return walker.nextNode();
    } catch (error) {
      console.warn('[KeyPilot] Error finding text node at position:', error);
      return null;
    }
  }

  /**
   * Get text offset at position within a text node
   * @param {Text} textNode - Text node
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @returns {number} - Character offset
   */
  getTextOffsetAtPosition(textNode, x, y) {
    try {
      const text = textNode.textContent;
      if (!text) return 0;
      
      // Use binary search to find the character offset
      let left = 0;
      let right = text.length;
      
      while (left < right) {
        const mid = Math.floor((left + right) / 2);
        const range = document.createRange();
        range.setStart(textNode, mid);
        range.setEnd(textNode, mid + 1);
        
        const rect = range.getBoundingClientRect();
        
        if (x < rect.left + rect.width / 2) {
          right = mid;
        } else {
          left = mid + 1;
        }
      }
      
      return left;
    } catch (error) {
      console.warn('[KeyPilot] Error getting text offset at position:', error);
      return 0;
    }
  }
}