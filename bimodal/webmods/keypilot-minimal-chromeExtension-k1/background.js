/**
 * KeyPilot Extension Toggle Service Worker
 * Manages global extension state and coordinates toggle functionality across all tabs
 */

class ExtensionToggleManager {
  constructor() {
    this.STORAGE_KEY = 'keypilot_enabled';
    this.HUD_STORAGE_KEY = 'keypilot_hud_visible';
    this.DEFAULT_STATE = true;
    this.DEFAULT_HUD_STATE = true;
    this.initialized = false;
  }

  /**
   * Initialize the toggle manager
   */
  async initialize() {
    if (this.initialized) return;
    
    try {
      // Ensure we have a valid initial state
      const currentState = await this.getState();
      console.log('ExtensionToggleManager initialized with state:', currentState);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ExtensionToggleManager:', error);
      // Continue with default state
      this.initialized = true;
    }
  }

  /**
   * Get current extension state from storage
   * @returns {Promise<boolean>} Current enabled state
   */
  async getState() {
    try {
      // Try chrome.storage.sync first
      const syncResult = await chrome.storage.sync.get([this.STORAGE_KEY]);
      if (syncResult[this.STORAGE_KEY] !== undefined) {
        return syncResult[this.STORAGE_KEY];
      }
    } catch (syncError) {
      console.warn('chrome.storage.sync unavailable, trying local storage:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        const localResult = await chrome.storage.local.get([this.STORAGE_KEY]);
        if (localResult[this.STORAGE_KEY] !== undefined) {
          return localResult[this.STORAGE_KEY];
        }
      } catch (localError) {
        console.error('Both sync and local storage failed:', localError);
      }
    }
    
    // Return default state if all storage methods fail
    return this.DEFAULT_STATE;
  }

  /**
   * Set extension state in storage and notify all tabs
   * @param {boolean} enabled - New enabled state
   * @returns {Promise<boolean>} The state that was set
   */
  async setState(enabled) {
    const state = Boolean(enabled);
    const stateData = {
      [this.STORAGE_KEY]: state,
      timestamp: Date.now()
    };

    try {
      // Try to save to chrome.storage.sync first
      await chrome.storage.sync.set(stateData);
      console.log('State saved to sync storage:', state);
    } catch (syncError) {
      console.warn('Failed to save to sync storage, trying local:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        await chrome.storage.local.set(stateData);
        console.log('State saved to local storage:', state);
      } catch (localError) {
        console.error('Failed to save state to any storage:', localError);
        // Continue execution even if storage fails
      }
    }

    // Notify all tabs about the state change
    await this.notifyAllTabs(state);
    
    return state;
  }

  /**
   * Toggle current extension state
   * @returns {Promise<boolean>} New state after toggle
   */
  async toggleState() {
    try {
      const currentState = await this.getState();
      const newState = !currentState;
      await this.setState(newState);
      console.log('Extension state toggled:', currentState, '->', newState);
      return newState;
    } catch (error) {
      console.error('Failed to toggle state:', error);
      // Return current state or default if toggle fails
      return await this.getState();
    }
  }

  /**
   * Get current HUD visibility state from storage
   * @returns {Promise<boolean>} Current HUD visible state
   */
  async getHUDState() {
    try {
      // Try chrome.storage.sync first
      const syncResult = await chrome.storage.sync.get([this.HUD_STORAGE_KEY]);
      if (syncResult[this.HUD_STORAGE_KEY] !== undefined) {
        return syncResult[this.HUD_STORAGE_KEY];
      }
    } catch (syncError) {
      console.warn('chrome.storage.sync unavailable for HUD state, trying local storage:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        const localResult = await chrome.storage.local.get([this.HUD_STORAGE_KEY]);
        if (localResult[this.HUD_STORAGE_KEY] !== undefined) {
          return localResult[this.HUD_STORAGE_KEY];
        }
      } catch (localError) {
        console.error('Both sync and local storage failed for HUD state:', localError);
      }
    }
    
    // Return default HUD state if all storage methods fail
    return this.DEFAULT_HUD_STATE;
  }

  /**
   * Set HUD visibility state in storage and notify all tabs
   * @param {boolean} visible - New HUD visible state
   * @returns {Promise<boolean>} The state that was set
   */
  async setHUDState(visible) {
    const state = Boolean(visible);
    const stateData = {
      [this.HUD_STORAGE_KEY]: state,
      hud_timestamp: Date.now()
    };

    try {
      // Try to save to chrome.storage.sync first
      await chrome.storage.sync.set(stateData);
      console.log('HUD state saved to sync storage:', state);
    } catch (syncError) {
      console.warn('Failed to save HUD state to sync storage, trying local:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        await chrome.storage.local.set(stateData);
        console.log('HUD state saved to local storage:', state);
      } catch (localError) {
        console.error('Failed to save HUD state to any storage:', localError);
        // Continue execution even if storage fails
      }
    }

    // Notify all tabs about the HUD state change
    await this.notifyAllTabsHUD(state);
    
    return state;
  }

  /**
   * Set complete HUD state in storage and notify all tabs
   * @param {Object} hudState - Complete HUD state object
   * @returns {Promise<Object>} The state that was set
   */
  async setCompleteHUDState(hudState) {
    const state = {
      visible: Boolean(hudState.visible),
      expanded: Boolean(hudState.expanded),
      activeTab: String(hudState.activeTab || 'basic')
    };
    
    const stateData = {
      keypilot_hud_visible: state.visible,
      keypilot_hud_expanded: state.expanded,
      keypilot_hud_active_tab: state.activeTab,
      hud_complete_timestamp: Date.now()
    };

    try {
      // Try to save to chrome.storage.sync first
      await chrome.storage.sync.set(stateData);
      console.log('Complete HUD state saved to sync storage:', state);
    } catch (syncError) {
      console.warn('Failed to save complete HUD state to sync storage, trying local:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        await chrome.storage.local.set(stateData);
        console.log('Complete HUD state saved to local storage:', state);
      } catch (localError) {
        console.error('Failed to save complete HUD state to any storage:', localError);
        // Continue execution even if storage fails
      }
    }

    // Notify all tabs about the complete HUD state change
    await this.notifyAllTabsCompleteHUD(state);
    
    return state;
  }

  /**
   * Get complete HUD state from storage
   * @returns {Promise<Object>} Complete HUD state object
   */
  async getCompleteHUDState() {
    const defaultState = {
      visible: this.DEFAULT_HUD_STATE,
      expanded: false,
      activeTab: 'basic'
    };

    try {
      // Try chrome.storage.sync first
      const syncResult = await chrome.storage.sync.get([
        'keypilot_hud_visible',
        'keypilot_hud_expanded', 
        'keypilot_hud_active_tab'
      ]);
      
      if (syncResult.keypilot_hud_visible !== undefined) {
        return {
          visible: syncResult.keypilot_hud_visible,
          expanded: syncResult.keypilot_hud_expanded || false,
          activeTab: syncResult.keypilot_hud_active_tab || 'basic'
        };
      }
    } catch (syncError) {
      console.warn('chrome.storage.sync unavailable for complete HUD state, trying local storage:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        const localResult = await chrome.storage.local.get([
          'keypilot_hud_visible',
          'keypilot_hud_expanded',
          'keypilot_hud_active_tab'
        ]);
        
        if (localResult.keypilot_hud_visible !== undefined) {
          return {
            visible: localResult.keypilot_hud_visible,
            expanded: localResult.keypilot_hud_expanded || false,
            activeTab: localResult.keypilot_hud_active_tab || 'basic'
          };
        }
      } catch (localError) {
        console.error('Both sync and local storage failed for complete HUD state:', localError);
      }
    }
    
    // Return default state if all storage methods fail
    return defaultState;
  }

  /**
   * Toggle current HUD visibility state
   * @returns {Promise<boolean>} New HUD state after toggle
   */
  async toggleHUDVisibility() {
    try {
      const currentState = await this.getHUDState();
      const newState = !currentState;
      await this.setHUDState(newState);
      console.log('HUD visibility toggled:', currentState, '->', newState);
      return newState;
    } catch (error) {
      console.error('Failed to toggle HUD visibility:', error);
      // Return current state or default if toggle fails
      return await this.getHUDState();
    }
  }

  /**
   * Notify all tabs about state change
   * @param {boolean} enabled - New enabled state
   */
  async notifyAllTabs(enabled) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'KP_TOGGLE_STATE',
        enabled: enabled,
        timestamp: Date.now()
      };

      // Send message to all tabs
      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that don't have content scripts
          // (chrome:// pages, extension pages, etc.)
          console.debug('Could not notify tab', tab.id, ':', error.message);
        }
      });

      await Promise.allSettled(notifications);
      console.log('Notified', tabs.length, 'tabs about state change:', enabled);
    } catch (error) {
      console.error('Failed to notify tabs:', error);
    }
  }

  /**
   * Notify all tabs about HUD visibility change
   * @param {boolean} visible - New HUD visible state
   */
  async notifyAllTabsHUD(visible) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'KP_HUD_TOGGLE',
        visible: visible,
        timestamp: Date.now()
      };

      // Send message to all tabs
      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that don't have content scripts
          // (chrome:// pages, extension pages, etc.)
          console.debug('Could not notify tab', tab.id, 'about HUD change:', error.message);
        }
      });

      await Promise.allSettled(notifications);
      console.log('Notified', tabs.length, 'tabs about HUD visibility change:', visible);
    } catch (error) {
      console.error('Failed to notify tabs about HUD change:', error);
    }
  }

  /**
   * Notify all tabs about complete HUD state change
   * @param {Object} hudState - Complete HUD state object
   */
  async notifyAllTabsCompleteHUD(hudState) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'KP_HUD_STATE_SYNC',
        hudState: hudState,
        timestamp: Date.now()
      };

      // Send message to all tabs
      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that don't have content scripts
          // (chrome:// pages, extension pages, etc.)
          console.debug('Could not notify tab', tab.id, 'about complete HUD state change:', error.message);
        }
      });

      await Promise.allSettled(notifications);
      console.log('Notified', tabs.length, 'tabs about complete HUD state change:', hudState);
    } catch (error) {
      console.error('Failed to notify tabs about complete HUD state change:', error);
    }
  }

  /**
   * Get fast state for early injection
   * Optimized for speed during page load
   * @returns {Promise<Object>} Early injection state object
   */
  async getFastEarlyState() {
    try {
      // Use Promise.all for parallel execution to minimize latency
      const [extensionEnabled, completeHUDState] = await Promise.all([
        this.getState(),
        this.getCompleteHUDState()
      ]);
      
      return {
        extensionEnabled,
        hudVisible: completeHUDState.visible,
        hudExpanded: completeHUDState.expanded,
        hudActiveTab: completeHUDState.activeTab,
        cursorMode: 'none', // Default for early injection
        timestamp: Date.now(),
        source: 'service-worker-fast'
      };
    } catch (error) {
      console.error('Failed to get fast early state:', error);
      // Return default state on error
      return {
        extensionEnabled: this.DEFAULT_STATE,
        hudVisible: this.DEFAULT_HUD_STATE,
        hudExpanded: false,
        hudActiveTab: 'basic',
        cursorMode: 'none',
        timestamp: Date.now(),
        source: 'service-worker-fallback',
        error: error.message
      };
    }
  }

  /**
   * Handle early injection error and provide fallback
   * @param {string} errorType - Type of error encountered
   * @param {Error} error - The error object
   * @returns {Object} Fallback state for early injection
   */
  handleEarlyInjectionError(errorType, error) {
    console.warn(`Early injection error (${errorType}):`, error);
    
    return {
      extensionEnabled: this.DEFAULT_STATE,
      hudVisible: this.DEFAULT_HUD_STATE,
      hudExpanded: false,
      hudActiveTab: 'basic',
      cursorMode: 'none',
      timestamp: Date.now(),
      source: 'service-worker-error-fallback',
      errorType,
      error: error.message
    };
  }

  /**
   * Save navigation state for cross-tab synchronization
   * @param {Object} navigationState - State to preserve during navigation
   */
  async saveNavigationState(navigationState) {
    const NAVIGATION_STATE_KEY = 'keypilot_navigation_state';
    
    try {
      const stateData = {
        [NAVIGATION_STATE_KEY]: navigationState,
        navigation_timestamp: Date.now()
      };
      
      // Try sync storage first for cross-tab availability
      try {
        await chrome.storage.sync.set(stateData);
        console.log('Navigation state saved to sync storage');
      } catch (syncError) {
        console.warn('Failed to save navigation state to sync storage, trying local:', syncError);
        await chrome.storage.local.set(stateData);
        console.log('Navigation state saved to local storage');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save navigation state:', error);
      return false;
    }
  }

  /**
   * Get navigation state for cross-tab synchronization
   * @returns {Promise<Object|null>} Navigation state or null if not found
   */
  async getNavigationState() {
    const NAVIGATION_STATE_KEY = 'keypilot_navigation_state';
    
    try {
      // Try sync storage first
      try {
        const syncResult = await chrome.storage.sync.get([NAVIGATION_STATE_KEY]);
        if (syncResult[NAVIGATION_STATE_KEY]) {
          return syncResult[NAVIGATION_STATE_KEY];
        }
      } catch (syncError) {
        console.warn('Failed to get navigation state from sync storage:', syncError);
      }
      
      // Fallback to local storage
      const localResult = await chrome.storage.local.get([NAVIGATION_STATE_KEY]);
      return localResult[NAVIGATION_STATE_KEY] || null;
    } catch (error) {
      console.error('Failed to get navigation state:', error);
      return null;
    }
  }

  /**
   * Notify other tabs about navigation state changes
   * @param {Object} navigationState - The navigation state to broadcast
   * @param {number} excludeTabId - Tab ID to exclude from notification (sender)
   */
  async notifyNavigationStateChange(navigationState, excludeTabId = null) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'KP_NAVIGATION_STATE_UPDATE',
        navigationState: navigationState,
        timestamp: Date.now()
      };

      // Send message to all tabs except the sender
      const notifications = tabs
        .filter(tab => tab.id !== excludeTabId)
        .map(async (tab) => {
          try {
            await chrome.tabs.sendMessage(tab.id, message);
          } catch (error) {
            // Ignore errors for tabs that don't have content scripts
            console.debug('Could not notify tab', tab.id, 'about navigation state change:', error.message);
          }
        });

      await Promise.allSettled(notifications);
      console.log('Notified', notifications.length, 'tabs about navigation state change');
    } catch (error) {
      console.error('Failed to notify tabs about navigation state change:', error);
    }
  }

  /**
   * Handle rapid navigation conflicts
   * @param {Object} newState - New navigation state
   * @param {Object} existingState - Existing navigation state
   * @returns {Object} Resolved state
   */
  resolveNavigationConflict(newState, existingState) {
    try {
      // Use timestamp to resolve conflicts - newer state wins
      if (!existingState || !existingState.navigationTimestamp) {
        return newState;
      }
      
      if (!newState.navigationTimestamp) {
        return existingState;
      }
      
      // If timestamps are very close (< 100ms), prefer the state with higher tab ID
      const timeDiff = Math.abs(newState.navigationTimestamp - existingState.navigationTimestamp);
      if (timeDiff < 100) {
        const newTabId = newState.sourceTabId || 0;
        const existingTabId = existingState.sourceTabId || 0;
        
        return newTabId > existingTabId ? newState : existingState;
      }
      
      // Otherwise, use the newer state
      return newState.navigationTimestamp > existingState.navigationTimestamp ? newState : existingState;
    } catch (error) {
      console.error('Failed to resolve navigation conflict:', error);
      // Return new state as fallback
      return newState;
    }
  }
}

// Create global instance
const extensionToggleManager = new ExtensionToggleManager();
/**
 * Key
board Command Handler
 * Handles Alt+K shortcut for toggling extension state
 */

// Set up keyboard command listener
chrome.commands.onCommand.addListener(async (command) => {
  console.log('Command received:', command);
  
  if (command === 'toggle-extension') {
    try {
      await extensionToggleManager.initialize();
      const newState = await extensionToggleManager.toggleState();
      console.log('Extension toggled via Alt+K to:', newState ? 'enabled' : 'disabled');
    } catch (error) {
      console.error('Failed to handle toggle command:', error);
    }
  } else if (command === 'toggle-hud') {
    try {
      console.log('Alt+H command received, initializing toggle manager...');
      await extensionToggleManager.initialize();
      
      // Check if KeyPilot is enabled before toggling HUD
      const keypilotEnabled = await extensionToggleManager.getState();
      console.log('KeyPilot enabled state:', keypilotEnabled);
      
      if (keypilotEnabled) {
        // Get current complete HUD state and toggle visibility
        const currentHUDState = await extensionToggleManager.getCompleteHUDState();
        console.log('Current HUD state before toggle:', currentHUDState);
        
        const newHUDState = {
          ...currentHUDState,
          visible: !currentHUDState.visible
        };
        
        await extensionToggleManager.setCompleteHUDState(newHUDState);
        console.log('✅ HUD toggled via Alt+H from', currentHUDState.visible, 'to', newHUDState.visible);
        
        // Log success for debugging
        console.log('Alt+H command completed successfully:', {
          previousState: currentHUDState,
          newState: newHUDState,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log('⚠️ HUD toggle ignored - KeyPilot is disabled');
        console.log('Alt+H command ignored due to disabled KeyPilot state');
      }
    } catch (error) {
      console.error('❌ Failed to handle Alt+H HUD toggle command:', error);
      console.error('Alt+H error details:', {
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
      
      // Attempt to log current state for debugging
      try {
        const debugState = await extensionToggleManager.getState();
        const debugHUDState = await extensionToggleManager.getCompleteHUDState();
        console.error('Debug state during Alt+H error:', {
          keypilotEnabled: debugState,
          hudState: debugHUDState
        });
      } catch (debugError) {
        console.error('Failed to get debug state:', debugError);
      }
    }
  } else {
    console.warn('Unknown command received:', command);
  }
});

/**
 * Extension Installation Handler
 * Sets up default values when extension is installed or updated
 */
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('KeyPilot Extension installation event:', {
    reason: details.reason,
    previousVersion: details.previousVersion,
    timestamp: new Date().toISOString()
  });
  
  try {
    // Initialize the toggle manager first
    await extensionToggleManager.initialize();
    console.log('ExtensionToggleManager initialized successfully during installation');
    
    // Handle different installation scenarios
    if (details.reason === 'install') {
      console.log('First-time installation detected, setting up default states...');
      
      try {
        // Set default extension state (enabled)
        const extensionState = await extensionToggleManager.setState(extensionToggleManager.DEFAULT_STATE);
        console.log('Default extension state set:', extensionState);
        
        // Set default HUD state (visible but collapsed)
        const defaultHUDState = {
          visible: extensionToggleManager.DEFAULT_HUD_STATE,
          expanded: false,
          activeTab: 'basic'
        };
        const hudState = await extensionToggleManager.setCompleteHUDState(defaultHUDState);
        console.log('Default HUD state set:', hudState);
        
        console.log('✅ Installation complete - Default values successfully set:', {
          extensionEnabled: extensionState,
          hudState: hudState
        });
        
      } catch (stateError) {
        console.error('❌ Failed to set default states during installation:', stateError);
        
        // Attempt fallback state setting
        try {
          console.log('Attempting fallback state initialization...');
          
          // Use direct storage API as fallback
          const fallbackData = {
            [extensionToggleManager.STORAGE_KEY]: extensionToggleManager.DEFAULT_STATE,
            [extensionToggleManager.HUD_STORAGE_KEY]: extensionToggleManager.DEFAULT_HUD_STATE,
            keypilot_hud_expanded: false,
            keypilot_hud_active_tab: 'basic',
            installation_timestamp: Date.now(),
            installation_fallback: true
          };
          
          await chrome.storage.sync.set(fallbackData);
          console.log('✅ Fallback state initialization successful');
          
        } catch (fallbackError) {
          console.error('❌ Fallback state initialization also failed:', fallbackError);
          
          // Try local storage as last resort
          try {
            await chrome.storage.local.set(fallbackData);
            console.log('✅ Local storage fallback successful');
          } catch (localError) {
            console.error('❌ All storage methods failed during installation:', localError);
          }
        }
      }
      
    } else if (details.reason === 'update') {
      console.log('Extension updated from version:', details.previousVersion);
      
      try {
        // Validate and preserve existing state
        const currentState = await extensionToggleManager.getState();
        const currentHUDState = await extensionToggleManager.getCompleteHUDState();
        
        console.log('✅ Existing state preserved during update:', {
          extensionEnabled: currentState,
          hudState: currentHUDState,
          previousVersion: details.previousVersion
        });
        
        // Add update timestamp for debugging
        const updateData = {
          last_update_timestamp: Date.now(),
          last_update_version: details.previousVersion
        };
        
        try {
          await chrome.storage.sync.set(updateData);
        } catch (updateStorageError) {
          console.warn('Failed to save update metadata:', updateStorageError);
          await chrome.storage.local.set(updateData);
        }
        
      } catch (updateError) {
        console.error('❌ Failed to validate state during update:', updateError);
        
        // Don't reset state on update errors - preserve what exists
        console.log('Continuing with existing state despite validation error');
      }
      
    } else if (details.reason === 'chrome_update' || details.reason === 'shared_module_update') {
      console.log('Chrome or shared module update detected, validating state...');
      
      try {
        // Just validate that state is accessible
        const currentState = await extensionToggleManager.getState();
        const currentHUDState = await extensionToggleManager.getCompleteHUDState();
        
        console.log('✅ State validation successful after Chrome update:', {
          extensionEnabled: currentState,
          hudState: currentHUDState
        });
        
      } catch (validationError) {
        console.error('❌ State validation failed after Chrome update:', validationError);
      }
    }
    
  } catch (initError) {
    console.error('❌ Critical error during installation handler:', initError);
    
    // Log detailed error information for debugging
    console.error('Installation error details:', {
      error: initError.message,
      stack: initError.stack,
      reason: details.reason,
      previousVersion: details.previousVersion,
      timestamp: new Date().toISOString()
    });
    
    // Continue with service worker startup even if installation handler fails
    console.log('Continuing service worker startup despite installation error');
  }
});

// Enhanced service worker startup logging
console.log('🚀 KeyPilot Service Worker Starting...', {
  timestamp: new Date().toISOString(),
  version: chrome.runtime.getManifest().version,
  id: chrome.runtime.id
});

// Initialize the extension toggle manager on startup
(async () => {
  try {
    await extensionToggleManager.initialize();
    const currentState = await extensionToggleManager.getState();
    const currentHUDState = await extensionToggleManager.getCompleteHUDState();
    
    console.log('✅ KeyPilot Service Worker fully initialized:', {
      extensionEnabled: currentState,
      hudState: currentHUDState,
      managerInitialized: extensionToggleManager.initialized,
      timestamp: new Date().toISOString()
    });
    
  } catch (startupError) {
    console.error('❌ Service Worker initialization error:', startupError);
    console.error('Startup error details:', {
      error: startupError.message,
      stack: startupError.stack,
      timestamp: new Date().toISOString()
    });
    
    // Continue with fallback state
    console.log('Continuing with fallback default state');
  }
})();/**

 * Message Handler for Cross-Tab Communication
 * Handles messages from popup and content scripts
 */

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Message received:', message, 'from:', sender);
  
  // Handle async operations properly
  (async () => {
    try {
      await extensionToggleManager.initialize();
      
      switch (message.type) {
        case 'KP_GET_STATE':
          // Content script or popup requesting current state
          const currentState = await extensionToggleManager.getState();
          sendResponse({
            type: 'KP_STATE_RESPONSE',
            enabled: currentState,
            timestamp: Date.now(),
            source: message.source || 'unknown'
          });
          console.log('Sent current state:', currentState, 'to:', message.source || 'unknown');
          break;
          
        case 'KP_SET_STATE':
          // Popup requesting state change
          if (typeof message.enabled === 'boolean') {
            const newState = await extensionToggleManager.setState(message.enabled);
            sendResponse({
              type: 'KP_STATE_CHANGED',
              enabled: newState,
              timestamp: Date.now()
            });
            console.log('State changed via message to:', newState);
          } else {
            console.error('Invalid enabled value in KP_SET_STATE:', message.enabled);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid enabled value'
            });
          }
          break;
          
        case 'KP_TOGGLE_STATE':
          // Request to toggle current state
          const toggledState = await extensionToggleManager.toggleState();
          sendResponse({
            type: 'KP_STATE_CHANGED',
            enabled: toggledState,
            timestamp: Date.now()
          });
          console.log('State toggled via message to:', toggledState);
          break;
          
        case 'KP_GET_HUD_STATE':
          // Content script requesting current HUD state
          const currentHUDState = await extensionToggleManager.getHUDState();
          sendResponse({
            type: 'KP_HUD_STATE_RESPONSE',
            visible: currentHUDState,
            timestamp: Date.now()
          });
          console.log('Sent current HUD state:', currentHUDState);
          break;
          
        case 'KP_SET_HUD_STATE':
          // Request to set HUD state
          if (typeof message.visible === 'boolean') {
            const newHUDState = await extensionToggleManager.setHUDState(message.visible);
            sendResponse({
              type: 'KP_HUD_STATE_CHANGED',
              visible: newHUDState,
              timestamp: Date.now()
            });
            console.log('HUD state changed via message to:', newHUDState);
          } else {
            console.error('Invalid visible value in KP_SET_HUD_STATE:', message.visible);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid visible value'
            });
          }
          break;
          
        case 'KP_TOGGLE_HUD':
          // Request to toggle HUD visibility
          try {
            console.log('KP_TOGGLE_HUD message received, checking KeyPilot state...');
            
            // Check if KeyPilot is enabled before toggling HUD
            const keypilotEnabled = await extensionToggleManager.getState();
            console.log('KeyPilot enabled state for HUD toggle:', keypilotEnabled);
            
            if (keypilotEnabled) {
              // Get current complete HUD state and toggle visibility
              const currentHUDState = await extensionToggleManager.getCompleteHUDState();
              console.log('Current HUD state before message toggle:', currentHUDState);
              
              const newHUDState = {
                ...currentHUDState,
                visible: !currentHUDState.visible
              };
              
              await extensionToggleManager.setCompleteHUDState(newHUDState);
              
              sendResponse({
                type: 'KP_HUD_STATE_CHANGED',
                visible: newHUDState.visible,
                timestamp: Date.now()
              });
              
              console.log('✅ HUD visibility toggled via message from', currentHUDState.visible, 'to', newHUDState.visible);
            } else {
              console.log('⚠️ HUD toggle message ignored - KeyPilot is disabled');
              
              // Send response indicating toggle was ignored
              sendResponse({
                type: 'KP_HUD_TOGGLE_IGNORED',
                reason: 'KeyPilot disabled',
                timestamp: Date.now()
              });
            }
          } catch (error) {
            console.error('❌ Failed to handle KP_TOGGLE_HUD message:', error);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Failed to toggle HUD: ' + error.message,
              timestamp: Date.now()
            });
          }
          break;
          
        case 'KP_GET_COMPLETE_HUD_STATE':
          // Content script requesting complete HUD state
          const completeHUDState = await extensionToggleManager.getCompleteHUDState();
          sendResponse({
            type: 'KP_COMPLETE_HUD_STATE_RESPONSE',
            hudState: completeHUDState,
            timestamp: Date.now()
          });
          console.log('Sent complete HUD state:', completeHUDState);
          break;
          
        case 'KP_SET_COMPLETE_HUD_STATE':
          // Request to set complete HUD state
          if (message.hudState && typeof message.hudState === 'object') {
            const newCompleteHUDState = await extensionToggleManager.setCompleteHUDState(message.hudState);
            sendResponse({
              type: 'KP_COMPLETE_HUD_STATE_CHANGED',
              hudState: newCompleteHUDState,
              timestamp: Date.now()
            });
            console.log('Complete HUD state changed via message to:', newCompleteHUDState);
          } else {
            console.error('Invalid hudState value in KP_SET_COMPLETE_HUD_STATE:', message.hudState);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid hudState value'
            });
          }
          break;
          
        case 'KP_EARLY_INJECTION_STATE_REQUEST':
          // Early injection requesting fast state retrieval
          try {
            const earlyState = await extensionToggleManager.getFastEarlyState();
            
            sendResponse({
              type: 'KP_EARLY_INJECTION_STATE_RESPONSE',
              state: earlyState,
              timestamp: Date.now(),
              success: true
            });
            console.log('Sent early injection state:', earlyState);
          } catch (error) {
            console.error('Failed to get early injection state:', error);
            const fallbackState = extensionToggleManager.handleEarlyInjectionError('state_request', error);
            
            sendResponse({
              type: 'KP_EARLY_INJECTION_STATE_RESPONSE',
              state: fallbackState,
              timestamp: Date.now(),
              success: false,
              error: error.message
            });
          }
          break;
          
        case 'KP_EARLY_INJECTION_PING':
          // Early injection testing service worker availability
          sendResponse({
            type: 'KP_EARLY_INJECTION_PONG',
            available: true,
            timestamp: Date.now()
          });
          console.log('Responded to early injection ping');
          break;
          
        case 'KP_EARLY_STATE_REQUEST':
          // Early injection requesting current state (alternative endpoint)
          try {
            const earlyState = await extensionToggleManager.getFastEarlyState();
            
            sendResponse({
              success: true,
              state: earlyState,
              timestamp: Date.now()
            });
            console.log('Sent early state via alternative endpoint:', earlyState);
          } catch (error) {
            console.error('Failed to get early state via alternative endpoint:', error);
            const fallbackState = extensionToggleManager.handleEarlyInjectionError('early_state_request', error);
            
            sendResponse({
              success: false,
              state: fallbackState,
              error: error.message,
              timestamp: Date.now()
            });
          }
          break;
          
        case 'KP_NAVIGATION_STATE_SYNC':
          // Handle state synchronization during navigation
          try {
            if (message.state && typeof message.state === 'object') {
              // Save navigation state for cross-tab sync
              await extensionToggleManager.saveNavigationState(message.state);
              
              // Notify other tabs about navigation state change
              await extensionToggleManager.notifyNavigationStateChange(message.state, sender.tab?.id);
              
              sendResponse({
                type: 'KP_NAVIGATION_STATE_SYNCED',
                success: true,
                timestamp: Date.now()
              });
              console.log('Navigation state synchronized:', message.state);
            } else {
              throw new Error('Invalid navigation state data');
            }
          } catch (error) {
            console.error('Failed to sync navigation state:', error);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Failed to sync navigation state'
            });
          }
          break;
          
        case 'KP_PRE_NAVIGATION_STATE':
          // Handle pre-navigation state preservation
          try {
            const currentState = await extensionToggleManager.getFastEarlyState();
            
            // Store state with navigation context
            const navigationState = {
              ...currentState,
              navigationTimestamp: Date.now(),
              sourceTabId: sender.tab?.id,
              url: message.url || 'unknown'
            };
            
            await extensionToggleManager.saveNavigationState(navigationState);
            
            sendResponse({
              type: 'KP_PRE_NAVIGATION_STATE_SAVED',
              state: navigationState,
              timestamp: Date.now()
            });
            console.log('Pre-navigation state saved:', navigationState);
          } catch (error) {
            console.error('Failed to save pre-navigation state:', error);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Failed to save pre-navigation state'
            });
          }
          break;
          
        case 'KP_CURSOR_STATE_BROADCAST':
          // Handle cursor state synchronization across tabs
          try {
            const cursorState = message.cursorState;
            const sourceTabId = sender.tab?.id;
            
            // Broadcast cursor state to all other tabs
            const tabs = await chrome.tabs.query({});
            const broadcastMessage = {
              type: 'KP_CURSOR_STATE_SYNC',
              cursorState: cursorState,
              sourceTabId: sourceTabId,
              timestamp: Date.now()
            };
            
            // Send to all tabs except the sender
            for (const tab of tabs) {
              if (tab.id !== sourceTabId) {
                try {
                  await chrome.tabs.sendMessage(tab.id, broadcastMessage);
                } catch (tabError) {
                  // Tab might not have content script loaded, ignore
                  console.log(`Could not send cursor state to tab ${tab.id}:`, tabError.message);
                }
              }
            }
            
            sendResponse({
              type: 'KP_CURSOR_STATE_BROADCASTED',
              success: true,
              timestamp: Date.now()
            });
          } catch (error) {
            console.error('Failed to broadcast cursor state:', error);
            sendResponse({
              type: 'KP_ERROR',
              success: false,
              error: 'Failed to broadcast cursor state'
            });
          }
          break;
          
        default:
          console.warn('Unknown message type:', message.type);
          sendResponse({
            type: 'KP_ERROR',
            error: 'Unknown message type'
          });
      }
    } catch (error) {
      console.error('Error handling message:', error);
      sendResponse({
        type: 'KP_ERROR',
        error: error.message
      });
    }
  })();
  
  // Return true to indicate we'll send a response asynchronously
  return true;
});

/**
 * Service Worker Lifecycle Events
 */

// Initialize when service worker starts
chrome.runtime.onStartup.addListener(async () => {
  console.log('Chrome startup detected, initializing ExtensionToggleManager...');
  await extensionToggleManager.initialize();
});

// Duplicate onInstalled listener removed - consolidated into main installation handler above

console.log('🎯 KeyPilot Service Worker Setup Complete:', {
  commandHandlers: ['toggle-extension', 'toggle-hud'],
  messageHandlers: ['KP_GET_STATE', 'KP_SET_STATE', 'KP_TOGGLE_STATE', 'KP_GET_HUD_STATE', 'KP_SET_HUD_STATE', 'KP_TOGGLE_HUD', 'KP_GET_COMPLETE_HUD_STATE', 'KP_SET_COMPLETE_HUD_STATE'],
  eventHandlers: ['onInstalled', 'onStartup', 'onMessage', 'onCommand'],
  timestamp: new Date().toISOString(),
  ready: true
});