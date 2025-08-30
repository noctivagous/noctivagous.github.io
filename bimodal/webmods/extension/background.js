/**
 * KeyPilot Extension Toggle Service Worker
 * Manages global extension state and coordinates toggle functionality across all tabs
 */

class ExtensionToggleManager {
  constructor() {
    this.STORAGE_KEY = 'keypilot_enabled';
    this.DEFAULT_STATE = true;
    this.initialized = false;
    
    // Cursor settings constants
    this.CURSOR_STORAGE_KEYS = {
      SIZE: 'keypilot_cursor_size',
      VISIBLE: 'keypilot_cursor_visible'
    };
    this.CURSOR_DEFAULTS = {
      SIZE: 1.0,
      VISIBLE: true
    };
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
   * Get cursor settings from storage
   * @returns {Promise<{size: number, visible: boolean}>} Current cursor settings
   */
  async getCursorSettings() {
    const settings = {
      size: this.CURSOR_DEFAULTS.SIZE,
      visible: this.CURSOR_DEFAULTS.VISIBLE
    };

    try {
      // Try chrome.storage.sync first
      const syncResult = await chrome.storage.sync.get([
        this.CURSOR_STORAGE_KEYS.SIZE,
        this.CURSOR_STORAGE_KEYS.VISIBLE
      ]);
      
      if (syncResult[this.CURSOR_STORAGE_KEYS.SIZE] !== undefined) {
        settings.size = syncResult[this.CURSOR_STORAGE_KEYS.SIZE];
      }
      if (syncResult[this.CURSOR_STORAGE_KEYS.VISIBLE] !== undefined) {
        settings.visible = syncResult[this.CURSOR_STORAGE_KEYS.VISIBLE];
      }
      
      return settings;
    } catch (syncError) {
      console.warn('chrome.storage.sync unavailable for cursor settings, trying local storage:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        const localResult = await chrome.storage.local.get([
          this.CURSOR_STORAGE_KEYS.SIZE,
          this.CURSOR_STORAGE_KEYS.VISIBLE
        ]);
        
        if (localResult[this.CURSOR_STORAGE_KEYS.SIZE] !== undefined) {
          settings.size = localResult[this.CURSOR_STORAGE_KEYS.SIZE];
        }
        if (localResult[this.CURSOR_STORAGE_KEYS.VISIBLE] !== undefined) {
          settings.visible = localResult[this.CURSOR_STORAGE_KEYS.VISIBLE];
        }
        
        return settings;
      } catch (localError) {
        console.error('Both sync and local storage failed for cursor settings:', localError);
      }
    }
    
    // Return default settings if all storage methods fail
    return settings;
  }

  /**
   * Set cursor settings in storage and notify all tabs
   * @param {Object} settings - Cursor settings object
   * @param {number} [settings.size] - Cursor size (0.5 - 2.0)
   * @param {boolean} [settings.visible] - Cursor visibility
   * @returns {Promise<{size: number, visible: boolean}>} The settings that were set
   */
  async setCursorSettings(settings) {
    // Get current settings first
    const currentSettings = await this.getCursorSettings();
    
    // Merge with new settings, validating values
    const newSettings = {
      size: settings.size !== undefined ? 
        Math.max(0.5, Math.min(2.0, Number(settings.size))) : currentSettings.size,
      visible: settings.visible !== undefined ? 
        Boolean(settings.visible) : currentSettings.visible
    };

    const settingsData = {
      [this.CURSOR_STORAGE_KEYS.SIZE]: newSettings.size,
      [this.CURSOR_STORAGE_KEYS.VISIBLE]: newSettings.visible,
      timestamp: Date.now()
    };

    try {
      // Try to save to chrome.storage.sync first
      await chrome.storage.sync.set(settingsData);
      console.log('Cursor settings saved to sync storage:', newSettings);
    } catch (syncError) {
      console.warn('Failed to save cursor settings to sync storage, trying local:', syncError);
      
      try {
        // Fallback to chrome.storage.local
        await chrome.storage.local.set(settingsData);
        console.log('Cursor settings saved to local storage:', newSettings);
      } catch (localError) {
        console.error('Failed to save cursor settings to any storage:', localError);
        // Continue execution even if storage fails
      }
    }

    // Notify all tabs about the cursor settings change
    await this.notifyAllTabsCursorSettings(newSettings);
    
    return newSettings;
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
   * Notify all tabs about cursor settings change
   * @param {Object} settings - New cursor settings
   */
  async notifyAllTabsCursorSettings(settings) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'KP_CURSOR_SETTINGS_CHANGED',
        settings: settings,
        timestamp: Date.now()
      };

      // Send message to all tabs
      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that don't have content scripts
          console.debug('Could not notify tab', tab.id, 'about cursor settings:', error.message);
        }
      });

      await Promise.allSettled(notifications);
      console.log('Notified', tabs.length, 'tabs about cursor settings change:', settings);
    } catch (error) {
      console.error('Failed to notify tabs about cursor settings:', error);
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
  } else if (command === 'reload-extension') {
    try {
      console.log('Extension reload requested via Alt+R');
      chrome.runtime.reload();
    } catch (error) {
      console.error('Failed to reload extension:', error);
    }
  } else {
    console.warn('Unknown command received:', command);
  }
});

// Log when service worker starts up
console.log('KeyPilot service worker started, setting up command handlers...');

/**
 * Log file writing handler
 */
async function handleLogWrite(logEntry, sendResponse) {
  try {
    // For now, we'll log to console with a special format that can be captured
    // In a full implementation, this would write to the file system
    console.log(`[KEYPILOT_FILE_LOG] ${JSON.stringify(logEntry)}`);
    sendResponse({ success: true });
  } catch (error) {
    console.error('[Background] Failed to write log:', error);
    sendResponse({ success: false, error: error.message });
  }
}

/**
 * Message Handler for Cross-Tab Communication
 */
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type);
  
  (async () => {
    try {
      switch (message.type) {
        case 'KP_WRITE_LOG':
          handleLogWrite(message.logEntry, sendResponse);
          return;
          
        case 'KP_GET_STATE':
          // Content script or popup requesting current state
          const currentState = await extensionToggleManager.getState();
          sendResponse({
            type: 'KP_STATE_RESPONSE',
            enabled: currentState,
            timestamp: Date.now()
          });
          console.log('Sent current state:', currentState);
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
          
        case 'KP_GET_CURSOR_SETTINGS':
          // Content script or popup requesting current cursor settings
          const currentCursorSettings = await extensionToggleManager.getCursorSettings();
          sendResponse({
            type: 'KP_CURSOR_SETTINGS_RESPONSE',
            settings: currentCursorSettings,
            timestamp: Date.now()
          });
          console.log('Sent current cursor settings:', currentCursorSettings);
          break;

        case 'KP_SET_CURSOR_SIZE':
          // Popup requesting cursor size change
          if (typeof message.size === 'number' && message.size >= 0.5 && message.size <= 2.0) {
            const newCursorSettings = await extensionToggleManager.setCursorSettings({ size: message.size });
            sendResponse({
              type: 'KP_CURSOR_SETTINGS_CHANGED',
              settings: newCursorSettings,
              timestamp: Date.now()
            });
            console.log('Cursor size changed via message to:', message.size);
          } else {
            console.error('Invalid cursor size value in KP_SET_CURSOR_SIZE:', message.size);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid cursor size value'
            });
          }
          break;

        case 'KP_SET_CURSOR_VISIBILITY':
          // Popup requesting cursor visibility change
          if (typeof message.visible === 'boolean') {
            const newCursorSettings = await extensionToggleManager.setCursorSettings({ visible: message.visible });
            sendResponse({
              type: 'KP_CURSOR_SETTINGS_CHANGED',
              settings: newCursorSettings,
              timestamp: Date.now()
            });
            console.log('Cursor visibility changed via message to:', message.visible);
          } else {
            console.error('Invalid cursor visibility value in KP_SET_CURSOR_VISIBILITY:', message.visible);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid cursor visibility value'
            });
          }
          break;

        case 'KP_CLOSE_TAB':
          // Request to close current tab
          if (sender.tab && sender.tab.id) {
            try {
              await chrome.tabs.remove(sender.tab.id);
              console.log('Closed tab:', sender.tab.id);
              // No need to send response as tab will be closed
            } catch (error) {
              console.error('Failed to close tab:', error);
              sendResponse({
                type: 'KP_ERROR',
                error: 'Failed to close tab: ' + error.message
              });
            }
          } else {
            console.error('No valid tab ID in close tab request');
            sendResponse({
              type: 'KP_ERROR',
              error: 'No valid tab ID'
            });
          }
          break;

        case 'KP_TAB_LEFT':
          // Switch to the tab to the left
          if (sender.tab && sender.tab.id) {
            try {
              const tabs = await chrome.tabs.query({ currentWindow: true });
              const currentIndex = tabs.findIndex(tab => tab.id === sender.tab.id);
              if (currentIndex > 0) {
                const targetTab = tabs[currentIndex - 1];
                await chrome.tabs.update(targetTab.id, { active: true });
                console.log('Switched to left tab:', targetTab.id);
              } else if (tabs.length > 1) {
                // Wrap around to the last tab
                const targetTab = tabs[tabs.length - 1];
                await chrome.tabs.update(targetTab.id, { active: true });
                console.log('Wrapped to last tab:', targetTab.id);
              }
              sendResponse({ type: 'KP_SUCCESS' });
            } catch (error) {
              console.error('Failed to switch to left tab:', error);
              sendResponse({
                type: 'KP_ERROR',
                error: 'Failed to switch tab: ' + error.message
              });
            }
          }
          break;

        case 'KP_TAB_RIGHT':
          // Switch to the tab to the right
          if (sender.tab && sender.tab.id) {
            try {
              const tabs = await chrome.tabs.query({ currentWindow: true });
              const currentIndex = tabs.findIndex(tab => tab.id === sender.tab.id);
              if (currentIndex < tabs.length - 1) {
                const targetTab = tabs[currentIndex + 1];
                await chrome.tabs.update(targetTab.id, { active: true });
                console.log('Switched to right tab:', targetTab.id);
              } else if (tabs.length > 1) {
                // Wrap around to the first tab
                const targetTab = tabs[0];
                await chrome.tabs.update(targetTab.id, { active: true });
                console.log('Wrapped to first tab:', targetTab.id);
              }
              sendResponse({ type: 'KP_SUCCESS' });
            } catch (error) {
              console.error('Failed to switch to right tab:', error);
              sendResponse({
                type: 'KP_ERROR',
                error: 'Failed to switch tab: ' + error.message
              });
            }
          }
          break;

        case 'KP_RELOAD_EXTENSION':
          // Request to reload the extension
          try {
            console.log('Extension reload requested via message');
            chrome.runtime.reload();
            // No response needed as extension will reload
          } catch (error) {
            console.error('Failed to reload extension:', error);
            sendResponse({
              type: 'KP_ERROR',
              error: 'Failed to reload extension: ' + error.message
            });
          }
          break;

        case 'KP_DEBUG_EXECUTE':
          // Execute a debug script using userScripts.execute()
          if (sender.tab && sender.tab.id && message.scriptName) {
            try {
              const result = await debugManager.executeDebugScript(
                sender.tab.id, 
                message.scriptName, 
                message.options || {}
              );
              sendResponse({
                type: 'KP_DEBUG_RESULT',
                scriptName: message.scriptName,
                result: result,
                timestamp: Date.now()
              });
            } catch (error) {
              console.error('Debug script execution failed:', error);
              sendResponse({
                type: 'KP_ERROR',
                error: 'Debug script execution failed: ' + error.message
              });
            }
          } else {
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid debug execution request - missing tab ID or script name'
            });
          }
          break;

        case 'KP_DEBUG_LIST_SCRIPTS':
          // Get list of available debug scripts
          try {
            const scripts = debugManager.getAvailableScripts();
            sendResponse({
              type: 'KP_DEBUG_SCRIPTS_LIST',
              scripts: scripts,
              timestamp: Date.now()
            });
          } catch (error) {
            sendResponse({
              type: 'KP_ERROR',
              error: 'Failed to get debug scripts list: ' + error.message
            });
          }
          break;

        case 'KP_DEBUG_EXECUTE_MULTIPLE':
          // Execute multiple debug scripts
          if (sender.tab && sender.tab.id && message.scriptNames && Array.isArray(message.scriptNames)) {
            try {
              const results = await debugManager.executeMultipleScripts(sender.tab.id, message.scriptNames);
              sendResponse({
                type: 'KP_DEBUG_MULTIPLE_RESULTS',
                results: results,
                timestamp: Date.now()
              });
            } catch (error) {
              console.error('Multiple debug scripts execution failed:', error);
              sendResponse({
                type: 'KP_ERROR',
                error: 'Multiple debug scripts execution failed: ' + error.message
              });
            }
          } else {
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid multiple debug execution request'
            });
          }
          break;

        case 'KP_DEBUG_CUSTOM':
          // Execute custom user script
          if (sender.tab && sender.tab.id && message.userScript) {
            try {
              const result = await debugManager.executeDebugScript(
                sender.tab.id, 
                'customScript', 
                { userScript: message.userScript, injectImmediately: message.injectImmediately }
              );
              sendResponse({
                type: 'KP_DEBUG_RESULT',
                scriptName: 'customScript',
                result: result,
                timestamp: Date.now()
              });
            } catch (error) {
              console.error('Custom debug script execution failed:', error);
              sendResponse({
                type: 'KP_ERROR',
                error: 'Custom debug script execution failed: ' + error.message
              });
            }
          } else {
            sendResponse({
              type: 'KP_ERROR',
              error: 'Invalid custom debug execution request - missing user script'
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

// Initialize when extension is installed or updated
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);
  await extensionToggleManager.initialize();
  
  // Set default state on fresh install
  if (details.reason === 'install') {
    await extensionToggleManager.setState(extensionToggleManager.DEFAULT_STATE);
    console.log('Set default state on fresh install:', extensionToggleManager.DEFAULT_STATE);
  }
});

console.log('KeyPilot service worker fully initialized with message handlers');

// Import debug scripts library
importScripts('debug-scripts.js');

/**
 * Enhanced Debug System using chrome.userScripts.execute()
 */
class KeyPilotDebugManager {
  constructor() {
    this.debugScripts = KeyPilotDebugScripts;
  }

  /**
   * Execute a debug script in the current tab
   * @param {number} tabId - Target tab ID
   * @param {string} scriptName - Name of the script to execute
   * @param {Object} options - Additional options
   * @returns {Promise<any>} Script execution result
   */
  async executeDebugScript(tabId, scriptName, options = {}) {
    try {
      let scriptCode = this.debugScripts[scriptName];
      
      if (!scriptCode) {
        throw new Error(`Debug script '${scriptName}' not found`);
      }

      // Handle custom script with user-provided code
      if (scriptName === 'customScript' && options.userScript) {
        scriptCode = this.debugScripts.customScript(options.userScript);
      }

      // Execute the script using userScripts API
      const results = await chrome.userScripts.execute({
        targets: [{ tabId: tabId }],
        func: new Function('return ' + scriptCode),
        injectImmediately: options.injectImmediately || false
      });

      console.log(`[Debug] Executed '${scriptName}' in tab ${tabId}:`, results[0]?.result);
      return results[0]?.result;
    } catch (error) {
      console.error(`[Debug] Failed to execute '${scriptName}':`, error);
      throw error;
    }
  }

  /**
   * Get list of available debug scripts
   * @returns {Array<string>} Available script names
   */
  getAvailableScripts() {
    return Object.keys(this.debugScripts).filter(key => key !== 'customScript');
  }

  /**
   * Execute multiple debug scripts in sequence
   * @param {number} tabId - Target tab ID
   * @param {Array<string>} scriptNames - Scripts to execute
   * @returns {Promise<Object>} Results from all scripts
   */
  async executeMultipleScripts(tabId, scriptNames) {
    const results = {};
    
    for (const scriptName of scriptNames) {
      try {
        results[scriptName] = await this.executeDebugScript(tabId, scriptName);
      } catch (error) {
        results[scriptName] = { error: error.message };
      }
    }
    
    return results;
  }
}

// Create debug manager instance
const debugManager = new KeyPilotDebugManager();