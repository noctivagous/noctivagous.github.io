/**
 * Smart element activation with semantic handling
 */
export class ActivationHandler {
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