/**
 * Feature flags and toggles
 */
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

  // Enhanced RectangleIntersectionObserver Integration
  ENABLE_ENHANCED_RECTANGLE_OBSERVER: true, // Master flag for enhanced integration

  // Edge-Only Processing Feature Flags
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
