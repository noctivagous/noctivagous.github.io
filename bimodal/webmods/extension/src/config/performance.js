/**
 * Performance monitoring and optimization configuration
 */
export const PERFORMANCE_MONITORING = {
  // Core Configuration
  ENABLED: true,                            // Enable performance monitoring system

  // Metrics Collection
  COLLECT_EDGE_PROCESSING_METRICS: true,    // Collect edge-only processing performance data
  COLLECT_CACHE_METRICS: true,              // Collect cache hit/miss statistics
  COLLECT_MEMORY_METRICS: true,             // Collect memory usage statistics
  COLLECT_TIMING_METRICS: true,             // Collect detailed timing information

  // Performance Comparison
  ESTIMATE_FULL_TRAVERSAL_COST: true,       // Calculate what full traversal would cost
  TRACK_EFFICIENCY_GAINS: true,             // Track performance improvements over time
  COMPARE_METHODS: true,                    // Compare edge-only vs spatial methods

  // Alerting Thresholds
  PERFORMANCE_DEGRADATION_THRESHOLD: 0.5,   // Alert if performance drops below 50% of expected
  CACHE_EFFICIENCY_ALERT_THRESHOLD: 0.6,    // Alert if cache hit ratio drops below 60%
  MEMORY_USAGE_ALERT_THRESHOLD: 0.9,        // Alert if memory usage exceeds 90% of limit
  PROCESSING_TIME_ALERT_THRESHOLD: 20,      // Alert if processing time exceeds 20ms

  // Reporting and Analytics
  PERFORMANCE_REPORT_INTERVAL: 30000,       // Generate performance reports every 30 seconds
  METRICS_RETENTION_TIME: 300000,           // Keep metrics for 5 minutes
  ENABLE_PERFORMANCE_DASHBOARD: false,      // Enable real-time performance dashboard
  EXPORT_METRICS_TO_CONSOLE: true,          // Export metrics to browser console for debugging

  // Enhanced Performance Monitoring
  ENHANCED_ANALYTICS: {
    ENABLE_REAL_TIME_DASHBOARD: true,       // Enable real-time performance dashboard
    ENABLE_TREND_ANALYSIS: true,            // Enable performance trend analysis
    ENABLE_REGRESSION_DETECTION: true,      // Enable performance regression detection
    ENABLE_MEMORY_ANALYTICS: true,          // Enable memory usage analytics
    ENABLE_COMPARISON_ANALYTICS: true,      // Enable method comparison analytics

    // Dashboard Settings
    DASHBOARD_UPDATE_INTERVAL: 1000,        // Dashboard update frequency (ms)
    DASHBOARD_HISTORY_WINDOW: 60,           // Number of data points to show
    DASHBOARD_METRICS_BUFFER: 100,          // Maximum metrics to buffer

    // Trend Analysis
    TREND_ANALYSIS_WINDOW: 50,              // Number of samples for trend analysis
    TREND_ANALYSIS_INTERVAL: 5000,          // How often to analyze trends (ms)
    TREND_SIGNIFICANCE_THRESHOLD: 0.1,      // Minimum change to consider significant
    TREND_CONFIDENCE_THRESHOLD: 0.8,        // Minimum confidence for trend detection

    // Regression Detection
    REGRESSION_DETECTION_WINDOW: 20,        // Number of samples for regression detection
    REGRESSION_THRESHOLD_FACTOR: 1.5,       // Performance degradation factor
    REGRESSION_CONSECUTIVE_THRESHOLD: 3,    // Consecutive poor samples to trigger alert
    REGRESSION_RECOVERY_THRESHOLD: 0.9,     // Performance recovery threshold

    // Memory Analytics
    MEMORY_SAMPLING_INTERVAL: 2000,         // Memory sampling frequency (ms)
    MEMORY_LEAK_DETECTION_WINDOW: 30,       // Number of samples for leak detection
    MEMORY_GROWTH_THRESHOLD: 0.1,           // Memory growth threshold (10%)
    MEMORY_PRESSURE_THRESHOLD: 0.8,         // Memory pressure threshold (80%)

    // Comparison Analytics
    COMPARISON_SAMPLE_SIZE: 100,             // Number of samples for comparison
    COMPARISON_CONFIDENCE_INTERVAL: 0.95,   // Statistical confidence interval
    COMPARISON_SIGNIFICANCE_THRESHOLD: 0.05, // Statistical significance threshold
  }
};

// Adaptive Processing Settings
export const ADAPTIVE_PROCESSING = {
  PAGE_COMPLEXITY_ANALYSIS: {
    ENABLE_COMPLEXITY_ANALYSIS: true,   // Enable page complexity analysis
    ELEMENT_COUNT_THRESHOLD_LOW: 500,   // Low complexity threshold
    ELEMENT_COUNT_THRESHOLD_HIGH: 2000, // High complexity threshold
    DOM_DEPTH_THRESHOLD_LOW: 10,        // Low DOM depth threshold
    DOM_DEPTH_THRESHOLD_HIGH: 20,       // High DOM depth threshold
    TEXT_NODE_DENSITY_THRESHOLD: 0.3,   // Text node density threshold
    COMPLEXITY_CHECK_INTERVAL: 10000,   // How often to analyze page complexity (ms)
  },

  FRAME_RATE_PROCESSING: {
    TARGET_FPS: 60,                     // Target frame rate during drag operations
    FRAME_TIME_BUDGET_MS: 16.67,        // Time budget per frame (1000ms / 60fps)
    PROCESSING_TIME_BUDGET_MS: 8,       // Max processing time per frame
    FRAME_RATE_MONITORING_WINDOW: 10,   // Number of frames to monitor for rate calculation
    MIN_ACCEPTABLE_FPS: 30,             // Minimum acceptable frame rate
    FRAME_RATE_ADJUSTMENT_FACTOR: 0.8,  // Reduce processing when frame rate drops
  },

  BATCH_PROCESSING: {
    ENABLE_BATCH_PROCESSING: true,      // Enable batch processing optimization
    DEFAULT_BATCH_SIZE: 5,              // Default batch size for processing
    MAX_BATCH_SIZE: 20,                 // Maximum batch size
    MIN_BATCH_SIZE: 1,                  // Minimum batch size
    BATCH_TIMEOUT_MS: 4,                // Maximum time to wait for batch completion
    ADAPTIVE_BATCH_SIZING: true,        // Adjust batch size based on performance
  },

  QUALITY_ADJUSTMENTS: {
    ENABLE_QUALITY_ADJUSTMENTS: true,   // Enable quality adjustments based on available time
    HIGH_QUALITY_TIME_THRESHOLD: 5,     // Time threshold for high quality processing (ms)
    MEDIUM_QUALITY_TIME_THRESHOLD: 10,  // Time threshold for medium quality processing (ms)
    LOW_QUALITY_PROCESSING_LIMIT: 20,   // Maximum elements to process in low quality mode
    QUALITY_ADJUSTMENT_HYSTERESIS: 2,   // Frames to wait before quality adjustment
  }
};

// Fallback Configuration
export const FALLBACK_CONFIGURATION = {
  ENABLED: true,                     // Enable automatic fallback
  FALLBACK_THRESHOLD_MS: 15,         // Fall back to spatial if processing exceeds this
  MAX_CONSECUTIVE_FAILURES: 3,       // Max failures before fallback
  FALLBACK_RECOVERY_ATTEMPTS: 5,     // Attempts to recover from fallback
  FALLBACK_RECOVERY_DELAY: 2000,     // Delay between recovery attempts (ms)
  ENABLE_GRACEFUL_DEGRADATION: true, // Enable graceful performance degradation
  FALLBACK_TO_SPATIAL_METHOD: true,  // Fallback to spatial intersection method
};
