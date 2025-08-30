(function () {
const statusEl = document.getElementById('status');

class PopupToggleController {
    constructor() {
        this.toggleSwitch = null;
        this.toggleContainer = null;
        this.unavailableMessage = null;
        this.keyboardContainer = null;
        this.isInitialized = false;
        this.isUnavailable = false;
    }

    async initialize() {
        this.toggleSwitch = document.getElementById('extension-toggle');
        this.toggleContainer = document.getElementById('toggle-container');
        this.unavailableMessage = document.getElementById('unavailable-message');
        this.keyboardContainer = document.querySelector('.keyboard-container');
        
        if (!this.toggleSwitch || !this.toggleContainer || !this.unavailableMessage) {
            console.error('Required popup elements not found');
            return;
        }

        // Check if extension is available on current page
        await this.checkAvailability();

        if (this.isUnavailable) {
            this.showUnavailableState();
            return;
        }

        // Query current state from service worker
        try {
            const response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
            const enabled = response && response.enabled !== undefined ? response.enabled : true;
            this.updateToggleState(enabled);
        } catch (error) {
            console.error('Failed to get initial state:', error);
            // Default to enabled if service worker is not available
            this.updateToggleState(true);
        }

        // Set up event listener for toggle clicks
        this.toggleSwitch.addEventListener('change', this.handleToggleClick.bind(this));

        // Listen for state changes from service worker
        chrome.runtime.onMessage.addListener((message) => {
            if (message && message.type === 'KP_STATE_CHANGED') {
                this.updateToggleState(message.enabled);
            }
        });

        this.isInitialized = true;
    }

    async handleToggleClick() {
        if (!this.isInitialized || this.isUnavailable) return;

        const enabled = this.toggleSwitch.checked;
        
        try {
            // Send toggle command to service worker
            await chrome.runtime.sendMessage({ 
                type: 'KP_SET_STATE', 
                enabled: enabled 
            });
        } catch (error) {
            console.error('Failed to set extension state:', error);
            // Revert toggle state on error
            this.toggleSwitch.checked = !enabled;
        }
    }

    async checkAvailability() {
        try {
            const tab = await queryActiveTab();
            if (!tab || !tab.url) {
                this.isUnavailable = true;
                return;
            }

            // Check for restricted URLs where content scripts can't run
            const restrictedPatterns = [
                /^chrome:\/\//,
                /^chrome-extension:\/\//,
                /^moz-extension:\/\//,
                /^edge:\/\//,
                /^about:/,
                /^file:\/\//,
                /^data:/,
                /^javascript:/
            ];

            this.isUnavailable = restrictedPatterns.some(pattern => pattern.test(tab.url));
        } catch (error) {
            console.error('Failed to check availability:', error);
            this.isUnavailable = true;
        }
    }

    showUnavailableState() {
        this.toggleContainer.style.display = 'none';
        this.unavailableMessage.style.display = 'flex';
        
        if (this.keyboardContainer) {
            this.keyboardContainer.classList.add('unavailable');
        }
        
        // Update status to show unavailable
        setStatus('unavailable', false);
    }

    updateToggleState(enabled) {
        if (this.toggleSwitch && !this.isUnavailable) {
            this.toggleSwitch.checked = enabled;
        }
    }
}

// Initialize toggle controller
const toggleController = new PopupToggleController();

const statusElement = document.getElementById('status');
const toggleButton = document.getElementById('toggle');
const settingsButton = document.getElementById('settings');
const extensionToggle = document.getElementById('extension-toggle');
const toggleContainer = document.getElementById('toggle-container');
const unavailableMessage = document.getElementById('unavailable-message');

let currentTab = null;

// Initialize popup
async function initializePopup() {
  try {
    // Get current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    currentTab = tab;
    
    // Check if KeyPilot can run on this tab
    if (!canRunOnTab(tab)) {
      showUnavailable();
      return;
    }
    
    // Query the current state from the content script
    const response = await chrome.tabs.sendMessage(tab.id, { type: 'KP_GET_STATUS' });
    
    if (response && response.mode) {
      updateUI(response.mode, true);
    } else {
      // Fallback: query service worker
      const serviceWorkerResponse = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      const isEnabled = serviceWorkerResponse?.enabled ?? true;
      updateUI(isEnabled ? 'normal' : 'disabled', isEnabled);
    }
    
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    // Show as disabled if we can't determine state
    updateUI('disabled', false);
  }
}

// Check if KeyPilot can run on the current tab
function canRunOnTab(tab) {
  if (!tab || !tab.url) return false;
  
  const url = tab.url.toLowerCase();
  
  // Cannot run on Chrome internal pages
  if (url.startsWith('chrome://') || 
      url.startsWith('chrome-extension://') ||
      url.startsWith('moz-extension://') ||
      url.startsWith('edge://') ||
      url.startsWith('about:')) {
    return false;
  }
  
  // Cannot run on Chrome Web Store
  if (url.includes('chrome.google.com/webstore')) {
    return false;
  }
  
  return true;
}

// Show unavailable state
function showUnavailable() {
  toggleContainer.style.display = 'none';
  unavailableMessage.style.display = 'block';
  statusElement.textContent = 'UNAVAILABLE';
  statusElement.className = 'pill unavailable';
  
  // Disable toggle button
  toggleButton.disabled = true;
  toggleButton.textContent = 'Not Available on This Page';
  toggleButton.style.opacity = '0.5';
  
  // Disable settings button
  if (settingsButton) {
    settingsButton.disabled = true;
    settingsButton.style.opacity = '0.5';
  }
}

// Update UI based on current mode and enabled state
function updateUI(mode, isEnabled) {
  // Update toggle switch
  extensionToggle.checked = isEnabled;
  
  // Update status pill
  if (isEnabled) {
    statusElement.textContent = 'ON';
    statusElement.className = 'pill ok';
  } else {
    statusElement.textContent = 'OFF';
    statusElement.className = 'pill off';
  }
  
  // Update toggle button
  if (isEnabled) {
    toggleButton.textContent = 'Disable KeyPilot';
    toggleButton.className = 'toggle-btn disabled';
  } else {
    toggleButton.textContent = 'Enable KeyPilot';
    toggleButton.className = 'toggle-btn';
  }
  
  // Update mode display (if status elements exist)
  const statusTextElement = document.getElementById('status-text');
  const modeElement = document.getElementById('mode');
  
  if (statusTextElement) {
    statusTextElement.textContent = isEnabled ? 'KeyPilot Enabled' : 'KeyPilot Disabled';
  }
  
  if (modeElement && isEnabled) {
    const modeText = getModeDisplayText(mode);
    modeElement.textContent = modeText ? `Mode: ${modeText}` : '';
  } else if (modeElement) {
    modeElement.textContent = '';
  }
}

// Get display text for mode
function getModeDisplayText(mode) {
  const modeMap = {
    'normal': 'Navigation',
    'text_focus': 'Text Focus',
    'highlight': 'Text Selection',
    'rectangle_highlight': 'Rectangle Selection',
    'delete': 'Delete Mode',
    'disabled': 'Disabled'
  };
  
  return modeMap[mode] || mode;
}

// Handle toggle switch change
extensionToggle.addEventListener('change', async (e) => {
  const isEnabled = e.target.checked;
  await toggleExtension(isEnabled);
});

// Handle toggle button click
toggleButton.addEventListener('click', async () => {
  const isCurrentlyEnabled = extensionToggle.checked;
  await toggleExtension(!isCurrentlyEnabled);
});

// Handle settings button click
if (settingsButton) {
  settingsButton.addEventListener('click', async () => {
    try {
      if (!currentTab) return;
      
      // Send message to content script to open settings
      await chrome.tabs.sendMessage(currentTab.id, {
        type: 'KP_OPEN_SETTINGS'
      });
      
      // Close popup after opening settings
      window.close();
      
    } catch (error) {
      console.error('Failed to open settings:', error);
      
      // Fallback: open options page if available
      try {
        chrome.runtime.openOptionsPage();
      } catch (optionsError) {
        console.error('No options page available:', optionsError);
      }
    }
  });
}

// Toggle extension state
async function toggleExtension(enabled) {
  try {
    if (!currentTab) return;
    
    // Send toggle message to content script
    await chrome.tabs.sendMessage(currentTab.id, {
      type: 'KP_TOGGLE_STATE',
      enabled: enabled
    });
    
    // Also notify service worker
    await chrome.runtime.sendMessage({
      type: 'KP_SET_STATE',
      enabled: enabled
    });
    
    // Update UI immediately
    updateUI(enabled ? 'normal' : 'disabled', enabled);
    
  } catch (error) {
    console.error('Failed to toggle extension:', error);
    // Revert toggle switch on error
    extensionToggle.checked = !enabled;
  }
}

// Listen for status updates from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'KP_STATUS' && sender.tab?.id === currentTab?.id) {
    updateUI(message.mode, message.mode !== 'disabled');
  }
});

// Initialize when popup opens
initializePopup();

function setStatus(mode, extensionEnabled = true) {
    if (mode === 'unavailable') {
        statusEl.textContent = 'UNAVAILABLE';
        statusEl.classList.remove('ok', 'warn', 'err');
        statusEl.classList.add('unavailable');
    } else if (!extensionEnabled) {
        statusEl.textContent = 'OFF';
        statusEl.classList.remove('ok', 'warn', 'unavailable');
        statusEl.classList.add('err');
    } else if (mode === 'delete') {
        statusEl.textContent = 'DELETE';
        statusEl.classList.remove('ok', 'warn', 'unavailable');
        statusEl.classList.add('err');
    } else if (mode === 'text_focus') {
        statusEl.textContent = 'TEXT';
        statusEl.classList.remove('ok', 'err', 'unavailable');
        statusEl.classList.add('warn');
    } else {
        statusEl.textContent = 'ON';
        statusEl.classList.remove('err', 'warn', 'unavailable');
        statusEl.classList.add('ok');
    }
}

async function queryActiveTab() {
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
return tab;
}

async function getStatus() {
    // If extension is unavailable on this page, don't try to get status
    if (toggleController.isUnavailable) {
        return setStatus('unavailable', false);
    }

    try {
        // First check if extension is globally enabled
        let extensionEnabled = true;
        try {
            const stateResponse = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
            extensionEnabled = stateResponse && stateResponse.enabled !== undefined ? stateResponse.enabled : true;
        } catch (error) {
            console.error('Failed to get extension state:', error);
        }

        // If extension is disabled globally, show OFF status
        if (!extensionEnabled) {
            return setStatus('none', false);
        }

        // If extension is enabled, get the current mode from content script
        const tab = await queryActiveTab();
        if (!tab || !tab.id) return setStatus('none', true);
        
        const resp = await chrome.tabs.sendMessage(tab.id, { type: 'KP_GET_STATUS' });
        setStatus(resp && resp.mode || 'none', true);
    } catch (e) {
        // Content script may not be injected yet (e.g., chrome:// pages). 
        // Check extension state and show appropriate status
        try {
            const stateResponse = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
            const extensionEnabled = stateResponse && stateResponse.enabled !== undefined ? stateResponse.enabled : true;
            setStatus('none', extensionEnabled);
        } catch (error) {
            // If service worker is not available, assume enabled
            setStatus('none', true);
        }
    }
}


// Listen for push updates from the content script while the popup is open
chrome.runtime.onMessage.addListener((msg) => {
    if (toggleController.isUnavailable) {
        return; // Don't process messages if extension is unavailable
    }

    if (msg && msg.type === 'KP_STATUS') {
        // When receiving status updates, check if extension is still enabled
        chrome.runtime.sendMessage({ type: 'KP_GET_STATE' }).then(response => {
            const extensionEnabled = response && response.enabled !== undefined ? response.enabled : true;
            setStatus(msg.mode, extensionEnabled);
        }).catch(() => {
            // If service worker is not available, assume enabled
            setStatus(msg.mode, true);
        });
    } else if (msg && msg.type === 'KP_STATE_CHANGED') {
        // Extension toggle state changed, refresh status
        getStatus();
    }
});


getStatus();
toggleController.initialize();
})();
