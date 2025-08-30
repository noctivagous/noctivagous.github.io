/**
 * Lifecycle Manager - Handles initialization and cleanup
 */
export class LifecycleManager {
  constructor() {
    this.initializationComplete = false;
    this.enabled = true;
    this.components = new Map();
    this.initializationCallbacks = [];
    this.cleanupCallbacks = [];
  }

  /**
   * Register a component for lifecycle management
   * @param {string} name
   * @param {Object} component
   */
  registerComponent(name, component) {
    this.components.set(name, component);
  }

  /**
   * Get a registered component
   * @param {string} name
   * @returns {Object|null}
   */
  getComponent(name) {
    return this.components.get(name) || null;
  }

  /**
   * Register initialization callback
   * @param {Function} callback
   */
  onInitialization(callback) {
    this.initializationCallbacks.push(callback);
  }

  /**
   * Register cleanup callback
   * @param {Function} callback
   */
  onCleanup(callback) {
    this.cleanupCallbacks.push(callback);
  }

  /**
   * Initialize all components
   */
  async initialize() {
    if (this.initializationComplete) return;

    try {
      // Initialize components in dependency order
      const initOrder = [
        'styleManager',
        'shadowDOMManager',
        'cursor',
        'stateManager',
        'textModeManager',
        'focusDetector',
        'overlayManager',
        'eventManager',
        'performanceTracker'
      ];

      for (const componentName of initOrder) {
        const component = this.components.get(componentName);
        if (component && typeof component.initialize === 'function') {
          await component.initialize();
        }
      }

      // Run initialization callbacks
      for (const callback of this.initializationCallbacks) {
        try {
          await callback();
        } catch (error) {
          console.error('[KeyPilot] Error in initialization callback:', error);
        }
      }

      this.initializationComplete = true;
      console.log('[KeyPilot] Initialization complete');

    } catch (error) {
      console.error('[KeyPilot] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Enable the extension
   */
  async enable() {
    if (this.enabled) return;

    this.enabled = true;
    
    // Enable all components
    for (const [name, component] of this.components) {
      if (typeof component.enable === 'function') {
        try {
          await component.enable();
        } catch (error) {
          console.error(`[KeyPilot] Error enabling ${name}:`, error);
        }
      }
    }

    console.log('[KeyPilot] Extension enabled');
  }

  /**
   * Disable the extension
   */
  async disable() {
    if (!this.enabled) return;

    this.enabled = false;

    // Disable all components
    for (const [name, component] of this.components) {
      if (typeof component.disable === 'function') {
        try {
          await component.disable();
        } catch (error) {
          console.error(`[KeyPilot] Error disabling ${name}:`, error);
        }
      }
    }

    console.log('[KeyPilot] Extension disabled');
  }

  /**
   * Cleanup all components
   */
  async cleanup() {
    // Run cleanup callbacks first
    for (const callback of this.cleanupCallbacks) {
      try {
        await callback();
      } catch (error) {
        console.error('[KeyPilot] Error in cleanup callback:', error);
      }
    }

    // Cleanup components in reverse order
    const cleanupOrder = [
      'performanceTracker',
      'eventManager',
      'overlayManager',
      'focusDetector',
      'textModeManager',
      'stateManager',
      'cursor',
      'shadowDOMManager',
      'styleManager'
    ];

    for (const componentName of cleanupOrder) {
      const component = this.components.get(componentName);
      if (component && typeof component.cleanup === 'function') {
        try {
          await component.cleanup();
        } catch (error) {
          console.error(`[KeyPilot] Error cleaning up ${componentName}:`, error);
        }
      }
    }

    this.components.clear();
    this.initializationCallbacks = [];
    this.cleanupCallbacks = [];
    this.initializationComplete = false;

    console.log('[KeyPilot] Cleanup complete');
  }

  /**
   * Get initialization status
   * @returns {boolean}
   */
  isInitialized() {
    return this.initializationComplete;
  }

  /**
   * Get enabled status
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Query service worker for initial enabled state
   */
  async queryInitialState() {
    try {
      const response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      if (response && typeof response.enabled === 'boolean') {
        this.enabled = response.enabled;
        console.log('[KeyPilot] Initial state from service worker:', this.enabled ? 'enabled' : 'disabled');
      } else {
        // Default to enabled if no response or invalid response
        this.enabled = true;
        console.log('[KeyPilot] No valid state from service worker, defaulting to enabled');
      }
    } catch (error) {
      // Service worker might not be available, default to enabled
      this.enabled = true;
      console.log('[KeyPilot] Service worker not available, defaulting to enabled:', error.message);
    }
  }
}
