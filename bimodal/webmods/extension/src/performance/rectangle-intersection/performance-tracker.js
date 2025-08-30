/**
 * Performance Tracker for Rectangle Intersection Observer
 * Monitors and tracks performance metrics
 */
import { PERFORMANCE_MONITORING, EDGE_ONLY_SELECTION } from '../../config/index.js';

export class PerformanceTracker {
  constructor() {
    this.enabled = PERFORMANCE_MONITORING.ENABLED;
    
    // Performance metrics
    this.metrics = {
      intersectionUpdates: 0,
      elementsObserved: 0,
      intersectingElements: 0,
      intersectingTextNodes: 0,
      edgeProcessingTime: 0,
      totalProcessingTime: 0,
      cacheHitRatio: 0,
      performanceGain: 0,
      efficiencyGainPercent: 0,
      elementsEntering: 0,
      elementsLeaving: 0,
      avgEdgeProcessingTime: '0ms'
    };

    // Timing data
    this.timingData = [];
    this.frameRateData = [];
    
    // Performance thresholds
    this.thresholds = {
      maxProcessingTime: EDGE_ONLY_SELECTION.MAX_PROCESSING_TIME_MS,
      fallbackThreshold: EDGE_ONLY_SELECTION.FALLBACK_THRESHOLD_MS,
      targetFps: EDGE_ONLY_SELECTION.FRAME_RATE_TARGET
    };

    // Monitoring state
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.lastReportTime = Date.now();
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (!this.enabled || this.isMonitoring) return;

    this.isMonitoring = true;
    this.setupMonitoringInterval();
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) return;

    this.isMonitoring = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
  }

  /**
   * Setup monitoring interval
   */
  setupMonitoringInterval() {
    this.monitoringInterval = setInterval(() => {
      this.updateMetrics();
      this.checkPerformanceThresholds();
    }, PERFORMANCE_MONITORING.PERFORMANCE_REPORT_INTERVAL);
  }

  /**
   * Record intersection update timing
   * @param {number} startTime
   * @param {number} endTime
   * @param {Object} data - Intersection data
   */
  recordIntersectionUpdate(startTime, endTime, data) {
    if (!this.enabled) return;

    const processingTime = endTime - startTime;
    
    this.timingData.push({
      timestamp: Date.now(),
      processingTime,
      elementsProcessed: data.elementsProcessed || 0,
      textNodesFound: data.textNodesFound || 0
    });

    // Keep only recent timing data
    const cutoff = Date.now() - PERFORMANCE_MONITORING.METRICS_RETENTION_TIME;
    this.timingData = this.timingData.filter(entry => entry.timestamp > cutoff);

    this.metrics.intersectionUpdates++;
    this.metrics.edgeProcessingTime += processingTime;
    this.metrics.totalProcessingTime += processingTime;
  }

  /**
   * Record frame rate data
   * @param {number} fps
   */
  recordFrameRate(fps) {
    if (!this.enabled) return;

    this.frameRateData.push({
      timestamp: Date.now(),
      fps
    });

    // Keep only recent frame rate data
    const cutoff = Date.now() - PERFORMANCE_MONITORING.METRICS_RETENTION_TIME;
    this.frameRateData = this.frameRateData.filter(entry => entry.timestamp > cutoff);
  }

  /**
   * Update performance metrics
   */
  updateMetrics() {
    if (!this.enabled || this.timingData.length === 0) return;

    // Calculate average processing time
    const totalTime = this.timingData.reduce((sum, entry) => sum + entry.processingTime, 0);
    const avgTime = totalTime / this.timingData.length;
    this.metrics.avgEdgeProcessingTime = avgTime.toFixed(2) + 'ms';

    // Calculate performance gain (compared to estimated full traversal)
    const estimatedFullTraversalTime = this.estimateFullTraversalTime();
    if (estimatedFullTraversalTime > 0) {
      this.metrics.performanceGain = estimatedFullTraversalTime - avgTime;
      this.metrics.efficiencyGainPercent = 
        ((estimatedFullTraversalTime - avgTime) / estimatedFullTraversalTime * 100).toFixed(1);
    }

    // Calculate current frame rate
    if (this.frameRateData.length > 0) {
      const recentFrames = this.frameRateData.slice(-10);
      const avgFps = recentFrames.reduce((sum, entry) => sum + entry.fps, 0) / recentFrames.length;
      this.currentFps = avgFps;
    }
  }

  /**
   * Estimate full DOM traversal time for comparison
   * @returns {number}
   */
  estimateFullTraversalTime() {
    // Rough estimate based on DOM complexity
    const elementCount = document.querySelectorAll('*').length;
    const textNodeCount = this.estimateTextNodeCount();
    
    // Assume 0.001ms per element + 0.002ms per text node for full traversal
    return (elementCount * 0.001) + (textNodeCount * 0.002);
  }

  /**
   * Estimate total text node count in document
   * @returns {number}
   */
  estimateTextNodeCount() {
    // Sample a portion of the document to estimate total
    const sampleElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
    const sampleSize = Math.min(100, sampleElements.length);
    
    if (sampleSize === 0) return 0;

    let textNodeCount = 0;
    for (let i = 0; i < sampleSize; i++) {
      const element = sampleElements[i];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );
      
      while (walker.nextNode()) {
        textNodeCount++;
      }
    }

    // Extrapolate to full document
    return Math.round((textNodeCount / sampleSize) * sampleElements.length);
  }

  /**
   * Check performance thresholds and trigger alerts
   */
  checkPerformanceThresholds() {
    if (!this.enabled || this.timingData.length === 0) return;

    const recentTiming = this.timingData.slice(-5);
    const avgRecentTime = recentTiming.reduce((sum, entry) => sum + entry.processingTime, 0) / recentTiming.length;

    // Check processing time threshold
    if (avgRecentTime > this.thresholds.fallbackThreshold) {
      this.triggerPerformanceAlert('processing_time_exceeded', {
        avgProcessingTime: avgRecentTime,
        threshold: this.thresholds.fallbackThreshold
      });
    }

    // Check frame rate threshold
    if (this.currentFps && this.currentFps < this.thresholds.targetFps * 0.8) {
      this.triggerPerformanceAlert('frame_rate_low', {
        currentFps: this.currentFps,
        targetFps: this.thresholds.targetFps
      });
    }
  }

  /**
   * Trigger performance alert
   * @param {string} type
   * @param {Object} data
   */
  triggerPerformanceAlert(type, data) {
    if (window.KEYPILOT_DEBUG) {
      console.warn(`[KeyPilot Performance Alert] ${type}:`, data);
    }

    // Dispatch custom event for performance alerts
    document.dispatchEvent(new CustomEvent('keypilot:performance-alert', {
      detail: { type, data, timestamp: Date.now() }
    }));
  }

  /**
   * Update cache metrics
   * @param {Object} cacheMetrics
   */
  updateCacheMetrics(cacheMetrics) {
    if (!this.enabled) return;

    this.metrics.cacheHitRatio = (cacheMetrics.hitRatio * 100).toFixed(1) + '%';
  }

  /**
   * Update element metrics
   * @param {Object} elementData
   */
  updateElementMetrics(elementData) {
    if (!this.enabled) return;

    this.metrics.elementsObserved = elementData.observed || 0;
    this.metrics.intersectingElements = elementData.intersecting || 0;
    this.metrics.intersectingTextNodes = elementData.textNodes || 0;
    this.metrics.elementsEntering = elementData.entering || 0;
    this.metrics.elementsLeaving = elementData.leaving || 0;
  }

  /**
   * Get current metrics
   * @returns {Object}
   */
  getMetrics() {
    return { ...this.metrics };
  }

  /**
   * Get detailed performance report
   * @returns {Object}
   */
  getPerformanceReport() {
    const now = Date.now();
    const reportPeriod = now - this.lastReportTime;
    this.lastReportTime = now;

    return {
      timestamp: new Date().toISOString(),
      reportPeriod,
      metrics: this.getMetrics(),
      timingData: this.timingData.slice(-20), // Last 20 entries
      frameRateData: this.frameRateData.slice(-20),
      thresholds: this.thresholds,
      recommendations: this.generateRecommendations()
    };
  }

  /**
   * Generate performance recommendations
   * @returns {Array}
   */
  generateRecommendations() {
    const recommendations = [];
    
    if (this.timingData.length > 0) {
      const avgTime = this.timingData.reduce((sum, entry) => sum + entry.processingTime, 0) / this.timingData.length;
      
      if (avgTime > this.thresholds.maxProcessingTime) {
        recommendations.push({
          type: 'performance',
          message: 'Consider reducing batch size or enabling quality adjustments',
          priority: 'high'
        });
      }
    }

    if (this.currentFps && this.currentFps < this.thresholds.targetFps * 0.9) {
      recommendations.push({
        type: 'framerate',
        message: 'Frame rate below target, consider adaptive processing',
        priority: 'medium'
      });
    }

    return recommendations;
  }

  /**
   * Reset metrics
   */
  reset() {
    this.metrics = {
      intersectionUpdates: 0,
      elementsObserved: 0,
      intersectingElements: 0,
      intersectingTextNodes: 0,
      edgeProcessingTime: 0,
      totalProcessingTime: 0,
      cacheHitRatio: 0,
      performanceGain: 0,
      efficiencyGainPercent: 0,
      elementsEntering: 0,
      elementsLeaving: 0,
      avgEdgeProcessingTime: '0ms'
    };

    this.timingData = [];
    this.frameRateData = [];
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.stopMonitoring();
    this.reset();
  }
}
