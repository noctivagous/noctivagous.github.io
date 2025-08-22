// KeyPilot Extension Context Test Script
// Handles all testing functionality for the extension context test page

(function() {
    'use strict';

    // Use shared utilities
    const utils = window.KeyPilotTestUtils;
    const log = utils.log.bind(utils);
    const clearResults = utils.clearResults.bind(utils);

    // Update debugging information
    function updateDebugInfo() {
        document.getElementById('currentUrl').textContent = window.location.href;
        document.getElementById('protocol').textContent = window.location.protocol;
        document.getElementById('readyState').textContent = document.readyState;
        
        // Extension context info
        const isExtensionContext = window.location.protocol === 'chrome-extension:';
        document.getElementById('extensionContext').textContent = isExtensionContext ? 'Yes' : 'No';
        document.getElementById('extensionContext').style.color = isExtensionContext ? '#28a745' : '#dc3545';
        
        // KeyPilot status
        const keyPilotAvailable = !!window.__KeyPilotExtensionCore;
        document.getElementById('keyPilotStatus').textContent = keyPilotAvailable ? 'Available' : 'Not Found';
        document.getElementById('keyPilotStatus').style.color = keyPilotAvailable ? '#28a745' : '#dc3545';
        
        // Chrome APIs
        const chromeAvailable = typeof chrome !== 'undefined' && !!chrome.runtime;
        document.getElementById('chromeApis').textContent = chromeAvailable ? 'Available' : 'Not Available';
        document.getElementById('chromeApis').style.color = chromeAvailable ? '#28a745' : '#dc3545';
    }

    // Test extension context
    function testExtensionContext() {
        log('=== TESTING EXTENSION CONTEXT ===', 'info');
        
        // Test 1: Chrome object availability
        if (typeof chrome === 'undefined') {
            log('Chrome object not available - NOT in extension context', 'error');
            log('This means content scripts are not being injected', 'error');
            return false;
        }
        log('Chrome object available', 'success');
        
        // Test 2: Chrome runtime
        if (!chrome.runtime) {
            log('chrome.runtime not available', 'error');
            return false;
        }
        log('chrome.runtime available', 'success');
        
        // Test 3: Extension ID
        try {
            const extensionId = chrome.runtime.id;
            log(`Extension ID: ${extensionId}`, 'success');
        } catch (error) {
            log(`Error getting extension ID: ${error.message}`, 'error');
        }
        
        // Test 4: Chrome storage
        if (!chrome.storage) {
            log('chrome.storage not available', 'error');
            return false;
        }
        log('chrome.storage available', 'success');
        
        // Test 5: Test storage access
        try {
            chrome.storage.sync.get(['test'], (result) => {
                if (chrome.runtime.lastError) {
                    log(`Storage access error: ${chrome.runtime.lastError.message}`, 'error');
                } else {
                    log('Storage access working', 'success');
                }
            });
        } catch (error) {
            log(`Storage test failed: ${error.message}`, 'error');
        }
        
        return true;
    }

    // Test content scripts
    function testContentScripts() {
        log('=== TESTING CONTENT SCRIPTS ===', 'info');
        
        // Check for console messages that should be logged by content scripts
        log('Check browser console (F12) for these messages:', 'info');
        log('  - "KeyPilot content script loaded"', 'info');
        log('  - "KeyPilot Extension Core initialized"', 'info');
        
        // Check for KeyPilot DOM elements
        const kpElements = document.querySelectorAll('[id*="kpv2"], [class*="kpv2"], [data-keypilot]');
        log(`KeyPilot DOM elements found: ${kpElements.length}`, kpElements.length > 0 ? 'success' : 'warning');
        
        if (kpElements.length > 0) {
            kpElements.forEach((el, i) => {
                const id = el.id ? `#${el.id}` : '';
                const classes = el.className ? `.${el.className.split(' ').join('.')}` : '';
                log(`  Element ${i + 1}: ${el.tagName}${id}${classes}`, 'info');
            });
        }
        
        // Test if content scripts are actually running
        if (typeof chrome !== 'undefined' && chrome.runtime) {
            log('Content scripts appear to be running (Chrome APIs available)', 'success');
        } else {
            log('Content scripts NOT running (Chrome APIs not available)', 'error');
            log('Possible causes:', 'info');
            log('  - Extension not loaded', 'info');
            log('  - Content script match patterns not matching this URL', 'info');
            log('  - JavaScript errors in content scripts', 'info');
            log('  - Extension disabled for this tab', 'info');
        }
    }

    // Test KeyPilot core functionality
    function testKeyPilotCore() {
        log('=== TESTING KEYPILOT CORE ===', 'info');
        
        // Check for any KeyPilot-related objects in window
        const keyPilotObjects = Object.keys(window).filter(key => 
            key.toLowerCase().includes('keypilot') || key.toLowerCase().includes('kp')
        );
        log(`KeyPilot-related window objects: ${keyPilotObjects.join(', ') || 'none'}`, 'info');
        
        // Check for content script console messages
        log('Check browser console for KeyPilot initialization messages', 'info');
        
        if (!window.__KeyPilotExtensionCore) {
            log('KeyPilot Extension Core not found', 'error');
            log('This means keypilot-core.js is not loading or has errors', 'error');
            log('Possible causes:', 'info');
            log('  - Content scripts not injected on extension pages', 'info');
            log('  - JavaScript error in keypilot-core.js', 'info');
            log('  - Content script match patterns not including chrome-extension://', 'info');
            return;
        }
        
        log('KeyPilot Extension Core found', 'success');
        
        try {
            const core = window.__KeyPilotExtensionCore;
            
            // Test getStatus
            const status = core.getStatus();
            log(`getStatus(): ${JSON.stringify(status)}`, 'success');
            
            // Test setDebug
            core.setDebug(true);
            log('setDebug(true) successful', 'success');
            
            // Test enable/disable
            const wasEnabled = status.enabled;
            if (!wasEnabled) {
                core.enable();
                const newStatus = core.getStatus();
                log(`enable() successful: enabled=${newStatus.enabled}`, 'success');
                
                // Disable it back
                core.disable();
                log('disable() successful', 'success');
            } else {
                log('KeyPilot already enabled, skipping enable/disable test', 'info');
            }
            
            log('KeyPilot Core API fully functional', 'success');
            
        } catch (error) {
            log(`KeyPilot Core API test failed: ${error.message}`, 'error');
        }
    }

    // Run all tests automatically
    function runAllTests() {
        clearResults();
        log('Running comprehensive test suite...', 'info');
        log('', 'info');
        
        const contextOk = testExtensionContext();
        log('', 'info');
        
        testContentScripts();
        log('', 'info');
        
        if (contextOk) {
            testKeyPilotCore();
            log('', 'info');
            
            testStorage();
            log('', 'info');
        }
        
        updateDebugInfo();
        log('', 'info');
        log('=== COMPREHENSIVE TESTS COMPLETE ===', 'info');
    }

    // Quick actions
    function enableAndTest() {
        log('=== ENABLE AND TEST SEQUENCE ===', 'info');
        enableKeyPilot();
        setTimeout(() => {
            getKeyPilotStatus();
            log('Try pressing F key to test click mode', 'info');
        }, 500);
    }

    function exportResults() {
        const results = document.getElementById('testResults').textContent;
        const blob = new Blob([results], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `keypilot-test-results-${new Date().toISOString().slice(0, 19)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        log('Test results exported to file', 'success');
    }

    function openConsole() {
        log('Opening browser console...', 'info');
        log('Press F12 or Ctrl+Shift+I to open developer tools', 'info');
        console.log('KeyPilot Extension Test Page - Console opened via test page');
        console.log('Extension ID:', chrome?.runtime?.id);
        console.log('KeyPilot Core Available:', !!window.__KeyPilotExtensionCore);
    }

    // KeyPilot control functions
    function enableKeyPilot() {
        if (window.__KeyPilotExtensionCore) {
            window.__KeyPilotExtensionCore.enable();
            log('KeyPilot enabled', 'success');
        } else {
            log('KeyPilot core not available', 'error');
        }
    }

    function disableKeyPilot() {
        if (window.__KeyPilotExtensionCore) {
            window.__KeyPilotExtensionCore.disable();
            log('KeyPilot disabled', 'success');
        } else {
            log('KeyPilot core not available', 'error');
        }
    }

    function toggleDebugMode() {
        if (window.__KeyPilotExtensionCore) {
            const currentStatus = window.__KeyPilotExtensionCore.getStatus();
            const newDebugState = !currentStatus.debug;
            window.__KeyPilotExtensionCore.setDebug(newDebugState);
            log(`Debug mode ${newDebugState ? 'enabled' : 'disabled'}`, 'success');
        } else {
            log('KeyPilot core not available', 'error');
        }
    }

    function getKeyPilotStatus() {
        if (window.__KeyPilotExtensionCore) {
            const status = window.__KeyPilotExtensionCore.getStatus();
            log(`KeyPilot Status: ${JSON.stringify(status, null, 2)}`, 'info');
        } else {
            log('KeyPilot core not available', 'error');
        }
    }

    // Keyboard simulation functions
    function simulateKeyPress(key, modifiers = {}) {
        const event = new KeyboardEvent('keydown', {
            key: key,
            code: `Key${key.toUpperCase()}`,
            keyCode: key.charCodeAt(0),
            which: key.charCodeAt(0),
            ctrlKey: modifiers.ctrl || false,
            altKey: modifiers.alt || false,
            shiftKey: modifiers.shift || false,
            bubbles: true,
            cancelable: true
        });
        document.dispatchEvent(event);
        log(`Simulated key press: ${key} ${JSON.stringify(modifiers)}`, 'info');
    }

    function simulateFKey() {
        simulateKeyPress('f');
    }

    function simulateHKey() {
        simulateKeyPress('h');
    }

    function simulateEscKey() {
        simulateKeyPress('Escape');
    }

    function simulateAltShiftB() {
        simulateKeyPress('b', { alt: true, shift: true });
    }
    
    // Test toggle persistence functionality
    function testTogglePersistence() {
        log('=== TESTING TOGGLE PERSISTENCE ===', 'info');
        
        if (!window.__KeyPilotExtensionCore) {
            log('KeyPilot core not available', 'error');
            return;
        }
        
        const core = window.__KeyPilotExtensionCore;
        
        // Test 1: Initial state
        const initialStatus = core.getStatus();
        log(`Initial state: ${initialStatus.enabled ? 'enabled' : 'disabled'}`, 'info');
        
        // Test 2: Toggle using Alt+Shift+B
        log('Testing Alt+Shift+B toggle...', 'info');
        simulateAltShiftB();
        
        setTimeout(() => {
            const afterToggleStatus = core.getStatus();
            log(`After toggle: ${afterToggleStatus.enabled ? 'enabled' : 'disabled'}`, 'info');
            
            // Check if state changed
            if (initialStatus.enabled !== afterToggleStatus.enabled) {
                log('✓ Toggle functionality working', 'success');
                
                // Test 3: Check session storage
                try {
                    const TAB_STATE_KEY = 'keyPilotTabState_' + window.location.hostname;
                    const savedState = sessionStorage.getItem(TAB_STATE_KEY);
                    if (savedState) {
                        const parsedState = JSON.parse(savedState);
                        log(`✓ State saved to session storage: ${parsedState.enabled}`, 'success');
                        
                        if (parsedState.enabled === afterToggleStatus.enabled) {
                            log('✓ Session storage state matches current state', 'success');
                        } else {
                            log('✗ Session storage state mismatch', 'error');
                        }
                    } else {
                        log('✗ No state found in session storage', 'error');
                    }
                } catch (error) {
                    log(`✗ Error checking session storage: ${error.message}`, 'error');
                }
                
                // Test 4: Toggle back
                log('Testing toggle back...', 'info');
                simulateAltShiftB();
                
                setTimeout(() => {
                    const finalStatus = core.getStatus();
                    log(`Final state: ${finalStatus.enabled ? 'enabled' : 'disabled'}`, 'info');
                    
                    if (finalStatus.enabled === initialStatus.enabled) {
                        log('✓ Toggle back successful - returned to initial state', 'success');
                    } else {
                        log('✗ Toggle back failed - state inconsistent', 'error');
                    }
                }, 100);
                
            } else {
                log('✗ Toggle functionality not working - state unchanged', 'error');
            }
        }, 100);
    }

    // Storage testing functions
    function testStorage() {
        log('=== TESTING STORAGE OPERATIONS ===', 'info');
        
        const testData = {
            testKey: 'testValue',
            timestamp: Date.now(),
            keyPilotTest: true
        };

        // Test sync storage
        chrome.storage.sync.set(testData, () => {
            if (chrome.runtime.lastError) {
                log(`Storage set error: ${chrome.runtime.lastError.message}`, 'error');
                return;
            }
            log('Storage set successful', 'success');
            
            // Test retrieval
            chrome.storage.sync.get(Object.keys(testData), (result) => {
                if (chrome.runtime.lastError) {
                    log(`Storage get error: ${chrome.runtime.lastError.message}`, 'error');
                    return;
                }
                log(`Storage retrieved: ${JSON.stringify(result)}`, 'success');
            });
        });
    }

    function clearStorage() {
        chrome.storage.sync.clear(() => {
            if (chrome.runtime.lastError) {
                log(`Storage clear error: ${chrome.runtime.lastError.message}`, 'error');
            } else {
                log('Storage cleared successfully', 'success');
            }
        });
    }

    function viewStorage() {
        chrome.storage.sync.get(null, (items) => {
            if (chrome.runtime.lastError) {
                log(`Storage view error: ${chrome.runtime.lastError.message}`, 'error');
            } else {
                log(`All storage contents: ${JSON.stringify(items, null, 2)}`, 'info');
            }
        });
    }

    // Messaging testing functions
    function testMessaging() {
        log('=== TESTING EXTENSION MESSAGING ===', 'info');
        
        const testMessage = {
            action: 'getStatus',
            source: 'test-page',
            timestamp: Date.now()
        };

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, testMessage, (response) => {
                    if (chrome.runtime.lastError) {
                        log(`Messaging error: ${chrome.runtime.lastError.message}`, 'error');
                    } else {
                        log(`Message response: ${JSON.stringify(response)}`, 'success');
                    }
                });
            }
        });
    }

    function testBackgroundCommunication() {
        log('=== TESTING BACKGROUND COMMUNICATION ===', 'info');
        
        const message = {
            action: 'ping',
            source: 'test-page',
            timestamp: Date.now()
        };

        chrome.runtime.sendMessage(message, (response) => {
            if (chrome.runtime.lastError) {
                log(`Background communication error: ${chrome.runtime.lastError.message}`, 'error');
            } else {
                log(`Background response: ${JSON.stringify(response)}`, 'success');
            }
        });
    }

    // Interactive element handlers
    function setupInteractiveElements() {
        document.getElementById('testBtn1').addEventListener('click', () => {
            log('Test Button 1 clicked!', 'success');
        });

        document.getElementById('testBtn2').addEventListener('click', () => {
            log('Test Button 2 clicked!', 'success');
        });

        document.getElementById('testInput').addEventListener('input', (e) => {
            log(`Test input changed: ${e.target.value}`, 'info');
        });

        document.getElementById('testLink').addEventListener('click', (e) => {
            e.preventDefault();
            log('Test Link clicked!', 'success');
        });

        document.getElementById('testSelect').addEventListener('change', (e) => {
            log(`Test select changed: ${e.target.value}`, 'info');
        });
    }

    // Initialize when DOM is loaded
    document.addEventListener('DOMContentLoaded', function() {
        // Set up basic test button event listeners
        document.getElementById('testExtensionContextBtn').addEventListener('click', testExtensionContext);
        document.getElementById('testContentScriptsBtn').addEventListener('click', testContentScripts);
        document.getElementById('testKeyPilotCoreBtn').addEventListener('click', testKeyPilotCore);
        document.getElementById('clearResultsBtn').addEventListener('click', clearResults);
        
        // Set up KeyPilot control listeners
        document.getElementById('enableKeyPilotBtn').addEventListener('click', enableKeyPilot);
        document.getElementById('disableKeyPilotBtn').addEventListener('click', disableKeyPilot);
        document.getElementById('toggleDebugBtn').addEventListener('click', toggleDebugMode);
        document.getElementById('getStatusBtn').addEventListener('click', getKeyPilotStatus);
        
        // Set up keyboard testing listeners
        document.getElementById('simulateFKeyBtn').addEventListener('click', simulateFKey);
        document.getElementById('simulateHKeyBtn').addEventListener('click', simulateHKey);
        document.getElementById('simulateEscKeyBtn').addEventListener('click', simulateEscKey);
        document.getElementById('simulateAltShiftBBtn').addEventListener('click', simulateAltShiftB);
        document.getElementById('testTogglePersistenceBtn').addEventListener('click', testTogglePersistence);
        
        // Set up storage testing listeners
        document.getElementById('testStorageBtn').addEventListener('click', testStorage);
        document.getElementById('clearStorageBtn').addEventListener('click', clearStorage);
        document.getElementById('viewStorageBtn').addEventListener('click', viewStorage);
        
        // Set up messaging testing listeners
        document.getElementById('testMessagingBtn').addEventListener('click', testMessaging);
        document.getElementById('testBackgroundBtn').addEventListener('click', testBackgroundCommunication);
        
        // Set up debug info listeners
        document.getElementById('refreshDebugInfoBtn').addEventListener('click', updateDebugInfo);
        
        // Set up quick actions listeners
        document.getElementById('runAllTestsBtn').addEventListener('click', runAllTests);
        document.getElementById('enableAndTestBtn').addEventListener('click', enableAndTest);
        document.getElementById('exportResultsBtn').addEventListener('click', exportResults);
        document.getElementById('openConsoleBtn').addEventListener('click', openConsole);
        
        // Set up interactive elements
        setupInteractiveElements();
        
        // Update debug info
        updateDebugInfo();
        
        // Log initial state
        console.log('[Extension Context Test] Page loaded');
        console.log('[Extension Context Test] URL:', window.location.href);
        console.log('[Extension Context Test] Chrome available:', typeof chrome !== 'undefined');
        console.log('[Extension Context Test] Waiting for content scripts...');
    });

    // Auto-run tests when page loads
    window.addEventListener('load', () => {
        // Wait a bit longer for KeyPilot core to initialize
        setTimeout(runAllTests, 2000);
    });

})();