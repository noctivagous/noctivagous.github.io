/**
 * KeyPilot main application class
 */
import { StateManager } from './modules/state-manager.js';
import { EventManager } from './modules/event-manager.js';
import { CursorManager } from './modules/cursor.js';
import { ElementDetector } from './modules/element-detector.js';
import { ActivationHandler } from './modules/activation-handler.js';
import { FocusDetector } from './modules/focus-detector.js';
import { OverlayManager } from './modules/overlay-manager.js';
import { StyleManager } from './modules/style-manager.js';
import { ShadowDOMManager } from './modules/shadow-dom-manager.js';
import { KEYBINDINGS, MODES, CSS_CLASSES } from './config/constants.js';

export class KeyPilot extends EventManager {
  constructor() {
    super();

    // Prevent multiple instances
    if (window.__KeyPilotV22) {
      console.warn('[KeyPilot] Already loaded.');
      return;
    }
    window.__KeyPilotV22 = true;

    this.state = new StateManager();
    this.cursor = new CursorManager();
    this.detector = new ElementDetector();
    this.activator = new ActivationHandler(this.detector);
    this.focusDetector = new FocusDetector(this.state);
    this.overlayManager = new OverlayManager();
    this.styleManager = new StyleManager();
    this.shadowDOMManager = new ShadowDOMManager(this.styleManager);

    // Scroll optimization: track current element to reduce queries
    this.currentTrackedElement = null;
    this.isScrolling = false;
    this.scrollTimeout = null;

    // Mouse movement optimization: only query every 2+ pixels
    this.lastQueryPosition = { x: -1, y: -1 };
    this.MOUSE_QUERY_THRESHOLD = 2;

    this.init();
  }

  init() {
    this.setupStyles();
    this.setupShadowDOMSupport();
    this.cursor.ensure();
    this.focusDetector.start();
    this.start();

    // Subscribe to state changes
    this.state.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });

    // Set up communication with popup
    this.setupPopupCommunication();

    this.state.setState({ isInitialized: true });
  }

  setupStyles() {
    this.styleManager.injectSharedStyles();
  }

  setupShadowDOMSupport() {
    this.shadowDOMManager.setup();
  }

  setupPopupCommunication() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'KP_GET_STATUS') {
        sendResponse({ mode: this.state.getState().mode });
      }
    });
  }

  handleStateChange(newState, prevState) {
    // Update cursor mode
    if (newState.mode !== prevState.mode) {
      this.cursor.setMode(newState.mode);
      this.updatePopupStatus(newState.mode);
    }

    // Update visual overlays
    if (newState.focusEl !== prevState.focusEl ||
      newState.deleteEl !== prevState.deleteEl) {
      this.updateOverlays(newState.focusEl, newState.deleteEl);
    }
  }

  updatePopupStatus(mode) {
    try {
      chrome.runtime.sendMessage({ type: 'KP_STATUS', mode });
    } catch (error) {
      // Popup might not be open
    }
  }

  handleKeyDown(e) {
    // Debug key presses
    console.log('[KeyPilot] Key pressed:', e.key, 'Code:', e.code);

    // Don't interfere with modifier key combinations (Cmd+C, Ctrl+V, etc.)
    if (this.hasModifierKeys(e)) {
      return;
    }

    const currentState = this.state.getState();

    // In text focus mode, only handle ESC
    if (currentState.mode === MODES.TEXT_FOCUS) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        console.debug('Escape key detected in text focus mode');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.handleEscapeFromTextFocus();
      }
      return;
    }

    // Don't handle keys if we're in a typing context but not in our text focus mode
    // (This handles edge cases where focus detection might miss something)
    if (this.isTypingContext(e.target)) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        this.cancelModes();
      }
      return;
    }

    // Handle our keyboard shortcuts
    if (KEYBINDINGS.CANCEL.includes(e.key)) {
      e.preventDefault();
      this.cancelModes();
    } else if (KEYBINDINGS.BACK.includes(e.key) || KEYBINDINGS.BACK2.includes(e.key)) {
      e.preventDefault();
      history.back();
    } else if (KEYBINDINGS.FORWARD.includes(e.key)) {
      e.preventDefault();
      history.forward();
    } else if (KEYBINDINGS.ROOT.includes(e.key)) {
      e.preventDefault();
      this.handleRootKey();
    } else if (KEYBINDINGS.DELETE.includes(e.key)) {
      e.preventDefault();
      this.handleDeleteKey();
    } else if (KEYBINDINGS.ACTIVATE.includes(e.key)) {
      e.preventDefault();
      this.handleActivateKey();
    }
  }

  handleMouseMove(e) {
    this.state.setMousePosition(e.clientX, e.clientY);
    this.cursor.updatePosition(e.clientX, e.clientY);

    // Only update elements if we're not currently scrolling
    if (!this.isScrolling) {
      this.updateElementsUnderCursorWithThreshold(e.clientX, e.clientY);
    } else {
      // During scroll, check if cursor is still over the tracked element
      this.checkTrackedElementDuringScroll(e.clientX, e.clientY);
    }
  }

  handleScroll(_e) {
    const currentState = this.state.getState();

    // Mark that we're scrolling to optimize mouse move handling
    this.isScrolling = true;

    // Clear any existing scroll timeout
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Only update overlays to reposition them, don't re-query elements yet
    this.updateOverlays(currentState.focusEl, currentState.deleteEl);

    // Set timeout to end scrolling state and re-query elements
    this.scrollTimeout = setTimeout(() => {
      this.isScrolling = false;
      this.currentTrackedElement = null; // Clear tracked element
      // Reset query position to force a fresh query after scroll
      this.lastQueryPosition = { x: -1, y: -1 };
      // Re-query elements after scroll ends
      this.updateElementsUnderCursor(currentState.lastMouse.x, currentState.lastMouse.y);
    }, 150); // 150ms delay after scroll stops
  }

  updateElementsUnderCursorWithThreshold(x, y) {
    // Check if mouse has moved enough to warrant a new query
    const deltaX = Math.abs(x - this.lastQueryPosition.x);
    const deltaY = Math.abs(y - this.lastQueryPosition.y);

    if (deltaX < this.MOUSE_QUERY_THRESHOLD && deltaY < this.MOUSE_QUERY_THRESHOLD) {
      // Mouse hasn't moved enough, skip the query
      return;
    }

    // Update last query position
    this.lastQueryPosition.x = x;
    this.lastQueryPosition.y = y;

    // Perform the actual element query
    this.updateElementsUnderCursor(x, y);
  }

  updateElementsUnderCursor(x, y) {
    const currentState = this.state.getState();

    // Don't update focus/delete elements when in text focus mode
    if (currentState.mode === MODES.TEXT_FOCUS) {
      return;
    }

    const under = this.detector.deepElementFromPoint(x, y);
    const clickable = this.detector.findClickable(under);

    // Update tracked element for scroll optimization
    this.currentTrackedElement = clickable;

    this.state.setFocusElement(clickable);

    if (this.state.isDeleteMode()) {
      this.state.setDeleteElement(under);
    } else {
      // Clear delete element when not in delete mode
      this.state.setDeleteElement(null);
    }
  }

  checkTrackedElementDuringScroll(x, y) {
    // If we don't have a tracked element, do a full query
    if (!this.currentTrackedElement) {
      this.updateElementsUnderCursor(x, y);
      return;
    }

    // Quick check: is the cursor still over the tracked element?
    const elementAtPoint = this.detector.deepElementFromPoint(x, y);
    const clickableAtPoint = this.detector.findClickable(elementAtPoint);

    // If cursor moved away from tracked element, do a full update
    if (clickableAtPoint !== this.currentTrackedElement) {
      this.updateElementsUnderCursor(x, y);
    }
    // Otherwise, keep the current tracked element (no DOM queries needed)
  }

  handleDeleteKey() {
    const currentState = this.state.getState();

    if (!this.state.isDeleteMode()) {
      this.state.setMode(MODES.DELETE);
    } else {
      const victim = currentState.deleteEl ||
        this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

      this.cancelModes();
      this.deleteElement(victim);
    }
  }

  handleRootKey() {
    console.log('[KeyPilot] Root key pressed!');
    console.log('[KeyPilot] Current URL:', window.location.href);
    console.log('[KeyPilot] Origin:', window.location.origin);

    // Navigate to the site root (origin)
    const rootUrl = window.location.origin;
    if (rootUrl && rootUrl !== window.location.href) {
      console.log('[KeyPilot] Navigating to root:', rootUrl);
      window.location.href = rootUrl;
    } else {
      console.log('[KeyPilot] Already at root, no navigation needed');
    }
  }

  handleActivateKey() {
    const currentState = this.state.getState();
    const target = currentState.focusEl ||
      this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

    if (!target || target === document.documentElement || target === document.body) {
      return;
    }

    // Try semantic activation first
    if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      return;
    }

    // Fallback to click
    this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
    this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
  }

  deleteElement(element) {
    if (!element || element === document.documentElement || element === document.body) {
      return;
    }

    try {
      element.remove();
    } catch (error) {
      // Fallback: hide element
      try {
        element.classList.add('kpv2-hidden');
        element.setAttribute('aria-hidden', 'true');
      } catch { }
    }
  }

  handleEscapeFromTextFocus() {
    console.debug('Escape pressed in text focus mode, attempting to exit');

    // Use the simple, proven approach that works in DevTools
    // Blur the active element and set focus to the body
    if (document.activeElement) {
      document.activeElement.blur();
    }
    document.body.focus();

    // Clear the text focus state
    this.focusDetector.clearTextFocus();

    console.debug('Text focus escape completed');
  }

  cancelModes() {
    // Don't reset if we're in text focus mode - that should only be cleared by ESC or blur
    if (this.state.getState().mode !== MODES.TEXT_FOCUS) {
      this.state.reset();
    }
  }

  showRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = CSS_CLASSES.RIPPLE;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  updateOverlays(focusEl, deleteEl) {
    const currentState = this.state.getState();
    this.overlayManager.updateOverlays(focusEl, deleteEl, currentState.mode);
  }

  cleanup() {
    this.stop();

    // Clean up scroll optimization
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }

    if (this.focusDetector) {
      this.focusDetector.stop();
    }

    if (this.cursor && this.cursor.cursorEl) {
      this.cursor.cursorEl.remove();
    }

    if (this.overlayManager) {
      this.overlayManager.cleanup();
    }

    if (this.styleManager) {
      this.styleManager.cleanup();
    }

    if (this.shadowDOMManager) {
      this.shadowDOMManager.cleanup();
    }
  }
}