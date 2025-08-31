/**
 * Application constants and configuration
 */
export const KEYBINDINGS = {
  ACTIVATE: ['f', 'F'],
  ACTIVATE_NEW_TAB: ['g', 'G'],
  BACK: ['c', 'C'],
  BACK2: ['s', 'S'],
  FORWARD: ['r', 'R'],
  DELETE: ['d', 'D'],
  HIGHLIGHT: ['h', 'H'],
  RECTANGLE_HIGHLIGHT: ['y', 'Y'],
  TAB_LEFT: ['q', 'Q'],
  TAB_RIGHT: ['w', 'W'],
  ROOT: ['`', 'Backquote'],
  CLOSE_TAB: ['1', '/'],
  CANCEL: ['Escape']
};

export const SELECTORS = {
  CLICKABLE: 'a[href], button, input, select, textarea',
  TEXT_INPUTS: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea',
  FOCUSABLE_TEXT: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]'
};

export const ARIA_ROLES = {
  CLICKABLE: ['link', 'button']
};

export const CSS_CLASSES = {
  CURSOR_HIDDEN: 'kpv2-cursor-hidden',
  FOCUS: 'kpv2-focus',
  DELETE: 'kpv2-delete',
  HIGHLIGHT: 'kpv2-highlight',
  HIDDEN: 'kpv2-hidden',
  RIPPLE: 'kpv2-ripple',
  FOCUS_OVERLAY: 'kpv2-focus-overlay',
  DELETE_OVERLAY: 'kpv2-delete-overlay',
  HIGHLIGHT_OVERLAY: 'kpv2-highlight-overlay',
  HIGHLIGHT_SELECTION: 'kpv2-highlight-selection',
  TEXT_FIELD_GLOW: 'kpv2-text-field-glow',
  VIEWPORT_MODAL_FRAME: 'kpv2-viewport-modal-frame',
  ACTIVE_TEXT_INPUT_FRAME: 'kpv2-active-text-input-frame',
  ESC_EXIT_LABEL: 'kpv2-esc-exit-label'
};

export const ELEMENT_IDS = {
  CURSOR: 'kpv2-cursor',
  STYLE: 'kpv2-style'
};

export const Z_INDEX = {
  VIEWPORT_MODAL_FRAME: 2147483645,
  OVERLAYS: 2147483646,
  CURSOR: 2147483647,
  MESSAGE_BOX: 2147483648
};

export const MODES = {
  NONE: 'none',
  DELETE: 'delete',
  TEXT_FOCUS: 'text_focus',
  HIGHLIGHT: 'highlight'
};

export const COLORS = {
  // Primary cursor colors
  FOCUS_GREEN: 'rgba(0,180,0,0.95)',
  FOCUS_GREEN_BRIGHT: 'rgba(0,128,0,0.95)',
  DELETE_RED: 'rgba(220,0,0,0.95)',
  HIGHLIGHT_BLUE: 'rgba(0,120,255,0.95)',
  ORANGE: '#ff8c00',

  // Text and background colors
  TEXT_WHITE_PRIMARY: 'rgba(255,255,255,0.95)',
  TEXT_WHITE_SECONDARY: 'rgba(255,255,255,0.8)',
  TEXT_GREEN_BRIGHT: '#6ced2b',

  // Background colors
  MESSAGE_BG_BROWN: '#ad6007',
  MESSAGE_BG_GREEN: '#10911b',

  // Border and shadow colors
  ORANGE_BORDER: 'rgba(255,140,0,0.4)',
  ORANGE_SHADOW: 'rgba(255,140,0,0.45)',
  ORANGE_SHADOW_DARK: 'rgba(255,140,0,0.8)',
  ORANGE_SHADOW_LIGHT: 'rgba(255,140,0,0.3)',
  GREEN_SHADOW: 'rgba(0,180,0,0.45)',
  GREEN_SHADOW_BRIGHT: 'rgba(0,180,0,0.5)',
  DELETE_SHADOW: 'rgba(220,0,0,0.35)',
  DELETE_SHADOW_BRIGHT: 'rgba(220,0,0,0.45)',
  HIGHLIGHT_SHADOW: 'rgba(0,120,255,0.35)',
  HIGHLIGHT_SHADOW_BRIGHT: 'rgba(0,120,255,0.45)',
  BLACK_SHADOW: 'rgba(40, 40, 40, 0.7)',

  // Ripple effect colors
  RIPPLE_GREEN: 'rgba(0,200,0,0.35)',
  RIPPLE_GREEN_MID: 'rgba(0,200,0,0.22)',
  RIPPLE_GREEN_TRANSPARENT: 'rgba(0,200,0,0)',

  // Flash animation colors
  FLASH_GREEN: 'rgba(0,255,0,1)',
  FLASH_GREEN_SHADOW: 'rgba(0,255,0,0.8)',
  FLASH_GREEN_GLOW: 'rgba(0,255,0,0.9)',

  // Notification colors
  NOTIFICATION_SUCCESS: '#4CAF50',
  NOTIFICATION_ERROR: '#f44336',
  NOTIFICATION_WARNING: '#ff9800',
  NOTIFICATION_INFO: '#2196F3',
  NOTIFICATION_SHADOW: 'rgba(0, 0, 0, 0.15)',

  // Text field glow
  TEXT_FIELD_GLOW: 'rgba(255,165,0,0.8)',

  // Highlight selection colors
  HIGHLIGHT_SELECTION_BG: 'rgba(0,120,255,0.3)',
  HIGHLIGHT_SELECTION_BORDER: 'rgba(0,120,255,0.6)',

  // New colors for ESC exit labels
  ORANGE_BG: 'rgba(255, 165, 0, 0.9)',
  ORANGE_TEXT: '#fff',
  ORANGE_BORDER: '#d35400',
  FOCUS_GREEN_BG: 'rgba(46, 204, 113, 0.9)',
  FOCUS_GREEN_TEXT: '#fff',
  FOCUS_GREEN: '#27ae60'
};

export const CURSOR_SETTINGS = {
  DEFAULT_SIZE: 1.0,
  MIN_SIZE: 0.5,
  MAX_SIZE: 2.0,
  SIZE_STEP: 0.1,
  DEFAULT_VISIBLE: true,
  STORAGE_KEYS: {
    SIZE: 'keypilot_cursor_size',
    VISIBLE: 'keypilot_cursor_visible'
  }
};

export const RECTANGLE_SELECTION = {
  // Visual rectangle settings
  MIN_WIDTH: 3,           // Minimum rectangle width to show (pixels)
  MIN_HEIGHT: 3,          // Minimum rectangle height to show (pixels)
  MIN_DRAG_DISTANCE: 5,   // Minimum drag distance to start selection (pixels)

  // Visual feedback settings
  SHOW_IMMEDIATE_FEEDBACK: true,        // Show rectangle for any movement
  HIDE_ZERO_SIZE: false,                // Don't hide zero-size rectangles

  // Performance limits (should match browser capabilities)
  MAX_AREA_PIXELS: 50000000,           // 50M pixels (e.g., 10000x5000) - very generous limit
  MAX_TEXT_NODES: 10000,               // Maximum text nodes to process - matches browser selection limits
  ENABLE_AREA_LIMIT: false,            // Disable area limiting by default - browsers handle large selections fine
  ENABLE_NODE_LIMIT: true,             // Keep node limit as safety measure for DOM traversal performance

  // Performance notes:
  // - Area limits are disabled by default because browsers can handle enormous text selections
  // - Node limits remain enabled to prevent DOM traversal performance issues on complex pages
  // - These limits only apply to rectangle selection, not manual browser selection
  // - The clipboard is typically the real limiting factor, not the selection itself
};

export const EDGE_ONLY_SELECTION = {
  // Smart Targeting Options
  SMART_TARGETING: {
    ENABLED: true,                     // Enable smart element targeting
    TEXT_ELEMENT_TAGS: [               // HTML tags that commonly contain text
      'p', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'li', 'td', 'th', 'a', 'strong', 'em', 'b', 'i', 'u',
      'blockquote', 'pre', 'code', 'label', 'legend', 'article',
      'section', 'header', 'footer', 'main', 'aside', 'nav'
    ],
    SKIP_ELEMENT_TAGS: [               // HTML tags to skip (non-text elements)
      'img', 'video', 'audio', 'canvas', 'svg', 'iframe',
      'script', 'style', 'noscript', 'object', 'embed'
    ],
    MIN_TEXT_LENGTH: 1,                // Minimum text content length to consider
    CHECK_COMPUTED_STYLE: true,        // Check if element is visible via computed style
    INCLUDE_ARIA_LABELS: true,         // Include elements with aria-label/aria-labelledby
    MAX_ELEMENTS_TO_OBSERVE: 5000,     // Maximum elements to observe simultaneously
  },

  // Character Detection Settings
  CHARACTER_DETECTION: {
    ENABLED: true,                     // Enable edge-level character detection
    USE_RANGE_API: true,               // Use Range API for precise character positioning
    CACHE_CHARACTER_POSITIONS: true,   // Cache character positions using WeakMap
    CHARACTER_CACHE_SIZE: 1000,        // Maximum characters to cache per element
    BOUNDARY_DETECTION_PRECISION: 1,   // Pixel precision for boundary detection
    BATCH_CHARACTER_PROCESSING: true,  // Process characters in batches
    CHARACTER_BATCH_SIZE: 50,          // Number of characters to process per batch
    MAX_CHARACTERS_PER_ELEMENT: 10000, // Maximum characters to process per element
  },

  // Cache Configuration
  CACHE_CONFIGURATION: {
    ELEMENT_CACHE_SIZE: 1000,          // Maximum number of elements to cache
    CHARACTER_CACHE_SIZE: 5000,        // Maximum number of character positions to cache
    CACHE_CLEANUP_THRESHOLD: 800,      // Start cleanup when cache reaches this size
    CACHE_CLEANUP_BATCH_SIZE: 200,     // Number of entries to remove during cleanup
    ENABLE_PREDICTIVE_CACHING: true,   // Pre-cache elements likely to intersect
    PREDICTIVE_CACHE_DISTANCE: 100,    // Distance in pixels to pre-cache elements
    CACHE_TTL_MS: 30000,               // Time-to-live for cached entries (30 seconds)
    ENABLE_CACHE_COMPRESSION: false,   // Enable cache compression (experimental)
  },

  // Performance Monitoring Configuration
  PERFORMANCE_MONITORING: {
    ENABLED: true,                     // Enable performance monitoring
    MONITORING_INTERVAL: 1000,         // How often to check performance (ms)
    COLLECT_DETAILED_METRICS: true,    // Collect detailed performance metrics
    TRACK_CACHE_EFFICIENCY: true,      // Track cache hit/miss ratios
    TRACK_PROCESSING_TIME: true,       // Track processing time per operation
    TRACK_MEMORY_USAGE: true,          // Track memory usage
    PERFORMANCE_LOG_INTERVAL: 5000,    // How often to log performance stats (ms)
    ENABLE_PERFORMANCE_ALERTS: true,   // Enable performance degradation alerts
  },

  // Fallback Configuration
  FALLBACK_CONFIGURATION: {
    ENABLED: true,                     // Enable automatic fallback
    FALLBACK_THRESHOLD_MS: 15,         // Fall back to spatial if processing exceeds this
    MAX_CONSECUTIVE_FAILURES: 3,       // Max failures before fallback
    FALLBACK_RECOVERY_ATTEMPTS: 5,     // Attempts to recover from fallback
    FALLBACK_RECOVERY_DELAY: 2000,     // Delay between recovery attempts (ms)
    ENABLE_GRACEFUL_DEGRADATION: true, // Enable graceful performance degradation
    FALLBACK_TO_SPATIAL_METHOD: true,  // Fallback to spatial intersection method
  },

  // Performance Thresholds
  MAX_PROCESSING_TIME_MS: 10,          // Maximum time for edge processing (ms)
  MAX_ELEMENTS_PER_UPDATE: 50,         // Maximum elements to process per update
  PERFORMANCE_MONITORING_INTERVAL: 1000, // How often to check performance (ms)
  FALLBACK_THRESHOLD_MS: 15,           // Fall back to spatial if processing exceeds this
  CACHE_HIT_RATIO_THRESHOLD: 0.7,     // Minimum acceptable cache hit ratio

  // Memory Management
  MAX_MEMORY_USAGE_MB: 50,             // Maximum memory usage for edge-only processing
  MEMORY_CHECK_INTERVAL: 5000,        // How often to check memory usage (ms)
  ENABLE_MEMORY_MONITORING: true,     // Monitor memory usage and cleanup
  GARBAGE_COLLECTION_THRESHOLD: 0.8,  // Trigger cleanup at 80% of memory limit

  // Processing Options
  INTERSECTION_OBSERVER_THRESHOLDS: [0, 0.1, 0.5, 1.0], // Multiple thresholds for granular updates
  BATCH_PROCESSING_SIZE: 10,           // Process elements in batches of this size
  ENABLE_ADAPTIVE_PROCESSING: true,    // Adjust processing based on page complexity
  FRAME_RATE_TARGET: 60,               // Target frame rate during drag operations

  // Adaptive Processing Settings (Task 2.1)
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
  },

  // Predictive Caching Settings (Task 2.2)
  PREDICTIVE_CACHING: {
    ENABLE_PREDICTIVE_CACHING: true,    // Enable predictive caching strategies
    ENABLE_USER_BEHAVIOR_ANALYSIS: true, // Analyze user behavior patterns
    ENABLE_VIEWPORT_BASED_CACHING: true, // Cache based on viewport position
    ENABLE_SCROLL_PREDICTION: true,     // Predict scroll direction and cache ahead

    // User behavior analysis
    BEHAVIOR_PATTERN_WINDOW: 20,        // Number of recent interactions to analyze
    INTERACTION_TIMEOUT_MS: 2000,       // Time between interactions to consider separate
    MIN_PATTERN_CONFIDENCE: 0.6,        // Minimum confidence to act on patterns
    PATTERN_ANALYSIS_INTERVAL: 5000,    // How often to analyze patterns (ms)

    // Viewport-based caching
    VIEWPORT_CACHE_MARGIN: 200,         // Pixels beyond viewport to cache
    VIEWPORT_CACHE_SECTORS: 9,          // Divide viewport into sectors for caching
    CACHE_WARMING_DISTANCE: 300,        // Distance ahead to warm cache (pixels)
    VIEWPORT_UPDATE_THROTTLE: 100,      // Throttle viewport updates (ms)

    // Scroll prediction
    SCROLL_VELOCITY_SAMPLES: 5,         // Number of scroll samples for velocity calculation
    SCROLL_PREDICTION_DISTANCE: 500,    // Distance to predict ahead (pixels)
    MIN_SCROLL_VELOCITY: 50,            // Minimum velocity to trigger prediction (px/s)
    SCROLL_DIRECTION_THRESHOLD: 10,     // Pixels to determine scroll direction

    // Cache preloading
    PRELOAD_BATCH_SIZE: 10,             // Elements to preload per batch
    PRELOAD_THROTTLE_MS: 50,            // Throttle between preload batches
    MAX_PRELOAD_ELEMENTS: 100,          // Maximum elements to preload
    PRELOAD_PRIORITY_THRESHOLD: 0.7,    // Confidence threshold for high priority preload
  },

  // Debug and Monitoring
  ENABLE_PERFORMANCE_LOGGING: true,    // Log detailed performance metrics
  ENABLE_CACHE_METRICS: true,          // Track cache hit/miss ratios
  ENABLE_MEMORY_LOGGING: false,        // Log memory usage (can be verbose)
  PERFORMANCE_LOG_INTERVAL: 5000,     // How often to log performance stats (ms)
  ENABLE_PERFORMANCE_MONITORING: true, // Enable performance threshold monitoring
};

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

  // Enhanced Performance Monitoring (Task 2.3)
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

export const FEATURE_FLAGS = {
  // Rectangle Selection Method
  USE_INTELLIGENT_RECTANGLE_SELECTION: true, // Use browser-native selection logic instead of spatial intersection
  USE_NATIVE_SELECTION_API: true, // Use document.caretRangeFromPoint for efficient selection

  // Edge-Only Processing Control
  ENABLE_EDGE_ONLY_PROCESSING: true,   // Use edge-only intersection processing
  EDGE_ONLY_FALLBACK_ENABLED: true,    // Allow fallback to spatial method if edge-only fails
  FORCE_EDGE_ONLY_MODE: false,         // Force edge-only processing even if performance degrades
  ENABLE_EDGE_ONLY_CACHE: true,        // Enable text node caching for edge-only processing
  ENABLE_PERFORMANCE_MONITORING: true, // Monitor edge-only processing performance

  // Enhanced RectangleIntersectionObserver Integration (Task 2)
  ENABLE_ENHANCED_RECTANGLE_OBSERVER: true, // Master flag for enhanced integration (Task 2.1, 2.2, 2.3)

  // Edge-Only Processing Feature Flags (Task 1.1)
  USE_EDGE_ONLY_SELECTION: true,         // Enable edge-only processing
  ENABLE_SMART_TARGETING: true,          // Enable smart element targeting
  ENABLE_CHARACTER_DETECTION: true,      // Enable edge-level character detection
  ENABLE_SELECTION_CACHING: true,        // Enable text node caching
  ENABLE_EDGE_PERFORMANCE_MONITORING: true, // Enable performance tracking
  ENABLE_AUTOMATIC_FALLBACK: true,       // Auto-fallback on performance issues
  ENABLE_EDGE_BATCH_PROCESSING: true,    // Batch intersection updates
  ENABLE_PREDICTIVE_CACHING: true,       // Enable predictive caching
  DETAILED_EDGE_LOGGING: true,           // Detailed debug logging for edge processing
  EDGE_CACHE_SIZE_MANAGEMENT: true,      // Enable cache size management
  EDGE_ADAPTIVE_PROCESSING: true,        // Enable adaptive processing
  ENABLE_TEXT_ELEMENT_FILTER: true,      // Enable TextElementFilter class
  ENABLE_EDGE_CHARACTER_DETECTOR: true,  // Enable EdgeCharacterDetector class
  ENABLE_PERFORMANCE_MONITOR: true,      // Enable PerformanceMonitor class

  // Selection behavior options
  RECTANGLE_SELECTION_FALLBACK_TO_SPATIAL: true, // Fall back to spatial method if intelligent method fails
  RECTANGLE_SELECTION_SCAN_STEP: 8, // Pixel step size for boundary scanning (performance vs accuracy)
  RECTANGLE_SELECTION_MAX_SCAN_TIME: 50, // Maximum time in ms to spend scanning for boundaries

  // Clipboard options
  ENABLE_RICH_TEXT_CLIPBOARD: true, // Copy both plain text and HTML formatting to clipboard
  RICH_TEXT_FALLBACK_TO_PLAIN: true, // Fall back to plain text if rich text copying fails

  // Debug and development flags
  DEBUG_RECTANGLE_SELECTION: false, // Enable detailed logging for rectangle selection
  DEBUG_EDGE_ONLY_PROCESSING: false, // Enable detailed logging for edge-only processing
  SHOW_SELECTION_METHOD_IN_UI: false, // Show which selection method was used in notifications
  DEBUG_RECTANGLE_HUD: false // Show live rectangle debugging HUD with coordinates and calls
};