/**
 * Character Selection Test Script
 * 
 * This script provides automated testing for the character-level selection feature.
 * Run this in the browser console on a page with the KeyPilot extension loaded.
 */

(function() {
    'use strict';

    console.log('🧪 KeyPilot Character Selection Test Suite');
    console.log('==========================================');

    // Test configuration
    const TEST_CONFIG = {
        DELAY_BETWEEN_TESTS: 1000,
        CURSOR_MOVE_DELAY: 100,
        SELECTION_DELAY: 500
    };

    // Test utilities
    const TestUtils = {
        delay: (ms) => new Promise(resolve => setTimeout(resolve, ms)),
        
        simulateKeyPress: (key) => {
            const event = new KeyboardEvent('keydown', {
                key: key,
                code: key === 'Escape' ? 'Escape' : `Key${key.toUpperCase()}`,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        },

        simulateMouseMove: (x, y) => {
            const event = new MouseEvent('mousemove', {
                clientX: x,
                clientY: y,
                bubbles: true,
                cancelable: true
            });
            document.dispatchEvent(event);
        },

        findTextElement: () => {
            // Find a paragraph or text element for testing
            const textElements = document.querySelectorAll('p, div, span, h1, h2, h3, h4, h5, h6');
            for (let element of textElements) {
                if (element.textContent && element.textContent.trim().length > 20) {
                    return element;
                }
            }
            return null;
        },

        getElementCenter: (element) => {
            const rect = element.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        },

        checkKeyPilotLoaded: () => {
            return window.__KeyPilotV22 !== undefined;
        },

        getSelectionText: () => {
            const selection = window.getSelection();
            return selection ? selection.toString() : '';
        }
    };

    // Test cases
    const Tests = {
        async testKeyPilotLoaded() {
            console.log('🔍 Test 1: Checking if KeyPilot is loaded...');
            
            if (TestUtils.checkKeyPilotLoaded()) {
                console.log('✅ KeyPilot is loaded and ready');
                return true;
            } else {
                console.log('❌ KeyPilot is not loaded');
                return false;
            }
        },

        async testCharacterSelectionMode() {
            console.log('🔍 Test 2: Testing character selection mode activation...');
            
            const textElement = TestUtils.findTextElement();
            if (!textElement) {
                console.log('❌ No suitable text element found for testing');
                return false;
            }

            const center = TestUtils.getElementCenter(textElement);
            
            // Move cursor to text element
            TestUtils.simulateMouseMove(center.x, center.y);
            await TestUtils.delay(TEST_CONFIG.CURSOR_MOVE_DELAY);

            // Press H to enter character selection mode
            TestUtils.simulateKeyPress('h');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Check if highlight mode indicator is visible
            const indicator = document.querySelector('.kpv2-highlight-mode-indicator');
            if (indicator && indicator.textContent.includes('CHARACTER SELECTION')) {
                console.log('✅ Character selection mode activated successfully');
                console.log('📝 Mode indicator text:', indicator.textContent);
                return true;
            } else {
                console.log('❌ Character selection mode not activated or indicator not found');
                return false;
            }
        },

        async testCharacterSelection() {
            console.log('🔍 Test 3: Testing character selection functionality...');
            
            const textElement = TestUtils.findTextElement();
            if (!textElement) {
                console.log('❌ No suitable text element found for testing');
                return false;
            }

            const rect = textElement.getBoundingClientRect();
            const startX = rect.left + 50;
            const startY = rect.top + rect.height / 2;
            const endX = rect.left + 150;
            const endY = rect.top + rect.height / 2;

            // Start selection
            TestUtils.simulateMouseMove(startX, startY);
            await TestUtils.delay(TEST_CONFIG.CURSOR_MOVE_DELAY);
            TestUtils.simulateKeyPress('h');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Extend selection
            TestUtils.simulateMouseMove(endX, endY);
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Check if text is selected
            const selectedText = TestUtils.getSelectionText();
            if (selectedText && selectedText.trim().length > 0) {
                console.log('✅ Text selection successful');
                console.log('📝 Selected text:', `"${selectedText.substring(0, 50)}..."`);
                
                // Complete selection
                TestUtils.simulateKeyPress('h');
                await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);
                
                return true;
            } else {
                console.log('❌ No text was selected');
                return false;
            }
        },

        async testRectangleSelectionMode() {
            console.log('🔍 Test 4: Testing rectangle selection mode activation...');
            
            const textElement = TestUtils.findTextElement();
            if (!textElement) {
                console.log('❌ No suitable text element found for testing');
                return false;
            }

            const center = TestUtils.getElementCenter(textElement);
            
            // Move cursor to text element
            TestUtils.simulateMouseMove(center.x, center.y);
            await TestUtils.delay(TEST_CONFIG.CURSOR_MOVE_DELAY);

            // Press R to enter rectangle selection mode
            TestUtils.simulateKeyPress('r');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Check if highlight mode indicator shows rectangle mode
            const indicator = document.querySelector('.kpv2-highlight-mode-indicator');
            if (indicator && indicator.textContent.includes('RECTANGLE SELECTION')) {
                console.log('✅ Rectangle selection mode activated successfully');
                console.log('📝 Mode indicator text:', indicator.textContent);
                
                // Cancel mode for cleanup
                TestUtils.simulateKeyPress('Escape');
                await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);
                
                return true;
            } else {
                console.log('❌ Rectangle selection mode not activated or indicator not found');
                return false;
            }
        },

        async testRectangleSelectionCompletion() {
            console.log('🔍 Test 5: Testing rectangle selection completion with R key...');
            
            const textElement = TestUtils.findTextElement();
            if (!textElement) {
                console.log('❌ No suitable text element found for testing');
                return false;
            }

            const rect = textElement.getBoundingClientRect();
            const startX = rect.left + 50;
            const startY = rect.top + rect.height / 2;
            const endX = rect.left + 150;
            const endY = rect.top + rect.height / 2;

            // Start rectangle selection
            TestUtils.simulateMouseMove(startX, startY);
            await TestUtils.delay(TEST_CONFIG.CURSOR_MOVE_DELAY);
            TestUtils.simulateKeyPress('r');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Extend selection
            TestUtils.simulateMouseMove(endX, endY);
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Complete selection with R key
            TestUtils.simulateKeyPress('r');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Check if mode was exited (indicator should be gone)
            const indicator = document.querySelector('.kpv2-highlight-mode-indicator');
            if (!indicator || indicator.style.display === 'none') {
                console.log('✅ Rectangle selection completed with R key');
                return true;
            } else {
                console.log('❌ Rectangle selection not completed properly');
                // Cleanup
                TestUtils.simulateKeyPress('Escape');
                return false;
            }
        },

        async testModeCancel() {
            console.log('🔍 Test 6: Testing selection mode cancellation...');
            
            const textElement = TestUtils.findTextElement();
            if (!textElement) {
                console.log('❌ No suitable text element found for testing');
                return false;
            }

            const center = TestUtils.getElementCenter(textElement);
            
            // Enter character selection mode
            TestUtils.simulateMouseMove(center.x, center.y);
            await TestUtils.delay(TEST_CONFIG.CURSOR_MOVE_DELAY);
            TestUtils.simulateKeyPress('h');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Cancel with ESC
            TestUtils.simulateKeyPress('Escape');
            await TestUtils.delay(TEST_CONFIG.SELECTION_DELAY);

            // Check if mode indicator is hidden
            const indicator = document.querySelector('.kpv2-highlight-mode-indicator');
            if (!indicator || indicator.style.display === 'none') {
                console.log('✅ Selection mode cancelled successfully');
                return true;
            } else {
                console.log('❌ Selection mode not cancelled properly');
                return false;
            }
        }
    };

    // Run all tests
    async function runAllTests() {
        console.log('🚀 Starting Character Selection Test Suite...\n');
        
        const testResults = [];
        const testMethods = Object.keys(Tests);
        
        for (let i = 0; i < testMethods.length; i++) {
            const testName = testMethods[i];
            const testMethod = Tests[testName];
            
            try {
                const result = await testMethod();
                testResults.push({ name: testName, passed: result });
                
                if (i < testMethods.length - 1) {
                    await TestUtils.delay(TEST_CONFIG.DELAY_BETWEEN_TESTS);
                }
            } catch (error) {
                console.error(`❌ Test ${testName} threw an error:`, error);
                testResults.push({ name: testName, passed: false, error });
            }
            
            console.log(''); // Add spacing between tests
        }

        // Print summary
        console.log('📊 Test Results Summary');
        console.log('======================');
        
        const passed = testResults.filter(r => r.passed).length;
        const total = testResults.length;
        
        testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.name}`);
            if (result.error) {
                console.log(`   Error: ${result.error.message}`);
            }
        });
        
        console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! Character selection is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the implementation.');
        }
    }

    // Auto-run tests if this script is executed directly
    if (typeof window !== 'undefined') {
        // Add a global function to manually run tests
        window.testCharacterSelection = runAllTests;
        
        // Auto-run after a short delay to ensure page is loaded
        setTimeout(() => {
            console.log('🔧 Character selection test suite loaded.');
            console.log('💡 Run window.testCharacterSelection() to start tests.');
            console.log('💡 Or tests will auto-run in 2 seconds...');
            
            setTimeout(runAllTests, 2000);
        }, 1000);
    }

})();