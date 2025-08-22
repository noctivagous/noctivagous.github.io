// Popup script for KeyPilot Chrome Extension
// Handles communication with content script and UI updates

// Message Protocol Definition
const MESSAGE_TYPES = {
  // Popup to Content Script
  GET_STATUS: 'getStatus',
  TOGGLE: 'toggle',
  ENABLE: 'enable',
  DISABLE: 'disable',
  UPDATE_SETTINGS: 'updateSettings',
  GET_HUD_INFO: 'getHudInfo',
  TOGGLE_HUD: 'toggleHud',
  EXPAND_HUD: 'expandHud',
  COMPACT_HUD: 'compactHud',
  SHOW_HUD: 'showHud',
  HIDE_HUD: 'hideHud',
  
  // Content Script to Popup
  STATUS_UPDATE: 'statusUpdate',
  HUD_UPDATE: 'hudUpdate',
  ERROR: 'error',
  
  // Background Messages
  SYNC_SETTINGS: 'syncSettings',
  GET_GLOBAL_SETTINGS: 'getGlobalSettings'
};

const MESSAGE_SOURCES = {
  POPUP: 'popup',
  CONTENT: 'content',
  BACKGROUND: 'background'
};

// Debug logging for message flow
let debugMode = false;

function debugLog(message, data = null) {
  if (debugMode) {
    console.log(`[KeyPilot Popup Debug] ${message}`, data || '');
  }
}

// Message wrapper with protocol validation
function createMessage(action, data = null, source = MESSAGE_SOURCES.POPUP) {
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

document.addEventListener('DOMContentLoaded', async function() {
  console.log('KeyPilot popup loaded');
  
  // Check if debug mode is enabled
  try {
    const result = await chrome.storage.sync.get(['keyPilotSettings']);
    if (result.keyPilotSettings?.debugMode) {
      debugMode = true;
      debugLog('Debug mode enabled for popup');
    }
  } catch (error) {
    console.warn('Could not check debug mode setting:', error);
  }
  
  const toggleButton = document.getElementById('toggleButton');
  const optionsLink = document.getElementById('optionsLink');
  
  // HUD info elements
  const hudInfo = document.getElementById('hudInfo');
  const hudMode = document.getElementById('hudMode');
  const hudSelected = document.getElementById('hudSelected');
  const hudVisibility = document.getElementById('hudVisibility');
  const toggleHudBtn = document.getElementById('toggleHudBtn');
  const expandHudBtn = document.getElementById('expandHudBtn');
  const refreshHudBtn = document.getElementById('refreshHudBtn');
  
  // Get current active tab
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }
  
  // Check if tab is valid for content script injection
  function isValidTab(tab) {
    if (!tab || !tab.url) return false;
    const url = tab.url.toLowerCase();
    return url.startsWith('http://') || url.startsWith('https://');
  }
  
  // Enhanced message sending with comprehensive error handling
  async function sendMessageToContent(action, data = null, retries = 3) {
    const message = createMessage(action, data);
    debugLog('Sending message to content script:', message);
    
    try {
      const tab = await getCurrentTab();
      
      if (!isValidTab(tab)) {
        const error = 'KeyPilot only works on http:// and https:// pages';
        debugLog('Invalid tab error:', error);
        return { error, code: 'INVALID_TAB' };
      }
      
      debugLog(`Attempting to send message to tab ${tab.id} (${tab.url})`);
      
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          debugLog(`Message attempt ${attempt}/${retries}`);
          
          const response = await chrome.tabs.sendMessage(tab.id, message);
          
          // Validate response format
          const validation = validateMessage(response);
          if (!validation.valid) {
            debugLog('Invalid response format:', validation.error);
            throw new Error(`Invalid response: ${validation.error}`);
          }
          
          debugLog('Received valid response:', response);
          
          // Check for error in response
          if (response.error) {
            return { 
              error: response.error, 
              code: response.code || 'CONTENT_ERROR',
              source: response.source 
            };
          }
          
          return response;
          
        } catch (error) {
          debugLog(`Attempt ${attempt} failed:`, error.message);
          
          // Categorize error types
          let errorCode = 'UNKNOWN_ERROR';
          if (error.message.includes('Could not establish connection')) {
            errorCode = 'NO_CONNECTION';
          } else if (error.message.includes('receiving end does not exist')) {
            errorCode = 'NO_RECEIVER';
          } else if (error.message.includes('message port closed')) {
            errorCode = 'PORT_CLOSED';
          }
          
          if (attempt < retries) {
            // Exponential backoff for retries
            const delay = Math.min(100 * Math.pow(2, attempt - 1), 1000);
            debugLog(`Retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          } else {
            debugLog('All retry attempts failed');
            return { 
              error: error.message, 
              code: errorCode,
              attempts: retries 
            };
          }
        }
      }
    } catch (error) {
      debugLog('Critical error in sendMessageToContent:', error);
      return { 
        error: error.message, 
        code: 'CRITICAL_ERROR' 
      };
    }
  }
  
  // Update UI based on keyPilot status with enhanced error display
  function updateUI(status, debug = false, error = null) {
    debugLog('Updating UI:', { status, debug, error });
    
    if (error) {
      toggleButton.textContent = getErrorButtonText(error);
      toggleButton.disabled = true;
      toggleButton.style.backgroundColor = '#6c757d';
      updateHUDInfo({ error: true, message: getErrorMessage(error) });
      return;
    }
    
    if (status === 'enabled') {
      toggleButton.textContent = 'Disable KeyPilot';
      toggleButton.style.backgroundColor = '#dc3545';
      toggleButton.disabled = false;
      updateHUDInfo({ status: 'enabled', debug });
    } else if (status === 'disabled') {
      toggleButton.textContent = 'Enable KeyPilot';
      toggleButton.style.backgroundColor = '#28a745';
      toggleButton.disabled = false;
      updateHUDInfo({ status: 'disabled' });
    } else {
      toggleButton.textContent = 'Toggle KeyPilot';
      toggleButton.disabled = true;
      toggleButton.style.backgroundColor = '#6c757d';
      updateHUDInfo({ status: 'loading' });
    }
  }
  
  // Get user-friendly error messages
  function getErrorMessage(error) {
    const code = error.code || 'UNKNOWN_ERROR';
    
    switch (code) {
      case 'INVALID_TAB':
        return 'Not available on this page';
      case 'NO_CONNECTION':
      case 'NO_RECEIVER':
        return 'Content script not loaded';
      case 'PORT_CLOSED':
        return 'Connection lost';
      case 'CONTENT_ERROR':
        return `Error: ${error.error}`;
      default:
        return `Error: ${error.error || 'Unknown error'}`;
    }
  }
  
  // Get appropriate button text for errors
  function getErrorButtonText(error) {
    const code = error.code || 'UNKNOWN_ERROR';
    
    switch (code) {
      case 'INVALID_TAB':
        return 'Not Available';
      case 'NO_CONNECTION':
      case 'NO_RECEIVER':
        return 'Reload Page';
      case 'PORT_CLOSED':
        return 'Reconnect';
      default:
        return 'Error';
    }
  }
  
  // Update HUD info display
  function updateHUDInfo(info) {
    const hudMode = document.getElementById('hudMode');
    const hudSelected = document.getElementById('hudSelected');
    const hudVisibility = document.getElementById('hudVisibility');
    
    if (info.error) {
      hudMode.textContent = 'Error';
      hudSelected.textContent = '0';
      hudVisibility.textContent = 'Hidden';
      return;
    }
    
    // Update mode based on current state
    if (info.mode === 'delete') {
      hudMode.textContent = 'Delete Mode';
    } else if (info.mode === 'highlight') {
      hudMode.textContent = `Select Mode (${info.selectedCount || 0})`;
    } else {
      hudMode.textContent = info.debug ? 'Debug Mode' : 'Ready';
    }
    
    // Update selected count
    hudSelected.textContent = info.selectedCount || 0;
    
    // Update HUD visibility
    hudVisibility.textContent = info.hudVisible ? 'Visible' : 'Hidden';
    
    // Update status details if available
    if (info.statusTitle && info.statusDetail) {
      const statusTitle = document.getElementById('hudStatusTitle');
      const statusDetail = document.getElementById('hudStatusDetail');
      if (statusTitle) statusTitle.textContent = info.statusTitle;
      if (statusDetail) statusDetail.textContent = info.statusDetail;
    }
  }
  
  // Query current status from content script with enhanced error handling
  async function queryStatus() {
    debugLog('Querying status from content script');
    
    const tab = await getCurrentTab();
    
    if (!isValidTab(tab)) {
      const error = { code: 'INVALID_TAB', error: 'Invalid tab' };
      updateUI(null, false, error);
      return;
    }
    
    const response = await sendMessageToContent(MESSAGE_TYPES.GET_STATUS);
    
    if (response && !response.error) {
      debugLog('Status query successful:', response);
      updateUI(response.data?.status || response.status, response.data?.debug || response.debug);
    } else {
      debugLog('Status query failed:', response);
      updateUI(null, false, response);
    }
  }
  
  // Query HUD info from content script
  async function queryHUDInfo() {
    debugLog('Querying HUD info from content script');
    
    const tab = await getCurrentTab();
    
    if (!isValidTab(tab)) {
      return;
    }
    
    const response = await sendMessageToContent(MESSAGE_TYPES.GET_HUD_INFO);
    
    if (response && !response.error) {
      debugLog('HUD info query successful:', response);
      updateHUDInfo(response.data || response);
    } else {
      debugLog('HUD info query failed:', response);
    }
  }
  
  // Handle toggle button click with enhanced error handling
  toggleButton.addEventListener('click', async function() {
    const originalText = toggleButton.textContent;
    debugLog('Toggle button clicked, original text:', originalText);
    
    // Handle error states
    if (originalText === 'Reload Page') {
      debugLog('Reload page instruction');
     // statusText.textContent = 'Please reload the page first';
      return;
    }
    
    if (originalText === 'Not Available' || originalText === 'Error') {
      debugLog('Button in error state, ignoring click');
      return;
    }
    
    // Set working state
    toggleButton.disabled = true;
    toggleButton.textContent = 'Working...';
    //statusText.textContent = 'Processing...';
    
    try {
      const response = await sendMessageToContent(MESSAGE_TYPES.TOGGLE);
      
      if (response && !response.error) {
        debugLog('Toggle successful:', response);
        const status = response.data?.status || response.status;
        const debug = response.data?.debug || response.debug;
        updateUI(status, debug);
        
        // Broadcast status change to background for cross-tab sync
        try {
          await chrome.runtime.sendMessage(createMessage('statusChanged', { status, debug }));
        } catch (error) {
          debugLog('Failed to notify background of status change:', error);
        }
        
      } else {
        debugLog('Toggle failed:', response);
        updateUI(null, false, response);
      }
    } catch (error) {
      debugLog('Critical error during toggle:', error);
      updateUI(null, false, { error: error.message, code: 'CRITICAL_ERROR' });
    }
  });
  
  // Handle options link click
  optionsLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.runtime.openOptionsPage();
    window.close();
  });
  
  // Handle HUD control buttons
  if (toggleHudBtn) {
    toggleHudBtn.addEventListener('click', async function() {
      const response = await sendMessageToContent(MESSAGE_TYPES.TOGGLE_HUD);
      if (response && !response.error) {
        await queryHUDInfo(); // Refresh HUD info after toggle
      }
    });
  }
  
  if (expandHudBtn) {
    expandHudBtn.addEventListener('click', async function() {
      const response = await sendMessageToContent(MESSAGE_TYPES.EXPAND_HUD);
      if (response && !response.error) {
        await queryHUDInfo(); // Refresh HUD info after expand
      }
    });
  }
  
  if (refreshHudBtn) {
    refreshHudBtn.addEventListener('click', async function() {
      await queryHUDInfo(); // Manually refresh HUD info
    });
  }
  
  // Handle test page link click
  const testPageLink = document.getElementById('testPageLink');
  testPageLink.addEventListener('click', function(e) {
    e.preventDefault();
    chrome.tabs.create({
      url: chrome.runtime.getURL('test-extension-context.html')
    });
    window.close();
  });
  
  // Listen for status updates from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    debugLog('Popup received message:', message);
    
    const validation = validateMessage(message);
    if (!validation.valid) {
      debugLog('Invalid message received:', validation.error);
      return;
    }
    
    switch (message.action) {
      case MESSAGE_TYPES.STATUS_UPDATE:
        debugLog('Received status update:', message.data);
        if (message.data) {
          updateUI(message.data.status, message.data.debug);
          // Also query HUD info to keep it in sync
          setTimeout(() => queryHUDInfo(), 100);
        }
        break;
        
      case MESSAGE_TYPES.ERROR:
        debugLog('Received error from content script:', message.data);
        updateUI(null, false, message.data);
        break;
        
      default:
        debugLog('Unhandled message action:', message.action);
    }
  });
  
  // Initialize popup by querying current status and HUD info
  await queryStatus();
  await queryHUDInfo();
  
  console.log('KeyPilot popup initialized');
  debugLog('Popup initialization complete');
});