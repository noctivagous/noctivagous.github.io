/**
 * Optimized scroll management using Intersection Observer
 * Reduces expensive operations during scroll events
 */
export class OptimizedScrollManager {
  constructor(overlayManager, stateManager) {
    this.overlayManager = overlayManager;
    this.stateManager = stateManager;
    
    // Scroll state tracking
    this.isScrolling = false;
    this.scrollTimeout = null;
    this.scrollStartTime = 0;
    
    // Intersection observer for scroll-sensitive elements
    this.scrollObserver = null;
    
    // Elements that need position updates during scroll
    this.scrollSensitiveElements = new Set();
    
    // Throttled scroll handler
    this.throttledScrollHandler = this.throttle(this.handleScrollThrottled.bind(this), 16); // ~60fps
    
    // Performance tracking
    this.scrollMetrics = {
      scrollEvents: 0,
      overlayUpdates: 0,
      throttledCalls: 0,
      averageScrollDuration: 0
    };
  }

  init() {
    this.setupScrollObserver();
    this.setupScrollListeners();
  }

  setupScrollObserver() {
    // Observer to track when elements move in/out of view during scroll
    this.scrollObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const element = entry.target;
          
          if (entry.isIntersecting) {
            // Element is visible, may need overlay updates
            this.scrollSensitiveElements.add(element);
          } else {
            // Element is out of view, can skip overlay updates
            this.scrollSensitiveElements.delete(element);
            
            // Hide any overlays for out-of-view elements
            this.hideOverlaysForElement(element);
          }
        });
      },
      {
        rootMargin: '20px', // Small margin to catch elements just entering/leaving
        threshold: [0, 1.0]
      }
    );
  }

  setupScrollListeners() {
    // Use passive listener for better performance
    document.addEventListener('scroll', this.handleScroll.bind(this), { 
      passive: true,
      capture: true 
    });
    
    // Also listen for wheel events to predict scroll direction
    document.addEventListener('wheel', this.handleWheel.bind(this), { 
      passive: true 
    });
  }

  handleScroll(event) {
    this.scrollMetrics.scrollEvents++;
    
    // Mark scroll start
    if (!this.isScrolling) {
      this.isScrolling = true;
      this.scrollStartTime = performance.now();
    }

    // Use throttled handler for performance
    this.throttledScrollHandler(event);

    // Clear existing timeout and set new one
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
    }

    // Detect scroll end
    this.scrollTimeout = setTimeout(() => {
      this.handleScrollEnd();
    }, 100);
  }

  handleScrollThrottled(event) {
    this.scrollMetrics.throttledCalls++;
    
    const currentState = this.stateManager.getState();
    
    // Only update overlays for elements that are still visible
    if (currentState.focusEl && this.scrollSensitiveElements.has(currentState.focusEl)) {
      this.updateOverlayPosition(currentState.focusEl, 'focus');
    }
    
    if (currentState.deleteEl && this.scrollSensitiveElements.has(currentState.deleteEl)) {
      this.updateOverlayPosition(currentState.deleteEl, 'delete');
    }
    
    this.scrollMetrics.overlayUpdates++;
  }

  handleWheel(event) {
    // Predict scroll direction and prepare for smooth updates
    const direction = event.deltaY > 0 ? 'down' : 'up';
    
    // Pre-emptively update overlay positions based on predicted scroll
    this.prepareForScroll(direction);
  }

  prepareForScroll(direction) {
    // Pre-calculate positions for smooth scrolling
    const currentState = this.stateManager.getState();
    
    if (currentState.focusEl) {
      this.observeElementForScroll(currentState.focusEl);
    }
    
    if (currentState.deleteEl) {
      this.observeElementForScroll(currentState.deleteEl);
    }
  }

  observeElementForScroll(element) {
    if (element && this.scrollObserver) {
      this.scrollObserver.observe(element);
      this.scrollSensitiveElements.add(element);
    }
  }

  unobserveElementForScroll(element) {
    if (element && this.scrollObserver) {
      this.scrollObserver.unobserve(element);
      this.scrollSensitiveElements.delete(element);
    }
  }

  updateOverlayPosition(element, type) {
    if (!element) return;
    
    // Use requestAnimationFrame for smooth overlay updates
    requestAnimationFrame(() => {
      if (type === 'focus') {
        this.overlayManager.updateFocusOverlay(element);
      } else if (type === 'delete') {
        this.overlayManager.updateDeleteOverlay(element);
      }
    });
  }

  hideOverlaysForElement(element) {
    const currentState = this.stateManager.getState();
    
    // Hide overlays if they're for elements that are out of view
    if (currentState.focusEl === element) {
      this.overlayManager.hideFocusOverlay();
    }
    
    if (currentState.deleteEl === element) {
      this.overlayManager.hideDeleteOverlay();
    }
  }

  handleScrollEnd() {
    const scrollDuration = performance.now() - this.scrollStartTime;
    
    // Update average scroll duration
    this.scrollMetrics.averageScrollDuration = 
      (this.scrollMetrics.averageScrollDuration + scrollDuration) / 2;
    
    this.isScrolling = false;
    
    // Force a complete overlay update after scroll ends
    const currentState = this.stateManager.getState();
    
    // Re-query elements at current mouse position for accuracy
    if (currentState.lastMouse.x >= 0 && currentState.lastMouse.y >= 0) {
      // Dispatch a custom event to trigger element re-query
      document.dispatchEvent(new CustomEvent('keypilot:scroll-end', {
        detail: {
          mouseX: currentState.lastMouse.x,
          mouseY: currentState.lastMouse.y
        }
      }));
    }
    
    // Clean up observers for elements that are no longer relevant
    this.cleanupScrollObservers();
  }

  cleanupScrollObservers() {
    // Remove observers for elements that are no longer in the DOM
    for (const element of this.scrollSensitiveElements) {
      if (!document.contains(element)) {
        this.unobserveElementForScroll(element);
      }
    }
  }

  // Throttle utility function
  throttle(func, limit) {
    let inThrottle;
    return function(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  }

  // Get scroll performance metrics
  getScrollMetrics() {
    const throttleRatio = this.scrollMetrics.scrollEvents > 0 ? 
      (this.scrollMetrics.throttledCalls / this.scrollMetrics.scrollEvents * 100).toFixed(1) : 0;
    
    return {
      ...this.scrollMetrics,
      throttleRatio: `${throttleRatio}%`,
      activeSensitiveElements: this.scrollSensitiveElements.size,
      isCurrentlyScrolling: this.isScrolling
    };
  }

  // Cleanup method
  cleanup() {
    if (this.scrollObserver) {
      this.scrollObserver.disconnect();
      this.scrollObserver = null;
    }
    
    if (this.scrollTimeout) {
      clearTimeout(this.scrollTimeout);
      this.scrollTimeout = null;
    }
    
    this.scrollSensitiveElements.clear();
    
    // Remove event listeners
    document.removeEventListener('scroll', this.handleScroll.bind(this));
    document.removeEventListener('wheel', this.handleWheel.bind(this));
  }
}