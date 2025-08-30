/**
 * Refactored Rectangle Intersection Observer
 * Main coordinator that uses focused components
 */
import { FEATURE_FLAGS } from '../../config/index.js';
import { RectangleObserver } from './rectangle-observer.js';
import { CacheManager } from './cache-manager.js';
import { PerformanceTracker } from './performance-tracker.js';
import { FallbackHandler } from './fallback-handler.js';

export class RectangleIntersectionObserver {
  constructor() {
    // Core components
    this.rectangleObserver = new RectangleObserver();
    this.cacheManager = new CacheManager();
    this.performanceTracker = new PerformanceTracker();
    this.fallbackHandler = new FallbackHandler();
    
    // Enhanced integration flag
    this.enhancedIntegrationEnabled = FEATURE_FLAGS.ENABLE_ENHANCED_RECTANGLE_OBSERVER;
    
    // Current state
    this.isInitialized = false;
    this.currentRectangle = null;
    
    // Setup fallback handling
    this.setupFallbackHandling();
  }

  /**
   * Initialize the rectangle intersection observer
   * @param {Function} callback - Called when intersection changes
   */
  initialize(callback) {
    if (this.isInitialized) return;

    // Initialize core observer
    this.rectangleObserver.initialize((intersectionData) => {
      this.handleIntersectionChange(intersectionData, callback);
    });

    // Start performance monitoring
    this.performanceTracker.startMonitoring();

    this.isInitialized = true;
  }

  /**
   * Setup fallback handling
   */
  setupFallbackHandling() {
    this.fallbackHandler.onFallback((event) => {
      if (event.type === 'fallback_triggered') {
        console.warn('[KeyPilot] Fallback triggered:', event.reason);
        // Could emit event to notify main application
      } else if (event.type === 'fallback_recovered') {
        console.log('[KeyPilot] Recovered from fallback');
      }
    });
  }

  /**
   * Handle intersection changes with performance tracking
   * @param {Object} intersectionData
   * @param {Function} callback
   */
  handleIntersectionChange(intersectionData, callback) {
    const startTime = performance.now();

    try {
      // Check cache first
      const cacheKey = this.generateCacheKey(intersectionData);
      let processedData = this.cacheManager.getElementCache(cacheKey);

      if (!processedData) {
        // Process intersection data
        processedData = this.processIntersectionData(intersectionData);
        
        // Cache the result
        this.cacheManager.setElementCache(cacheKey, processedData);
      }

      // Record performance metrics
      const endTime = performance.now();
      this.performanceTracker.recordIntersectionUpdate(startTime, endTime, {
        elementsProcessed: intersectionData.intersectingElements.length,
        textNodesFound: intersectionData.intersectingTextNodes.length
      });

      // Update cache metrics
      this.performanceTracker.updateCacheMetrics(this.cacheManager.getMetrics());

      // Check if fallback should be triggered
      const performanceData = {
        processingTime: endTime - startTime,
        cacheHitRatio: this.cacheManager.getMetrics().hitRatio,
        memoryUsage: this.estimateMemoryUsage()
      };

      if (this.fallbackHandler.shouldTriggerFallback(performanceData)) {
        // Use spatial fallback method
        processedData = this.useSpatialFallback(this.currentRectangle);
      }

      // Update performance history
      this.fallbackHandler.updatePerformanceHistory(performanceData);

      // Call the original callback
      if (callback) {
        callback(processedData);
      }

    } catch (error) {
      console.error('[KeyPilot] Error in intersection handling:', error);
      
      // Trigger fallback on error
      this.fallbackHandler.triggerFallback('processing_error', { error: error.message });
    }
  }

  /**
   * Process intersection data
   * @param {Object} intersectionData
   * @returns {Object}
   */
  processIntersectionData(intersectionData) {
    // Enhanced processing when enabled
    if (this.enhancedIntegrationEnabled) {
      return this.enhancedProcessing(intersectionData);
    }

    // Basic processing
    return {
      intersectingElements: intersectionData.intersectingElements,
      intersectingTextNodes: intersectionData.intersectingTextNodes,
      edgeProcessing: false
    };
  }

  /**
   * Enhanced processing with smart targeting and character detection
   * @param {Object} intersectionData
   * @returns {Object}
   */
  enhancedProcessing(intersectionData) {
    // This would integrate with TextElementFilter and EdgeCharacterDetector
    // For now, return basic processing with enhanced flag
    return {
      intersectingElements: intersectionData.intersectingElements,
      intersectingTextNodes: intersectionData.intersectingTextNodes,
      edgeProcessing: true,
      smartTargeting: true,
      characterDetection: true
    };
  }

  /**
   * Use spatial fallback method
   * @param {Object} rectangle
   * @returns {Object}
   */
  useSpatialFallback(rectangle) {
    if (!rectangle) return { intersectingElements: [], intersectingTextNodes: [] };

    const spatialElements = this.fallbackHandler.getSpatialIntersection(rectangle);
    
    return {
      intersectingElements: spatialElements,
      intersectingTextNodes: this.extractTextNodes(spatialElements),
      fallbackMethod: 'spatial',
      edgeProcessing: false
    };
  }

  /**
   * Extract text nodes from elements
   * @param {Array} elements
   * @returns {Array}
   */
  extractTextNodes(elements) {
    const textNodes = [];
    
    elements.forEach(element => {
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            return node.textContent.trim().length > 0 ? 
              NodeFilter.FILTER_ACCEPT : 
              NodeFilter.FILTER_REJECT;
          }
        }
      );

      let textNode;
      while (textNode = walker.nextNode()) {
        textNodes.push(textNode);
      }
    });

    return textNodes;
  }

  /**
   * Generate cache key for intersection data
   * @param {Object} intersectionData
   * @returns {string}
   */
  generateCacheKey(intersectionData) {
    const elementIds = intersectionData.intersectingElements
      .map(el => el.tagName + (el.id || el.className || ''))
      .sort()
      .join('|');
    
    return `intersection_${elementIds}_${intersectionData.intersectingTextNodes.length}`;
  }

  /**
   * Estimate current memory usage
   * @returns {number}
   */
  estimateMemoryUsage() {
    // Rough estimate based on cache sizes
    const cacheMetrics = this.cacheManager.getMetrics();
    const estimatedMB = (cacheMetrics.cacheSize * 0.001) + (cacheMetrics.predictiveCacheSize * 0.0005);
    return estimatedMB;
  }

  /**
   * Update rectangle bounds
   * @param {Object} rectangle - {left, top, width, height}
   */
  updateRectangle(rectangle) {
    this.currentRectangle = rectangle;
    this.rectangleObserver.updateRectangle(rectangle);
    
    // Update user behavior for predictive caching
    this.cacheManager.updateUserBehavior({
      x: rectangle.left + rectangle.width / 2,
      y: rectangle.top + rectangle.height / 2,
      action: 'rectangle_update'
    });
  }

  /**
   * Observe an element
   * @param {Element} element
   */
  observeElement(element) {
    this.rectangleObserver.observeElement(element);
  }

  /**
   * Unobserve an element
   * @param {Element} element
   */
  unobserveElement(element) {
    this.rectangleObserver.unobserveElement(element);
  }

  /**
   * Create selection from current intersection
   * @returns {Selection|null}
   */
  createSelectionFromIntersection() {
    const intersectionData = this.rectangleObserver.getIntersectionData();
    
    if (intersectionData.intersectingTextNodes.length === 0) {
      return null;
    }

    try {
      const selection = window.getSelection();
      selection.removeAllRanges();

      // Create range from first to last text node
      const range = document.createRange();
      const firstNode = intersectionData.intersectingTextNodes[0];
      const lastNode = intersectionData.intersectingTextNodes[intersectionData.intersectingTextNodes.length - 1];

      range.setStart(firstNode, 0);
      range.setEnd(lastNode, lastNode.textContent.length);

      selection.addRange(range);
      return selection;

    } catch (error) {
      console.error('[KeyPilot] Error creating selection:', error);
      return null;
    }
  }

  /**
   * Get performance metrics
   * @returns {Object}
   */
  getMetrics() {
    return {
      ...this.performanceTracker.getMetrics(),
      cache: this.cacheManager.getMetrics(),
      fallback: this.fallbackHandler.getStatus()
    };
  }

  /**
   * Get performance report
   * @returns {Object}
   */
  getPerformanceReport() {
    return this.performanceTracker.getPerformanceReport();
  }

  /**
   * Cleanup and destroy
   */
  cleanup() {
    this.rectangleObserver.cleanup();
    this.cacheManager.destroy();
    this.performanceTracker.destroy();
    this.fallbackHandler.destroy();
    
    this.isInitialized = false;
    this.currentRectangle = null;
  }
}
