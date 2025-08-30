/**
 * KeyPilot Extension Debug Helper
 * Provides debugging capabilities using chrome.debugger and chrome.devtools APIs
 * Designed for Browser MCP automation and manual debugging
 */

class KeyPilotDebugger {
  constructor() {
    this.debugTarget = null;
    this.isAttached = false;
    this.debugSessions = new Map();
  }

  /**
   * Attach debugger to current tab
   */
  async attachToCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) {
        throw new Error('No active tab found');
      }

      this.debugTarget = { tabId: tab.id };
      await chrome.debugger.attach(this.debugTarget, '1.3');
      this.isAttached = true;
      
      console.log('[KeyPilot Debug] Attached to tab:', tab.id, tab.url);
      return { success: true, tabId: tab.id, url: tab.url };
    } catch (error) {
      console.error('[KeyPilot Debug] Failed to attach:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Detach debugger
   */
  async detach() {
    if (this.isAttached && this.debugTarget) {
      try {
        await chrome.debugger.detach(this.debugTarget);
        this.isAttached = false;
        console.log('[KeyPilot Debug] Detached from tab');
        return { success: true };
      } catch (error) {
        console.error('[KeyPilot Debug] Failed to detach:', error);
        return { success: false, error: error.message };
      }
    }
    return { success: true, message: 'Already detached' };
  }

  /**
   * Execute JavaScript in the debugged tab
   */
  async executeScript(expression) {
    if (!this.isAttached) {
      throw new Error('Debugger not attached. Call attachToCurrentTab() first.');
    }

    try {
      const result = await chrome.debugger.sendCommand(
        this.debugTarget,
        'Runtime.evaluate',
        {
          expression: expression,
          returnByValue: true,
          awaitPromise: true
        }
      );

      if (result.exceptionDetails) {
        throw new Error(`Script execution failed: ${result.exceptionDetails.text}`);
      }

      return {
        success: true,
        result: result.result.value,
        type: result.result.type
      };
    } catch (error) {
      console.error('[KeyPilot Debug] Script execution failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get console logs from the debugged tab
   */
  async getConsoleLogs() {
    if (!this.isAttached) {
      throw new Error('Debugger not attached');
    }

    try {
      // Enable Runtime domain to capture console logs
      await chrome.debugger.sendCommand(this.debugTarget, 'Runtime.enable');
      
      // Get console API calls
      const logs = await this.executeScript(`
        (function() {
          const logs = [];
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          // Capture recent console activity
          return window.__keypilot_console_logs || [];
        })()
      `);

      return logs;
    } catch (error) {
      console.error('[KeyPilot Debug] Failed to get console logs:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Check if KeyPilot extension is loaded and working
   */
  async checkExtensionStatus() {
    try {
      const result = await this.executeScript(`
        (function() {
          const status = {
            extensionLoaded: false,
            apiAvailable: false,
            keyPilotApp: false,
            toggleHandler: false,
            errors: []
          };

          try {
            // Check if KeyPilot API is available
            status.apiAvailable = typeof window.KeyPilotExtension !== 'undefined';
            
            // Check if KeyPilot app instance exists
            status.keyPilotApp = typeof window.__KeyPilotApp !== 'undefined';
            
            // Check if toggle handler exists
            status.toggleHandler = typeof window.__KeyPilotToggleHandler !== 'undefined';
            
            // Check if extension is loaded by looking for KeyPilot elements
            const keypilotElements = document.querySelectorAll('[data-keypilot]');
            status.extensionLoaded = keypilotElements.length > 0 || status.keyPilotApp;
            
            // Get any JavaScript errors
            if (window.__keypilot_errors) {
              status.errors = window.__keypilot_errors;
            }
            
            return status;
          } catch (error) {
            status.errors.push(error.message);
            return status;
          }
        })()
      `);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Test KeyPilot functionality
   */
  async testKeyPilotFunctionality() {
    try {
      const result = await this.executeScript(`
        (function() {
          const tests = {
            apiMethods: {},
            keyBindings: {},
            domElements: {},
            errors: []
          };

          try {
            // Test API methods
            if (window.KeyPilotExtension) {
              tests.apiMethods.reload = typeof window.KeyPilotExtension.reload === 'function';
              tests.apiMethods.getState = typeof window.KeyPilotExtension.getState === 'function';
              tests.apiMethods.toggle = typeof window.KeyPilotExtension.toggle === 'function';
            }

            // Test KeyPilot app instance
            if (window.__KeyPilotApp) {
              tests.keyPilotApp = {
                initialized: window.__KeyPilotApp.initialized || false,
                methods: Object.getOwnPropertyNames(window.__KeyPilotApp).length
              };
            }

            // Check for KeyPilot DOM elements
            tests.domElements.cursor = document.querySelector('[data-keypilot-cursor]') !== null;
            tests.domElements.overlays = document.querySelectorAll('[data-keypilot-overlay]').length;
            tests.domElements.highlights = document.querySelectorAll('[data-keypilot-highlight]').length;

            return tests;
          } catch (error) {
            tests.errors.push(error.message);
            return tests;
          }
        })()
      `);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Force reload KeyPilot extension
   */
  async forceReloadExtension() {
    try {
      const result = await this.executeScript(`
        (function() {
          try {
            if (window.KeyPilotExtension && window.KeyPilotExtension.reload) {
              window.KeyPilotExtension.reload();
              return { success: true, method: 'API' };
            } else {
              // Fallback: send message to background script
              chrome.runtime.sendMessage({ type: 'KP_RELOAD_EXTENSION' });
              return { success: true, method: 'message' };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        })()
      `);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Inject debugging helpers into the page
   */
  async injectDebuggingHelpers() {
    try {
      const result = await this.executeScript(`
        (function() {
          // Create global debugging object
          window.KeyPilotDebug = {
            // Console log capture
            logs: [],
            errors: [],
            
            // Capture console output
            captureConsole: function() {
              const originalLog = console.log;
              const originalError = console.error;
              const originalWarn = console.warn;
              
              console.log = function(...args) {
                window.KeyPilotDebug.logs.push({ type: 'log', args: args, timestamp: Date.now() });
                originalLog.apply(console, args);
              };
              
              console.error = function(...args) {
                window.KeyPilotDebug.errors.push({ type: 'error', args: args, timestamp: Date.now() });
                originalError.apply(console, args);
              };
              
              console.warn = function(...args) {
                window.KeyPilotDebug.logs.push({ type: 'warn', args: args, timestamp: Date.now() });
                originalWarn.apply(console, args);
              };
            },
            
            // Get extension status
            getStatus: function() {
              return {
                apiAvailable: typeof window.KeyPilotExtension !== 'undefined',
                appInstance: typeof window.__KeyPilotApp !== 'undefined',
                toggleHandler: typeof window.__KeyPilotToggleHandler !== 'undefined',
                domElements: {
                  cursor: document.querySelector('[data-keypilot-cursor]') !== null,
                  overlays: document.querySelectorAll('[data-keypilot-overlay]').length
                }
              };
            },
            
            // Test key press simulation
            simulateKeyPress: function(key, modifiers = {}) {
              const event = new KeyboardEvent('keydown', {
                key: key,
                code: key,
                altKey: modifiers.alt || false,
                ctrlKey: modifiers.ctrl || false,
                shiftKey: modifiers.shift || false,
                metaKey: modifiers.meta || false,
                bubbles: true
              });
              document.dispatchEvent(event);
              return 'Key press simulated: ' + key;
            },
            
            // Get recent logs
            getRecentLogs: function(count = 10) {
              return this.logs.slice(-count);
            },
            
            // Get recent errors
            getRecentErrors: function(count = 5) {
              return this.errors.slice(-count);
            }
          };
          
          // Start console capture
          window.KeyPilotDebug.captureConsole();
          
          return { success: true, message: 'Debugging helpers injected' };
        })()
      `);

      return result;
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// Create global debugger instance
const keyPilotDebugger = new KeyPilotDebugger();

// Add message handlers for debugging commands
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    try {
      switch (message.type) {
        case 'KP_DEBUG_ATTACH':
          const attachResult = await keyPilotDebugger.attachToCurrentTab();
          sendResponse(attachResult);
          break;

        case 'KP_DEBUG_DETACH':
          const detachResult = await keyPilotDebugger.detach();
          sendResponse(detachResult);
          break;

        case 'KP_DEBUG_STATUS':
          const statusResult = await keyPilotDebugger.checkExtensionStatus();
          sendResponse(statusResult);
          break;

        case 'KP_DEBUG_TEST':
          const testResult = await keyPilotDebugger.testKeyPilotFunctionality();
          sendResponse(testResult);
          break;

        case 'KP_DEBUG_INJECT_HELPERS':
          const injectResult = await keyPilotDebugger.injectDebuggingHelpers();
          sendResponse(injectResult);
          break;

        case 'KP_DEBUG_EXECUTE':
          if (message.script) {
            const execResult = await keyPilotDebugger.executeScript(message.script);
            sendResponse(execResult);
          } else {
            sendResponse({ success: false, error: 'No script provided' });
          }
          break;

        case 'KP_DEBUG_FORCE_RELOAD':
          const reloadResult = await keyPilotDebugger.forceReloadExtension();
          sendResponse(reloadResult);
          break;

        default:
          sendResponse({ success: false, error: 'Unknown debug command' });
      }
    } catch (error) {
      console.error('[KeyPilot Debug] Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    }
  })();
  
  return true; // Keep message channel open for async response
});

console.log('[KeyPilot Debug] Debug helper loaded');
