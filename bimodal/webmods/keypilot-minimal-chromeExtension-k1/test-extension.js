/**
 * Simple test script to verify KeyPilot functionality
 */

// Test if KeyPilot is loaded
function testKeyPilotLoaded() {
  console.log('Testing KeyPilot loading...');
  
  if (window.__KeyPilotV22) {
    console.log('✅ KeyPilot is loaded');
    return true;
  } else {
    console.log('❌ KeyPilot is not loaded');
    return false;
  }
}

// Test cursor creation
function testCursorCreation() {
  console.log('Testing cursor creation...');
  
  const cursor = document.getElementById('kpv2-cursor');
  if (cursor) {
    console.log('✅ Cursor element found');
    return true;
  } else {
    console.log('❌ Cursor element not found');
    return false;
  }
}

// Test styles injection
function testStylesInjection() {
  console.log('Testing styles injection...');
  
  const style = document.getElementById('kpv2-style');
  if (style) {
    console.log('✅ Styles injected');
    return true;
  } else {
    console.log('❌ Styles not found');
    return false;
  }
}

// Test text input detection
function testTextInputDetection() {
  console.log('Testing text input detection...');
  
  // Create a test input
  const input = document.createElement('input');
  input.type = 'text';
  input.id = 'test-input';
  document.body.appendChild(input);
  
  // Focus the input
  input.focus();
  
  // Check if cursor changes (wait a bit for async detection)
  setTimeout(() => {
    const cursor = document.getElementById('kpv2-cursor');
    if (cursor && cursor.querySelector('text')) {
      console.log('✅ Text focus detection working');
    } else {
      console.log('❌ Text focus detection not working');
    }
    
    // Clean up
    input.remove();
  }, 600);
}

// Run all tests
function runTests() {
  console.log('🧪 Running KeyPilot tests...');
  
  const tests = [
    testKeyPilotLoaded,
    testCursorCreation,
    testStylesInjection,
    testTextInputDetection
  ];
  
  tests.forEach((test, index) => {
    setTimeout(() => test(), index * 100);
  });
}

// Auto-run tests when script loads
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(runTests, 1000); // Wait for KeyPilot to initialize
  });
} else {
  setTimeout(runTests, 1000);
}

// Export for manual testing
window.testKeyPilot = {
  runTests,
  testKeyPilotLoaded,
  testCursorCreation,
  testStylesInjection,
  testTextInputDetection
};