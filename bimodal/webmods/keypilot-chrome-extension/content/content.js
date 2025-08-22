// Content script for KeyPilot Chrome Extension
// Manages keyPilot lifecycle and communication with popup/background

(function () {
  'use strict';

  console.log('KeyPilot content script loaded');

  // ---------------- Message Protocol ----------------
  const MESSAGE_TYPES = {
    // Popup → Content
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

    // Content → Popup
    STATUS_UPDATE: 'statusUpdate',
    HUD_UPDATE: 'hudUpdate',
    ERROR: 'error',

    // Background
    SYNC_SETTINGS: 'syncSettings',
    GET_GLOBAL_SETTINGS: 'getGlobalSettings'
  };

  const MESSAGE_SOURCES = {
    POPUP: 'popup',
    CONTENT: 'content',
    BACKGROUND: 'background'
  };

  // ---------------- Debug logging ----------------
  let debugMode = false;
  function debugLog(message, data = null) {
    if (debugMode) console.log(`[KeyPilot Content Debug] ${message}`, data ?? '');
  }

  // ---------------- Messaging helpers ----------------
  function createMessage(action, data = null, source = MESSAGE_SOURCES.CONTENT) {
    const msg = { source, action, timestamp: Date.now(), id: Math.random().toString(36).slice(2, 11) };
    if (data !== null) msg.data = data;
    debugLog('Creating message:', msg);
    return msg;
  }

  function validateMessage(msg) {
    if (!msg || typeof msg !== 'object') return { valid: false, error: 'Invalid message format' };
    if (!msg.source || !msg.action || !msg.timestamp) return { valid: false, error: 'Missing required message fields' };
    return { valid: true };
  }

  async function sendMessageToPopup(action, data = null) {
    const msg = createMessage(action, data);
    debugLog('Sending message to popup:', msg);
    try {
      await chrome.runtime.sendMessage(msg);
      debugLog('Message sent to popup successfully');
    } catch (error) {
      debugLog('Failed to send message to popup:', error.message);
      // Popup may be closed — acceptable
    }
  }

  async function sendErrorToPopup(error, code = 'CONTENT_ERROR') {
    await sendMessageToPopup(MESSAGE_TYPES.ERROR, { error, code });
  }

  // ---------------- Settings ----------------
  const defaultSettings = {
    defaultEnabled: false,
    debugMode: false,
    hoverMode: 'clickable', // 'clickable' | 'any'
    version: '1.1.0'
  };

  let keyPilotEnabled = false;
  let currentSettings = { ...defaultSettings };

  const TAB_STATE_KEY = 'keyPilotTabState_' + window.location.hostname;

  function saveTabState() {
    try {
      sessionStorage.setItem(TAB_STATE_KEY, JSON.stringify({ enabled: keyPilotEnabled, timestamp: Date.now() }));
      debugLog('Tab state saved:', { enabled: keyPilotEnabled });
    } catch (error) {
      debugLog('Failed to save tab state:', error.message);
    }
  }

  function loadTabState() {
    try {
      const saved = sessionStorage.getItem(TAB_STATE_KEY);
      if (saved) {
        const state = JSON.parse(saved);
        if (state.timestamp && (Date.now() - state.timestamp) < 3600000) {
          debugLog('Tab state loaded:', state);
          return !!state.enabled;
        }
      }
    } catch (error) {
      debugLog('Failed to load tab state:', error.message);
    }
    return null;
  }

  // ---------------- Core access ----------------
  function waitForKeyPilotCore() {
    return new Promise((resolve) => {
      if (window.__KeyPilotExtensionCore) return resolve(window.__KeyPilotExtensionCore);
      const int = setInterval(() => {
        if (window.__KeyPilotExtensionCore) {
          clearInterval(int);
          resolve(window.__KeyPilotExtensionCore);
        }
      }, 10);
      setTimeout(() => {
        clearInterval(int);
        console.error('[KeyPilot Extension] Core failed to load within timeout');
        resolve(null);
      }, 5000);
    });
  }

  // ---------------- Settings load ----------------
  async function loadSettings() {
    debugLog('Loading settings…');
    try {
      // Try sync storage
      try {
        const data = await chrome.storage.sync.get(['keyPilotSettings']);
        if (data && data.keyPilotSettings) {
          currentSettings = { ...defaultSettings, ...data.keyPilotSettings };
          debugMode = !!currentSettings.debugMode;
          debugLog('Loaded settings from chrome.storage.sync:', currentSettings);
          return;
        }
      } catch (e1) {
        debugLog('chrome.storage.sync get failed:', e1.message);
      }

      // Try local storage
      try {
        const data = await chrome.storage.local.get(['keyPilotSettings']);
        if (data && data.keyPilotSettings) {
          currentSettings = { ...defaultSettings, ...data.keyPilotSettings };
          debugMode = !!currentSettings.debugMode;
          debugLog('Loaded settings from chrome.storage.local:', currentSettings);
          return;
        }
      } catch (e2) {
        debugLog('chrome.storage.local get failed:', e2.message);
      }

      // Fallback to defaults and attempt to initialize storage
      debugLog('Using defaults and initializing storage');
      currentSettings = { ...defaultSettings };
      debugMode = !!currentSettings.debugMode;
      try {
        await chrome.storage.sync.set({ keyPilotSettings: currentSettings });
        debugLog('Default settings initialized in storage');
      } catch (initErr) {
        debugLog('Failed to initialize storage with defaults:', initErr.message);
      }
    } catch (fatal) {
      debugLog('Critical error in loadSettings:', fatal.message);
      currentSettings = { ...defaultSettings };
      debugMode = false;
      await sendErrorToPopup(`Settings loading failed, using defaults: ${fatal.message}`, 'SETTINGS_FALLBACK');
    }
    debugLog('Final settings state:', currentSettings);
  }

  // ---------------- Initialization ----------------
  async function initializeKeyPilot() {
    debugLog('Initializing keyPilot.');

    const core = await waitForKeyPilotCore();
    if (!core) {
      const error = 'KeyPilot core not available, cannot initialize';
      debugLog(error);
      await sendErrorToPopup(error, 'CORE_UNAVAILABLE');
      return;
    }

    try {
      // Apply settings to core
      if (currentSettings.debugMode) {
        core.setDebug(true);
        debugLog('Debug mode enabled for keyPilot core');
      }
      if (currentSettings.hoverMode) {
        core.setHoverMode(currentSettings.hoverMode);
        debugLog('Hover mode applied:', currentSettings.hoverMode);
      }

      // Determine initial enablement
      const savedTabState = loadTabState();
      let shouldEnable = currentSettings.defaultEnabled;

      if (savedTabState !== null) {
        shouldEnable = savedTabState;
        debugLog('Using per-tab override:', shouldEnable ? 'enabled' : 'disabled');
      } else {
        debugLog('Using global setting:', shouldEnable ? 'enabled' : 'disabled');
      }

      if (shouldEnable) {
        core.enable();
        keyPilotEnabled = true;
        saveTabState();

        const status = core.getStatus();
        await sendMessageToPopup(MESSAGE_TYPES.STATUS_UPDATE, {
          status: status.enabled ? 'enabled' : 'disabled',
          debug: status.debug,
          hoverMode: status.hoverMode
        });
      } else {
        await sendMessageToPopup(MESSAGE_TYPES.STATUS_UPDATE, {
          status: 'disabled',
          debug: currentSettings.debugMode,
          hoverMode: currentSettings.hoverMode
        });
      }

      debugLog('KeyPilot initialization complete');
    } catch (error) {
      debugLog('Error during keyPilot initialization:', error.message);
      await sendErrorToPopup(`Initialization failed: ${error.message}`, 'INIT_ERROR');
    }
  }

  // ---------------- Message handling (single, consistent listener) ----------------
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    debugLog('Received message:', message);

    const validation = validateMessage(message);
    if (!validation.valid) {
      const errorResponse = createMessage(MESSAGE_TYPES.ERROR, { error: validation.error, code: 'INVALID_MESSAGE' });
      sendResponse(errorResponse);
      return true;
    }

    (async () => {
      try {
        const core = await waitForKeyPilotCore();
        if (!core) {
          sendResponse(createMessage(MESSAGE_TYPES.ERROR, { error: 'KeyPilot core not available', code: 'CORE_UNAVAILABLE' }));
          return;
        }

        switch (message.action) {
          case MESSAGE_TYPES.TOGGLE: {
            if (keyPilotEnabled) { core.disable(); keyPilotEnabled = false; }
            else { core.enable(); keyPilotEnabled = true; }
            saveTabState();
            const st = core.getStatus();
            const data = { status: st.enabled ? 'enabled' : 'disabled', debug: st.debug, hoverMode: st.hoverMode };
            await sendMessageToPopup(MESSAGE_TYPES.STATUS_UPDATE, data);
            sendResponse(createMessage('toggleResponse', data));
            break;
          }

          case MESSAGE_TYPES.UPDATE_SETTINGS: {
            const payload = message.data || {};
            currentSettings = { ...currentSettings, ...payload };

            if (typeof payload.debugMode === 'boolean') {
              core.setDebug(payload.debugMode);
              debugMode = payload.debugMode;
            }
            if (typeof payload.hoverMode === 'string') {
              core.setHoverMode(payload.hoverMode);
            }

            const st = core.getStatus();
            sendMessageToPopup(MESSAGE_TYPES.STATUS_UPDATE, {
              status: st.enabled ? 'enabled' : 'disabled',
              debug: st.debug,
              hoverMode: st.hoverMode
            }).catch(() => {});

            sendResponse(createMessage('settingsUpdateResponse', { success: true }));
            break;
          }

          case MESSAGE_TYPES.GET_STATUS: {
            const st = core.getStatus();
            sendResponse(createMessage('statusResponse', {
              status: st.enabled ? 'enabled' : 'disabled',
              debug: st.debug,
              hoverMode: st.hoverMode
            }));
            break;
          }

          case MESSAGE_TYPES.TOGGLE_HUD:
            if (core.toggleHUDVisibility) core.toggleHUDVisibility();
            sendResponse(createMessage('hudToggleResponse', { success: true }));
            break;

          case MESSAGE_TYPES.SHOW_HUD:
            if (core.showHUD) core.showHUD();
            sendResponse(createMessage('hudShowResponse', { success: true }));
            break;

          case MESSAGE_TYPES.HIDE_HUD:
            if (core.hideHUD) core.hideHUD();
            sendResponse(createMessage('hudHideResponse', { success: true }));
            break;

          case MESSAGE_TYPES.EXPAND_HUD:
            if (core.expandHUD) core.expandHUD();
            sendResponse(createMessage('hudExpandResponse', { success: true }));
            break;

          case MESSAGE_TYPES.COMPACT_HUD:
            if (core.compactHUD) core.compactHUD();
            sendResponse(createMessage('hudCompactResponse', { success: true }));
            break;

          case MESSAGE_TYPES.GET_HUD_INFO:
            sendResponse(createMessage('hudInfoResponse', core.getHUDInfo ? core.getHUDInfo() : {}));
            break;

          default:
            sendResponse(createMessage(MESSAGE_TYPES.ERROR, { error: 'Unknown action: ' + message.action, code: 'UNKNOWN_ACTION' }));
        }
      } catch (error) {
        debugLog('Critical error in message handler:', error.message);
        sendResponse(createMessage(MESSAGE_TYPES.ERROR, { error: `Critical error: ${error.message}`, code: 'CRITICAL_ERROR' }));
      }
    })();

    // Asynchronous response
    return true;
  });

  // ---------------- State change relay ----------------
  document.addEventListener('keyPilotStateChange', async (event) => {
    debugLog('KeyPilot state change detected:', event.detail);
    keyPilotEnabled = event.detail.enabled;
    saveTabState();
    await sendMessageToPopup(MESSAGE_TYPES.STATUS_UPDATE, {
      status: event.detail.enabled ? 'enabled' : 'disabled',
      debug: event.detail.debug,
      hoverMode: event.detail.hoverMode ?? currentSettings.hoverMode
    });
  });

  // ---------------- Lifecycle ----------------
  window.addEventListener('beforeunload', () => saveTabState());

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', async () => {
      await loadSettings();
      await initializeKeyPilot();
    });
  } else {
    (async () => {
      await loadSettings();
      await initializeKeyPilot();
    })();
  }

  console.log('[KeyPilot Extension] Content script initialized');
})();
