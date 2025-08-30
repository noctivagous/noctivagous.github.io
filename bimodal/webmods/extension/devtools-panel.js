/**
 * KeyPilot DevTools Panel JavaScript
 */

let debuggerAttached = false;
let logEntries = [];

// Initialize panel
document.addEventListener('DOMContentLoaded', () => {
  checkStatus();
  log('KeyPilot DevTools panel initialized');
});

// Logging function
function log(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const entry = { message, type, timestamp };
  logEntries.push(entry);
  
  const logContainer = document.getElementById('logContainer');
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = `[${timestamp}] ${message}`;
  logContainer.appendChild(logEntry);
  logContainer.scrollTop = logContainer.scrollHeight;
}

// Clear log
function clearLog() {
  logEntries = [];
  document.getElementById('logContainer').innerHTML = '';
}

// Show result
function showResult(result, isError = false) {
  const resultDiv = document.getElementById('scriptResult');
  resultDiv.style.display = 'block';
  resultDiv.className = `result ${isError ? 'result-error' : 'result-success'}`;
  resultDiv.textContent = typeof result === 'object' ? JSON.stringify(result, null, 2) : result;
}

// Clear results
function clearResults() {
  const resultDiv = document.getElementById('scriptResult');
  resultDiv.style.display = 'none';
  resultDiv.textContent = '';
}

// Update status display
function updateStatusDisplay(status) {
  const elements = {
    extensionLoaded: document.getElementById('extensionLoaded'),
    apiAvailable: document.getElementById('apiAvailable'),
    keyPilotApp: document.getElementById('keyPilotApp'),
    toggleHandler: document.getElementById('toggleHandler')
  };

  if (status.success) {
    const data = status.result;
    elements.extensionLoaded.textContent = data.extensionLoaded ? 'Yes' : 'No';
    elements.extensionLoaded.className = data.extensionLoaded ? 'status-true' : 'status-false';
    
    elements.apiAvailable.textContent = data.apiAvailable ? 'Yes' : 'No';
    elements.apiAvailable.className = data.apiAvailable ? 'status-true' : 'status-false';
    
    elements.keyPilotApp.textContent = data.keyPilotApp ? 'Yes' : 'No';
    elements.keyPilotApp.className = data.keyPilotApp ? 'status-true' : 'status-false';
    
    elements.toggleHandler.textContent = data.toggleHandler ? 'Yes' : 'No';
    elements.toggleHandler.className = data.toggleHandler ? 'status-true' : 'status-false';
    
    if (data.errors && data.errors.length > 0) {
      log(`Errors found: ${data.errors.join(', ')}`, 'error');
    }
  } else {
    Object.values(elements).forEach(el => {
      el.textContent = 'Error';
      el.className = 'status-false';
    });
    log(`Status check failed: ${status.error}`, 'error');
  }
}

// Check extension status
async function checkStatus() {
  log('Checking extension status...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          if (typeof window.KeyPilotExtension !== 'undefined' && window.KeyPilotExtension.debug) {
            return await window.KeyPilotExtension.debug.status();
          } else {
            // Fallback status check
            return {
              success: true,
              result: {
                extensionLoaded: typeof window.__KeyPilotApp !== 'undefined',
                apiAvailable: typeof window.KeyPilotExtension !== 'undefined',
                keyPilotApp: typeof window.__KeyPilotApp !== 'undefined',
                toggleHandler: typeof window.__KeyPilotToggleHandler !== 'undefined',
                errors: []
              }
            };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) { // isException
      log(`Status check exception: ${result[0]}`, 'error');
      showResult(result[0], true);
    } else {
      updateStatusDisplay(result[0]);
      log('Status check completed');
    }
  } catch (error) {
    log(`Status check failed: ${error.message}`, 'error');
    showResult(error.message, true);
  }
}

// Attach debugger
async function attachDebugger() {
  log('Attaching debugger...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          if (window.KeyPilotExtension && window.KeyPilotExtension.debug) {
            return await window.KeyPilotExtension.debug.attach();
          } else {
            return { success: false, error: 'KeyPilot debug API not available' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Debugger attach exception: ${result[0]}`, 'error');
    } else if (result[0].success) {
      debuggerAttached = true;
      log('Debugger attached successfully');
      showResult(result[0]);
    } else {
      log(`Debugger attach failed: ${result[0].error}`, 'error');
      showResult(result[0], true);
    }
  } catch (error) {
    log(`Debugger attach error: ${error.message}`, 'error');
  }
}

// Detach debugger
async function detachDebugger() {
  log('Detaching debugger...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          if (window.KeyPilotExtension && window.KeyPilotExtension.debug) {
            return await window.KeyPilotExtension.debug.detach();
          } else {
            return { success: true, message: 'No debugger to detach' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Debugger detach exception: ${result[0]}`, 'error');
    } else {
      debuggerAttached = false;
      log('Debugger detached');
      showResult(result[0]);
    }
  } catch (error) {
    log(`Debugger detach error: ${error.message}`, 'error');
  }
}

// Test extension functionality
async function testExtension() {
  log('Testing extension functionality...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          if (window.KeyPilotExtension && window.KeyPilotExtension.debug) {
            return await window.KeyPilotExtension.debug.test();
          } else {
            // Fallback test
            return {
              success: true,
              result: {
                apiMethods: {
                  reload: typeof window.KeyPilotExtension?.reload === 'function',
                  getState: typeof window.KeyPilotExtension?.getState === 'function',
                  toggle: typeof window.KeyPilotExtension?.toggle === 'function'
                },
                domElements: {
                  cursor: document.querySelector('[data-keypilot-cursor]') !== null,
                  overlays: document.querySelectorAll('[data-keypilot-overlay]').length
                },
                errors: []
              }
            };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Extension test exception: ${result[0]}`, 'error');
    } else {
      log('Extension test completed');
      showResult(result[0]);
    }
  } catch (error) {
    log(`Extension test error: ${error.message}`, 'error');
  }
}

// Inject debugging helpers
async function injectHelpers() {
  log('Injecting debugging helpers...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          if (window.KeyPilotExtension && window.KeyPilotExtension.debug) {
            return await window.KeyPilotExtension.debug.injectHelpers();
          } else {
            // Fallback injection
            window.KeyPilotDebug = {
              status: () => ({
                apiAvailable: typeof window.KeyPilotExtension !== 'undefined',
                appInstance: typeof window.__KeyPilotApp !== 'undefined'
              }),
              simulateKeyPress: (key) => {
                const event = new KeyboardEvent('keydown', { key, bubbles: true });
                document.dispatchEvent(event);
                return 'Key simulated: ' + key;
              }
            };
            return { success: true, message: 'Fallback helpers injected' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Helper injection exception: ${result[0]}`, 'error');
    } else {
      log('Debugging helpers injected');
      showResult(result[0]);
    }
  } catch (error) {
    log(`Helper injection error: ${error.message}`, 'error');
  }
}

// Reload extension
async function reloadExtension() {
  log('Reloading extension...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          if (window.KeyPilotExtension && window.KeyPilotExtension.reload) {
            await window.KeyPilotExtension.reload();
            return { success: true, message: 'Extension reload initiated' };
          } else {
            return { success: false, error: 'KeyPilot API not available' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Extension reload exception: ${result[0]}`, 'error');
    } else {
      log('Extension reload initiated');
      showResult(result[0]);
      // Refresh status after reload
      setTimeout(checkStatus, 2000);
    }
  } catch (error) {
    log(`Extension reload error: ${error.message}`, 'error');
  }
}

// Simulate key press
async function simulateKeyPress(key) {
  log(`Simulating key press: ${key}`);
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (function() {
        try {
          const modifiers = {};
          let keyToPress = '${key}';
          
          if (keyToPress.includes('Alt+')) {
            modifiers.altKey = true;
            keyToPress = keyToPress.replace('Alt+', '');
          }
          
          const event = new KeyboardEvent('keydown', {
            key: keyToPress,
            code: keyToPress,
            altKey: modifiers.altKey || false,
            bubbles: true
          });
          
          document.dispatchEvent(event);
          return { success: true, message: 'Key press simulated: ' + '${key}' };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Key simulation exception: ${result[0]}`, 'error');
    } else {
      log(`Key simulation completed: ${key}`);
      showResult(result[0]);
    }
  } catch (error) {
    log(`Key simulation error: ${error.message}`, 'error');
  }
}

// Execute custom script
async function executeCustomScript() {
  const script = document.getElementById('customScript').value.trim();
  if (!script) {
    log('No script to execute', 'warn');
    return;
  }
  
  log(`Executing custom script: ${script.substring(0, 50)}...`);
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (async function() {
        try {
          const result = await (${script});
          return { success: true, result: result };
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Script execution exception: ${result[0]}`, 'error');
      showResult(result[0], true);
    } else {
      log('Script executed successfully');
      showResult(result[0]);
    }
  } catch (error) {
    log(`Script execution error: ${error.message}`, 'error');
    showResult(error.message, true);
  }
}

// Get console logs
async function getConsoleLogs() {
  log('Getting console logs...');
  
  try {
    const result = await chrome.devtools.inspectedWindow.eval(`
      (function() {
        try {
          if (window.KeyPilotDebug && window.KeyPilotDebug.getRecentLogs) {
            return {
              success: true,
              logs: window.KeyPilotDebug.getRecentLogs(20),
              errors: window.KeyPilotDebug.getRecentErrors(10)
            };
          } else {
            return { success: false, error: 'KeyPilotDebug not available. Inject helpers first.' };
          }
        } catch (error) {
          return { success: false, error: error.message };
        }
      })()
    `);
    
    if (result[1]) {
      log(`Console logs exception: ${result[0]}`, 'error');
    } else if (result[0].success) {
      const { logs, errors } = result[0];
      logs.forEach(logEntry => {
        log(`Console: ${logEntry.args.join(' ')}`, logEntry.type);
      });
      errors.forEach(errorEntry => {
        log(`Console Error: ${errorEntry.args.join(' ')}`, 'error');
      });
      showResult(result[0]);
    } else {
      log(`Console logs failed: ${result[0].error}`, 'error');
      showResult(result[0], true);
    }
  } catch (error) {
    log(`Console logs error: ${error.message}`, 'error');
  }
}
