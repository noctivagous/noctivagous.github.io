/**
 * Mouse Handler - Processes mouse events
 */
export class MouseHandler {
  constructor(stateManager, lifecycleManager) {
    this.stateManager = stateManager;
    this.lifecycleManager = lifecycleManager;
    this.enabled = true;
    
    // Mouse movement optimization
    this.lastQueryPosition = { x: -1, y: -1 };
    this.MOUSE_QUERY_THRESHOLD = 3;
    
    // Performance metrics
    this.performanceMetrics = {
      mouseQueries: 0,
      cacheHits: 0,
      lastMetricsLog: Date.now()
    };
  }

  /**
   * Handle mouse move events
   * @param {MouseEvent} event
   */
  handleMouseMove(event) {
    if (!this.enabled) return;

    const x = event.clientX;
    const y = event.clientY;
    
    // Store mouse position immediately
    this.stateManager.setMousePosition(x, y);
    
    // Update cursor position
    const cursor = this.lifecycleManager.getComponent('cursor');
    if (cursor) {
      cursor.updatePosition(x, y);
    }

    // Update mouse coordinates for storage
    const mouseCoordinateManager = this.lifecycleManager.getComponent('mouseCoordinateManager');
    if (mouseCoordinateManager) {
      mouseCoordinateManager.updateCurrentMousePosition(x, y);
    }

    // Use optimized element detection with threshold
    this.updateElementsUnderCursorWithThreshold(x, y);
  }

  /**
   * Handle scroll events
   * @param {Event} event
   */
  handleScroll(event) {
    if (!this.enabled) return;
    
    // Delegate to optimized scroll manager
    const scrollManager = this.lifecycleManager.getComponent('scrollManager');
    if (scrollManager) {
      // The scroll manager handles optimization internally
      return;
    }
  }

  /**
   * Update elements under cursor with movement threshold
   * @param {number} x
   * @param {number} y
   */
  updateElementsUnderCursorWithThreshold(x, y) {
    // Check if mouse has moved enough to warrant a new query
    const deltaX = Math.abs(x - this.lastQueryPosition.x);
    const deltaY = Math.abs(y - this.lastQueryPosition.y);

    if (deltaX < this.MOUSE_QUERY_THRESHOLD && deltaY < this.MOUSE_QUERY_THRESHOLD) {
      return; // Mouse hasn't moved enough
    }

    // Update last query position
    this.lastQueryPosition.x = x;
    this.lastQueryPosition.y = y;

    // Perform the actual element query
    this.updateElementsUnderCursor(x, y);
  }

  /**
   * Update elements under cursor
   * @param {number} x
   * @param {number} y
   */
  updateElementsUnderCursor(x, y) {
    const currentState = this.stateManager.getState();
    this.performanceMetrics.mouseQueries++;

    // Get element detector
    const elementDetector = this.lifecycleManager.getComponent('elementDetector');
    if (!elementDetector) return;

    // Use element detection
    const under = elementDetector.deepElementFromPoint(x, y);
    let clickable = elementDetector.findClickable(under);
    
    // In text focus mode, exclude the currently focused text element
    if (currentState.mode === 'text_focus' && currentState.focusedTextElement && clickable === currentState.focusedTextElement) {
      clickable = null;
    }
    
    // Track with intersection manager for performance metrics
    const intersectionManager = this.lifecycleManager.getComponent('intersectionManager');
    if (intersectionManager) {
      intersectionManager.trackElementAtPoint(x, y);
    }

    // Debug logging
    if (window.KEYPILOT_DEBUG && clickable) {
      console.log('[KeyPilot Debug] Found clickable element:', {
        tagName: clickable.tagName,
        href: clickable.href,
        className: clickable.className,
        text: clickable.textContent?.substring(0, 50),
        mode: currentState.mode
      });
    }

    // Update focus element
    this.stateManager.setFocusElement(clickable);

    // Handle delete mode
    if (this.stateManager.isDeleteMode()) {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete mode - setting delete element:', {
          tagName: under?.tagName,
          className: under?.className,
          id: under?.id
        });
      }
      this.stateManager.setDeleteElement(under);
    } else {
      this.stateManager.setDeleteElement(null);
    }

    // Update text selection in highlight mode
    if (this.stateManager.isHighlightMode()) {
      this.updateSelection();
    }
  }

  /**
   * Update selection for highlight mode
   */
  updateSelection() {
    const highlightManager = this.lifecycleManager.getComponent('highlightManager');
    const currentState = this.stateManager.getState();
    
    if (highlightManager) {
      // Update the text selection with current mouse position
      highlightManager.updateSelectionWithPosition(currentState.lastMouse);
      
      // If we're in highlight mode and have an origin point, update the rectangle overlay
      if (this.stateManager.isHighlightMode() && currentState.lastMouse) {
        const modeManager = this.stateManager.getModeManager();
        const modeData = modeManager.getModeData();
        
        if (modeData && modeData.highlightStartPosition) {
          // Update the highlight rectangle overlay
          highlightManager.updateHighlightRectangleOverlay(
            modeData.highlightStartPosition,
            currentState.lastMouse
          );
        }
      }
    }
  }

  /**
   * Log performance metrics
   */
  logPerformanceMetrics() {
    if (!window.KEYPILOT_DEBUG) return;

    const now = Date.now();
    const timeSinceLastLog = now - this.performanceMetrics.lastMetricsLog;
    
    if (timeSinceLastLog >= 10000) { // Log every 10 seconds
      console.log('[KeyPilot Performance] Mouse Handler Metrics:', {
        mouseQueries: this.performanceMetrics.mouseQueries,
        cacheHits: this.performanceMetrics.cacheHits,
        queriesPerSecond: (this.performanceMetrics.mouseQueries / (timeSinceLastLog / 1000)).toFixed(2),
        cacheHitRatio: this.performanceMetrics.mouseQueries > 0 ? 
          (this.performanceMetrics.cacheHits / this.performanceMetrics.mouseQueries * 100).toFixed(1) + '%' : '0%'
      });
      
      this.performanceMetrics.lastMetricsLog = now;
    }
  }

  /**
   * Enable mouse handling
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable mouse handling
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Get performance metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.performanceMetrics };
  }

  /**
   * Reset performance metrics
   */
  resetMetrics() {
    this.performanceMetrics = {
      mouseQueries: 0,
      cacheHits: 0,
      lastMetricsLog: Date.now()
    };
  }
}
