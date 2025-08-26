/**
 * KeyPilot Chrome Extension - Early Injection Bundle
 * Generated on 2025-08-26T00:18:27.807Z
 * Optimized for minimal payload and fast execution
 */

(() => {
  // Global scope for early injection modules


  // Early Injection Module: src/early-injection-styles.js
/**
 * Critical styles for early injection
 * Contains minimal CSS needed for immediate HUD and cursor visibility
 */

/**
 * Get critical CSS for cursor element - Optimized for minimal size
 * This includes only the essential positioning and visibility styles
 */
function getCriticalCursorCSS() {
  return `#kpv2-cursor{position:fixed!important;left:var(--cursor-x,0)!important;top:var(--cursor-y,0)!important;transform:translate(-50%,-50%)!important;z-index:2147483647!important;pointer-events:none!important;display:block!important;visibility:visible!important;will-change:transform,left,top!important}html.kpv2-cursor-hidden,html.kpv2-cursor-hidden *{cursor:none!important}`;
}

/**
 * Get critical CSS for HUD element - Optimized for minimal size
 * This includes only the essential positioning and basic styling
 */
function getCriticalHUDCSS() {
  return `.kpv2-hud{position:fixed;bottom:20px;left:20px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;font-size:12px;background:rgba(0,0,0,.9);border:1px solid rgba(255,255,255,.2);border-radius:8px;backdrop-filter:blur(10px);box-shadow:0 4px 20px rgba(0,0,0,.3);min-width:200px;max-width:300px;pointer-events:auto;display:block;visibility:visible}.kpv2-hud-status-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.1)}.kpv2-hud-mode-indicator{flex:1}.kpv2-hud-mode-text{color:#fff;font-weight:500;font-size:12px}.kpv2-hud-controls{display:flex;align-items:center;gap:8px}.kpv2-hud-expand-btn{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:4px;border-radius:4px;transition:color .2s ease,background-color .2s ease;margin-left:8px}.kpv2-hud-expand-icon{display:inline-block;font-size:10px;transition:transform .2s ease}.kpv2-hud-instructions{border-top:1px solid rgba(255,255,255,.1);display:none}.kpv2-hud.kpv2-hidden{display:none!important}`;
}

/**
 * Get combined critical CSS for early injection
 * This is the minimal CSS needed for immediate visual feedback
 */
function getCriticalCSS() {
  return getCriticalCursorCSS() + '\n' + getCriticalHUDCSS();
}

/**
 * Optimized style injection method for early injection - Minimal payload
 * Uses the most efficient DOM manipulation for document_start timing
 */
function injectCriticalStyles() {
  if (document.getElementById('kpv2-early-styles')) return;

  try {
    const style = document.createElement('style');
    style.id = 'kpv2-early-styles';
    style.textContent = getCriticalCSS();
    
    // Optimized DOM insertion
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    } else {
      // Minimal fallback
      const observer = new MutationObserver((_, obs) => {
        const newTarget = document.head || document.documentElement;
        if (newTarget) {
          newTarget.appendChild(style);
          obs.disconnect();
        }
      });
      observer.observe(document, { childList: true });
    }
    
    // Hide default cursor immediately
    if (document.documentElement) {
      document.documentElement.classList.add('kpv2-cursor-hidden');
    }
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.error('[EarlyInjection] Style injection failed:', error);
    }
  }
}

/**
 * Create minimal cursor SVG for early injection - Optimized for size
 * Returns a lightweight SVG string for immediate cursor display
 */
function createMinimalCursorSVG(mode = 'none') {
  const NS = 'http://www.w3.org/2000/svg';
  
  if (mode === 'text_focus') {
    return `<svg xmlns="${NS}" viewBox="0 0 94 94" width="94" height="94"><line x1="47" y1="10" x2="47" y2="34" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/><line x1="47" y1="60" x2="47" y2="84" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/><line x1="10" y1="47" x2="34" y2="47" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/><line x1="60" y1="47" x2="84" y2="47" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/></svg>`;
  } else if (mode === 'delete') {
    return `<svg xmlns="${NS}" viewBox="0 0 94 94" width="94" height="94"><line x1="18" y1="18" x2="76" y2="76" stroke="rgba(220,0,0,0.95)" stroke-width="5" stroke-linecap="round"/><line x1="76" y1="18" x2="18" y2="76" stroke="rgba(220,0,0,0.95)" stroke-width="5" stroke-linecap="round"/></svg>`;
  } else {
    return `<svg xmlns="${NS}" viewBox="0 0 94 94" width="94" height="94"><line x1="47" y1="10" x2="47" y2="34" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/><line x1="47" y1="60" x2="47" y2="84" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/><line x1="10" y1="47" x2="34" y2="47" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/><line x1="60" y1="47" x2="84" y2="47" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
}

/**
 * Create minimal HUD HTML structure for early injection - Optimized for size
 * Returns a lightweight HTML string for immediate HUD display
 */
function createMinimalHUDHTML() {
  return `<div class="kpv2-hud-status-bar"><div class="kpv2-hud-mode-indicator"><span class="kpv2-hud-mode-text">Normal Mode</span></div><div class="kpv2-hud-controls"></div><button class="kpv2-hud-expand-btn" aria-label="Expand HUD"><span class="kpv2-hud-expand-icon">▲</span></button></div><div class="kpv2-hud-instructions"></div>`;
}

/**
 * Create early HUD placeholder element - Optimized for speed
 * Creates a basic HUD DOM structure with minimal styling for immediate visibility
 */
function createEarlyHUDPlaceholder() {
  const existing = document.getElementById('kpv2-hud');
  if (existing) return existing;

  try {
    const hud = document.createElement('div');
    hud.id = 'kpv2-hud';
    hud.className = 'kpv2-hud';
    hud.setAttribute('data-early-injection', 'true');
    hud.innerHTML = createMinimalHUDHTML();
    
    // Optimized DOM insertion
    const target = document.body || document.documentElement;
    if (target) {
      target.appendChild(hud);
    } else {
      // Minimal fallback
      const observer = new MutationObserver((_, obs) => {
        const newTarget = document.body || document.documentElement;
        if (newTarget) {
          newTarget.appendChild(hud);
          obs.disconnect();
        }
      });
      observer.observe(document, { childList: true });
    }
    
    return hud;
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.error('[EarlyInjection] HUD creation failed:', error);
    }
    return null;
  }
}

/**
 * Update HUD placeholder with current state
 * Restores HUD visibility and mode from storage for immediate display
 */
async function updateHUDPlaceholderState() {
  const hudElement = document.getElementById('kpv2-hud');
  if (!hudElement) {
    console.warn('[EarlyInjection] No HUD placeholder found to update');
    return;
  }

  try {
    // Load HUD state from storage
    const hudState = await loadEarlyHUDState();
    
    // Update visibility
    if (!hudState.visible) {
      hudElement.classList.add('kpv2-hidden');
    } else {
      hudElement.classList.remove('kpv2-hidden');
    }
    
    // Update mode display if we can determine it
    const modeText = hudElement.querySelector('.kpv2-hud-mode-text');
    if (modeText && hudState.mode) {
      const modeDisplayMap = {
        'none': 'Normal Mode',
        'delete': 'Delete Mode',
        'text_focus': 'Text Focus Mode'
      };
      modeText.textContent = modeDisplayMap[hudState.mode] || 'Normal Mode';
    }
    
    console.log('[EarlyInjection] HUD placeholder state updated:', hudState);
  } catch (error) {
    console.error('[EarlyInjection] Failed to update HUD placeholder state:', error);
    // Continue with default visible state
  }
}

/**
 * Load early HUD state from storage
 * Simplified version for early injection with minimal dependencies
 */
async function loadEarlyHUDState() {
  const defaultState = {
    visible: true,
    expanded: false,
    mode: 'none'
  };

  try {
    // Storage keys matching HUDManager
    const storageKeys = {
      HUD_VISIBLE: 'keypilot_hud_visible',
      HUD_EXPANDED: 'keypilot_hud_expanded'
    };

    let storageResult = {};

    try {
      // Try chrome.storage.sync first
      storageResult = await chrome.storage.sync.get([
        storageKeys.HUD_VISIBLE,
        storageKeys.HUD_EXPANDED
      ]);
      
      // Check if we got any HUD data from sync storage
      if (storageResult[storageKeys.HUD_VISIBLE] === undefined) {
        throw new Error('No HUD data in sync storage');
      }
    } catch (syncError) {
      // Fallback to chrome.storage.local
      try {
        storageResult = await chrome.storage.local.get([
          storageKeys.HUD_VISIBLE,
          storageKeys.HUD_EXPANDED
        ]);
      } catch (localError) {
        console.warn('[EarlyInjection] Failed to load HUD state from storage:', localError);
        return defaultState;
      }
    }

    // Build state object with fallbacks to defaults
    const loadedState = {
      visible: storageResult[storageKeys.HUD_VISIBLE] !== undefined 
        ? storageResult[storageKeys.HUD_VISIBLE] 
        : defaultState.visible,
      expanded: storageResult[storageKeys.HUD_EXPANDED] !== undefined 
        ? storageResult[storageKeys.HUD_EXPANDED] 
        : defaultState.expanded,
      mode: defaultState.mode // Mode will be determined by main script
    };

    return loadedState;
  } catch (error) {
    console.warn('[EarlyInjection] Error loading early HUD state, using defaults:', error);
    return defaultState;
  }
}


  // Early Injection Module: src/modules/state-bridge.js
/**
 * State Bridge for Early Injection
 * Manages state synchronization between early injection and full initialization phases
 * Handles storage operations and service worker communication for early injection
 */

// Minimal event emitter for early injection (when EventManager is not available)
class MinimalEventEmitter {
  constructor() {
    this.listeners = new Map();
  }
  
  emit(event, data) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(listener => {
        try {
          listener(data);
        } catch (error) {
          console.error(`[MinimalEventEmitter] Error in ${event} listener:`, error);
        }
      });
    }
  }
  
  on(event, listener) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(listener);
  }
  
  removeAllListeners() {
    this.listeners.clear();
  }
}

class StateBridge extends (typeof EventManager !== 'undefined' ? EventManager : MinimalEventEmitter) {
  constructor() {
    super();
    
    // Storage keys for early injection state
    this.STORAGE_KEYS = {
      EXTENSION_ENABLED: 'keypilot_enabled',
      HUD_VISIBLE: 'keypilot_hud_visible',
      HUD_EXPANDED: 'keypilot_hud_expanded',
      HUD_ACTIVE_TAB: 'keypilot_hud_active_tab',
      CURSOR_MODE: 'keypilot_cursor_mode',
      EARLY_STATE_TIMESTAMP: 'keypilot_early_state_timestamp'
    };
    
    // Default state values
    this.DEFAULT_STATE = {
      extensionEnabled: true,
      hudVisible: true,
      hudExpanded: false,
      hudActiveTab: 'basic',
      cursorMode: 'none',
      timestamp: Date.now()
    };
    
    // Current early state cache
    this.earlyState = { ...this.DEFAULT_STATE };
    
    // Service worker communication status
    this.serviceWorkerAvailable = false;
    
    // State synchronization status
    this.syncInProgress = false;
    
    console.log('[StateBridge] Initialized with default state:', this.earlyState);
  }

  /**
   * Initialize the state bridge
   * Sets up service worker communication and loads initial state
   */
  async initialize() {
    try {
      // Test service worker availability
      await this.testServiceWorkerConnection();
      
      // Load initial state from storage
      await this.loadEarlyState();
      
      // Set up message listener for state updates
      this.setupMessageListener();
      
      console.log('[StateBridge] Initialized successfully');
      return true;
    } catch (error) {
      console.error('[StateBridge] Failed to initialize:', error);
      // Continue with cached state even if initialization fails
      return false;
    }
  }

  /**
   * Test service worker connection
   */
  async testServiceWorkerConnection() {
    try {
      if (!chrome?.runtime?.sendMessage) {
        throw new Error('Chrome runtime not available');
      }
      
      // Test with a simple ping message
      const response = await chrome.runtime.sendMessage({ 
        type: 'KP_GET_STATE',
        source: 'early-injection'
      });
      
      if (response && typeof response.enabled === 'boolean') {
        this.serviceWorkerAvailable = true;
        console.log('[StateBridge] Service worker connection established');
        return true;
      } else {
        throw new Error('Invalid response from service worker');
      }
    } catch (error) {
      console.warn('[StateBridge] Service worker unavailable:', error.message);
      this.serviceWorkerAvailable = false;
      return false;
    }
  }

  /**
   * Load early state from storage
   * Tries service worker first, then direct storage access
   */
  async loadEarlyState() {
    try {
      let loadedState = null;
      
      // Try service worker first if available
      if (this.serviceWorkerAvailable) {
        loadedState = await this.loadStateFromServiceWorker();
      }
      
      // Fallback to direct storage access
      if (!loadedState) {
        loadedState = await this.loadStateFromStorage();
      }
      
      // Merge loaded state with defaults
      if (loadedState) {
        this.earlyState = {
          ...this.DEFAULT_STATE,
          ...loadedState,
          timestamp: Date.now()
        };
        console.log('[StateBridge] State loaded:', this.earlyState);
      } else {
        console.log('[StateBridge] Using default state');
      }
      
      return this.earlyState;
    } catch (error) {
      console.error('[StateBridge] Failed to load early state:', error);
      // Return default state on failure
      return this.earlyState;
    }
  }

  /**
   * Load state from service worker
   */
  async loadStateFromServiceWorker() {
    try {
      // Get extension enabled state
      const extensionResponse = await chrome.runtime.sendMessage({ 
        type: 'KP_GET_STATE' 
      });
      
      // Get complete HUD state
      const hudResponse = await chrome.runtime.sendMessage({ 
        type: 'KP_GET_COMPLETE_HUD_STATE' 
      });
      
      if (extensionResponse && hudResponse) {
        return {
          extensionEnabled: extensionResponse.enabled,
          hudVisible: hudResponse.hudState.visible,
          hudExpanded: hudResponse.hudState.expanded,
          hudActiveTab: hudResponse.hudState.activeTab,
          cursorMode: 'none', // Default cursor mode for early injection
          timestamp: Math.max(extensionResponse.timestamp || 0, hudResponse.timestamp || 0)
        };
      }
      
      return null;
    } catch (error) {
      console.warn('[StateBridge] Failed to load from service worker:', error);
      return null;
    }
  }

  /**
   * Load state directly from Chrome storage
   */
  async loadStateFromStorage() {
    try {
      // Try sync storage first
      let result = await this.getFromStorage('sync');
      
      // Fallback to local storage
      if (!result || Object.keys(result).length === 0) {
        result = await this.getFromStorage('local');
      }
      
      if (result && Object.keys(result).length > 0) {
        return {
          extensionEnabled: result[this.STORAGE_KEYS.EXTENSION_ENABLED] ?? this.DEFAULT_STATE.extensionEnabled,
          hudVisible: result[this.STORAGE_KEYS.HUD_VISIBLE] ?? this.DEFAULT_STATE.hudVisible,
          hudExpanded: result[this.STORAGE_KEYS.HUD_EXPANDED] ?? this.DEFAULT_STATE.hudExpanded,
          hudActiveTab: result[this.STORAGE_KEYS.HUD_ACTIVE_TAB] ?? this.DEFAULT_STATE.hudActiveTab,
          cursorMode: result[this.STORAGE_KEYS.CURSOR_MODE] ?? this.DEFAULT_STATE.cursorMode,
          timestamp: result[this.STORAGE_KEYS.EARLY_STATE_TIMESTAMP] ?? Date.now()
        };
      }
      
      return null;
    } catch (error) {
      console.warn('[StateBridge] Failed to load from storage:', error);
      return null;
    }
  }

  /**
   * Get data from Chrome storage
   */
  async getFromStorage(storageType) {
    try {
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const keys = Object.values(this.STORAGE_KEYS);
      
      return await storage.get(keys);
    } catch (error) {
      console.warn(`[StateBridge] Failed to access ${storageType} storage:`, error);
      return {};
    }
  }

  /**
   * Save early state to storage
   */
  async saveEarlyState(state = null) {
    if (this.syncInProgress) {
      console.log('[StateBridge] Sync already in progress, skipping save');
      return false;
    }
    
    try {
      this.syncInProgress = true;
      
      const stateToSave = state || this.earlyState;
      stateToSave.timestamp = Date.now();
      
      // Update local cache
      this.earlyState = { ...stateToSave };
      
      // Try service worker first if available
      if (this.serviceWorkerAvailable) {
        const saved = await this.saveStateViaServiceWorker(stateToSave);
        if (saved) {
          console.log('[StateBridge] State saved via service worker');
          return true;
        }
      }
      
      // Fallback to direct storage
      const saved = await this.saveStateToStorage(stateToSave);
      if (saved) {
        console.log('[StateBridge] State saved to storage');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to save early state:', error);
      return false;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Save state via service worker
   */
  async saveStateViaServiceWorker(state) {
    try {
      // Save extension enabled state
      const extensionResponse = await chrome.runtime.sendMessage({
        type: 'KP_SET_STATE',
        enabled: state.extensionEnabled
      });
      
      // Save complete HUD state
      const hudResponse = await chrome.runtime.sendMessage({
        type: 'KP_SET_COMPLETE_HUD_STATE',
        hudState: {
          visible: state.hudVisible,
          expanded: state.hudExpanded,
          activeTab: state.hudActiveTab
        }
      });
      
      return extensionResponse?.enabled === state.extensionEnabled && 
             hudResponse?.hudState?.visible === state.hudVisible;
    } catch (error) {
      console.warn('[StateBridge] Failed to save via service worker:', error);
      return false;
    }
  }

  /**
   * Save state directly to Chrome storage
   */
  async saveStateToStorage(state) {
    const stateData = {
      [this.STORAGE_KEYS.EXTENSION_ENABLED]: state.extensionEnabled,
      [this.STORAGE_KEYS.HUD_VISIBLE]: state.hudVisible,
      [this.STORAGE_KEYS.HUD_EXPANDED]: state.hudExpanded,
      [this.STORAGE_KEYS.HUD_ACTIVE_TAB]: state.hudActiveTab,
      [this.STORAGE_KEYS.CURSOR_MODE]: state.cursorMode,
      [this.STORAGE_KEYS.EARLY_STATE_TIMESTAMP]: state.timestamp
    };
    
    try {
      // Try sync storage first
      await chrome.storage.sync.set(stateData);
      return true;
    } catch (syncError) {
      console.warn('[StateBridge] Sync storage failed, trying local:', syncError);
      
      try {
        // Fallback to local storage
        await chrome.storage.local.set(stateData);
        return true;
      } catch (localError) {
        console.error('[StateBridge] Both storage methods failed:', localError);
        return false;
      }
    }
  }

  /**
   * Set up message listener for state synchronization
   */
  setupMessageListener() {
    try {
      if (!chrome?.runtime?.onMessage) {
        console.warn('[StateBridge] Chrome runtime messaging not available');
        return;
      }
      
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        // Handle state synchronization messages
        if (message.type === 'KP_TOGGLE_STATE') {
          this.handleExtensionToggle(message.enabled);
          sendResponse({ success: true });
          return true;
        }
        
        if (message.type === 'KP_HUD_STATE_SYNC') {
          this.handleHUDStateSync(message.hudState);
          sendResponse({ success: true });
          return true;
        }
        
        if (message.type === 'KP_CURSOR_MODE_UPDATE') {
          this.handleCursorModeUpdate(message.mode);
          sendResponse({ success: true });
          return true;
        }
        
        if (message.type === 'KP_EARLY_STATE_REQUEST') {
          sendResponse({ 
            success: true, 
            state: this.earlyState 
          });
          return true;
        }
        
        if (message.type === 'KP_NAVIGATION_STATE_UPDATE') {
          this.handleNavigationStateUpdate(message.navigationState);
          sendResponse({ success: true });
          return true;
        }
      });
      
      console.log('[StateBridge] Message listener set up');
    } catch (error) {
      console.error('[StateBridge] Failed to set up message listener:', error);
    }
  }

  /**
   * Handle extension toggle from service worker
   */
  handleExtensionToggle(enabled) {
    try {
      this.earlyState.extensionEnabled = enabled;
      this.earlyState.timestamp = Date.now();
      
      // Emit event for early injection components
      this.emit('extensionToggle', { enabled });
      
      console.log('[StateBridge] Extension toggle handled:', enabled);
    } catch (error) {
      console.error('[StateBridge] Failed to handle extension toggle:', error);
    }
  }

  /**
   * Handle cursor mode updates for persistence
   */
  handleCursorModeUpdate(mode) {
    try {
      this.earlyState.cursorMode = mode;
      this.earlyState.timestamp = Date.now();
      
      // Save to storage for navigation persistence
      this.saveEarlyState().catch(error => {
        console.warn('[StateBridge] Failed to save cursor mode:', error);
      });
      
      // Emit event for components
      this.emit('cursorModeUpdate', { mode });
      
      console.log('[StateBridge] Cursor mode updated:', mode);
    } catch (error) {
      console.error('[StateBridge] Failed to handle cursor mode update:', error);
    }
  }

  /**
   * Handle HUD state synchronization from service worker
   */
  handleHUDStateSync(hudState) {
    try {
      this.earlyState.hudVisible = hudState.visible;
      this.earlyState.hudExpanded = hudState.expanded;
      this.earlyState.hudActiveTab = hudState.activeTab;
      this.earlyState.timestamp = Date.now();
      
      // Emit event for early injection components
      this.emit('hudStateSync', { hudState });
      
      console.log('[StateBridge] HUD state sync handled:', hudState);
    } catch (error) {
      console.error('[StateBridge] Failed to handle HUD state sync:', error);
    }
  }

  /**
   * Get current early state
   */
  getEarlyState() {
    return { ...this.earlyState };
  }

  /**
   * Update early state
   */
  updateEarlyState(updates) {
    try {
      const prevState = { ...this.earlyState };
      this.earlyState = {
        ...this.earlyState,
        ...updates,
        timestamp: Date.now()
      };
      
      // Emit state change event
      this.emit('stateChange', {
        prevState,
        newState: this.earlyState,
        updates
      });
      
      console.log('[StateBridge] Early state updated:', updates);
      return true;
    } catch (error) {
      console.error('[StateBridge] Failed to update early state:', error);
      return false;
    }
  }

  /**
   * Alias for updateEarlyState for compatibility with main script
   */
  updateState(updates) {
    return this.updateEarlyState(updates);
  }

  /**
   * Sync with service worker
   * Forces a fresh state load from service worker
   */
  async syncWithServiceWorker() {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker not available for sync');
        return false;
      }
      
      const freshState = await this.loadStateFromServiceWorker();
      if (freshState) {
        this.earlyState = {
          ...this.DEFAULT_STATE,
          ...freshState,
          timestamp: Date.now()
        };
        
        // Emit sync event
        this.emit('serviceWorkerSync', { state: this.earlyState });
        
        console.log('[StateBridge] Synced with service worker:', this.earlyState);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to sync with service worker:', error);
      return false;
    }
  }

  /**
   * Handle state transition from early injection to full initialization
   * Returns state for main script to use
   */
  handleStateTransition() {
    try {
      const transitionState = {
        ...this.earlyState,
        transitionTimestamp: Date.now(),
        source: 'early-injection'
      };
      
      // Emit transition event
      this.emit('stateTransition', { state: transitionState });
      
      console.log('[StateBridge] State transition handled:', transitionState);
      return transitionState;
    } catch (error) {
      console.error('[StateBridge] Failed to handle state transition:', error);
      return this.earlyState;
    }
  }

  /**
   * Create fallback state management
   * Used when service worker is unavailable
   */
  createFallbackState() {
    try {
      const fallbackState = {
        ...this.DEFAULT_STATE,
        timestamp: Date.now(),
        fallback: true
      };
      
      this.earlyState = fallbackState;
      
      console.log('[StateBridge] Fallback state created:', fallbackState);
      return fallbackState;
    } catch (error) {
      console.error('[StateBridge] Failed to create fallback state:', error);
      return this.DEFAULT_STATE;
    }
  }

  /**
   * Check if service worker is available
   */
  isServiceWorkerAvailable() {
    return this.serviceWorkerAvailable;
  }

  /**
   * Get state age in milliseconds
   */
  getStateAge() {
    return Date.now() - (this.earlyState.timestamp || 0);
  }

  /**
   * Check if state is stale (older than 5 seconds)
   */
  isStateStale() {
    return this.getStateAge() > 5000;
  }

  /**
   * Handle navigation state updates from other tabs
   */
  handleNavigationStateUpdate(navigationState) {
    try {
      // Check if this is a more recent state
      if (navigationState.navigationTimestamp > (this.earlyState.timestamp || 0)) {
        // Update early state with navigation state
        this.earlyState = {
          ...this.earlyState,
          extensionEnabled: navigationState.extensionEnabled,
          hudVisible: navigationState.hudVisible,
          hudExpanded: navigationState.hudExpanded,
          hudActiveTab: navigationState.hudActiveTab,
          cursorMode: navigationState.cursorMode,
          timestamp: navigationState.navigationTimestamp
        };
        
        // Emit navigation state update event
        this.emit('navigationStateUpdate', { 
          navigationState,
          updatedState: this.earlyState 
        });
        
        console.log('[StateBridge] Navigation state update handled:', navigationState);
      } else {
        console.log('[StateBridge] Ignoring older navigation state update');
      }
    } catch (error) {
      console.error('[StateBridge] Failed to handle navigation state update:', error);
    }
  }

  /**
   * Save state before navigation
   * @param {string} url - URL being navigated to
   */
  async savePreNavigationState(url = 'unknown') {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker unavailable for pre-navigation state save');
        return false;
      }
      
      const response = await chrome.runtime.sendMessage({
        type: 'KP_PRE_NAVIGATION_STATE',
        url: url,
        state: this.earlyState
      });
      
      if (response && response.type === 'KP_PRE_NAVIGATION_STATE_SAVED') {
        console.log('[StateBridge] Pre-navigation state saved');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to save pre-navigation state:', error);
      return false;
    }
  }

  /**
   * Sync state during navigation
   * Ensures state persists across page transitions
   */
  async syncNavigationState() {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker unavailable for navigation sync');
        return false;
      }
      
      const navigationState = {
        ...this.earlyState,
        navigationTimestamp: Date.now(),
        sourceTabId: null // Will be set by service worker
      };
      
      const response = await chrome.runtime.sendMessage({
        type: 'KP_NAVIGATION_STATE_SYNC',
        state: navigationState
      });
      
      if (response && response.success) {
        console.log('[StateBridge] Navigation state synchronized');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to sync navigation state:', error);
      return false;
    }
  }

  /**
   * Handle rapid navigation conflicts
   * @param {Object} incomingState - Incoming navigation state
   * @returns {boolean} Whether the incoming state was applied
   */
  handleNavigationConflict(incomingState) {
    try {
      const currentTimestamp = this.earlyState.timestamp || 0;
      const incomingTimestamp = incomingState.navigationTimestamp || 0;
      
      // If incoming state is newer, apply it
      if (incomingTimestamp > currentTimestamp) {
        this.earlyState = {
          ...this.earlyState,
          ...incomingState,
          timestamp: incomingTimestamp
        };
        
        this.emit('navigationConflictResolved', {
          resolvedState: this.earlyState,
          incomingState
        });
        
        console.log('[StateBridge] Navigation conflict resolved - applied incoming state');
        return true;
      }
      
      console.log('[StateBridge] Navigation conflict resolved - kept current state');
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to handle navigation conflict:', error);
      return false;
    }
  }

  /**
   * Ensure state persistence during page transitions
   * Called during beforeunload or similar events
   */
  async ensureStatePersistence() {
    try {
      // Save current state to storage
      const saved = await this.saveEarlyState();
      
      // Also sync with service worker if available
      if (this.serviceWorkerAvailable) {
        await this.syncNavigationState();
      }
      
      console.log('[StateBridge] State persistence ensured:', saved);
      return saved;
    } catch (error) {
      console.error('[StateBridge] Failed to ensure state persistence:', error);
      return false;
    }
  }

  /**
   * Save cursor position for restoration after navigation
   */
  saveCursorPosition(x, y) {
    try {
      this.earlyState.cursorPosition = { x, y };
      this.earlyState.timestamp = Date.now();
      
      // Save to storage for navigation persistence
      this.saveEarlyState().catch(error => {
        console.warn('[StateBridge] Failed to save cursor position:', error);
      });
      
      console.log('[StateBridge] Cursor position saved:', { x, y });
    } catch (error) {
      console.error('[StateBridge] Failed to save cursor position:', error);
    }
  }

  /**
   * Get saved cursor position
   */
  getSavedCursorPosition() {
    try {
      return this.earlyState.cursorPosition || null;
    } catch (error) {
      console.error('[StateBridge] Failed to get saved cursor position:', error);
      return null;
    }
  }

  /**
   * Sync cursor state across tabs
   */
  async syncCursorStateAcrossTabs(cursorState) {
    try {
      if (!this.serviceWorkerAvailable) {
        console.warn('[StateBridge] Service worker unavailable for cursor sync');
        return false;
      }
      
      const response = await chrome.runtime.sendMessage({
        type: 'KP_CURSOR_STATE_BROADCAST',
        cursorState: cursorState
      });
      
      if (response && response.success) {
        console.log('[StateBridge] Cursor state synced across tabs');
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[StateBridge] Failed to sync cursor state across tabs:', error);
      return false;
    }
  }

  /**
   * Clean up the state bridge
   */
  cleanup() {
    try {
      // Remove event listeners
      this.removeAllListeners();
      
      // Clear state cache
      this.earlyState = { ...this.DEFAULT_STATE };
      
      console.log('[StateBridge] Cleaned up');
    } catch (error) {
      console.error('[StateBridge] Error during cleanup:', error);
    }
  }
}


  // Early Injection Module: src/early-injection.js
/**
 * Early injection script for KeyPilot - Optimized for minimal payload
 * Runs at document_start to provide immediate visual feedback
 * Creates placeholder elements for HUD and cursor before full initialization
 */

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



})();
