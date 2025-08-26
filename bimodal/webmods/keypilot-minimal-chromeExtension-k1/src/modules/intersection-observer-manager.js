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

    // Only start periodic updates after observers are set up
    if (this.interactiveObserver && this.overlayObserver) {
      this.startPeriodicCacheUpdate();
    }
  }

  setupInteractiveElementObserver() {
    console.log('[KeyPilot Debug] Setting up interactiveObserver');
    try {
      // Observer for interactive elements with expanded root margin for preloading
      this.interactiveObserver = new IntersectionObserver(
        (entries) => {
          this.metrics.observerUpdates++;

          entries.forEach(entry => {
            const element = entry.target;

            if (entry.isIntersecting) {
              this.visibleInteractiveElements.add(element);
              this.updateElementPositionCache(element, element.getBoundingClientRect());
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
      console.log('[KeyPilot Debug] interactiveObserver created successfully');
    } catch (error) {
      console.warn('[KeyPilot Debug] Failed to create IntersectionObserver for interactive elements:', error);
      this.interactiveObserver = null;
    }
  }

  setupOverlayObserver() {
    try {
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
    } catch (error) {
      console.warn('[KeyPilot] Failed to create IntersectionObserver for overlays:', error);
      this.overlayObserver = null;
    }
  }

  startPeriodicCacheUpdate() {
    console.log('[KeyPilot Debug] Starting periodic cache update');
    // Periodically refresh the cache of interactive elements
    this.discoverInteractiveElements();

    // Set up periodic updates every 2 seconds
    this.cacheUpdateInterval = setInterval(() => {
      console.log('[KeyPilot Debug] Periodic cache update triggered');
      this.discoverInteractiveElements();
    }, 2000);
    console.log('[KeyPilot Debug] Periodic cache update interval set:', this.cacheUpdateInterval);
  }

  discoverInteractiveElements() {
    // Skip if observer is not initialized
    if (!this.interactiveObserver) {
  //    console.log('[KeyPilot Debug] discoverInteractiveElements: interactiveObserver is null, skipping');
      return;
    }

    // Find all interactive elements in the document
    const interactiveElements = document.querySelectorAll(
      'a[href], button, input, select, textarea, [role="button"], [role="link"], [contenteditable="true"], [onclick], [tabindex]:not([tabindex="-1"])'
    );

//    console.log(`[KeyPilot Debug] discoverInteractiveElements: Found ${interactiveElements.length} elements, observer exists: ${!!this.interactiveObserver}`);

    // Observe new elements
    interactiveElements.forEach((element, index) => {
      if (!this.isElementObserved(element)) {
        // Double-check observer exists right before calling observe
        if (!this.interactiveObserver) {
          console.error(`[KeyPilot Debug] Observer became null during forEach loop at index ${index}/${interactiveElements.length}`);
          return;
        }
        if (!this.interactiveObserver.observe) {
          console.error(`[KeyPilot Debug] Observer exists but observe method is missing at index ${index}`, this.interactiveObserver);
          return;
        }
        try {
          this.interactiveObserver.observe(element);
        } catch (error) {
          console.error(`[KeyPilot Debug] Error calling observe on element ${index}:`, error, 'Observer state:', !!this.interactiveObserver);
        }
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
    // Skip if observer is not initialized
    if (!this.interactiveObserver) {
      return;
    }

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

  // Track element for performance metrics and caching
  trackElementAtPoint(x, y) {
    // This method is called to track elements for performance optimization
    // It doesn't replace the main element detection, just optimizes it

    const element = this.elementDetector.deepElementFromPoint(x, y);
    const clickable = this.elementDetector.findClickable(element);

    // Check if we found this element in our cache (for metrics)
    if (clickable && this.visibleInteractiveElements.has(clickable)) {
      this.metrics.cacheHits++;
    } else {
      this.metrics.cacheMisses++;
    }

    // Add to cache if it's interactive and visible but not already cached
    if (clickable && this.interactiveObserver && this.isElementVisible(clickable) && !this.visibleInteractiveElements.has(clickable)) {
      this.visibleInteractiveElements.add(clickable);

      // Double-check observer exists right before calling observe
      if (!this.interactiveObserver) {
        console.error('[KeyPilot Debug] trackElementAtPoint: Observer became null before observe call');
        return clickable;
      }

      try {
        this.interactiveObserver.observe(clickable);
        this.updateElementPositionCache(clickable, clickable.getBoundingClientRect());
      } catch (error) {
        console.error('[KeyPilot Debug] trackElementAtPoint: Error calling observe:', error, 'Observer state:', !!this.interactiveObserver);
      }
    }

    return clickable;
  }

  // Legacy method name for compatibility
  findInteractiveElementAtPoint(x, y) {
    return this.trackElementAtPoint(x, y);
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
    console.log('[KeyPilot Debug] cleanup() called, clearing observers and intervals');

    if (this.interactiveObserver) {
      console.log('[KeyPilot Debug] Disconnecting interactiveObserver');
      this.interactiveObserver.disconnect();
      this.interactiveObserver = null;
    }

    if (this.overlayObserver) {
      console.log('[KeyPilot Debug] Disconnecting overlayObserver');
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }

    if (this.cacheUpdateTimeout) {
      console.log('[KeyPilot Debug] Clearing cacheUpdateTimeout');
      clearTimeout(this.cacheUpdateTimeout);
      this.cacheUpdateTimeout = null;
    }

    if (this.cacheUpdateInterval) {
      console.log('[KeyPilot Debug] Clearing cacheUpdateInterval');
      clearInterval(this.cacheUpdateInterval);
      this.cacheUpdateInterval = null;
    }

    this.visibleInteractiveElements.clear();
    this.elementPositionCache.clear();
  }
}