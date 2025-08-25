/**
 * Visual overlay management for focus and delete indicators
 */
import { CSS_CLASSES, Z_INDEX } from '../config/constants.js';

export class OverlayManager {
  constructor() {
    this.focusOverlay = null;
    this.deleteOverlay = null;
  }

  updateOverlays(focusEl, deleteEl, mode) {
    // Only show focus overlay in normal mode (not delete or text focus)
    if (mode === 'none') {
      this.updateFocusOverlay(focusEl);
    } else {
      this.hideFocusOverlay();
    }
    
    // Only show delete overlay in delete mode
    if (mode === 'delete') {
      this.updateDeleteOverlay(deleteEl);
    } else {
      this.hideDeleteOverlay();
    }
  }

  updateFocusOverlay(element) {
    if (!element) {
      this.hideFocusOverlay();
      return;
    }

    if (!this.focusOverlay) {
      this.focusOverlay = this.createElement('div', {
        className: CSS_CLASSES.FOCUS_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid rgba(0,180,0,0.95);
          box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5);
          background: transparent;
        `
      });
      document.body.appendChild(this.focusOverlay);
    }

    const rect = this.getBestRect(element);
    if (rect.width > 0 && rect.height > 0) {
      this.focusOverlay.style.left = `${rect.left}px`;
      this.focusOverlay.style.top = `${rect.top}px`;
      this.focusOverlay.style.width = `${rect.width}px`;
      this.focusOverlay.style.height = `${rect.height}px`;
      this.focusOverlay.style.display = 'block';
    } else {
      this.hideFocusOverlay();
    }
  }

  hideFocusOverlay() {
    if (this.focusOverlay) {
      this.focusOverlay.style.display = 'none';
    }
  }

  updateDeleteOverlay(element) {
    if (!element) {
      this.hideDeleteOverlay();
      return;
    }

    if (!this.deleteOverlay) {
      this.deleteOverlay = this.createElement('div', {
        className: CSS_CLASSES.DELETE_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid rgba(220,0,0,0.95);
          box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45);
          background: transparent;
        `
      });
      document.body.appendChild(this.deleteOverlay);
    }

    const rect = this.getBestRect(element);
    if (rect.width > 0 && rect.height > 0) {
      this.deleteOverlay.style.left = `${rect.left}px`;
      this.deleteOverlay.style.top = `${rect.top}px`;
      this.deleteOverlay.style.width = `${rect.width}px`;
      this.deleteOverlay.style.height = `${rect.height}px`;
      this.deleteOverlay.style.display = 'block';
    } else {
      this.hideDeleteOverlay();
    }
  }

  hideDeleteOverlay() {
    if (this.deleteOverlay) {
      this.deleteOverlay.style.display = 'none';
    }
  }

  updateElementClasses(focusEl, deleteEl, prevFocusEl, prevDeleteEl) {
    // Remove previous classes
    if (prevFocusEl && prevFocusEl !== focusEl) {
      prevFocusEl.classList.remove(CSS_CLASSES.FOCUS);
    }
    if (prevDeleteEl && prevDeleteEl !== deleteEl) {
      prevDeleteEl.classList.remove(CSS_CLASSES.DELETE);
    }

    // Add new classes
    if (focusEl) {
      focusEl.classList.add(CSS_CLASSES.FOCUS);
    }
    if (deleteEl) {
      deleteEl.classList.add(CSS_CLASSES.DELETE);
    }
  }

  getBestRect(element) {
    if (!element) return { left: 0, top: 0, width: 0, height: 0 };
    
    let rect = element.getBoundingClientRect();
    
    // If the element has no height (common with links containing other elements),
    // try to find a child element with height
    if (rect.height === 0 && element.children.length > 0) {
      for (const child of element.children) {
        const childRect = child.getBoundingClientRect();
        if (childRect.height > 0) {
          // Use the child's rect but keep the parent's left position if it's a link
          if (element.tagName.toLowerCase() === 'a') {
            return {
              left: Math.min(rect.left, childRect.left),
              top: childRect.top,
              width: Math.max(rect.width, childRect.width),
              height: childRect.height
            };
          }
          return childRect;
        }
      }
    }
    
    // If still no height, try to get text content dimensions
    if (rect.height === 0 && element.textContent && element.textContent.trim()) {
      // For text-only elements, use a minimum height
      return {
        left: rect.left,
        top: rect.top,
        width: Math.max(rect.width, 20), // Minimum width
        height: Math.max(rect.height, 20) // Minimum height
      };
    }
    
    return rect;
  }

  cleanup() {
    if (this.focusOverlay) {
      this.focusOverlay.remove();
      this.focusOverlay = null;
    }
    if (this.deleteOverlay) {
      this.deleteOverlay.remove();
      this.deleteOverlay = null;
    }
  }

  createElement(tag, props = {}) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style') {
        element.style.cssText = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    return element;
  }
}