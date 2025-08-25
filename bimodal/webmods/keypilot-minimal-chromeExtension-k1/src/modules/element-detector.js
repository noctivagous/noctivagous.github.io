/**
 * Element detection and interaction utilities
 */
export class ElementDetector {
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
    if (el.matches(this.FOCUSABLE_SEL)) return true;
    const role = (el.getAttribute && (el.getAttribute('role') || '').trim().toLowerCase()) || '';
    return role && this.CLICKABLE_ROLES.includes(role);
  }

  findClickable(el) {
    let n = el;
    while (n && n !== document.body && n.nodeType === 1) {
      if (this.isLikelyInteractive(n)) return n;
      n = n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null);
    }
    return el && this.isLikelyInteractive(el) ? el : null;
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