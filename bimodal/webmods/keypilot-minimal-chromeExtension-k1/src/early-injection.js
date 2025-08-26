/**
 * Early injection script for KeyPilot - Optimized for minimal payload
 * Runs at document_start to provide immediate visual feedback
 * Creates placeholder elements for HUD and cursor before full initialization
 */

import { 
  injectCriticalStyles, 
  createEarlyHUDPlaceholder, 
  updateHUDPlaceholderState,
  createMinimalCursorSVG 
} from './early-injection-styles.js';
import { StateBridge } from './modules/state-bridge.js';

/**
 * Early Injector class - Optimized for minimal footprint
 * Handles the first phase of KeyPilot injection for immediate visual feedback
 */
class EarlyInjector {
  constructor() {
    this.injectionComplete = false;
    this.hudPlaceholder = null;
    this.cursorPlaceholder = null;
    this.stateBridge = new StateBridge();
    
    // Performance monitoring - only in development
    if (typeof console !== 'undefined' && console.time) {
      this.startTime = performance.now();
    }
  }

  /**
   * Initialize early injection - Optimized for speed with performance monitoring
   * Main entry point for early injection process
   */
  async initialize() {
    try {
      // Step 1: Inject critical styles immediately (most important for visual feedback)
      this.injectCriticalStyles();
      if (this.performanceMonitor) this.performanceMonitor.markStyleInjection();
      
      // Step 2: Create placeholder elements
      this.createPlaceholderElements();
      if (this.performanceMonitor) this.performanceMonitor.markElementCreation();
      
      // Step 3: Initialize state bridge and restore state (async, non-blocking)
      this.initializeStateAsync();
      
      // Mark injection as complete
      this.injectionComplete = true;
      document.documentElement.setAttribute('data-kpv2-early-injection', 'complete');
      
      // Complete performance monitoring
      if (this.performanceMonitor) {
        this.performanceMonitor.markComplete();
      }
      
    } catch (error) {
      // Minimal error handling to reduce payload
      document.documentElement.setAttribute('data-kpv2-early-injection', 'failed');
      if (typeof console !== 'undefined') {
        console.error('[EarlyInjection] Error:', error);
      }
    }
  }

  /**
   * Inject critical CSS for immediate visual feedback - Optimized
   */
  injectCriticalStyles() {
    try {
      injectCriticalStyles();
    } catch (error) {
      // Minimal error handling
      if (typeof console !== 'undefined') {
        console.error('[EarlyInjection] Style injection failed:', error);
      }
    }
  }

  /**
   * Create basic DOM elements for HUD and cursor - Optimized
   */
  createPlaceholderElements() {
    try {
      this.hudPlaceholder = createEarlyHUDPlaceholder();
      this.cursorPlaceholder = this.createEarlyCursorPlaceholder();
    } catch (error) {
      // Minimal error handling
      if (typeof console !== 'undefined') {
        console.error('[EarlyInjection] Element creation failed:', error);
      }
    }
  }

  /**
   * Create early cursor placeholder element - Optimized for speed
   */
  createEarlyCursorPlaceholder() {
    const existing = document.getElementById('kpv2-cursor');
    if (existing) return existing;

    try {
      const cursor = document.createElement('div');
      cursor.id = 'kpv2-cursor';
      cursor.setAttribute('data-early-injection', 'true');
      cursor.innerHTML = createMinimalCursorSVG('none');
      
      // Optimized DOM insertion
      const target = document.body || document.documentElement;
      if (target) {
        target.appendChild(cursor);
      } else {
        // Minimal fallback
        const observer = new MutationObserver((_, obs) => {
          const newTarget = document.body || document.documentElement;
          if (newTarget) {
            newTarget.appendChild(cursor);
            obs.disconnect();
          }
        });
        observer.observe(document, { childList: true });
      }
      
      return cursor;
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[EarlyInjection] Cursor creation failed:', error);
      }
      return null;
    }
  }

  /**
   * Initialize state asynchronously to avoid blocking visual feedback
   */
  async initializeStateAsync() {
    try {
      // Initialize state bridge
      await this.stateBridge.initialize();
      
      // Restore visual state
      await this.restoreVisualState();
      if (this.performanceMonitor) this.performanceMonitor.markStateRestoration();
      
      // Set up listeners
      this.setupStateListener();
      this.setupNavigationPersistence();
    } catch (error) {
      if (typeof console !== 'undefined') {
        console.error('[EarlyInjection] Async state init failed:', error);
      }
    }
  }

  /**
   * Restore visual state from storage via state bridge - Optimized
   */
  async restoreVisualState() {
    if (!this.hudPlaceholder) return;
    
    try {
      const earlyState = this.stateBridge.getEarlyState();
      
      // Optimized state updates using batch DOM operations
      const updates = [];
      
      if (!earlyState.hudVisible) {
        updates.push(() => this.hudPlaceholder.classList.add('kpv2-hidden'));
      }
      
      if (earlyState.hudExpanded) {
        updates.push(() => this.hudPlaceholder.classList.add('kpv2-hud-expanded'));
      }
      
      // Update mode display
      const modeText = this.hudPlaceholder.querySelector('.kpv2-hud-mode-text');
      if (modeText && earlyState.cursorMode) {
        const modes = { 'none': 'Normal Mode', 'delete': 'Delete Mode', 'text_focus': 'Text Focus Mode' };
        const modeDisplay = modes[earlyState.cursorMode] || 'Normal Mode';
        updates.push(() => modeText.textContent = modeDisplay);
      }
      
      // Apply all updates in one batch
      updates.forEach(update => update());
      
    } catch (error) {
      // Fallback with minimal error handling
      try {
        await updateHUDPlaceholderState();
      } catch (fallbackError) {
        // Silent fallback - continue with defaults
      }
    }
  }

  /**
   * Set up communication with service worker for state updates
   */
  setupStateListener() {
    try {
      // Set up state bridge event listeners
      this.stateBridge.on('extensionToggle', (data) => {
        this.handleExtensionToggle(data.enabled);
      });
      
      this.stateBridge.on('hudStateSync', (data) => {
        this.handleHUDStateSync(data.hudState);
      });
      
      this.stateBridge.on('stateChange', (data) => {
        this.handleStateChange(data.newState, data.prevState);
      });
      
      this.stateBridge.on('navigationStateUpdate', (data) => {
        this.handleNavigationStateUpdate(data.navigationState, data.updatedState);
      });
      
      this.stateBridge.on('navigationConflictResolved', (data) => {
        this.handleNavigationConflictResolved(data.resolvedState, data.incomingState);
      });
      
      // Listen for messages from service worker about state changes
      if (chrome && chrome.runtime && chrome.runtime.onMessage) {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
          if (message.type === 'KP_EARLY_STATE_UPDATE') {
            this.handleEarlyStateUpdate(message);
            sendResponse({ success: true });
            return true;
          }
        });
        
        console.log('[EarlyInjection] State listener set up with state bridge');
      }
    } catch (error) {
      console.error('[EarlyInjection] Failed to set up state listener:', error);
      // Continue without state listener - main script will handle state
    }
  }

  /**
   * Handle early state updates from service worker
   */
  handleEarlyStateUpdate(message) {
    try {
      if (message.hudVisible !== undefined && this.hudPlaceholder) {
        if (message.hudVisible) {
          this.hudPlaceholder.classList.remove('kpv2-hidden');
        } else {
          this.hudPlaceholder.classList.add('kpv2-hidden');
        }
      }
      
      if (message.mode && this.hudPlaceholder) {
        const modeText = this.hudPlaceholder.querySelector('.kpv2-hud-mode-text');
        if (modeText) {
          const modeDisplayMap = {
            'none': 'Normal Mode',
            'delete': 'Delete Mode',
            'text_focus': 'Text Focus Mode'
          };
          modeText.textContent = modeDisplayMap[message.mode] || 'Normal Mode';
        }
      }
      
      console.log('[EarlyInjection] State updated:', message);
    } catch (error) {
      console.error('[EarlyInjection] Failed to handle state update:', error);
    }
  }

  /**
   * Handle extension toggle from state bridge
   */
  handleExtensionToggle(enabled) {
    try {
      if (this.hudPlaceholder) {
        if (enabled) {
          this.hudPlaceholder.classList.remove('kpv2-disabled');
        } else {
          this.hudPlaceholder.classList.add('kpv2-disabled');
        }
      }
      
      if (this.cursorPlaceholder) {
        if (enabled) {
          this.cursorPlaceholder.style.display = 'block';
        } else {
          this.cursorPlaceholder.style.display = 'none';
        }
      }
      
      console.log('[EarlyInjection] Extension toggle handled:', enabled);
    } catch (error) {
      console.error('[EarlyInjection] Failed to handle extension toggle:', error);
    }
  }

  /**
   * Handle HUD state sync from state bridge
   */
  handleHUDStateSync(hudState) {
    try {
      if (this.hudPlaceholder) {
        // Update visibility
        if (hudState.visible) {
          this.hudPlaceholder.classList.remove('kpv2-hidden');
        } else {
          this.hudPlaceholder.classList.add('kpv2-hidden');
        }
        
        // Update expansion state
        if (hudState.expanded) {
          this.hudPlaceholder.classList.add('kpv2-hud-expanded');
        } else {
          this.hudPlaceholder.classList.remove('kpv2-hud-expanded');
        }
        
        // Update active tab if needed
        const tabButtons = this.hudPlaceholder.querySelectorAll('.kpv2-hud-tab-button');
        tabButtons.forEach(button => {
          if (button.dataset.tab === hudState.activeTab) {
            button.classList.add('active');
          } else {
            button.classList.remove('active');
          }
        });
      }
      
      console.log('[EarlyInjection] HUD state sync handled:', hudState);
    } catch (error) {
      console.error('[EarlyInjection] Failed to handle HUD state sync:', error);
    }
  }

  /**
   * Handle general state changes from state bridge
   */
  handleStateChange(newState, prevState) {
    try {
      // Update visual elements based on state changes
      if (newState.extensionEnabled !== prevState.extensionEnabled) {
        this.handleExtensionToggle(newState.extensionEnabled);
      }
      
      if (newState.hudVisible !== prevState.hudVisible || 
          newState.hudExpanded !== prevState.hudExpanded ||
          newState.hudActiveTab !== prevState.hudActiveTab) {
        this.handleHUDStateSync({
          visible: newState.hudVisible,
          expanded: newState.hudExpanded,
          activeTab: newState.hudActiveTab
        });
      }
      
      console.log('[EarlyInjection] State change handled:', { newState, prevState });
    } catch (error) {
      console.error('[EarlyInjection] Failed to handle state change:', error);
    }
  }

  /**
   * Check if early injection is complete
   */
  isComplete() {
    return this.injectionComplete;
  }

  /**
   * Get placeholder elements for main script enhancement
   */
  getPlaceholders() {
    return {
      hud: this.hudPlaceholder,
      cursor: this.cursorPlaceholder
    };
  }

  /**
   * Get state bridge for main script integration
   */
  getStateBridge() {
    return this.stateBridge;
  }

  /**
   * Get current early state
   */
  getEarlyState() {
    return this.stateBridge ? this.stateBridge.getEarlyState() : null;
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics() {
    return this.performanceMonitor ? this.performanceMonitor.getMetrics() : null;
  }

  /**
   * Handle navigation state updates from other tabs
   */
  handleNavigationStateUpdate(navigationState, updatedState) {
    try {
      // Update visual elements based on navigation state
      this.handleStateChange(updatedState, this.stateBridge.getEarlyState());
      
      console.log('[EarlyInjection] Navigation state update handled:', navigationState);
    } catch (error) {
      console.error('[EarlyInjection] Failed to handle navigation state update:', error);
    }
  }

  /**
   * Handle navigation conflict resolution
   */
  handleNavigationConflictResolved(resolvedState, incomingState) {
    try {
      // Update visual elements with resolved state
      if (this.hudPlaceholder) {
        // Update HUD visibility
        if (resolvedState.hudVisible) {
          this.hudPlaceholder.classList.remove('kpv2-hidden');
        } else {
          this.hudPlaceholder.classList.add('kpv2-hidden');
        }
        
        // Update HUD expansion
        if (resolvedState.hudExpanded) {
          this.hudPlaceholder.classList.add('kpv2-hud-expanded');
        } else {
          this.hudPlaceholder.classList.remove('kpv2-hud-expanded');
        }
        
        // Update extension state
        if (resolvedState.extensionEnabled) {
          this.hudPlaceholder.classList.remove('kpv2-disabled');
        } else {
          this.hudPlaceholder.classList.add('kpv2-disabled');
        }
      }
      
      if (this.cursorPlaceholder) {
        // Update cursor visibility based on extension state
        if (resolvedState.extensionEnabled) {
          this.cursorPlaceholder.style.display = 'block';
        } else {
          this.cursorPlaceholder.style.display = 'none';
        }
      }
      
      console.log('[EarlyInjection] Navigation conflict resolved:', resolvedState);
    } catch (error) {
      console.error('[EarlyInjection] Failed to handle navigation conflict resolution:', error);
    }
  }

  /**
   * Set up navigation state persistence
   * Ensures state is saved before page unload
   */
  setupNavigationPersistence() {
    try {
      // Save state before page unload
      window.addEventListener('beforeunload', () => {
        if (this.stateBridge) {
          this.stateBridge.ensureStatePersistence().catch(error => {
            console.error('[EarlyInjection] Failed to ensure state persistence:', error);
          });
        }
      });
      
      // Handle page visibility changes (tab switching, etc.)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden && this.stateBridge) {
          this.stateBridge.syncNavigationState().catch(error => {
            console.error('[EarlyInjection] Failed to sync navigation state on visibility change:', error);
          });
        }
      });
      
      console.log('[EarlyInjection] Navigation persistence set up');
    } catch (error) {
      console.error('[EarlyInjection] Failed to set up navigation persistence:', error);
    }
  }
}

/**
 * Performance monitoring utilities for early injection
 */
class EarlyInjectionPerformanceMonitor {
  constructor() {
    this.metrics = {
      startTime: performance.now(),
      styleInjectionTime: null,
      elementCreationTime: null,
      stateRestorationTime: null,
      totalTime: null,
      memoryUsage: null
    };
    
    this.enabled = typeof console !== 'undefined' && performance && performance.mark;
  }

  markStyleInjection() {
    if (this.enabled) {
      this.metrics.styleInjectionTime = performance.now() - this.metrics.startTime;
      performance.mark('kpv2-early-styles-injected');
    }
  }

  markElementCreation() {
    if (this.enabled) {
      this.metrics.elementCreationTime = performance.now() - this.metrics.startTime;
      performance.mark('kpv2-early-elements-created');
    }
  }

  markStateRestoration() {
    if (this.enabled) {
      this.metrics.stateRestorationTime = performance.now() - this.metrics.startTime;
      performance.mark('kpv2-early-state-restored');
    }
  }

  markComplete() {
    if (this.enabled) {
      this.metrics.totalTime = performance.now() - this.metrics.startTime;
      performance.mark('kpv2-early-injection-complete');
      
      // Measure memory usage if available
      if (performance.memory) {
        this.metrics.memoryUsage = {
          used: performance.memory.usedJSHeapSize,
          total: performance.memory.totalJSHeapSize,
          limit: performance.memory.jsHeapSizeLimit
        };
      }
      
      this.reportMetrics();
    }
  }

  reportMetrics() {
    const { totalTime, styleInjectionTime, elementCreationTime, stateRestorationTime, memoryUsage } = this.metrics;
    
    // Only report if performance is concerning or in development
    const shouldReport = totalTime > 5 || styleInjectionTime > 2 || elementCreationTime > 2;
    
    if (shouldReport || (typeof location !== 'undefined' && location.hostname === 'localhost')) {
      console.group('[EarlyInjection] Performance Report');
      console.log(`Total time: ${totalTime?.toFixed(2)}ms`);
      console.log(`Style injection: ${styleInjectionTime?.toFixed(2)}ms`);
      console.log(`Element creation: ${elementCreationTime?.toFixed(2)}ms`);
      console.log(`State restoration: ${stateRestorationTime?.toFixed(2)}ms`);
      
      if (memoryUsage) {
        console.log(`Memory usage: ${(memoryUsage.used / 1024 / 1024).toFixed(2)}MB`);
      }
      
      // Performance warnings
      if (totalTime > 10) {
        console.warn('Early injection took longer than 10ms - consider optimization');
      }
      if (styleInjectionTime > 5) {
        console.warn('Style injection took longer than 5ms - CSS may be too large');
      }
      
      console.groupEnd();
    }
    
    // Store metrics for potential use by main script
    if (typeof window !== 'undefined') {
      window.kpv2EarlyInjectionMetrics = this.metrics;
    }
  }

  getMetrics() {
    return { ...this.metrics };
  }
}

// Initialize early injection immediately if we're in the right context
if (typeof window !== 'undefined' && window.document) {
  // Only run if we're in a browser context and not already initialized
  if (!window.kpv2EarlyInjector) {
    const performanceMonitor = new EarlyInjectionPerformanceMonitor();
    window.kpv2EarlyInjector = new EarlyInjector();
    window.kpv2EarlyInjector.performanceMonitor = performanceMonitor;
    
    // Start initialization immediately
    window.kpv2EarlyInjector.initialize().catch(error => {
      if (typeof console !== 'undefined') {
        console.error('[EarlyInjection] Failed to initialize:', error);
      }
    });
  }
}

// Export for potential use by main script
export { EarlyInjector, EarlyInjectionPerformanceMonitor };