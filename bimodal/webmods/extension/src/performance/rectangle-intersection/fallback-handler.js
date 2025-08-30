/**
 * Fallback Handler for Rectangle Intersection Observer
 * Manages fallback to spatial method when edge-only processing fails
 */
import { EDGE_ONLY_SELECTION, FEATURE_FLAGS } from '../../config/index.js';

export class FallbackHandler {
  constructor() {
    this.enabled = EDGE_ONLY_SELECTION.FALLBACK_CONFIGURATION.ENABLED;
    this.fallbackActive = false;
    this.fallbackReason = null;
    
    // Fallback configuration
    this.config = EDGE_ONLY_SELECTION.FALLBACK_CONFIGURATION;
    
    // Failure tracking
    this.consecutiveFailures = 0;
    this.recoveryAttempts = 0;
    this.lastFallbackTime = 0;
    
    // Performance tracking for fallback decisions
    this.performanceHistory = [];
    this.fallbackCallbacks = new Set();
  }

  /**
   * Register callback for fallback events
   * @param {Function} callback
   */
  onFallback(callback) {
    this.fallbackCallbacks.add(callback);
  }

  /**
   * Unregister fallback callback
   * @param {Function} callback
   */
  offFallback(callback) {
    this.fallbackCallbacks.delete(callback);
  }

  /**
   * Check if fallback should be triggered based on performance
   * @param {Object} performanceData
   * @returns {boolean}
   */
  shouldTriggerFallback(performanceData) {
    if (!this.enabled || this.fallbackActive) return false;

    // Check processing time threshold
    if (performanceData.processingTime > this.config.FALLBACK_THRESHOLD_MS) {
      this.consecutiveFailures++;
      
      if (this.consecutiveFailures >= this.config.MAX_CONSECUTIVE_FAILURES) {
        return this.triggerFallback('processing_time_exceeded', performanceData);
      }
    } else {
      // Reset failure count on successful processing
      this.consecutiveFailures = 0;
    }

    // Check cache efficiency
    if (performanceData.cacheHitRatio < EDGE_ONLY_SELECTION.CACHE_HIT_RATIO_THRESHOLD) {
      return this.triggerFallback('cache_efficiency_low', performanceData);
    }

    // Check memory usage
    if (performanceData.memoryUsage > EDGE_ONLY_SELECTION.MAX_MEMORY_USAGE_MB * 0.9) {
      return this.triggerFallback('memory_usage_high', performanceData);
    }

    return false;
  }

  /**
   * Trigger fallback to spatial method
   * @param {string} reason
   * @param {Object} data
   * @returns {boolean}
   */
  triggerFallback(reason, data) {
    if (this.fallbackActive) return false;

    this.fallbackActive = true;
    this.fallbackReason = reason;
    this.lastFallbackTime = Date.now();

    if (window.KEYPILOT_DEBUG) {
      console.warn('[KeyPilot] Triggering fallback to spatial method:', {
        reason,
        data,
        consecutiveFailures: this.consecutiveFailures
      });
    }

    // Notify all registered callbacks
    this.fallbackCallbacks.forEach(callback => {
      try {
        callback({
          type: 'fallback_triggered',
          reason,
          data,
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('[KeyPilot] Error in fallback callback:', error);
      }
    });

    // Schedule recovery attempt if enabled
    if (this.config.FALLBACK_RECOVERY_ATTEMPTS > 0) {
      this.scheduleRecoveryAttempt();
    }

    return true;
  }

  /**
   * Schedule recovery attempt to edge-only processing
   */
  scheduleRecoveryAttempt() {
    if (this.recoveryAttempts >= this.config.FALLBACK_RECOVERY_ATTEMPTS) {
      return;
    }

    setTimeout(() => {
      this.attemptRecovery();
    }, this.config.FALLBACK_RECOVERY_DELAY);
  }

  /**
   * Attempt to recover from fallback
   */
  attemptRecovery() {
    if (!this.fallbackActive) return;

    this.recoveryAttempts++;

    if (window.KEYPILOT_DEBUG) {
      console.log(`[KeyPilot] Attempting recovery from fallback (attempt ${this.recoveryAttempts}/${this.config.FALLBACK_RECOVERY_ATTEMPTS})`);
    }

    // Check if conditions have improved
    if (this.canRecover()) {
      this.recoverFromFallback();
    } else if (this.recoveryAttempts < this.config.FALLBACK_RECOVERY_ATTEMPTS) {
      // Schedule next recovery attempt
      this.scheduleRecoveryAttempt();
    }
  }

  /**
   * Check if recovery conditions are met
   * @returns {boolean}
   */
  canRecover() {
    // Simple heuristic: check if enough time has passed and system seems stable
    const timeSinceFallback = Date.now() - this.lastFallbackTime;
    const minRecoveryTime = this.config.FALLBACK_RECOVERY_DELAY * 2;

    if (timeSinceFallback < minRecoveryTime) {
      return false;
    }

    // Check recent performance history
    const recentPerformance = this.performanceHistory.slice(-5);
    if (recentPerformance.length < 3) {
      return false;
    }

    // All recent measurements should be below threshold
    const allGood = recentPerformance.every(perf => 
      perf.processingTime < this.config.FALLBACK_THRESHOLD_MS * 0.8
    );

    return allGood;
  }

  /**
   * Recover from fallback to edge-only processing
   */
  recoverFromFallback() {
    this.fallbackActive = false;
    this.fallbackReason = null;
    this.consecutiveFailures = 0;
    this.recoveryAttempts = 0;

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot] Recovered from fallback, returning to edge-only processing');
    }

    // Notify callbacks of recovery
    this.fallbackCallbacks.forEach(callback => {
      try {
        callback({
          type: 'fallback_recovered',
          timestamp: Date.now()
        });
      } catch (error) {
        console.error('[KeyPilot] Error in recovery callback:', error);
      }
    });
  }

  /**
   * Force fallback (for testing or manual override)
   * @param {string} reason
   */
  forceFallback(reason = 'manual_override') {
    this.triggerFallback(reason, { forced: true });
  }

  /**
   * Force recovery (for testing or manual override)
   */
  forceRecovery() {
    if (this.fallbackActive) {
      this.recoverFromFallback();
    }
  }

  /**
   * Update performance history for fallback decisions
   * @param {Object} performanceData
   */
  updatePerformanceHistory(performanceData) {
    this.performanceHistory.push({
      ...performanceData,
      timestamp: Date.now()
    });

    // Keep only recent history
    const cutoff = Date.now() - (this.config.FALLBACK_RECOVERY_DELAY * 3);
    this.performanceHistory = this.performanceHistory.filter(
      entry => entry.timestamp > cutoff
    );
  }

  /**
   * Get spatial intersection method as fallback
   * @param {Object} rectangle
   * @returns {Array} Array of intersecting elements
   */
  getSpatialIntersection(rectangle) {
    const intersectingElements = [];
    
    // Use elementsFromPoint for spatial intersection
    const centerX = rectangle.left + rectangle.width / 2;
    const centerY = rectangle.top + rectangle.height / 2;
    
    // Sample multiple points within the rectangle
    const samplePoints = this.generateSamplePoints(rectangle);
    const elementSet = new Set();
    
    samplePoints.forEach(point => {
      const elements = document.elementsFromPoint(point.x, point.y);
      elements.forEach(element => {
        if (this.isTextElement(element)) {
          elementSet.add(element);
        }
      });
    });
    
    return Array.from(elementSet);
  }

  /**
   * Generate sample points within rectangle for spatial intersection
   * @param {Object} rectangle
   * @returns {Array}
   */
  generateSamplePoints(rectangle) {
    const points = [];
    const step = Math.max(10, Math.min(rectangle.width, rectangle.height) / 5);
    
    for (let x = rectangle.left; x < rectangle.left + rectangle.width; x += step) {
      for (let y = rectangle.top; y < rectangle.top + rectangle.height; y += step) {
        points.push({ x, y });
      }
    }
    
    // Always include corners and center
    points.push(
      { x: rectangle.left, y: rectangle.top },
      { x: rectangle.left + rectangle.width, y: rectangle.top },
      { x: rectangle.left, y: rectangle.top + rectangle.height },
      { x: rectangle.left + rectangle.width, y: rectangle.top + rectangle.height },
      { x: rectangle.left + rectangle.width / 2, y: rectangle.top + rectangle.height / 2 }
    );
    
    return points;
  }

  /**
   * Check if element is a text element
   * @param {Element} element
   * @returns {boolean}
   */
  isTextElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    
    const textTags = EDGE_ONLY_SELECTION.SMART_TARGETING.TEXT_ELEMENT_TAGS;
    const skipTags = EDGE_ONLY_SELECTION.SMART_TARGETING.SKIP_ELEMENT_TAGS;
    
    const tagName = element.tagName.toLowerCase();
    
    if (skipTags.includes(tagName)) return false;
    if (textTags.includes(tagName)) return true;
    
    // Check if element has text content
    return element.textContent && element.textContent.trim().length > 0;
  }

  /**
   * Get fallback status
   * @returns {Object}
   */
  getStatus() {
    return {
      active: this.fallbackActive,
      reason: this.fallbackReason,
      consecutiveFailures: this.consecutiveFailures,
      recoveryAttempts: this.recoveryAttempts,
      lastFallbackTime: this.lastFallbackTime,
      canRecover: this.canRecover()
    };
  }

  /**
   * Reset fallback state
   */
  reset() {
    this.fallbackActive = false;
    this.fallbackReason = null;
    this.consecutiveFailures = 0;
    this.recoveryAttempts = 0;
    this.lastFallbackTime = 0;
    this.performanceHistory = [];
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.reset();
    this.fallbackCallbacks.clear();
  }
}
