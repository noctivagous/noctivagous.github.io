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
import { IntersectionObserverManager } from './modules/intersection-observer-manager.js';
import { OptimizedScrollManager } from './modules/optimized-scroll-manager.js';
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
    
    // Intersection Observer optimizations
    this.intersectionManager = new IntersectionObserverManager(this.detector);
    this.scrollManager = new OptimizedScrollManager(this.overlayManager, this.state);

    // Mouse movement optimization: only query every 3+ pixels (increased threshold)
    this.lastQueryPosition = { x: -1, y: -1 };
    this.MOUSE_QUERY_THRESHOLD = 3;
    
    // Performance monitoring
    this.performanceMetrics = {
      mouseQueries: 0,
      cacheHits: 0,
      lastMetricsLog: Date.now()
    };

    this.init();
  }

  init() {
    this.setupStyles();
    this.setupShadowDOMSupport();
    this.cursor.ensure();
    this.focusDetector.start();
    
    // Initialize Intersection Observer optimizations
    this.intersectionManager.init();
    this.scrollManager.init();
    
    this.start();

    // Subscribe to state changes
    this.state.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });

    // Set up communication with popup
    this.setupPopupCommunication();
    
    // Set up custom event listeners for optimized scroll handling
    this.setupOptimizedEventListeners();
    
    // Set up continuous cursor sync for problematic sites
    this.setupContinuousCursorSync();

    this.state.setState({ isInitialized: true });
  }

  setupOptimizedEventListeners() {
    // Listen for scroll end events from optimized scroll manager
    document.addEventListener('keypilot:scroll-end', (event) => {
      const { mouseX, mouseY } = event.detail;
      this.updateElementsUnderCursor(mouseX, mouseY);
    });
    
    // Periodic performance metrics logging
    // Enable by setting window.KEYPILOT_DEBUG = true in console
    setInterval(() => {
      if (window.KEYPILOT_DEBUG) {
        this.logPerformanceMetrics();
      }
    }, 10000); // Log every 10 seconds when debug enabled
  }

  setupContinuousCursorSync() {
    // Fallback cursor sync for problematic sites
    let lastSyncTime = 0;
    const syncCursor = () => {
      const now = Date.now();
      
      // Only sync every 16ms (60fps) to avoid performance issues
      if (now - lastSyncTime > 16) {
        const currentState = this.state.getState();
        if (currentState.lastMouse.x !== -1 && currentState.lastMouse.y !== -1) {
          // Force cursor position update
          this.cursor.updatePosition(currentState.lastMouse.x, currentState.lastMouse.y);
        }
        lastSyncTime = now;
      }
      
      // Continue syncing
      requestAnimationFrame(syncCursor);
    };
    
    // Start the sync loop
    requestAnimationFrame(syncCursor);
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
    // Store mouse position immediately to prevent sync issues
    const x = e.clientX;
    const y = e.clientY;
    
    this.state.setMousePosition(x, y);
    this.cursor.updatePosition(x, y);

    // Use optimized element detection with threshold
    this.updateElementsUnderCursorWithThreshold(x, y);
  }

  handleScroll(e) {
    // Delegate scroll handling to optimized scroll manager
    // The scroll manager handles all the optimization logic
    return; // OptimizedScrollManager handles scroll events directly
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

    this.performanceMetrics.mouseQueries++;

    // Use traditional element detection for accuracy
    const under = this.detector.deepElementFromPoint(x, y);
    const clickable = this.detector.findClickable(under);
    
    // Track with intersection manager for performance metrics and caching
    this.intersectionManager.trackElementAtPoint(x, y);

    // Debug logging when debug mode is enabled
    if (window.KEYPILOT_DEBUG && clickable) {
      console.log('[KeyPilot Debug] Found clickable element:', {
        tagName: clickable.tagName,
        href: clickable.href,
        className: clickable.className,
        text: clickable.textContent?.substring(0, 50),
        mode: currentState.mode
      });
    }

    // Always update focus element (for overlays in text focus mode too)
    this.state.setFocusElement(clickable);

    if (this.state.isDeleteMode()) {
      // For delete mode, we need the exact element under cursor, not just clickable
      this.state.setDeleteElement(under);
    } else {
      // Clear delete element when not in delete mode
      this.state.setDeleteElement(null);
    }
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

  logPerformanceMetrics() {
    const now = Date.now();
    const timeSinceLastLog = now - this.performanceMetrics.lastMetricsLog;
    
    if (timeSinceLastLog < 10000) return; // Only log every 10 seconds
    
    const intersectionMetrics = this.intersectionManager.getMetrics();
    const scrollMetrics = this.scrollManager.getScrollMetrics();
    
    console.group('[KeyPilot] Performance Metrics');
    console.log('Mouse Queries:', this.performanceMetrics.mouseQueries);
    console.log('Intersection Observer Cache Hit Rate:', intersectionMetrics.cacheHitRate);
    console.log('Visible Interactive Elements:', intersectionMetrics.visibleElements);
    console.log('Scroll Throttle Ratio:', scrollMetrics.throttleRatio);
    console.log('Average Scroll Duration:', `${scrollMetrics.averageScrollDuration.toFixed(1)}ms`);
    console.groupEnd();
    
    this.performanceMetrics.lastMetricsLog = now;
  }

  cleanup() {
    this.stop();

    // Clean up intersection observer optimizations
    if (this.intersectionManager) {
      this.intersectionManager.cleanup();
    }
    
    if (this.scrollManager) {
      this.scrollManager.cleanup();
    }

    if (this.focusDetector) {
      this.focusDetector.stop();
    }

    if (this.cursor) {
      this.cursor.cleanup();
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
    
    // Remove custom event listeners
    document.removeEventListener('keypilot:scroll-end', this.handleScrollEnd);
  }
}