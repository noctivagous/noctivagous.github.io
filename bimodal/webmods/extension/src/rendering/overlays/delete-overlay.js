/**
 * Delete Overlay - Handles delete mode highlighting
 */
import { CSS_CLASSES, COLORS, Z_INDEX } from '../../config/index.js';

export class DeleteOverlay {
  constructor() {
    this.overlay = null;
    this.currentElement = null;
  }

  /**
   * Show delete overlay for element
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
   * Hide delete overlay
   */
  hide() {
    if (this.overlay) {
      this.overlay.remove();
      this.overlay = null;
    }
    this.currentElement = null;
  }

  /**
   * Create delete overlay element
   */
  createOverlay() {
    if (this.overlay) {
      this.overlay.remove();
    }

    this.overlay = document.createElement('div');
    this.overlay.className = CSS_CLASSES.DELETE_OVERLAY;
    this.overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: ${Z_INDEX.OVERLAYS};
      border: 2px solid ${COLORS.DELETE_RED};
      border-radius: 4px;
      box-shadow: 0 0 8px ${COLORS.DELETE_SHADOW};
      background: rgba(220, 0, 0, 0.1);
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
