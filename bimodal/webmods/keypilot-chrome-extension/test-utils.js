// Shared utilities for KeyPilot Extension test pages
// Provides common functionality and CSP-compliant event handling

(function(window) {
    'use strict';

    // Create global test utilities namespace
    window.KeyPilotTestUtils = {
        
        // Logging utility
        log: function(message, type = 'info', containerId = 'testResults') {
            const results = document.getElementById(containerId);
            if (!results) {
                console.log(`[${type.toUpperCase()}] ${message}`);
                return;
            }
            
            const timestamp = new Date().toLocaleTimeString();
            const icons = {
                success: '✅',
                error: '❌',
                warning: '⚠️',
                info: 'ℹ️'
            };
            const icon = icons[type] || 'ℹ️';
            results.textContent += `[${timestamp}] ${icon} ${message}\n`;
            results.scrollTop = results.scrollHeight;
        },

        // Clear results utility
        clearResults: function(containerId = 'testResults') {
            const results = document.getElementById(containerId);
            if (results) {
                results.textContent = 'Results cleared...\n';
            }
        },

        // Generic result logger for test interactions
        logResult: function(message, containerId = 'testResults') {
            this.log(message, 'success', containerId);
        },

        // Setup button event listeners to replace onclick handlers
        setupButtonListeners: function(buttonConfigs) {
            buttonConfigs.forEach(config => {
                const button = document.getElementById(config.id) || document.querySelector(config.selector);
                if (button && config.handler) {
                    button.addEventListener('click', config.handler);
                }
            });
        },

        // Common test element click handler
        handleTestClick: function(elementName) {
            this.logResult(`${elementName} clicked successfully`);
        },

        // Extension status checker
        checkExtensionStatus: function() {
            this.log('=== CHECKING EXTENSION STATUS ===', 'info');
            
            if (typeof chrome === 'undefined') {
                this.log('Chrome APIs not available', 'error');
                return false;
            }
            
            if (!chrome.runtime) {
                this.log('chrome.runtime not available', 'error');
                return false;
            }
            
            try {
                const extensionId = chrome.runtime.id;
                this.log(`Extension ID: ${extensionId}`, 'success');
                this.log('Extension appears to be loaded', 'success');
                return true;
            } catch (error) {
                this.log(`Extension status check failed: ${error.message}`, 'error');
                return false;
            }
        },

        // KeyPilot core functionality tester
        testKeyPilotCore: function() {
            this.log('=== TESTING KEYPILOT CORE ===', 'info');
            
            if (!window.__KeyPilotExtensionCore) {
                this.log('KeyPilot Extension Core not found', 'error');
                return false;
            }
            
            try {
                const core = window.__KeyPilotExtensionCore;
                const status = core.getStatus();
                this.log(`KeyPilot Status: ${JSON.stringify(status)}`, 'success');
                return true;
            } catch (error) {
                this.log(`KeyPilot Core test failed: ${error.message}`, 'error');
                return false;
            }
        },

        // Simulate key press for testing
        simulateKeyPress: function(key, target = document) {
            const event = new KeyboardEvent('keydown', {
                key: key,
                code: `Key${key.toUpperCase()}`,
                keyCode: key.charCodeAt(0),
                which: key.charCodeAt(0),
                bubbles: true,
                cancelable: true
            });
            target.dispatchEvent(event);
            this.log(`Simulated key press: ${key}`, 'info');
        },

        // Wait for element to appear
        waitForElement: function(selector, timeout = 5000) {
            return new Promise((resolve, reject) => {
                const element = document.querySelector(selector);
                if (element) {
                    resolve(element);
                    return;
                }

                const observer = new MutationObserver((mutations, obs) => {
                    const element = document.querySelector(selector);
                    if (element) {
                        obs.disconnect();
                        resolve(element);
                    }
                });

                observer.observe(document, {
                    childList: true,
                    subtree: true
                });

                setTimeout(() => {
                    observer.disconnect();
                    reject(new Error(`Element ${selector} not found within ${timeout}ms`));
                }, timeout);
            });
        },

        // Initialize common test page functionality
        initTestPage: function() {
            // Add common CSS for test results if not present
            if (!document.getElementById('testUtilsStyles')) {
                const style = document.createElement('style');
                style.id = 'testUtilsStyles';
                style.textContent = `
                    .test-results {
                        background: #f5f5f5;
                        padding: 15px;
                        margin: 10px 0;
                        border-radius: 5px;
                        font-family: 'Courier New', monospace;
                        font-size: 12px;
                        max-height: 400px;
                        overflow-y: auto;
                        white-space: pre-wrap;
                        border: 1px solid #ddd;
                    }
                    .success { color: #28a745; font-weight: bold; }
                    .error { color: #dc3545; font-weight: bold; }
                    .warning { color: #ffc107; font-weight: bold; }
                    .info { color: #17a2b8; }
                `;
                document.head.appendChild(style);
            }

            // Log initialization
            console.log('[KeyPilot Test Utils] Initialized');
            
            // Check if this is an extension context
            if (typeof chrome !== 'undefined' && chrome.runtime) {
                console.log('[KeyPilot Test Utils] Extension context detected');
            } else {
                console.log('[KeyPilot Test Utils] Regular web page context');
            }
        }
    };

    // Auto-initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', window.KeyPilotTestUtils.initTestPage);
    } else {
        window.KeyPilotTestUtils.initTestPage();
    }

})(window);