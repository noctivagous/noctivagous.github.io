/**
 * Overlay Coordinator - Main overlay management
 */
import { CSS_CLASSES, Z_INDEX, MODES } from '../../config/index.js';
import { FocusOverlay } from './focus-overlay.js';
import { DeleteOverlay } from './delete-overlay.js';
import { HighlightOverlay } from './highlight-overlay.js';
import { NotificationOverlay } from './notification-overlay.js';

export class OverlayCoordinator {
  constructor() {
    // Overlay components
    this.focusOverlay = new FocusOverlay();
    this.deleteOverlay = new DeleteOverlay();
    this.highlightOverlay = new HighlightOverlay();
    this.notificationOverlay = new NotificationOverlay();
    
    // Text mode overlays
    this.viewportModalFrame = null;
    this.activeTextInputFrame = null;
    
    // Intersection observer for overlay visibility optimization
    this.overlayObserver = null;
    this.resizeObserver = null;
    
    // Track overlay visibility state
    this.overlayVisibility = {
      focus: true,
      delete: true,
      highlight: true,
      notification: true,
      textMode: true
    };
    
    this.setupOverlayObserver();
  }

  /**
   * Setup intersection observer for overlay optimization
   */
  setupOverlayObserver() {
    this.overlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const overlay = entry.target;
          const isVisible = entry.intersectionRatio > 0;
          
          // Optimize rendering by hiding completely out-of-view overlays
          overlay.style.visibility = isVisible ? 'visible' : 'hidden';
        });
      },
      {
        root: null,
        rootMargin: '50px',
        threshold: [0, 0.1]
      }
    );
  }

  /**
   * Show focus overlay for element
   * @param {Element} element
   */
  showFocusOverlay(element) {
    this.focusOverlay.show(element);
    if (this.overlayObserver) {
      this.overlayObserver.observe(this.focusOverlay.getElement());
    }
  }

  /**
   * Hide focus overlay
   */
  hideFocusOverlay() {
    if (this.overlayObserver && this.focusOverlay.getElement()) {
      this.overlayObserver.unobserve(this.focusOverlay.getElement());
    }
    this.focusOverlay.hide();
  }

  /**
   * Show delete overlay for element
   * @param {Element} element
   */
  showDeleteOverlay(element) {
    this.deleteOverlay.show(element);
    if (this.overlayObserver) {
      this.overlayObserver.observe(this.deleteOverlay.getElement());
    }
  }

  /**
   * Hide delete overlay
   */
  hideDeleteOverlay() {
    if (this.overlayObserver && this.deleteOverlay.getElement()) {
      this.overlayObserver.unobserve(this.deleteOverlay.getElement());
    }
    this.deleteOverlay.hide();
  }

  /**
   * Show highlight overlay
   * @param {Object} selection
   */
  showHighlightOverlay(selection) {
    this.highlightOverlay.show(selection);
  }

  /**
   * Hide highlight overlay
   */
  hideHighlightOverlay() {
    this.highlightOverlay.hide();
  }

  /**
   * Show notification
   * @param {string} message
   * @param {string} type
   * @param {number} duration
   */
  showNotification(message, type = 'info', duration = 3000) {
    this.notificationOverlay.show(message, type, duration);
  }

  /**
   * Update overlays based on current state
   * @param {Element} focusEl
   * @param {Element} deleteEl
   * @param {string} mode
   * @param {Element} focusedTextElement
   */
  updateOverlays(focusEl, deleteEl, mode, focusedTextElement = null) {
    // Hide all overlays first
    this.hideFocusOverlay();
    this.hideDeleteOverlay();
    this.hideTextModeOverlays();

    // Show appropriate overlays based on mode and elements
    if (mode === MODES.TEXT_FOCUS && focusedTextElement) {
      this.showTextModeOverlays(focusedTextElement);
    } else if (mode === MODES.DELETE && deleteEl) {
      this.showDeleteOverlay(deleteEl);
    } else if (focusEl && mode !== MODES.HIGHLIGHT) {
      this.showFocusOverlay(focusEl);
    }
  }

  /**
   * Set selection mode for highlight overlay
   * @param {string} mode - 'character' or 'rectangle'
   */
  setSelectionMode(mode) {
    this.highlightOverlay.setSelectionMode(mode);
  }

  /**
   * Get current selection mode
   * @returns {string}
   */
  getSelectionMode() {
    return this.highlightOverlay.getSelectionMode();
  }

  /**
   * Start character selection
   * @param {Object} position
   * @param {Function} findTextNodeFn
   * @param {Function} getTextOffsetFn
   * @returns {boolean}
   */
  startCharacterSelection(position, findTextNodeFn, getTextOffsetFn) {
    return this.highlightOverlay.startCharacterSelection(position, findTextNodeFn, getTextOffsetFn);
  }

  /**
   * Update highlight selection overlays
   * @param {Selection} selection
   */
  updateHighlightSelectionOverlays(selection) {
    this.highlightOverlay.updateSelectionOverlays(selection);
  }

  /**
   * Show text mode overlays
   * @param {Element} textElement
   */
  showTextModeOverlays(textElement) {
    this.showViewportModalFrame();
    this.showActiveTextInputFrame(textElement);
  }

  /**
   * Hide text mode overlays
   */
  hideTextModeOverlays() {
    this.hideViewportModalFrame();
    this.hideActiveTextInputFrame();
  }

  /**
   * Show viewport modal frame (semi-transparent border around page)
   */
  showViewportModalFrame() {
    if (!this.viewportModalFrame) {
      this.viewportModalFrame = document.createElement('div');
      this.viewportModalFrame.className = CSS_CLASSES.VIEWPORT_MODAL_FRAME;
      document.body.appendChild(this.viewportModalFrame);
      
      // Setup resize observer to keep frame sized correctly
      if (window.ResizeObserver) {
        this.resizeObserver = new ResizeObserver(() => {
          this.updateViewportModalFrameSize();
        });
        this.resizeObserver.observe(document.documentElement);
      }
      
      // Listen for viewport changes
      window.addEventListener('resize', () => this.updateViewportModalFrameSize());
      if (window.visualViewport) {
        window.visualViewport.addEventListener('resize', () => this.updateViewportModalFrameSize());
      }
    }
    
    this.viewportModalFrame.style.display = 'block';
    this.updateViewportModalFrameSize();
  }

  /**
   * Hide viewport modal frame
   */
  hideViewportModalFrame() {
    if (this.viewportModalFrame) {
      this.viewportModalFrame.style.display = 'none';
    }
  }

  /**
   * Update viewport modal frame size
   */
  updateViewportModalFrameSize() {
    if (!this.viewportModalFrame || this.viewportModalFrame.style.display === 'none') {
      return;
    }

    // Get current viewport dimensions
    let viewportWidth, viewportHeight;
    if (window.visualViewport) {
      viewportWidth = window.visualViewport.width;
      viewportHeight = window.visualViewport.height;
    } else {
      viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    }

    // Update frame dimensions
    this.viewportModalFrame.style.width = `${viewportWidth}px`;
    this.viewportModalFrame.style.height = `${viewportHeight}px`;
    this.viewportModalFrame.style.left = '0px';
    this.viewportModalFrame.style.top = '0px';

    // Handle visual viewport offset (mobile keyboards, etc.)
    if (window.visualViewport) {
      this.viewportModalFrame.style.left = `${window.visualViewport.offsetLeft}px`;
      this.viewportModalFrame.style.top = `${window.visualViewport.offsetTop}px`;
    }
  }

  /**
   * Show active text input frame (orange outline around focused text field)
   * @param {Element} textElement
   */
  showActiveTextInputFrame(textElement) {
    if (!this.activeTextInputFrame) {
      this.activeTextInputFrame = document.createElement('div');
      this.activeTextInputFrame.className = CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME;
      document.body.appendChild(this.activeTextInputFrame);
    }

    // Position frame around text element
    const rect = textElement.getBoundingClientRect();
    this.activeTextInputFrame.style.display = 'block';
    this.activeTextInputFrame.style.left = `${rect.left}px`;
    this.activeTextInputFrame.style.top = `${rect.top}px`;
    this.activeTextInputFrame.style.width = `${rect.width}px`;
    this.activeTextInputFrame.style.height = `${rect.height}px`;
  }

  /**
   * Hide active text input frame
   */
  hideActiveTextInputFrame() {
    if (this.activeTextInputFrame) {
      this.activeTextInputFrame.style.display = 'none';
    }
  }

  /**
   * Cleanup all overlays
   */
  cleanup() {
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Remove text mode overlays
    if (this.viewportModalFrame) {
      this.viewportModalFrame.remove();
      this.viewportModalFrame = null;
    }
    
    if (this.activeTextInputFrame) {
      this.activeTextInputFrame.remove();
      this.activeTextInputFrame = null;
    }

    this.focusOverlay.cleanup();
    this.deleteOverlay.cleanup();
    this.highlightOverlay.cleanup();
    this.notificationOverlay.cleanup();
  }
}
