// Options page script for KeyPilot Chrome Extension
// Handles settings persistence and UI management

document.addEventListener('DOMContentLoaded', function() {
  console.log('KeyPilot options page loaded');
  
  // Default settings values with validation schema
  const defaultSettings = {
    defaultEnabled: true,
    debugMode: false,
    version: '1.0.0'
  };
  
  // Settings validation schema
  const settingsSchema = {
    defaultEnabled: { type: 'boolean', default: true },
    debugMode: { type: 'boolean', default: false },
    version: { type: 'string', default: '1.0.0' }
  };
  
  // Storage retry configuration
  const STORAGE_CONFIG = {
    maxRetries: 3,
    retryDelay: 1000,
    fallbackToLocal: true
  };
  
  // Get DOM elements
  const defaultEnabledCheckbox = document.getElementById('defaultEnabled');
  const debugModeCheckbox = document.getElementById('debugMode');
  const saveButton = document.getElementById('saveButton');
  const resetButton = document.getElementById('resetButton');
  const statusMessage = document.getElementById('statusMessage');
  
  // Load current settings with enhanced error handling and validation
  async function loadSettings() {
    try {
      console.log('Loading settings...');
      
      // Try sync storage first
      let settings = await loadSettingsFromStorage('sync');
      
      if (!settings) {
        // Fallback to local storage
        console.warn('Sync storage failed, trying local storage');
        settings = await loadSettingsFromStorage('local');
      }
      
      if (!settings) {
        // Final fallback to defaults
        console.warn('All storage methods failed, using defaults');
        settings = { ...defaultSettings };
        showStatusMessage('Could not load saved settings. Using defaults.', 'warning');
      }
      
      // Validate and sanitize loaded settings
      const validatedSettings = validateSettings(settings);
      
      // Populate form fields with validated values
      defaultEnabledCheckbox.checked = validatedSettings.defaultEnabled;
      debugModeCheckbox.checked = validatedSettings.debugMode;
      
      console.log('Settings loaded and validated:', validatedSettings);
      
      // If we had to use defaults or local storage, try to save to sync storage
      if (settings === defaultSettings || !await testStorageAccess('sync')) {
        try {
          await saveSettingsWithRetry(validatedSettings);
          showStatusMessage('Settings synchronized successfully.', 'success');
        } catch (error) {
          console.warn('Could not sync settings to cloud storage:', error);
        }
      }
      
    } catch (error) {
      console.error('Critical error loading settings:', error);
      showStatusMessage('Critical error loading settings. Please refresh the page.', 'error');
      
      // Load defaults as final fallback
      defaultEnabledCheckbox.checked = defaultSettings.defaultEnabled;
      debugModeCheckbox.checked = defaultSettings.debugMode;
    }
  }
  
  // Load settings from specific storage type
  async function loadSettingsFromStorage(storageType) {
    try {
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const result = await storage.get(['keyPilotSettings']);
      
      if (chrome.runtime.lastError) {
        throw new Error(chrome.runtime.lastError.message);
      }
      
      return result.keyPilotSettings || null;
      
    } catch (error) {
      console.error(`Failed to load from ${storageType} storage:`, error);
      return null;
    }
  }
  
  // Test storage access
  async function testStorageAccess(storageType) {
    try {
      const storage = storageType === 'sync' ? chrome.storage.sync : chrome.storage.local;
      const testKey = 'keyPilotStorageTest';
      const testValue = { test: true, timestamp: Date.now() };
      
      await storage.set({ [testKey]: testValue });
      const result = await storage.get([testKey]);
      await storage.remove([testKey]);
      
      return result[testKey] && result[testKey].test === true;
    } catch (error) {
      console.error(`Storage test failed for ${storageType}:`, error);
      return false;
    }
  }
  
  // Validate settings against schema
  function validateSettings(settings) {
    const validated = { ...defaultSettings };
    
    for (const [key, schema] of Object.entries(settingsSchema)) {
      if (settings.hasOwnProperty(key)) {
        const value = settings[key];
        
        // Type validation
        if (typeof value === schema.type) {
          validated[key] = value;
        } else {
          console.warn(`Invalid type for setting ${key}: expected ${schema.type}, got ${typeof value}. Using default.`);
          validated[key] = schema.default;
        }
      }
    }
    
    // Always update version to current
    validated.version = chrome.runtime.getManifest().version;
    
    return validated;
  }
  
  // Save settings with enhanced error handling and retry logic
  async function saveSettings() {
    const settings = {
      defaultEnabled: defaultEnabledCheckbox.checked,
      debugMode: debugModeCheckbox.checked,
      version: chrome.runtime.getManifest().version
    };
    
    // Validate settings before saving
    const validatedSettings = validateSettings(settings);
    
    // Disable save button during save operation
    saveButton.disabled = true;
    saveButton.textContent = 'Saving...';
    
    try {
      // Save with retry logic
      await saveSettingsWithRetry(validatedSettings);
      
      console.log('Settings saved successfully:', validatedSettings);
      
      // Notify background service worker to sync settings across tabs
      try {
        await chrome.runtime.sendMessage({
          action: 'syncSettings',
          settings: validatedSettings
        });
        console.log('Settings sync requested successfully');
      } catch (syncError) {
        console.warn('Could not request settings sync:', syncError);
        showStatusMessage('Settings saved but sync failed. Other tabs may need refresh.', 'warning');
      }
      
      showStatusMessage('Settings saved successfully!', 'success');
      
    } catch (error) {
      console.error('Failed to save settings:', error);
      showStatusMessage(`Failed to save settings: ${error.message}`, 'error');
    } finally {
      // Re-enable save button
      saveButton.disabled = false;
      saveButton.textContent = 'Save Settings';
    }
  }
  
  // Save settings with retry logic and fallback
  async function saveSettingsWithRetry(settings) {
    for (let attempt = 1; attempt <= STORAGE_CONFIG.maxRetries; attempt++) {
      try {
        console.log(`Save attempt ${attempt}/${STORAGE_CONFIG.maxRetries}`);
        
        // Try sync storage first
        await chrome.storage.sync.set({ keyPilotSettings: settings });
        
        // Verify the save was successful
        const verification = await chrome.storage.sync.get(['keyPilotSettings']);
        if (verification.keyPilotSettings && 
            verification.keyPilotSettings.defaultEnabled === settings.defaultEnabled &&
            verification.keyPilotSettings.debugMode === settings.debugMode) {
          console.log('Settings saved and verified in sync storage');
          return true;
        } else {
          throw new Error('Settings verification failed');
        }
        
      } catch (error) {
        console.error(`Save attempt ${attempt} failed:`, error);
        
        if (attempt === STORAGE_CONFIG.maxRetries) {
          // Final attempt: try local storage as fallback
          if (STORAGE_CONFIG.fallbackToLocal) {
            try {
              await chrome.storage.local.set({ keyPilotSettings: settings });
              console.warn('Settings saved to local storage as fallback');
              return true;
            } catch (localError) {
              console.error('Local storage fallback also failed:', localError);
              throw new Error(`Failed to save settings after ${STORAGE_CONFIG.maxRetries} attempts. Last error: ${error.message}`);
            }
          } else {
            throw new Error(`Failed to save settings after ${STORAGE_CONFIG.maxRetries} attempts: ${error.message}`);
          }
        } else {
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, STORAGE_CONFIG.retryDelay));
        }
      }
    }
    
    return false;
  }
  
  // Reset settings to defaults with enhanced error handling
  async function resetToDefaults() {
    // Confirm with user before resetting
    if (!confirm('Are you sure you want to reset all settings to their default values?')) {
      return;
    }
    
    // Disable reset button during operation
    resetButton.disabled = true;
    resetButton.textContent = 'Resetting...';
    
    try {
      const resetSettings = { ...defaultSettings };
      resetSettings.version = chrome.runtime.getManifest().version;
      
      // Save reset settings with retry logic
      await saveSettingsWithRetry(resetSettings);
      
      // Update form fields to reflect defaults
      defaultEnabledCheckbox.checked = resetSettings.defaultEnabled;
      debugModeCheckbox.checked = resetSettings.debugMode;
      
      console.log('Settings reset to defaults:', resetSettings);
      
      // Notify background service worker to sync settings across tabs
      try {
        await chrome.runtime.sendMessage({
          action: 'syncSettings',
          settings: resetSettings
        });
        console.log('Settings reset sync requested successfully');
      } catch (syncError) {
        console.warn('Could not request settings sync after reset:', syncError);
        showStatusMessage('Settings reset but sync failed. Other tabs may need refresh.', 'warning');
      }
      
      showStatusMessage('Settings reset to defaults successfully!', 'success');
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      showStatusMessage(`Error resetting settings: ${error.message}`, 'error');
    } finally {
      // Re-enable reset button
      resetButton.disabled = false;
      resetButton.textContent = 'Reset to Defaults';
    }
  }
  
  // Show status message to user with enhanced styling
  function showStatusMessage(message, type = 'success') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
    
    // Different timeout durations based on message type
    let timeout = 3000;
    if (type === 'error') {
      timeout = 5000; // Errors stay longer
    } else if (type === 'warning') {
      timeout = 4000; // Warnings stay a bit longer
    }
    
    // Clear any existing timeout
    if (statusMessage.timeoutId) {
      clearTimeout(statusMessage.timeoutId);
    }
    
    // Set new timeout
    statusMessage.timeoutId = setTimeout(() => {
      statusMessage.textContent = '';
      statusMessage.className = 'status-message';
      statusMessage.timeoutId = null;
    }, timeout);
  }
  
  // Validate settings before saving
  function validateSettings() {
    // For now, all settings are boolean checkboxes, so validation is minimal
    // Future validation logic can be added here
    return true;
  }
  
  // Set up event listeners
  saveButton.addEventListener('click', function() {
    if (validateSettings()) {
      saveSettings();
    }
  });
  
  resetButton.addEventListener('click', resetToDefaults);
  
  // Auto-save when checkboxes change (optional UX improvement)
  defaultEnabledCheckbox.addEventListener('change', function() {
    // Show that settings have changed
    showStatusMessage('Settings changed. Click "Save Settings" to apply.', 'info');
  });
  
  debugModeCheckbox.addEventListener('change', function() {
    // Show that settings have changed
    showStatusMessage('Settings changed. Click "Save Settings" to apply.', 'info');
  });
  
  // Load settings when page loads
  loadSettings().catch(error => {
    console.error('Failed to load settings on page load:', error);
    showStatusMessage('Failed to load settings. Please refresh the page.', 'error');
  });
});

// Handle chrome.storage changes from other parts of the extension
chrome.storage.onChanged.addListener(function(changes, namespace) {
  if (namespace === 'sync' && changes.keyPilotSettings) {
    console.log('Settings changed externally:', changes.keyPilotSettings);
    
    // Update form fields to reflect external changes
    const newSettings = changes.keyPilotSettings.newValue;
    if (newSettings) {
      defaultEnabledCheckbox.checked = newSettings.defaultEnabled;
      debugModeCheckbox.checked = newSettings.debugMode;
      showStatusMessage('Settings updated from another source.', 'info');
    }
  }
});