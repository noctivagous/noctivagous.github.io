/**
 * Content script entry point - Updated for restructured architecture
 */
import { KeyPilotApp } from './core/keypilot-app.js';
import { KeyPilotToggleHandler } from './core/keypilot-toggle-handler.js';
import { FileLogger } from './utils/file-logger.js';

// Initialize KeyPilot with toggle functionality
async function initializeKeyPilot() {
  try {
    // Initialize file logger
    const fileLogger = new FileLogger();
    await fileLogger.writeLog('INFO', 'KeyPilot extension initialization started');
    
    // Create KeyPilot application instance
    const keyPilotApp = new KeyPilotApp();
    
    // Initialize the KeyPilot application
    await keyPilotApp.init();
    
    // Create toggle handler and wrap KeyPilot instance
    const toggleHandler = new KeyPilotToggleHandler(keyPilotApp);
    
    // Initialize toggle handler (queries service worker for state)
    await toggleHandler.initialize();
    
    // Store reference globally for debugging
    window.__KeyPilotToggleHandler = toggleHandler;
    window.__KeyPilotApp = keyPilotApp;
    
    // Log successful initialization
    await fileLogger.logLoaded();
    console.log('[KeyPilot] Extension fully loaded and initialized');
    
    // ===== ENHANCED DEBUGGING API =====
    // New debugging system using chrome.userScripts.execute() for dynamic injection
    
    // Create global hook for external automation tools (Puppeteer, Browser MCP)
    window.KeyPilotExtension = {
      // Reload the extension
      reload: () => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'KP_RELOAD_EXTENSION' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.type === 'KP_ERROR') {
              reject(new Error(response.error));
            } else {
              resolve(true);
            }
          });
        });
      },
      
      // Get extension state
      getState: () => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'KP_GET_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.type === 'KP_ERROR') {
              reject(new Error(response.error));
            } else {
              resolve(response.enabled);
            }
          });
        });
      },
      
      // Toggle extension state
      toggle: () => {
        return new Promise((resolve, reject) => {
          chrome.runtime.sendMessage({ type: 'KP_TOGGLE_STATE' }, (response) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
            } else if (response && response.type === 'KP_ERROR') {
              reject(new Error(response.error));
            } else {
              resolve(response.enabled);
            }
          });
        });
      },

      // Enhanced Debug API using chrome.userScripts.execute()
      debug: {
        // Execute a specific debug script
        execute: (scriptName, options = {}) => {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ 
              type: 'KP_DEBUG_EXECUTE', 
              scriptName: scriptName,
              options: options
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.type === 'KP_ERROR') {
                reject(new Error(response.error));
              } else {
                resolve(response.result);
              }
            });
          });
        },

        // Get list of available debug scripts
        listScripts: () => {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ type: 'KP_DEBUG_LIST_SCRIPTS' }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.type === 'KP_ERROR') {
                reject(new Error(response.error));
              } else {
                resolve(response.scripts);
              }
            });
          });
        },

        // Execute multiple debug scripts
        executeMultiple: (scriptNames) => {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ 
              type: 'KP_DEBUG_EXECUTE_MULTIPLE', 
              scriptNames: scriptNames
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.type === 'KP_ERROR') {
                reject(new Error(response.error));
              } else {
                resolve(response.results);
              }
            });
          });
        },

        // Execute custom user script
        custom: (userScript, injectImmediately = false) => {
          return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage({ 
              type: 'KP_DEBUG_CUSTOM', 
              userScript: userScript,
              injectImmediately: injectImmediately
            }, (response) => {
              if (chrome.runtime.lastError) {
                reject(new Error(chrome.runtime.lastError.message));
              } else if (response && response.type === 'KP_ERROR') {
                reject(new Error(response.error));
              } else {
                resolve(response.result);
              }
            });
          });
        },

        // Convenience methods for common debug operations
        status: () => window.KeyPilotExtension.debug.execute('extensionStatus'),
        testFKey: () => window.KeyPilotExtension.debug.execute('testFKey'),
        testGKey: () => window.KeyPilotExtension.debug.execute('testGKey'),
        testHKey: () => window.KeyPilotExtension.debug.execute('testHKey'),
        testYKey: () => window.KeyPilotExtension.debug.execute('testYKey'),
        toggleExtension: () => window.KeyPilotExtension.debug.execute('toggleExtension'),
        analyzeLinks: () => window.KeyPilotExtension.debug.execute('analyzeLinkDetection'),
        createTestOverlay: () => window.KeyPilotExtension.debug.execute('createTestOverlay'),
        performanceAnalysis: () => window.KeyPilotExtension.debug.execute('performanceAnalysis'),
        testCursor: () => window.KeyPilotExtension.debug.execute('testCursor')
      }
    };
    
  } catch (error) {
    console.error('[KeyPilot] Failed to initialize with toggle functionality:', error);
    
    // Fallback: initialize KeyPilot without toggle functionality
    try {
      const keyPilotApp = new KeyPilotApp();
      await keyPilotApp.init();
      console.warn('[KeyPilot] Initialized without toggle functionality as fallback');
    } catch (fallbackError) {
      console.error('[KeyPilot] Complete initialization failure:', fallbackError);
    }
  }
}

// Initialize KeyPilot
initializeKeyPilot();