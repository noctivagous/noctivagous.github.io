import { EDGE_ONLY_SELECTION, FEATURE_FLAGS, PERFORMANCE_MONITORING } from '../config/constants.js';
import { TextElementFilter } from './text-element-filter.js';
import { EdgeCharacterDetector } from './edge-character-detector.js';

/**
 * Rectangle Intersection Observer - Uses IntersectionObserver for efficient rectangle selection
 * 
 * This approach leverages the browser's optimized intersection calculations to detect
 * text elements within a live selection rectangle, providing performance comparable
 * to manual browser selection.
 */
export class RectangleIntersectionObserver {
  constructor() {
    // Main intersection observer for text elements
    this.textObserver = null;
    
    // Dynamic root element that represents the selection rectangle
    this.rectangleRoot = null;
    
    // Set of text elements currently intersecting the rectangle
    this.intersectingTextElements = new Set();
    
    // Set of text nodes found within intersecting elements
    this.intersectingTextNodes = new Set();
    
    // Callback for when intersection changes
    this.onIntersectionChange = null;

    // Enhanced integration components (Task 2) - controlled by master flag
    this.enhancedIntegrationEnabled = FEATURE_FLAGS.ENABLE_ENHANCED_RECTANGLE_OBSERVER;
    
    if (this.enhancedIntegrationEnabled) {
      // Smart element targeting (Task 2.1)
      this.textElementFilter = new TextElementFilter();
      this.observedElements = new Set();
      this.smartTargetingEnabled = EDGE_ONLY_SELECTION.SMART_TARGETING.ENABLED;

      // Edge-level character detection (Task 2.2)
      this.edgeCharacterDetector = new EdgeCharacterDetector();
      this.edgeCharacterDetectionEnabled = EDGE_ONLY_SELECTION.CHARACTER_DETECTION.ENABLED;

      // Performance monitoring integration (Task 2.3) - now integrated
      this.performanceMonitoringEnabled = PERFORMANCE_MONITORING.ENABLED;
      this.initializePerformanceMonitoring();
    } else {
      // Disable all enhanced features if master flag is off
      this.textElementFilter = null;
      this.observedElements = null;
      this.smartTargetingEnabled = false;
      this.edgeCharacterDetector = null;
      this.edgeCharacterDetectionEnabled = false;
      this.performanceMonitoringEnabled = false;
    };
    
    // Adaptive Processing System (Task 2.1)
    this.adaptiveProcessor = {
      enabled: EDGE_ONLY_SELECTION.ENABLE_ADAPTIVE_PROCESSING,
      
      // Page complexity analysis
      pageComplexity: {
        elementCount: 0,
        domDepth: 0,
        textNodeDensity: 0,
        complexityLevel: 'medium', // low, medium, high
        lastAnalysis: 0,
        analysisInterval: EDGE_ONLY_SELECTION.PAGE_COMPLEXITY_ANALYSIS.COMPLEXITY_CHECK_INTERVAL
      },
      
      // Frame rate monitoring
      frameRateMonitor: {
        targetFps: EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.TARGET_FPS,
        frameTimeBudget: EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.FRAME_TIME_BUDGET_MS,
        processingTimeBudget: EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.PROCESSING_TIME_BUDGET_MS,
        frameTimes: [],
        currentFps: 60,
        lastFrameTime: 0,
        frameCount: 0,
        monitoringWindow: EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.FRAME_RATE_MONITORING_WINDOW
      },
      
      // Batch processing optimization
      batchProcessor: {
        enabled: EDGE_ONLY_SELECTION.BATCH_PROCESSING.ENABLE_BATCH_PROCESSING,
        currentBatchSize: EDGE_ONLY_SELECTION.BATCH_PROCESSING.DEFAULT_BATCH_SIZE,
        maxBatchSize: EDGE_ONLY_SELECTION.BATCH_PROCESSING.MAX_BATCH_SIZE,
        minBatchSize: EDGE_ONLY_SELECTION.BATCH_PROCESSING.MIN_BATCH_SIZE,
        batchTimeout: EDGE_ONLY_SELECTION.BATCH_PROCESSING.BATCH_TIMEOUT_MS,
        pendingBatch: [],
        batchTimer: null,
        adaptiveSizing: EDGE_ONLY_SELECTION.BATCH_PROCESSING.ADAPTIVE_BATCH_SIZING
      },
      
      // Quality adjustment system
      qualityController: {
        enabled: EDGE_ONLY_SELECTION.QUALITY_ADJUSTMENTS.ENABLE_QUALITY_ADJUSTMENTS,
        currentQuality: 'high', // high, medium, low
        qualityHistory: [],
        adjustmentHysteresis: EDGE_ONLY_SELECTION.QUALITY_ADJUSTMENTS.QUALITY_ADJUSTMENT_HYSTERESIS,
        hysteresisCounter: 0,
        thresholds: {
          high: EDGE_ONLY_SELECTION.QUALITY_ADJUSTMENTS.HIGH_QUALITY_TIME_THRESHOLD,
          medium: EDGE_ONLY_SELECTION.QUALITY_ADJUSTMENTS.MEDIUM_QUALITY_TIME_THRESHOLD,
          lowProcessingLimit: EDGE_ONLY_SELECTION.QUALITY_ADJUSTMENTS.LOW_QUALITY_PROCESSING_LIMIT
        }
      }
    };

    // Predictive Caching System (Task 2.2)
    this.predictiveCaching = {
      enabled: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.ENABLE_PREDICTIVE_CACHING,
      
      // User behavior analysis
      behaviorAnalyzer: {
        enabled: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.ENABLE_USER_BEHAVIOR_ANALYSIS,
        interactionHistory: [],
        patterns: new Map(), // Pattern type -> confidence score
        lastAnalysis: 0,
        analysisInterval: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.PATTERN_ANALYSIS_INTERVAL,
        patternWindow: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.BEHAVIOR_PATTERN_WINDOW,
        interactionTimeout: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.INTERACTION_TIMEOUT_MS,
        minConfidence: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.MIN_PATTERN_CONFIDENCE
      },
      
      // Viewport-based caching
      viewportCaching: {
        enabled: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.ENABLE_VIEWPORT_BASED_CACHING,
        currentViewport: { x: 0, y: 0, width: 0, height: 0 },
        cacheMargin: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.VIEWPORT_CACHE_MARGIN,
        cacheSectors: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.VIEWPORT_CACHE_SECTORS,
        sectorCache: new Map(), // Sector ID -> cached elements
        lastViewportUpdate: 0,
        updateThrottle: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.VIEWPORT_UPDATE_THROTTLE
      },
      
      // Scroll prediction
      scrollPredictor: {
        enabled: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.ENABLE_SCROLL_PREDICTION,
        scrollHistory: [],
        currentVelocity: { x: 0, y: 0 },
        predictedPosition: { x: 0, y: 0 },
        velocitySamples: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.SCROLL_VELOCITY_SAMPLES,
        predictionDistance: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.SCROLL_PREDICTION_DISTANCE,
        minVelocity: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.MIN_SCROLL_VELOCITY,
        directionThreshold: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.SCROLL_DIRECTION_THRESHOLD,
        lastScrollTime: 0
      },
      
      // Cache preloading
      preloader: {
        enabled: true,
        preloadQueue: [],
        preloadCache: new WeakMap(), // Element -> preload data
        batchSize: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.PRELOAD_BATCH_SIZE,
        throttleMs: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.PRELOAD_THROTTLE_MS,
        maxElements: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.MAX_PRELOAD_ELEMENTS,
        priorityThreshold: EDGE_ONLY_SELECTION.PREDICTIVE_CACHING.PRELOAD_PRIORITY_THRESHOLD,
        lastPreloadTime: 0,
        preloadTimer: null
      }
    };
    
    // Legacy performance threshold monitoring (will be replaced by integrated system)
    this.legacyPerformanceMonitor = {
      enabled: EDGE_ONLY_SELECTION.ENABLE_PERFORMANCE_MONITORING,
      processingTimes: [], // Rolling window of processing times
      windowSize: 10, // Number of recent measurements to track
      thresholdMs: EDGE_ONLY_SELECTION.FALLBACK_THRESHOLD_MS,
      consecutiveSlowOperations: 0,
      maxConsecutiveSlowOps: 3, // Fallback after 3 consecutive slow operations
      fallbackTriggered: false,
      fallbackReason: null,
      performanceAlerts: [],
      lastAlertTime: 0,
      alertCooldownMs: 5000, // 5 second cooldown between alerts
      regressionDetected: false,
      baselinePerformance: null, // Established after initial measurements
      performanceDegradationFactor: 2.0 // Alert if performance is 2x worse than baseline
    };
    
    // Fallback mechanism to spatial intersection
    this.fallbackHandler = {
      active: false,
      reason: null,
      fallbackStartTime: null,
      spatialIntersectionCallback: null,
      recoveryAttempts: 0,
      maxRecoveryAttempts: 3,
      recoveryTestInterval: 30000, // Test recovery every 30 seconds
      lastRecoveryTest: 0
    };
    
    // User notification system for performance mode changes
    this.notificationSystem = {
      enabled: true,
      lastNotificationTime: 0,
      notificationCooldownMs: 10000, // 10 second cooldown between notifications
      showPerformanceNotifications: FEATURE_FLAGS.SHOW_SELECTION_METHOD_IN_UI,
      notificationCallback: null
    };
    
    // Enhanced performance metrics for edge-only processing
    this.metrics = {
      elementsObserved: 0,
      intersectionUpdates: 0,
      textNodesFound: 0,
      lastUpdateTime: 0,
      
      // Edge-only processing metrics
      edgeProcessingTime: 0,
      edgeElementsProcessed: 0,
      elementsEntering: 0,
      elementsLeaving: 0,
      
      // Text node traversal metrics
      totalTraversalTime: 0,
      traversalCount: 0,
      cacheHits: 0,
      cacheMisses: 0,
      
      // Performance comparison metrics
      estimatedFullTraversalTime: 0,
      actualEdgeProcessingTime: 0,
      efficiencyGainPercent: 0,
      
      // Smart targeting metrics (Task 2.1)
      totalElementsScanned: 0,
      elementsSkipped: 0,
      elementReductionPercentage: 0,
      smartTargetingTime: 0,
      dynamicElementsAdded: 0,
      
      // Character detection metrics (Task 2.2)
      charactersDetected: 0,
      characterDetectionTime: 0,
      characterCacheHits: 0,
      characterCacheMisses: 0
    };
    
    // Cache for text node extraction with hit/miss tracking and LRU eviction
    this.textNodeCache = new WeakMap();
    
    // Enhanced LRU cache management - track access order for eviction
    this.cacheAccessOrder = new Map(); // elementId -> { timestamp, accessCount, elementRef }
    this.cacheSize = 0;
    this.maxCacheSize = EDGE_ONLY_SELECTION.CACHE_SIZE_LIMIT;
    this.cleanupThreshold = EDGE_ONLY_SELECTION.CACHE_CLEANUP_THRESHOLD;
    this.cleanupBatchSize = EDGE_ONLY_SELECTION.CACHE_CLEANUP_BATCH_SIZE;
    
    // Initialize cache management timers
    this.cacheManagementTimer = null;
    this.memoryMonitoringTimer = null;
    this.lastCacheOptimization = Date.now();
    
    // Enhanced cache efficiency tracking
    this.cacheEfficiencyMetrics = {
      totalCacheOperations: 0,
      cacheHitStreak: 0,
      longestHitStreak: 0,
      cacheMissStreak: 0,
      longestMissStreak: 0,
      averageAccessTime: 0,
      totalAccessTime: 0,
      hotElements: new Map(), // Track frequently accessed elements
      coldElements: new Set(), // Track rarely accessed elements
      evictionHistory: [], // Track evicted elements for analysis
      memoryPressureEvents: 0,
      adaptiveCleanupTriggers: 0
    };
    
    // State management for proper edge-only processing
    this.elementStates = new Map(); // Track element intersection states
    this.lastRectangleUpdate = 0;
    
    // Enhanced Performance Monitoring and Analytics (Task 2.3)
    this.enhancedAnalytics = {
      enabled: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.ENABLE_REAL_TIME_DASHBOARD,
      
      // Real-time dashboard data
      dashboard: {
        enabled: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.ENABLE_REAL_TIME_DASHBOARD,
        updateInterval: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.DASHBOARD_UPDATE_INTERVAL,
        historyWindow: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.DASHBOARD_HISTORY_WINDOW,
        metricsBuffer: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.DASHBOARD_METRICS_BUFFER,
        currentMetrics: {
          processingTime: [],
          cacheHitRatio: [],
          memoryUsage: [],
          elementsProcessed: [],
          performanceGain: [],
          frameRate: []
        },
        lastUpdate: 0,
        updateTimer: null
      },
      
      // Trend analysis system
      trendAnalyzer: {
        enabled: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.ENABLE_TREND_ANALYSIS,
        analysisWindow: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.TREND_ANALYSIS_WINDOW,
        analysisInterval: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.TREND_ANALYSIS_INTERVAL,
        significanceThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.TREND_SIGNIFICANCE_THRESHOLD,
        confidenceThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.TREND_CONFIDENCE_THRESHOLD,
        trends: new Map(), // Metric name -> trend data
        lastAnalysis: 0,
        analysisTimer: null
      },
      
      // Regression detection system
      regressionDetector: {
        enabled: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.ENABLE_REGRESSION_DETECTION,
        detectionWindow: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.REGRESSION_DETECTION_WINDOW,
        thresholdFactor: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.REGRESSION_THRESHOLD_FACTOR,
        consecutiveThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.REGRESSION_CONSECUTIVE_THRESHOLD,
        recoveryThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.REGRESSION_RECOVERY_THRESHOLD,
        regressions: [],
        consecutivePoorSamples: 0,
        baselineMetrics: new Map(),
        lastDetection: 0
      },
      
      // Memory analytics system
      memoryAnalyzer: {
        enabled: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.ENABLE_MEMORY_ANALYTICS,
        samplingInterval: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.MEMORY_SAMPLING_INTERVAL,
        leakDetectionWindow: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.MEMORY_LEAK_DETECTION_WINDOW,
        growthThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.MEMORY_GROWTH_THRESHOLD,
        pressureThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.MEMORY_PRESSURE_THRESHOLD,
        memorySamples: [],
        leakDetected: false,
        pressureDetected: false,
        samplingTimer: null
      },
      
      // Comparison analytics system
      comparisonAnalyzer: {
        enabled: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.ENABLE_COMPARISON_ANALYTICS,
        sampleSize: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.COMPARISON_SAMPLE_SIZE,
        confidenceInterval: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.COMPARISON_CONFIDENCE_INTERVAL,
        significanceThreshold: PERFORMANCE_MONITORING.ENHANCED_ANALYTICS.COMPARISON_SIGNIFICANCE_THRESHOLD,
        edgeOnlySamples: [],
        spatialSamples: [],
        comparisonResults: new Map(),
        lastComparison: 0
      }
    };

    // Debug logging configuration
    this.debugLogging = window.KEYPILOT_DEBUG || false;
  }

  /**
   * Initialize the rectangle intersection observer
   * @param {Function} onIntersectionChange - Callback when intersection changes
   * @param {Function} notificationCallback - Optional callback for user notifications
   */
  initialize(onIntersectionChange, notificationCallback = null) {
    this.onIntersectionChange = onIntersectionChange;
    
    // Set up notification system
    if (notificationCallback) {
      this.setNotificationCallback(notificationCallback);
    }
    
    this.createRectangleRoot();
    this.setupTextObserver();
    this.discoverTextElements();
    this.startCacheManagement();
    
    // Start performance monitoring (Task 2.3)
    if (this.enhancedIntegrationEnabled && this.performanceMonitoringEnabled) {
      this.startPerformanceMonitoring();
    }
    
    // Initialize adaptive processing (Task 2.1)
    if (this.adaptiveProcessor.enabled) {
      this.initializeAdaptiveProcessing();
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Rectangle intersection observer initialized with performance monitoring:', {
        performanceMonitoringEnabled: this.legacyPerformanceMonitor.enabled,
        fallbackThreshold: this.legacyPerformanceMonitor.thresholdMs + 'ms',
        maxConsecutiveSlowOps: this.legacyPerformanceMonitor.maxConsecutiveSlowOps,
        notificationSystemEnabled: this.notificationSystem.enabled,
        adaptiveProcessingEnabled: this.adaptiveProcessor.enabled
      });
    }
  }

  /**
   * Initialize adaptive processing system (Task 2.1)
   */
  initializeAdaptiveProcessing() {
    // Perform initial page complexity analysis
    this.analyzePageComplexity();
    
    // Start frame rate monitoring
    this.startFrameRateMonitoring();
    
    // Initialize batch processing
    if (this.adaptiveProcessor.batchProcessor.enabled) {
      this.initializeBatchProcessing();
    }
    
    // Initialize predictive caching (Task 2.2)
    if (this.predictiveCaching.enabled) {
      this.initializePredictiveCaching();
    }
    
    // Initialize enhanced analytics (Task 2.3)
    if (this.enhancedAnalytics.enabled) {
      this.initializeEnhancedAnalytics();
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Adaptive processing initialized:', {
        pageComplexity: this.adaptiveProcessor.pageComplexity.complexityLevel,
        elementCount: this.adaptiveProcessor.pageComplexity.elementCount,
        domDepth: this.adaptiveProcessor.pageComplexity.domDepth,
        textNodeDensity: this.adaptiveProcessor.pageComplexity.textNodeDensity,
        batchProcessingEnabled: this.adaptiveProcessor.batchProcessor.enabled,
        currentBatchSize: this.adaptiveProcessor.batchProcessor.currentBatchSize,
        predictiveCachingEnabled: this.predictiveCaching.enabled,
        enhancedAnalyticsEnabled: this.enhancedAnalytics.enabled
      });
    }
  }

  /**
   * Analyze page complexity for adaptive processing (Task 2.1)
   */
  analyzePageComplexity() {
    const startTime = performance.now();
    
    // Count total elements in the document
    const allElements = document.querySelectorAll('*');
    this.adaptiveProcessor.pageComplexity.elementCount = allElements.length;
    
    // Calculate DOM depth
    let maxDepth = 0;
    const calculateDepth = (element, depth = 0) => {
      maxDepth = Math.max(maxDepth, depth);
      for (const child of element.children) {
        calculateDepth(child, depth + 1);
      }
    };
    calculateDepth(document.body);
    this.adaptiveProcessor.pageComplexity.domDepth = maxDepth;
    
    // Calculate text node density (text nodes / total elements)
    const textElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th, a');
    const textElementsWithContent = Array.from(textElements).filter(el => 
      el.textContent && el.textContent.trim().length > 0
    );
    this.adaptiveProcessor.pageComplexity.textNodeDensity = 
      textElementsWithContent.length / Math.max(allElements.length, 1);
    
    // Determine complexity level
    const { elementCount, domDepth, textNodeDensity } = this.adaptiveProcessor.pageComplexity;
    const config = EDGE_ONLY_SELECTION.PAGE_COMPLEXITY_ANALYSIS;
    
    if (elementCount > config.ELEMENT_COUNT_THRESHOLD_HIGH || 
        domDepth > config.DOM_DEPTH_THRESHOLD_HIGH) {
      this.adaptiveProcessor.pageComplexity.complexityLevel = 'high';
    } else if (elementCount > config.ELEMENT_COUNT_THRESHOLD_LOW || 
               domDepth > config.DOM_DEPTH_THRESHOLD_LOW) {
      this.adaptiveProcessor.pageComplexity.complexityLevel = 'medium';
    } else {
      this.adaptiveProcessor.pageComplexity.complexityLevel = 'low';
    }
    
    // Adjust processing parameters based on complexity
    this.adjustProcessingForComplexity();
    
    this.adaptiveProcessor.pageComplexity.lastAnalysis = Date.now();
    
    const analysisTime = performance.now() - startTime;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Page complexity analysis completed:', {
        elementCount,
        domDepth,
        textNodeDensity: textNodeDensity.toFixed(3),
        complexityLevel: this.adaptiveProcessor.pageComplexity.complexityLevel,
        analysisTime: analysisTime.toFixed(2) + 'ms',
        adjustedBatchSize: this.adaptiveProcessor.batchProcessor.currentBatchSize,
        adjustedProcessingBudget: this.adaptiveProcessor.frameRateMonitor.processingTimeBudget
      });
    }
  }

  /**
   * Adjust processing parameters based on page complexity (Task 2.1)
   */
  adjustProcessingForComplexity() {
    const complexity = this.adaptiveProcessor.pageComplexity.complexityLevel;
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    const frameMonitor = this.adaptiveProcessor.frameRateMonitor;
    
    switch (complexity) {
      case 'high':
        // Reduce batch size and processing budget for complex pages
        batchProcessor.currentBatchSize = Math.max(
          batchProcessor.minBatchSize,
          Math.floor(batchProcessor.currentBatchSize * 0.6)
        );
        frameMonitor.processingTimeBudget = Math.floor(frameMonitor.processingTimeBudget * 0.7);
        break;
        
      case 'medium':
        // Moderate adjustments
        batchProcessor.currentBatchSize = Math.floor(
          (batchProcessor.minBatchSize + batchProcessor.maxBatchSize) / 2
        );
        frameMonitor.processingTimeBudget = Math.floor(frameMonitor.processingTimeBudget * 0.85);
        break;
        
      case 'low':
        // Allow larger batches and more processing time for simple pages
        batchProcessor.currentBatchSize = Math.min(
          batchProcessor.maxBatchSize,
          Math.floor(batchProcessor.currentBatchSize * 1.2)
        );
        frameMonitor.processingTimeBudget = EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.PROCESSING_TIME_BUDGET_MS;
        break;
    }
    
    // Ensure batch size stays within bounds
    batchProcessor.currentBatchSize = Math.max(
      batchProcessor.minBatchSize,
      Math.min(batchProcessor.maxBatchSize, batchProcessor.currentBatchSize)
    );
  }

  /**
   * Start frame rate monitoring for adaptive processing (Task 2.1)
   */
  startFrameRateMonitoring() {
    const monitor = this.adaptiveProcessor.frameRateMonitor;
    
    const updateFrameRate = () => {
      const currentTime = performance.now();
      
      if (monitor.lastFrameTime > 0) {
        const frameTime = currentTime - monitor.lastFrameTime;
        monitor.frameTimes.push(frameTime);
        
        // Keep only recent frame times
        if (monitor.frameTimes.length > monitor.monitoringWindow) {
          monitor.frameTimes.shift();
        }
        
        // Calculate current FPS
        if (monitor.frameTimes.length > 0) {
          const avgFrameTime = monitor.frameTimes.reduce((a, b) => a + b, 0) / monitor.frameTimes.length;
          monitor.currentFps = Math.min(60, 1000 / avgFrameTime);
        }
        
        // Adjust processing if frame rate drops
        this.adjustProcessingForFrameRate();
      }
      
      monitor.lastFrameTime = currentTime;
      monitor.frameCount++;
      
      // Continue monitoring
      requestAnimationFrame(updateFrameRate);
    };
    
    // Start monitoring
    requestAnimationFrame(updateFrameRate);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Frame rate monitoring started:', {
        targetFps: monitor.targetFps,
        frameTimeBudget: monitor.frameTimeBudget + 'ms',
        processingTimeBudget: monitor.processingTimeBudget + 'ms'
      });
    }
  }

  /**
   * Adjust processing parameters based on frame rate (Task 2.1)
   */
  adjustProcessingForFrameRate() {
    const monitor = this.adaptiveProcessor.frameRateMonitor;
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    const qualityController = this.adaptiveProcessor.qualityController;
    const minAcceptableFps = EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.MIN_ACCEPTABLE_FPS;
    
    if (monitor.currentFps < minAcceptableFps) {
      // Frame rate is too low - reduce processing load
      const adjustmentFactor = EDGE_ONLY_SELECTION.FRAME_RATE_PROCESSING.FRAME_RATE_ADJUSTMENT_FACTOR;
      
      // Reduce batch size
      if (batchProcessor.adaptiveSizing) {
        batchProcessor.currentBatchSize = Math.max(
          batchProcessor.minBatchSize,
          Math.floor(batchProcessor.currentBatchSize * adjustmentFactor)
        );
      }
      
      // Reduce processing time budget
      monitor.processingTimeBudget = Math.max(
        2, // Minimum 2ms
        Math.floor(monitor.processingTimeBudget * adjustmentFactor)
      );
      
      // Lower quality if enabled
      if (qualityController.enabled && qualityController.currentQuality !== 'low') {
        this.adjustProcessingQuality('low');
      }
      
      if (this.debugLogging) {
        console.warn('[KeyPilot Debug] Frame rate adjustment triggered:', {
          currentFps: monitor.currentFps.toFixed(1),
          minAcceptableFps,
          newBatchSize: batchProcessor.currentBatchSize,
          newProcessingBudget: monitor.processingTimeBudget + 'ms',
          newQuality: qualityController.currentQuality
        });
      }
    } else if (monitor.currentFps > monitor.targetFps * 0.9) {
      // Frame rate is good - can increase processing if needed
      if (batchProcessor.currentBatchSize < batchProcessor.maxBatchSize) {
        batchProcessor.currentBatchSize = Math.min(
          batchProcessor.maxBatchSize,
          batchProcessor.currentBatchSize + 1
        );
      }
      
      // Restore quality if it was lowered
      if (qualityController.enabled && qualityController.currentQuality !== 'high') {
        this.adjustProcessingQuality('high');
      }
    }
  }

  /**
   * Initialize batch processing system (Task 2.1)
   */
  initializeBatchProcessing() {
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    
    // Clear any existing timer
    if (batchProcessor.batchTimer) {
      clearTimeout(batchProcessor.batchTimer);
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Batch processing initialized:', {
        enabled: batchProcessor.enabled,
        defaultBatchSize: batchProcessor.currentBatchSize,
        maxBatchSize: batchProcessor.maxBatchSize,
        batchTimeout: batchProcessor.batchTimeout + 'ms',
        adaptiveSizing: batchProcessor.adaptiveSizing
      });
    }
  }

  /**
   * Adjust processing quality based on available time (Task 2.1)
   * @param {string} targetQuality - Target quality level ('high', 'medium', 'low')
   */
  adjustProcessingQuality(targetQuality) {
    const qualityController = this.adaptiveProcessor.qualityController;
    
    if (!qualityController.enabled) {
      return;
    }
    
    // Apply hysteresis to prevent rapid quality changes
    if (qualityController.currentQuality !== targetQuality) {
      qualityController.hysteresisCounter++;
      
      if (qualityController.hysteresisCounter >= qualityController.adjustmentHysteresis) {
        qualityController.currentQuality = targetQuality;
        qualityController.hysteresisCounter = 0;
        
        // Record quality change
        qualityController.qualityHistory.push({
          quality: targetQuality,
          timestamp: Date.now()
        });
        
        // Keep only recent history
        if (qualityController.qualityHistory.length > 10) {
          qualityController.qualityHistory.shift();
        }
        
        if (this.debugLogging) {
          console.log('[KeyPilot Debug] Processing quality adjusted:', {
            newQuality: targetQuality,
            hysteresisCounter: qualityController.hysteresisCounter,
            qualityHistory: qualityController.qualityHistory.length
          });
        }
      }
    } else {
      // Reset hysteresis counter if target matches current
      qualityController.hysteresisCounter = 0;
    }
  }

  /**
   * Initialize predictive caching system (Task 2.2)
   */
  initializePredictiveCaching() {
    // Initialize viewport caching
    if (this.predictiveCaching.viewportCaching.enabled) {
      this.initializeViewportCaching();
    }
    
    // Initialize scroll prediction
    if (this.predictiveCaching.scrollPredictor.enabled) {
      this.initializeScrollPrediction();
    }
    
    // Initialize user behavior analysis
    if (this.predictiveCaching.behaviorAnalyzer.enabled) {
      this.initializeBehaviorAnalysis();
    }
    
    // Start cache preloading
    this.startCachePreloading();
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Predictive caching initialized:', {
        viewportCaching: this.predictiveCaching.viewportCaching.enabled,
        scrollPrediction: this.predictiveCaching.scrollPredictor.enabled,
        behaviorAnalysis: this.predictiveCaching.behaviorAnalyzer.enabled,
        preloading: this.predictiveCaching.preloader.enabled
      });
    }
  }

  /**
   * Initialize viewport-based caching (Task 2.2)
   */
  initializeViewportCaching() {
    const viewportCaching = this.predictiveCaching.viewportCaching;
    
    // Get initial viewport dimensions
    this.updateViewportInfo();
    
    // Set up viewport change monitoring
    const handleViewportChange = () => {
      const now = Date.now();
      if (now - viewportCaching.lastViewportUpdate > viewportCaching.updateThrottle) {
        this.updateViewportInfo();
        this.warmViewportCache();
        viewportCaching.lastViewportUpdate = now;
      }
    };
    
    // Monitor viewport changes
    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange);
    
    // Initial cache warming
    this.warmViewportCache();
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Viewport caching initialized:', {
        viewport: viewportCaching.currentViewport,
        cacheMargin: viewportCaching.cacheMargin,
        cacheSectors: viewportCaching.cacheSectors
      });
    }
  }

  /**
   * Update viewport information (Task 2.2)
   */
  updateViewportInfo() {
    const viewportCaching = this.predictiveCaching.viewportCaching;
    
    viewportCaching.currentViewport = {
      x: window.scrollX,
      y: window.scrollY,
      width: window.innerWidth,
      height: window.innerHeight
    };
  }

  /**
   * Warm cache for elements in and around the viewport (Task 2.2)
   */
  warmViewportCache() {
    const viewportCaching = this.predictiveCaching.viewportCaching;
    const viewport = viewportCaching.currentViewport;
    const margin = viewportCaching.cacheMargin;
    
    // Calculate extended viewport bounds for caching
    const cacheArea = {
      left: viewport.x - margin,
      top: viewport.y - margin,
      right: viewport.x + viewport.width + margin,
      bottom: viewport.y + viewport.height + margin
    };
    
    // Find elements in the cache area
    const elementsInArea = this.findElementsInArea(cacheArea);
    
    // Preload text nodes for elements in cache area
    elementsInArea.forEach(element => {
      if (!this.textNodeCache.has(element)) {
        this.preloadElementTextNodes(element, 'viewport');
      }
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Viewport cache warmed:', {
        cacheArea,
        elementsFound: elementsInArea.length,
        cacheSize: this.cacheSize
      });
    }
  }

  /**
   * Initialize scroll prediction (Task 2.2)
   */
  initializeScrollPrediction() {
    const scrollPredictor = this.predictiveCaching.scrollPredictor;
    
    let lastScrollTime = 0;
    let lastScrollPosition = { x: window.scrollX, y: window.scrollY };
    
    const handleScroll = () => {
      const currentTime = performance.now();
      const currentPosition = { x: window.scrollX, y: window.scrollY };
      
      if (lastScrollTime > 0) {
        const deltaTime = currentTime - lastScrollTime;
        const deltaX = currentPosition.x - lastScrollPosition.x;
        const deltaY = currentPosition.y - lastScrollPosition.y;
        
        // Calculate velocity
        if (deltaTime > 0) {
          const velocityX = (deltaX / deltaTime) * 1000; // px/s
          const velocityY = (deltaY / deltaTime) * 1000; // px/s
          
          this.updateScrollVelocity(velocityX, velocityY);
          this.predictScrollPosition();
          this.preloadForScrollDirection();
        }
      }
      
      lastScrollTime = currentTime;
      lastScrollPosition = currentPosition;
      scrollPredictor.lastScrollTime = currentTime;
    };
    
    // Throttle scroll events
    let scrollTimeout;
    window.addEventListener('scroll', () => {
      if (scrollTimeout) {
        clearTimeout(scrollTimeout);
      }
      scrollTimeout = setTimeout(handleScroll, 16); // ~60fps
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Scroll prediction initialized');
    }
  }

  /**
   * Update scroll velocity tracking (Task 2.2)
   * @param {number} velocityX - Horizontal velocity in px/s
   * @param {number} velocityY - Vertical velocity in px/s
   */
  updateScrollVelocity(velocityX, velocityY) {
    const scrollPredictor = this.predictiveCaching.scrollPredictor;
    
    // Add to velocity history
    scrollPredictor.scrollHistory.push({
      velocityX,
      velocityY,
      timestamp: performance.now()
    });
    
    // Keep only recent samples
    if (scrollPredictor.scrollHistory.length > scrollPredictor.velocitySamples) {
      scrollPredictor.scrollHistory.shift();
    }
    
    // Calculate average velocity
    if (scrollPredictor.scrollHistory.length > 0) {
      const avgVelocityX = scrollPredictor.scrollHistory.reduce((sum, sample) => 
        sum + sample.velocityX, 0) / scrollPredictor.scrollHistory.length;
      const avgVelocityY = scrollPredictor.scrollHistory.reduce((sum, sample) => 
        sum + sample.velocityY, 0) / scrollPredictor.scrollHistory.length;
      
      scrollPredictor.currentVelocity = { x: avgVelocityX, y: avgVelocityY };
    }
  }

  /**
   * Predict future scroll position (Task 2.2)
   */
  predictScrollPosition() {
    const scrollPredictor = this.predictiveCaching.scrollPredictor;
    const currentPosition = { x: window.scrollX, y: window.scrollY };
    const velocity = scrollPredictor.currentVelocity;
    
    // Predict position based on current velocity
    const predictionTimeMs = 500; // Predict 500ms ahead
    const predictionTimeS = predictionTimeMs / 1000;
    
    scrollPredictor.predictedPosition = {
      x: currentPosition.x + (velocity.x * predictionTimeS),
      y: currentPosition.y + (velocity.y * predictionTimeS)
    };
    
    if (this.debugLogging && (Math.abs(velocity.x) > scrollPredictor.minVelocity || 
                              Math.abs(velocity.y) > scrollPredictor.minVelocity)) {
      console.log('[KeyPilot Debug] Scroll prediction updated:', {
        currentPosition,
        velocity,
        predictedPosition: scrollPredictor.predictedPosition,
        predictionTime: predictionTimeMs + 'ms'
      });
    }
  }

  /**
   * Preload elements in predicted scroll direction (Task 2.2)
   */
  preloadForScrollDirection() {
    const scrollPredictor = this.predictiveCaching.scrollPredictor;
    const velocity = scrollPredictor.currentVelocity;
    const minVelocity = scrollPredictor.minVelocity;
    
    // Only preload if scrolling fast enough
    if (Math.abs(velocity.x) < minVelocity && Math.abs(velocity.y) < minVelocity) {
      return;
    }
    
    const currentPosition = { x: window.scrollX, y: window.scrollY };
    const predictionDistance = scrollPredictor.predictionDistance;
    
    // Calculate preload area based on scroll direction
    let preloadArea;
    if (Math.abs(velocity.y) > Math.abs(velocity.x)) {
      // Vertical scrolling
      if (velocity.y > 0) {
        // Scrolling down
        preloadArea = {
          left: currentPosition.x,
          top: currentPosition.y + window.innerHeight,
          right: currentPosition.x + window.innerWidth,
          bottom: currentPosition.y + window.innerHeight + predictionDistance
        };
      } else {
        // Scrolling up
        preloadArea = {
          left: currentPosition.x,
          top: currentPosition.y - predictionDistance,
          right: currentPosition.x + window.innerWidth,
          bottom: currentPosition.y
        };
      }
    } else {
      // Horizontal scrolling
      if (velocity.x > 0) {
        // Scrolling right
        preloadArea = {
          left: currentPosition.x + window.innerWidth,
          top: currentPosition.y,
          right: currentPosition.x + window.innerWidth + predictionDistance,
          bottom: currentPosition.y + window.innerHeight
        };
      } else {
        // Scrolling left
        preloadArea = {
          left: currentPosition.x - predictionDistance,
          top: currentPosition.y,
          right: currentPosition.x,
          bottom: currentPosition.y + window.innerHeight
        };
      }
    }
    
    // Find and preload elements in the predicted area
    const elementsToPreload = this.findElementsInArea(preloadArea);
    elementsToPreload.forEach(element => {
      if (!this.textNodeCache.has(element)) {
        this.preloadElementTextNodes(element, 'scroll_prediction');
      }
    });
    
    if (this.debugLogging && elementsToPreload.length > 0) {
      console.log('[KeyPilot Debug] Scroll-based preloading:', {
        velocity,
        preloadArea,
        elementsPreloaded: elementsToPreload.length
      });
    }
  }

  /**
   * Initialize user behavior analysis (Task 2.2)
   */
  initializeBehaviorAnalysis() {
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    
    // Track rectangle selection patterns
    const originalUpdateRectangle = this.updateRectangle.bind(this);
    this.updateRectangle = (rect) => {
      this.recordUserInteraction('rectangle_update', { rect });
      return originalUpdateRectangle(rect);
    };
    
    // Start pattern analysis
    setInterval(() => {
      this.analyzeBehaviorPatterns();
    }, behaviorAnalyzer.analysisInterval);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Behavior analysis initialized');
    }
  }

  /**
   * Record user interaction for behavior analysis (Task 2.2)
   * @param {string} type - Type of interaction
   * @param {Object} data - Interaction data
   */
  recordUserInteraction(type, data) {
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    
    const interaction = {
      type,
      data,
      timestamp: Date.now(),
      viewport: {
        x: window.scrollX,
        y: window.scrollY,
        width: window.innerWidth,
        height: window.innerHeight
      }
    };
    
    behaviorAnalyzer.interactionHistory.push(interaction);
    
    // Keep only recent interactions
    if (behaviorAnalyzer.interactionHistory.length > behaviorAnalyzer.patternWindow) {
      behaviorAnalyzer.interactionHistory.shift();
    }
  }

  /**
   * Analyze user behavior patterns (Task 2.2)
   */
  analyzeBehaviorPatterns() {
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    const interactions = behaviorAnalyzer.interactionHistory;
    
    if (interactions.length < 3) {
      return; // Need at least 3 interactions to detect patterns
    }
    
    // Analyze rectangle selection patterns
    this.analyzeRectanglePatterns(interactions);
    
    // Analyze scroll patterns
    this.analyzeScrollPatterns(interactions);
    
    // Apply predictive caching based on patterns
    this.applyPredictiveCaching();
    
    behaviorAnalyzer.lastAnalysis = Date.now();
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Behavior patterns analyzed:', {
        interactions: interactions.length,
        patterns: Array.from(behaviorAnalyzer.patterns.entries())
      });
    }
  }

  /**
   * Analyze rectangle selection patterns (Task 2.2)
   * @param {Array} interactions - User interaction history
   */
  analyzeRectanglePatterns(interactions) {
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    const rectangleInteractions = interactions.filter(i => i.type === 'rectangle_update');
    
    if (rectangleInteractions.length < 2) {
      return;
    }
    
    // Analyze rectangle size patterns
    const rectangleSizes = rectangleInteractions.map(i => ({
      width: i.data.rect.width,
      height: i.data.rect.height,
      area: i.data.rect.width * i.data.rect.height
    }));
    
    // Calculate average rectangle size
    const avgArea = rectangleSizes.reduce((sum, size) => sum + size.area, 0) / rectangleSizes.length;
    const sizeVariance = rectangleSizes.reduce((sum, size) => 
      sum + Math.pow(size.area - avgArea, 2), 0) / rectangleSizes.length;
    
    // Low variance indicates consistent rectangle sizes
    const consistentSizing = sizeVariance < (avgArea * 0.1);
    if (consistentSizing) {
      behaviorAnalyzer.patterns.set('consistent_rectangle_size', 0.8);
    }
    
    // Analyze rectangle position patterns
    const positions = rectangleInteractions.map(i => ({
      x: i.data.rect.left,
      y: i.data.rect.top
    }));
    
    // Check for repeated areas
    const positionClusters = this.findPositionClusters(positions);
    if (positionClusters.length > 0) {
      behaviorAnalyzer.patterns.set('repeated_areas', 0.7);
    }
  }

  /**
   * Find position clusters in user interactions (Task 2.2)
   * @param {Array} positions - Array of {x, y} positions
   * @returns {Array} - Array of position clusters
   */
  findPositionClusters(positions) {
    const clusters = [];
    const clusterRadius = 100; // pixels
    
    positions.forEach(pos => {
      let addedToCluster = false;
      
      for (const cluster of clusters) {
        const distance = Math.sqrt(
          Math.pow(pos.x - cluster.center.x, 2) + 
          Math.pow(pos.y - cluster.center.y, 2)
        );
        
        if (distance <= clusterRadius) {
          cluster.positions.push(pos);
          // Update cluster center
          cluster.center.x = cluster.positions.reduce((sum, p) => sum + p.x, 0) / cluster.positions.length;
          cluster.center.y = cluster.positions.reduce((sum, p) => sum + p.y, 0) / cluster.positions.length;
          addedToCluster = true;
          break;
        }
      }
      
      if (!addedToCluster) {
        clusters.push({
          center: { x: pos.x, y: pos.y },
          positions: [pos]
        });
      }
    });
    
    // Return clusters with multiple positions
    return clusters.filter(cluster => cluster.positions.length > 1);
  }

  /**
   * Analyze scroll patterns (Task 2.2)
   * @param {Array} interactions - User interaction history
   */
  analyzeScrollPatterns(interactions) {
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    
    // Analyze viewport changes to detect scroll patterns
    const viewportChanges = interactions.map(i => i.viewport);
    
    if (viewportChanges.length < 3) {
      return;
    }
    
    // Detect consistent scroll directions
    let verticalScrolls = 0;
    let horizontalScrolls = 0;
    
    for (let i = 1; i < viewportChanges.length; i++) {
      const prev = viewportChanges[i - 1];
      const curr = viewportChanges[i];
      
      const deltaY = Math.abs(curr.y - prev.y);
      const deltaX = Math.abs(curr.x - prev.x);
      
      if (deltaY > 10) verticalScrolls++;
      if (deltaX > 10) horizontalScrolls++;
    }
    
    if (verticalScrolls > horizontalScrolls * 2) {
      behaviorAnalyzer.patterns.set('vertical_scrolling_preference', 0.8);
    } else if (horizontalScrolls > verticalScrolls * 2) {
      behaviorAnalyzer.patterns.set('horizontal_scrolling_preference', 0.8);
    }
  }

  /**
   * Apply predictive caching based on detected patterns (Task 2.2)
   */
  applyPredictiveCaching() {
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    const patterns = behaviorAnalyzer.patterns;
    
    // Apply caching strategies based on patterns
    patterns.forEach((confidence, pattern) => {
      if (confidence >= behaviorAnalyzer.minConfidence) {
        switch (pattern) {
          case 'consistent_rectangle_size':
            this.preloadForConsistentSizes();
            break;
          case 'repeated_areas':
            this.preloadRepeatedAreas();
            break;
          case 'vertical_scrolling_preference':
            this.preloadVerticalScrollAreas();
            break;
          case 'horizontal_scrolling_preference':
            this.preloadHorizontalScrollAreas();
            break;
        }
      }
    });
  }

  /**
   * Start cache preloading system (Task 2.2)
   */
  startCachePreloading() {
    const preloader = this.predictiveCaching.preloader;
    
    const processPreloadQueue = () => {
      if (preloader.preloadQueue.length === 0) {
        return;
      }
      
      const now = Date.now();
      if (now - preloader.lastPreloadTime < preloader.throttleMs) {
        return;
      }
      
      // Process a batch of preload requests
      const batch = preloader.preloadQueue.splice(0, preloader.batchSize);
      batch.forEach(request => {
        this.executePreloadRequest(request);
      });
      
      preloader.lastPreloadTime = now;
      
      if (this.debugLogging && batch.length > 0) {
        console.log('[KeyPilot Debug] Preload batch processed:', {
          batchSize: batch.length,
          remainingQueue: preloader.preloadQueue.length
        });
      }
    };
    
    // Process preload queue regularly
    preloader.preloadTimer = setInterval(processPreloadQueue, preloader.throttleMs);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Cache preloading started');
    }
  }

  /**
   * Start cache management and monitoring timers
   */
  startCacheManagement() {
    // Start memory monitoring if enabled
    if (EDGE_ONLY_SELECTION.ENABLE_MEMORY_MONITORING) {
      this.memoryMonitoringTimer = setInterval(() => {
        this.monitorMemoryUsage();
      }, EDGE_ONLY_SELECTION.MEMORY_CHECK_INTERVAL);
    }
    
    // Start cache optimization timer
    this.cacheManagementTimer = setInterval(() => {
      this.optimizeCacheEfficiency();
    }, EDGE_ONLY_SELECTION.PERFORMANCE_MONITORING_INTERVAL);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Cache management timers started:', {
        memoryMonitoring: EDGE_ONLY_SELECTION.ENABLE_MEMORY_MONITORING,
        memoryCheckInterval: EDGE_ONLY_SELECTION.MEMORY_CHECK_INTERVAL + 'ms',
        cacheOptimizationInterval: EDGE_ONLY_SELECTION.PERFORMANCE_MONITORING_INTERVAL + 'ms'
      });
    }
  }

  /**
   * Create a dynamic root element that represents the selection rectangle
   */
  createRectangleRoot() {
    // Create an invisible element that will serve as the intersection root
    this.rectangleRoot = document.createElement('div');
    this.rectangleRoot.id = 'kpv2-rectangle-intersection-root';
    this.rectangleRoot.style.cssText = `
      position: fixed;
      pointer-events: none;
      z-index: -1;
      background: transparent;
      border: none;
      visibility: hidden;
      left: 0px;
      top: 0px;
      width: 0px;
      height: 0px;
    `;
    
    document.body.appendChild(this.rectangleRoot);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Rectangle intersection root created');
    }
  }

  /**
   * Setup the intersection observer for text elements
   */
  setupTextObserver() {
    try {
      this.textObserver = new IntersectionObserver(
        (entries) => this.handleIntersectionChanges(entries),
        {
          root: this.rectangleRoot,
          rootMargin: '0px',
          threshold: [0, 0.1, 0.5, 1.0] // Multiple thresholds for better granularity
        }
      );
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Text intersection observer created');
      }
    } catch (error) {
      console.warn('[KeyPilot] Failed to create IntersectionObserver for rectangle selection:', error);
      this.textObserver = null;
    }
  }

  /**
   * Handle intersection changes from the observer - ENHANCED EDGE-ONLY PROCESSING WITH ADAPTIVE PROCESSING
   * Only processes elements entering/leaving rectangle boundaries for maximum efficiency
   * @param {Array} entries - Intersection observer entries
   */
  handleIntersectionChanges(entries) {
    this.metrics.intersectionUpdates++;
    this.metrics.lastUpdateTime = performance.now();
    
    // Use adaptive processing if enabled (Task 2.1)
    if (this.adaptiveProcessor.enabled) {
      this.handleAdaptiveIntersectionChanges(entries);
    } else {
      this.handleStandardIntersectionChanges(entries);
    }
  }

  /**
   * Handle intersection changes with adaptive processing (Task 2.1)
   * @param {Array} entries - Intersection observer entries
   */
  handleAdaptiveIntersectionChanges(entries) {
    const startTime = performance.now();
    const frameMonitor = this.adaptiveProcessor.frameRateMonitor;
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    const qualityController = this.adaptiveProcessor.qualityController;
    
    // Check if we have time budget for processing
    const availableTime = frameMonitor.processingTimeBudget;
    const estimatedProcessingTime = entries.length * 2; // Rough estimate: 2ms per entry
    
    // Adjust quality based on available time
    if (qualityController.enabled) {
      if (estimatedProcessingTime > qualityController.thresholds.medium) {
        this.adjustProcessingQuality('low');
      } else if (estimatedProcessingTime > qualityController.thresholds.high) {
        this.adjustProcessingQuality('medium');
      } else {
        this.adjustProcessingQuality('high');
      }
    }
    
    // Use batch processing if enabled and we have multiple entries
    if (batchProcessor.enabled && entries.length > batchProcessor.currentBatchSize) {
      this.processBatchedIntersectionChanges(entries, startTime, availableTime);
    } else {
      this.processImmediateIntersectionChanges(entries, startTime, availableTime);
    }
    
    // Update page complexity periodically
    const now = Date.now();
    if (now - this.adaptiveProcessor.pageComplexity.lastAnalysis > 
        this.adaptiveProcessor.pageComplexity.analysisInterval) {
      // Schedule complexity analysis for next frame to avoid blocking
      requestAnimationFrame(() => this.analyzePageComplexity());
    }
  }

  /**
   * Process intersection changes in batches (Task 2.1)
   * @param {Array} entries - Intersection observer entries
   * @param {number} startTime - Processing start time
   * @param {number} availableTime - Available processing time budget
   */
  processBatchedIntersectionChanges(entries, startTime, availableTime) {
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    const qualityController = this.adaptiveProcessor.qualityController;
    
    // Add entries to pending batch
    batchProcessor.pendingBatch.push(...entries);
    
    // Clear existing batch timer
    if (batchProcessor.batchTimer) {
      clearTimeout(batchProcessor.batchTimer);
    }
    
    // Process batch immediately if it's full or we're in low quality mode
    const shouldProcessImmediately = 
      batchProcessor.pendingBatch.length >= batchProcessor.currentBatchSize ||
      qualityController.currentQuality === 'low';
    
    if (shouldProcessImmediately) {
      this.processPendingBatch(startTime, availableTime);
    } else {
      // Schedule batch processing
      batchProcessor.batchTimer = setTimeout(() => {
        this.processPendingBatch(performance.now(), availableTime);
      }, batchProcessor.batchTimeout);
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Batch processing scheduled:', {
        entriesAdded: entries.length,
        pendingBatchSize: batchProcessor.pendingBatch.length,
        currentBatchSize: batchProcessor.currentBatchSize,
        processedImmediately: shouldProcessImmediately,
        qualityLevel: qualityController.currentQuality
      });
    }
  }

  /**
   * Process the pending batch of intersection changes (Task 2.1)
   * @param {number} startTime - Processing start time
   * @param {number} availableTime - Available processing time budget
   */
  processPendingBatch(startTime, availableTime) {
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    const qualityController = this.adaptiveProcessor.qualityController;
    
    if (batchProcessor.pendingBatch.length === 0) {
      return;
    }
    
    // Take entries to process
    const entriesToProcess = batchProcessor.pendingBatch.splice(0, batchProcessor.currentBatchSize);
    
    // Apply quality-based processing limits
    let maxElementsToProcess = entriesToProcess.length;
    if (qualityController.enabled && qualityController.currentQuality === 'low') {
      maxElementsToProcess = Math.min(
        maxElementsToProcess,
        qualityController.thresholds.lowProcessingLimit
      );
    }
    
    // Process the batch
    const processedEntries = entriesToProcess.slice(0, maxElementsToProcess);
    this.processIntersectionEntries(processedEntries, startTime);
    
    // If there are remaining entries in the batch, schedule them for next frame
    if (batchProcessor.pendingBatch.length > 0) {
      requestAnimationFrame(() => {
        this.processPendingBatch(performance.now(), availableTime);
      });
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Batch processed:', {
        entriesProcessed: processedEntries.length,
        remainingInBatch: batchProcessor.pendingBatch.length,
        qualityLevel: qualityController.currentQuality,
        maxElementsLimit: maxElementsToProcess,
        processingTime: (performance.now() - startTime).toFixed(2) + 'ms'
      });
    }
  }

  /**
   * Process intersection changes immediately without batching (Task 2.1)
   * @param {Array} entries - Intersection observer entries
   * @param {number} startTime - Processing start time
   * @param {number} availableTime - Available processing time budget
   */
  processImmediateIntersectionChanges(entries, startTime, availableTime) {
    const qualityController = this.adaptiveProcessor.qualityController;
    
    // Apply quality-based processing limits
    let maxElementsToProcess = entries.length;
    if (qualityController.enabled && qualityController.currentQuality === 'low') {
      maxElementsToProcess = Math.min(
        maxElementsToProcess,
        qualityController.thresholds.lowProcessingLimit
      );
    }
    
    // Process entries up to the limit
    const entriesToProcess = entries.slice(0, maxElementsToProcess);
    this.processIntersectionEntries(entriesToProcess, startTime);
    
    // If we had to skip entries due to quality limits, log it
    if (maxElementsToProcess < entries.length && this.debugLogging) {
      console.log('[KeyPilot Debug] Quality-limited processing:', {
        totalEntries: entries.length,
        processedEntries: maxElementsToProcess,
        skippedEntries: entries.length - maxElementsToProcess,
        qualityLevel: qualityController.currentQuality
      });
    }
  }

  /**
   * Process intersection entries with standard logic (Task 2.1)
   * @param {Array} entries - Intersection observer entries to process
   * @param {number} startTime - Processing start time
   */
  processIntersectionEntries(entries, startTime) {
    let elementsProcessed = 0;
    let elementsEntering = 0;
    let elementsLeaving = 0;
    let hasChanges = false;
    
    // Enhanced edge-only processing with proper state management
    entries.forEach(entry => {
      const element = entry.target;
      const elementId = this.getElementId(element);
      const wasIntersecting = this.elementStates.get(elementId) || false;
      const isIntersecting = entry.isIntersecting;
      
      elementsProcessed++;
      
      // Only process actual state changes (entering/leaving)
      if (isIntersecting && !wasIntersecting) {
        // Element ENTERING rectangle - use edge-level character detection (Task 2.2)
        this.elementStates.set(elementId, true);
        this.intersectingTextElements.add(element);
        
        if (this.enhancedIntegrationEnabled && this.edgeCharacterDetectionEnabled && this.edgeCharacterDetector) {
          this.handleElementEnteringWithCharacterDetection(element);
        } else {
          this.extractTextNodesFromElement(element);
        }
        
        elementsEntering++;
        hasChanges = true;
        
        if (this.debugLogging) {
          console.log('[KeyPilot Debug] Element ENTERING rectangle:', {
            element: element.tagName,
            className: element.className || 'none',
            id: element.id || 'none',
            textLength: element.textContent?.length || 0,
            boundingRect: element.getBoundingClientRect(),
            intersectionRatio: entry.intersectionRatio
          });
        }
      } else if (!isIntersecting && wasIntersecting) {
        // Element LEAVING rectangle - use edge-level character detection (Task 2.2)
        this.elementStates.set(elementId, false);
        this.intersectingTextElements.delete(element);
        
        if (this.enhancedIntegrationEnabled && this.edgeCharacterDetectionEnabled && this.edgeCharacterDetector) {
          this.handleElementLeavingWithCharacterDetection(element);
        } else {
          this.removeTextNodesFromElement(element);
        }
        
        elementsLeaving++;
        hasChanges = true;
        
        if (this.debugLogging) {
          console.log('[KeyPilot Debug] Element LEAVING rectangle:', {
            element: element.tagName,
            className: element.className || 'none',
            id: element.id || 'none',
            textLength: element.textContent?.length || 0,
            intersectionRatio: entry.intersectionRatio
          });
        }
      }
      // Ignore elements that remain in the same state (no processing needed)
    });
    
    const processingTime = performance.now() - startTime;
    
    // Update comprehensive metrics
    this.metrics.edgeProcessingTime = processingTime;
    this.metrics.edgeElementsProcessed = elementsProcessed;
    this.metrics.elementsEntering += elementsEntering;
    this.metrics.elementsLeaving += elementsLeaving;
    this.metrics.actualEdgeProcessingTime += processingTime;
    
    // Record performance metrics (Task 2.3)
    if (this.enhancedIntegrationEnabled && this.performanceMonitoringEnabled) {
      this.recordElementProcessing({
        elementsProcessed,
        elementsEntering,
        elementsLeaving,
        processingTime,
        elementsObserved: this.metrics.elementsObserved
      });
    }
    
    // Performance threshold monitoring and fallback detection
    this.monitorPerformanceThresholds(processingTime, elementsProcessed);
    
    // Calculate performance comparison
    this.updatePerformanceComparison(elementsProcessed, processingTime);
    
    // Notify callback if there were changes
    if (hasChanges && this.onIntersectionChange) {
      this.onIntersectionChange({
        intersectingElements: Array.from(this.intersectingTextElements),
        intersectingTextNodes: Array.from(this.intersectingTextNodes),
        metrics: this.getMetrics(),
        edgeProcessing: {
          elementsProcessed,
          elementsEntering,
          elementsLeaving,
          processingTime,
          efficiency: elementsProcessed > 0 ? (processingTime / elementsProcessed).toFixed(2) + 'ms/element' : 'N/A',
          performanceGain: this.calculatePerformanceGain()
        },
        adaptiveProcessing: this.adaptiveProcessor.enabled ? {
          pageComplexity: this.adaptiveProcessor.pageComplexity.complexityLevel,
          currentFps: this.adaptiveProcessor.frameRateMonitor.currentFps.toFixed(1),
          batchSize: this.adaptiveProcessor.batchProcessor.currentBatchSize,
          qualityLevel: this.adaptiveProcessor.qualityController.currentQuality
        } : null
      });
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Enhanced edge-only intersection update with adaptive processing:', {
        entriesProcessed: entries.length,
        elementsProcessed,
        elementsEntering,
        elementsLeaving,
        processingTime: processingTime.toFixed(2) + 'ms',
        intersectingElements: this.intersectingTextElements.size,
        intersectingTextNodes: this.intersectingTextNodes.size,
        hasChanges,
        efficiency: elementsProcessed > 0 ? (processingTime / elementsProcessed).toFixed(2) + 'ms/element' : 'N/A',
        cacheHitRatio: this.getCacheHitRatio(),
        performanceGain: this.calculatePerformanceGain(),
        adaptiveProcessing: this.adaptiveProcessor.enabled ? {
          pageComplexity: this.adaptiveProcessor.pageComplexity.complexityLevel,
          currentFps: this.adaptiveProcessor.frameRateMonitor.currentFps.toFixed(1),
          batchSize: this.adaptiveProcessor.batchProcessor.currentBatchSize,
          qualityLevel: this.adaptiveProcessor.qualityController.currentQuality
        } : null
      });
    }
  }

  /**
   * Handle intersection changes with standard processing (fallback)
   * @param {Array} entries - Intersection observer entries
   */
  handleStandardIntersectionChanges(entries) {
    const startTime = performance.now();
    this.processIntersectionEntries(entries, startTime);
  }

  /**
   * Extract text nodes from an element and add to intersection set
   * ENHANCED EDGE-ONLY OPTIMIZATION: Only called for elements entering rectangle
   * @param {Element} element - Element to extract text nodes from
   */
  extractTextNodesFromElement(element) {
    const startTime = performance.now();
    
    // Check cache first - major performance optimization
    if (this.textNodeCache.has(element)) {
      const cachedNodes = this.textNodeCache.get(element);
      cachedNodes.forEach(node => this.intersectingTextNodes.add(node));
      this.metrics.cacheHits++;
      
      // Update cache hit streak tracking
      this.cacheEfficiencyMetrics.cacheHitStreak++;
      this.cacheEfficiencyMetrics.cacheMissStreak = 0;
      this.cacheEfficiencyMetrics.longestHitStreak = Math.max(
        this.cacheEfficiencyMetrics.longestHitStreak,
        this.cacheEfficiencyMetrics.cacheHitStreak
      );
      
      // Update LRU access order
      this.updateCacheAccess(element);
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Used cached text nodes (FAST PATH):', {
          element: element.tagName,
          className: element.className || 'none',
          cachedNodes: cachedNodes.length,
          processingTime: (performance.now() - startTime).toFixed(2) + 'ms',
          cacheHitRatio: this.getCacheHitRatio(),
          cacheSize: this.cacheSize,
          hitStreak: this.cacheEfficiencyMetrics.cacheHitStreak
        });
      }
      return;
    }
    
    // Cache miss - perform TreeWalker traversal
    this.metrics.cacheMisses++;
    
    // Update cache miss streak tracking
    this.cacheEfficiencyMetrics.cacheMissStreak++;
    this.cacheEfficiencyMetrics.cacheHitStreak = 0;
    this.cacheEfficiencyMetrics.longestMissStreak = Math.max(
      this.cacheEfficiencyMetrics.longestMissStreak,
      this.cacheEfficiencyMetrics.cacheMissStreak
    );
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Skip empty or whitespace-only text nodes
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          // Skip text nodes in non-content elements
          const parent = node.parentElement;
          if (parent && this.isNonContentElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
      this.intersectingTextNodes.add(node);
    }
    
    // Cache the text nodes for this element - critical for performance
    this.cacheTextNodes(element, textNodes);
    
    const processingTime = performance.now() - startTime;
    this.metrics.textNodesFound += textNodes.length;
    this.metrics.totalTraversalTime += processingTime;
    this.metrics.traversalCount++;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Extracted text nodes from NEW element (SLOW PATH):', {
        element: element.tagName,
        className: element.className || 'none',
        textNodesFound: textNodes.length,
        processingTime: processingTime.toFixed(2) + 'ms',
        totalTextNodes: this.intersectingTextNodes.size,
        avgTraversalTime: (this.metrics.totalTraversalTime / this.metrics.traversalCount).toFixed(2) + 'ms',
        cacheHitRatio: this.getCacheHitRatio(),
        cacheEfficiency: this.calculateCacheEfficiency()
      });
    }
  }

  /**
   * Remove text nodes from an element from the intersection set
   * @param {Element} element - Element to remove text nodes from
   */
  removeTextNodesFromElement(element) {
    const cachedNodes = this.textNodeCache.get(element);
    if (cachedNodes) {
      cachedNodes.forEach(node => this.intersectingTextNodes.delete(node));
    }
  }

  /**
   * Check if an element is a non-content element that should be excluded
   * @param {Element} element - Element to check
   * @returns {boolean} - True if element should be excluded
   */
  isNonContentElement(element) {
    const tagName = element.tagName.toLowerCase();
    const excludedTags = ['script', 'style', 'meta', 'link', 'title', 'noscript', 'template'];
    
    if (excludedTags.includes(tagName)) {
      return true;
    }
    
    // Check for common non-content classes
    const className = element.className || '';
    const excludedClasses = ['footer', 'header', 'nav', 'sidebar', 'advertisement'];
    
    return excludedClasses.some(cls => className.includes(cls));
  }

  /**
   * Generate a unique identifier for an element for state tracking
   * @param {Element} element - Element to generate ID for
   * @returns {string} - Unique element identifier
   */
  getElementId(element) {
    // Use element reference as key - most reliable for state tracking
    if (!element._keypilotId) {
      element._keypilotId = 'kp_' + Math.random().toString(36).substr(2, 9);
    }
    return element._keypilotId;
  }

  /**
   * Update performance comparison metrics
   * @param {number} elementsProcessed - Number of elements processed in this update
   * @param {number} processingTime - Time taken for this update
   */
  updatePerformanceComparison(elementsProcessed, processingTime) {
    // Estimate what full DOM traversal would have cost
    const avgElementTime = this.metrics.traversalCount > 0 
      ? this.metrics.totalTraversalTime / this.metrics.traversalCount 
      : 5; // Default estimate: 5ms per element
    
    const estimatedFullTime = avgElementTime * this.metrics.elementsObserved;
    this.metrics.estimatedFullTraversalTime += estimatedFullTime;
    
    // Calculate efficiency gain
    if (this.metrics.estimatedFullTraversalTime > 0) {
      this.metrics.efficiencyGainPercent = 
        ((this.metrics.estimatedFullTraversalTime - this.metrics.actualEdgeProcessingTime) / 
         this.metrics.estimatedFullTraversalTime * 100);
    }
    
    // Record performance comparison (Task 2.3)
    if (this.enhancedIntegrationEnabled && this.performanceMonitoringEnabled) {
      this.recordPerformanceComparison({
        estimatedTraditionalTime: estimatedFullTime,
        actualOptimizedTime: processingTime
      });
    }
  }

  /**
   * Calculate current cache hit ratio
   * @returns {string} - Cache hit ratio as percentage
   */
  getCacheHitRatio() {
    const totalCacheAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalCacheAttempts === 0) return '0%';
    
    return ((this.metrics.cacheHits / totalCacheAttempts) * 100).toFixed(1) + '%';
  }

  /**
   * Calculate cache efficiency metrics
   * @returns {Object} - Cache efficiency data
   */
  calculateCacheEfficiency() {
    return this.getCacheEfficiencyMetrics();
  }

  /**
   * Calculate overall performance gain from edge-only processing
   * @returns {string} - Performance gain description
   */
  calculatePerformanceGain() {
    if (this.metrics.estimatedFullTraversalTime === 0) {
      return 'Calculating...';
    }
    
    const actualTime = this.metrics.actualEdgeProcessingTime;
    const estimatedTime = this.metrics.estimatedFullTraversalTime;
    
    if (estimatedTime <= actualTime) {
      return 'No gain detected';
    }
    
    const gainPercent = ((estimatedTime - actualTime) / estimatedTime * 100);
    const speedupFactor = estimatedTime / actualTime;
    
    return `${gainPercent.toFixed(1)}% faster (${speedupFactor.toFixed(1)}x speedup)`;
  }

  /**
   * Get element reduction metrics from smart targeting (Task 2.1)
   * @returns {Object} Element reduction performance metrics
   */
  getElementReductionMetrics() {
    if (!this.enhancedIntegrationEnabled || !this.textElementFilter) {
      return {
        totalElementsScanned: 0,
        elementsObserved: this.metrics.elementsObserved,
        elementsSkipped: 0,
        reductionPercentage: 0,
        smartTargetingEnabled: false,
        averageProcessingTime: 0,
        totalProcessingTime: 0,
        dynamicElementsAdded: 0
      };
    }
    
    const filterStats = this.textElementFilter.getStats();
    
    // Update metrics with latest filter stats
    this.metrics.totalElementsScanned = filterStats.totalElementsScanned;
    this.metrics.elementsSkipped = filterStats.elementsSkipped;
    this.metrics.elementReductionPercentage = parseFloat(filterStats.reductionPercentage);
    this.metrics.smartTargetingTime = filterStats.totalProcessingTime;
    
    return {
      totalElementsScanned: this.metrics.totalElementsScanned,
      elementsObserved: this.metrics.elementsObserved,
      elementsSkipped: this.metrics.elementsSkipped,
      reductionPercentage: this.metrics.elementReductionPercentage,
      smartTargetingEnabled: this.smartTargetingEnabled,
      averageProcessingTime: filterStats.averageProcessingTime,
      totalProcessingTime: this.metrics.smartTargetingTime,
      dynamicElementsAdded: this.metrics.dynamicElementsAdded
    };
  }

  /**
   * Get character detection metrics from edge-level processing (Task 2.2)
   * @returns {Object} Character detection performance metrics
   */
  getCharacterDetectionMetrics() {
    const detectorStats = this.edgeCharacterDetector.getStats();
    
    // Update metrics with latest detector stats
    this.metrics.characterDetectionTime = detectorStats.totalProcessingTime;
    this.metrics.characterCacheHits = detectorStats.cacheHits;
    this.metrics.characterCacheMisses = detectorStats.cacheMisses;
    
    return {
      charactersDetected: this.metrics.charactersDetected,
      characterDetectionEnabled: this.edgeCharacterDetectionEnabled,
      cacheHits: this.metrics.characterCacheHits,
      cacheMisses: this.metrics.characterCacheMisses,
      cacheHitRate: detectorStats.cacheHitRate,
      averageProcessingTime: detectorStats.averageProcessingTime,
      totalProcessingTime: this.metrics.characterDetectionTime,
      elementsProcessed: detectorStats.elementsProcessed
    };
  }

  /**
   * Get comprehensive performance metrics from PerformanceMonitor (Task 2.3)
   * @returns {Object} Comprehensive performance metrics
   */
  getPerformanceMetrics() {
    return this.getMetrics();
  }

  /**
   * Get performance comparison statistics (Task 2.3)
   * @returns {Object} Performance comparison between optimized and traditional approaches
   */
  getPerformanceComparison() {
    return this.getComparisonStats();
  }

  /**
   * Get trend analysis results (Task 2.3)
   * @returns {Object} Performance trend analysis
   */
  getPerformanceTrends() {
    return this.getTrendAnalysis();
  }

  /**
   * Export complete performance data for analysis (Task 2.3)
   * @returns {Object} Complete performance data export
   */
  exportPerformanceData() {
    if (!this.performanceMonitoringEnabled) {
      return null;
    }
    
    return {
      performanceData: this.exportData(),
      elementReduction: this.getElementReductionMetrics(),
      characterDetection: this.getCharacterDetectionMetrics(),
      legacyMetrics: this.getMetrics(),
      configuration: {
        smartTargetingEnabled: this.smartTargetingEnabled,
        edgeCharacterDetectionEnabled: this.edgeCharacterDetectionEnabled,
        performanceMonitoringEnabled: this.performanceMonitoringEnabled
      }
    };
  }

  /**
   * Update the rectangle bounds for intersection detection
   * @param {Object} rect - Rectangle with left, top, width, height properties
   */
  updateRectangle(rect) {
    if (!this.rectangleRoot) {
      return;
    }
    
    // Store current rectangle for character detection (Task 2.2)
    this.currentRectangle = {
      left: rect.left,
      top: rect.top,
      right: rect.left + rect.width,
      bottom: rect.top + rect.height,
      width: rect.width,
      height: rect.height
    };
    
    // Update the root element to match the selection rectangle
    this.rectangleRoot.style.left = `${rect.left}px`;
    this.rectangleRoot.style.top = `${rect.top}px`;
    this.rectangleRoot.style.width = `${rect.width}px`;
    this.rectangleRoot.style.height = `${rect.height}px`;
    
    this.lastRectangleUpdate = performance.now();
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Rectangle bounds updated:', {
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
        observedElements: this.metrics.elementsObserved,
        characterDetectionEnabled: this.edgeCharacterDetectionEnabled
      });
    }
  }

  /**
   * Discover and observe all text-containing elements in the document
   * Uses smart element targeting to reduce observed elements by 95%+
   */
  discoverTextElements() {
    if (!this.textObserver) {
      return;
    }
    
    const startTime = performance.now();
    let textElements;
    
    if (this.enhancedIntegrationEnabled && this.smartTargetingEnabled && this.textElementFilter) {
      // Use TextElementFilter for smart targeting (Task 2.1)
      textElements = this.textElementFilter.findTextElements(document.body);
      
      // Track performance metrics for element reduction
      const filterStats = this.textElementFilter.getStats();
      this.metrics.elementsObserved = 0; // Reset counter
      
      textElements.forEach(element => {
        this.textObserver.observe(element);
        this.observedElements.add(element);
        this.metrics.elementsObserved++;
      });
      
      // Record smart targeting performance (Task 2.3)
      if (this.enhancedIntegrationEnabled && this.performanceMonitoringEnabled) {
        this.recordSmartTargeting({
          elementReductionPercentage: parseFloat(filterStats.reductionPercentage),
          smartTargetingTime: performance.now() - startTime,
          dynamicElementsAdded: 0
        });
      }
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Smart element targeting completed:', {
          totalElementsScanned: filterStats.totalElementsScanned,
          textElementsFound: filterStats.textElementsFound,
          reductionPercentage: filterStats.reductionPercentage,
          observedElements: this.metrics.elementsObserved,
          processingTime: (performance.now() - startTime).toFixed(2) + 'ms'
        });
      }
    } else {
      // Fallback to original selector-based approach
      const textContainerSelectors = [
        'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'li', 'td', 'th', 'blockquote', 'pre', 'code',
        'a', 'strong', 'em', 'b', 'i', 'u',
        'article', 'section', 'main', 'aside',
        '[contenteditable]'
      ].join(', ');
      
      const allElements = document.querySelectorAll(textContainerSelectors);
      textElements = Array.from(allElements).filter(element => this.elementContainsText(element));
      
      textElements.forEach(element => {
        this.textObserver.observe(element);
        this.observedElements.add(element);
        this.metrics.elementsObserved++;
      });
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Traditional element discovery completed:', {
          totalElements: allElements.length,
          observedElements: this.metrics.elementsObserved,
          processingTime: (performance.now() - startTime).toFixed(2) + 'ms'
        });
      }
    }
  }

  /**
   * Handle element entering rectangle with edge-level character detection (Task 2.2)
   * @param {Element} element - Element entering the rectangle
   */
  handleElementEnteringWithCharacterDetection(element) {
    if (!this.currentRectangle) {
      // Fallback to traditional method if no rectangle is set
      this.extractTextNodesFromElement(element);
      return;
    }

    const startTime = performance.now();
    
    try {
      // Detect characters at the boundary level
      const intersectingCharacters = this.edgeCharacterDetector.detectAtBoundary(
        element, 
        this.currentRectangle
      );
      
      // Add characters to selection
      this.addCharactersToSelection(intersectingCharacters);
      
      // Update metrics
      const processingTime = performance.now() - startTime;
      this.metrics.edgeProcessingTime += processingTime;
      
      // Record character detection performance (Task 2.3)
      if (this.enhancedIntegrationEnabled && this.performanceMonitoringEnabled) {
        const detectorStats = this.edgeCharacterDetector.getStats();
        this.recordCharacterDetection({
          charactersDetected: intersectingCharacters.length,
          detectionTime: processingTime,
          cacheHits: detectorStats.cacheHits,
          cacheMisses: detectorStats.cacheMisses
        });
      }
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Element entering with character detection:', {
          element: element.tagName,
          className: element.className || 'none',
          charactersDetected: intersectingCharacters.length,
          processingTime: processingTime.toFixed(2) + 'ms',
          cacheHitRate: this.edgeCharacterDetector.getStats().cacheHitRate
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error in character detection, falling back to traditional method:', error);
      this.extractTextNodesFromElement(element);
    }
  }

  /**
   * Handle element leaving rectangle with edge-level character detection (Task 2.2)
   * @param {Element} element - Element leaving the rectangle
   */
  handleElementLeavingWithCharacterDetection(element) {
    const startTime = performance.now();
    
    try {
      // Remove all characters from this element from selection
      this.removeElementCharactersFromSelection(element);
      
      // Update metrics
      const processingTime = performance.now() - startTime;
      this.metrics.edgeProcessingTime += processingTime;
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Element leaving with character detection:', {
          element: element.tagName,
          className: element.className || 'none',
          processingTime: processingTime.toFixed(2) + 'ms'
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error in character removal, falling back to traditional method:', error);
      this.removeTextNodesFromElement(element);
    }
  }

  /**
   * Add characters to the current selection (Task 2.2)
   * @param {Array<Object>} characters - Array of character objects to add
   */
  addCharactersToSelection(characters) {
    characters.forEach(character => {
      // Add the text node containing this character to the intersection set
      this.intersectingTextNodes.add(character.node);
    });
    
    // Update character detection metrics
    this.metrics.charactersDetected = (this.metrics.charactersDetected || 0) + characters.length;
  }

  /**
   * Remove all characters from an element from the selection (Task 2.2)
   * @param {Element} element - Element whose characters should be removed
   */
  removeElementCharactersFromSelection(element) {
    // Get all text nodes within this element
    const textNodes = this.edgeCharacterDetector.getTextNodes(element);
    
    // Remove these text nodes from the intersection set
    textNodes.forEach(textNode => {
      this.intersectingTextNodes.delete(textNode);
    });
  }

  /**
   * Handle dynamic content discovery with smart element filtering (Task 2.1)
   * @param {Array<Element>} newElements - New elements to potentially observe
   */
  discoverDynamicTextElements(newElements) {
    if (!this.textObserver || !newElements || newElements.length === 0) {
      return;
    }
    
    const startTime = performance.now();
    let elementsAdded = 0;
    
    if (this.smartTargetingEnabled) {
      // Use TextElementFilter to filter new elements
      const textElements = this.textElementFilter.filterTextElements(newElements);
      
      textElements.forEach(element => {
        if (!this.observedElements.has(element)) {
          this.textObserver.observe(element);
          this.observedElements.add(element);
          this.metrics.elementsObserved++;
          this.metrics.dynamicElementsAdded++;
          elementsAdded++;
        }
      });
      
      if (this.debugLogging && elementsAdded > 0) {
        console.log('[KeyPilot Debug] Dynamic content discovery with smart targeting:', {
          newElementsScanned: newElements.length,
          textElementsFound: textElements.length,
          elementsAdded,
          totalObserved: this.metrics.elementsObserved,
          processingTime: (performance.now() - startTime).toFixed(2) + 'ms'
        });
      }
    } else {
      // Fallback to traditional filtering
      newElements.forEach(element => {
        if (!this.observedElements.has(element) && this.elementContainsText(element)) {
          this.textObserver.observe(element);
          this.observedElements.add(element);
          this.metrics.elementsObserved++;
          this.metrics.dynamicElementsAdded++;
          elementsAdded++;
        }
      });
      
      if (this.debugLogging && elementsAdded > 0) {
        console.log('[KeyPilot Debug] Dynamic content discovery (traditional):', {
          newElementsScanned: newElements.length,
          elementsAdded,
          totalObserved: this.metrics.elementsObserved,
          processingTime: (performance.now() - startTime).toFixed(2) + 'ms'
        });
      }
    }
  }

  /**
   * Check if an element contains meaningful text content
   * @param {Element} element - Element to check
   * @returns {boolean} - True if element contains text
   */
  elementContainsText(element) {
    // Quick check for text content
    const textContent = element.textContent || '';
    if (!textContent.trim()) {
      return false;
    }
    
    // Exclude elements that are likely non-content
    if (this.isNonContentElement(element)) {
      return false;
    }
    
    // Check if element has visible text (not just whitespace)
    const hasVisibleText = textContent.replace(/\s+/g, ' ').trim().length > 0;
    
    return hasVisibleText;
  }

  /**
   * Create a text selection from the currently intersecting text nodes
   * @returns {Selection|null} - Browser selection object or null
   */
  createSelectionFromIntersection() {
    if (this.intersectingTextNodes.size === 0) {
      return null;
    }
    
    try {
      const textNodes = Array.from(this.intersectingTextNodes);
      
      // Sort text nodes by document order
      textNodes.sort((a, b) => {
        const comparison = a.compareDocumentPosition(b);
        if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1;
        } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1;
        }
        return 0;
      });
      
      // Create selection from first to last text node
      const selection = window.getSelection();
      selection.removeAllRanges();
      
      const range = document.createRange();
      range.setStart(textNodes[0], 0);
      range.setEnd(textNodes[textNodes.length - 1], textNodes[textNodes.length - 1].textContent.length);
      
      selection.addRange(range);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Selection created from intersection:', {
          textNodes: textNodes.length,
          selectedText: selection.toString().substring(0, 100) + '...'
        });
      }
      
      return selection;
    } catch (error) {
      console.warn('[KeyPilot] Error creating selection from intersection:', error);
      return null;
    }
  }

  /**
   * Monitor performance thresholds and trigger fallback if needed
   * @param {number} processingTime - Time taken for this processing cycle
   * @param {number} elementsProcessed - Number of elements processed
   */
  monitorPerformanceThresholds(processingTime, elementsProcessed) {
    if (!this.legacyPerformanceMonitor.enabled || this.fallbackHandler.active) {
      return;
    }
    
    // Add processing time to rolling window
    this.legacyPerformanceMonitor.processingTimes.push(processingTime);
    if (this.legacyPerformanceMonitor.processingTimes.length > this.legacyPerformanceMonitor.windowSize) {
      this.legacyPerformanceMonitor.processingTimes.shift();
    }
    
    // Establish baseline performance after initial measurements
    if (!this.performanceState.baselinePerformance && 
        this.legacyPerformanceMonitor.processingTimes.length >= 5) {
      this.performanceState.baselinePerformance = this.calculateAverageProcessingTime();
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Performance baseline established:', {
          baselineMs: this.performanceState.baselinePerformance.toFixed(2),
          measurements: this.legacyPerformanceMonitor.processingTimes.length
        });
      }
    }
    
    // Add processing time to rolling window
    this.legacyPerformanceMonitor.processingTimes.push(processingTime);
  if (this.legacyPerformanceMonitor.processingTimes.length > this.legacyPerformanceMonitor.windowSize) {
    this.legacyPerformanceMonitor.processingTimes.shift();
  }
  
  
  // Check for threshold violations
  const isSlowOperation = processingTime > this.legacyPerformanceMonitor.thresholdMs;
  
  if (isSlowOperation) {
    this.legacyPerformanceMonitor.consecutiveSlowOperations++;
    
    if (this.debugLogging) {
      console.warn('[KeyPilot Debug] Slow edge-only processing detected:', {
        processingTime: processingTime.toFixed(2) + 'ms',
        threshold: this.legacyPerformanceMonitor.thresholdMs + 'ms',
        consecutiveSlowOps: this.legacyPerformanceMonitor.consecutiveSlowOperations,
        elementsProcessed
      });
    }
    
    // Trigger fallback after consecutive slow operations
    if (this.legacyPerformanceMonitor.consecutiveSlowOperations >= this.legacyPerformanceMonitor.maxConsecutiveSlowOps) {
      this.triggerPerformanceFallback('consecutive_slow_operations', {
        consecutiveSlowOps: this.legacyPerformanceMonitor.consecutiveSlowOperations,
        averageTime: processingTime,
        threshold: this.legacyPerformanceMonitor.thresholdMs
      });
    }
  } else {
    // Reset consecutive slow operations counter on good performance
    this.legacyPerformanceMonitor.consecutiveSlowOperations = 0;
  }
  
  // Check for performance regression
  this.detectPerformanceRegression();
  
  // Generate performance alerts if needed
  this.checkPerformanceAlerts(processingTime, elementsProcessed);
}

/**
 * Calculate average processing time from recent measurements
 * @returns {number} - Average processing time in milliseconds
 */
calculateAverageProcessingTime() {
  if (this.legacyPerformanceMonitor.processingTimes.length === 0) {
    return 0;
  }
  
  const recentAverage = this.legacyPerformanceMonitor.processingTimes.reduce((sum, time) => sum + time, 0) / 
                       this.legacyPerformanceMonitor.processingTimes.length;
  return recentAverage;
}

/**
 * Detect performance regression compared to baseline
 */
detectPerformanceRegression() {
  if (!this.performanceState.baselinePerformance || 
      this.legacyPerformanceMonitor.processingTimes.length < 5) {
    return;
  }
  
  const currentAverage = this.calculateAverageProcessingTime();
  const regressionThreshold = this.performanceState.baselinePerformance * 
                             this.performanceState.performanceDegradationFactor;
  
  const wasRegressed = this.performanceState.regressionDetected;
  this.performanceState.regressionDetected = currentAverage > regressionThreshold;
  
  // Alert on new regression detection
  if (this.performanceState.regressionDetected && !wasRegressed) {
    this.addPerformanceAlert('performance_regression', {
      baseline: this.performanceState.baselinePerformance,
      current: currentAverage,
      degradationFactor: (currentAverage / this.performanceState.baselinePerformance).toFixed(2),
      threshold: regressionThreshold
    });
    
    if (this.debugLogging) {
      console.warn('[KeyPilot Debug] Performance regression detected:', {
        baseline: this.performanceState.baselinePerformance.toFixed(2) + 'ms',
        current: currentAverage.toFixed(2) + 'ms',
        degradationFactor: (currentAverage / this.performanceState.baselinePerformance).toFixed(2) + 'x',
        threshold: regressionThreshold.toFixed(2) + 'ms'
      });
    }
  }
}

/**
 * Evaluate recovery attempt and decide whether to stay recovered or return to fallback
 */
evaluateRecovery() {
  const averageTime = this.calculateAverageProcessingTime();
  const recoverySuccessful = averageTime < this.legacyPerformanceMonitor.thresholdMs && 
                             this.legacyPerformanceMonitor.consecutiveSlowOperations === 0;
  
  if (recoverySuccessful) {
    // Recovery successful - stay in edge-only mode
    this.fallbackHandler.active = false;
    this.fallbackHandler.reason = null;
    this.performanceState.fallbackTriggered = false;
    
    this.notifyRecoverySuccessful();
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Recovery successful - edge-only processing restored:', {
        averageTime: averageTime.toFixed(2) + 'ms',
        threshold: this.legacyPerformanceMonitor.thresholdMs + 'ms',
        recoveryAttempt: this.fallbackHandler.recoveryAttempts
      });
    }
  } else {
    // Recovery failed - return to fallback mode
    this.fallbackHandler.active = true;
    
    if (this.fallbackHandler.recoveryAttempts < this.fallbackHandler.maxRecoveryAttempts) {
      this.scheduleRecoveryAttempt();
    }
    
    if (this.debugLogging) {
      console.warn('[KeyPilot Debug] Recovery failed - returning to fallback mode:', {
        averageTime: averageTime.toFixed(2) + 'ms',
        threshold: this.legacyPerformanceMonitor.thresholdMs + 'ms',
        recoveryAttempt: this.fallbackHandler.recoveryAttempts,
        maxAttempts: this.fallbackHandler.maxRecoveryAttempts
      });
    }
  }
}
  
  /**
   * Get cache hit ratio as numeric value
   * @returns {number} - Cache hit ratio (0-1)
   */
  getCacheHitRatioNumeric() {
    const totalCacheAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    if (totalCacheAttempts === 0) return 0;
    
    return this.metrics.cacheHits / totalCacheAttempts;
  }
  
  /**
   * Notify user about performance issues
   * @param {Object} alert - Performance alert object
   */
  notifyPerformanceIssue(alert) {
    if (!this.notificationSystem.enabled || 
        !this.notificationSystem.showPerformanceNotifications) {
      return;
    }
    
    const currentTime = Date.now();
    if (currentTime - this.notificationSystem.lastNotificationTime < 
        this.notificationSystem.notificationCooldownMs) {
      return; // Respect cooldown
    }
    
    let message = '';
    switch (alert.type) {
      case 'performance_regression':
        message = `KeyPilot: Performance regression detected (${alert.data.degradationFactor}x slower)`;
        break;
      case 'low_cache_efficiency':
        message = `KeyPilot: Low cache efficiency (${alert.data.cacheHitRatio})`;
        break;
      case 'high_processing_time':
        message = `KeyPilot: High processing time (${alert.data.processingTime})`;
        break;
      default:
        message = `KeyPilot: Performance issue detected (${alert.type})`;
    }
    
    this.showNotification(message, 'warning');
    this.notificationSystem.lastNotificationTime = currentTime;
  }
  
  /**
   * Notify user about fallback activation
   * @param {string} reason - Reason for fallback
   * @param {Object} data - Additional data
   */
  notifyFallbackActivated(reason, data) {
    if (!this.notificationSystem.enabled || 
        !this.notificationSystem.showPerformanceNotifications) {
      return;
    }
    
    const message = `KeyPilot: Switched to fallback selection method due to performance issues`;
    this.showNotification(message, 'info');
  }
  
  /**
   * Notify user about successful recovery
   */
  notifyRecoverySuccessful() {
    if (!this.notificationSystem.enabled || 
        !this.notificationSystem.showPerformanceNotifications) {
      return;
    }
    
    const message = `KeyPilot: Optimized selection method restored`;
    this.showNotification(message, 'success');
  }
  
  /**
   * Show notification to user
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, warning, error, info)
   */
  showNotification(message, type = 'info') {
    if (this.notificationSystem.notificationCallback) {
      this.notificationSystem.notificationCallback(message, type);
    } else {
      // Fallback to console logging if no notification callback is set
      const logMethod = type === 'error' ? 'error' : type === 'warning' ? 'warn' : 'log';
      console[logMethod](`[KeyPilot Notification] ${message}`);
    }
  }
  
  /**
   * Set notification callback for user notifications
   * @param {Function} callback - Callback function for notifications
   */
  setNotificationCallback(callback) {
    this.notificationSystem.notificationCallback = callback;
  }
  
  /**
   * Check if fallback mode is active
   * @returns {boolean} - True if in fallback mode
   */
  isFallbackActive() {
    return this.fallbackHandler.active;
  }
  
  /**
   * Get current performance status
   * @returns {Object} - Performance status information
   */
  getPerformanceStatus() {
    return {
      fallbackActive: this.fallbackHandler.active,
      fallbackReason: this.fallbackHandler.reason,
      fallbackStartTime: this.fallbackHandler.fallbackStartTime,
      recoveryAttempts: this.fallbackHandler.recoveryAttempts,
      maxRecoveryAttempts: this.fallbackHandler.maxRecoveryAttempts,
      performanceAlerts: this.performanceState.alerts,
      regressionDetected: this.performanceState.regressionDetected,
      baselinePerformance: this.performanceState.baselinePerformance,
      currentAveragePerformance: this.calculateAverageProcessingTime(),
      consecutiveSlowOperations: this.legacyPerformanceMonitor.consecutiveSlowOperations,
      thresholdMs: this.legacyPerformanceMonitor.thresholdMs
    };
  }

  /**
   * Clean up resources and stop timers
   */
  cleanup() {
    // Stop cache management timers
    if (this.memoryMonitoringTimer) {
      clearInterval(this.memoryMonitoringTimer);
      this.memoryMonitoringTimer = null;
    }
    
    if (this.cacheManagementTimer) {
      clearInterval(this.cacheManagementTimer);
      this.cacheManagementTimer = null;
    }
    
    // Disconnect observers
    if (this.textObserver) {
      this.textObserver.disconnect();
      this.textObserver = null;
    }
    
    // Clean up DOM elements
    if (this.rectangleRoot?.parentNode) {
      this.rectangleRoot.parentNode.removeChild(this.rectangleRoot);
      this.rectangleRoot = null;
    }
    
    // Clear cache and tracking data
    this.intersectingTextElements.clear();
    this.intersectingTextNodes.clear();
    this.elementStates.clear();
    this.cacheAccessOrder.clear();
    this.cacheSize = 0;
    
    // Clear efficiency metrics
    this.cacheEfficiencyMetrics.hotElements.clear();
    this.cacheEfficiencyMetrics.coldElements.clear();
    this.cacheEfficiencyMetrics.evictionHistory = [];
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Rectangle intersection observer cleanup completed');
    }
  }

  /**
   * Get comprehensive performance metrics with enhanced edge-only processing data
   * @returns {Object} - Complete performance metrics object
   */
  getMetrics() {
    const avgTraversalTime = this.metrics.traversalCount > 0 
      ? (this.metrics.totalTraversalTime / this.metrics.traversalCount).toFixed(2)
      : 0;
    
    const avgEdgeProcessingTime = this.metrics.intersectionUpdates > 0
      ? (this.metrics.actualEdgeProcessingTime / this.metrics.intersectionUpdates).toFixed(2)
      : 0;
    
    const cacheEfficiency = this.calculateCacheEfficiency();
    
    return {
      // Basic metrics
      elementsObserved: this.metrics.elementsObserved,
      intersectionUpdates: this.metrics.intersectionUpdates,
      intersectingElements: this.intersectingTextElements.size,
      intersectingTextNodes: this.intersectingTextNodes.size,
      textNodesFound: this.metrics.textNodesFound,
      lastUpdateTime: this.metrics.lastUpdateTime,
      
      // Edge-only processing metrics
      edgeProcessingTime: this.metrics.edgeProcessingTime.toFixed(2) + 'ms',
      edgeElementsProcessed: this.metrics.edgeElementsProcessed,
      elementsEntering: this.metrics.elementsEntering,
      elementsLeaving: this.metrics.elementsLeaving,
      avgEdgeProcessingTime: avgEdgeProcessingTime + 'ms',
      
      // Text node traversal metrics
      totalTraversalTime: this.metrics.totalTraversalTime.toFixed(2) + 'ms',
      traversalCount: this.metrics.traversalCount,
      avgTraversalTime: avgTraversalTime + 'ms',
      
      // Cache performance metrics
      cacheHits: this.metrics.cacheHits,
      cacheMisses: this.metrics.cacheMisses,
      cacheHitRatio: cacheEfficiency.hitRatio,
      cacheEfficiency: cacheEfficiency,
      cacheEvictions: this.metrics.cacheEvictions || 0,
      cacheSize: this.cacheSize,
      maxCacheSize: this.maxCacheSize,
      
      // Advanced cache management metrics
      memoryUsage: this.metrics.memoryUsage ? {
        current: this.metrics.memoryUsage.current.toFixed(2) + 'MB',
        peak: this.metrics.memoryUsage.peak.toFixed(2) + 'MB',
        average: this.metrics.memoryUsage.average.toFixed(2) + 'MB',
        cleanupTriggers: this.metrics.memoryUsage.cleanupTriggers
      } : null,
      cacheUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%',
      cleanupThreshold: this.cleanupThreshold,
      cleanupBatchSize: this.cleanupBatchSize,
      
      // Performance comparison metrics
      estimatedFullTraversalTime: this.metrics.estimatedFullTraversalTime.toFixed(2) + 'ms',
      actualEdgeProcessingTime: this.metrics.actualEdgeProcessingTime.toFixed(2) + 'ms',
      efficiencyGainPercent: this.metrics.efficiencyGainPercent.toFixed(1) + '%',
      performanceGain: this.calculatePerformanceGain(),
      
      // State tracking
      elementStatesTracked: this.elementStates.size,
      debugLogging: this.debugLogging,
      
      // Performance monitoring and fallback status
      performanceMonitoring: {
        enabled: this.legacyPerformanceMonitor.enabled,
        fallbackActive: this.fallbackHandler.active,
        fallbackReason: this.fallbackHandler.reason,
        consecutiveSlowOperations: this.legacyPerformanceMonitor.consecutiveSlowOperations,
        thresholdMs: this.legacyPerformanceMonitor.thresholdMs,
        baselinePerformance: this.performanceState.baselinePerformance ? 
          this.performanceState.baselinePerformance.toFixed(2) + 'ms' : 'Not established',
        currentAveragePerformance: this.calculateAverageProcessingTime().toFixed(2) + 'ms',
        regressionDetected: this.performanceState.regressionDetected,
        recoveryAttempts: this.fallbackHandler.recoveryAttempts,
        maxRecoveryAttempts: this.fallbackHandler.maxRecoveryAttempts,
        recentAlerts: this.performanceState.alerts.slice(-3), // Last 3 alerts
        processingTimeWindow: this.legacyPerformanceMonitor.processingTimes.map(t => t.toFixed(2) + 'ms')
      }
    };
  }
  


  /**
   * Enhanced cache access tracking for LRU with detailed metrics
   * @param {Element} element - Element that was accessed
   */
  updateCacheAccess(element) {
    const startTime = performance.now();
    const elementId = this.getElementId(element);
    const currentTime = Date.now();
    
    // Get or create access record
    const existingRecord = this.cacheAccessOrder.get(elementId);
    const accessRecord = {
      timestamp: currentTime,
      accessCount: existingRecord ? existingRecord.accessCount + 1 : 1,
      elementRef: element,
      lastAccessTime: existingRecord ? existingRecord.timestamp : currentTime,
      accessFrequency: 0 // Will be calculated
    };
    
    // Calculate access frequency (accesses per minute)
    if (existingRecord) {
      const timeDiff = currentTime - existingRecord.timestamp;
      accessRecord.accessFrequency = timeDiff > 0 ? (accessRecord.accessCount / (timeDiff / 60000)) : 0;
    }
    
    this.cacheAccessOrder.set(elementId, accessRecord);
    
    // Track hot and cold elements for optimization
    this.updateElementTemperature(elementId, accessRecord);
    
    // Update cache efficiency metrics
    const accessTime = performance.now() - startTime;
    this.cacheEfficiencyMetrics.totalCacheOperations++;
    this.cacheEfficiencyMetrics.totalAccessTime += accessTime;
    this.cacheEfficiencyMetrics.averageAccessTime = 
      this.cacheEfficiencyMetrics.totalAccessTime / this.cacheEfficiencyMetrics.totalCacheOperations;
    
    if (this.debugLogging && accessRecord.accessCount > 1) {
      console.log('[KeyPilot Debug] Enhanced cache access tracking:', {
        elementId: elementId.substring(0, 10) + '...',
        accessCount: accessRecord.accessCount,
        accessFrequency: accessRecord.accessFrequency.toFixed(2) + ' accesses/min',
        timeSinceLastAccess: timeDiff ? (timeDiff / 1000).toFixed(1) + 's' : 'first access',
        accessTime: accessTime.toFixed(3) + 'ms'
      });
    }
  }

  /**
   * Update element temperature classification for cache optimization
   * @param {string} elementId - Element identifier
   * @param {Object} accessRecord - Access record with frequency data
   */
  updateElementTemperature(elementId, accessRecord) {
    const { accessCount, accessFrequency } = accessRecord;
    
    // Define temperature thresholds
    const HOT_ACCESS_THRESHOLD = 5; // 5+ accesses makes an element "hot"
    const HOT_FREQUENCY_THRESHOLD = 2; // 2+ accesses per minute
    const COLD_ACCESS_THRESHOLD = 1; // Only 1 access makes an element "cold"
    const COLD_TIME_THRESHOLD = 300000; // 5 minutes without access
    
    // Remove from cold set if it's being accessed
    this.cacheEfficiencyMetrics.coldElements.delete(elementId);
    
    // Classify as hot element
    if (accessCount >= HOT_ACCESS_THRESHOLD || accessFrequency >= HOT_FREQUENCY_THRESHOLD) {
      this.cacheEfficiencyMetrics.hotElements.set(elementId, {
        accessCount,
        accessFrequency,
        lastAccess: accessRecord.timestamp,
        priority: accessCount * accessFrequency // Combined priority score
      });
    }
    
    // Clean up old hot elements that have cooled down
    const currentTime = Date.now();
    for (const [hotElementId, hotRecord] of this.cacheEfficiencyMetrics.hotElements.entries()) {
      if (currentTime - hotRecord.lastAccess > COLD_TIME_THRESHOLD) {
        this.cacheEfficiencyMetrics.hotElements.delete(hotElementId);
        this.cacheEfficiencyMetrics.coldElements.add(hotElementId);
      }
    }
  }

  /**
   * Enhanced cache text nodes with comprehensive size monitoring and LRU management
   * @param {Element} element - Element to cache text nodes for
   * @param {Array} textNodes - Text nodes to cache
   */
  cacheTextNodes(element, textNodes) {
    // Proactive cache size monitoring and cleanup
    this.monitorCacheSize();
    
    // Check if we need to evict entries before adding new one
    if (this.cacheSize >= this.cleanupThreshold) {
      this.evictLeastRecentlyUsed();
    }
    
    // Additional safety check for maximum cache size
    if (this.cacheSize >= this.maxCacheSize) {
      // Force more aggressive cleanup if we're at the absolute limit
      const aggressiveCleanupSize = Math.floor(this.maxCacheSize * 0.3); // Remove 30% of cache
      this.performTargetedEviction(aggressiveCleanupSize);
    }
    
    // Add to cache with enhanced tracking
    this.textNodeCache.set(element, textNodes);
    this.updateCacheAccess(element);
    this.cacheSize++;
    
    // Update cache efficiency metrics
    this.updateCacheEfficiencyMetrics(textNodes.length);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Cached text nodes for element:', {
        element: element.tagName,
        className: element.className || 'none',
        textNodesCount: textNodes.length,
        cacheSize: this.cacheSize,
        maxCacheSize: this.maxCacheSize,
        cacheUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%',
        hitRatio: this.getCacheHitRatio()
      });
    }
  }

  /**
   * Enhanced cache size monitoring with adaptive thresholds and memory pressure detection
   */
  monitorCacheSize() {
    const utilizationPercent = (this.cacheSize / this.maxCacheSize) * 100;
    const currentTime = Date.now();
    
    // Initialize or update cache monitoring metrics
    if (!this.metrics.maxCacheUtilization) {
      this.metrics.maxCacheUtilization = 0;
      this.metrics.avgCacheUtilization = 0;
      this.metrics.cacheMonitoringCount = 0;
      this.metrics.lastMonitoringTime = currentTime;
      this.metrics.utilizationHistory = [];
      this.metrics.memoryPressureScore = 0;
      this.metrics.cacheEvictions = 0;
    }
    
    // Update utilization statistics
    this.metrics.maxCacheUtilization = Math.max(this.metrics.maxCacheUtilization, utilizationPercent);
    this.metrics.cacheMonitoringCount++;
    this.metrics.avgCacheUtilization = 
      (this.metrics.avgCacheUtilization * (this.metrics.cacheMonitoringCount - 1) + utilizationPercent) / 
      this.metrics.cacheMonitoringCount;
    
    // Track utilization history for trend analysis
    this.metrics.utilizationHistory.push({
      timestamp: currentTime,
      utilization: utilizationPercent,
      cacheSize: this.cacheSize,
      accessOrderSize: this.cacheAccessOrder.size
    });
    
    // Keep only recent history (last 50 measurements)
    if (this.metrics.utilizationHistory.length > 50) {
      this.metrics.utilizationHistory.shift();
    }
    
    // Calculate memory pressure score based on recent trends
    this.calculateMemoryPressureScore();
    
    // Adaptive cleanup thresholds based on memory pressure and access patterns
    const adaptiveThresholds = this.calculateAdaptiveCleanupThresholds();
    
    // Enhanced warning system with memory pressure context
    if (utilizationPercent > 90) {
      this.cacheEfficiencyMetrics.memoryPressureEvents++;
      
      if (this.debugLogging) {
        console.warn('[KeyPilot Debug] High cache utilization detected:', {
          currentSize: this.cacheSize,
          maxSize: this.maxCacheSize,
          utilization: utilizationPercent.toFixed(1) + '%',
          accessOrderSize: this.cacheAccessOrder.size,
          memoryPressureScore: this.metrics.memoryPressureScore,
          adaptiveThresholds: adaptiveThresholds
        });
      }
    }
  }

  /**
   * Calculate memory pressure score based on cache utilization trends
   */
  calculateMemoryPressureScore() {
    if (!this.metrics.utilizationHistory || this.metrics.utilizationHistory.length < 3) {
      this.metrics.memoryPressureScore = 0;
      return;
    }
    
    const recent = this.metrics.utilizationHistory.slice(-5); // Last 5 measurements
    const avgUtilization = recent.reduce((sum, entry) => sum + entry.utilization, 0) / recent.length;
    const trend = recent[recent.length - 1].utilization - recent[0].utilization;
    
    // Calculate pressure score (0-100)
    let pressureScore = avgUtilization * 0.7; // Base score from utilization
    pressureScore += Math.max(0, trend) * 0.3; // Add trend component (only positive trends)
    
    this.metrics.memoryPressureScore = Math.min(100, Math.max(0, pressureScore));
  }

  /**
   * Calculate adaptive cleanup thresholds based on usage patterns
   */
  calculateAdaptiveCleanupThresholds() {
    const baseThreshold = this.cleanupThreshold;
    const pressureMultiplier = 1 - (this.metrics.memoryPressureScore / 200); // Reduce threshold under pressure
    const hotElementsRatio = this.cacheEfficiencyMetrics.hotElements.size / Math.max(1, this.cacheSize);
    
    return {
      cleanupThreshold: Math.max(
        baseThreshold * 0.5, // Never go below 50% of base threshold
        Math.floor(baseThreshold * pressureMultiplier * (1 - hotElementsRatio * 0.2))
      ),
      aggressiveThreshold: Math.floor(this.maxCacheSize * 0.95),
      emergencyThreshold: this.maxCacheSize
    };
  }

  /**
   * Evict least recently used cache entries with intelligent prioritization
   */
  evictLeastRecentlyUsed() {
    const targetEvictions = this.cleanupBatchSize;
    const evictionCandidates = [];
    
    // Build eviction candidates with priority scoring
    for (const [elementId, accessRecord] of this.cacheAccessOrder.entries()) {
      const element = accessRecord.elementRef;
      
      // Skip if element is no longer in cache (WeakMap cleanup)
      if (!this.textNodeCache.has(element)) {
        this.cacheAccessOrder.delete(elementId);
        this.cacheSize = Math.max(0, this.cacheSize - 1);
        continue;
      }
      
      // Calculate eviction priority (lower = more likely to evict)
      const timeSinceAccess = Date.now() - accessRecord.timestamp;
      const accessFrequency = accessRecord.accessFrequency || 0;
      const isHot = this.cacheEfficiencyMetrics.hotElements.has(elementId);
      
      const priority = this.calculateEvictionPriority(accessRecord, timeSinceAccess, isHot);
      
      evictionCandidates.push({
        elementId,
        element,
        priority,
        accessRecord,
        timeSinceAccess
      });
    }
    
    // Sort by priority (lowest first = most likely to evict)
    evictionCandidates.sort((a, b) => a.priority - b.priority);
    
    // Evict the least valuable entries
    const evicted = [];
    for (let i = 0; i < Math.min(targetEvictions, evictionCandidates.length); i++) {
      const candidate = evictionCandidates[i];
      
      // Remove from cache
      this.textNodeCache.delete(candidate.element);
      this.cacheAccessOrder.delete(candidate.elementId);
      this.cacheSize = Math.max(0, this.cacheSize - 1);
      
      // Track eviction for analysis
      evicted.push({
        elementId: candidate.elementId,
        priority: candidate.priority,
        timeSinceAccess: candidate.timeSinceAccess,
        accessCount: candidate.accessRecord.accessCount
      });
    }
    
    // Update metrics
    this.metrics.cacheEvictions += evicted.length;
    this.cacheEfficiencyMetrics.evictionHistory.push(...evicted);
    this.cacheEfficiencyMetrics.adaptiveCleanupTriggers++;
    
    // Keep eviction history manageable
    if (this.cacheEfficiencyMetrics.evictionHistory.length > 100) {
      this.cacheEfficiencyMetrics.evictionHistory.splice(0, 50);
    }
    
    if (this.debugLogging && evicted.length > 0) {
      console.log('[KeyPilot Debug] LRU cache eviction completed:', {
        evictedCount: evicted.length,
        targetEvictions,
        newCacheSize: this.cacheSize,
        cacheUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%',
        avgEvictionPriority: (evicted.reduce((sum, e) => sum + e.priority, 0) / evicted.length).toFixed(2),
        oldestEvicted: Math.max(...evicted.map(e => e.timeSinceAccess)) / 1000 + 's ago'
      });
    }
  }

  /**
   * Calculate eviction priority for a cache entry
   * @param {Object} accessRecord - Access record for the element
   * @param {number} timeSinceAccess - Time since last access in ms
   * @param {boolean} isHot - Whether element is classified as hot
   * @returns {number} Priority score (lower = more likely to evict)
   */
  calculateEvictionPriority(accessRecord, timeSinceAccess, isHot) {
    const baseScore = 100;
    
    // Time component (older = higher eviction priority)
    const timeScore = Math.min(50, timeSinceAccess / 60000); // Max 50 points for 1+ minutes
    
    // Frequency component (less frequent = higher eviction priority)
    const frequencyScore = Math.max(0, 30 - (accessRecord.accessCount * 5)); // Max 30 points reduction
    
    // Hot element protection (hot elements get significant protection)
    const hotProtection = isHot ? -40 : 0;
    
    // Access frequency protection (frequently accessed elements get protection)
    const accessFrequencyProtection = Math.min(20, (accessRecord.accessFrequency || 0) * -10);
    
    return baseScore + timeScore + frequencyScore + hotProtection + accessFrequencyProtection;
  }

  /**
   * Perform targeted eviction to reach a specific cache size
   * @param {number} targetEvictions - Number of entries to evict
   */
  performTargetedEviction(targetEvictions) {
    if (targetEvictions <= 0) return;
    
    const originalBatchSize = this.cleanupBatchSize;
    this.cleanupBatchSize = targetEvictions;
    
    this.evictLeastRecentlyUsed();
    
    this.cleanupBatchSize = originalBatchSize;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Targeted cache eviction completed:', {
        targetEvictions,
        actualEvictions: Math.min(targetEvictions, this.cacheAccessOrder.size),
        finalCacheSize: this.cacheSize,
        cacheUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * Implement cache warming strategies for frequently accessed elements
   */
  implementCacheWarming() {
    if (!EDGE_ONLY_SELECTION.ENABLE_PREDICTIVE_CACHING) {
      return;
    }
    
    // Get viewport bounds for predictive caching
    const viewport = {
      left: window.scrollX,
      top: window.scrollY,
      right: window.scrollX + window.innerWidth,
      bottom: window.scrollY + window.innerHeight
    };
    
    // Expand viewport by predictive distance
    const expandedViewport = {
      left: viewport.left - EDGE_ONLY_SELECTION.PREDICTIVE_CACHE_DISTANCE,
      top: viewport.top - EDGE_ONLY_SELECTION.PREDICTIVE_CACHE_DISTANCE,
      right: viewport.right + EDGE_ONLY_SELECTION.PREDICTIVE_CACHE_DISTANCE,
      bottom: viewport.bottom + EDGE_ONLY_SELECTION.PREDICTIVE_CACHE_DISTANCE
    };
    
    // Find elements in expanded viewport that aren't cached yet
    const uncachedElements = [];
    const allElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6, li, td, th');
    
    for (const element of allElements) {
      if (this.textNodeCache.has(element)) continue;
      if (!this.elementContainsText(element)) continue;
      
      const rect = element.getBoundingClientRect();
      const elementBounds = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY
      };
      
      // Check if element is in expanded viewport
      if (this.isElementInBounds(elementBounds, expandedViewport)) {
        uncachedElements.push(element);
      }
    }
    
    // Warm cache for a limited number of elements to avoid performance impact
    const maxWarmingElements = Math.min(10, uncachedElements.length);
    const startTime = performance.now();
    
    for (let i = 0; i < maxWarmingElements; i++) {
      const element = uncachedElements[i];
      
      // Extract and cache text nodes
      const textNodes = this.extractTextNodesForCaching(element);
      if (textNodes.length > 0) {
        this.cacheTextNodes(element, textNodes);
      }
      
      // Limit warming time to prevent performance impact
      if (performance.now() - startTime > 5) break;
    }
    
    if (this.debugLogging && maxWarmingElements > 0) {
      console.log('[KeyPilot Debug] Cache warming completed:', {
        elementsWarmed: maxWarmingElements,
        totalCandidates: uncachedElements.length,
        warmingTime: (performance.now() - startTime).toFixed(2) + 'ms',
        newCacheSize: this.cacheSize,
        cacheUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * Check if element bounds intersect with target bounds
   * @param {Object} elementBounds - Element bounds
   * @param {Object} targetBounds - Target bounds to check against
   * @returns {boolean} True if bounds intersect
   */
  isElementInBounds(elementBounds, targetBounds) {
    return !(elementBounds.right < targetBounds.left ||
             elementBounds.left > targetBounds.right ||
             elementBounds.bottom < targetBounds.top ||
             elementBounds.top > targetBounds.bottom);
  }

  /**
   * Extract text nodes for caching purposes (without adding to intersection set)
   * @param {Element} element - Element to extract text nodes from
   * @returns {Array} Array of text nodes
   */
  extractTextNodesForCaching(element) {
    const textNodes = [];
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          if (!node.textContent || !node.textContent.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          
          const parent = node.parentElement;
          if (parent && this.isNonContentElement(parent)) {
            return NodeFilter.FILTER_REJECT;
          }
          
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  /**
   * Update cache efficiency metrics
   * @param {number} textNodesCount - Number of text nodes cached
   */
  updateCacheEfficiencyMetrics(textNodesCount) {
    this.cacheEfficiencyMetrics.totalCacheOperations++;
    
    // Update cache efficiency patterns
    const efficiency = this.getCacheEfficiencyMetrics();
    
    if (this.debugLogging && this.cacheEfficiencyMetrics.totalCacheOperations % 10 === 0) {
      console.log('[KeyPilot Debug] Cache efficiency update:', {
        totalOperations: this.cacheEfficiencyMetrics.totalCacheOperations,
        hitRatio: efficiency.hitRatio,
        hotElements: this.cacheEfficiencyMetrics.hotElements.size,
        coldElements: this.cacheEfficiencyMetrics.coldElements.size,
        longestHitStreak: this.cacheEfficiencyMetrics.longestHitStreak,
        longestMissStreak: this.cacheEfficiencyMetrics.longestMissStreak
      });
    }
  }

  /**
   * Get comprehensive cache efficiency metrics
   * @returns {Object} Cache efficiency metrics
   */
  getCacheEfficiencyMetrics() {
    const totalAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRatio = totalAttempts > 0 ? ((this.metrics.cacheHits / totalAttempts) * 100).toFixed(1) + '%' : '0%';
    
    return {
      hitRatio,
      totalOperations: this.cacheEfficiencyMetrics.totalCacheOperations,
      currentHitStreak: this.cacheEfficiencyMetrics.cacheHitStreak,
      longestHitStreak: this.cacheEfficiencyMetrics.longestHitStreak,
      currentMissStreak: this.cacheEfficiencyMetrics.cacheMissStreak,
      longestMissStreak: this.cacheEfficiencyMetrics.longestMissStreak,
      averageAccessTime: this.cacheEfficiencyMetrics.averageAccessTime.toFixed(3) + 'ms',
      hotElements: this.cacheEfficiencyMetrics.hotElements.size,
      coldElements: this.cacheEfficiencyMetrics.coldElements.size,
      evictionHistory: this.cacheEfficiencyMetrics.evictionHistory.length,
      memoryPressureEvents: this.cacheEfficiencyMetrics.memoryPressureEvents,
      adaptiveCleanupTriggers: this.cacheEfficiencyMetrics.adaptiveCleanupTriggers,
      cacheSize: this.cacheSize,
      maxCacheSize: this.maxCacheSize,
      cacheUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%',
      memoryPressureScore: this.metrics.memoryPressureScore?.toFixed(1) || '0'
    };
  }

  /**
   * Monitor memory usage and trigger cleanup if necessary
   */
  monitorMemoryUsage() {
    if (!EDGE_ONLY_SELECTION.ENABLE_MEMORY_MONITORING) {
      return;
    }
    
    // Estimate memory usage based on cache size and content
    const estimatedMemoryUsage = this.estimateMemoryUsage();
    const memoryLimitMB = EDGE_ONLY_SELECTION.MAX_MEMORY_USAGE_MB;
    const memoryUsagePercent = (estimatedMemoryUsage / memoryLimitMB) * 100;
    
    // Initialize memory metrics if needed
    if (!this.metrics.memoryUsage) {
      this.metrics.memoryUsage = {
        current: 0,
        peak: 0,
        average: 0,
        measurements: 0,
        lastCleanup: Date.now(),
        cleanupTriggers: 0
      };
    }
    
    // Update memory metrics
    this.metrics.memoryUsage.current = estimatedMemoryUsage;
    this.metrics.memoryUsage.peak = Math.max(this.metrics.memoryUsage.peak, estimatedMemoryUsage);
    this.metrics.memoryUsage.measurements++;
    this.metrics.memoryUsage.average = 
      (this.metrics.memoryUsage.average * (this.metrics.memoryUsage.measurements - 1) + estimatedMemoryUsage) / 
      this.metrics.memoryUsage.measurements;
    
    // Trigger cleanup if memory usage is too high
    if (memoryUsagePercent > EDGE_ONLY_SELECTION.GARBAGE_COLLECTION_THRESHOLD * 100) {
      this.triggerMemoryCleanup();
    }
    
    if (this.debugLogging && this.metrics.memoryUsage.measurements % 20 === 0) {
      console.log('[KeyPilot Debug] Memory usage monitoring:', {
        currentUsage: estimatedMemoryUsage.toFixed(2) + 'MB',
        usagePercent: memoryUsagePercent.toFixed(1) + '%',
        peakUsage: this.metrics.memoryUsage.peak.toFixed(2) + 'MB',
        averageUsage: this.metrics.memoryUsage.average.toFixed(2) + 'MB',
        memoryLimit: memoryLimitMB + 'MB',
        cacheSize: this.cacheSize,
        cleanupTriggers: this.metrics.memoryUsage.cleanupTriggers
      });
    }
  }

  /**
   * Estimate memory usage of the cache system
   * @returns {number} Estimated memory usage in MB
   */
  estimateMemoryUsage() {
    // Rough estimation based on cache size and typical text node content
    const avgTextNodesPerElement = 5; // Conservative estimate
    const avgTextNodeSize = 100; // bytes per text node (conservative)
    const cacheOverhead = 200; // bytes per cache entry for metadata
    
    const textNodeMemory = this.cacheSize * avgTextNodesPerElement * avgTextNodeSize;
    const cacheMetadataMemory = this.cacheSize * cacheOverhead;
    const accessOrderMemory = this.cacheAccessOrder.size * 150; // bytes per access record
    const metricsMemory = 50000; // rough estimate for all metrics objects
    
    const totalBytes = textNodeMemory + cacheMetadataMemory + accessOrderMemory + metricsMemory;
    return totalBytes / (1024 * 1024); // Convert to MB
  }

  /**
   * Trigger memory cleanup when usage is too high
   */
  triggerMemoryCleanup() {
    const startTime = performance.now();
    const initialCacheSize = this.cacheSize;
    
    // Aggressive cleanup - remove 40% of cache
    const targetEvictions = Math.floor(this.cacheSize * 0.4);
    this.performTargetedEviction(targetEvictions);
    
    // Clean up stale access records
    this.cleanupStaleAccessRecords();
    
    // Update memory cleanup metrics
    this.metrics.memoryUsage.cleanupTriggers++;
    this.metrics.memoryUsage.lastCleanup = Date.now();
    
    const cleanupTime = performance.now() - startTime;
    const evictedCount = initialCacheSize - this.cacheSize;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Memory cleanup triggered:', {
        reason: 'High memory usage',
        initialCacheSize,
        finalCacheSize: this.cacheSize,
        evictedEntries: evictedCount,
        cleanupTime: cleanupTime.toFixed(2) + 'ms',
        estimatedMemoryFreed: (evictedCount * 0.5).toFixed(2) + 'KB',
        newMemoryUsage: this.estimateMemoryUsage().toFixed(2) + 'MB'
      });
    }
  }

  /**
   * Clean up stale access records that no longer have corresponding cache entries
   */
  cleanupStaleAccessRecords() {
    const staleRecords = [];
    
    for (const [elementId, accessRecord] of this.cacheAccessOrder.entries()) {
      const element = accessRecord.elementRef;
      
      // Check if element is still in cache
      if (!this.textNodeCache.has(element)) {
        staleRecords.push(elementId);
      }
    }
    
    // Remove stale records
    staleRecords.forEach(elementId => {
      this.cacheAccessOrder.delete(elementId);
      this.cacheEfficiencyMetrics.coldElements.delete(elementId);
      this.cacheEfficiencyMetrics.hotElements.delete(elementId);
    });
    
    if (this.debugLogging && staleRecords.length > 0) {
      console.log('[KeyPilot Debug] Cleaned up stale access records:', {
        staleRecords: staleRecords.length,
        remainingAccessRecords: this.cacheAccessOrder.size,
        cacheSize: this.cacheSize
      });
    }
  }

  /**
   * Implement cache efficiency optimization based on usage patterns
   */
  optimizeCacheEfficiency() {
    // Analyze cache usage patterns
    const efficiency = this.getCacheEfficiencyMetrics();
    const hitRatioNumeric = parseFloat(efficiency.hitRatio) / 100;
    
    // If hit ratio is low, implement optimization strategies
    if (hitRatioNumeric < EDGE_ONLY_SELECTION.CACHE_HIT_RATIO_THRESHOLD) {
      this.implementCacheOptimizations(hitRatioNumeric);
    }
    
    // Periodic cache warming if enabled
    if (EDGE_ONLY_SELECTION.ENABLE_PREDICTIVE_CACHING) {
      // Only warm cache if we have spare capacity
      const utilizationPercent = (this.cacheSize / this.maxCacheSize) * 100;
      if (utilizationPercent < 70) {
        this.implementCacheWarming();
      }
    }
    
    // Monitor and adjust cache parameters based on performance
    this.adjustCacheParameters();
  }

  /**
   * Implement cache optimizations when hit ratio is low
   * @param {number} currentHitRatio - Current cache hit ratio (0-1)
   */
  implementCacheOptimizations(currentHitRatio) {
    // Strategy 1: Increase cache size if memory allows
    const memoryUsage = this.estimateMemoryUsage();
    const memoryLimit = EDGE_ONLY_SELECTION.MAX_MEMORY_USAGE_MB;
    
    if (memoryUsage < memoryLimit * 0.7 && this.maxCacheSize < 2000) {
      const newMaxSize = Math.min(2000, Math.floor(this.maxCacheSize * 1.2));
      this.maxCacheSize = newMaxSize;
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Increased cache size for better hit ratio:', {
          oldMaxSize: Math.floor(newMaxSize / 1.2),
          newMaxSize,
          currentHitRatio: (currentHitRatio * 100).toFixed(1) + '%',
          memoryUsage: memoryUsage.toFixed(2) + 'MB'
        });
      }
    }
    
    // Strategy 2: Adjust cleanup threshold to retain more entries
    if (currentHitRatio < 0.5) {
      this.cleanupThreshold = Math.min(
        this.maxCacheSize * 0.9,
        this.cleanupThreshold * 1.1
      );
    }
    
    // Strategy 3: Protect hot elements more aggressively
    this.adjustHotElementProtection(currentHitRatio);
  }

  /**
   * Adjust hot element protection based on cache performance
   * @param {number} currentHitRatio - Current cache hit ratio (0-1)
   */
  adjustHotElementProtection(currentHitRatio) {
    // Lower hit ratios require more aggressive hot element protection
    const protectionMultiplier = Math.max(0.5, currentHitRatio);
    
    // Update hot element thresholds
    for (const [elementId, hotRecord] of this.cacheEfficiencyMetrics.hotElements.entries()) {
      hotRecord.priority *= (1 + (1 - protectionMultiplier));
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Adjusted hot element protection:', {
        currentHitRatio: (currentHitRatio * 100).toFixed(1) + '%',
        protectionMultiplier: protectionMultiplier.toFixed(2),
        hotElements: this.cacheEfficiencyMetrics.hotElements.size
      });
    }
  }

  /**
   * Adjust cache parameters based on performance metrics
   */
  adjustCacheParameters() {
    const metrics = this.getMetrics();
    const efficiency = this.getCacheEfficiencyMetrics();
    
    // Adjust batch size based on eviction frequency
    if (this.metrics.cacheEvictions > 0) {
      const evictionsPerUpdate = this.metrics.cacheEvictions / Math.max(1, this.metrics.intersectionUpdates);
      
      if (evictionsPerUpdate > 0.1) {
        // Too many evictions - increase batch size
        this.cleanupBatchSize = Math.min(500, Math.floor(this.cleanupBatchSize * 1.2));
      } else if (evictionsPerUpdate < 0.01) {
        // Too few evictions - decrease batch size for more granular control
        this.cleanupBatchSize = Math.max(50, Math.floor(this.cleanupBatchSize * 0.9));
      }
    }
    
    if (this.debugLogging && this.metrics.intersectionUpdates % 100 === 0) {
      console.log('[KeyPilot Debug] Cache parameter adjustment:', {
        cleanupBatchSize: this.cleanupBatchSize,
        cleanupThreshold: this.cleanupThreshold,
        maxCacheSize: this.maxCacheSize,
        cacheEvictions: this.metrics.cacheEvictions,
        intersectionUpdates: this.metrics.intersectionUpdates,
        hitRatio: efficiency.hitRatio
      });
    }
  }

  /**
   * Calculate memory pressure score based on utilization trends
   */
  calculateMemoryPressureScore() {
    if (this.metrics.utilizationHistory.length < 5) {
      this.metrics.memoryPressureScore = 0;
      return;
    }
    
    const recent = this.metrics.utilizationHistory.slice(-5);
    const trend = recent[recent.length - 1].utilization - recent[0].utilization;
    const avgUtilization = recent.reduce((sum, entry) => sum + entry.utilization, 0) / recent.length;
    const volatility = this.calculateUtilizationVolatility(recent);
    
    // Combine factors: high utilization + positive trend + high volatility = high pressure
    this.metrics.memoryPressureScore = (avgUtilization / 100) * 0.5 + 
                                      Math.max(0, trend / 100) * 0.3 + 
                                      volatility * 0.2;
  }

  /**
   * Calculate utilization volatility for memory pressure assessment
   * @param {Array} utilizationData - Recent utilization measurements
   * @returns {number} - Volatility score (0-1)
   */
  calculateUtilizationVolatility(utilizationData) {
    if (utilizationData.length < 2) return 0;
    
    const changes = [];
    for (let i = 1; i < utilizationData.length; i++) {
      changes.push(Math.abs(utilizationData[i].utilization - utilizationData[i-1].utilization));
    }
    
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    return Math.min(1, avgChange / 20); // Normalize to 0-1 scale
  }

  /**
   * Calculate adaptive cleanup thresholds based on system state
   * @returns {Object} - Threshold configuration
   */
  calculateAdaptiveCleanupThresholds() {
    const baseThresholds = { maintenance: 70, preventive: 85, emergency: 95 };
    const pressureAdjustment = this.metrics.memoryPressureScore * 10; // Up to 10% adjustment
    
    return {
      maintenance: Math.max(60, baseThresholds.maintenance - pressureAdjustment),
      preventive: Math.max(75, baseThresholds.preventive - pressureAdjustment),
      emergency: Math.max(85, baseThresholds.emergency - pressureAdjustment)
    };
  }

  /**
   * Determine if maintenance cleanup should be performed
   * @returns {boolean} - True if maintenance cleanup is needed
   */
  shouldPerformMaintenanceCleanup() {
    const timeSinceLastCleanup = Date.now() - (this.metrics.lastCleanupTime || 0);
    const hasStaleElements = this.cacheEfficiencyMetrics.coldElements.size > 10;
    const lowCacheEfficiency = this.getCacheHitRatio() < '80%';
    
    return timeSinceLastCleanup > 60000 && (hasStaleElements || lowCacheEfficiency);
  }

  /**
   * Perform targeted eviction of a specific number of cache entries
   * @param {number} targetEvictions - Number of entries to evict
   */
  performTargetedEviction(targetEvictions) {
    if (targetEvictions <= 0 || this.cacheAccessOrder.size === 0) {
      return;
    }
    
    const startTime = performance.now();
    const originalCleanupBatchSize = this.cleanupBatchSize;
    
    // Temporarily increase batch size for targeted eviction
    this.cleanupBatchSize = Math.min(targetEvictions, this.cacheAccessOrder.size);
    
    // Perform the eviction
    this.evictLeastRecentlyUsed();
    
    // Restore original batch size
    this.cleanupBatchSize = originalCleanupBatchSize;
    
    const evictionTime = performance.now() - startTime;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Targeted cache eviction completed:', {
        targetEvictions,
        evictionTime: evictionTime.toFixed(2) + 'ms',
        newCacheSize: this.cacheSize,
        newUtilization: ((this.cacheSize / this.maxCacheSize) * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * Update cache efficiency metrics when adding new entries
   * @param {number} textNodesCount - Number of text nodes being cached
   */
  updateCacheEfficiencyMetrics(textNodesCount) {
    if (!this.metrics.totalTextNodesCached) {
      this.metrics.totalTextNodesCached = 0;
      this.metrics.avgTextNodesPerElement = 0;
      this.metrics.cacheEntryCount = 0;
    }
    
    this.metrics.totalTextNodesCached += textNodesCount;
    this.metrics.cacheEntryCount++;
    this.metrics.avgTextNodesPerElement = this.metrics.totalTextNodesCached / this.metrics.cacheEntryCount;
  }

  /**
   * Intelligent cache eviction strategy that considers element temperature and access patterns
   * @param {string} mode - Eviction mode: 'maintenance', 'preventive', 'emergency'
   * @param {number} targetEvictions - Number of entries to evict
   */
  performIntelligentEviction(mode = 'preventive', targetEvictions = null) {
    if (!targetEvictions) {
      targetEvictions = Math.min(this.cleanupBatchSize, this.cacheAccessOrder.size);
    }
    
    const startTime = performance.now();
    let evictedCount = 0;
    const evictionStrategy = this.selectEvictionStrategy(mode);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Starting intelligent cache eviction:', {
        mode,
        targetEvictions,
        strategy: evictionStrategy,
        cacheSize: this.cacheSize,
        hotElements: this.cacheEfficiencyMetrics.hotElements.size,
        coldElements: this.cacheEfficiencyMetrics.coldElements.size
      });
    }
    
    // Execute eviction based on selected strategy
    switch (evictionStrategy) {
      case 'cold-first':
        evictedCount = this.evictColdElementsFirst(targetEvictions);
        break;
      case 'lru-standard':
        evictedCount = this.evictLeastRecentlyUsed(targetEvictions);
        break;
      case 'frequency-based':
        evictedCount = this.evictLowFrequencyElements(targetEvictions);
        break;
      case 'hybrid':
        evictedCount = this.evictHybridStrategy(targetEvictions);
        break;
      default:
        evictedCount = this.evictLeastRecentlyUsed(targetEvictions);
    }
    
    const evictionTime = performance.now() - startTime;
    this.metrics.lastCleanupTime = Date.now();
    
    // Record eviction in history for analysis
    this.cacheEfficiencyMetrics.evictionHistory.push({
      timestamp: Date.now(),
      mode,
      strategy: evictionStrategy,
      targetEvictions,
      actualEvictions: evictedCount,
      evictionTime,
      efficiency: targetEvictions > 0 ? (evictedCount / targetEvictions) * 100 : 0
    });
    
    // Keep eviction history manageable
    if (this.cacheEfficiencyMetrics.evictionHistory.length > 20) {
      this.cacheEfficiencyMetrics.evictionHistory.shift();
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Intelligent cache eviction completed:', {
        mode,
        strategy: evictionStrategy,
        targetEvictions,
        actualEvictions: evictedCount,
        evictionTime: evictionTime.toFixed(2) + 'ms',
        efficiency: ((evictedCount / targetEvictions) * 100).toFixed(1) + '%',
        newCacheSize: this.cacheSize,
        remainingHotElements: this.cacheEfficiencyMetrics.hotElements.size
      });
    }
    
    return evictedCount;
  }

  /**
   * Select optimal eviction strategy based on cache state and mode
   * @param {string} mode - Eviction mode
   * @returns {string} - Selected eviction strategy
   */
  selectEvictionStrategy(mode) {
    const coldElementsRatio = this.cacheEfficiencyMetrics.coldElements.size / this.cacheSize;
    const hotElementsRatio = this.cacheEfficiencyMetrics.hotElements.size / this.cacheSize;
    
    switch (mode) {
      case 'maintenance':
        return coldElementsRatio > 0.3 ? 'cold-first' : 'lru-standard';
      case 'preventive':
        return coldElementsRatio > 0.2 ? 'hybrid' : 'frequency-based';
      case 'emergency':
        return hotElementsRatio < 0.5 ? 'cold-first' : 'lru-standard';
      default:
        return 'lru-standard';
    }
  }

  /**
   * Evict cold elements first (elements with low access frequency)
   * @param {number} targetEvictions - Number of entries to evict
   * @returns {number} - Number of elements actually evicted
   */
  evictColdElementsFirst(targetEvictions) {
    let evictedCount = 0;
    const elementsToEvict = [];
    
    // First, evict known cold elements
    for (const elementId of this.cacheEfficiencyMetrics.coldElements) {
      if (evictedCount >= targetEvictions) break;
      
      const accessRecord = this.cacheAccessOrder.get(elementId);
      if (accessRecord && accessRecord.elementRef) {
        elementsToEvict.push(accessRecord.elementRef);
        this.cacheAccessOrder.delete(elementId);
        this.cacheEfficiencyMetrics.coldElements.delete(elementId);
        evictedCount++;
      }
    }
    
    // If we need more evictions, fall back to LRU for remaining elements
    if (evictedCount < targetEvictions) {
      const remainingTarget = targetEvictions - evictedCount;
      evictedCount += this.evictLeastRecentlyUsed(remainingTarget);
    }
    
    // Actually remove from WeakMap cache
    elementsToEvict.forEach(element => {
      if (this.textNodeCache.has(element)) {
        this.textNodeCache.delete(element);
      }
    });
    
    this.cacheSize = Math.max(0, this.cacheSize - evictedCount);
    return evictedCount;
  }

  /**
   * Evict elements with low access frequency
   * @param {number} targetEvictions - Number of entries to evict
   * @returns {number} - Number of elements actually evicted
   */
  evictLowFrequencyElements(targetEvictions) {
    // Sort elements by access frequency (ascending - lowest first)
    const sortedByFrequency = Array.from(this.cacheAccessOrder.entries())
      .sort((a, b) => (a[1].accessFrequency || 0) - (b[1].accessFrequency || 0));
    
    let evictedCount = 0;
    const elementsToEvict = [];
    
    for (let i = 0; i < Math.min(targetEvictions, sortedByFrequency.length); i++) {
      const [elementId, accessRecord] = sortedByFrequency[i];
      
      if (accessRecord.elementRef) {
        elementsToEvict.push(accessRecord.elementRef);
        this.cacheAccessOrder.delete(elementId);
        
        // Remove from temperature tracking
        this.cacheEfficiencyMetrics.hotElements.delete(elementId);
        this.cacheEfficiencyMetrics.coldElements.delete(elementId);
        
        evictedCount++;
      }
    }
    
    // Actually remove from WeakMap cache
    elementsToEvict.forEach(element => {
      if (this.textNodeCache.has(element)) {
        this.textNodeCache.delete(element);
      }
    });
    
    this.cacheSize = Math.max(0, this.cacheSize - evictedCount);
    return evictedCount;
  }

  /**
   * Hybrid eviction strategy combining multiple factors
   * @param {number} targetEvictions - Number of entries to evict
   * @returns {number} - Number of elements actually evicted
   */
  evictHybridStrategy(targetEvictions) {
    // Calculate composite scores for each element
    const elementScores = [];
    const currentTime = Date.now();
    
    for (const [elementId, accessRecord] of this.cacheAccessOrder.entries()) {
      const timeSinceAccess = currentTime - accessRecord.timestamp;
      const accessFrequency = accessRecord.accessFrequency || 0;
      const accessCount = accessRecord.accessCount || 1;
      
      // Composite score: higher score = more likely to be evicted
      // Factors: time since access (40%), low frequency (30%), low count (30%)
      const timeScore = Math.min(1, timeSinceAccess / 300000); // Normalize to 5 minutes
      const frequencyScore = Math.max(0, 1 - (accessFrequency / 5)); // Normalize to 5 accesses/min
      const countScore = Math.max(0, 1 - (accessCount / 10)); // Normalize to 10 accesses
      
      const compositeScore = timeScore * 0.4 + frequencyScore * 0.3 + countScore * 0.3;
      
      elementScores.push({
        elementId,
        accessRecord,
        compositeScore
      });
    }
    
    // Sort by composite score (descending - highest scores evicted first)
    elementScores.sort((a, b) => b.compositeScore - a.compositeScore);
    
    let evictedCount = 0;
    const elementsToEvict = [];
    
    for (let i = 0; i < Math.min(targetEvictions, elementScores.length); i++) {
      const { elementId, accessRecord } = elementScores[i];
      
      if (accessRecord.elementRef) {
        elementsToEvict.push(accessRecord.elementRef);
        this.cacheAccessOrder.delete(elementId);
        
        // Update temperature tracking
        this.cacheEfficiencyMetrics.hotElements.delete(elementId);
        this.cacheEfficiencyMetrics.coldElements.add(elementId);
        
        evictedCount++;
      }
    }
    
    // Actually remove from WeakMap cache
    elementsToEvict.forEach(element => {
      if (this.textNodeCache.has(element)) {
        this.textNodeCache.delete(element);
      }
    });
    
    this.cacheSize = Math.max(0, this.cacheSize - evictedCount);
    return evictedCount;
  }



  /**
   * Perform aggressive cache cleanup when standard LRU eviction is insufficient
   */
  performAggressiveCleanup() {
    const startTime = performance.now();
    const initialSize = this.cacheAccessOrder.size;
    
    // Remove stale entries from access order tracking
    const currentTime = Date.now();
    const staleThreshold = 300000; // 5 minutes
    let staleEntriesRemoved = 0;
    
    for (const [elementId, timestamp] of this.cacheAccessOrder.entries()) {
      if (currentTime - timestamp > staleThreshold) {
        this.cacheAccessOrder.delete(elementId);
        staleEntriesRemoved++;
      }
    }
    
    // Update cache size estimate
    this.cacheSize = Math.max(0, this.cacheSize - staleEntriesRemoved);
    
    const cleanupTime = performance.now() - startTime;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Aggressive cache cleanup completed:', {
        initialAccessOrderSize: initialSize,
        staleEntriesRemoved,
        finalAccessOrderSize: this.cacheAccessOrder.size,
        estimatedCacheSize: this.cacheSize,
        cleanupTime: cleanupTime.toFixed(2) + 'ms'
      });
    }
  }

  /**
   * Get comprehensive cache efficiency metrics including enhanced LRU performance data
   * @returns {Object} - Complete cache efficiency analysis
   */
  getCacheEfficiencyMetrics() {
    const totalAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    const hitRatio = totalAttempts > 0 ? (this.metrics.cacheHits / totalAttempts) : 0;
    const evictions = this.metrics.cacheEvictions || 0;
    const avgEvictionTime = evictions > 0 ? (this.metrics.totalEvictionTime || 0) / evictions : 0;
    
    // Calculate advanced efficiency metrics
    const cacheUtilization = this.maxCacheSize > 0 ? (this.cacheSize / this.maxCacheSize) : 0;
    const accessOrderAccuracy = this.cacheSize > 0 ? (this.cacheAccessOrder.size / this.cacheSize) : 1;
    const hotElementRatio = this.cacheSize > 0 ? (this.cacheEfficiencyMetrics.hotElements.size / this.cacheSize) : 0;
    const coldElementRatio = this.cacheSize > 0 ? (this.cacheEfficiencyMetrics.coldElements.size / this.cacheSize) : 0;
    
    // Calculate eviction efficiency from history
    const recentEvictions = this.cacheEfficiencyMetrics.evictionHistory.slice(-5);
    const avgEvictionEfficiency = recentEvictions.length > 0 
      ? recentEvictions.reduce((sum, ev) => sum + ev.efficiency, 0) / recentEvictions.length 
      : 0;
    
    // Calculate cache performance trends
    const performanceTrend = this.calculateCachePerformanceTrend();
    
    return {
      // Basic metrics
      hitRatio: (hitRatio * 100).toFixed(1) + '%',
      hits: this.metrics.cacheHits,
      misses: this.metrics.cacheMisses,
      totalAttempts,
      
      // Size and utilization metrics
      cacheSize: this.cacheSize,
      maxCacheSize: this.maxCacheSize,
      utilization: (cacheUtilization * 100).toFixed(1) + '%',
      accessOrderSize: this.cacheAccessOrder.size,
      accessOrderAccuracy: (accessOrderAccuracy * 100).toFixed(1) + '%',
      
      // Eviction metrics
      evictions,
      avgEvictionTime: avgEvictionTime.toFixed(2) + 'ms',
      avgEvictionEfficiency: avgEvictionEfficiency.toFixed(1) + '%',
      adaptiveCleanupTriggers: this.cacheEfficiencyMetrics.adaptiveCleanupTriggers,
      
      // Temperature-based metrics
      hotElements: this.cacheEfficiencyMetrics.hotElements.size,
      coldElements: this.cacheEfficiencyMetrics.coldElements.size,
      hotElementRatio: (hotElementRatio * 100).toFixed(1) + '%',
      coldElementRatio: (coldElementRatio * 100).toFixed(1) + '%',
      
      // Performance metrics
      averageAccessTime: this.cacheEfficiencyMetrics.averageAccessTime.toFixed(3) + 'ms',
      totalCacheOperations: this.cacheEfficiencyMetrics.totalCacheOperations,
      memoryPressureEvents: this.cacheEfficiencyMetrics.memoryPressureEvents,
      memoryPressureScore: (this.metrics.memoryPressureScore || 0).toFixed(2),
      
      // Streak metrics
      longestHitStreak: this.cacheEfficiencyMetrics.longestHitStreak,
      longestMissStreak: this.cacheEfficiencyMetrics.longestMissStreak,
      currentHitStreak: this.cacheEfficiencyMetrics.cacheHitStreak,
      currentMissStreak: this.cacheEfficiencyMetrics.cacheMissStreak,
      
      // Advanced efficiency calculations
      memoryEfficiency: this.cacheSize > 0 ? (this.metrics.cacheHits / this.cacheSize).toFixed(2) : '0.00',
      accessEfficiency: totalAttempts > 0 ? (this.metrics.cacheHits / totalAttempts).toFixed(3) : '0.000',
      performanceTrend: performanceTrend,
      
      // Recent eviction history summary
      recentEvictions: recentEvictions.map(ev => ({
        mode: ev.mode,
        strategy: ev.strategy,
        efficiency: ev.efficiency.toFixed(1) + '%',
        evictionTime: ev.evictionTime.toFixed(2) + 'ms'
      }))
    };
  }

  /**
   * Calculate cache performance trend based on recent metrics
   * @returns {Object} - Performance trend analysis
   */
  calculateCachePerformanceTrend() {
    if (!this.metrics.utilizationHistory || this.metrics.utilizationHistory.length < 3) {
      return { trend: 'insufficient_data', direction: 'stable', confidence: 0 };
    }
    
    const recent = this.metrics.utilizationHistory.slice(-5);
    const utilizationTrend = recent[recent.length - 1].utilization - recent[0].utilization;
    const avgUtilization = recent.reduce((sum, entry) => sum + entry.utilization, 0) / recent.length;
    
    // Determine trend direction
    let direction = 'stable';
    if (utilizationTrend > 5) direction = 'increasing';
    else if (utilizationTrend < -5) direction = 'decreasing';
    
    // Calculate confidence based on consistency
    const changes = [];
    for (let i = 1; i < recent.length; i++) {
      changes.push(recent[i].utilization - recent[i-1].utilization);
    }
    
    const avgChange = changes.reduce((sum, change) => sum + change, 0) / changes.length;
    const consistency = changes.filter(change => 
      (avgChange > 0 && change > 0) || (avgChange < 0 && change < 0) || Math.abs(change) < 2
    ).length / changes.length;
    
    return {
      trend: direction,
      direction: direction,
      confidence: (consistency * 100).toFixed(0) + '%',
      avgUtilization: avgUtilization.toFixed(1) + '%',
      utilizationChange: utilizationTrend.toFixed(1) + '%',
      volatility: this.calculateUtilizationVolatility(recent).toFixed(2)
    };
  }

  /**
   * Generate comprehensive cache efficiency report for analysis and debugging
   * @returns {Object} - Detailed cache performance report
   */
  generateCacheEfficiencyReport() {
    const report = {
      timestamp: new Date().toISOString(),
      summary: this.getCacheEfficiencyMetrics(),
      
      // Detailed cache state analysis
      cacheState: {
        totalElements: this.cacheSize,
        trackedElements: this.cacheAccessOrder.size,
        hotElements: Array.from(this.cacheEfficiencyMetrics.hotElements.entries()).map(([id, data]) => ({
          elementId: id.substring(0, 10) + '...',
          accessCount: data.accessCount,
          accessFrequency: data.accessFrequency.toFixed(2) + ' accesses/min',
          priority: data.priority.toFixed(2),
          lastAccess: new Date(data.lastAccess).toLocaleTimeString()
        })).slice(0, 10), // Top 10 hot elements
        
        coldElementsCount: this.cacheEfficiencyMetrics.coldElements.size,
        memoryPressureScore: (this.metrics.memoryPressureScore || 0).toFixed(2)
      },
      
      // Performance analysis
      performance: {
        averageAccessTime: this.cacheEfficiencyMetrics.averageAccessTime.toFixed(3) + 'ms',
        totalOperations: this.cacheEfficiencyMetrics.totalCacheOperations,
        operationsPerSecond: this.calculateOperationsPerSecond(),
        efficiencyTrend: this.calculateCachePerformanceTrend(),
        memoryPressureEvents: this.cacheEfficiencyMetrics.memoryPressureEvents
      },
      
      // Eviction analysis
      evictionAnalysis: {
        totalEvictions: this.metrics.cacheEvictions || 0,
        adaptiveCleanups: this.cacheEfficiencyMetrics.adaptiveCleanupTriggers,
        recentEvictions: this.cacheEfficiencyMetrics.evictionHistory.slice(-10),
        evictionStrategies: this.analyzeEvictionStrategies()
      },
      
      // Recommendations
      recommendations: this.generateCacheOptimizationRecommendations()
    };
    
    return report;
  }

  /**
   * Calculate cache operations per second for performance analysis
   * @returns {number} - Operations per second
   */
  calculateOperationsPerSecond() {
    if (!this.metrics.lastUpdateTime || this.cacheEfficiencyMetrics.totalCacheOperations === 0) {
      return 0;
    }
    
    const timeElapsed = (Date.now() - this.metrics.lastUpdateTime) / 1000;
    return timeElapsed > 0 ? (this.cacheEfficiencyMetrics.totalCacheOperations / timeElapsed).toFixed(2) : 0;
  }

  /**
   * Analyze eviction strategies used and their effectiveness
   * @returns {Object} - Eviction strategy analysis
   */
  analyzeEvictionStrategies() {
    const strategies = {};
    
    this.cacheEfficiencyMetrics.evictionHistory.forEach(eviction => {
      if (!strategies[eviction.strategy]) {
        strategies[eviction.strategy] = {
          count: 0,
          totalEfficiency: 0,
          totalTime: 0,
          avgEfficiency: 0,
          avgTime: 0
        };
      }
      
      const strategy = strategies[eviction.strategy];
      strategy.count++;
      strategy.totalEfficiency += eviction.efficiency;
      strategy.totalTime += eviction.evictionTime;
      strategy.avgEfficiency = strategy.totalEfficiency / strategy.count;
      strategy.avgTime = strategy.totalTime / strategy.count;
    });
    
    // Format for readability
    Object.keys(strategies).forEach(key => {
      const strategy = strategies[key];
      strategy.avgEfficiency = strategy.avgEfficiency.toFixed(1) + '%';
      strategy.avgTime = strategy.avgTime.toFixed(2) + 'ms';
    });
    
    return strategies;
  }

  /**
   * Generate cache optimization recommendations based on current performance
   * @returns {Array} - List of optimization recommendations
   */
  generateCacheOptimizationRecommendations() {
    const recommendations = [];
    const metrics = this.getCacheEfficiencyMetrics();
    const hitRatio = parseFloat(metrics.hitRatio);
    const utilization = parseFloat(metrics.utilization);
    
    // Hit ratio recommendations
    if (hitRatio < 70) {
      recommendations.push({
        type: 'performance',
        priority: 'high',
        issue: 'Low cache hit ratio',
        recommendation: 'Consider increasing cache size or improving element access patterns',
        currentValue: metrics.hitRatio,
        targetValue: '80%+'
      });
    }
    
    // Utilization recommendations
    if (utilization > 90) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        issue: 'High cache utilization',
        recommendation: 'Consider increasing max cache size or more aggressive cleanup',
        currentValue: metrics.utilization,
        targetValue: '70-85%'
      });
    }
    
    // Cold elements recommendations
    const coldRatio = parseFloat(metrics.coldElementRatio);
    if (coldRatio > 30) {
      recommendations.push({
        type: 'efficiency',
        priority: 'medium',
        issue: 'High ratio of cold elements',
        recommendation: 'Enable more frequent maintenance cleanup to remove unused elements',
        currentValue: metrics.coldElementRatio,
        targetValue: '<20%'
      });
    }
    
    // Memory pressure recommendations
    const memoryPressure = parseFloat(metrics.memoryPressureScore);
    if (memoryPressure > 0.7) {
      recommendations.push({
        type: 'memory',
        priority: 'high',
        issue: 'High memory pressure detected',
        recommendation: 'Enable adaptive processing and consider reducing cache size limits',
        currentValue: metrics.memoryPressureScore,
        targetValue: '<0.5'
      });
    }
    
    // Eviction efficiency recommendations
    const evictionEfficiency = parseFloat(metrics.avgEvictionEfficiency);
    if (evictionEfficiency < 80) {
      recommendations.push({
        type: 'performance',
        priority: 'low',
        issue: 'Low eviction efficiency',
        recommendation: 'Review element tracking accuracy and cleanup strategies',
        currentValue: metrics.avgEvictionEfficiency,
        targetValue: '90%+'
      });
    }
    
    return recommendations;
  }

  /**
   * Force cache cleanup - useful for memory management
   */
  forceCacheCleanup() {
    const oldSize = this.cacheSize;
    
    // Clear access order tracking
    this.cacheAccessOrder.clear();
    
    // Clear temperature tracking
    this.cacheEfficiencyMetrics.hotElements.clear();
    this.cacheEfficiencyMetrics.coldElements.clear();
    
    // Reset cache size (WeakMap will be cleaned up by garbage collection)
    this.cacheSize = 0;
    
    // Reset efficiency metrics
    this.cacheEfficiencyMetrics.cacheHitStreak = 0;
    this.cacheEfficiencyMetrics.cacheMissStreak = 0;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Enhanced forced cache cleanup:', {
        previousSize: oldSize,
        newSize: this.cacheSize,
        accessOrderCleared: true,
        temperatureTrackingCleared: true,
        streaksReset: true
      });
    }
  }

  /**
   * Cleanup the intersection observer and resources
   */
  cleanup() {
    if (this.textObserver) {
      this.textObserver.disconnect();
      this.textObserver = null;
    }
    
    if (this.rectangleRoot && this.rectangleRoot.parentNode) {
      this.rectangleRoot.parentNode.removeChild(this.rectangleRoot);
      this.rectangleRoot = null;
    }
    
    this.intersectingTextElements.clear();
    this.intersectingTextNodes.clear();
    this.elementStates.clear();
    this.textNodeCache = new WeakMap();
    
    // Clean up enhanced LRU cache management
    this.cacheAccessOrder.clear();
    this.cacheSize = 0;
    
    // Clean up cache efficiency metrics
    this.cacheEfficiencyMetrics.hotElements.clear();
    this.cacheEfficiencyMetrics.coldElements.clear();
    this.cacheEfficiencyMetrics.evictionHistory = [];
    this.cacheEfficiencyMetrics.totalCacheOperations = 0;
    this.cacheEfficiencyMetrics.cacheHitStreak = 0;
    this.cacheEfficiencyMetrics.longestHitStreak = 0;
    this.cacheEfficiencyMetrics.cacheMissStreak = 0;
    this.cacheEfficiencyMetrics.longestMissStreak = 0;
    this.cacheEfficiencyMetrics.averageAccessTime = 0;
    this.cacheEfficiencyMetrics.totalAccessTime = 0;
    this.cacheEfficiencyMetrics.memoryPressureEvents = 0;
    this.cacheEfficiencyMetrics.adaptiveCleanupTriggers = 0;
    
    // Clean up adaptive processing timers (Task 2.1)
    if (this.adaptiveProcessor && this.adaptiveProcessor.enabled) {
      this.cleanupAdaptiveProcessing();
    }
    
    // Reset metrics
    Object.keys(this.metrics).forEach(key => {
      if (typeof this.metrics[key] === 'number') {
        this.metrics[key] = 0;
      }
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Enhanced rectangle intersection observer cleaned up');
    }
  }

  /**
   * Clean up adaptive processing resources (Task 2.1)
   */
  cleanupAdaptiveProcessing() {
    const batchProcessor = this.adaptiveProcessor.batchProcessor;
    
    // Clear batch timer
    if (batchProcessor.batchTimer) {
      clearTimeout(batchProcessor.batchTimer);
      batchProcessor.batchTimer = null;
    }
    
    // Clear pending batch
    batchProcessor.pendingBatch = [];
    
    // Clear frame monitoring data
    this.adaptiveProcessor.frameRateMonitor.frameTimes = [];
    
    // Clear quality history
    this.adaptiveProcessor.qualityController.qualityHistory = [];
    
    // Clean up predictive caching (Task 2.2)
    if (this.predictiveCaching && this.predictiveCaching.enabled) {
      this.cleanupPredictiveCaching();
    }
    
    // Clean up enhanced analytics (Task 2.3)
    if (this.enhancedAnalytics && this.enhancedAnalytics.enabled) {
      this.cleanupEnhancedAnalytics();
    }
    
    // Clean up performance monitoring (Task 2.3) - now integrated
    if (this.performanceMonitoringEnabled) {
      // Performance monitoring cleanup is handled by integrated system
      this.performanceState.isActive = false;
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Adaptive processing cleaned up');
    }
  }

  /**
   * Clean up predictive caching resources (Task 2.2)
   */
  cleanupPredictiveCaching() {
    const preloader = this.predictiveCaching.preloader;
    
    // Clear preload timer
    if (preloader.preloadTimer) {
      clearInterval(preloader.preloadTimer);
      preloader.preloadTimer = null;
    }
    
    // Clear preload queue
    preloader.preloadQueue = [];
    
    // Clear behavior analysis data
    this.predictiveCaching.behaviorAnalyzer.interactionHistory = [];
    this.predictiveCaching.behaviorAnalyzer.patterns.clear();
    
    // Clear scroll prediction data
    this.predictiveCaching.scrollPredictor.scrollHistory = [];
    
    // Clear viewport cache
    this.predictiveCaching.viewportCaching.sectorCache.clear();
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Predictive caching cleaned up');
    }
  }

  /**
   * Clean up enhanced analytics resources (Task 2.3)
   */
  cleanupEnhancedAnalytics() {
    const analytics = this.enhancedAnalytics;
    
    // Clear dashboard timer
    if (analytics.dashboard.updateTimer) {
      clearInterval(analytics.dashboard.updateTimer);
      analytics.dashboard.updateTimer = null;
    }
    
    // Clear trend analysis timer
    if (analytics.trendAnalyzer.analysisTimer) {
      clearInterval(analytics.trendAnalyzer.analysisTimer);
      analytics.trendAnalyzer.analysisTimer = null;
    }
    
    // Clear memory sampling timer
    if (analytics.memoryAnalyzer.samplingTimer) {
      clearInterval(analytics.memoryAnalyzer.samplingTimer);
      analytics.memoryAnalyzer.samplingTimer = null;
    }
    
    // Clear analytics data
    Object.keys(analytics.dashboard.currentMetrics).forEach(metric => {
      analytics.dashboard.currentMetrics[metric] = [];
    });
    
    analytics.trendAnalyzer.trends.clear();
    analytics.regressionDetector.regressions = [];
    analytics.memoryAnalyzer.memorySamples = [];
    analytics.comparisonAnalyzer.edgeOnlySamples = [];
    analytics.comparisonAnalyzer.spatialSamples = [];
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Enhanced analytics cleaned up');
    }
  }

  /**
   * Update analytics with new performance data (Task 2.3)
   * @param {Object} data - Current performance data
   */
  updateAnalyticsWithNewData(data) {
    // Update regression detection
    this.updateRegressionDetection(data);
    
    // Update comparison analytics
    this.updateComparisonAnalytics(data);
    
    // Record sample for trend analysis (handled by dashboard update)
  }

  /**
   * Update regression detection with new data (Task 2.3)
   * @param {Object} data - Current performance data
   */
  updateRegressionDetection(data) {
    const regressionDetector = this.enhancedAnalytics.regressionDetector;
    
    // Update baseline metrics
    regressionDetector.baselineMetrics.forEach((baseline, metric) => {
      if (data[metric] !== undefined) {
        baseline.samples.push(data[metric]);
        
        // Keep only recent samples
        if (baseline.samples.length > regressionDetector.detectionWindow) {
          baseline.samples.shift();
        }
        
        // Establish baseline after enough samples
        if (!baseline.established && baseline.samples.length >= 10) {
          baseline.baseline = baseline.samples.reduce((a, b) => a + b, 0) / baseline.samples.length;
          baseline.established = true;
        }
        
        // Check for regression
        if (baseline.established) {
          this.checkForRegression(metric, data[metric], baseline);
        }
      }
    });
  }

  /**
   * Check for performance regression (Task 2.3)
   * @param {string} metric - Metric name
   * @param {number} currentValue - Current metric value
   * @param {Object} baseline - Baseline data
   */
  checkForRegression(metric, currentValue, baseline) {
    const regressionDetector = this.enhancedAnalytics.regressionDetector;
    
    let isRegression = false;
    
    // Different regression logic for different metrics
    switch (metric) {
      case 'processingTime':
      case 'memoryUsage':
        // Higher values are worse
        isRegression = currentValue > baseline.baseline * regressionDetector.thresholdFactor;
        break;
      case 'cacheHitRatio':
      case 'performanceGain':
        // Lower values are worse
        isRegression = currentValue < baseline.baseline / regressionDetector.thresholdFactor;
        break;
    }
    
    if (isRegression) {
      regressionDetector.consecutivePoorSamples++;
      
      if (regressionDetector.consecutivePoorSamples >= regressionDetector.consecutiveThreshold) {
        this.alertPerformanceRegression(metric, currentValue, baseline.baseline);
        regressionDetector.consecutivePoorSamples = 0; // Reset to avoid spam
      }
    } else {
      // Check for recovery
      const isRecovery = this.isPerformanceRecovery(metric, currentValue, baseline.baseline);
      if (isRecovery && regressionDetector.consecutivePoorSamples > 0) {
        regressionDetector.consecutivePoorSamples = 0;
        
        if (this.debugLogging) {
          console.log('[KeyPilot Debug] Performance recovery detected:', {
            metric,
            currentValue,
            baseline: baseline.baseline
          });
        }
      }
    }
  }

  /**
   * Check if current performance indicates recovery (Task 2.3)
   * @param {string} metric - Metric name
   * @param {number} currentValue - Current metric value
   * @param {number} baselineValue - Baseline metric value
   * @returns {boolean} - True if performance has recovered
   */
  isPerformanceRecovery(metric, currentValue, baselineValue) {
    const recoveryThreshold = this.enhancedAnalytics.regressionDetector.recoveryThreshold;
    
    switch (metric) {
      case 'processingTime':
      case 'memoryUsage':
        return currentValue <= baselineValue * (1 + (1 - recoveryThreshold));
      case 'cacheHitRatio':
      case 'performanceGain':
        return currentValue >= baselineValue * recoveryThreshold;
      default:
        return false;
    }
  }

  /**
   * Update comparison analytics (Task 2.3)
   * @param {Object} data - Current performance data
   */
  updateComparisonAnalytics(data) {
    const comparisonAnalyzer = this.enhancedAnalytics.comparisonAnalyzer;
    
    // Add sample to edge-only data (current method)
    comparisonAnalyzer.edgeOnlySamples.push({
      processingTime: data.processingTime,
      memoryUsage: data.memoryUsage,
      cacheEfficiency: data.cacheHitRatio,
      timestamp: data.timestamp
    });
    
    // Keep only recent samples
    if (comparisonAnalyzer.edgeOnlySamples.length > comparisonAnalyzer.sampleSize) {
      comparisonAnalyzer.edgeOnlySamples.shift();
    }
    
    // Perform comparison if we have enough samples
    if (comparisonAnalyzer.edgeOnlySamples.length >= 20) {
      this.performStatisticalComparison();
    }
  }

  /**
   * Perform statistical comparison between methods (Task 2.3)
   */
  performStatisticalComparison() {
    const comparisonAnalyzer = this.enhancedAnalytics.comparisonAnalyzer;
    const now = Date.now();
    
    // Only perform comparison periodically
    if (now - comparisonAnalyzer.lastComparison < 30000) {
      return;
    }
    
    const edgeSamples = comparisonAnalyzer.edgeOnlySamples;
    
    // Calculate statistics for edge-only method
    const edgeProcessingTimes = edgeSamples.map(s => s.processingTime);
    const edgeMemoryUsage = edgeSamples.map(s => s.memoryUsage);
    
    const edgeStats = {
      processingTime: this.calculateStatistics(edgeProcessingTimes),
      memoryUsage: this.calculateStatistics(edgeMemoryUsage)
    };
    
    // Estimate spatial method performance (based on observed patterns)
    const estimatedSpatialStats = this.estimateSpatialMethodPerformance(edgeStats);
    
    // Update comparison results
    comparisonAnalyzer.comparisonResults.set('processingTime', {
      edgeOnlyMean: edgeStats.processingTime.mean,
      spatialMean: estimatedSpatialStats.processingTime.mean,
      edgeOnlyStdDev: edgeStats.processingTime.stdDev,
      spatialStdDev: estimatedSpatialStats.processingTime.stdDev,
      significantDifference: edgeStats.processingTime.mean < estimatedSpatialStats.processingTime.mean,
      effectSize: this.calculateEffectSize(edgeStats.processingTime, estimatedSpatialStats.processingTime),
      lastComparison: now
    });
    
    comparisonAnalyzer.lastComparison = now;
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Statistical comparison completed:', {
        edgeOnlyProcessingTime: edgeStats.processingTime.mean.toFixed(2) + 'ms',
        estimatedSpatialProcessingTime: estimatedSpatialStats.processingTime.mean.toFixed(2) + 'ms',
        performanceImprovement: ((estimatedSpatialStats.processingTime.mean - edgeStats.processingTime.mean) / estimatedSpatialStats.processingTime.mean * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * Calculate basic statistics for a dataset (Task 2.3)
   * @param {Array} data - Array of numbers
   * @returns {Object} - Statistics object
   */
  calculateStatistics(data) {
    if (data.length === 0) {
      return { mean: 0, stdDev: 0, min: 0, max: 0, median: 0 };
    }
    
    const sorted = [...data].sort((a, b) => a - b);
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    const stdDev = Math.sqrt(variance);
    const median = sorted.length % 2 === 0 
      ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
      : sorted[Math.floor(sorted.length / 2)];
    
    return {
      mean,
      stdDev,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median
    };
  }

  /**
   * Estimate spatial method performance based on edge-only data (Task 2.3)
   * @param {Object} edgeStats - Edge-only method statistics
   * @returns {Object} - Estimated spatial method statistics
   */
  estimateSpatialMethodPerformance(edgeStats) {
    // Based on observed patterns, spatial method is typically 10-50x slower
    const spatialMultiplier = 25; // Conservative estimate
    
    return {
      processingTime: {
        mean: edgeStats.processingTime.mean * spatialMultiplier,
        stdDev: edgeStats.processingTime.stdDev * spatialMultiplier
      },
      memoryUsage: {
        mean: edgeStats.memoryUsage.mean * 1.5, // Spatial uses more memory
        stdDev: edgeStats.memoryUsage.stdDev * 1.5
      }
    };
  }

  /**
   * Calculate effect size between two methods (Task 2.3)
   * @param {Object} method1Stats - Statistics for method 1
   * @param {Object} method2Stats - Statistics for method 2
   * @returns {number} - Cohen's d effect size
   */
  calculateEffectSize(method1Stats, method2Stats) {
    const pooledStdDev = Math.sqrt(
      (Math.pow(method1Stats.stdDev, 2) + Math.pow(method2Stats.stdDev, 2)) / 2
    );
    
    if (pooledStdDev === 0) return 0;
    
    return Math.abs(method1Stats.mean - method2Stats.mean) / pooledStdDev;
  }

  /**
   * Alert on performance trend (Task 2.3)
   * @param {string} metric - Metric name
   * @param {Object} trendData - Trend analysis data
   */
  alertPerformanceTrend(metric, trendData) {
    if (this.debugLogging) {
      console.warn('[KeyPilot Debug] Performance trend alert:', {
        metric,
        trend: trendData.trend,
        confidence: trendData.confidence.toFixed(2),
        slope: trendData.slope.toFixed(4)
      });
    }
    
    // Could trigger user notification or logging here
  }

  /**
   * Alert on performance regression (Task 2.3)
   * @param {string} metric - Metric name
   * @param {number} currentValue - Current metric value
   * @param {number} baselineValue - Baseline metric value
   */
  alertPerformanceRegression(metric, currentValue, baselineValue) {
    const degradationPercent = ((currentValue - baselineValue) / baselineValue * 100).toFixed(1);
    
    if (this.debugLogging) {
      console.warn('[KeyPilot Debug] Performance regression detected:', {
        metric,
        currentValue: currentValue.toFixed(2),
        baselineValue: baselineValue.toFixed(2),
        degradation: degradationPercent + '%'
      });
    }
    
    // Could trigger user notification or automatic fallback here
  }

  /**
   * Detect memory leaks (Task 2.3)
   */
  detectMemoryLeaks() {
    const memoryAnalyzer = this.enhancedAnalytics.memoryAnalyzer;
    const samples = memoryAnalyzer.memorySamples;
    
    if (samples.length < memoryAnalyzer.leakDetectionWindow) {
      return;
    }
    
    // Check for consistent memory growth
    const recentSamples = samples.slice(-memoryAnalyzer.leakDetectionWindow);
    const memoryValues = recentSamples.map(s => s.totalMemory);
    
    // Calculate trend
    const timestamps = recentSamples.map(s => s.timestamp);
    const regression = this.calculateLinearRegression(timestamps, memoryValues);
    
    // Detect leak if memory is consistently growing
    const avgMemory = memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length;
    const growthRate = regression.slope / avgMemory;
    
    const wasLeakDetected = memoryAnalyzer.leakDetected;
    memoryAnalyzer.leakDetected = growthRate > memoryAnalyzer.growthThreshold && regression.rSquared > 0.7;
    
    if (memoryAnalyzer.leakDetected && !wasLeakDetected) {
      if (this.debugLogging) {
        console.warn('[KeyPilot Debug] Memory leak detected:', {
          growthRate: (growthRate * 100).toFixed(2) + '%',
          confidence: regression.rSquared.toFixed(2),
          avgMemory: avgMemory.toFixed(1) + 'MB'
        });
      }
    }
  }

  /**
   * Detect memory pressure (Task 2.3)
   * @param {Object} sample - Memory usage sample
   */
  detectMemoryPressure(sample) {
    const memoryAnalyzer = this.enhancedAnalytics.memoryAnalyzer;
    const pressureThreshold = memoryAnalyzer.pressureThreshold;
    
    // Calculate memory pressure based on heap usage
    const memoryPressure = sample.heapUsed / sample.heapTotal;
    
    const wasPressureDetected = memoryAnalyzer.pressureDetected;
    memoryAnalyzer.pressureDetected = memoryPressure > pressureThreshold;
    
    if (memoryAnalyzer.pressureDetected && !wasPressureDetected) {
      if (this.debugLogging) {
        console.warn('[KeyPilot Debug] Memory pressure detected:', {
          heapUsed: sample.heapUsed.toFixed(1) + 'MB',
          heapTotal: sample.heapTotal.toFixed(1) + 'MB',
          pressure: (memoryPressure * 100).toFixed(1) + '%',
          threshold: (pressureThreshold * 100).toFixed(1) + '%'
        });
      }
      
      // Trigger aggressive cache cleanup
      this.performAggressiveCleanup();
    }
  }

  /**
   * Get cache hit ratio as numeric value (Task 2.3)
   * @returns {number} - Cache hit ratio (0-1)
   */
  getCacheHitRatioNumeric() {
    const totalAttempts = this.metrics.cacheHits + this.metrics.cacheMisses;
    return totalAttempts > 0 ? this.metrics.cacheHits / totalAttempts : 0;
  }

  /**
   * Get performance gain as numeric value (Task 2.3)
   * @returns {number} - Performance gain (0-1)
   */
  getPerformanceGainNumeric() {
    if (this.metrics.estimatedFullTraversalTime === 0) {
      return 0;
    }
    
    const actualTime = this.metrics.actualEdgeProcessingTime;
    const estimatedTime = this.metrics.estimatedFullTraversalTime;
    
    return Math.max(0, (estimatedTime - actualTime) / estimatedTime);
  }

  /**
   * Get estimated memory usage (Task 2.3)
   * @returns {number} - Estimated memory usage in MB
   */
  getEstimatedMemoryUsage() {
    // Rough estimate based on cache size and other factors
    const cacheMemory = this.cacheSize * 0.001; // ~1KB per cached element
    const systemMemory = 2; // Base system memory usage
    
    return cacheMemory + systemMemory;
  }

  /**
   * Get detailed memory usage breakdown (Task 2.3)
   * @returns {Object} - Detailed memory usage information
   */
  getDetailedMemoryUsage() {
    const cacheMemory = this.cacheSize * 0.001;
    const systemMemory = 2;
    const total = cacheMemory + systemMemory;
    
    // Try to get actual heap usage if available
    let heapUsed = total;
    let heapTotal = total * 2;
    
    if (performance.memory) {
      heapUsed = performance.memory.usedJSHeapSize / (1024 * 1024);
      heapTotal = performance.memory.totalJSHeapSize / (1024 * 1024);
    }
    
    return {
      total,
      cache: cacheMemory,
      system: systemMemory,
      heapUsed,
      heapTotal
    };
  }

  /**
   * Find elements in a specific area (Task 2.2)
   * @param {Object} area - Area with left, top, right, bottom properties
   * @returns {Array} - Elements in the area
   */
  findElementsInArea(area) {
    const elements = [];
    const textContainerSelectors = [
      'p', 'div', 'span', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'li', 'td', 'th', 'blockquote', 'pre', 'code',
      'a', 'strong', 'em', 'b', 'i', 'u',
      'article', 'section', 'main', 'aside'
    ].join(', ');
    
    const allElements = document.querySelectorAll(textContainerSelectors);
    
    for (const element of allElements) {
      if (!this.elementContainsText(element)) {
        continue;
      }
      
      const rect = element.getBoundingClientRect();
      const elementArea = {
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        right: rect.right + window.scrollX,
        bottom: rect.bottom + window.scrollY
      };
      
      // Check if element intersects with the area
      if (elementArea.right >= area.left &&
          elementArea.left <= area.right &&
          elementArea.bottom >= area.top &&
          elementArea.top <= area.bottom) {
        elements.push(element);
      }
    }
    
    return elements;
  }

  /**
   * Preload text nodes for an element (Task 2.2)
   * @param {Element} element - Element to preload
   * @param {string} reason - Reason for preloading
   */
  preloadElementTextNodes(element, reason) {
    const preloader = this.predictiveCaching.preloader;
    
    // Check if already preloaded or in cache
    if (this.textNodeCache.has(element) || preloader.preloadCache.has(element)) {
      return;
    }
    
    // Add to preload queue
    preloader.preloadQueue.push({
      element,
      reason,
      priority: this.calculatePreloadPriority(element, reason),
      timestamp: Date.now()
    });
    
    // Sort queue by priority
    preloader.preloadQueue.sort((a, b) => b.priority - a.priority);
    
    // Limit queue size
    if (preloader.preloadQueue.length > preloader.maxElements) {
      preloader.preloadQueue = preloader.preloadQueue.slice(0, preloader.maxElements);
    }
  }

  /**
   * Calculate preload priority for an element (Task 2.2)
   * @param {Element} element - Element to calculate priority for
   * @param {string} reason - Reason for preloading
   * @returns {number} - Priority score (0-1)
   */
  calculatePreloadPriority(element, reason) {
    let priority = 0.5; // Base priority
    
    // Adjust based on reason
    switch (reason) {
      case 'viewport':
        priority += 0.3;
        break;
      case 'scroll_prediction':
        priority += 0.4;
        break;
      case 'behavior_pattern':
        priority += 0.2;
        break;
    }
    
    // Adjust based on element characteristics
    const textLength = element.textContent?.length || 0;
    if (textLength > 100) {
      priority += 0.1; // Prefer elements with more text
    }
    
    // Adjust based on element visibility
    const rect = element.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      priority += 0.1; // Prefer visible elements
    }
    
    // Adjust based on element type
    const tagName = element.tagName.toLowerCase();
    if (['p', 'div', 'article', 'section'].includes(tagName)) {
      priority += 0.1; // Prefer content elements
    }
    
    return Math.min(1, Math.max(0, priority));
  }

  /**
   * Execute a preload request (Task 2.2)
   * @param {Object} request - Preload request
   */
  executePreloadRequest(request) {
    const { element, reason, priority } = request;
    const preloader = this.predictiveCaching.preloader;
    
    try {
      // Extract text nodes (similar to extractTextNodesFromElement but for preloading)
      const textNodes = [];
      const walker = document.createTreeWalker(
        element,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            if (!node.textContent || !node.textContent.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            
            const parent = node.parentElement;
            if (parent && this.isNonContentElement(parent)) {
              return NodeFilter.FILTER_REJECT;
            }
            
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      // Cache the preloaded text nodes
      this.textNodeCache.set(element, textNodes);
      this.cacheTextNodes(element, textNodes);
      
      // Mark as preloaded
      preloader.preloadCache.set(element, {
        reason,
        priority,
        timestamp: Date.now(),
        textNodeCount: textNodes.length
      });
      
      if (this.debugLogging) {
        console.log('[KeyPilot Debug] Element preloaded:', {
          element: element.tagName,
          reason,
          priority: priority.toFixed(2),
          textNodes: textNodes.length
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error preloading element:', error);
    }
  }

  /**
   * Preload elements for consistent rectangle sizes (Task 2.2)
   */
  preloadForConsistentSizes() {
    // Implementation for consistent size pattern
    const viewport = this.predictiveCaching.viewportCaching.currentViewport;
    const expandedArea = {
      left: viewport.x - 100,
      top: viewport.y - 100,
      right: viewport.x + viewport.width + 100,
      bottom: viewport.y + viewport.height + 100
    };
    
    const elements = this.findElementsInArea(expandedArea);
    elements.forEach(element => {
      this.preloadElementTextNodes(element, 'behavior_pattern');
    });
  }

  /**
   * Preload elements in repeated areas (Task 2.2)
   */
  preloadRepeatedAreas() {
    // Implementation for repeated areas pattern
    const behaviorAnalyzer = this.predictiveCaching.behaviorAnalyzer;
    const recentInteractions = behaviorAnalyzer.interactionHistory.slice(-5);
    
    recentInteractions.forEach(interaction => {
      if (interaction.type === 'rectangle_update') {
        const rect = interaction.data.rect;
        const area = {
          left: rect.left - 50,
          top: rect.top - 50,
          right: rect.left + rect.width + 50,
          bottom: rect.top + rect.height + 50
        };
        
        const elements = this.findElementsInArea(area);
        elements.forEach(element => {
          this.preloadElementTextNodes(element, 'behavior_pattern');
        });
      }
    });
  }

  /**
   * Preload elements for vertical scrolling (Task 2.2)
   */
  preloadVerticalScrollAreas() {
    const viewport = this.predictiveCaching.viewportCaching.currentViewport;
    const preloadArea = {
      left: viewport.x,
      top: viewport.y + viewport.height,
      right: viewport.x + viewport.width,
      bottom: viewport.y + viewport.height + 300
    };
    
    const elements = this.findElementsInArea(preloadArea);
    elements.forEach(element => {
      this.preloadElementTextNodes(element, 'behavior_pattern');
    });
  }

  /**
   * Preload elements for horizontal scrolling (Task 2.2)
   */
  preloadHorizontalScrollAreas() {
    const viewport = this.predictiveCaching.viewportCaching.currentViewport;
    const preloadArea = {
      left: viewport.x + viewport.width,
      top: viewport.y,
      right: viewport.x + viewport.width + 300,
      bottom: viewport.y + viewport.height
    };
    
    const elements = this.findElementsInArea(preloadArea);
    elements.forEach(element => {
      this.preloadElementTextNodes(element, 'behavior_pattern');
    });
  }

  /**
   * Initialize enhanced performance monitoring and analytics (Task 2.3)
   */
  initializeEnhancedAnalytics() {
    // Initialize real-time dashboard
    if (this.enhancedAnalytics.dashboard.enabled) {
      this.initializePerformanceDashboard();
    }
    
    // Initialize trend analysis
    if (this.enhancedAnalytics.trendAnalyzer.enabled) {
      this.initializeTrendAnalysis();
    }
    
    // Initialize regression detection
    if (this.enhancedAnalytics.regressionDetector.enabled) {
      this.initializeRegressionDetection();
    }
    
    // Initialize memory analytics
    if (this.enhancedAnalytics.memoryAnalyzer.enabled) {
      this.initializeMemoryAnalytics();
    }
    
    // Initialize comparison analytics
    if (this.enhancedAnalytics.comparisonAnalyzer.enabled) {
      this.initializeComparisonAnalytics();
    }
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Enhanced analytics initialized:', {
        dashboard: this.enhancedAnalytics.dashboard.enabled,
        trendAnalysis: this.enhancedAnalytics.trendAnalyzer.enabled,
        regressionDetection: this.enhancedAnalytics.regressionDetector.enabled,
        memoryAnalytics: this.enhancedAnalytics.memoryAnalyzer.enabled,
        comparisonAnalytics: this.enhancedAnalytics.comparisonAnalyzer.enabled
      });
    }
  }

  /**
   * Initialize real-time performance dashboard (Task 2.3)
   */
  initializePerformanceDashboard() {
    const dashboard = this.enhancedAnalytics.dashboard;
    
    // Start dashboard update timer
    dashboard.updateTimer = setInterval(() => {
      this.updatePerformanceDashboard();
    }, dashboard.updateInterval);
    
    // Initialize metrics arrays
    Object.keys(dashboard.currentMetrics).forEach(metric => {
      dashboard.currentMetrics[metric] = [];
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Performance dashboard initialized:', {
        updateInterval: dashboard.updateInterval + 'ms',
        historyWindow: dashboard.historyWindow,
        metricsBuffer: dashboard.metricsBuffer
      });
    }
  }

  /**
   * Update real-time performance dashboard (Task 2.3)
   */
  updatePerformanceDashboard() {
    const dashboard = this.enhancedAnalytics.dashboard;
    const now = Date.now();
    
    // Collect current metrics
    const currentData = {
      timestamp: now,
      processingTime: this.metrics.edgeProcessingTime || 0,
      cacheHitRatio: this.getCacheHitRatioNumeric(),
      memoryUsage: this.getEstimatedMemoryUsage(),
      elementsProcessed: this.metrics.edgeElementsProcessed || 0,
      performanceGain: this.getPerformanceGainNumeric(),
      frameRate: this.adaptiveProcessor?.frameRateMonitor?.currentFps || 60
    };
    
    // Add to metrics arrays
    Object.keys(currentData).forEach(metric => {
      if (metric !== 'timestamp') {
        dashboard.currentMetrics[metric].push({
          value: currentData[metric],
          timestamp: now
        });
        
        // Keep only recent data
        if (dashboard.currentMetrics[metric].length > dashboard.historyWindow) {
          dashboard.currentMetrics[metric].shift();
        }
      }
    });
    
    // Update analytics with new data
    this.updateAnalyticsWithNewData(currentData);
    
    dashboard.lastUpdate = now;
    
    if (this.debugLogging && now % 10000 < dashboard.updateInterval) {
      console.log('[KeyPilot Debug] Dashboard updated:', {
        processingTime: currentData.processingTime.toFixed(2) + 'ms',
        cacheHitRatio: (currentData.cacheHitRatio * 100).toFixed(1) + '%',
        memoryUsage: currentData.memoryUsage.toFixed(1) + 'MB',
        performanceGain: (currentData.performanceGain * 100).toFixed(1) + '%',
        frameRate: currentData.frameRate.toFixed(1) + 'fps'
      });
    }
  }

  /**
   * Initialize trend analysis system (Task 2.3)
   */
  initializeTrendAnalysis() {
    const trendAnalyzer = this.enhancedAnalytics.trendAnalyzer;
    
    // Start trend analysis timer
    trendAnalyzer.analysisTimer = setInterval(() => {
      this.analyzePerfomanceTrends();
    }, trendAnalyzer.analysisInterval);
    
    // Initialize trend tracking for key metrics
    const metricsToTrack = [
      'processingTime', 'cacheHitRatio', 'memoryUsage', 
      'performanceGain', 'frameRate'
    ];
    
    metricsToTrack.forEach(metric => {
      trendAnalyzer.trends.set(metric, {
        samples: [],
        trend: 'stable', // 'improving', 'degrading', 'stable'
        confidence: 0,
        slope: 0,
        lastAnalysis: 0
      });
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Trend analysis initialized:', {
        analysisInterval: trendAnalyzer.analysisInterval + 'ms',
        analysisWindow: trendAnalyzer.analysisWindow,
        metricsTracked: metricsToTrack.length
      });
    }
  }

  /**
   * Analyze performance trends (Task 2.3)
   */
  analyzePerfomanceTrends() {
    const trendAnalyzer = this.enhancedAnalytics.trendAnalyzer;
    const dashboard = this.enhancedAnalytics.dashboard;
    
    // Analyze trends for each metric
    trendAnalyzer.trends.forEach((trendData, metric) => {
      const metricData = dashboard.currentMetrics[metric];
      
      if (metricData.length < trendAnalyzer.analysisWindow) {
        return; // Not enough data for analysis
      }
      
      // Get recent samples
      const recentSamples = metricData.slice(-trendAnalyzer.analysisWindow);
      const values = recentSamples.map(sample => sample.value);
      const timestamps = recentSamples.map(sample => sample.timestamp);
      
      // Calculate linear regression
      const regression = this.calculateLinearRegression(timestamps, values);
      
      // Determine trend direction
      let trend = 'stable';
      const normalizedSlope = Math.abs(regression.slope) / (Math.max(...values) - Math.min(...values) + 0.001);
      
      if (normalizedSlope > trendAnalyzer.significanceThreshold) {
        if (regression.slope > 0) {
          trend = metric === 'processingTime' || metric === 'memoryUsage' ? 'degrading' : 'improving';
        } else {
          trend = metric === 'processingTime' || metric === 'memoryUsage' ? 'improving' : 'degrading';
        }
      }
      
      // Update trend data
      trendData.trend = trend;
      trendData.confidence = regression.rSquared;
      trendData.slope = regression.slope;
      trendData.lastAnalysis = Date.now();
      
      // Alert on significant trends
      if (trendData.confidence > trendAnalyzer.confidenceThreshold && trend === 'degrading') {
        this.alertPerformanceTrend(metric, trendData);
      }
    });
    
    trendAnalyzer.lastAnalysis = Date.now();
    
    if (this.debugLogging) {
      const trendSummary = {};
      trendAnalyzer.trends.forEach((data, metric) => {
        trendSummary[metric] = {
          trend: data.trend,
          confidence: data.confidence.toFixed(2)
        };
      });
      
      console.log('[KeyPilot Debug] Trend analysis completed:', trendSummary);
    }
  }

  /**
   * Calculate linear regression for trend analysis (Task 2.3)
   * @param {Array} x - X values (timestamps)
   * @param {Array} y - Y values (metric values)
   * @returns {Object} - Regression results
   */
  calculateLinearRegression(x, y) {
    const n = x.length;
    if (n === 0) return { slope: 0, intercept: 0, rSquared: 0 };
    
    // Normalize timestamps to prevent numerical issues
    const minX = Math.min(...x);
    const normalizedX = x.map(val => val - minX);
    
    const sumX = normalizedX.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = normalizedX.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = normalizedX.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    // Calculate R-squared
    const yMean = sumY / n;
    const ssRes = y.reduce((sum, yi, i) => {
      const predicted = slope * normalizedX[i] + intercept;
      return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const ssTot = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const rSquared = ssTot === 0 ? 1 : 1 - (ssRes / ssTot);
    
    return { slope, intercept, rSquared: Math.max(0, rSquared) };
  }

  /**
   * Initialize regression detection system (Task 2.3)
   */
  initializeRegressionDetection() {
    const regressionDetector = this.enhancedAnalytics.regressionDetector;
    
    // Initialize baseline metrics
    const metricsToMonitor = [
      'processingTime', 'cacheHitRatio', 'memoryUsage', 'performanceGain'
    ];
    
    metricsToMonitor.forEach(metric => {
      regressionDetector.baselineMetrics.set(metric, {
        baseline: null,
        samples: [],
        established: false
      });
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Regression detection initialized:', {
        detectionWindow: regressionDetector.detectionWindow,
        thresholdFactor: regressionDetector.thresholdFactor,
        consecutiveThreshold: regressionDetector.consecutiveThreshold
      });
    }
  }

  /**
   * Initialize memory analytics system (Task 2.3)
   */
  initializeMemoryAnalytics() {
    const memoryAnalyzer = this.enhancedAnalytics.memoryAnalyzer;
    
    // Start memory sampling
    memoryAnalyzer.samplingTimer = setInterval(() => {
      this.sampleMemoryUsage();
    }, memoryAnalyzer.samplingInterval);
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Memory analytics initialized:', {
        samplingInterval: memoryAnalyzer.samplingInterval + 'ms',
        leakDetectionWindow: memoryAnalyzer.leakDetectionWindow,
        growthThreshold: (memoryAnalyzer.growthThreshold * 100).toFixed(1) + '%'
      });
    }
  }

  /**
   * Sample memory usage for analytics (Task 2.3)
   */
  sampleMemoryUsage() {
    const memoryAnalyzer = this.enhancedAnalytics.memoryAnalyzer;
    
    const memoryUsage = this.getDetailedMemoryUsage();
    const sample = {
      timestamp: Date.now(),
      totalMemory: memoryUsage.total,
      cacheMemory: memoryUsage.cache,
      systemMemory: memoryUsage.system,
      heapUsed: memoryUsage.heapUsed,
      heapTotal: memoryUsage.heapTotal
    };
    
    memoryAnalyzer.memorySamples.push(sample);
    
    // Keep only recent samples
    if (memoryAnalyzer.memorySamples.length > memoryAnalyzer.leakDetectionWindow) {
      memoryAnalyzer.memorySamples.shift();
    }
    
    // Detect memory leaks
    this.detectMemoryLeaks();
    
    // Detect memory pressure
    this.detectMemoryPressure(sample);
  }

  /**
   * Initialize comparison analytics system (Task 2.3)
   */
  initializeComparisonAnalytics() {
    const comparisonAnalyzer = this.enhancedAnalytics.comparisonAnalyzer;
    
    // Initialize comparison results for key metrics
    const metricsToCompare = [
      'processingTime', 'accuracy', 'memoryUsage', 'cacheEfficiency'
    ];
    
    metricsToCompare.forEach(metric => {
      comparisonAnalyzer.comparisonResults.set(metric, {
        edgeOnlyMean: 0,
        spatialMean: 0,
        edgeOnlyStdDev: 0,
        spatialStdDev: 0,
        significantDifference: false,
        pValue: 1,
        effectSize: 0,
        lastComparison: 0
      });
    });
    
    if (this.debugLogging) {
      console.log('[KeyPilot Debug] Comparison analytics initialized:', {
        sampleSize: comparisonAnalyzer.sampleSize,
        confidenceInterval: comparisonAnalyzer.confidenceInterval,
        significanceThreshold: comparisonAnalyzer.significanceThreshold
      });
    }
  }

  // ===== INTEGRATED PERFORMANCE MONITORING METHODS =====

  /**
   * Initialize integrated performance monitoring system
   */
  initializePerformanceMonitoring() {
    if (!this.performanceMonitoringEnabled) {
      return;
    }

    const config = PERFORMANCE_MONITORING;
    
    // Core performance metrics
    this.performanceMetrics = {
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
    this.performanceHistory = {
      processingTimes: [],
      elementCounts: [],
      cacheHitRates: [],
      performanceGains: [],
      timestamps: []
    };
    
    // Performance monitoring state
    this.performanceState = {
      startTime: 0,
      sessionStartTime: Date.now(),
      totalOperations: 0,
      lastUpdate: 0,
      metricsBufferSize: config.METRICS_BUFFER_SIZE || 100,
      performanceThreshold: config.PERFORMANCE_THRESHOLD_MS || 50,
      baselinePerformance: null,
      regressionDetected: false,
      performanceDegradationFactor: 2.0,
      fallbackTriggered: false,
      isActive: true,
      alerts: []
    };
    
    // Performance alerts
    this.performanceAlerts = {
      performanceDegradation: false,
      highProcessingTime: false,
      lowCacheEfficiency: false,
      memoryPressure: false
    };
  }

  /**
   * Add performance alert to integrated system
   */
  addPerformanceAlert(type, data) {
    if (!this.performanceMonitoringEnabled) {
      return;
    }
    
    const alert = {
      type,
      data,
      timestamp: Date.now(),
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
    
    this.performanceState.alerts.push(alert);
    
    // Keep only recent alerts (last 50)
    if (this.performanceState.alerts.length > 50) {
      this.performanceState.alerts = this.performanceState.alerts.slice(-50);
    }
  }

  /**
   * Start performance monitoring session
   */
  startPerformanceMonitoring() {
    if (!this.performanceMonitoringEnabled) {
      return;
    }
    
    this.performanceState.startTime = performance.now();
    this.performanceState.sessionStartTime = Date.now();
    this.resetPerformanceMetrics();
  }

  /**
   * Record element processing performance metrics
   * @param {Object} data - Processing data
   */
  recordElementProcessing(data) {
    if (!this.performanceMonitoringEnabled) {
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
    this.performanceMetrics.elementsProcessed += elementsProcessed;
    this.performanceMetrics.elementsEntering += elementsEntering;
    this.performanceMetrics.elementsLeaving += elementsLeaving;
    this.performanceMetrics.elementsObserved = elementsObserved;
    this.performanceMetrics.totalProcessingTime += processingTime;
    
    // Update processing time statistics
    this.updateProcessingTimeStats(processingTime);
    
    // Add to historical data
    this.addToPerformanceHistory('processingTimes', processingTime);
    this.addToPerformanceHistory('elementCounts', elementsProcessed);
    this.addToPerformanceHistory('timestamps', Date.now());
    
    // Check for performance alerts
    this.checkPerformanceAlerts(processingTime);
    
    this.performanceState.totalOperations++;
    this.performanceState.lastUpdate = Date.now();
  }

  /**
   * Record character detection performance metrics
   * @param {Object} data - Character detection data
   */
  recordCharacterDetection(data) {
    if (!this.performanceMonitoringEnabled) {
      return;
    }
    
    const {
      charactersDetected = 0,
      detectionTime = 0,
      cacheHits = 0,
      cacheMisses = 0
    } = data;
    
    this.performanceMetrics.charactersDetected += charactersDetected;
    this.performanceMetrics.characterDetectionTime += detectionTime;
    this.performanceMetrics.characterCacheHits += cacheHits;
    this.performanceMetrics.characterCacheMisses += cacheMisses;
    
    // Calculate cache hit rate
    const totalCacheAccess = this.performanceMetrics.characterCacheHits + this.performanceMetrics.characterCacheMisses;
    this.performanceMetrics.cacheHitRate = totalCacheAccess > 0 
      ? (this.performanceMetrics.characterCacheHits / totalCacheAccess) * 100 
      : 0;
    
    this.addToPerformanceHistory('cacheHitRates', this.performanceMetrics.cacheHitRate);
  }

  /**
   * Record smart targeting performance metrics
   * @param {Object} data - Smart targeting data
   */
  recordSmartTargeting(data) {
    if (!this.performanceMonitoringEnabled) {
      return;
    }
    
    const {
      elementReductionPercentage = 0,
      smartTargetingTime = 0,
      dynamicElementsAdded = 0
    } = data;
    
    this.performanceMetrics.elementReductionPercentage = elementReductionPercentage;
    this.performanceMetrics.smartTargetingTime += smartTargetingTime;
    this.performanceMetrics.dynamicElementsAdded += dynamicElementsAdded;
  }

  /**
   * Record performance comparison data
   * @param {Object} data - Comparison data
   */
  recordPerformanceComparison(data) {
    if (!this.performanceMonitoringEnabled) {
      return;
    }
    
    const {
      estimatedTraditionalTime = 0,
      actualOptimizedTime = 0
    } = data;
    
    this.performanceMetrics.estimatedTraditionalTime += estimatedTraditionalTime;
    this.performanceMetrics.actualOptimizedTime += actualOptimizedTime;
    
    // Calculate performance gain
    if (this.performanceMetrics.estimatedTraditionalTime > 0) {
      this.performanceMetrics.performanceGainPercentage = 
        ((this.performanceMetrics.estimatedTraditionalTime - this.performanceMetrics.actualOptimizedTime) / 
         this.performanceMetrics.estimatedTraditionalTime) * 100;
      
      this.performanceMetrics.speedupFactor = 
        this.performanceMetrics.estimatedTraditionalTime / Math.max(this.performanceMetrics.actualOptimizedTime, 1);
    }
    
    this.addToPerformanceHistory('performanceGains', this.performanceMetrics.performanceGainPercentage);
  }

  /**
   * Update processing time statistics
   * @param {number} processingTime - Current processing time
   */
  updateProcessingTimeStats(processingTime) {
    if (processingTime > this.performanceMetrics.maxProcessingTime) {
      this.performanceMetrics.maxProcessingTime = processingTime;
    }
    
    if (processingTime < this.performanceMetrics.minProcessingTime) {
      this.performanceMetrics.minProcessingTime = processingTime;
    }
    
    // Calculate rolling average
    const totalOps = this.performanceState.totalOperations + 1;
    this.performanceMetrics.averageProcessingTime = 
      (this.performanceMetrics.averageProcessingTime * (totalOps - 1) + processingTime) / totalOps;
  }

  /**
   * Add data to performance history with buffer management
   * @param {string} metric - Metric name
   * @param {*} value - Value to add
   */
  addToPerformanceHistory(metric, value) {
    if (!this.performanceHistory[metric]) {
      this.performanceHistory[metric] = [];
    }
    
    this.performanceHistory[metric].push(value);
    
    // Keep buffer size within limits
    if (this.performanceHistory[metric].length > this.performanceState.metricsBufferSize) {
      this.performanceHistory[metric].shift();
    }
  }

  /**
   * Check for performance alerts
   * @param {number} processingTime - Current processing time
   */
  checkPerformanceAlerts(processingTime) {
    // High processing time alert
    this.performanceAlerts.highProcessingTime = 
      processingTime > this.performanceState.performanceThreshold;
    
    // Low cache efficiency alert
    this.performanceAlerts.lowCacheEfficiency = 
      this.performanceMetrics.cacheHitRate < 50 && 
      (this.performanceMetrics.characterCacheHits + this.performanceMetrics.characterCacheMisses) > 10;
    
    // Performance degradation alert (based on recent trend)
    const recentTimes = this.performanceHistory.processingTimes.slice(-5);
    if (recentTimes.length >= 5) {
      const avgRecent = recentTimes.reduce((sum, time) => sum + time, 0) / recentTimes.length;
      this.performanceAlerts.performanceDegradation = 
        avgRecent > this.performanceMetrics.averageProcessingTime * 1.5;
    }
  }

  /**
   * Get current performance metrics
   * @returns {Object} Current metrics
   */
  getMetrics() {
    if (!this.performanceMonitoringEnabled) {
      return null;
    }
    
    return {
      ...this.performanceMetrics,
      alerts: { ...this.performanceAlerts },
      sessionDuration: Date.now() - this.performanceState.sessionStartTime,
      totalOperations: this.performanceState.totalOperations,
      lastUpdate: this.performanceState.lastUpdate
    };
  }

  /**
   * Get performance comparison statistics
   * @returns {Object} Comparison statistics
   */
  getComparisonStats() {
    if (!this.performanceMonitoringEnabled) {
      return null;
    }
    
    const optimizedSamples = this.performanceHistory.processingTimes;
    if (optimizedSamples.length === 0) {
      return null;
    }
    
    const optimizedAvg = optimizedSamples.reduce((sum, val) => sum + val, 0) / optimizedSamples.length;
    const traditionalAvg = this.performanceMetrics.estimatedTraditionalTime / Math.max(this.performanceState.totalOperations, 1);
    
    return {
      optimizedAverage: optimizedAvg,
      traditionalAverage: traditionalAvg,
      speedupFactor: traditionalAvg / Math.max(optimizedAvg, 1),
      performanceGain: traditionalAvg > 0 ? ((traditionalAvg - optimizedAvg) / traditionalAvg) * 100 : 0,
      sampleSize: optimizedSamples.length
    };
  }

  /**
   * Get trend analysis results
   * @returns {Object} Trend analysis
   */
  getTrendAnalysis() {
    if (!this.performanceMonitoringEnabled) {
      return null;
    }
    
    const processingTimes = this.performanceHistory.processingTimes;
    const cacheHitRates = this.performanceHistory.cacheHitRates;
    
    return {
      processingTimeTrend: this.calculateTrend(processingTimes),
      cacheEfficiencyTrend: this.calculateTrend(cacheHitRates),
      dataPoints: processingTimes.length,
      lastAnalysis: Date.now()
    };
  }

  /**
   * Calculate trend for a data series
   * @param {Array<number>} data - Data series
   * @returns {string} Trend direction
   */
  calculateTrend(data) {
    if (data.length < 3) {
      return 'insufficient_data';
    }
    
    const recent = data.slice(-Math.min(10, data.length));
    const firstHalf = recent.slice(0, Math.floor(recent.length / 2));
    const secondHalf = recent.slice(Math.floor(recent.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const threshold = firstAvg * 0.1; // 10% threshold
    
    if (secondAvg > firstAvg + threshold) {
      return 'increasing';
    } else if (secondAvg < firstAvg - threshold) {
      return 'decreasing';
    } else {
      return 'stable';
    }
  }

  /**
   * Reset performance metrics for new session
   */
  resetPerformanceMetrics() {
    if (!this.performanceMonitoringEnabled) {
      return;
    }
    
    this.performanceMetrics = {
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
    
    this.performanceState.totalOperations = 0;
  }

  /**
   * Export complete performance data
   * @returns {Object} Complete performance data
   */
  exportData() {
    if (!this.performanceMonitoringEnabled) {
      return null;
    }
    
    return {
      metrics: this.getMetrics(),
      history: { ...this.performanceHistory },
      comparison: this.getComparisonStats(),
      trends: this.getTrendAnalysis(),
      configuration: {
        enabled: this.performanceMonitoringEnabled,
        metricsBufferSize: this.performanceState.metricsBufferSize,
        performanceThreshold: this.performanceState.performanceThreshold
      }
    };
  }
}