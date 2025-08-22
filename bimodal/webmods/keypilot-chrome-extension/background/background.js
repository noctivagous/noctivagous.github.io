// Background service worker for KeyPilot Chrome Extension
// Handles extension lifecycle and cross-tab communication

console.log('KeyPilot background service worker loaded');

// Default settings configuration with versioning
const DEFAULT_SETTINGS = {
  defaultEnabled: true,
  debugMode: false,
  version: '1.0.0'
};

// Settings schema for validation and migration
const SETTINGS_SCHEMA = {
  defaultEnabled: { type: 'boolean', default: true },
  debugMode: { type: 'boolean', default: false },
  version: { type: 'string', default: '1.0.0' }
};

// Storage keys
const STORAGE_KEYS = {
  SETTINGS: 'keyPilotSettings',
  MIGRATION_STATUS: 'keyPilotMigrationStatus'
};

// Handle extension installation and updates
chrome.runtime.onInstalled.addListener((details) => {
  console.log('KeyPilot extension installed/updated:', details.reason);
  
  if (details.reason === 'install') {
    // Set default settings on first install
    initializeDefaultSettings();
  } else if (details.reason === 'update') {
    // Handle extension updates
    handleExtensionUpdate(details.previousVersion);
  }
});

// Initialize default settings with enhanced error handling and validation
async function initializeDefaultSettings() {
  try {
    debugLog('Initializing default settings...');
    
    // Check if settings already exist
    const existingSettings = await getStoredSettings();
    if (existingSettings && Object.keys(existingSettings).length > 0) {
      debugLog('Settings already exist, validating and merging with defaults');
      const validatedSettings = validateAndMergeSettings(existingSettings);
      await saveSettingsWithRetry(validatedSettings);
      return validatedSettings;
    }
    
    // Initialize with defaults
    const initialSettings = { ...DEFAULT_SETTINGS };
    await saveSettingsWithRetry(initialSettings);
    
    // Mark migration as complete for new installations
    await setMigrationStatus('1.0.0', true);
    
    debugLog('Default settings initialized successfully:', initialSettings);
    return initialSettings;
    
  } catch (error) {
    console.error('Failed to initialize default settings:', error);
    
    // Fallback: return defaults without storage (in-memory only)
    console.warn('Using in-memory default settings as fallback');
    return { ...DEFAULT_SETTINGS };
  }
}

// Validate and merge settings with defaults
function validateAndMergeSettings(settings) {
  const validatedSettings = { ...DEFAULT_SETTINGS };
  
  for (const [key, schema] of Object.entries(SETTINGS_SCHEMA)) {
    if (settings.hasOwnProperty(key)) {
      const value = settings[key];
      
      // Type validation
      if (typeof value === schema.type) {
        validatedSettings[key] = value;
      } else {
        console.warn(`Invalid type for setting ${key}: expected ${schema.type}, got ${typeof value}. Using default.`);
        validatedSettings[key] = schema.default;
      }
    }
  }
  
  // Always update version to current
  validatedSettings.version = chrome.runtime.getManifest().version;
  
  debugLog('Settings validated and merged:', validatedSettings);
  return validatedSettings;
}

// Get stored settings with error handling and fallback
async function getStoredSettings() {
  try {
    const result = await chrome.storage.sync.get([STORAGE_KEYS.SETTINGS]);
    return result[STORAGE_KEYS.SETTINGS] || null;
  } catch (error) {
    console.error('Failed to get stored settings:', error);
    
    // Try local storage as fallback
    try {
      const localResult = await chrome.storage.local.get([STORAGE_KEYS.SETTINGS]);
      if (localResult[STORAGE_KEYS.SETTINGS]) {
        console.warn('Using local storage fallback for settings');
        return localResult[STORAGE_KEYS.SETTINGS];
      }
    } catch (localError) {
      console.error('Local storage fallback also failed:', localError);
    }
    
    return null;
  }
}

// Save settings with retry logic and fallback
async function saveSettingsWithRetry(settings, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      debugLog(`Saving settings attempt ${attempt}/${maxRetries}:`, settings);
      
      // Try sync storage first
      await chrome.storage.sync.set({ [STORAGE_KEYS.SETTINGS]: settings });
      debugLog('Settings saved to sync storage successfully');
      return true;
      
    } catch (error) {
      console.error(`Settings save attempt ${attempt} failed:`, error);
      
      if (attempt === maxRetries) {
        // Final attempt: try local storage as fallback
        try {
          await chrome.storage.local.set({ [STORAGE_KEYS.SETTINGS]: settings });
          console.warn('Settings saved to local storage as fallback');
          return true;
        } catch (localError) {
          console.error('Local storage fallback also failed:', localError);
          throw new Error(`Failed to save settings after ${maxRetries} attempts: ${error.message}`);
        }
      } else {
        // Wait before retry with exponential backoff
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
        debugLog(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  return false;
}

// Migration status tracking
async function getMigrationStatus() {
  try {
    const result = await chrome.storage.local.get([STORAGE_KEYS.MIGRATION_STATUS]);
    return result[STORAGE_KEYS.MIGRATION_STATUS] || {};
  } catch (error) {
    console.error('Failed to get migration status:', error);
    return {};
  }
}

async function setMigrationStatus(version, completed) {
  try {
    const status = await getMigrationStatus();
    status[version] = { completed, timestamp: Date.now() };
    await chrome.storage.local.set({ [STORAGE_KEYS.MIGRATION_STATUS]: status });
    debugLog(`Migration status set for version ${version}:`, completed);
  } catch (error) {
    console.error('Failed to set migration status:', error);
  }
}

// Handle extension updates with comprehensive migration logic
async function handleExtensionUpdate(previousVersion) {
  try {
    const currentVersion = chrome.runtime.getManifest().version;
    console.log(`Updating from version ${previousVersion} to ${currentVersion}`);
    
    // Check if migration is needed and hasn't been completed
    const migrationStatus = await getMigrationStatus();
    if (migrationStatus[currentVersion]?.completed) {
      debugLog(`Migration for version ${currentVersion} already completed`);
      return;
    }
    
    // Get current settings with fallback handling
    const currentSettings = await getStoredSettings() || {};
    debugLog('Current settings before migration:', currentSettings);
    
    // Perform version-specific migrations
    const migratedSettings = await performMigrations(currentSettings, previousVersion, currentVersion);
    
    // Validate and merge with current defaults
    const finalSettings = validateAndMergeSettings(migratedSettings);
    
    // Save updated settings with retry logic
    const saveSuccess = await saveSettingsWithRetry(finalSettings);
    
    if (saveSuccess) {
      // Mark migration as completed
      await setMigrationStatus(currentVersion, true);
      console.log('Settings migrated successfully:', finalSettings);
      
      // Broadcast updated settings to all tabs
      await handleSettingsSync(finalSettings);
    } else {
      throw new Error('Failed to save migrated settings');
    }
    
  } catch (error) {
    console.error('Failed to handle extension update:', error);
    
    // Attempt to initialize with defaults as fallback
    try {
      console.warn('Attempting fallback initialization after migration failure');
      await initializeDefaultSettings();
    } catch (fallbackError) {
      console.error('Fallback initialization also failed:', fallbackError);
    }
  }
}

// Perform version-specific migrations
async function performMigrations(settings, fromVersion, toVersion) {
  let migratedSettings = { ...settings };
  
  debugLog(`Performing migrations from ${fromVersion} to ${toVersion}`);
  
  // Version-specific migration logic
  if (compareVersions(fromVersion, '1.0.0') < 0) {
    // Migration from pre-1.0.0 versions
    migratedSettings = await migrateToV1_0_0(migratedSettings);
  }
  
  // Future migrations can be added here
  // if (compareVersions(fromVersion, '1.1.0') < 0) {
  //   migratedSettings = await migrateToV1_1_0(migratedSettings);
  // }
  
  // Always update version
  migratedSettings.version = toVersion;
  
  debugLog('Migration completed:', migratedSettings);
  return migratedSettings;
}

// Migration to version 1.0.0
async function migrateToV1_0_0(settings) {
  debugLog('Migrating to version 1.0.0');
  
  // Ensure all required settings exist with proper types
  const migrated = {
    defaultEnabled: typeof settings.defaultEnabled === 'boolean' ? settings.defaultEnabled : false,
    debugMode: typeof settings.debugMode === 'boolean' ? settings.debugMode : false,
    version: '1.0.0'
  };
  
  // Remove any deprecated settings
  // (none for 1.0.0, but future migrations might need this)
  
  debugLog('V1.0.0 migration completed:', migrated);
  return migrated;
}

// Simple version comparison utility
function compareVersions(version1, version2) {
  const v1parts = version1.split('.').map(Number);
  const v2parts = version2.split('.').map(Number);
  
  for (let i = 0; i < Math.max(v1parts.length, v2parts.length); i++) {
    const v1part = v1parts[i] || 0;
    const v2part = v2parts[i] || 0;
    
    if (v1part < v2part) return -1;
    if (v1part > v2part) return 1;
  }
  
  return 0;
}

// Message Protocol Definition (matching popup and content)
const MESSAGE_TYPES = {
  // Popup to Content Script
  GET_STATUS: 'getStatus',
  TOGGLE: 'toggle',
  ENABLE: 'enable',
  DISABLE: 'disable',
  UPDATE_SETTINGS: 'updateSettings',
  
  // Content Script to Popup
  STATUS_UPDATE: 'statusUpdate',
  ERROR: 'error',
  
  // Background Messages
  SYNC_SETTINGS: 'syncSettings',
  GET_GLOBAL_SETTINGS: 'getGlobalSettings',
  STATUS_CHANGED: 'statusChanged',
  GET_ALL_TABS: 'getAllTabs'
};

const MESSAGE_SOURCES = {
  POPUP: 'popup',
  CONTENT: 'content',
  BACKGROUND: 'background'
};

// Debug logging for message flow
let debugMode = false;

// Initialize debug mode from settings
(async () => {
  try {
    const settings = await getGlobalSettings();
    debugMode = settings.debugMode || false;
  } catch (error) {
    console.warn('Could not initialize debug mode:', error);
  }
})();

function debugLog(message, data = null) {
  if (debugMode) {
    console.log(`[KeyPilot Background Debug] ${message}`, data || '');
  }
}

// Message wrapper with protocol validation
function createMessage(action, data = null, source = MESSAGE_SOURCES.BACKGROUND) {
  const message = {
    source,
    action,
    timestamp: Date.now(),
    id: Math.random().toString(36).substring(2, 11)
  };
  
  if (data !== null) {
    message.data = data;
  }
  
  debugLog('Creating message:', message);
  return message;
}

// Validate incoming message format
function validateMessage(message) {
  if (!message || typeof message !== 'object') {
    return { valid: false, error: 'Invalid message format' };
  }
  
  if (!message.source || !message.action || !message.timestamp) {
    return { valid: false, error: 'Missing required message fields' };
  }
  
  return { valid: true };
}

// Handle cross-tab messaging and coordination with enhanced protocol
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  debugLog('Background received message:', message);
  debugLog('Message sender:', sender);
  
  // Validate message format (allow legacy messages without validation)
  const validation = validateMessage(message);
  if (!validation.valid && message.source) {
    debugLog('Invalid message format:', validation.error);
    sendResponse(createMessage(MESSAGE_TYPES.ERROR, {
      error: validation.error,
      code: 'INVALID_MESSAGE'
    }));
    return;
  }
  
  // Handle different message types
  switch (message.action) {
    case MESSAGE_TYPES.SYNC_SETTINGS:
    case 'syncSettings': // Legacy support
      debugLog('Processing settings sync');
      handleSettingsSync(message.data || message.settings, sender.tab?.id);
      const syncResponse = message.source ? 
        createMessage('syncResponse', { success: true }) : 
        { success: true };
      sendResponse(syncResponse);
      break;
      
    case MESSAGE_TYPES.GET_GLOBAL_SETTINGS:
    case 'getGlobalSettings': // Legacy support
      debugLog('Processing global settings request');
      getGlobalSettings().then(settings => {
        // Update debug mode when settings are retrieved
        debugMode = settings.debugMode || false;
        
        const response = message.source ? 
          createMessage('settingsResponse', { success: true, settings }) : 
          { success: true, settings };
        sendResponse(response);
      }).catch(error => {
        debugLog('Failed to get global settings:', error.message);
        const errorResponse = message.source ? 
          createMessage(MESSAGE_TYPES.ERROR, {
            error: error.message,
            code: 'SETTINGS_ERROR'
          }) : 
          { success: false, error: error.message };
        sendResponse(errorResponse);
      });
      return true; // Async response
      
    case 'broadcastToTabs':
      debugLog('Processing broadcast to tabs');
      broadcastToAllTabs(message.data);
      const broadcastResponse = message.source ? 
        createMessage('broadcastResponse', { success: true }) : 
        { success: true };
      sendResponse(broadcastResponse);
      break;
      
    case MESSAGE_TYPES.STATUS_CHANGED:
      debugLog('Processing status change notification:', message.data);
      // Could be used for badge updates or other cross-tab coordination
      sendResponse(createMessage('statusChangeResponse', { success: true }));
      break;
      
    case MESSAGE_TYPES.GET_ALL_TABS:
    case 'getAllTabs': // Legacy support
      debugLog('Processing get all tabs request');
      getAllTabsAndWindows().then(tabsData => {
        const response = message.source ? 
          createMessage('tabsResponse', { success: true, tabsData }) : 
          { success: true, tabsData };
        sendResponse(response);
      }).catch(error => {
        debugLog('Failed to get tabs data:', error.message);
        const errorResponse = message.source ? 
          createMessage(MESSAGE_TYPES.ERROR, {
            error: error.message,
            code: 'TABS_ERROR'
          }) : 
          { success: false, error: error.message };
        sendResponse(errorResponse);
      });
      return true; // Async response
      
    case 'switchToTab':
      debugLog('Processing switch to tab request');
      if (message.tabId && message.windowId) {
        try {
          chrome.tabs.update(message.tabId, { active: true });
          chrome.windows.update(message.windowId, { focused: true });
          sendResponse({ success: true });
        } catch (error) {
          debugLog('Failed to switch tab:', error.message);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: 'Missing tabId or windowId' });
      }
      break;
      
    default:
      // Pass through other messages or handle legacy format
      debugLog('Unhandled message action:', message.action);
      const errorResponse = message.source ? 
        createMessage(MESSAGE_TYPES.ERROR, {
          error: 'Unknown action: ' + message.action,
          code: 'UNKNOWN_ACTION'
        }) : 
        { success: false, error: 'Unknown action' };
      sendResponse(errorResponse);
  }
  
  return false;
});

// Handle settings synchronization across tabs with enhanced error handling
async function handleSettingsSync(newSettings, excludeTabId) {
  try {
    debugLog('Synchronizing settings across tabs:', newSettings);
    
    // Get current stored settings with fallback handling
    const currentSettings = await getStoredSettings() || {};
    
    // Merge new settings with current ones
    const updatedSettings = {
      ...currentSettings,
      ...newSettings
    };
    
    // Validate merged settings
    const validatedSettings = validateAndMergeSettings(updatedSettings);
    
    // Update debug mode
    debugMode = validatedSettings.debugMode || false;
    
    // Save updated settings with retry logic
    const saveSuccess = await saveSettingsWithRetry(validatedSettings);
    
    if (!saveSuccess) {
      throw new Error('Failed to save synchronized settings');
    }
    
    // Broadcast to all tabs except the sender
    const tabs = await chrome.tabs.query({});
    const broadcastPromises = [];
    
    for (const tab of tabs) {
      if (tab.id !== excludeTabId && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        const broadcastPromise = (async () => {
          try {
            const message = createMessage(MESSAGE_TYPES.UPDATE_SETTINGS, validatedSettings);
            await chrome.tabs.sendMessage(tab.id, message);
            debugLog(`Settings sent to tab ${tab.id}`);
          } catch (error) {
            // Tab might not have content script loaded, ignore
            debugLog(`Could not send settings to tab ${tab.id}:`, error.message);
          }
        })();
        
        broadcastPromises.push(broadcastPromise);
      }
    }
    
    // Wait for all broadcasts to complete (with timeout)
    await Promise.allSettled(broadcastPromises);
    
    debugLog('Settings synchronized across tabs:', validatedSettings);
    return validatedSettings;
    
  } catch (error) {
    console.error('Failed to sync settings:', error);
    
    // Try to broadcast at least the new settings without storage update
    if (newSettings) {
      debugLog('Attempting emergency broadcast without storage update');
      await broadcastToAllTabs(createMessage(MESSAGE_TYPES.UPDATE_SETTINGS, newSettings));
    }
    
    throw error;
  }
}

// Get current global settings with enhanced error handling and fallback
async function getGlobalSettings() {
  try {
    debugLog('Getting global settings...');
    
    // Try to get settings from storage
    const storedSettings = await getStoredSettings();
    
    if (storedSettings) {
      // Validate and merge with defaults to ensure completeness
      const validatedSettings = validateAndMergeSettings(storedSettings);
      debugLog('Global settings retrieved and validated:', validatedSettings);
      return validatedSettings;
    } else {
      // No settings found, initialize defaults
      debugLog('No stored settings found, initializing defaults');
      return await initializeDefaultSettings();
    }
    
  } catch (error) {
    console.error('Failed to get global settings:', error);
    
    // Return defaults as final fallback
    console.warn('Using default settings as fallback');
    return { ...DEFAULT_SETTINGS };
  }
}

// Broadcast message to all tabs with content scripts using enhanced messaging
async function broadcastToAllTabs(messageData) {
  try {
    debugLog('Broadcasting to all tabs:', messageData);
    
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
        try {
          // Wrap in protocol message if not already wrapped
          const message = messageData.source ? messageData : createMessage('broadcast', messageData);
          await chrome.tabs.sendMessage(tab.id, message);
          debugLog(`Broadcast sent to tab ${tab.id}`);
        } catch (error) {
          // Tab might not have content script loaded, ignore
          debugLog(`Could not broadcast to tab ${tab.id}:`, error.message);
        }
      }
    }
  } catch (error) {
    debugLog('Failed to broadcast to tabs:', error.message);
  }
}

// Listen for storage changes and coordinate across tabs with enhanced messaging
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'sync' && changes.keyPilotSettings) {
    debugLog('Settings changed in storage:', changes.keyPilotSettings);
    
    // Update debug mode
    const newSettings = changes.keyPilotSettings.newValue;
    if (newSettings) {
      debugMode = newSettings.debugMode || false;
      
      // Broadcast settings change to all tabs
      const message = createMessage(MESSAGE_TYPES.UPDATE_SETTINGS, newSettings);
      broadcastToAllTabs(message);
    }
  }
});

// Handle tab updates to ensure settings are applied to new pages with enhanced messaging
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  // Only act when the page has finished loading and has a valid URL
  if (changeInfo.status === 'complete' && tab.url && (tab.url.startsWith('http://') || tab.url.startsWith('https://'))) {
    try {
      debugLog(`Tab ${tabId} finished loading: ${tab.url}`);
      
      // Give content script time to load
      setTimeout(async () => {
        try {
          const settings = await getGlobalSettings();
          const message = createMessage(MESSAGE_TYPES.UPDATE_SETTINGS, settings);
          await chrome.tabs.sendMessage(tabId, message);
          debugLog(`Settings sent to newly loaded tab ${tabId}`);
        } catch (error) {
          // Content script might not be ready yet, that's okay
          debugLog(`Could not send settings to tab ${tabId}:`, error.message);
        }
      }, 1000);
    } catch (error) {
      debugLog('Error handling tab update:', error.message);
    }
  }
});

// Get all tabs and windows data for tab overlay
async function getAllTabsAndWindows() {
  try {
    debugLog('Getting all tabs and windows...');
    
    const windows = await chrome.windows.getAll({ populate: true });
    const tabsData = windows.map(window => ({
      id: window.id,
      focused: window.focused,
      type: window.type,
      tabs: window.tabs.map(tab => ({
        id: tab.id,
        title: tab.title,
        url: tab.url,
        favIconUrl: tab.favIconUrl,
        active: tab.active,
        windowId: tab.windowId
      }))
    }));
    
    debugLog(`Retrieved ${windows.length} windows with ${windows.reduce((total, w) => total + w.tabs.length, 0)} total tabs`);
    return tabsData;
    
  } catch (error) {
    debugLog('Error getting tabs and windows:', error.message);
    throw error;
  }
}

console.log('KeyPilot background service worker initialized');