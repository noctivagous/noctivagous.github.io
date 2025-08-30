/**
 * KeyPilot Application - Main orchestrator (refactored from monolithic class)
 */
import { LifecycleManager } from './lifecycle-manager.js';
import { CommandDispatcher } from './command-dispatcher.js';
import { InputCoordinator } from '../input/input-coordinator.js';
import { StateManager } from '../state/state-manager.js';
import { CursorManager } from '../ui/cursor.js';
import { ElementDetector } from '../detection/element-detector.js';
import { ActivationHandler } from '../selection/activation-handler.js';
import { FocusDetector } from '../detection/focus-detector.js';
import { OverlayCoordinator } from '../rendering/overlays/overlay-coordinator.js';
import { StyleManager } from '../rendering/style-manager.js';
import { ShadowDOMManager } from '../rendering/shadow-dom-manager.js';
import { IntersectionObserverManager } from '../performance/intersection-observer-manager.js';
import { OptimizedScrollManager } from '../performance/optimized-scroll-manager.js';
import { RectangleIntersectionObserver } from '../performance/rectangle-intersection/index.js';
import { MouseCoordinateManager } from '../state/mouse-coordinate-manager.js';
import { HighlightManager } from '../selection/highlight-manager.js';
import { SettingsManager } from '../ui/settings-manager.js';
import { TextModeManager } from '../text-mode/text-mode-manager.js';

export class KeyPilotApp {
  constructor() {
    // Prevent multiple instances
    if (window.__KeyPilotV22 && window.__KeyPilotApp) {
      console.warn('[KeyPilot] Already loaded.');
      return window.__KeyPilotApp;
    }
    window.__KeyPilotV22 = true;

    // Core managers
    this.lifecycleManager = new LifecycleManager();
    this.stateManager = new StateManager();
    
    // Initialize components
    this.initializeComponents();
    
    // Setup command dispatcher and input coordination
    this.commandDispatcher = new CommandDispatcher(this.stateManager, this.lifecycleManager);
    this.inputCoordinator = new InputCoordinator(this.stateManager, this.commandDispatcher, this.lifecycleManager);
    
    // Register input coordinator
    this.lifecycleManager.registerComponent('inputCoordinator', this.inputCoordinator);
    
    // Setup lifecycle callbacks
    this.setupLifecycleCallbacks();
  }

  /**
   * Initialize all components
   */
  initializeComponents() {
    // Core components
    const cursor = new CursorManager();
    const elementDetector = new ElementDetector();
    const mouseCoordinateManager = new MouseCoordinateManager();
    const focusDetector = new FocusDetector(this.stateManager, mouseCoordinateManager);
    const overlayManager = new OverlayCoordinator();
    const styleManager = new StyleManager();
    const shadowDOMManager = new ShadowDOMManager(styleManager);
    const highlightManager = new HighlightManager();
    const settingsManager = new SettingsManager();
    
    // Simplified text mode manager
    const textModeManager = new TextModeManager(this.stateManager, cursor);
    
    // Performance components
    const intersectionManager = new IntersectionObserverManager(elementDetector);
    const scrollManager = new OptimizedScrollManager(overlayManager, this.stateManager);
    const rectangleIntersectionObserver = new RectangleIntersectionObserver();
    
    // Selection components
    const activationHandler = new ActivationHandler(elementDetector, this.stateManager);
    
    // Register all components
    this.lifecycleManager.registerComponent('stateManager', this.stateManager);
    this.lifecycleManager.registerComponent('cursor', cursor);
    this.lifecycleManager.registerComponent('elementDetector', elementDetector);
    this.lifecycleManager.registerComponent('mouseCoordinateManager', mouseCoordinateManager);
    this.lifecycleManager.registerComponent('focusDetector', focusDetector);
    this.lifecycleManager.registerComponent('overlayManager', overlayManager);
    this.lifecycleManager.registerComponent('styleManager', styleManager);
    this.lifecycleManager.registerComponent('shadowDOMManager', shadowDOMManager);
    this.lifecycleManager.registerComponent('highlightManager', highlightManager);
    this.lifecycleManager.registerComponent('intersectionManager', intersectionManager);
    this.lifecycleManager.registerComponent('scrollManager', scrollManager);
    this.lifecycleManager.registerComponent('rectangleIntersectionObserver', rectangleIntersectionObserver);
    this.lifecycleManager.registerComponent('activationHandler', activationHandler);
    this.lifecycleManager.registerComponent('settingsManager', settingsManager);
    this.lifecycleManager.registerComponent('textModeManager', textModeManager);
  }

  /**
   * Setup lifecycle callbacks
   */
  setupLifecycleCallbacks() {
    // State change handling
    this.lifecycleManager.onInitialization(() => {
      this.stateManager.subscribe((newState, prevState) => {
        this.handleStateChange(newState, prevState);
      });
      
      this.setupPopupCommunication();
      this.setupContinuousCursorSync();
      this.initializeCursorPosition();
    });
  }

  /**
   * Initialize the application
   */
  async init() {
    try {
      // Query initial state from service worker
      await this.lifecycleManager.queryInitialState();
      
      // Initialize all components
      await this.lifecycleManager.initialize();
      
      // Initialize input coordination
      this.inputCoordinator.initialize();
      
      // Enable or disable based on initial state
      if (this.lifecycleManager.isEnabled()) {
        await this.enable();
      } else {
        await this.disable();
      }

      console.log('[KeyPilot] Application initialized successfully');
      
    } catch (error) {
      console.error('[KeyPilot] Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Enable the extension
   */
  async enable() {
    await this.lifecycleManager.enable();
    
    // Initialize mode manager to normal mode
    await this.stateManager.initializeMode();
    
    // Sync with early injection cursor state
    if (window.KEYPILOT_EARLY) {
      window.KEYPILOT_EARLY.setEnabled(true);
    }
    
    const cursor = this.lifecycleManager.getComponent('cursor');
    if (cursor) {
      cursor.show();
    }
    
    console.log('[KeyPilot] Extension enabled');
  }

  /**
   * Disable the extension
   */
  async disable() {
    // Clean up mode manager state
    await this.stateManager.cleanupMode();
    
    await this.lifecycleManager.disable();
    
    // Sync with early injection cursor state
    if (window.KEYPILOT_EARLY) {
      window.KEYPILOT_EARLY.setEnabled(false);
    }
    
    const cursor = this.lifecycleManager.getComponent('cursor');
    if (cursor) {
      cursor.hide();
    }
    
    const overlayManager = this.lifecycleManager.getComponent('overlayManager');
    if (overlayManager) {
      overlayManager.hideFocusOverlay();
      overlayManager.hideDeleteOverlay();
      overlayManager.hideHighlightOverlay();
    }
    
    console.log('[KeyPilot] Extension disabled');
  }

  /**
   * Handle state changes
   * @param {Object} newState
   * @param {Object} prevState
   */
  handleStateChange(newState, prevState) {
    const cursor = this.lifecycleManager.getComponent('cursor');
    const overlayManager = this.lifecycleManager.getComponent('overlayManager');
    const modeManager = this.stateManager.getModeManager();
    
    // Update cursor mode
    if (newState.mode !== prevState.mode || 
        (modeManager.isTextFocusMode() && newState.focusEl !== prevState.focusEl)) {
      
      const options = modeManager.isTextFocusMode() ? 
        { hasClickableElement: !!newState.focusEl } : {};
      
      if (cursor) {
        cursor.setMode(newState.mode, options);
      }
      
      this.updatePopupStatus(newState.mode);
    }

    // Update overlays
    if (newState.focusedTextElement !== prevState.focusedTextElement ||
        newState._overlayUpdateTrigger !== prevState._overlayUpdateTrigger ||
        newState.focusEl !== prevState.focusEl ||
        newState.deleteEl !== prevState.deleteEl) {
      
      if (overlayManager) {
        overlayManager.updateOverlays(newState.focusEl, newState.deleteEl, newState.mode, newState.focusedTextElement);
      }
    }
  }

  /**
   * Setup popup communication
   */
  setupPopupCommunication() {
    chrome.runtime.onMessage.addListener(async (msg, _sender, sendResponse) => {
      if (msg.type === 'KP_GET_STATUS') {
        const modeManager = this.stateManager.getModeManager();
        sendResponse({ 
          mode: this.stateManager.getState().mode,
          modeInfo: modeManager.getCurrentModeInfo()
        });
      } else if (msg.type === 'KP_TOGGLE_STATE') {
        if (typeof msg.enabled === 'boolean') {
          if (msg.enabled) {
            await this.enable();
          } else {
            await this.disable();
          }
        }
      } else if (msg.type === 'KP_OPEN_SETTINGS') {
        const settingsManager = this.lifecycleManager.getComponent('settingsManager');
        if (settingsManager) {
          settingsManager.open();
        }
      }
    });
  }

  /**
   * Setup continuous cursor sync
   */
  setupContinuousCursorSync() {
    const cursor = this.lifecycleManager.getComponent('cursor');
    if (!cursor) return;

    let lastSyncTime = 0;
    const syncCursor = () => {
      const now = Date.now();
      
      if (now - lastSyncTime > 16) { // 60fps
        const currentState = this.stateManager.getState();
        if (currentState.lastMouse.x !== -1 && currentState.lastMouse.y !== -1) {
          cursor.updatePosition(currentState.lastMouse.x, currentState.lastMouse.y);
        }
        lastSyncTime = now;
      }
      
      requestAnimationFrame(syncCursor);
    };
    
    requestAnimationFrame(syncCursor);
  }

  /**
   * Initialize cursor position using stored coordinates
   */
  async initializeCursorPosition() {
    const mouseCoordinateManager = this.lifecycleManager.getComponent('mouseCoordinateManager');
    const cursor = this.lifecycleManager.getComponent('cursor');
    
    if (mouseCoordinateManager && cursor) {
      try {
        const storedCoords = await mouseCoordinateManager.getStoredCoordinates();
        if (storedCoords) {
          cursor.updatePosition(storedCoords.x, storedCoords.y);
          this.stateManager.setMousePosition(storedCoords.x, storedCoords.y);
        }
      } catch (error) {
        console.warn('[KeyPilot] Could not restore cursor position:', error);
      }
    }
  }

  /**
   * Update popup status
   * @param {string} mode
   */
  updatePopupStatus(mode) {
    try {
      chrome.runtime.sendMessage({ type: 'KP_STATUS', mode });
    } catch (error) {
      // Popup might not be open
    }
  }

  /**
   * Get application metrics
   * @returns {Object}
   */
  getMetrics() {
    const inputMetrics = this.inputCoordinator.getMetrics();
    const rectangleObserver = this.lifecycleManager.getComponent('rectangleIntersectionObserver');
    
    return {
      input: inputMetrics,
      rectangleIntersection: rectangleObserver ? rectangleObserver.getMetrics() : null,
      lifecycle: {
        initialized: this.lifecycleManager.isInitialized(),
        enabled: this.lifecycleManager.isEnabled()
      }
    };
  }

  /**
   * Cleanup and destroy the application
   */
  async cleanup() {
    try {
      await this.lifecycleManager.cleanup();
      this.inputCoordinator.cleanup();
      
      // Clear global flag
      delete window.__KeyPilotV22;
      
      console.log('[KeyPilot] Application cleanup complete');
    } catch (error) {
      console.error('[KeyPilot] Cleanup error:', error);
    }
  }
}
