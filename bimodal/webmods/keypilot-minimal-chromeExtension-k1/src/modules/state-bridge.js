/**
 * State Bridge for Early Injection
 * Manages state synchronization between early injection and full initialization phases
 * Handles storage operations and service worker communication for early injection
 */

import { EventManager } from './event-manager.js';

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

export class StateBridge extends (typeof EventManager !== 'undefined' ? EventManager : MinimalEventEmitter) {
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