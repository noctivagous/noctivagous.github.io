/**
 * Cache Manager for Rectangle Intersection Observer
 * Handles caching strategies and optimization
 */
import { EDGE_ONLY_SELECTION } from '../../config/index.js';

export class CacheManager {
  constructor() {
    // Element cache for intersection results
    this.elementCache = new Map();
    this.characterCache = new WeakMap();
    
    // Cache configuration
    this.config = EDGE_ONLY_SELECTION.CACHE_CONFIGURATION;
    
    // Cache metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
    
    // Predictive caching
    this.predictiveCache = new Map();
    this.userBehaviorPatterns = [];
    
    // Cleanup timer
    this.cleanupTimer = null;
    this.setupCleanupTimer();
  }

  /**
   * Get cached element data
   * @param {Element} element
   * @returns {Object|null}
   */
  getElementCache(element) {
    this.metrics.totalRequests++;
    
    const cached = this.elementCache.get(element);
    if (cached && this.isCacheValid(cached)) {
      this.metrics.hits++;
      cached.lastAccessed = Date.now();
      return cached.data;
    }
    
    this.metrics.misses++;
    return null;
  }

  /**
   * Set element cache data
   * @param {Element} element
   * @param {Object} data
   */
  setElementCache(element, data) {
    // Check if cache needs cleanup
    if (this.elementCache.size >= this.config.CACHE_CLEANUP_THRESHOLD) {
      this.performCacheCleanup();
    }

    this.elementCache.set(element, {
      data,
      timestamp: Date.now(),
      lastAccessed: Date.now()
    });
  }

  /**
   * Get cached character positions
   * @param {Element} element
   * @returns {Array|null}
   */
  getCharacterCache(element) {
    return this.characterCache.get(element) || null;
  }

  /**
   * Set character position cache
   * @param {Element} element
   * @param {Array} positions
   */
  setCharacterCache(element, positions) {
    // Limit character cache size per element
    if (positions.length > this.config.CHARACTER_CACHE_SIZE) {
      positions = positions.slice(0, this.config.CHARACTER_CACHE_SIZE);
    }
    
    this.characterCache.set(element, {
      positions,
      timestamp: Date.now()
    });
  }

  /**
   * Check if cache entry is valid
   * @param {Object} cacheEntry
   * @returns {boolean}
   */
  isCacheValid(cacheEntry) {
    const age = Date.now() - cacheEntry.timestamp;
    return age < this.config.CACHE_TTL_MS;
  }

  /**
   * Perform cache cleanup
   */
  performCacheCleanup() {
    const entries = Array.from(this.elementCache.entries());
    
    // Sort by last accessed time (oldest first)
    entries.sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
    
    // Remove oldest entries
    const toRemove = Math.min(
      this.config.CACHE_CLEANUP_BATCH_SIZE,
      entries.length - this.config.ELEMENT_CACHE_SIZE
    );
    
    for (let i = 0; i < toRemove; i++) {
      this.elementCache.delete(entries[i][0]);
      this.metrics.evictions++;
    }
  }

  /**
   * Predictive caching based on user behavior
   * @param {Object} userAction
   */
  updateUserBehavior(userAction) {
    if (!this.config.ENABLE_PREDICTIVE_CACHING) return;

    this.userBehaviorPatterns.push({
      ...userAction,
      timestamp: Date.now()
    });

    // Keep only recent patterns
    const cutoff = Date.now() - EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.INTERACTION_TIMEOUT_MS;
    this.userBehaviorPatterns = this.userBehaviorPatterns.filter(
      pattern => pattern.timestamp > cutoff
    );

    // Analyze patterns and pre-cache likely targets
    this.analyzeBehaviorPatterns();
  }

  /**
   * Analyze user behavior patterns for predictive caching
   */
  analyzeBehaviorPatterns() {
    if (this.userBehaviorPatterns.length < 3) return;

    const recentPatterns = this.userBehaviorPatterns.slice(-5);
    const predictiveConfig = EDGE_ONLY_SELECTION.PREDICTIVE_CACHING;

    // Simple pattern detection: look for directional movement
    const movements = recentPatterns.map((pattern, index) => {
      if (index === 0) return null;
      const prev = recentPatterns[index - 1];
      return {
        dx: pattern.x - prev.x,
        dy: pattern.y - prev.y,
        dt: pattern.timestamp - prev.timestamp
      };
    }).filter(Boolean);

    if (movements.length >= 2) {
      // Calculate average velocity
      const avgVelocity = {
        x: movements.reduce((sum, m) => sum + m.dx / m.dt, 0) / movements.length,
        y: movements.reduce((sum, m) => sum + m.dy / m.dt, 0) / movements.length
      };

      // Predict next position
      const lastPattern = recentPatterns[recentPatterns.length - 1];
      const predictedPosition = {
        x: lastPattern.x + avgVelocity.x * predictiveConfig.CACHE_WARMING_DISTANCE,
        y: lastPattern.y + avgVelocity.y * predictiveConfig.CACHE_WARMING_DISTANCE
      };

      this.preCacheElementsNear(predictedPosition);
    }
  }

  /**
   * Pre-cache elements near predicted position
   * @param {Object} position - {x, y}
   */
  preCacheElementsNear(position) {
    const elements = document.elementsFromPoint(position.x, position.y);
    const predictiveConfig = EDGE_ONLY_SELECTION.PREDICTIVE_CACHING;

    elements.slice(0, predictiveConfig.PRELOAD_BATCH_SIZE).forEach(element => {
      if (!this.elementCache.has(element)) {
        // Pre-cache basic element data
        this.predictiveCache.set(element, {
          position,
          confidence: 0.7,
          timestamp: Date.now()
        });
      }
    });
  }

  /**
   * Setup cleanup timer
   */
  setupCleanupTimer() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
    }

    this.cleanupTimer = setInterval(() => {
      this.performCacheCleanup();
      this.cleanupPredictiveCache();
    }, this.config.CACHE_TTL_MS / 2);
  }

  /**
   * Cleanup predictive cache
   */
  cleanupPredictiveCache() {
    const cutoff = Date.now() - this.config.CACHE_TTL_MS;
    
    for (const [element, data] of this.predictiveCache.entries()) {
      if (data.timestamp < cutoff) {
        this.predictiveCache.delete(element);
      }
    }
  }

  /**
   * Get cache metrics
   * @returns {Object}
   */
  getMetrics() {
    const hitRatio = this.metrics.totalRequests > 0 ? 
      this.metrics.hits / this.metrics.totalRequests : 0;

    return {
      ...this.metrics,
      hitRatio,
      cacheSize: this.elementCache.size,
      predictiveCacheSize: this.predictiveCache.size
    };
  }

  /**
   * Clear all caches
   */
  clearAll() {
    this.elementCache.clear();
    this.characterCache = new WeakMap();
    this.predictiveCache.clear();
    this.userBehaviorPatterns = [];
    
    // Reset metrics
    this.metrics = {
      hits: 0,
      misses: 0,
      evictions: 0,
      totalRequests: 0
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
    
    this.clearAll();
  }
}
