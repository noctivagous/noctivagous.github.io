/**
 * Unified Text Mode Manager - Simplified approach to text mode handling
 * 
 * This replaces the complex overlay coordination and scattered text mode logic
 * with a single, self-contained manager that handles all text mode functionality.
 */
import { CSS_CLASSES, COLORS, MODES, SELECTORS } from '../config/index.js';

export class TextModeManager {
  constructor(stateManager, cursor) {
    this.stateManager = stateManager;
    this.cursor = cursor;
    
    // Text mode state
    this.isActive = false;
    this.currentTextElement = null;
    
    // UI elements created by this manager
    this.overlays = {
      textFieldFrame: null,      // Orange rectangle around text field
      viewportBorder: null,      // Orange border around entire page
      escLabel: null             // ESC exit instruction
    };
    
    // Event listeners (stored for cleanup)
    this.eventListeners = [];
    
    // CSS injected by this manager
    this.injectedCSS = null;
    
    console.log('[TextModeManager] Initialized');
  }

  /**
   * Initialize text mode manager
   */
  async initialize() {
    this.injectCSS();
    this.bindFocusEvents();
    this.bindKeyboardEvents();
    console.log('[TextModeManager] Initialization complete');
  }

  /**
   * Inject required CSS for text mode overlays
   */
  injectCSS() {
    if (this.injectedCSS) return;

    const css = `
      /* Text field orange frame */
      .${CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME} {
        position: fixed !important;
        pointer-events: none !important;
        z-index: 2147483640 !important;
        border: 3px solid ${COLORS.ORANGE} !important;
        box-shadow: 0 0 0 2px ${COLORS.ORANGE_SHADOW}, 0 0 10px 2px ${COLORS.ORANGE_SHADOW_DARK} !important;
        background: transparent !important;
        animation: kp-text-mode-pulse 1.5s ease-in-out infinite !important;
        border-radius: 4px !important;
      }
      
      /* Viewport orange border */
      .${CSS_CLASSES.VIEWPORT_MODAL_FRAME} {
        position: fixed !important;
        top: 0 !important;
        left: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        border: 8px solid ${COLORS.ORANGE} !important;
        opacity: 0.6 !important;
        pointer-events: none !important;
        z-index: 2147483635 !important;
        box-sizing: border-box !important;
      }
      
      /* ESC exit label */
      .${CSS_CLASSES.ESC_EXIT_LABEL} {
        position: fixed !important;
        top: 20px !important;
        right: 20px !important;
        background: ${COLORS.ORANGE} !important;
        color: white !important;
        padding: 8px 12px !important;
        font-size: 14px !important;
        font-weight: bold !important;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
        border-radius: 4px !important;
        z-index: 2147483645 !important;
        pointer-events: none !important;
        animation: kp-text-mode-pulse 1.5s ease-in-out infinite !important;
      }
      
      /* Pulse animation */
      @keyframes kp-text-mode-pulse {
        0% { opacity: 0.6; }
        50% { opacity: 1; }
        100% { opacity: 0.6; }
      }
    `;

    this.injectedCSS = document.createElement('style');
    this.injectedCSS.id = 'kp-text-mode-styles';
    this.injectedCSS.textContent = css;
    document.head.appendChild(this.injectedCSS);
  }

  /**
   * Bind focus events to automatically detect text field focus
   */
  bindFocusEvents() {
    // Focus in - activate text mode
    const onFocusIn = (event) => {
      const element = event.target;
      if (this.isTextInput(element)) {
        console.log('[TextModeManager] Text input focused:', element.tagName, element.type);
        this.activateTextMode(element);
      }
    };

    // Focus out - deactivate text mode
    const onFocusOut = (event) => {
      const element = event.target;
      if (this.isTextInput(element) && this.isActive) {
        console.log('[TextModeManager] Text input blurred:', element.tagName, element.type);
        this.deactivateTextMode();
      }
    };

    // Bind events
    document.addEventListener('focusin', onFocusIn, { capture: true });
    document.addEventListener('focusout', onFocusOut, { capture: true });

    // Store for cleanup
    this.eventListeners.push(
      { element: document, event: 'focusin', handler: onFocusIn, options: { capture: true } },
      { element: document, event: 'focusout', handler: onFocusOut, options: { capture: true } }
    );
  }

  /**
   * Bind keyboard events for ESC key handling
   */
  bindKeyboardEvents() {
    const onKeyDown = (event) => {
      if (this.isActive && event.key === 'Escape') {
        console.log('[TextModeManager] ESC key pressed - exiting text mode');
        event.preventDefault();
        event.stopPropagation();
        this.deactivateTextMode();
        
        // Blur the current text element to ensure clean exit
        if (this.currentTextElement) {
          this.currentTextElement.blur();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, { capture: true });
    
    this.eventListeners.push(
      { element: document, event: 'keydown', handler: onKeyDown, options: { capture: true } }
    );
  }

  /**
   * Check if element is a text input
   */
  isTextInput(element) {
    if (!element || !element.matches) return false;
    
    return element.matches(SELECTORS.FOCUSABLE_TEXT) ||
           element.matches('input[type="text"]') ||
           element.matches('input[type="email"]') ||
           element.matches('input[type="password"]') ||
           element.matches('input[type="search"]') ||
           element.matches('input[type="url"]') ||
           element.matches('input[type="tel"]') ||
           element.matches('textarea') ||
           element.matches('[contenteditable="true"]') ||
           element.matches('[contenteditable=""]');
  }

  /**
   * Activate text mode for a specific text element
   */
  async activateTextMode(textElement) {
    if (this.isActive && this.currentTextElement === textElement) {
      return; // Already active for this element
    }

    console.log('[TextModeManager] Activating text mode');
    
    this.isActive = true;
    this.currentTextElement = textElement;

    // Update application state
    await this.stateManager.setMode(MODES.TEXT_FOCUS, {
      focusedTextElement: textElement
    });

    // Update cursor to orange
    if (this.cursor) {
      this.cursor.setMode(MODES.TEXT_FOCUS, { hasClickableElement: false });
    }

    // Create overlays
    this.createTextFieldFrame(textElement);
    this.createViewportBorder();
    this.createEscLabel();

    console.log('[TextModeManager] Text mode activated successfully');
  }

  /**
   * Deactivate text mode
   */
  async deactivateTextMode() {
    if (!this.isActive) return;

    console.log('[TextModeManager] Deactivating text mode');
    
    this.isActive = false;
    this.currentTextElement = null;

    // Update application state
    await this.stateManager.setMode(MODES.NONE, {
      focusedTextElement: null
    });

    // Update cursor back to green
    if (this.cursor) {
      this.cursor.setMode(MODES.NONE);
    }

    // Remove overlays
    this.removeAllOverlays();

    console.log('[TextModeManager] Text mode deactivated successfully');
  }

  /**
   * Create orange frame around text field
   */
  createTextFieldFrame(textElement) {
    this.removeOverlay('textFieldFrame');

    const frame = document.createElement('div');
    frame.className = CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME;
    
    this.positionTextFieldFrame(frame, textElement);
    document.body.appendChild(frame);
    
    this.overlays.textFieldFrame = frame;

    // Update position on scroll/resize
    const updatePosition = () => this.positionTextFieldFrame(frame, textElement);
    window.addEventListener('scroll', updatePosition, { passive: true });
    window.addEventListener('resize', updatePosition, { passive: true });
    
    // Store cleanup for these events
    this.eventListeners.push(
      { element: window, event: 'scroll', handler: updatePosition, options: { passive: true } },
      { element: window, event: 'resize', handler: updatePosition, options: { passive: true } }
    );
  }

  /**
   * Position text field frame over the text element
   */
  positionTextFieldFrame(frame, textElement) {
    if (!frame || !textElement) return;

    const rect = textElement.getBoundingClientRect();
    const padding = 2;

    frame.style.left = `${rect.left - padding}px`;
    frame.style.top = `${rect.top - padding}px`;
    frame.style.width = `${rect.width + (padding * 2)}px`;
    frame.style.height = `${rect.height + (padding * 2)}px`;
  }

  /**
   * Create orange border around entire viewport
   */
  createViewportBorder() {
    this.removeOverlay('viewportBorder');

    const border = document.createElement('div');
    border.className = CSS_CLASSES.VIEWPORT_MODAL_FRAME;
    document.body.appendChild(border);
    
    this.overlays.viewportBorder = border;
  }

  /**
   * Create ESC exit instruction label
   */
  createEscLabel() {
    this.removeOverlay('escLabel');

    const label = document.createElement('div');
    label.className = CSS_CLASSES.ESC_EXIT_LABEL;
    label.textContent = 'Press ESC to exit text mode';
    document.body.appendChild(label);
    
    this.overlays.escLabel = label;
  }

  /**
   * Remove a specific overlay
   */
  removeOverlay(overlayName) {
    const overlay = this.overlays[overlayName];
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
    }
    this.overlays[overlayName] = null;
  }

  /**
   * Remove all overlays
   */
  removeAllOverlays() {
    Object.keys(this.overlays).forEach(overlayName => {
      this.removeOverlay(overlayName);
    });
  }

  /**
   * Get current text mode status
   */
  getStatus() {
    return {
      isActive: this.isActive,
      currentTextElement: this.currentTextElement?.tagName || null,
      overlaysPresent: {
        textFieldFrame: !!this.overlays.textFieldFrame,
        viewportBorder: !!this.overlays.viewportBorder,
        escLabel: !!this.overlays.escLabel
      }
    };
  }

  /**
   * Force exit text mode (for debugging)
   */
  forceExit() {
    console.log('[TextModeManager] Force exit text mode');
    this.deactivateTextMode();
  }

  /**
   * Cleanup text mode manager
   */
  cleanup() {
    console.log('[TextModeManager] Cleaning up');
    
    // Remove all overlays
    this.removeAllOverlays();

    // Remove event listeners
    this.eventListeners.forEach(({ element, event, handler, options }) => {
      element.removeEventListener(event, handler, options);
    });
    this.eventListeners = [];

    // Remove injected CSS
    if (this.injectedCSS && this.injectedCSS.parentNode) {
      this.injectedCSS.parentNode.removeChild(this.injectedCSS);
      this.injectedCSS = null;
    }

    // Reset state
    this.isActive = false;
    this.currentTextElement = null;

    console.log('[TextModeManager] Cleanup complete');
  }

  /**
   * Enable text mode manager
   */
  async enable() {
    // Re-bind events if needed
    if (this.eventListeners.length === 0) {
      this.bindFocusEvents();
      this.bindKeyboardEvents();
    }
  }

  /**
   * Disable text mode manager
   */
  async disable() {
    // Exit text mode if active
    if (this.isActive) {
      await this.deactivateTextMode();
    }
    
    // Remove overlays but keep event listeners for re-enabling
    this.removeAllOverlays();
  }
}
