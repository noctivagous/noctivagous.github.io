/**
 * Debug content script to test basic functionality
 */

console.log('[KeyPilot Debug] Starting debug script...');

// Test 1: Basic JavaScript execution
console.log('[KeyPilot Debug] ✅ JavaScript execution working');

// Test 2: Chrome runtime API availability
if (typeof chrome !== 'undefined' && chrome.runtime) {
  console.log('[KeyPilot Debug] ✅ Chrome runtime API available');
} else {
  console.error('[KeyPilot Debug] ❌ Chrome runtime API not available');
}

// Test 3: Try to create a simple cursor
try {
  const cursor = document.createElement('div');
  cursor.id = 'keypilot-debug-cursor';
  cursor.style.cssText = `
    position: fixed;
    top: 100px;
    left: 100px;
    width: 20px;
    height: 20px;
    background: red;
    border-radius: 50%;
    z-index: 999999;
    pointer-events: none;
  `;
  document.body.appendChild(cursor);
  console.log('[KeyPilot Debug] ✅ Basic DOM manipulation working');
} catch (error) {
  console.error('[KeyPilot Debug] ❌ DOM manipulation failed:', error);
}

// Test 4: Try basic event listening
try {
  document.addEventListener('keydown', (e) => {
    if (e.key === 'f' || e.key === 'F') {
      console.log('[KeyPilot Debug] ✅ F key detected');
      // Try to highlight links
      const links = document.querySelectorAll('a');
      links.forEach((link, index) => {
        link.style.outline = '3px solid red';
        setTimeout(() => {
          link.style.outline = '';
        }, 2000);
      });
    }
  });
  console.log('[KeyPilot Debug] ✅ Event listener attached');
} catch (error) {
  console.error('[KeyPilot Debug] ❌ Event listener failed:', error);
}

// Test 5: Try Chrome storage API
try {
  if (chrome.storage) {
    chrome.storage.local.get(['test'], (result) => {
      console.log('[KeyPilot Debug] ✅ Chrome storage API working');
    });
  }
} catch (error) {
  console.error('[KeyPilot Debug] ❌ Chrome storage API failed:', error);
}

console.log('[KeyPilot Debug] Debug script loaded. Press F to test link highlighting.');
