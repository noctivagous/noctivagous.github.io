/**
 * Selection configuration - rectangle and edge selection settings
 */
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

  // Predictive Caching Settings
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

  // Fallback Configuration
  FALLBACK_CONFIGURATION: {
    ENABLED: true,                     // Enable automatic fallback
    FALLBACK_THRESHOLD_MS: 15,         // Fall back to spatial if processing exceeds this
    MAX_CONSECUTIVE_FAILURES: 3,       // Max failures before fallback
    FALLBACK_RECOVERY_ATTEMPTS: 2,     // Number of recovery attempts
    FALLBACK_RECOVERY_DELAY: 5000,     // Delay between recovery attempts (ms)
  },

  // Debug and Monitoring
  ENABLE_PERFORMANCE_LOGGING: true,    // Log detailed performance metrics
  ENABLE_CACHE_METRICS: true,          // Track cache hit/miss ratios
  ENABLE_MEMORY_LOGGING: false,        // Log memory usage (can be verbose)
  PERFORMANCE_LOG_INTERVAL: 5000,     // How often to log performance stats (ms)
  ENABLE_PERFORMANCE_MONITORING: true, // Enable performance threshold monitoring
};
