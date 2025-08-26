/**
 * KeyPilot main application class
 */
import { StateManager } from './modules/state-manager.js';
import { EventManager } from './modules/event-manager.js';
import { CursorManager } from './modules/cursor.js';
import { ElementDetector } from './modules/element-detector.js';
import { ActivationHandler } from './modules/activation-handler.js';
import { FocusDetector } from './modules/focus-detector.js';
import { OverlayManager } from './modules/overlay-manager.js';
import { StyleManager } from './modules/style-manager.js';
import { ShadowDOMManager } from './modules/shadow-dom-manager.js';
import { IntersectionObserverManager } from './modules/intersection-observer-manager.js';
import { OptimizedScrollManager } from './modules/optimized-scroll-manager.js';
import { HUDManager } from './modules/hud-manager.js';
import { KEYBINDINGS, MODES, CSS_CLASSES } from './config/constants.js';

export class KeyPilot extends EventManager {
  constructor() {
    super();

    // Prevent multiple instances
    if (window.__KeyPilotV22) {
      console.warn('[KeyPilot] Already loaded.');
      return;
    }
    window.__KeyPilotV22 = true;

    // Extension enabled state - default to true, will be updated from service worker
    this.enabled = true;
    this.initializationComplete = false;

    this.state = new StateManager();
    this.cursor = new CursorManager();
    this.detector = new ElementDetector();
    this.activator = new ActivationHandler(this.detector);
    this.focusDetector = new FocusDetector(this.state);
    this.overlayManager = new OverlayManager();
    this.styleManager = new StyleManager();
    this.shadowDOMManager = new ShadowDOMManager(this.styleManager);
    this.hudManager = new HUDManager(this.state, this.styleManager);
    
    // Intersection Observer optimizations
    this.intersectionManager = new IntersectionObserverManager(this.detector);
    this.scrollManager = new OptimizedScrollManager(this.overlayManager, this.state);

    // Mouse movement optimization: only query every 3+ pixels (increased threshold)
    this.lastQueryPosition = { x: -1, y: -1 };
    this.MOUSE_QUERY_THRESHOLD = 3;
    
    // Performance monitoring
    this.performanceMetrics = {
      mouseQueries: 0,
      cacheHits: 0,
      lastMetricsLog: Date.now()
    };

    this.init();
  }

  async init() {
    // Step 1: Detect early injection and get placeholders
    const earlyInjectionResult = this.detectEarlyInjection();
    
    // Step 2: Set up styles and shadow DOM support (skip if early injection handled styles)
    if (!earlyInjectionResult.stylesInjected) {
      this.setupStyles();
    }
    this.setupShadowDOMSupport();
    
    // Step 3: Handle cursor initialization based on early injection
    if (earlyInjectionResult.detected) {
      // Enhance existing cursor placeholder with state bridge
      await this.enhanceCursorPlaceholder(
        earlyInjectionResult.placeholders.cursor, 
        earlyInjectionResult.stateBridge
      );
    } else {
      // Create cursor normally (fallback)
      this.cursor.ensure();
    }
    
    // Step 4: Handle placeholder transition and migrate state if early injection occurred
    if (earlyInjectionResult.detected) {
      this.handlePlaceholderTransition(earlyInjectionResult);
      this.migrateStateFromPlaceholders(earlyInjectionResult);
    }
    
    // Step 5: Query service worker for current enabled state
    await this.queryInitialState();
    
    // Step 6: Handle fallback scenarios if needed
    if (!earlyInjectionResult.detected || 
        document.documentElement.getAttribute('data-kpv2-early-injection') === 'failed') {
      this.handleEarlyInjectionFallback(earlyInjectionResult);
    }
    
    // Step 7: Initialize functionality based on enabled state
    if (this.enabled) {
      await this.initializeEnabledState(earlyInjectionResult);
    } else {
      this.initializeDisabledState();
    }
    
    // Step 8: Set up navigation persistence for cursor state
    this.setupNavigationPersistence(earlyInjectionResult);

    // Step 8: Always set up communication and state management
    this.state.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });

    this.setupPopupCommunication();
    this.setupOptimizedEventListeners();
    this.setupContinuousCursorSync();

    this.initializationComplete = true;
    this.state.setState({ isInitialized: true });
  }

  /**
   * Detect if early injection occurred successfully
   * Returns information about placeholders and injection status
   */
  detectEarlyInjection() {
    const result = {
      detected: false,
      stylesInjected: false,
      placeholders: {
        hud: null,
        cursor: null
      },
      earlyState: null,
      stateBridge: null
    };

    try {
      // Check for early injection marker
      const injectionStatus = document.documentElement.getAttribute('data-kpv2-early-injection');
      
      if (injectionStatus === 'complete') {
        result.detected = true;
        console.log('[KeyPilot] Early injection detected successfully');
        
        // Look for placeholder elements
        result.placeholders.hud = document.getElementById('kpv2-hud');
        result.placeholders.cursor = document.getElementById('kpv2-cursor');
        
        // Check if placeholders have early injection markers
        if (result.placeholders.hud && result.placeholders.hud.getAttribute('data-early-injection') === 'true') {
          console.log('[KeyPilot] HUD placeholder found');
        }
        
        if (result.placeholders.cursor && result.placeholders.cursor.getAttribute('data-early-injection') === 'true') {
          console.log('[KeyPilot] Cursor placeholder found');
        }
        
        // Check if critical styles were injected
        const criticalStylesElement = document.getElementById('kpv2-critical-styles');
        if (criticalStylesElement) {
          result.stylesInjected = true;
          console.log('[KeyPilot] Critical styles detected');
        }
        
        // Try to get early injector instance and state bridge
        if (window.kpv2EarlyInjector) {
          result.stateBridge = window.kpv2EarlyInjector.getStateBridge();
          result.earlyState = window.kpv2EarlyInjector.getEarlyState();
          console.log('[KeyPilot] Early injector instance found, state:', result.earlyState);
        }
        
      } else if (injectionStatus === 'failed') {
        console.warn('[KeyPilot] Early injection failed, using fallback initialization');
      } else {
        console.log('[KeyPilot] No early injection detected, using normal initialization');
      }
      
    } catch (error) {
      console.error('[KeyPilot] Error detecting early injection:', error);
      // Continue with fallback
    }
    
    return result;
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

  /**
   * Enhance cursor placeholder with full functionality
   */
  async enhanceCursorPlaceholder(cursorPlaceholder, stateBridge = null) {
    try {
      if (!cursorPlaceholder) {
        console.warn('[KeyPilot] No cursor placeholder to enhance, creating new cursor');
        this.cursor.ensure();
        return;
      }
      
      console.log('[KeyPilot] Enhancing cursor placeholder');
      
      // Tell cursor manager to use existing element with state bridge
      this.cursor.enhanceExistingElement(cursorPlaceholder, stateBridge);
      
      // Remove early injection marker
      cursorPlaceholder.removeAttribute('data-early-injection');
      
      console.log('[KeyPilot] Cursor placeholder enhanced successfully');
      
    } catch (error) {
      console.error('[KeyPilot] Failed to enhance cursor placeholder:', error);
      // Fallback to creating new cursor
      this.cursor.ensure();
    }
  }

  /**
   * Initialize KeyPilot in enabled state
   */
  async initializeEnabledState(earlyInjectionResult = null) {
    this.focusDetector.start();
    this.intersectionManager.init();
    this.scrollManager.init();
    
    // Handle HUD initialization based on early injection
    if (earlyInjectionResult && earlyInjectionResult.detected && earlyInjectionResult.placeholders.hud) {
      // Enhance existing HUD placeholder
      await this.hudManager.enhanceExistingElement(
        earlyInjectionResult.placeholders.hud,
        earlyInjectionResult.earlyState,
        earlyInjectionResult.stateBridge
      );
    } else {
      // Initialize HUD normally (fallback)
      await this.hudManager.initialize();
    }
    
    this.start();
    this.cursor.show();
  }

  /**
   * Initialize KeyPilot in disabled state
   */
  initializeDisabledState() {
    // Don't start event listeners or focus detector
    // Hide cursor
    this.cursor.hide();
    
    // Ensure overlays are hidden
    this.overlayManager.hideFocusOverlay();
    this.overlayManager.hideDeleteOverlay();
  }

  /**
   * Handle fallback scenarios when early injection fails or is incomplete
   */
  handleEarlyInjectionFallback(earlyInjectionResult) {
    try {
      console.log('[KeyPilot] Handling early injection fallback');
      
      // Determine fallback strategy based on injection status
      const injectionStatus = document.documentElement.getAttribute('data-kpv2-early-injection');
      
      if (injectionStatus === 'failed') {
        console.log('[KeyPilot] Early injection failed, performing cleanup and full fallback');
        this.handleFailedInjectionFallback(earlyInjectionResult);
      } else if (!earlyInjectionResult.detected) {
        console.log('[KeyPilot] No early injection detected, using normal initialization');
        this.handleNoInjectionFallback();
      } else {
        console.log('[KeyPilot] Partial early injection detected, ensuring completeness');
        this.handlePartialInjectionFallback(earlyInjectionResult);
      }
      
      // Always ensure all functionality works regardless of injection timing
      this.ensureFunctionalityAvailable();
      
      // Verify critical components are working
      this.verifyComponentIntegrity();
      
      console.log('[KeyPilot] Fallback handling completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error during fallback handling:', error);
      // Continue with basic functionality
      this.handleCriticalFallback();
    }
  }

  /**
   * Handle fallback when early injection completely failed
   */
  handleFailedInjectionFallback(earlyInjectionResult) {
    try {
      console.log('[KeyPilot] Handling failed injection fallback');
      
      // Clean up any partial state from failed injection
      this.cleanupFailedEarlyInjection();
      
      // Reset to clean state for normal initialization
      this.resetToCleanState();
      
      // Ensure no early injection artifacts remain
      this.removeEarlyInjectionArtifacts();
      
    } catch (error) {
      console.error('[KeyPilot] Error in failed injection fallback:', error);
    }
  }

  /**
   * Handle fallback when no early injection was attempted
   */
  handleNoInjectionFallback() {
    try {
      console.log('[KeyPilot] Handling no injection fallback - normal initialization');
      
      // This is the normal case - just ensure everything is set up correctly
      // No special handling needed, just log for debugging
      
    } catch (error) {
      console.error('[KeyPilot] Error in no injection fallback:', error);
    }
  }

  /**
   * Handle fallback when early injection was partial or incomplete
   */
  handlePartialInjectionFallback(earlyInjectionResult) {
    try {
      console.log('[KeyPilot] Handling partial injection fallback');
      
      // Check what's missing and fill in the gaps
      if (!earlyInjectionResult.placeholders.hud) {
        console.log('[KeyPilot] HUD placeholder missing, will create normally');
      }
      
      if (!earlyInjectionResult.placeholders.cursor) {
        console.log('[KeyPilot] Cursor placeholder missing, will create normally');
      }
      
      if (!earlyInjectionResult.stylesInjected) {
        console.log('[KeyPilot] Critical styles missing, will inject normally');
      }
      
      // Let the normal initialization handle missing pieces
      
    } catch (error) {
      console.error('[KeyPilot] Error in partial injection fallback:', error);
    }
  }

  /**
   * Handle critical fallback when all other fallbacks fail
   */
  handleCriticalFallback() {
    try {
      console.warn('[KeyPilot] Executing critical fallback - minimal functionality mode');
      
      // Ensure absolute minimum functionality
      if (!this.state) {
        console.error('[KeyPilot] State manager missing in critical fallback');
        return;
      }
      
      if (!this.cursor) {
        console.error('[KeyPilot] Cursor manager missing in critical fallback');
        return;
      }
      
      // Try to create cursor with minimal functionality
      try {
        this.cursor.ensure();
      } catch (error) {
        console.error('[KeyPilot] Failed to create cursor in critical fallback:', error);
      }
      
      // Try to inject basic styles
      try {
        if (this.styleManager) {
          this.styleManager.injectSharedStyles();
        }
      } catch (error) {
        console.error('[KeyPilot] Failed to inject styles in critical fallback:', error);
      }
      
      console.log('[KeyPilot] Critical fallback completed');
      
    } catch (error) {
      console.error('[KeyPilot] Critical fallback failed:', error);
      // At this point, we can't do much more
    }
  }

  /**
   * Reset to clean state for normal initialization
   */
  resetToCleanState() {
    try {
      // Reset any flags or state that might interfere with normal initialization
      this.initializationComplete = false;
      
      // Clear any cached elements that might be from failed injection
      if (this.hudManager) {
        this.hudManager.hudElement = null;
      }
      
      if (this.cursor) {
        this.cursor.cursorEl = null;
      }
      
      console.log('[KeyPilot] Reset to clean state for normal initialization');
      
    } catch (error) {
      console.error('[KeyPilot] Error resetting to clean state:', error);
    }
  }

  /**
   * Remove any artifacts from early injection attempts
   */
  removeEarlyInjectionArtifacts() {
    try {
      // Remove early injection markers
      document.documentElement.removeAttribute('data-kpv2-early-injection');
      
      // Remove any global early injection variables
      if (window.kpv2EarlyInjector) {
        try {
          // Try to cleanup early injector if it has cleanup method
          if (typeof window.kpv2EarlyInjector.cleanup === 'function') {
            window.kpv2EarlyInjector.cleanup();
          }
        } catch (error) {
          console.warn('[KeyPilot] Error cleaning up early injector:', error);
        }
        
        delete window.kpv2EarlyInjector;
      }
      
      console.log('[KeyPilot] Early injection artifacts removed');
      
    } catch (error) {
      console.error('[KeyPilot] Error removing early injection artifacts:', error);
    }
  }

  /**
   * Clean up any partial state from failed early injection
   */
  cleanupFailedEarlyInjection() {
    try {
      // Remove any partial placeholder elements
      const partialHUD = document.getElementById('kpv2-hud');
      if (partialHUD && partialHUD.getAttribute('data-early-injection') === 'true') {
        partialHUD.remove();
        console.log('[KeyPilot] Removed partial HUD placeholder');
      }
      
      const partialCursor = document.getElementById('kpv2-cursor');
      if (partialCursor && partialCursor.getAttribute('data-early-injection') === 'true') {
        partialCursor.remove();
        console.log('[KeyPilot] Removed partial cursor placeholder');
      }
      
      // Remove partial critical styles
      const partialStyles = document.getElementById('kpv2-critical-styles');
      if (partialStyles) {
        partialStyles.remove();
        console.log('[KeyPilot] Removed partial critical styles');
      }
      
      // Clear early injection marker
      document.documentElement.removeAttribute('data-kpv2-early-injection');
      
    } catch (error) {
      console.error('[KeyPilot] Error cleaning up failed early injection:', error);
    }
  }

  /**
   * Ensure all functionality is available regardless of injection timing
   */
  ensureFunctionalityAvailable() {
    try {
      console.log('[KeyPilot] Ensuring all functionality is available');
      
      // Ensure cursor exists and is functional
      this.ensureCursorFunctionality();
      
      // Ensure styles are injected
      this.ensureStylesFunctionality();
      
      // Ensure HUD functionality
      this.ensureHUDFunctionality();
      
      // Ensure event handling is set up
      this.ensureEventHandling();
      
      // Ensure state management is working
      this.ensureStateManagement();
      
      console.log('[KeyPilot] All functionality availability ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring functionality availability:', error);
    }
  }

  /**
   * Ensure cursor functionality is available
   */
  ensureCursorFunctionality() {
    try {
      if (!this.cursor) {
        console.error('[KeyPilot] Cursor manager not available');
        return;
      }
      
      // Check if cursor element exists and is in DOM
      if (!this.cursor.element || !document.contains(this.cursor.element)) {
        console.log('[KeyPilot] Creating cursor element');
        this.cursor.ensure();
      }
      
      // Verify cursor can be positioned
      if (this.cursor.element) {
        const testX = 100, testY = 100;
        this.cursor.updatePosition(testX, testY);
        
        // Check if position was applied
        const rect = this.cursor.element.getBoundingClientRect();
        if (Math.abs(rect.left + rect.width/2 - testX) > 10 || 
            Math.abs(rect.top + rect.height/2 - testY) > 10) {
          console.warn('[KeyPilot] Cursor positioning may not be working correctly');
        }
      }
      
      console.log('[KeyPilot] Cursor functionality ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring cursor functionality:', error);
    }
  }

  /**
   * Ensure styles functionality is available
   */
  ensureStylesFunctionality() {
    try {
      if (!this.styleManager) {
        console.error('[KeyPilot] Style manager not available');
        return;
      }
      
      // Check if styles are injected
      const hasSharedStyles = document.getElementById('kpv2-shared-styles');
      const hasCriticalStyles = document.getElementById('kpv2-critical-styles');
      
      if (!hasSharedStyles && !hasCriticalStyles) {
        console.log('[KeyPilot] Injecting styles');
        this.styleManager.injectSharedStyles();
      }
      
      // Verify styles were injected
      const stylesAfterInjection = document.getElementById('kpv2-shared-styles') || 
                                   document.getElementById('kpv2-critical-styles');
      
      if (!stylesAfterInjection) {
        console.warn('[KeyPilot] Styles injection may have failed');
      }
      
      console.log('[KeyPilot] Styles functionality ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring styles functionality:', error);
    }
  }

  /**
   * Ensure HUD functionality is available
   */
  ensureHUDFunctionality() {
    try {
      if (!this.hudManager) {
        console.error('[KeyPilot] HUD manager not available');
        return;
      }
      
      // HUD initialization will be handled by the main initialization flow
      // Just verify the manager is ready
      if (typeof this.hudManager.initialize !== 'function') {
        console.error('[KeyPilot] HUD manager initialize method not available');
        return;
      }
      
      console.log('[KeyPilot] HUD functionality ready for initialization');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring HUD functionality:', error);
    }
  }

  /**
   * Ensure event handling is set up
   */
  ensureEventHandling() {
    try {
      // Verify event manager base functionality
      if (typeof this.addEventListener !== 'function') {
        console.error('[KeyPilot] Event handling not available');
        return;
      }
      
      // Event listeners will be set up by the main initialization flow
      console.log('[KeyPilot] Event handling functionality ready');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring event handling:', error);
    }
  }

  /**
   * Ensure state management is working
   */
  ensureStateManagement() {
    try {
      if (!this.state) {
        console.error('[KeyPilot] State manager not available');
        return;
      }
      
      // Test basic state functionality
      if (typeof this.state.getState !== 'function' || 
          typeof this.state.setState !== 'function') {
        console.error('[KeyPilot] State manager methods not available');
        return;
      }
      
      // Test state access
      const currentState = this.state.getState();
      if (!currentState || typeof currentState !== 'object') {
        console.warn('[KeyPilot] State manager may not be working correctly');
      }
      
      console.log('[KeyPilot] State management functionality ensured');
      
    } catch (error) {
      console.error('[KeyPilot] Error ensuring state management:', error);
    }
  }

  /**
   * Handle seamless transition from placeholders to full functionality
   */
  handlePlaceholderTransition(earlyInjectionResult) {
    try {
      if (!earlyInjectionResult.detected) {
        console.log('[KeyPilot] No placeholder transition needed');
        return;
      }
      
      console.log('[KeyPilot] Handling placeholder transition to full functionality');
      
      // Preserve visual continuity during transition
      this.preserveVisualContinuity(earlyInjectionResult);
      
      // Ensure no flickering during enhancement
      this.preventTransitionFlicker(earlyInjectionResult);
      
      // Set up state bridge integration if available
      if (earlyInjectionResult.stateBridge) {
        this.integrateStateBridge(earlyInjectionResult.stateBridge);
      }
      
      console.log('[KeyPilot] Placeholder transition completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error during placeholder transition:', error);
      // Continue with normal functionality
    }
  }

  /**
   * Preserve visual continuity during placeholder enhancement
   */
  preserveVisualContinuity(earlyInjectionResult) {
    try {
      // Ensure HUD remains visible during enhancement
      if (earlyInjectionResult.placeholders.hud) {
        const hud = earlyInjectionResult.placeholders.hud;
        
        // Temporarily prevent any visibility changes
        hud.style.transition = 'none';
        
        // Restore transitions after enhancement
        setTimeout(() => {
          if (hud.style) {
            hud.style.transition = '';
          }
        }, 100);
      }
      
      // Ensure cursor remains visible during enhancement
      if (earlyInjectionResult.placeholders.cursor) {
        const cursor = earlyInjectionResult.placeholders.cursor;
        
        // Temporarily prevent any visibility changes
        cursor.style.transition = 'none';
        
        // Restore transitions after enhancement
        setTimeout(() => {
          if (cursor.style) {
            cursor.style.transition = '';
          }
        }, 100);
      }
      
    } catch (error) {
      console.error('[KeyPilot] Error preserving visual continuity:', error);
    }
  }

  /**
   * Prevent flickering during transition from placeholders to full elements
   */
  preventTransitionFlicker(earlyInjectionResult) {
    try {
      // Use requestAnimationFrame to ensure smooth transition
      requestAnimationFrame(() => {
        // Any visual updates should happen here to prevent flickering
        if (earlyInjectionResult.placeholders.hud) {
          // Ensure HUD maintains its position and visibility
          const hud = earlyInjectionResult.placeholders.hud;
          const computedStyle = window.getComputedStyle(hud);
          
          // Preserve current visibility state
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            hud.style.opacity = '1';
          }
        }
        
        if (earlyInjectionResult.placeholders.cursor) {
          // Ensure cursor maintains its position and visibility
          const cursor = earlyInjectionResult.placeholders.cursor;
          const computedStyle = window.getComputedStyle(cursor);
          
          // Preserve current visibility state
          if (computedStyle.display !== 'none' && computedStyle.visibility !== 'hidden') {
            cursor.style.opacity = '1';
          }
        }
      });
      
    } catch (error) {
      console.error('[KeyPilot] Error preventing transition flicker:', error);
    }
  }

  /**
   * Integrate with state bridge from early injection
   */
  integrateStateBridge(stateBridge) {
    try {
      if (!stateBridge) return;
      
      console.log('[KeyPilot] Integrating with state bridge from early injection');
      
      // Set up event listeners for state bridge events
      stateBridge.on('stateChange', (data) => {
        this.handleStateBridgeStateChange(data.newState, data.prevState);
      });
      
      stateBridge.on('extensionToggle', (data) => {
        if (data.enabled !== this.enabled) {
          if (data.enabled) {
            this.enable();
          } else {
            this.disable();
          }
        }
      });
      
      // Sync current state with state bridge
      const currentState = this.state.getState();
      stateBridge.updateState({
        mode: currentState.mode,
        extensionEnabled: this.enabled,
        hudVisible: currentState.hud?.visible,
        hudExpanded: currentState.hud?.expanded,
        hudActiveTab: currentState.hud?.activeTab
      });
      
      console.log('[KeyPilot] State bridge integration completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error integrating state bridge:', error);
    }
  }

  /**
   * Handle state changes from state bridge
   */
  handleStateBridgeStateChange(newState, prevState) {
    try {
      // Update local state based on state bridge changes
      if (newState.mode !== prevState.mode) {
        this.state.setState({ mode: newState.mode });
      }
      
      if (newState.hudVisible !== prevState.hudVisible ||
          newState.hudExpanded !== prevState.hudExpanded ||
          newState.hudActiveTab !== prevState.hudActiveTab) {
        this.state.setState({
          hud: {
            visible: newState.hudVisible,
            expanded: newState.hudExpanded,
            activeTab: newState.hudActiveTab
          }
        });
      }
      
    } catch (error) {
      console.error('[KeyPilot] Error handling state bridge state change:', error);
    }
  }

  /**
   * Migrate state from placeholders to full elements
   */
  migrateStateFromPlaceholders(earlyInjectionResult) {
    try {
      if (!earlyInjectionResult.detected || !earlyInjectionResult.earlyState) {
        console.log('[KeyPilot] No early state to migrate');
        return;
      }
      
      console.log('[KeyPilot] Migrating state from placeholders to full elements');
      
      const earlyState = earlyInjectionResult.earlyState;
      
      // Migrate HUD state
      if (earlyState.hudVisible !== undefined || earlyState.hudExpanded !== undefined) {
        const hudState = {
          visible: earlyState.hudVisible !== undefined ? earlyState.hudVisible : true,
          expanded: earlyState.hudExpanded !== undefined ? earlyState.hudExpanded : false,
          activeTab: earlyState.hudActiveTab || 'status'
        };
        
        // Update state manager with migrated HUD state
        this.state.setState({ hud: hudState });
        console.log('[KeyPilot] HUD state migrated:', hudState);
      }
      
      // Migrate cursor mode state
      if (earlyState.cursorMode) {
        this.state.setState({ mode: earlyState.cursorMode });
        console.log('[KeyPilot] Cursor mode migrated:', earlyState.cursorMode);
      }
      
      // Migrate extension enabled state
      if (earlyState.extensionEnabled !== undefined) {
        this.enabled = earlyState.extensionEnabled;
        console.log('[KeyPilot] Extension enabled state migrated:', this.enabled);
      }
      
      console.log('[KeyPilot] State migration completed');
      
    } catch (error) {
      console.error('[KeyPilot] Error migrating state from placeholders:', error);
      // Continue with default state
    }
  }

  /**
   * Verify that critical components are working properly
   */
  verifyComponentIntegrity() {
    try {
      console.log('[KeyPilot] Verifying component integrity');
      
      const issues = [];
      const warnings = [];
      
      // Check cursor manager
      const cursorCheck = this.verifyCursorIntegrity();
      if (cursorCheck.issues.length > 0) issues.push(...cursorCheck.issues);
      if (cursorCheck.warnings.length > 0) warnings.push(...cursorCheck.warnings);
      
      // Check state manager
      const stateCheck = this.verifyStateIntegrity();
      if (stateCheck.issues.length > 0) issues.push(...stateCheck.issues);
      if (stateCheck.warnings.length > 0) warnings.push(...stateCheck.warnings);
      
      // Check style manager
      const styleCheck = this.verifyStyleIntegrity();
      if (styleCheck.issues.length > 0) issues.push(...styleCheck.issues);
      if (styleCheck.warnings.length > 0) warnings.push(...styleCheck.warnings);
      
      // Check HUD manager
      const hudCheck = this.verifyHUDIntegrity();
      if (hudCheck.issues.length > 0) issues.push(...hudCheck.issues);
      if (hudCheck.warnings.length > 0) warnings.push(...hudCheck.warnings);
      
      // Check other critical components
      const otherCheck = this.verifyOtherComponentsIntegrity();
      if (otherCheck.issues.length > 0) issues.push(...otherCheck.issues);
      if (otherCheck.warnings.length > 0) warnings.push(...otherCheck.warnings);
      
      // Report results
      if (issues.length > 0) {
        console.error('[KeyPilot] Component integrity issues detected:', issues);
        // Continue anyway - partial functionality is better than none
      }
      
      if (warnings.length > 0) {
        console.warn('[KeyPilot] Component integrity warnings:', warnings);
      }
      
      if (issues.length === 0 && warnings.length === 0) {
        console.log('[KeyPilot] All components verified as functional');
      }
      
      return { issues, warnings };
      
    } catch (error) {
      console.error('[KeyPilot] Error verifying component integrity:', error);
      return { issues: ['Component integrity verification failed'], warnings: [] };
    }
  }

  /**
   * Verify cursor manager integrity
   */
  verifyCursorIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.cursor) {
        issues.push('Cursor manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['ensure', 'updatePosition', 'setMode', 'show', 'hide'];
      for (const method of requiredMethods) {
        if (typeof this.cursor[method] !== 'function') {
          issues.push(`Cursor manager missing ${method} method`);
        }
      }
      
      // Check if cursor element can be created
      if (!this.cursor.element) {
        warnings.push('Cursor element not yet created');
      }
      
    } catch (error) {
      issues.push(`Cursor integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify state manager integrity
   */
  verifyStateIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.state) {
        issues.push('State manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['getState', 'setState', 'subscribe', 'reset'];
      for (const method of requiredMethods) {
        if (typeof this.state[method] !== 'function') {
          issues.push(`State manager missing ${method} method`);
        }
      }
      
      // Test basic state operations
      try {
        const currentState = this.state.getState();
        if (!currentState || typeof currentState !== 'object') {
          warnings.push('State manager returning invalid state');
        }
      } catch (error) {
        issues.push(`State manager getState failed: ${error.message}`);
      }
      
    } catch (error) {
      issues.push(`State integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify style manager integrity
   */
  verifyStyleIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.styleManager) {
        issues.push('Style manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['injectSharedStyles'];
      for (const method of requiredMethods) {
        if (typeof this.styleManager[method] !== 'function') {
          issues.push(`Style manager missing ${method} method`);
        }
      }
      
    } catch (error) {
      issues.push(`Style integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify HUD manager integrity
   */
  verifyHUDIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      if (!this.hudManager) {
        issues.push('HUD manager not available');
        return { issues, warnings };
      }
      
      // Check essential methods
      const requiredMethods = ['initialize', 'show', 'hide'];
      for (const method of requiredMethods) {
        if (typeof this.hudManager[method] !== 'function') {
          issues.push(`HUD manager missing ${method} method`);
        }
      }
      
      // Check if enhance method is available for early injection
      if (typeof this.hudManager.enhanceExistingElement !== 'function') {
        warnings.push('HUD manager missing enhanceExistingElement method');
      }
      
    } catch (error) {
      issues.push(`HUD integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  /**
   * Verify other critical components integrity
   */
  verifyOtherComponentsIntegrity() {
    const issues = [];
    const warnings = [];
    
    try {
      // Check detector
      if (!this.detector || typeof this.detector.deepElementFromPoint !== 'function') {
        issues.push('Element detector not functional');
      }
      
      // Check activator
      if (!this.activator || typeof this.activator.smartClick !== 'function') {
        issues.push('Activation handler not functional');
      }
      
      // Check focus detector
      if (!this.focusDetector || typeof this.focusDetector.start !== 'function') {
        issues.push('Focus detector not functional');
      }
      
      // Check overlay manager
      if (!this.overlayManager || typeof this.overlayManager.updateOverlays !== 'function') {
        issues.push('Overlay manager not functional');
      }
      
    } catch (error) {
      issues.push(`Other components integrity check failed: ${error.message}`);
    }
    
    return { issues, warnings };
  }

  setupOptimizedEventListeners() {
    // Listen for scroll end events from optimized scroll manager
    document.addEventListener('keypilot:scroll-end', (event) => {
      const { mouseX, mouseY } = event.detail;
      this.updateElementsUnderCursor(mouseX, mouseY);
    });
    
    // Periodic performance metrics logging
    // Enable by setting window.KEYPILOT_DEBUG = true in console
    setInterval(() => {
      if (window.KEYPILOT_DEBUG) {
        this.logPerformanceMetrics();
      }
    }, 10000); // Log every 10 seconds when debug enabled
  }

  setupContinuousCursorSync() {
    // Fallback cursor sync for problematic sites
    let lastSyncTime = 0;
    const syncCursor = () => {
      const now = Date.now();
      
      // Only sync every 16ms (60fps) to avoid performance issues
      if (now - lastSyncTime > 16) {
        const currentState = this.state.getState();
        if (currentState.lastMouse.x !== -1 && currentState.lastMouse.y !== -1) {
          // Force cursor position update
          this.cursor.updatePosition(currentState.lastMouse.x, currentState.lastMouse.y);
        }
        lastSyncTime = now;
      }
      
      // Continue syncing
      requestAnimationFrame(syncCursor);
    };
    
    // Start the sync loop
    requestAnimationFrame(syncCursor);
  }

  setupStyles() {
    this.styleManager.injectSharedStyles();
  }

  setupShadowDOMSupport() {
    this.shadowDOMManager.setup();
  }

  setupPopupCommunication() {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.type === 'KP_GET_STATUS') {
        sendResponse({ mode: this.state.getState().mode });
      } else if (msg.type === 'KP_TOGGLE_STATE') {
        // Handle toggle state message from service worker
        if (typeof msg.enabled === 'boolean') {
          if (msg.enabled) {
            this.enable();
          } else {
            this.disable();
          }
        }
      }
    });
  }

  /**
   * Set up navigation persistence for cursor state
   */
  setupNavigationPersistence(earlyInjectionResult = null) {
    try {
      // Set up state bridge for cursor if available
      if (earlyInjectionResult && earlyInjectionResult.stateBridge) {
        this.cursor.setStateBridge(earlyInjectionResult.stateBridge);
      }
      
      // Handle page navigation events
      window.addEventListener('beforeunload', () => {
        if (this.cursor) {
          this.cursor.handleNavigationPersistence();
        }
      });
      
      // Handle visibility changes (tab switching, etc.)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.cursor) {
          this.cursor.handleNavigationPersistence();
        }
      });
      
      // Set up cross-tab cursor state synchronization
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'KP_CURSOR_STATE_SYNC') {
            this.cursor.handleCrossTabSync(message.cursorState);
            sendResponse({ success: true });
            return true;
          }
        });
      }
      
      console.log('[KeyPilot] Navigation persistence set up for cursor');
    } catch (error) {
      console.error('[KeyPilot] Failed to set up navigation persistence:', error);
    }
  }

  handleStateChange(newState, prevState) {
    // Update cursor mode
    if (newState.mode !== prevState.mode) {
      this.cursor.setMode(newState.mode);
      this.updatePopupStatus(newState.mode);
      
      // Update HUD mode display when KeyPilot mode changes
      if (this.hudManager && this.enabled) {
        this.hudManager.updateModeDisplay(newState.mode);
      }
    }

    // Update visual overlays
    if (newState.focusEl !== prevState.focusEl ||
      newState.deleteEl !== prevState.deleteEl) {
      this.updateOverlays(newState.focusEl, newState.deleteEl);
    }
  }

  updatePopupStatus(mode) {
    try {
      chrome.runtime.sendMessage({ type: 'KP_STATUS', mode });
    } catch (error) {
      // Popup might not be open
    }
  }

  handleKeyDown(e) {
    // Don't handle keys if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Debug key presses
    console.log('[KeyPilot] Key pressed:', e.key, 'Code:', e.code);

    // Don't interfere with modifier key combinations (Cmd+C, Ctrl+V, etc.)
    if (this.hasModifierKeys(e)) {
      return;
    }

    const currentState = this.state.getState();

    // In text focus mode, only handle ESC
    if (currentState.mode === MODES.TEXT_FOCUS) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        console.debug('Escape key detected in text focus mode');
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        this.handleEscapeFromTextFocus();
      }
      return;
    }

    // Don't handle keys if we're in a typing context but not in our text focus mode
    // (This handles edge cases where focus detection might miss something)
    if (this.isTypingContext(e.target)) {
      if (KEYBINDINGS.CANCEL.includes(e.key)) {
        this.cancelModes();
      }
      return;
    }

    // Handle our keyboard shortcuts
    if (KEYBINDINGS.CANCEL.includes(e.key)) {
      e.preventDefault();
      this.cancelModes();
    } else if (KEYBINDINGS.BACK.includes(e.key) || KEYBINDINGS.BACK2.includes(e.key)) {
      e.preventDefault();
      history.back();
    } else if (KEYBINDINGS.FORWARD.includes(e.key)) {
      e.preventDefault();
      history.forward();
    } else if (KEYBINDINGS.ROOT.includes(e.key)) {
      e.preventDefault();
      this.handleRootKey();
    } else if (KEYBINDINGS.DELETE.includes(e.key)) {
      e.preventDefault();
      this.handleDeleteKey();
    } else if (KEYBINDINGS.ACTIVATE.includes(e.key)) {
      e.preventDefault();
      this.handleActivateKey();
    }
  }

  handleMouseMove(e) {
    // Don't handle mouse events if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Store mouse position immediately to prevent sync issues
    const x = e.clientX;
    const y = e.clientY;
    
    this.state.setMousePosition(x, y);
    this.cursor.updatePosition(x, y);

    // Use optimized element detection with threshold
    this.updateElementsUnderCursorWithThreshold(x, y);
  }

  handleScroll(e) {
    // Don't handle scroll events if extension is disabled
    if (!this.enabled) {
      return;
    }

    // Delegate scroll handling to optimized scroll manager
    // The scroll manager handles all the optimization logic
    return; // OptimizedScrollManager handles scroll events directly
  }

  updateElementsUnderCursorWithThreshold(x, y) {
    // Check if mouse has moved enough to warrant a new query
    const deltaX = Math.abs(x - this.lastQueryPosition.x);
    const deltaY = Math.abs(y - this.lastQueryPosition.y);

    if (deltaX < this.MOUSE_QUERY_THRESHOLD && deltaY < this.MOUSE_QUERY_THRESHOLD) {
      // Mouse hasn't moved enough, skip the query
      return;
    }

    // Update last query position
    this.lastQueryPosition.x = x;
    this.lastQueryPosition.y = y;

    // Perform the actual element query
    this.updateElementsUnderCursor(x, y);
  }

  updateElementsUnderCursor(x, y) {
    const currentState = this.state.getState();

    this.performanceMetrics.mouseQueries++;

    // Use traditional element detection for accuracy
    const under = this.detector.deepElementFromPoint(x, y);
    const clickable = this.detector.findClickable(under);
    
    // Track with intersection manager for performance metrics and caching
    this.intersectionManager.trackElementAtPoint(x, y);

    // Debug logging when debug mode is enabled
    if (window.KEYPILOT_DEBUG && clickable) {
      console.log('[KeyPilot Debug] Found clickable element:', {
        tagName: clickable.tagName,
        href: clickable.href,
        className: clickable.className,
        text: clickable.textContent?.substring(0, 50),
        mode: currentState.mode
      });
    }

    // Always update focus element (for overlays in text focus mode too)
    this.state.setFocusElement(clickable);

    if (this.state.isDeleteMode()) {
      // For delete mode, we need the exact element under cursor, not just clickable
      this.state.setDeleteElement(under);
    } else {
      // Clear delete element when not in delete mode
      this.state.setDeleteElement(null);
    }
  }

  handleDeleteKey() {
    const currentState = this.state.getState();
    console.log('[KeyPilot Debug] Delete key pressed, current mode:', currentState.mode);

    if (!this.state.isDeleteMode()) {
      console.log('[KeyPilot Debug] Entering delete mode');
      this.state.setMode(MODES.DELETE);
    } else {
      console.log('[KeyPilot Debug] Already in delete mode, executing delete');
      const victim = currentState.deleteEl ||
        this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

      console.log('[KeyPilot Debug] Delete victim:', victim);
      this.cancelModes();
      this.deleteElement(victim);
    }
  }

  handleRootKey() {
    console.log('[KeyPilot] Root key pressed!');
    console.log('[KeyPilot] Current URL:', window.location.href);
    console.log('[KeyPilot] Origin:', window.location.origin);

    // Navigate to the site root (origin)
    const rootUrl = window.location.origin;
    if (rootUrl && rootUrl !== window.location.href) {
      console.log('[KeyPilot] Navigating to root:', rootUrl);
      window.location.href = rootUrl;
    } else {
      console.log('[KeyPilot] Already at root, no navigation needed');
    }
  }

  handleActivateKey() {
    const currentState = this.state.getState();
    const target = currentState.focusEl ||
      this.detector.deepElementFromPoint(currentState.lastMouse.x, currentState.lastMouse.y);

    if (!target || target === document.documentElement || target === document.body) {
      return;
    }

    // Try semantic activation first
    if (this.activator.handleSmartActivate(target, currentState.lastMouse.x, currentState.lastMouse.y)) {
      this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
      return;
    }

    // Fallback to click
    this.activator.smartClick(target, currentState.lastMouse.x, currentState.lastMouse.y);
    this.showRipple(currentState.lastMouse.x, currentState.lastMouse.y);
  }

  deleteElement(element) {
    if (!element || element === document.documentElement || element === document.body) {
      return;
    }

    try {
      element.remove();
    } catch (error) {
      // Fallback: hide element
      try {
        element.classList.add('kpv2-hidden');
        element.setAttribute('aria-hidden', 'true');
      } catch { }
    }
  }

  handleEscapeFromTextFocus() {
    console.debug('Escape pressed in text focus mode, attempting to exit');

    // Use the simple, proven approach that works in DevTools
    // Blur the active element and set focus to the body
    if (document.activeElement) {
      document.activeElement.blur();
    }
    document.body.focus();

    // Clear the text focus state
    this.focusDetector.clearTextFocus();

    console.debug('Text focus escape completed');
  }

  cancelModes() {
    // Don't reset if we're in text focus mode - that should only be cleared by ESC or blur
    if (this.state.getState().mode !== MODES.TEXT_FOCUS) {
      this.state.reset();
    }
  }

  showRipple(x, y) {
    const ripple = document.createElement('div');
    ripple.className = CSS_CLASSES.RIPPLE;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    document.body.appendChild(ripple);

    ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
  }

  updateOverlays(focusEl, deleteEl) {
    const currentState = this.state.getState();
    console.log('[KeyPilot Debug] updateOverlays called:', {
      focusEl: focusEl?.tagName,
      deleteEl: deleteEl?.tagName,
      mode: currentState.mode
    });
    this.overlayManager.updateOverlays(focusEl, deleteEl, currentState.mode);
  }

  logPerformanceMetrics() {
    const now = Date.now();
    const timeSinceLastLog = now - this.performanceMetrics.lastMetricsLog;
    
    if (timeSinceLastLog < 10000) return; // Only log every 10 seconds
    
    const intersectionMetrics = this.intersectionManager.getMetrics();
    const scrollMetrics = this.scrollManager.getScrollMetrics();
    
    console.group('[KeyPilot] Performance Metrics');
    console.log('Mouse Queries:', this.performanceMetrics.mouseQueries);
    console.log('Intersection Observer Cache Hit Rate:', intersectionMetrics.cacheHitRate);
    console.log('Visible Interactive Elements:', intersectionMetrics.visibleElements);
    console.log('Scroll Throttle Ratio:', scrollMetrics.throttleRatio);
    console.log('Average Scroll Duration:', `${scrollMetrics.averageScrollDuration.toFixed(1)}ms`);
    console.groupEnd();
    
    this.performanceMetrics.lastMetricsLog = now;
  }

  /**
   * Enable KeyPilot functionality
   */
  async enable() {
    if (this.enabled) return;
    
    this.enabled = true;
    
    // Only initialize if initialization is complete
    if (this.initializationComplete) {
      // Restart event listeners
      this.start();
      
      // Show cursor
      if (this.cursor) {
        this.cursor.show();
      }
      
      // Restart focus detector
      if (this.focusDetector) {
        this.focusDetector.start();
      }
      
      // Restart intersection manager
      if (this.intersectionManager) {
        this.intersectionManager.init();
      }
      
      // Restart scroll manager
      if (this.scrollManager) {
        this.scrollManager.init();
      }
      
      // Initialize HUD manager and restore HUD state from storage
      if (this.hudManager) {
        await this.hudManager.handleKeyPilotEnabled();
      }
      
      // Reset only the KeyPilot state to normal mode, preserve HUD state
      this.state.setState({
        mode: MODES.NONE,
        focusEl: null,
        deleteEl: null
        // Don't reset HUD state - it was restored by hudManager.initialize()
      });
    }
    
    console.log('[KeyPilot] Extension enabled');
  }

  /**
   * Disable KeyPilot functionality
   */
  disable() {
    if (!this.enabled) return;
    
    this.enabled = false;
    
    // Only cleanup if initialization is complete
    if (this.initializationComplete) {
      // Stop event listeners
      this.stop();
      
      // Hide cursor
      if (this.cursor) {
        this.cursor.hide();
      }
      
      // Hide all overlays
      if (this.overlayManager) {
        this.overlayManager.hideFocusOverlay();
        this.overlayManager.hideDeleteOverlay();
      }
      
      // Notify HUD manager that KeyPilot is being disabled
      if (this.hudManager) {
        this.hudManager.handleKeyPilotDisabled();
      }
      
      // Stop focus detector
      if (this.focusDetector) {
        this.focusDetector.stop();
      }
      
      // Clean up intersection manager
      if (this.intersectionManager) {
        this.intersectionManager.cleanup();
      }
      
      // Clean up scroll manager
      if (this.scrollManager) {
        this.scrollManager.cleanup();
      }
      
      // Clear any active state
      this.state.reset();
    }
    
    console.log('[KeyPilot] Extension disabled');
  }

  /**
   * Check if KeyPilot is currently enabled
   */
  isEnabled() {
    return this.enabled;
  }

  cleanup() {
    this.stop();

    // Clean up intersection observer optimizations
    if (this.intersectionManager) {
      this.intersectionManager.cleanup();
    }
    
    if (this.scrollManager) {
      this.scrollManager.cleanup();
    }

    if (this.focusDetector) {
      this.focusDetector.stop();
    }

    if (this.cursor) {
      this.cursor.cleanup();
    }

    if (this.overlayManager) {
      this.overlayManager.cleanup();
    }

    // Clean up HUD manager
    if (this.hudManager) {
      this.hudManager.cleanup();
    }

    if (this.styleManager) {
      this.styleManager.cleanup();
    }

    if (this.shadowDOMManager) {
      this.shadowDOMManager.cleanup();
    }
    
    // Remove custom event listeners
    document.removeEventListener('keypilot:scroll-end', this.handleScrollEnd);
  }
}