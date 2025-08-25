/**
 * Intersection Observer-based performance optimization manager
 * Tracks element visibility and reduces expensive DOM queries
 */
export class IntersectionObserverManager {
  constructor(elementDetector) {
    this.elementDetector = elementDetector;
    
    // Observer for tracking interactive elements in viewport
    this.interactiveObserver = null;
    
    // Observer for tracking overlay visibility
    this.overlayObserver = null;
    
    // Cache of interactive elements currently in viewport
    this.visibleInteractiveElements = new Set();
    
    // Cache of element positions for quick lookups
    this.elementPositionCache = new Map();
    
    // Debounced cache update
    this.cacheUpdateTimeout = null;
    
    // Performance metrics
    this.metrics = {
      cacheHits: 0,
      cacheMisses: 0,
      observerUpdates: 0
    };
  }

  init() {
    this.setupInteractiveElementObserver();
    this.setupOverlayObserver();
    this.startPeriodicCacheUpdate();
  }

  setupInteractiveElementObserver() {
    // Observer for interactive elements with expanded root margin for preloading
    this.interactiveObserver = new IntersectionObserver(
      (entries) => {
        this.metrics.observerUpdates++;
        
        entries.forEach(entry => {
          const element = entry.target;
          
          if (entry.isIntersecting) {
            this.visibleInteractiveElements.add(element);
            this.updateElementPositionCache(element, entry.boundingClientRect);
          } else {
            this.visibleInteractiveElements.delete(element);
            this.elementPositionCache.delete(element);
          }
        });
      },
      {
        // Expanded margins to preload elements before they're visible
        rootMargin: '100px',
        // Multiple thresholds for better granularity
        threshold: [0, 0.1, 0.5, 1.0]
      }
    );
  }

  setupOverlayObserver() {
    // Observer specifically for overlay elements to optimize repositioning
    this.overlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const overlay = entry.target;
          
          // Hide overlays that are completely out of view to save rendering
          if (entry.intersectionRatio === 0) {
            overlay.style.visibility = 'hidden';
          } else {
            overlay.style.visibility = 'visible';
          }
        });
      },
      {
        rootMargin: '50px',
        threshold: [0, 1.0]
      }
    );
  }

  startPeriodicCacheUpdate() {
    // Periodically refresh the cache of interactive elements
    this.discoverInteractiveElements();
    
    // Set up periodic updates every 2 seconds
    setInterval(() => {
      this.discoverInteractiveElements();
    }, 2000);
  }

  discoverInteractiveElements() {
    // Find all interactive elements in the document
    const interactiveElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"], [onclick], [tabindex]:not([tabindex="-1"])'
    );

    // Observe new elements
    interactiveElements.forEach(element => {
      if (!this.isElementObserved(element)) {
        this.interactiveObserver.observe(element);
      }
    });

    // Clean up observers for removed elements
    this.cleanupRemovedElements();
  }

  isElementObserved(element) {
    // Check if element is already being observed
    return this.visibleInteractiveElements.has(element) || 
           this.elementPositionCache.has(element);
  }

  cleanupRemovedElements() {
    // Remove elements that are no longer in the DOM
    for (const element of this.visibleInteractiveElements) {
      if (!document.contains(element)) {
        this.visibleInteractiveElements.delete(element);
        this.elementPositionCache.delete(element);
        this.interactiveObserver.unobserve(element);
      }
    }
  }

  updateElementPositionCache(element, rect) {
    this.elementPositionCache.set(element, {
      left: rect.left,
      top: rect.top,
      right: rect.right,
      bottom: rect.bottom,
      width: rect.width,
      height: rect.height,
      timestamp: Date.now()
    });
  }

  // Optimized element detection using cached visible elements
  findInteractiveElementAtPoint(x, y) {
    // First, try to find element in our visible cache
    for (const element of this.visibleInteractiveElements) {
      const cachedRect = this.elementPositionCache.get(element);
      
      if (cachedRect && this.isPointInRect(x, y, cachedRect)) {
        // Verify the element is still at this position (cache validation)
        const currentRect = element.getBoundingClientRect();
        
        if (this.rectsAreClose(cachedRect, currentRect)) {
          this.metrics.cacheHits++;
          return element;
        } else {
          // Update cache with new position
          this.updateElementPositionCache(element, currentRect);
          
          if (this.isPointInRect(x, y, currentRect)) {
            this.metrics.cacheHits++;
            return element;
          }
        }
      }
    }

    // Cache miss - fall back to DOM query
    this.metrics.cacheMisses++;
    const element = this.elementDetector.deepElementFromPoint(x, y);
    const clickable = this.elementDetector.findClickable(element);
    
    // Add to cache if it's interactive and visible
    if (clickable && this.isElementVisible(clickable)) {
      this.visibleInteractiveElements.add(clickable);
      this.interactiveObserver.observe(clickable);
      this.updateElementPositionCache(clickable, clickable.getBoundingClientRect());
    }
    
    return clickable;
  }

  isPointInRect(x, y, rect) {
    return x >= rect.left && 
           x <= rect.right && 
           y >= rect.top && 
           y <= rect.bottom;
  }

  rectsAreClose(rect1, rect2, tolerance = 5) {
    return Math.abs(rect1.left - rect2.left) <= tolerance &&
           Math.abs(rect1.top - rect2.top) <= tolerance &&
           Math.abs(rect1.width - rect2.width) <= tolerance &&
           Math.abs(rect1.height - rect2.height) <= tolerance;
  }

  isElementVisible(element) {
    const rect = element.getBoundingClientRect();
    return rect.width > 0 && 
           rect.height > 0 && 
           rect.bottom > 0 && 
           rect.right > 0 && 
           rect.top < window.innerHeight && 
           rect.left < window.innerWidth;
  }

  // Observe overlay elements for visibility optimization
  observeOverlay(overlayElement) {
    if (this.overlayObserver && overlayElement) {
      this.overlayObserver.observe(overlayElement);
    }
  }

  unobserveOverlay(overlayElement) {
    if (this.overlayObserver && overlayElement) {
      this.overlayObserver.unobserve(overlayElement);
    }
  }

  // Get performance metrics
  getMetrics() {
    const totalQueries = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalQueries > 0 ? (this.metrics.cacheHits / totalQueries * 100).toFixed(1) : 0;
    
    return {
      ...this.metrics,
      cacheHitRate: `${cacheHitRate}%`,
      visibleElements: this.visibleInteractiveElements.size,
      cachedPositions: this.elementPositionCache.size
    };
  }

  // Cleanup method
  cleanup() {
    if (this.interactiveObserver) {
      this.interactiveObserver.disconnect();
      this.interactiveObserver = null;
    }
    
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }
    
    if (this.cacheUpdateTimeout) {
      clearTimeout(this.cacheUpdateTimeout);
      this.cacheUpdateTimeout = null;
    }
    
    this.visibleInteractiveElements.clear();
    this.elementPositionCache.clear();
  }
}