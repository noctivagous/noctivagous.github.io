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
import { KEYBINDINGS, MODES, CSS_CLASSES, COLORS } from './config/constants.js';

export class KeyPilot extends EventManager {
  constructor() {
    super();

    // Prevent multiple instances
    if (window.__KeyPilotV22) {
      console.warn('[KeyPilot] Already loaded.');
      return;
    }
    window.__KeyPilotV22 = true;

    // Extension enabled state - default to true, will be updated from service worker
    this.enabled = true;
    this.initializationComplete = false;

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

  async init() {
    // Always set up styles and shadow DOM support
    this.setupStyles();
    this.setupShadowDOMSupport();
    
    // Always ensure cursor exists (but may be hidden)
    this.cursor.ensure();
    
    // Query service worker for current enabled state
    await this.queryInitialState();
    
    // Only initialize functionality if enabled
    if (this.enabled) {
      this.initializeEnabledState();
    } else {
      this.initializeDisabledState();
    }

    // Always set up communication and state management
    this.state.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });



    this.setupPopupCommunication();
    this.setupOptimizedEventListeners();
    this.setupContinuousCursorSync();

    // Initialize cursor position to center of viewport if not set
    this.initializeCursorPosition();

    this.initializationComplete = true;
    this.state.setState({ isInitialized: true });
  }

  /**
   * Query service worker for initial enabled state
   */
  async queryInitialState() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      if (response && typeof response.enabled === 'boolean') {
        this.enabled = response.enabled;
        console.log('[KeyPilot] Initial state from service worker:', this.enabled ? 'enabled' : 'disabled');
      } else {
        // Default to enabled if no response or invalid response
        this.enabled = true;
        console.log('[KeyPilot] No valid state from service worker, defaulting to enabled');
      }
    } catch (error) {
      // Service worker might not be available, default to enabled
      this.enabled = true;
      console.log('[KeyPilot] Service worker not available, defaulting to enabled:', error.message);
    }
  }

  /**
   * Initialize KeyPilot in enabled state
   */
  initializeEnabledState() {
    this.focusDetector.start();
    this.intersectionManager.init();
    this.scrollManager.init();
    this.start();
    this.cursor.show();
  }

  /**
   * Initialize KeyPilot in disabled state
   */
  initializeDisabledState() {
    // Don't start event listeners or focus detector
    // Hide cursor
    this.cursor.hide();
    
    // Ensure overlays are hidden
    this.overlayManager.hideFocusOverlay();
    this.overlayManager.hideDeleteOverlay();
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
      } else if (msg.type === 'KP_TOGGLE_STATE') {
        // Handle toggle state message from service worker
        if (typeof msg.enabled === 'boolean') {
          if (msg.enabled) {
            this.enable();
          } else {
            this.disable();
          }
        }
      }
    });
  }

  handleStateChange(newState, prevState) {
    // Update cursor mode
    if (newState.mode !== prevState.mode || 
        (newState.mode === MODES.TEXT_FOCUS && newState.focusEl !== prevState.focusEl)) {
      // For text focus mode, pass whether there's a clickable element and the focused element
      const options = newState.mode === MODES.TEXT_FOCUS ? 
        { 
          hasClickableElement: !!newState.focusEl
        } : {};
      this.cursor.setMode(newState.mode, options);
      this.updatePopupStatus(newState.mode);
    }

    // Update overlays when focused text element changes or when overlay update is triggered
    if (newState.focusedTextElement !== prevState.focusedTextElement ||
        newState._overlayUpdateTrigger !== prevState._overlayUpdateTrigger) {
      // Update overlays to show the focused text overlay
      this.updateOverlays(newState.focusEl, newState.deleteEl);
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
    // Don't handle keys if extension is disabled
    if (!this.enabled) {
      return;
    }

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
        this.handleEscapeFromTextFocus(currentState);
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

    // Special handling for highlight mode - cancel on any key except H and ESC
    if (currentState.mode === MODES.HIGHLIGHT) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        // ESC key cancellation in highlight mode
        e.preventDefault();
        this.cancelHighlightMode();
        return;
      } else if (KEYBINDINGS.HIGHLIGHT.includes(e.key)) {
        // H key - complete the selection
        e.preventDefault();
        this.handleHighlightKey();
        return;
      } else {
        // Any other key - cancel highlight mode and let the key execute its normal function
        this.cancelHighlightMode();
        // Don't prevent default - allow the functional key to execute after canceling
        // Fall through to handle the key normally
      }
    }

    // Handle our keyboard shortcuts
    if (KEYBINDINGS.CANCEL.includes(e.key)) {
      e.preventDefault();
      this.cancelModes();
    } else if (KEYBINDINGS.BACK.includes(e.key) || KEYBINDINGS.BACK2.includes(e.key)) {
      e.preventDefault();
      this.handleBackKey();
    } else if (KEYBINDINGS.FORWARD.includes(e.key)) {
      e.preventDefault();
      this.handleForwardKey();
    } else if (KEYBINDINGS.ROOT.includes(e.key)) {
      e.preventDefault();
      this.handleRootKey();
    } else if (KEYBINDINGS.CLOSE_TAB.includes(e.key)) {
      e.preventDefault();
      this.handleCloseTabKey();
    } else if (KEYBINDINGS.DELETE.includes(e.key)) {
      e.preventDefault();
      this.handleDeleteKey();
    } else if (KEYBINDINGS.HIGHLIGHT.includes(e.key)) {
      e.preventDefault();
      this.handleHighlightKey();
    } else if (KEYBINDINGS.ACTIVATE.includes(e.key)) {
      e.preventDefault();
      this.handleActivateKey();
    }
  }

  handleMouseMove(e) {
    // Don't handle mouse events if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Store mouse position immediately to prevent sync issues
    const x = e.clientX;
    const y = e.clientY;
    
    this.state.setMousePosition(x, y);
    this.cursor.updatePosition(x, y);

    // Use optimized element detection with threshold
    this.updateElementsUnderCursorWithThreshold(x, y);
  }

  handleScroll(e) {
    // Don't handle scroll events if extension is disabled
    if (!this.enabled) {
      return;
    }

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
    let clickable = this.detector.findClickable(under);
    
    // In text focus mode, exclude the currently focused text element from being considered clickable
    if (currentState.mode === MODES.TEXT_FOCUS && currentState.focusedTextElement && clickable === currentState.focusedTextElement) {
      clickable = null;
    }
    
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
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete mode - setting delete element:', {
          tagName: under?.tagName,
          className: under?.className,
          id: under?.id
        });
      }
      this.state.setDeleteElement(under);
    } else {
      // Clear delete element when not in delete mode
      this.state.setDeleteElement(null);
    }

    // Update text selection in highlight mode
    if (this.state.isHighlightMode()) {
      this.updateSelection();
    }
  }

  handleBackKey() {
    history.back();
  }

  handleForwardKey() {
    history.forward();
  }

  handleDeleteKey() {
    const currentState = this.state.getState();

    if (!this.state.isDeleteMode()) {
      console.log('[KeyPilot] Entering delete mode');
      this.state.setMode(MODES.DELETE);
    } else {
      const victim = currentState.deleteEl ||
        this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

      console.log('[KeyPilot] Deleting element:', victim);
      this.cancelModes();
      this.deleteElement(victim);
    }
  }

  handleHighlightKey() {
    const currentState = this.state.getState();

    // Prevent highlight mode activation in text focus mode
    if (currentState.mode === MODES.TEXT_FOCUS) {
      console.log('[KeyPilot] H key ignored - currently in text focus mode');
      return;
    }

    if (!this.state.isHighlightMode()) {
      console.log('[KeyPilot] Entering highlight mode');
      
      // Cancel delete mode if active
      if (this.state.isDeleteMode()) {
        console.log('[KeyPilot] Canceling delete mode to enter highlight mode');
      }
      
      // Enter highlight mode and start highlighting at current cursor position
      this.state.setMode(MODES.HIGHLIGHT);
      this.startHighlighting();
    } else {
      console.log('[KeyPilot] Completing highlight selection');
      this.completeSelection();
    }
  }

  startHighlighting() {
    const currentState = this.state.getState();
    const startPosition = {
      x: currentState.lastMouse.x,
      y: currentState.lastMouse.y,
      element: this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y)
    };

    console.log('[KeyPilot] Starting text selection at:', startPosition);
    this.state.setHighlightStartPosition(startPosition);

    // Initialize text selection at cursor position with comprehensive error handling
    try {
      const textNode = this.findTextNodeAtPosition(startPosition.x, startPosition.y);
      if (textNode) {
        // Create range using appropriate document context with error handling
        const ownerDocument = textNode.ownerDocument || document;
        
        // Validate document context
        if (!ownerDocument || typeof ownerDocument.createRange !== 'function') {
          throw new Error('Invalid document context for range creation');
        }
        
        const range = ownerDocument.createRange();
        const offset = this.getTextOffsetAtPosition(textNode, startPosition.x, startPosition.y);
        
        // Validate offset with bounds checking
        const textLength = textNode.textContent ? textNode.textContent.length : 0;
        if (textLength === 0) {
          throw new Error('Text node has no content');
        }
        
        const validOffset = Math.max(0, Math.min(offset, textLength));
        
        // Set range start position with error handling
        try {
          range.setStart(textNode, validOffset);
          range.setEnd(textNode, validOffset);
        } catch (rangeError) {
          throw new Error(`Failed to set range position: ${rangeError.message}`);
        }
        
        // Get appropriate selection object with validation
        const selection = this.getSelectionForDocument(ownerDocument);
        if (!selection) {
          throw new Error('Could not get selection object for document context');
        }
        
        // Validate selection API availability
        if (typeof selection.removeAllRanges !== 'function' || typeof selection.addRange !== 'function') {
          throw new Error('Selection API methods not available');
        }
        
        // Clear any existing selection and set new range with error handling
        try {
          selection.removeAllRanges();
          selection.addRange(range);
        } catch (selectionError) {
          throw new Error(`Failed to set selection range: ${selectionError.message}`);
        }
        
        // Store the selection for updates
        this.state.setCurrentSelection(selection);
        
        // Initialize visual selection overlays with error handling
        try {
          this.overlayManager.updateHighlightSelectionOverlays(selection);
        } catch (overlayError) {
          console.warn('[KeyPilot] Error updating selection overlays:', overlayError);
          // Continue without visual overlays - selection still works
        }
        
        console.log('[KeyPilot] Text selection initialized successfully at offset:', validOffset);
      } else {
        console.log('[KeyPilot] No text node found at position, selection will start when cursor moves to text');
        // This is not an error - just no selectable content at current position
      }
    } catch (error) {
      console.error('[KeyPilot] Error initializing text selection:', error);
      
      // Show user-friendly error message
      this.showFlashNotification(
        'Unable to start text selection at this position', 
        COLORS.NOTIFICATION_ERROR
      );
      
      // Don't exit highlight mode - user can try moving cursor to different position
      // Continue without selection - will try again when cursor moves
    }
  }

  updateSelection() {
    const currentState = this.state.getState();
    const startPos = currentState.highlightStartPosition;
    
    if (!startPos) {
      console.warn('[KeyPilot] No start position for selection update');
      return;
    }

    const currentPos = {
      x: currentState.lastMouse.x,
      y: currentState.lastMouse.y
    };

    // Performance optimization: skip update if cursor hasn't moved much
    const deltaX = Math.abs(currentPos.x - startPos.x);
    const deltaY = Math.abs(currentPos.y - startPos.y);
    if (deltaX < 5 && deltaY < 5) {
      return; // Cursor hasn't moved enough to warrant an update
    }

    // Update the highlight rectangle overlay to show selection area
    try {
      this.overlayManager.updateHighlightRectangleOverlay(startPos, currentPos);
    } catch (overlayError) {
      console.warn('[KeyPilot] Error updating highlight rectangle overlay:', overlayError);
    }

    try {
      // Use rectangle-based selection instead of point-to-point
      const selectionResult = this.createRectangleBasedSelection(startPos, currentPos);
      
      if (selectionResult && selectionResult.success && selectionResult.selection) {
        // Validate selection before storing
        try {
          const selectedText = selectionResult.selection.toString();
          if (selectedText !== null && selectedText !== undefined) {
            // Store updated selection
            this.state.setCurrentSelection(selectionResult.selection);
            
            // Update visual selection overlays for real-time feedback with error handling
            try {
              this.overlayManager.updateHighlightSelectionOverlays(selectionResult.selection);
            } catch (overlayError) {
              console.warn('[KeyPilot] Error updating selection overlays:', overlayError);
            }
          }
        } catch (validationError) {
          console.warn('[KeyPilot] Error validating selection:', validationError);
        }
      } else {
        // Clear selection if no valid selection could be created
        this.clearSelectionSafely();
        try {
          this.overlayManager.clearHighlightSelectionOverlays();
        } catch (overlayError) {
          console.warn('[KeyPilot] Error clearing selection overlays:', overlayError);
        }
      }
    } catch (error) {
      console.error('[KeyPilot] Unexpected error updating selection:', error);
      
      // Show user-friendly error message for unexpected errors
      this.showFlashNotification(
        'Selection update failed - try moving cursor', 
        COLORS.NOTIFICATION_ERROR
      );
      
      // Clear selection on error but stay in highlight mode
      this.clearSelectionSafely();
      try {
        this.overlayManager.clearHighlightSelectionOverlays();
      } catch (overlayError) {
        console.warn('[KeyPilot] Error clearing overlays after unexpected error:', overlayError);
      }
    }
  }

  /**
   * Create a selection across potentially different document boundaries
   * @param {Text} startNode - Starting text node
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Text} currentNode - Current text node
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag, selection, and metadata
   */
  createCrossBoundarySelection(startNode, startPos, currentNode, currentPos) {
    try {
      // Check if nodes are in the same document context
      const startDocument = startNode.ownerDocument || document;
      const currentDocument = currentNode.ownerDocument || document;
      const sameDocument = startDocument === currentDocument;
      
      // For cross-frame content, we can only select within the same document
      if (!sameDocument) {
        console.warn('[KeyPilot] Cross-frame selection not supported, limiting to current document');
        // Try to select within the current document only
        return this.createSingleDocumentSelection(currentNode, currentPos, currentNode, currentPos);
      }
      
      // Check if nodes are in different shadow DOM contexts
      const startRoot = this.getShadowRoot(startNode);
      const currentRoot = this.getShadowRoot(currentNode);
      const crossBoundary = startRoot !== currentRoot;
      
      if (crossBoundary) {
        // Handle cross-shadow-boundary selection
        return this.createCrossShadowSelection(startNode, startPos, currentNode, currentPos);
      } else {
        // Same document and shadow context - use standard selection
        return this.createSingleDocumentSelection(startNode, startPos, currentNode, currentPos);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating cross-boundary selection:', error);
      return { success: false, selection: null, crossBoundary: false };
    }
  }

  /**
   * Create rectangle-based selection that includes all text nodes within the rectangle
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag and selection
   */
  createRectangleBasedSelection(startPos, currentPos) {
    try {
      // Calculate rectangle bounds
      const rect = {
        left: Math.min(startPos.x, currentPos.x),
        top: Math.min(startPos.y, currentPos.y),
        right: Math.max(startPos.x, currentPos.x),
        bottom: Math.max(startPos.y, currentPos.y)
      };

      // Find all text nodes within the rectangle
      const textNodesInRect = this.findTextNodesInRectangle(rect);
      
      if (textNodesInRect.length === 0) {
        return { success: false, selection: null, crossBoundary: false };
      }

      // Sort text nodes by document order
      textNodesInRect.sort((a, b) => {
        const comparison = a.compareDocumentPosition(b);
        if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1; // a comes before b
        } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1; // a comes after b
        }
        return 0; // same node or no clear order
      });

      // Create selection from first to last text node
      const firstNode = textNodesInRect[0];
      const lastNode = textNodesInRect[textNodesInRect.length - 1];
      
      const ownerDocument = firstNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      
      // Set range to encompass all text nodes
      range.setStart(firstNode, 0);
      range.setEnd(lastNode, lastNode.textContent.length);
      
      // Get appropriate selection object
      const selection = this.getSelectionForDocument(ownerDocument);
      if (!selection) {
        return { success: false, selection: null, crossBoundary: false };
      }
      
      // Update selection
      selection.removeAllRanges();
      selection.addRange(range);
      
      return { success: true, selection: selection, crossBoundary: false };
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating rectangle-based selection:', error);
      return { success: false, selection: null, crossBoundary: false };
    }
  }

  /**
   * Find all text nodes that are within or intersect with the given rectangle
   * @param {Object} rect - Rectangle with left, top, right, bottom properties
   * @returns {Array} - Array of text nodes within the rectangle
   */
  findTextNodesInRectangle(rect) {
    const textNodes = [];
    
    try {
      // Get all text nodes in the document
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip empty or whitespace-only text nodes
            if (!node.textContent || !node.textContent.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Check if text node intersects with rectangle
            try {
              const range = document.createRange();
              range.selectNodeContents(node);
              const nodeRect = range.getBoundingClientRect();
              
              // Check if node rectangle intersects with selection rectangle
              const intersects = !(
                nodeRect.right < rect.left ||
                nodeRect.left > rect.right ||
                nodeRect.bottom < rect.top ||
                nodeRect.top > rect.bottom
              );
              
              return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
            } catch (error) {
              console.warn('[KeyPilot] Error checking text node intersection:', error);
              return NodeFilter.FILTER_REJECT;
            }
          }
        },
        false
      );
      
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      // Also check shadow DOM elements
      this.findTextNodesInShadowDOMRectangle(document.body, rect, textNodes);
      
    } catch (error) {
      console.warn('[KeyPilot] Error finding text nodes in rectangle:', error);
    }
    
    return textNodes;
  }

  /**
   * Find text nodes within shadow DOM elements that intersect with the rectangle
   * @param {Element} element - Root element to search
   * @param {Object} rect - Rectangle bounds
   * @param {Array} textNodes - Array to add found text nodes to
   */
  findTextNodesInShadowDOMRectangle(element, rect, textNodes) {
    try {
      // Check if element has shadow root
      if (element.shadowRoot) {
        const walker = document.createTreeWalker(
          element.shadowRoot,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              if (!node.textContent || !node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              try {
                const range = element.shadowRoot.ownerDocument.createRange();
                range.selectNodeContents(node);
                const nodeRect = range.getBoundingClientRect();
                
                const intersects = !(
                  nodeRect.right < rect.left ||
                  nodeRect.left > rect.right ||
                  nodeRect.bottom < rect.top ||
                  nodeRect.top > rect.bottom
                );
                
                return intersects ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
              } catch (error) {
                return NodeFilter.FILTER_REJECT;
              }
            }
          },
          false
        );
        
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
      }
      
      // Recursively check child elements for shadow roots
      for (const child of element.children) {
        this.findTextNodesInShadowDOMRectangle(child, rect, textNodes);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error finding shadow DOM text nodes:', error);
    }
  }

  /**
   * Create selection within a single document context
   * @param {Text} startNode - Starting text node
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Text} currentNode - Current text node
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag and selection
   */
  createSingleDocumentSelection(startNode, startPos, currentNode, currentPos) {
    try {
      const ownerDocument = startNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      
      // Calculate text offsets
      const startOffset = this.getTextOffsetAtPosition(startNode, startPos.x, startPos.y);
      const currentOffset = this.getTextOffsetAtPosition(currentNode, currentPos.x, currentPos.y);
      
      // Validate offsets
      const startTextLength = startNode.textContent.length;
      const currentTextLength = currentNode.textContent.length;
      const validStartOffset = Math.max(0, Math.min(startOffset, startTextLength));
      const validCurrentOffset = Math.max(0, Math.min(currentOffset, currentTextLength));
      
      // Set range based on direction of selection
      if (startNode === currentNode) {
        // Same text node - set range based on offset order
        if (validStartOffset <= validCurrentOffset) {
          range.setStart(startNode, validStartOffset);
          range.setEnd(currentNode, validCurrentOffset);
        } else {
          range.setStart(currentNode, validCurrentOffset);
          range.setEnd(startNode, validStartOffset);
        }
      } else {
        // Different text nodes - use document position to determine order
        const comparison = startNode.compareDocumentPosition(currentNode);
        if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
          // Current node comes after start node
          range.setStart(startNode, validStartOffset);
          range.setEnd(currentNode, validCurrentOffset);
        } else {
          // Current node comes before start node
          range.setStart(currentNode, validCurrentOffset);
          range.setEnd(startNode, validStartOffset);
        }
      }
      
      // Validate range before applying
      if (range.collapsed && validStartOffset === validCurrentOffset && startNode === currentNode) {
        // Don't create empty selections unless we're at the exact start position
        return { success: false, selection: null, crossBoundary: false };
      }
      
      // Get appropriate selection object
      const selection = this.getSelectionForDocument(ownerDocument);
      if (!selection) {
        return { success: false, selection: null, crossBoundary: false };
      }
      
      // Update selection
      selection.removeAllRanges();
      selection.addRange(range);
      
      return { success: true, selection: selection, crossBoundary: false };
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating single document selection:', error);
      return { success: false, selection: null, crossBoundary: false };
    }
  }

  /**
   * Create selection across shadow DOM boundaries
   * @param {Text} startNode - Starting text node
   * @param {Object} startPos - Starting position with x, y coordinates
   * @param {Text} currentNode - Current text node
   * @param {Object} currentPos - Current position with x, y coordinates
   * @returns {Object} - Result object with success flag and selection
   */
  createCrossShadowSelection(startNode, startPos, currentNode, currentPos) {
    try {
      // For cross-shadow selections, we need to be more careful
      // Try to create selection in the main document context
      const mainSelection = window.getSelection();
      
      // Create ranges for both nodes in their respective contexts
      const startRange = this.createRangeForTextNode(startNode);
      const currentRange = this.createRangeForTextNode(currentNode);
      
      if (!startRange || !currentRange) {
        return { success: false, selection: null, crossBoundary: true };
      }
      
      // For cross-shadow selections, we'll select the entire range from start to current
      // This is a limitation of the Selection API across shadow boundaries
      try {
        const combinedRange = document.createRange();
        
        // Try to set the range to span from start to current
        // This may fail for some cross-shadow scenarios
        combinedRange.setStart(startNode, this.getTextOffsetAtPosition(startNode, startPos.x, startPos.y));
        combinedRange.setEnd(currentNode, this.getTextOffsetAtPosition(currentNode, currentPos.x, currentPos.y));
        
        mainSelection.removeAllRanges();
        mainSelection.addRange(combinedRange);
        
        return { success: true, selection: mainSelection, crossBoundary: true };
        
      } catch (crossError) {
        // Cross-shadow selection failed, fall back to selecting in the current node's context
        console.warn('[KeyPilot] Cross-shadow selection failed, falling back to current node context:', crossError);
        return this.createSingleDocumentSelection(currentNode, currentPos, currentNode, currentPos);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error creating cross-shadow selection:', error);
      return { success: false, selection: null, crossBoundary: true };
    }
  }

  /**
   * Get the shadow root for a given node
   * @param {Node} node - Node to find shadow root for
   * @returns {ShadowRoot|Document} - Shadow root or document
   */
  getShadowRoot(node) {
    let current = node;
    while (current) {
      if (current.nodeType === Node.DOCUMENT_NODE) {
        return current;
      }
      const root = current.getRootNode();
      if (root instanceof ShadowRoot) {
        return root;
      }
      if (root === document) {
        return document;
      }
      current = current.parentNode;
    }
    return document;
  }

  /**
   * Get the appropriate selection object for a document
   * @param {Document} doc - Document to get selection for
   * @returns {Selection|null} - Selection object or null
   */
  getSelectionForDocument(doc) {
    try {
      if (doc === document) {
        return window.getSelection();
      }
      // For shadow DOM contexts, we typically use the main document selection
      // as shadow roots don't have their own selection objects in most browsers
      return window.getSelection();
    } catch (error) {
      console.warn('[KeyPilot] Error getting selection for document:', error);
      return null;
    }
  }

  /**
   * Safely clear selection with comprehensive error handling
   */
  clearSelectionSafely() {
    // Clear main document selection
    try {
      if (window && typeof window.getSelection === 'function') {
        const selection = window.getSelection();
        if (selection) {
          // Validate selection object before using
          if (typeof selection.rangeCount === 'number' && 
              typeof selection.removeAllRanges === 'function') {
            
            if (selection.rangeCount > 0) {
              selection.removeAllRanges();
              console.log('[KeyPilot] Cleared main document selection');
            }
          } else {
            console.warn('[KeyPilot] Main selection object missing required methods');
          }
        }
      }
    } catch (error) {
      console.warn('[KeyPilot] Error clearing main document selection:', error);
    }
    
    // Clear stored selection from state
    try {
      const currentState = this.state.getState();
      if (currentState && currentState.currentSelection) {
        this.state.setCurrentSelection(null);
        console.log('[KeyPilot] Cleared stored selection from state');
      }
    } catch (error) {
      console.warn('[KeyPilot] Error clearing stored selection from state:', error);
    }
    
    // Clear shadow DOM selections
    try {
      this.clearAllSelectionsWithShadowSupport();
    } catch (error) {
      console.warn('[KeyPilot] Error clearing shadow DOM selections:', error);
    }
  }

  async completeSelection() {
    const currentState = this.state.getState();
    
    console.log('[KeyPilot] Completing text selection with comprehensive error handling');
    
    try {
      // Get the current selection with comprehensive error handling
      let selection, selectedText;
      
      try {
        selection = this.getCurrentSelectionWithShadowSupport();
        if (!selection) {
          throw new Error('No selection object available');
        }
        
        // Validate selection has content
        if (typeof selection.toString !== 'function') {
          throw new Error('Selection object missing toString method');
        }
        
        selectedText = selection.toString();
        if (selectedText === null || selectedText === undefined) {
          throw new Error('Selection returned invalid text content');
        }
      } catch (selectionError) {
        console.warn('[KeyPilot] Error getting current selection:', selectionError);
        
        // Try fallback: get selection from state
        try {
          const stateSelection = currentState.currentSelection;
          if (stateSelection && typeof stateSelection.toString === 'function') {
            selectedText = stateSelection.toString();
            selection = stateSelection;
            console.log('[KeyPilot] Using fallback selection from state');
          } else {
            throw new Error('No valid fallback selection available');
          }
        } catch (fallbackError) {
          console.error('[KeyPilot] Fallback selection also failed:', fallbackError);
          this.showFlashNotification('Unable to access selected text', COLORS.NOTIFICATION_ERROR);
          return;
        }
      }
      
      // Handle empty or whitespace-only selections
      if (!selectedText || !selectedText.trim()) {
        console.log('[KeyPilot] Empty or whitespace-only selection, canceling highlight mode');
        this.cancelHighlightMode();
        this.showFlashNotification('No text selected', COLORS.NOTIFICATION_INFO);
        return;
      }
      
      // Validate text content before copying
      if (typeof selectedText !== 'string') {
        console.error('[KeyPilot] Selected text is not a string:', typeof selectedText);
        this.showFlashNotification('Invalid text selection', COLORS.NOTIFICATION_ERROR);
        return;
      }
      
      // Copy selected text to clipboard with comprehensive error handling
      let copySuccess = false;
      let clipboardError = null;
      
      try {
        copySuccess = await this.copyToClipboard(selectedText);
      } catch (error) {
        clipboardError = error;
        console.error('[KeyPilot] Clipboard operation threw error:', error);
        copySuccess = false;
      }
      
      if (copySuccess) {
        console.log('[KeyPilot] Text successfully copied to clipboard:', selectedText.substring(0, 50));
        
        // Clear selection and exit highlight mode with error handling
        try {
          this.cancelModes();
        } catch (cancelError) {
          console.warn('[KeyPilot] Error canceling modes after successful copy:', cancelError);
          // Force exit highlight mode
          this.state.setMode(MODES.NONE);
        }
        
        // Show success confirmation
        this.showFlashNotification('Text copied to clipboard', COLORS.NOTIFICATION_SUCCESS);
        
        // Flash the focus overlay for additional visual feedback with error handling
        try {
          this.overlayManager.flashFocusOverlay();
        } catch (flashError) {
          console.warn('[KeyPilot] Error flashing focus overlay:', flashError);
          // Continue without visual feedback
        }
      } else {
        console.warn('[KeyPilot] Failed to copy text to clipboard');
        
        // Provide specific error message based on clipboard error
        let errorMessage = 'Failed to copy text';
        if (clipboardError) {
          if (clipboardError.name === 'NotAllowedError' || clipboardError.message.includes('permission')) {
            errorMessage = 'Clipboard access denied - check browser permissions';
          } else if (clipboardError.message.includes('not supported')) {
            errorMessage = 'Clipboard not supported in this context';
          } else if (clipboardError.message.includes('secure context')) {
            errorMessage = 'Clipboard requires secure connection (HTTPS)';
          }
        }
        
        // Don't exit highlight mode on clipboard failure - let user try again
        this.showFlashNotification(errorMessage, COLORS.NOTIFICATION_ERROR);
      }
    } catch (error) {
      console.error('[KeyPilot] Unexpected error completing selection:', error);
      
      // Provide user-friendly error message for unexpected errors
      let errorMessage = 'Error copying text';
      if (error.message.includes('Selection API')) {
        errorMessage = 'Text selection not supported on this page';
      } else if (error.message.includes('shadow')) {
        errorMessage = 'Cannot copy text from this element';
      }
      
      // Don't exit highlight mode on error - let user try again
      this.showFlashNotification(errorMessage, COLORS.NOTIFICATION_ERROR);
    }
  }

  /**
   * Get current selection with comprehensive shadow DOM support and error handling
   * @returns {Selection|null} - Current selection or null
   */
  getCurrentSelectionWithShadowSupport() {
    try {
      // First try the main document selection with validation
      let mainSelection = null;
      try {
        if (window && typeof window.getSelection === 'function') {
          mainSelection = window.getSelection();
          
          // Validate selection object
          if (mainSelection && 
              typeof mainSelection.rangeCount === 'number' && 
              typeof mainSelection.toString === 'function') {
            
            if (mainSelection.rangeCount > 0) {
              const selectionText = mainSelection.toString();
              if (selectionText && selectionText.trim()) {
                console.log('[KeyPilot] Found valid main document selection');
                return mainSelection;
              }
            }
          }
        }
      } catch (mainSelectionError) {
        console.warn('[KeyPilot] Error accessing main document selection:', mainSelectionError);
      }
      
      // If no main selection, check stored selection from state with validation
      try {
        const currentState = this.state.getState();
        if (currentState && currentState.currentSelection) {
          const stateSelection = currentState.currentSelection;
          
          // Validate stored selection
          if (stateSelection && 
              typeof stateSelection.toString === 'function' &&
              typeof stateSelection.rangeCount === 'number') {
            
            const stateSelectionText = stateSelection.toString();
            if (stateSelectionText && stateSelectionText.trim()) {
              console.log('[KeyPilot] Found valid stored selection from state');
              return stateSelection;
            }
          }
        }
      } catch (stateSelectionError) {
        console.warn('[KeyPilot] Error accessing stored selection from state:', stateSelectionError);
      }
      
      // Try to find selection in shadow DOM contexts with comprehensive error handling
      try {
        const shadowSelection = this.findSelectionInShadowDOM();
        if (shadowSelection) {
          console.log('[KeyPilot] Found valid shadow DOM selection');
          return shadowSelection;
        }
      } catch (shadowSelectionError) {
        console.warn('[KeyPilot] Error finding selection in shadow DOM:', shadowSelectionError);
      }
      
      console.log('[KeyPilot] No valid selection found in any context');
      return null;
    } catch (error) {
      console.error('[KeyPilot] Unexpected error getting current selection:', error);
      return null;
    }
  }

  /**
   * Find selection in shadow DOM contexts with comprehensive error handling
   * @returns {Selection|null} - Selection found in shadow DOM or null
   */
  findSelectionInShadowDOM() {
    try {
      // Validate shadow DOM manager availability
      if (!this.shadowDOMManager) {
        console.log('[KeyPilot] Shadow DOM manager not available');
        return null;
      }
      
      // Validate shadow roots collection
      if (!this.shadowDOMManager.shadowRoots || 
          !Array.isArray(this.shadowDOMManager.shadowRoots) ||
          this.shadowDOMManager.shadowRoots.length === 0) {
        console.log('[KeyPilot] No shadow roots available for selection search');
        return null;
      }
      
      // Iterate through shadow roots with comprehensive error handling
      for (let i = 0; i < this.shadowDOMManager.shadowRoots.length; i++) {
        const shadowRoot = this.shadowDOMManager.shadowRoots[i];
        
        try {
          // Validate shadow root
          if (!shadowRoot) {
            console.warn(`[KeyPilot] Shadow root at index ${i} is null or undefined`);
            continue;
          }
          
          // Check if shadow root has selection capability
          if (typeof shadowRoot.getSelection !== 'function') {
            // Most shadow roots don't have their own getSelection method
            // This is normal and not an error
            continue;
          }
          
          // Try to get selection from shadow root
          let shadowSelection = null;
          try {
            shadowSelection = shadowRoot.getSelection();
          } catch (getSelectionError) {
            console.warn(`[KeyPilot] Error calling getSelection on shadow root ${i}:`, getSelectionError);
            continue;
          }
          
          // Validate shadow selection
          if (!shadowSelection) {
            continue;
          }
          
          // Check if selection has required methods and properties
          if (typeof shadowSelection.rangeCount !== 'number' ||
              typeof shadowSelection.toString !== 'function') {
            console.warn(`[KeyPilot] Shadow selection at index ${i} missing required methods`);
            continue;
          }
          
          // Check if selection has content
          if (shadowSelection.rangeCount > 0) {
            let selectionText = '';
            try {
              selectionText = shadowSelection.toString();
            } catch (toStringError) {
              console.warn(`[KeyPilot] Error getting text from shadow selection ${i}:`, toStringError);
              continue;
            }
            
            if (selectionText && selectionText.trim()) {
              console.log(`[KeyPilot] Found valid selection in shadow root ${i}`);
              return shadowSelection;
            }
          }
        } catch (shadowRootError) {
          console.warn(`[KeyPilot] Error processing shadow root ${i}:`, shadowRootError);
          // Continue to next shadow root
          continue;
        }
      }
      
      console.log('[KeyPilot] No valid selection found in any shadow DOM context');
      return null;
    } catch (error) {
      console.error('[KeyPilot] Unexpected error finding selection in shadow DOM:', error);
      return null;
    }
  }

  /**
   * Copy text to clipboard using modern Clipboard API with comprehensive fallback methods and error handling
   * @param {string} text - Text to copy to clipboard
   * @returns {Promise<boolean>} - True if copy was successful, false otherwise
   */
  async copyToClipboard(text) {
    // Comprehensive input validation
    if (!text) {
      console.warn('[KeyPilot] No text provided to copyToClipboard');
      return false;
    }
    
    if (typeof text !== 'string') {
      console.warn('[KeyPilot] Invalid text type provided to copyToClipboard:', typeof text);
      return false;
    }
    
    if (text.length === 0) {
      console.warn('[KeyPilot] Empty text provided to copyToClipboard');
      return false;
    }
    
    // Validate text content (check for null characters or other issues)
    try {
      // Test if text can be properly encoded
      const encoded = encodeURIComponent(text);
      if (!encoded) {
        throw new Error('Text contains invalid characters');
      }
    } catch (encodingError) {
      console.warn('[KeyPilot] Text encoding validation failed:', encodingError);
      return false;
    }

    // Try modern Clipboard API first with comprehensive error handling
    if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        // Check if we're in a secure context
        if (!window.isSecureContext) {
          console.warn('[KeyPilot] Not in secure context, modern Clipboard API may fail');
        }
        
        // Attempt to write to clipboard with timeout
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Clipboard operation timed out')), 5000);
        });
        
        const clipboardPromise = navigator.clipboard.writeText(text);
        
        await Promise.race([clipboardPromise, timeoutPromise]);
        
        console.log('[KeyPilot] Text copied using modern Clipboard API');
        return true;
      } catch (error) {
        console.warn('[KeyPilot] Modern Clipboard API failed:', error.message);
        
        // Categorize the error for better user feedback
        if (error.name === 'NotAllowedError') {
          console.warn('[KeyPilot] Clipboard permission denied');
        } else if (error.name === 'NotSupportedError') {
          console.warn('[KeyPilot] Clipboard API not supported');
        } else if (error.message.includes('secure context')) {
          console.warn('[KeyPilot] Clipboard requires secure context (HTTPS)');
        } else if (error.message.includes('timed out')) {
          console.warn('[KeyPilot] Clipboard operation timed out');
        } else if (error.message.includes('permission')) {
          console.warn('[KeyPilot] Clipboard permission issue');
        }
        
        // Fall through to fallback method
      }
    } else {
      console.log('[KeyPilot] Modern Clipboard API not available, using fallback method');
    }

    // Fallback method using execCommand with comprehensive error handling
    let textarea = null;
    try {
      // Validate document state
      if (!document || !document.body) {
        throw new Error('Document or document.body not available');
      }
      
      // Check if execCommand is available
      if (typeof document.execCommand !== 'function') {
        throw new Error('execCommand not available');
      }
      
      // Create a temporary textarea element with comprehensive setup
      textarea = document.createElement('textarea');
      if (!textarea) {
        throw new Error('Failed to create textarea element');
      }
      
      // Set textarea properties with error handling
      try {
        textarea.value = text;
        textarea.style.position = 'fixed';
        textarea.style.left = '-9999px';
        textarea.style.top = '-9999px';
        textarea.style.width = '1px';
        textarea.style.height = '1px';
        textarea.style.opacity = '0';
        textarea.style.pointerEvents = 'none';
        textarea.style.zIndex = '-1';
        textarea.setAttribute('readonly', '');
        textarea.setAttribute('tabindex', '-1');
        textarea.setAttribute('aria-hidden', 'true');
      } catch (styleError) {
        throw new Error(`Failed to set textarea properties: ${styleError.message}`);
      }
      
      // Add to DOM with error handling
      try {
        document.body.appendChild(textarea);
      } catch (appendError) {
        throw new Error(`Failed to append textarea to DOM: ${appendError.message}`);
      }
      
      // Focus and select text with error handling
      try {
        textarea.focus();
        textarea.select();
        
        // Ensure selection is set properly
        if (typeof textarea.setSelectionRange === 'function') {
          textarea.setSelectionRange(0, text.length);
        }
        
        // Verify selection was successful
        if (textarea.selectionStart !== 0 || textarea.selectionEnd !== text.length) {
          console.warn('[KeyPilot] Text selection in textarea may be incomplete');
        }
      } catch (selectionError) {
        throw new Error(`Failed to select text in textarea: ${selectionError.message}`);
      }
      
      // Execute copy command with error handling
      let success = false;
      try {
        success = document.execCommand('copy');
      } catch (execError) {
        throw new Error(`execCommand failed: ${execError.message}`);
      }
      
      // Clean up textarea
      try {
        if (textarea && textarea.parentNode) {
          document.body.removeChild(textarea);
        }
      } catch (cleanupError) {
        console.warn('[KeyPilot] Error cleaning up textarea:', cleanupError);
        // Don't fail the operation due to cleanup issues
      }
      
      if (success) {
        console.log('[KeyPilot] Text copied using fallback execCommand method');
        return true;
      } else {
        throw new Error('execCommand returned false');
      }
    } catch (error) {
      console.error('[KeyPilot] Fallback clipboard method failed:', error);
      
      // Ensure cleanup even on error
      try {
        if (textarea && textarea.parentNode) {
          document.body.removeChild(textarea);
        }
      } catch (cleanupError) {
        console.warn('[KeyPilot] Error cleaning up textarea after failure:', cleanupError);
      }
      
      return false;
    }
  }

  /**
   * Cancel highlight mode and return to normal mode
   * Clears selection, visual indicators, and state with shadow DOM support
   */
  cancelHighlightMode() {
    console.log('[KeyPilot] Canceling highlight mode with shadow DOM support');
    
    // Clear any active text selection immediately with shadow DOM support
    this.clearAllSelectionsWithShadowSupport();
    
    // Clear visual selection overlays immediately
    try {
      this.overlayManager.clearHighlightSelectionOverlays();
      this.overlayManager.hideHighlightRectangleOverlay();
      console.log('[KeyPilot] Cleared highlight selection overlays and rectangle overlay');
    } catch (error) {
      console.warn('[KeyPilot] Error clearing highlight overlays:', error);
    }
    
    // Clear all highlight-related state
    this.state.setHighlightStartPosition(null);
    this.state.setCurrentSelection(null);
    this.state.setHighlightElement(null);
    
    // Return to normal mode
    this.state.setMode(MODES.NONE);
    
    console.log('[KeyPilot] Highlight mode canceled, returned to normal mode');
  }

  /**
   * Clear all selections including shadow DOM contexts with comprehensive error handling
   */
  clearAllSelectionsWithShadowSupport() {
    // Clear main document selection with validation
    try {
      if (window && typeof window.getSelection === 'function') {
        const mainSelection = window.getSelection();
        if (mainSelection && 
            typeof mainSelection.rangeCount === 'number' &&
            typeof mainSelection.removeAllRanges === 'function') {
          
          if (mainSelection.rangeCount > 0) {
            mainSelection.removeAllRanges();
            console.log('[KeyPilot] Cleared main document selection');
          }
        }
      }
    } catch (error) {
      console.warn('[KeyPilot] Error clearing main document selection:', error);
    }
    
    // Clear selections in shadow DOM contexts with comprehensive validation
    try {
      if (!this.shadowDOMManager) {
        console.log('[KeyPilot] Shadow DOM manager not available for selection clearing');
        return;
      }
      
      if (!this.shadowDOMManager.shadowRoots || 
          !Array.isArray(this.shadowDOMManager.shadowRoots)) {
        console.log('[KeyPilot] No shadow roots available for selection clearing');
        return;
      }
      
      for (let i = 0; i < this.shadowDOMManager.shadowRoots.length; i++) {
        const shadowRoot = this.shadowDOMManager.shadowRoots[i];
        
        try {
          if (!shadowRoot) {
            console.warn(`[KeyPilot] Shadow root at index ${i} is null`);
            continue;
          }
          
          // Check if shadow root has selection capability
          if (typeof shadowRoot.getSelection !== 'function') {
            // Most shadow roots don't have getSelection - this is normal
            continue;
          }
          
          // Try to get and clear shadow selection
          let shadowSelection = null;
          try {
            shadowSelection = shadowRoot.getSelection();
          } catch (getSelectionError) {
            console.warn(`[KeyPilot] Error getting shadow selection ${i}:`, getSelectionError);
            continue;
          }
          
          if (shadowSelection &&
              typeof shadowSelection.rangeCount === 'number' &&
              typeof shadowSelection.removeAllRanges === 'function') {
            
            if (shadowSelection.rangeCount > 0) {
              try {
                shadowSelection.removeAllRanges();
                console.log(`[KeyPilot] Cleared shadow DOM selection ${i}`);
              } catch (removeRangesError) {
                console.warn(`[KeyPilot] Error removing ranges from shadow selection ${i}:`, removeRangesError);
              }
            }
          }
        } catch (shadowRootError) {
          console.warn(`[KeyPilot] Error processing shadow root ${i} for selection clearing:`, shadowRootError);
          continue;
        }
      }
    } catch (error) {
      console.error('[KeyPilot] Unexpected error clearing shadow DOM selections:', error);
    }
  }

  /**
   * Find the text node at the given screen coordinates with comprehensive shadow DOM support and error handling
   * @param {number} x - Screen X coordinate
   * @param {number} y - Screen Y coordinate
   * @returns {Text|null} - Text node at position or null if none found
   */
  findTextNodeAtPosition(x, y) {
    try {
      // Validate input coordinates
      if (typeof x !== 'number' || typeof y !== 'number' || 
          !isFinite(x) || !isFinite(y) || x < 0 || y < 0) {
        console.warn('[KeyPilot] Invalid coordinates provided to findTextNodeAtPosition:', { x, y });
        return null;
      }
      
      // Get element at position using deep shadow DOM traversal with error handling
      let element = null;
      try {
        if (!this.detector || typeof this.detector.deepElementFromPoint !== 'function') {
          throw new Error('Element detector not available or missing deepElementFromPoint method');
        }
        
        element = this.detector.deepElementFromPoint(x, y);
      } catch (detectorError) {
        console.warn('[KeyPilot] Error using element detector:', detectorError);
        
        // Fallback to standard elementFromPoint
        try {
          element = document.elementFromPoint(x, y);
        } catch (fallbackError) {
          console.warn('[KeyPilot] Fallback elementFromPoint also failed:', fallbackError);
          return null;
        }
      }
      
      if (!element) {
        console.log('[KeyPilot] No element found at position:', { x, y });
        return null;
      }

      // Check if element itself is a text node
      if (element.nodeType === Node.TEXT_NODE) {
        // Validate text node has content
        if (element.textContent && element.textContent.trim()) {
          return element;
        } else {
          console.log('[KeyPilot] Text node at position has no content');
          return null;
        }
      }

      // Skip non-selectable elements gracefully with error handling
      try {
        if (this.isNonSelectableElement(element)) {
          console.log('[KeyPilot] Element at position is non-selectable:', element.tagName);
          return null;
        }
      } catch (selectableError) {
        console.warn('[KeyPilot] Error checking if element is selectable:', selectableError);
        // Continue anyway - assume it might be selectable
      }

      // Find text nodes within the element with comprehensive error handling
      let textNodes = [];
      try {
        textNodes = this.findTextNodesInElementWithShadowDOM(element);
      } catch (textNodesError) {
        console.warn('[KeyPilot] Error finding text nodes in element:', textNodesError);
        
        // Fallback: try simple text node search without shadow DOM
        try {
          textNodes = this.findTextNodesInElementSimple(element);
        } catch (fallbackError) {
          console.warn('[KeyPilot] Fallback text node search also failed:', fallbackError);
          return null;
        }
      }
      
      if (!textNodes || textNodes.length === 0) {
        console.log('[KeyPilot] No text nodes found in element at position');
        return null;
      }
      
      // Find the text node closest to the cursor position with comprehensive error handling
      let bestNode = null;
      let bestDistance = Infinity;
      
      for (let i = 0; i < textNodes.length; i++) {
        const node = textNodes[i];
        
        try {
          // Validate text node
          if (!node || node.nodeType !== Node.TEXT_NODE) {
            console.warn(`[KeyPilot] Invalid text node at index ${i}`);
            continue;
          }
          
          // Skip empty text nodes
          if (!node.textContent || !node.textContent.trim()) {
            continue;
          }
          
          // Create a range for this text node to get its position
          let range = null;
          try {
            range = this.createRangeForTextNode(node);
          } catch (rangeError) {
            console.warn(`[KeyPilot] Error creating range for text node ${i}:`, rangeError);
            continue;
          }
          
          if (!range) {
            continue;
          }
          
          // Get bounding rectangle with error handling
          let rect = null;
          try {
            rect = range.getBoundingClientRect();
          } catch (rectError) {
            console.warn(`[KeyPilot] Error getting bounding rect for text node ${i}:`, rectError);
            continue;
          }
          
          // Validate rectangle
          if (!rect || typeof rect.width !== 'number' || typeof rect.height !== 'number' ||
              typeof rect.left !== 'number' || typeof rect.top !== 'number') {
            console.warn(`[KeyPilot] Invalid bounding rect for text node ${i}`);
            continue;
          }
          
          // Skip nodes with no visible area
          if (rect.width <= 0 || rect.height <= 0) {
            continue;
          }
          
          // Calculate distance from cursor to text node with error handling
          try {
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            // Validate calculated center
            if (!isFinite(centerX) || !isFinite(centerY)) {
              console.warn(`[KeyPilot] Invalid center coordinates for text node ${i}`);
              continue;
            }
            
            const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
            
            if (!isFinite(distance)) {
              console.warn(`[KeyPilot] Invalid distance calculation for text node ${i}`);
              continue;
            }
            
            if (distance < bestDistance) {
              bestDistance = distance;
              bestNode = node;
            }
          } catch (distanceError) {
            console.warn(`[KeyPilot] Error calculating distance for text node ${i}:`, distanceError);
            continue;
          }
        } catch (nodeError) {
          console.warn(`[KeyPilot] Error processing text node ${i}:`, nodeError);
          continue;
        }
      }
      
      if (bestNode) {
        console.log('[KeyPilot] Found best text node at distance:', bestDistance);
      } else {
        console.log('[KeyPilot] No suitable text node found at position');
      }
      
      return bestNode;
    } catch (error) {
      console.error('[KeyPilot] Unexpected error finding text node at position:', error);
      return null;
    }
  }

  /**
   * Simple fallback method to find text nodes without shadow DOM support
   * @param {Element} element - Root element to search within
   * @returns {Text[]} - Array of text nodes found
   */
  findTextNodesInElementSimple(element) {
    const textNodes = [];
    
    try {
      if (!element) {
        return textNodes;
      }
      
      // Create tree walker for simple text node traversal
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            try {
              // Skip empty or whitespace-only text nodes
              if (!node.textContent || !node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              // Check if text node is visible
              const parent = node.parentElement;
              if (!parent) {
                return NodeFilter.FILTER_REJECT;
              }
              
              return NodeFilter.FILTER_ACCEPT;
            } catch (error) {
              return NodeFilter.FILTER_REJECT;
            }
          }
        }
      );

      // Collect text nodes
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
    } catch (error) {
      console.warn('[KeyPilot] Error in simple text node search:', error);
    }
    
    return textNodes;
  }

  /**
   * Find all text nodes within an element, including shadow DOM boundaries
   * @param {Element} element - Root element to search within
   * @returns {Text[]} - Array of text nodes found
   */
  findTextNodesInElementWithShadowDOM(element) {
    const textNodes = [];
    
    try {
      // Helper function to traverse nodes recursively
      const traverseNodes = (root) => {
        if (!root) return;
        
        // Create tree walker for this root
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip empty or whitespace-only text nodes
              if (!node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              // Check if text node is visible and selectable
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              // Skip non-selectable parent elements
              if (this.isNonSelectableElement(parent)) {
                return NodeFilter.FILTER_REJECT;
              }
              
              try {
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || 
                    style.visibility === 'hidden' || 
                    style.userSelect === 'none') {
                  return NodeFilter.FILTER_REJECT;
                }
              } catch (error) {
                // If we can't get computed style, skip this node
                return NodeFilter.FILTER_REJECT;
              }
              
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        // Collect text nodes from this root
        let node;
        while (node = walker.nextNode()) {
          textNodes.push(node);
        }
        
        // Also traverse shadow DOM boundaries
        if (root.nodeType === Node.ELEMENT_NODE) {
          this.traverseShadowDOMForTextNodes(root, textNodes);
        }
      };
      
      // Start traversal from the given element
      traverseNodes(element);
      
    } catch (error) {
      console.warn('[KeyPilot] Error finding text nodes with shadow DOM support:', error);
    }
    
    return textNodes;
  }

  /**
   * Traverse shadow DOM boundaries to find text nodes
   * @param {Element} element - Element to check for shadow DOM
   * @param {Text[]} textNodes - Array to collect text nodes into
   */
  traverseShadowDOMForTextNodes(element, textNodes) {
    try {
      // Check if element has shadow root
      if (element.shadowRoot) {
        // Traverse the shadow root
        const shadowWalker = document.createTreeWalker(
          element.shadowRoot,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode: (node) => {
              // Skip empty or whitespace-only text nodes
              if (!node.textContent.trim()) {
                return NodeFilter.FILTER_REJECT;
              }
              
              // Check if text node is visible and selectable
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              
              // Skip non-selectable parent elements
              if (this.isNonSelectableElement(parent)) {
                return NodeFilter.FILTER_REJECT;
              }
              
              try {
                const style = window.getComputedStyle(parent);
                if (style.display === 'none' || 
                    style.visibility === 'hidden' || 
                    style.userSelect === 'none') {
                  return NodeFilter.FILTER_REJECT;
                }
              } catch (error) {
                // If we can't get computed style, skip this node
                return NodeFilter.FILTER_REJECT;
              }
              
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        // Collect text nodes from shadow root
        let shadowNode;
        while (shadowNode = shadowWalker.nextNode()) {
          textNodes.push(shadowNode);
        }
        
        // Recursively check shadow DOM elements for nested shadow roots
        const shadowElements = element.shadowRoot.querySelectorAll('*');
        for (const shadowElement of shadowElements) {
          this.traverseShadowDOMForTextNodes(shadowElement, textNodes);
        }
      }
      
      // Also check child elements for shadow roots
      const childElements = element.querySelectorAll('*');
      for (const childElement of childElements) {
        this.traverseShadowDOMForTextNodes(childElement, textNodes);
      }
      
    } catch (error) {
      console.warn('[KeyPilot] Error traversing shadow DOM for text nodes:', error);
    }
  }

  /**
   * Create a range for a text node, handling cross-boundary scenarios
   * @param {Text} textNode - Text node to create range for
   * @returns {Range|null} - Range object or null if creation fails
   */
  createRangeForTextNode(textNode) {
    try {
      // Determine which document to use for range creation
      const ownerDocument = textNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      range.selectNodeContents(textNode);
      return range;
    } catch (error) {
      console.warn('[KeyPilot] Error creating range for text node:', error);
      return null;
    }
  }

  /**
   * Check if an element is non-selectable (images, buttons, inputs, etc.)
   * @param {Element} element - Element to check
   * @returns {boolean} - True if element should be skipped for text selection
   */
  isNonSelectableElement(element) {
    if (!element || !element.tagName) return true;
    
    const tagName = element.tagName.toLowerCase();
    
    // Skip form controls, media, and interactive elements
    const nonSelectableTags = [
      'img', 'video', 'audio', 'canvas', 'svg',
      'input', 'button', 'select', 'textarea',
      'iframe', 'embed', 'object'
    ];
    
    if (nonSelectableTags.includes(tagName)) {
      return true;
    }
    
    // Skip elements with specific roles
    const role = element.getAttribute('role');
    if (role && ['button', 'link', 'menuitem', 'tab'].includes(role)) {
      return true;
    }
    
    // Skip contenteditable elements (they handle their own selection)
    if (element.contentEditable === 'true') {
      return true;
    }
    
    return false;
  }

  /**
   * Calculate the text offset within a text node at the given screen coordinates
   * @param {Text} textNode - The text node
   * @param {number} x - Screen X coordinate  
   * @param {number} y - Screen Y coordinate
   * @returns {number} - Character offset within the text node
   */
  getTextOffsetAtPosition(textNode, x, y) {
    try {
      const text = textNode.textContent;
      if (!text) return 0;

      // Binary search to find the closest character position
      let left = 0;
      let right = text.length;
      let bestOffset = 0;
      let bestDistance = Infinity;

      while (left <= right) {
        const mid = Math.floor((left + right) / 2);
        
        try {
          // Create range at this offset
          const range = document.createRange();
          range.setStart(textNode, mid);
          range.setEnd(textNode, Math.min(mid + 1, text.length));
          
          const rect = range.getBoundingClientRect();
          if (rect.width === 0 && rect.height === 0) {
            // Empty rect, try next position
            left = mid + 1;
            continue;
          }
          
          // Calculate distance from cursor to character position
          const charX = rect.left + rect.width / 2;
          const charY = rect.top + rect.height / 2;
          const distance = Math.sqrt(Math.pow(x - charX, 2) + Math.pow(y - charY, 2));
          
          if (distance < bestDistance) {
            bestDistance = distance;
            bestOffset = mid;
          }
          
          // Adjust search range based on position
          if (x < charX) {
            right = mid - 1;
          } else {
            left = mid + 1;
          }
        } catch (error) {
          // Skip problematic positions
          left = mid + 1;
        }
      }
      
      return bestOffset;
    } catch (error) {
      console.warn('[KeyPilot] Error calculating text offset:', error);
      return 0;
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
      this.showFlashNotification('Navigating to Site Root...', COLORS.NOTIFICATION_INFO);
      window.location.href = rootUrl;
    } else {
      console.log('[KeyPilot] Already at root, no navigation needed');
    }
  }

  handleCloseTabKey() {
    console.log('[KeyPilot] Close tab key pressed!');
    
    try {
      // Send message to background script to close the current tab
      chrome.runtime.sendMessage({ type: 'KP_CLOSE_TAB' });
      this.showFlashNotification('Closing Tab...', COLORS.NOTIFICATION_INFO);
    } catch (error) {
      console.error('[KeyPilot] Failed to close tab:', error);
      this.showFlashNotification('Failed to Close Tab', COLORS.NOTIFICATION_ERROR);
    }
  }

  handleActivateKey() {
    const currentState = this.state.getState();
    const target = currentState.focusEl ||
      this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

    if (!target || target === document.documentElement || target === document.body) {
      return;
    }

    console.log('[KeyPilot] Activating element:', {
      tagName: target.tagName,
      className: target.className,
      id: target.id,
      hasClickHandler: !!(target.onclick || target.getAttribute('onclick'))
    });

    // Try semantic activation first
    if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      this.overlayManager.flashFocusOverlay();
      return;
    }

    // Always try to click the element, regardless of whether it's "detected" as interactive
    // This ensures videos, custom elements, and other non-standard interactive elements work
    this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
    this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
    this.overlayManager.flashFocusOverlay();
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

  handleEscapeFromTextFocus(currentState) {
    console.debug('Escape pressed in text focus mode');

    // Check if there's a clickable element under the cursor
    if (currentState.focusEl) {
      console.debug('Clickable element found, activating it instead of exiting text focus');
      
      // Activate the clickable element
      const target = currentState.focusEl;
      
      // Try semantic activation first
      if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
        this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
        this.overlayManager.flashFocusOverlay();
        return;
      }

      // Fallback to click
      this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      this.overlayManager.flashFocusOverlay();
      return;
    }

    // No clickable element, exit text focus mode
    console.debug('No clickable element, exiting text focus mode');

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

  /**
   * Cancel all active modes and return to normal mode
   * Handles mode-specific cleanup logic
   */
  cancelModes() {
    const currentState = this.state.getState();
    
    console.log('[KeyPilot] Canceling modes, current mode:', currentState.mode);
    
    // Handle highlight mode cancellation specifically
    if (currentState.mode === MODES.HIGHLIGHT) {
      this.cancelHighlightMode();
      return;
    }
    
    // Don't reset if we're in text focus mode - that should only be cleared by ESC or blur
    if (currentState.mode !== MODES.TEXT_FOCUS) {
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

  showFlashNotification(message, backgroundColor = COLORS.NOTIFICATION_SUCCESS) {
    try {
      // Validate input parameters
      if (!message || typeof message !== 'string') {
        console.warn('[KeyPilot] Invalid message provided to showFlashNotification:', message);
        return;
      }
      
      if (!backgroundColor || typeof backgroundColor !== 'string') {
        console.warn('[KeyPilot] Invalid backgroundColor provided, using default');
        backgroundColor = COLORS.NOTIFICATION_SUCCESS;
      }
      
      // Validate document availability
      if (!document || !document.body) {
        console.warn('[KeyPilot] Document or document.body not available for notification');
        return;
      }
      
      // Create notification overlay with error handling
      let notification = null;
      try {
        notification = document.createElement('div');
        if (!notification) {
          throw new Error('Failed to create notification element');
        }
      } catch (createError) {
        console.error('[KeyPilot] Error creating notification element:', createError);
        return;
      }
      
      notification.className = 'kpv2-flash-notification';
      notification.textContent = message;
      
      // Style the notification with error handling
      try {
        Object.assign(notification.style, {
          position: 'fixed',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          backgroundColor: backgroundColor,
          color: 'white',
          padding: '12px 24px',
          borderRadius: '6px',
          fontSize: '14px',
          fontWeight: '500',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          zIndex: '2147483647',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          opacity: '0',
          transition: 'opacity 0.3s ease-in-out',
          pointerEvents: 'none',
          maxWidth: '400px',
          wordWrap: 'break-word',
          textAlign: 'center'
        });
      } catch (styleError) {
        console.error('[KeyPilot] Error styling notification:', styleError);
        // Continue with basic styling
        notification.style.position = 'fixed';
        notification.style.top = '20px';
        notification.style.left = '50%';
        notification.style.backgroundColor = backgroundColor;
        notification.style.color = 'white';
        notification.style.padding = '12px 24px';
        notification.style.zIndex = '2147483647';
      }

      // Add to document with error handling
      try {
        document.body.appendChild(notification);
      } catch (appendError) {
        console.error('[KeyPilot] Error appending notification to document:', appendError);
        return;
      }

      // Fade in with error handling
      try {
        requestAnimationFrame(() => {
          try {
            notification.style.opacity = '1';
          } catch (fadeInError) {
            console.warn('[KeyPilot] Error fading in notification:', fadeInError);
          }
        });
      } catch (animationError) {
        console.warn('[KeyPilot] Error setting up fade in animation:', animationError);
        // Show notification immediately without animation
        notification.style.opacity = '1';
      }

      // Fade out and remove after appropriate duration based on message type
      const duration = backgroundColor === COLORS.NOTIFICATION_ERROR ? 4000 : 2000; // Show errors longer
      
      setTimeout(() => {
        try {
          if (notification && notification.parentNode) {
            notification.style.opacity = '0';
            setTimeout(() => {
              try {
                if (notification && notification.parentNode) {
                  notification.parentNode.removeChild(notification);
                }
              } catch (removeError) {
                console.warn('[KeyPilot] Error removing notification:', removeError);
              }
            }, 300);
          }
        } catch (fadeOutError) {
          console.warn('[KeyPilot] Error fading out notification:', fadeOutError);
          // Try to remove immediately
          try {
            if (notification && notification.parentNode) {
              notification.parentNode.removeChild(notification);
            }
          } catch (immediateRemoveError) {
            console.warn('[KeyPilot] Error removing notification immediately:', immediateRemoveError);
          }
        }
      }, duration);
      
    } catch (error) {
      console.error('[KeyPilot] Unexpected error showing flash notification:', error);
      
      // Fallback: try to show a basic alert if available
      try {
        if (window.alert && typeof window.alert === 'function') {
          window.alert(`KeyPilot: ${message}`);
        }
      } catch (alertError) {
        console.error('[KeyPilot] Even alert fallback failed:', alertError);
      }
    }
  }

  updateOverlays(focusEl, deleteEl) {
    const currentState = this.state.getState();
    this.overlayManager.updateOverlays(focusEl, deleteEl, currentState.mode, currentState.focusedTextElement);
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

  /**
   * Enable KeyPilot functionality
   */
  enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    
    // Only initialize if initialization is complete
    if (this.initializationComplete) {
      // Restart event listeners
      this.start();
      
      // Show cursor
      if (this.cursor) {
        this.cursor.show();
      }
      
      // Restart focus detector
      if (this.focusDetector) {
        this.focusDetector.start();
      }
      
      // Restart intersection manager
      if (this.intersectionManager) {
        this.intersectionManager.init();
      }
      
      // Restart scroll manager
      if (this.scrollManager) {
        this.scrollManager.init();
      }
      
      // Reset state to normal mode
      this.state.reset();
    }
    
    console.log('[KeyPilot] Extension enabled');
  }

  /**
   * Disable KeyPilot functionality
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    // Only cleanup if initialization is complete
    if (this.initializationComplete) {
      // Stop event listeners
      this.stop();
      
      // Hide cursor
      if (this.cursor) {
        this.cursor.hide();
      }
      
      // Hide all overlays
      if (this.overlayManager) {
        this.overlayManager.hideFocusOverlay();
        this.overlayManager.hideDeleteOverlay();
      }
      
      // Stop focus detector
      if (this.focusDetector) {
        this.focusDetector.stop();
      }
      
      // Clean up intersection manager
      if (this.intersectionManager) {
        this.intersectionManager.cleanup();
      }
      
      // Clean up scroll manager
      if (this.scrollManager) {
        this.scrollManager.cleanup();
      }
      
      // Clear any active state
      this.state.reset();
    }
    
    console.log('[KeyPilot] Extension disabled');
  }

  /**
   * Initialize cursor position to center of viewport if not already set
   */
  initializeCursorPosition() {
    const currentState = this.state.getState();
    
    // If mouse position hasn't been set yet (still at 0,0), initialize to center
    if (currentState.lastMouse.x === 0 && currentState.lastMouse.y === 0) {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      console.log('[KeyPilot] Initializing cursor position to viewport center:', centerX, centerY);
      
      this.state.setMousePosition(centerX, centerY);
      this.cursor.updatePosition(centerX, centerY);
    }
  }

  /**
   * Check if KeyPilot is currently enabled
   */
  isEnabled() {
    return this.enabled;
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