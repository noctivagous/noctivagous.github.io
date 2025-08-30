/**
 * Highlight Overlay - Handles text selection highlighting
 */
import { CSS_CLASSES, COLORS, Z_INDEX } from '../../config/index.js';

export class HighlightOverlay {
  constructor() {
    this.selectionMode = 'character'; // 'character' or 'rectangle'
    this.overlays = [];
    this.rectangleOverlay = null;
  }

  /**
   * Set selection mode
   * @param {string} mode - 'character' or 'rectangle'
   */
  setSelectionMode(mode) {
    this.selectionMode = mode;
  }

  /**
   * Get current selection mode
   * @returns {string}
   */
  getSelectionMode() {
    return this.selectionMode;
  }

  /**
   * Show highlight overlay
   * @param {Selection} selection
   */
  show(selection) {
    if (this.selectionMode === 'character') {
      this.showCharacterSelection(selection);
    } else {
      this.showRectangleSelection(selection);
    }
  }

  /**
   * Hide highlight overlay
   */
  hide() {
    this.clearOverlays();
    this.hideRectangleOverlay();
  }

  /**
   * Show character-level selection
   * @param {Selection} selection
   */
  showCharacterSelection(selection) {
    this.clearOverlays();

    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const rects = range.getClientRects();

    for (let i = 0; i < rects.length; i++) {
      const rect = rects[i];
      if (rect.width > 0 && rect.height > 0) {
        this.createSelectionOverlay(rect);
      }
    }
  }

  /**
   * Show rectangle selection
   * @param {Object} rectangle - {left, top, width, height}
   */
  showRectangleSelection(rectangle) {
    this.hideRectangleOverlay();

    if (!rectangle || rectangle.width <= 0 || rectangle.height <= 0) return;

    this.rectangleOverlay = document.createElement('div');
    this.rectangleOverlay.className = CSS_CLASSES.HIGHLIGHT_OVERLAY;
    this.rectangleOverlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: ${Z_INDEX.OVERLAYS};
      border: 2px solid ${COLORS.HIGHLIGHT_SELECTION_BORDER};
      background: ${COLORS.HIGHLIGHT_SELECTION_BG};
      border-radius: 2px;
      left: ${rectangle.left}px;
      top: ${rectangle.top}px;
      width: ${rectangle.width}px;
      height: ${rectangle.height}px;
      transition: all 0.1s ease;
    `;

    document.body.appendChild(this.rectangleOverlay);
  }

  /**
   * Create selection overlay for a rectangle
   * @param {DOMRect} rect
   */
  createSelectionOverlay(rect) {
    const overlay = document.createElement('div');
    overlay.className = CSS_CLASSES.HIGHLIGHT_SELECTION;
    
    const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;

    overlay.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: ${Z_INDEX.OVERLAYS};
      background: ${COLORS.HIGHLIGHT_SELECTION_BG};
      border: 1px solid ${COLORS.HIGHLIGHT_SELECTION_BORDER};
      left: ${rect.left + scrollX}px;
      top: ${rect.top + scrollY}px;
      width: ${rect.width}px;
      height: ${rect.height}px;
    `;

    document.body.appendChild(overlay);
    this.overlays.push(overlay);
  }

  /**
   * Start character selection
   * @param {Object} position
   * @param {Function} findTextNodeFn
   * @param {Function} getTextOffsetFn
   * @returns {boolean}
   */
  startCharacterSelection(position, findTextNodeFn, getTextOffsetFn) {
    try {
      const textNode = findTextNodeFn(position.x, position.y);
      if (!textNode) return false;

      const range = document.createRange();
      const offset = getTextOffsetFn(textNode, position.x, position.y);
      
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset);

      const selection = window.getSelection();
      selection.removeAllRanges();
      selection.addRange(range);

      return true;
    } catch (error) {
      console.error('[KeyPilot] Error starting character selection:', error);
      return false;
    }
  }

  /**
   * Update selection overlays
   * @param {Selection} selection
   */
  updateSelectionOverlays(selection) {
    if (this.selectionMode === 'character') {
      this.showCharacterSelection(selection);
    }
  }

  /**
   * Clear all selection overlays
   */
  clearOverlays() {
    this.overlays.forEach(overlay => overlay.remove());
    this.overlays = [];
  }

  /**
   * Hide rectangle overlay
   */
  hideRectangleOverlay() {
    if (this.rectangleOverlay) {
      this.rectangleOverlay.remove();
      this.rectangleOverlay = null;
    }
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.hide();
  }
}
