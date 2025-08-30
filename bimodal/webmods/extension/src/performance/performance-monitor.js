/**
 * PerformanceMonitor - Tracks and analyzes performance metrics for rectangle selection optimization
 * 
 * This class provides comprehensive performance monitoring for the edge-only intersection selection,
 * including metrics collection, trend analysis, and performance comparison between optimized and traditional approaches.
 */

import { PERFORMANCE_MONITORING, EDGE_ONLY_SELECTION } from '../config/constants.js';

export class PerformanceMonitor {
  constructor() {
    // Get configuration from constants
    const config = PERFORMANCE_MONITORING;
    
    this.enabled = config.ENABLED || false;
    this.metricsBufferSize = config.METRICS_BUFFER_SIZE || 100;
    this.performanceThreshold = config.PERFORMANCE_THRESHOLD_MS || 50;
    this.comparisonEnabled = config.ENABLE_PERFORMANCE_COMPARISON || true;
    this.trendAnalysisEnabled = config.ENABLE_TREND_ANALYSIS || true;
    
    // Core performance metrics
    this.metrics = {
      // Element processing metrics
      elementsObserved: 0,
      elementsProcessed: 0,
      elementsEntering: 0,
      elementsLeaving: 0,
      
      // Processing time metrics
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Infinity,
      
      // Character detection metrics
      charactersDetected: 0,
      characterDetectionTime: 0,
      characterCacheHits: 0,
      characterCacheMisses: 0,
      
      // Smart targeting metrics
      elementReductionPercentage: 0,
      smartTargetingTime: 0,
      dynamicElementsAdded: 0,
      
      // Cache efficiency metrics
      cacheHitRate: 0,
      cacheEfficiency: 0,
      memoryUsage: 0,
      
      // Performance comparison metrics
      estimatedTraditionalTime: 0,
      actualOptimizedTime: 0,
      performanceGainPercentage: 0,
      speedupFactor: 1
    };
    
    // Historical data for trend analysis
    this.history = {
      processingTimes: [],
      elementCounts: [],
      cacheHitRates: [],
      performanceGains: [],
      timestamps: []
    };
    
    // Performance alerts and thresholds
    this.alerts = {
      performanceDegradation: false,
      highProcessingTime: false,
      lowCacheEfficiency: false,
      memoryPressure: false
    };
    
    // Performance alerts history array (for slice operations)
    this.performanceAlerts = [];
    
    // Additional properties accessed by rectangle-intersection-observer
    this.fallbackTriggered = false;
    this.fallbackReason = null;
    this.regressionDetected = false;
    this.baselinePerformance = null;
    this.consecutiveSlowOperations = 0;
    this.thresholdMs = this.performanceThreshold;
    this.processingTimes = [];
    this.enabled = this.enabled; // Already set above, but making it explicit
    
    // Comparison data for traditional vs optimized approaches
    this.comparison = {
      traditionalSamples: [],
      optimizedSamples: [],
      sampleSize: config.COMPARISON_SAMPLE_SIZE || 50,
      confidenceLevel: config.COMPARISON_CONFIDENCE_LEVEL || 0.95
    };
    
    // Trend analysis data
    this.trends = {
      processingTimeSlope: 0,
      cacheEfficiencySlope: 0,
      performanceGainSlope: 0,
      trendConfidence: 0,
      lastAnalysis: 0,
      analysisInterval: config.TREND_ANALYSIS_INTERVAL || 30000 // 30 seconds
    };
    
    // Performance monitoring state
    this.monitoring = {
      startTime: 0,
      sessionStartTime: Date.now(),
      totalOperations: 0,
      lastUpdate: 0,
      updateInterval: config.UPDATE_INTERVAL || 1000 // 1 second
    };
  }

  /**
   * Start performance monitoring session
   */
  startMonitoring() {
    if (!this.enabled) {
      return;
    }
    
    this.monitoring.startTime = performance.now();
    this.monitoring.sessionStartTime = Date.now();
    this.resetSessionMetrics();
    
    // Start periodic trend analysis if enabled
    if (this.trendAnalysisEnabled) {
      this.startTrendAnalysis();
    }
  }

  /**
   * Record element processing metrics
   * @param {Object} data - Processing data
   */
  recordElementProcessing(data) {
    if (!this.enabled) {
      return;
    }
    
    const {
      elementsProcessed = 0,
      elementsEntering = 0,
      elementsLeaving = 0,
      processingTime = 0,
      elementsObserved = 0
    } = data;
    
    // Update core metrics
    this.metrics.elementsProcessed += elementsProcessed;
    this.metrics.elementsEntering += elementsEntering;
    this.metrics.elementsLeaving += elementsLeaving;
    this.metrics.elementsObserved = elementsObserved;
    this.metrics.totalProcessingTime += processingTime;
    
    // Add to processing times array (used by rectangle-intersection-observer)
    this.processingTimes.push(processingTime);
    if (this.processingTimes.length > this.metricsBufferSize) {
      this.processingTimes.shift();
    }
    
    // Update processing time statistics
    this.updateProcessingTimeStats(processingTime);
    
    // Add to historical data
    this.addToHistory('processingTimes', processingTime);
    this.addToHistory('elementCounts', elementsProcessed);
    this.addToHistory('timestamps', Date.now());
    
    // Check for performance alerts
    this.checkPerformanceAlerts(processingTime);
    
    // Track consecutive slow operations
    if (processingTime > this.thresholdMs) {
      this.consecutiveSlowOperations++;
    } else {
      this.consecutiveSlowOperations = 0;
    }
    
    // Establish baseline performance
    if (this.baselinePerformance === null && this.processingTimes.length >= 10) {
      this.baselinePerformance = this.processingTimes.slice(0, 10).reduce((sum, time) => sum + time, 0) / 10;
    }
    
    // Check for performance regression
    if (this.baselinePerformance && this.processingTimes.length >= 5) {
      const recentAvg = this.processingTimes.slice(-5).reduce((sum, time) => sum + time, 0) / 5;
      this.regressionDetected = recentAvg > this.baselinePerformance * 1.5;
    }
    
    this.monitoring.totalOperations++;
    this.monitoring.lastUpdate = Date.now();
  }

  /**
   * Record character detection metrics
   * @param {Object} data - Character detection data
   */
  recordCharacterDetection(data) {
    if (!this.enabled) {
      return;
    }
    
    const {
      charactersDetected = 0,
      detectionTime = 0,
      cacheHits = 0,
      cacheMisses = 0
    } = data;
    
    this.metrics.charactersDetected += charactersDetected;
    this.metrics.characterDetectionTime += detectionTime;
    this.metrics.characterCacheHits += cacheHits;
    this.metrics.characterCacheMisses += cacheMisses;
    
    // Calculate cache hit rate
    const totalCacheAccess = this.metrics.characterCacheHits + this.metrics.characterCacheMisses;
    this.metrics.cacheHitRate = totalCacheAccess > 0 
      ? (this.metrics.characterCacheHits / totalCacheAccess) * 100 
      : 0;
    
    this.addToHistory('cacheHitRates', this.metrics.cacheHitRate);
  }

  /**
   * Record smart targeting metrics
   * @param {Object} data - Smart targeting data
   */
  recordSmartTargeting(data) {
    if (!this.enabled) {
      return;
    }
    
    const {
      elementReductionPercentage = 0,
      smartTargetingTime = 0,
      dynamicElementsAdded = 0
    } = data;
    
    this.metrics.elementReductionPercentage = elementReductionPercentage;
    this.metrics.smartTargetingTime += smartTargetingTime;
    this.metrics.dynamicElementsAdded += dynamicElementsAdded;
  }

  /**
   * Record performance comparison data
   * @param {Object} data - Comparison data
   */
  recordPerformanceComparison(data) {
    if (!this.enabled || !this.comparisonEnabled) {
      return;
    }
    
    const {
      estimatedTraditionalTime = 0,
      actualOptimizedTime = 0
    } = data;
    
    this.metrics.estimatedTraditionalTime += estimatedTraditionalTime;
    this.metrics.actualOptimizedTime += actualOptimizedTime;
    
    // Calculate performance gain
    if (this.metrics.estimatedTraditionalTime > 0) {
      this.metrics.performanceGainPercentage = 
        ((this.metrics.estimatedTraditionalTime - this.metrics.actualOptimizedTime) / 
         this.metrics.estimatedTraditionalTime) * 100;
      
      this.metrics.speedupFactor = 
        this.metrics.estimatedTraditionalTime / Math.max(this.metrics.actualOptimizedTime, 1);
    }
    
    // Add to comparison samples
    this.comparison.optimizedSamples.push(actualOptimizedTime);
    this.comparison.traditionalSamples.push(estimatedTraditionalTime);
    
    // Keep sample size within limits
    if (this.comparison.optimizedSamples.length > this.comparison.sampleSize) {
      this.comparison.optimizedSamples.shift();
      this.comparison.traditionalSamples.shift();
    }
    
    this.addToHistory('performanceGains', this.metrics.performanceGainPercentage);
  }

  /**
   * Update processing time statistics
   * @param {number} processingTime - Processing time in milliseconds
   */
  updateProcessingTimeStats(processingTime) {
    this.metrics.maxProcessingTime = Math.max(this.metrics.maxProcessingTime, processingTime);
    this.metrics.minProcessingTime = Math.min(this.metrics.minProcessingTime, processingTime);
    
    // Calculate average processing time
    if (this.metrics.elementsProcessed > 0) {
      this.metrics.averageProcessingTime = 
        this.metrics.totalProcessingTime / this.metrics.elementsProcessed;
    }
  }

  /**
   * Add data point to historical data
   * @param {string} metric - Metric name
   * @param {number} value - Value to add
   */
  addToHistory(metric, value) {
    if (!this.history[metric]) {
      this.history[metric] = [];
    }
    
    this.history[metric].push(value);
    
    // Keep history within buffer size
    if (this.history[metric].length > this.metricsBufferSize) {
      this.history[metric].shift();
    }
  }

  /**
   * Check for performance alerts
   * @param {number} processingTime - Current processing time
   */
  checkPerformanceAlerts(processingTime) {
    // High processing time alert
    const wasHighProcessingTime = this.alerts.highProcessingTime;
    this.alerts.highProcessingTime = processingTime > this.performanceThreshold;
    
    if (!wasHighProcessingTime && this.alerts.highProcessingTime) {
      this.addPerformanceAlert('high_processing_time', {
        processingTime,
        threshold: this.performanceThreshold
      });
    }
    
    // Performance degradation alert (based on trend)
    if (this.history.processingTimes.length > 10) {
      const recentAvg = this.calculateRecentAverage('processingTimes', 5);
      const overallAvg = this.metrics.averageProcessingTime;
      const wasPerformanceDegradation = this.alerts.performanceDegradation;
      this.alerts.performanceDegradation = recentAvg > overallAvg * 1.5;
      
      if (!wasPerformanceDegradation && this.alerts.performanceDegradation) {
        this.addPerformanceAlert('performance_degradation', {
          recentAvg,
          overallAvg
        });
      }
    }
    
    // Low cache efficiency alert
    const wasLowCacheEfficiency = this.alerts.lowCacheEfficiency;
    this.alerts.lowCacheEfficiency = this.metrics.cacheHitRate < 50;
    
    if (!wasLowCacheEfficiency && this.alerts.lowCacheEfficiency) {
      this.addPerformanceAlert('low_cache_efficiency', {
        cacheHitRate: this.metrics.cacheHitRate
      });
    }
    
    // Memory pressure alert (placeholder - would need actual memory monitoring)
    this.alerts.memoryPressure = false;
  }

  /**
   * Add a performance alert to the alerts history
   * @param {string} type - Alert type
   * @param {Object} data - Alert data
   */
  addPerformanceAlert(type, data = {}) {
    const alert = {
      type,
      timestamp: Date.now(),
      data
    };
    
    this.performanceAlerts.push(alert);
    
    // Keep only the last 50 alerts to prevent memory issues
    if (this.performanceAlerts.length > 50) {
      this.performanceAlerts.shift();
    }
  }

  /**
   * Calculate recent average for a metric
   * @param {string} metric - Metric name
   * @param {number} samples - Number of recent samples to use
   * @returns {number} Recent average
   */
  calculateRecentAverage(metric, samples) {
    const data = this.history[metric];
    if (!data || data.length === 0) {
      return 0;
    }
    
    const recentData = data.slice(-samples);
    return recentData.reduce((sum, value) => sum + value, 0) / recentData.length;
  }

  /**
   * Start trend analysis
   */
  startTrendAnalysis() {
    const analyzeInterval = setInterval(() => {
      this.analyzeTrends();
    }, this.trends.analysisInterval);
    
    // Store interval ID for cleanup
    this.trendAnalysisInterval = analyzeInterval;
  }

  /**
   * Analyze performance trends
   */
  analyzeTrends() {
    if (!this.trendAnalysisEnabled || this.history.timestamps.length < 10) {
      return;
    }
    
    // Analyze processing time trend
    this.trends.processingTimeSlope = this.calculateTrendSlope('processingTimes');
    
    // Analyze cache efficiency trend
    this.trends.cacheEfficiencySlope = this.calculateTrendSlope('cacheHitRates');
    
    // Analyze performance gain trend
    this.trends.performanceGainSlope = this.calculateTrendSlope('performanceGains');
    
    // Calculate overall trend confidence
    this.trends.trendConfidence = this.calculateTrendConfidence();
    
    this.trends.lastAnalysis = Date.now();
  }

  /**
   * Calculate trend slope using linear regression
   * @param {string} metric - Metric name
   * @returns {number} Trend slope
   */
  calculateTrendSlope(metric) {
    const data = this.history[metric];
    const timestamps = this.history.timestamps;
    
    if (!data || data.length < 2 || timestamps.length !== data.length) {
      return 0;
    }
    
    const n = data.length;
    const sumX = timestamps.reduce((sum, t) => sum + t, 0);
    const sumY = data.reduce((sum, y) => sum + y, 0);
    const sumXY = timestamps.reduce((sum, t, i) => sum + t * data[i], 0);
    const sumXX = timestamps.reduce((sum, t) => sum + t * t, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    return isNaN(slope) ? 0 : slope;
  }

  /**
   * Calculate trend confidence based on data consistency
   * @returns {number} Confidence score (0-1)
   */
  calculateTrendConfidence() {
    const metrics = ['processingTimes', 'cacheHitRates', 'performanceGains'];
    let totalConfidence = 0;
    let validMetrics = 0;
    
    metrics.forEach(metric => {
      const data = this.history[metric];
      if (data && data.length > 5) {
        const variance = this.calculateVariance(data);
        const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
        const cv = mean > 0 ? Math.sqrt(variance) / mean : 1; // Coefficient of variation
        const confidence = Math.max(0, 1 - cv); // Lower variance = higher confidence
        totalConfidence += confidence;
        validMetrics++;
      }
    });
    
    return validMetrics > 0 ? totalConfidence / validMetrics : 0;
  }

  /**
   * Calculate variance of a data array
   * @param {Array<number>} data - Data array
   * @returns {number} Variance
   */
  calculateVariance(data) {
    if (data.length === 0) return 0;
    
    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const squaredDiffs = data.map(val => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, val) => sum + val, 0) / data.length;
  }

  /**
   * Get current performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      alerts: { ...this.alerts },
      trends: { ...this.trends },
      sessionDuration: Date.now() - this.monitoring.sessionStartTime,
      totalOperations: this.monitoring.totalOperations,
      lastUpdate: this.monitoring.lastUpdate
    };
  }

  /**
   * Get performance comparison statistics
   * @returns {Object} Comparison statistics
   */
  getComparisonStats() {
    if (!this.comparisonEnabled || this.comparison.optimizedSamples.length === 0) {
      return null;
    }
    
    const optimizedAvg = this.comparison.optimizedSamples.reduce((sum, val) => sum + val, 0) / 
                        this.comparison.optimizedSamples.length;
    const traditionalAvg = this.comparison.traditionalSamples.reduce((sum, val) => sum + val, 0) / 
                          this.comparison.traditionalSamples.length;
    
    return {
      optimizedAverage: optimizedAvg,
      traditionalAverage: traditionalAvg,
      speedupFactor: traditionalAvg / Math.max(optimizedAvg, 1),
      performanceGain: ((traditionalAvg - optimizedAvg) / traditionalAvg) * 100,
      sampleSize: this.comparison.optimizedSamples.length,
      confidenceLevel: this.comparison.confidenceLevel
    };
  }

  /**
   * Get trend analysis results
   * @returns {Object} Trend analysis
   */
  getTrendAnalysis() {
    if (!this.trendAnalysisEnabled) {
      return null;
    }
    
    return {
      processingTimeTrend: this.trends.processingTimeSlope > 0 ? 'increasing' : 'decreasing',
      cacheEfficiencyTrend: this.trends.cacheEfficiencySlope > 0 ? 'improving' : 'declining',
      performanceGainTrend: this.trends.performanceGainSlope > 0 ? 'improving' : 'declining',
      trendConfidence: this.trends.trendConfidence,
      lastAnalysis: this.trends.lastAnalysis,
      dataPoints: this.history.timestamps.length
    };
  }

  /**
   * Reset session metrics
   */
  resetSessionMetrics() {
    this.metrics = {
      elementsObserved: 0,
      elementsProcessed: 0,
      elementsEntering: 0,
      elementsLeaving: 0,
      totalProcessingTime: 0,
      averageProcessingTime: 0,
      maxProcessingTime: 0,
      minProcessingTime: Infinity,
      charactersDetected: 0,
      characterDetectionTime: 0,
      characterCacheHits: 0,
      characterCacheMisses: 0,
      elementReductionPercentage: 0,
      smartTargetingTime: 0,
      dynamicElementsAdded: 0,
      cacheHitRate: 0,
      cacheEfficiency: 0,
      memoryUsage: 0,
      estimatedTraditionalTime: 0,
      actualOptimizedTime: 0,
      performanceGainPercentage: 0,
      speedupFactor: 1
    };
    
    // Reset alerts
    this.alerts = {
      performanceDegradation: false,
      highProcessingTime: false,
      lowCacheEfficiency: false,
      memoryPressure: false
    };
    
    // Clear performance alerts history
    this.performanceAlerts = [];
    
    // Reset additional properties
    this.fallbackTriggered = false;
    this.fallbackReason = null;
    this.regressionDetected = false;
    this.baselinePerformance = null;
    this.consecutiveSlowOperations = 0;
    this.processingTimes = [];
    
    this.monitoring.totalOperations = 0;
  }

  /**
   * Stop performance monitoring and cleanup
   */
  stopMonitoring() {
    if (this.trendAnalysisInterval) {
      clearInterval(this.trendAnalysisInterval);
      this.trendAnalysisInterval = null;
    }
  }

  /**
   * Export performance data for analysis
   * @returns {Object} Complete performance data
   */
  exportData() {
    return {
      metrics: this.getMetrics(),
      history: { ...this.history },
      comparison: this.getComparisonStats(),
      trends: this.getTrendAnalysis(),
      configuration: {
        enabled: this.enabled,
        metricsBufferSize: this.metricsBufferSize,
        performanceThreshold: this.performanceThreshold,
        comparisonEnabled: this.comparisonEnabled,
        trendAnalysisEnabled: this.trendAnalysisEnabled
      }
    };
  }
}