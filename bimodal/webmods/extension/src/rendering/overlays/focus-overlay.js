/**
 * Focus Overlay - Handles focus highlighting
 */
import { CSS_CLASSES, COLORS, Z_INDEX } from '../../config/index.js';

export class FocusOverlay {
  constructor() {
    this.overlay = null;
    this.currentElement = null;
  }

  /**
   * Check if element is a text input field
   * @param {Element} element
   * @returns {boolean}
   */
  isTextInput(element) {
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'textarea') {
      return true;
    }
    
    if (tagName === 'input') {
      const type = element.type ? element.type.toLowerCase() : 'text';
      const textInputTypes = [
        'text', 'search', 'url', 'email', 'tel', 'password', 'number'
      ];
      return textInputTypes.includes(type);
    }
    
    // Check for contenteditable elements
    if (element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Show focus overlay for element
   * @param {Element} element
   */
  show(element) {
    if (!element) {
      this.hide();
      return;
    }

    this.currentElement = element;
    this.createOverlay();
    this.positionOverlay(element);
  }

  /**
   * Hide focus overlay
   */
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.currentElement = null;
  }

  /**
   * Create focus overlay element
   */
  createOverlay() {
    if (this.overlay) {
      this.overlay.remove();
    }

    // Determine colors based on element type
    const isTextElement = this.currentElement && this.isTextInput(this.currentElement);
    const borderColor = isTextElement ? COLORS.ORANGE : COLORS.FOCUS_GREEN;
    const shadowColor = isTextElement ? COLORS.ORANGE_SHADOW : COLORS.GREEN_SHADOW;

    this.overlay = document.createElement('div');
    this.overlay.className = CSS_CLASSES.FOCUS_OVERLAY;
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: ${Z_INDEX.OVERLAYS};
      border: 2px solid ${borderColor};
      border-radius: 4px;
      box-shadow: 0 0 8px ${shadowColor};
      background: transparent;
      transition: all 0.15s ease;
    `;

    document.body.appendChild(this.overlay);
  }

  /**
   * Position overlay over element
   * @param {Element} element
   */
  positionOverlay(element) {
    if (!this.overlay || !element) return;

    const rect = element.getBoundingClientRect();
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    this.overlay.style.left = (rect.left + scrollX - 2) + 'px';
    this.overlay.style.top = (rect.top + scrollY - 2) + 'px';
    this.overlay.style.width = (rect.width + 4) + 'px';
    this.overlay.style.height = (rect.height + 4) + 'px';
  }

  /**
   * Get overlay element
   * @returns {Element|null}
   */
  getElement() {
    return this.overlay;
  }

  /**
   * Update overlay position (for scroll/resize events)
   */
  updatePosition() {
    if (this.currentElement) {
      this.positionOverlay(this.currentElement);
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.hide();
  }
}
