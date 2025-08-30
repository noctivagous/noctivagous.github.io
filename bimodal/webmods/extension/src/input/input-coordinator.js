/**
 * Input Coordinator - Coordinates keyboard and mouse input
 */
import { KeyboardHandler } from './keyboard-handler.js';
import { MouseHandler } from './mouse-handler.js';

export class InputCoordinator {
  constructor(stateManager, commandDispatcher, lifecycleManager) {
    this.stateManager = stateManager;
    this.lifecycleManager = lifecycleManager;
    
    // Input handlers
    this.keyboardHandler = new KeyboardHandler(stateManager, commandDispatcher);
    this.mouseHandler = new MouseHandler(stateManager, lifecycleManager);
    
    // Event listeners
    this.eventListeners = [];
    this.enabled = true;
  }

  /**
   * Initialize input handling
   */
  initialize() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Keyboard events
    const keydownListener = (event) => {
      if (this.enabled) {
        this.keyboardHandler.handleKeyDown(event);
      }
    };

    // Mouse events
    const mousemoveListener = (event) => {
      if (this.enabled) {
        this.mouseHandler.handleMouseMove(event);
      }
    };

    const scrollListener = (event) => {
      if (this.enabled) {
        this.mouseHandler.handleScroll(event);
      }
    };

    // Add event listeners
    document.addEventListener('keydown', keydownListener, true);
    document.addEventListener('mousemove', mousemoveListener, { passive: true });
    document.addEventListener('scroll', scrollListener, { passive: true });

    // Store listeners for cleanup
    this.eventListeners = [
      { element: document, event: 'keydown', listener: keydownListener, options: true },
      { element: document, event: 'mousemove', listener: mousemoveListener, options: { passive: true } },
      { element: document, event: 'scroll', listener: scrollListener, options: { passive: true } }
    ];

    // Setup performance monitoring
    this.setupPerformanceMonitoring();
  }

  /**
   * Setup performance monitoring
   */
  setupPerformanceMonitoring() {
    // Performance metrics logging
    setInterval(() => {
      if (window.KEYPILOT_DEBUG) {
        this.mouseHandler.logPerformanceMetrics();
      }
    }, 10000);
  }

  /**
   * Enable input handling
   */
  enable() {
    this.enabled = true;
    this.keyboardHandler.enable();
    this.mouseHandler.enable();
  }

  /**
   * Disable input handling
   */
  disable() {
    this.enabled = false;
    this.keyboardHandler.disable();
    this.mouseHandler.disable();
  }

  /**
   * Get performance metrics
   * @returns {Object}
   */
  getMetrics() {
    return {
      mouse: this.mouseHandler.getMetrics(),
      enabled: this.enabled
    };
  }

  /**
   * Cleanup event listeners
   */
  cleanup() {
    this.eventListeners.forEach(({ element, event, listener, options }) => {
      element.removeEventListener(event, listener, options);
    });
    this.eventListeners = [];
    
    this.enabled = false;
  }
}
