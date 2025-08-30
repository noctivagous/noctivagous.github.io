/**
 * KeyPilot Debug Scripts Library
 * Injectable debugging functions using chrome.userScripts.execute()
 */

const KeyPilotDebugScripts = {
  /**
   * Basic extension status check
   */
  extensionStatus: `
    (() => {
      const result = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        keyPilotLoaded: !!window.__KeyPilotApp,
        toggleHandlerLoaded: !!window.__KeyPilotToggleHandler,
        extensionAPILoaded: !!window.KeyPilotExtension,
        linksFound: document.querySelectorAll('a[href]').length,
        overlaysPresent: document.querySelectorAll('[data-keypilot-overlay]').length
      };
      
      if (window.__KeyPilotToggleHandler) {
        result.extensionEnabled = window.__KeyPilotToggleHandler.isEnabled();
      }
      
      console.log('[KeyPilot Debug] Extension Status:', result);
      return result;
    })()
  `,

  /**
   * Test F key functionality (link overlay creation)
   */
  testFKey: `
    (() => {
      console.log('[KeyPilot Debug] Testing F key functionality...');
      
      const beforeOverlays = document.querySelectorAll('[data-keypilot-overlay]').length;
      
      // Simulate F key press
      const event = new KeyboardEvent('keydown', { 
        key: 'f', 
        code: 'KeyF',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      
      // Check results after a short delay
      setTimeout(() => {
        const afterOverlays = document.querySelectorAll('[data-keypilot-overlay]').length;
        const result = {
          beforeOverlays,
          afterOverlays,
          overlaysCreated: afterOverlays - beforeOverlays,
          success: afterOverlays > beforeOverlays
        };
        console.log('[KeyPilot Debug] F Key Test Result:', result);
      }, 200);
      
      return 'F key test initiated - check console for results';
    })()
  `,

  /**
   * Test G key functionality (link overlay creation)
   */
  testGKey: `
    (() => {
      console.log('[KeyPilot Debug] Testing G key functionality...');
      
      const beforeOverlays = document.querySelectorAll('[data-keypilot-overlay]').length;
      
      // Simulate G key press
      const event = new KeyboardEvent('keydown', { 
        key: 'g', 
        code: 'KeyG',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      
      // Check results after a short delay
      setTimeout(() => {
        const afterOverlays = document.querySelectorAll('[data-keypilot-overlay]').length;
        const result = {
          beforeOverlays,
          afterOverlays,
          overlaysCreated: afterOverlays - beforeOverlays,
          success: afterOverlays > beforeOverlays
        };
        console.log('[KeyPilot Debug] G Key Test Result:', result);
      }, 200);
      
      return 'G key test initiated - check console for results';
    })()
  `,

  /**
   * Test H key functionality (text selection)
   */
  testHKey: `
    (() => {
      console.log('[KeyPilot Debug] Testing H key functionality...');
      
      // Simulate H key press
      const event = new KeyboardEvent('keydown', { 
        key: 'h', 
        code: 'KeyH',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      
      return 'H key test initiated - check for text selection mode activation';
    })()
  `,

  /**
   * Test Y key functionality (rectangle text selection)
   */
  testYKey: `
    (() => {
      console.log('[KeyPilot Debug] Testing Y key functionality...');
      
      // Simulate Y key press
      const event = new KeyboardEvent('keydown', { 
        key: 'y', 
        code: 'KeyY',
        bubbles: true,
        cancelable: true
      });
      document.dispatchEvent(event);
      
      return 'Y key test initiated - check for rectangle selection mode activation';
    })()
  `,

  /**
   * Toggle extension state
   */
  toggleExtension: `
    (() => {
      if (window.__KeyPilotToggleHandler) {
        const beforeState = window.__KeyPilotToggleHandler.isEnabled();
        console.log('[KeyPilot Debug] Toggling extension from:', beforeState);
        
        window.__KeyPilotToggleHandler.toggle().then(() => {
          const afterState = window.__KeyPilotToggleHandler.isEnabled();
          console.log('[KeyPilot Debug] Extension toggled to:', afterState);
        });
        
        return { before: beforeState, action: 'toggle_initiated' };
      } else {
        console.error('[KeyPilot Debug] Toggle handler not available');
        return { error: 'Toggle handler not available' };
      }
    })()
  `,

  /**
   * Link detection and analysis
   */
  analyzeLinkDetection: `
    (() => {
      const links = document.querySelectorAll('a[href]');
      const result = {
        totalLinks: links.length,
        visibleLinks: 0,
        linkDetails: []
      };
      
      links.forEach((link, index) => {
        const rect = link.getBoundingClientRect();
        const isVisible = rect.width > 0 && rect.height > 0 && 
                         rect.top >= 0 && rect.left >= 0 &&
                         rect.bottom <= window.innerHeight && 
                         rect.right <= window.innerWidth;
        
        if (isVisible) result.visibleLinks++;
        
        if (index < 10) { // Only log first 10 for brevity
          result.linkDetails.push({
            index,
            text: link.textContent.trim().substring(0, 50),
            href: link.href,
            visible: isVisible,
            rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height }
          });
        }
      });
      
      console.log('[KeyPilot Debug] Link Analysis:', result);
      return result;
    })()
  `,

  /**
   * Create visual test overlay
   */
  createTestOverlay: `
    (() => {
      // Remove any existing test overlays
      document.querySelectorAll('[data-keypilot-debug-test]').forEach(el => el.remove());
      
      const overlay = document.createElement('div');
      overlay.setAttribute('data-keypilot-debug-test', 'true');
      overlay.style.cssText = \`
        position: fixed;
        top: 20px;
        right: 20px;
        width: 200px;
        height: 100px;
        background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
        color: white;
        z-index: 999999;
        padding: 10px;
        border-radius: 8px;
        font-family: monospace;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
      \`;
      
      overlay.innerHTML = \`
        <div><strong>KeyPilot Debug</strong></div>
        <div>Test Overlay Active</div>
        <div style="font-size: 10px; margin-top: 5px;">
          \${new Date().toLocaleTimeString()}
        </div>
      \`;
      
      document.body.appendChild(overlay);
      
      // Auto-remove after 5 seconds
      setTimeout(() => {
        overlay.remove();
        console.log('[KeyPilot Debug] Test overlay removed');
      }, 5000);
      
      console.log('[KeyPilot Debug] Test overlay created');
      return 'Test overlay created - will auto-remove in 5 seconds';
    })()
  `,

  /**
   * Performance analysis
   */
  performanceAnalysis: `
    (() => {
      const result = {
        timestamp: new Date().toISOString(),
        performance: {
          domElements: document.querySelectorAll('*').length,
          links: document.querySelectorAll('a[href]').length,
          images: document.querySelectorAll('img').length,
          scripts: document.querySelectorAll('script').length
        },
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight,
          scrollX: window.scrollX,
          scrollY: window.scrollY
        },
        keyPilotElements: {
          overlays: document.querySelectorAll('[data-keypilot-overlay]').length,
          cursors: document.querySelectorAll('[data-keypilot-cursor]').length,
          highlights: document.querySelectorAll('[data-keypilot-highlight]').length
        }
      };
      
      // Memory usage if available
      if (performance.memory) {
        result.memory = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
        };
      }
      
      console.log('[KeyPilot Debug] Performance Analysis:', result);
      return result;
    })()
  `,

  /**
   * Cursor functionality test
   */
  testCursor: `
    (() => {
      console.log('[KeyPilot Debug] Testing cursor functionality...');
      
      const cursors = document.querySelectorAll('[data-keypilot-cursor]');
      const result = {
        cursorsFound: cursors.length,
        cursorDetails: []
      };
      
      cursors.forEach((cursor, index) => {
        const rect = cursor.getBoundingClientRect();
        result.cursorDetails.push({
          index,
          visible: cursor.style.display !== 'none',
          position: { x: rect.x, y: rect.y },
          size: { width: rect.width, height: rect.height }
        });
      });
      
      // Test cursor movement by simulating mouse move
      const moveEvent = new MouseEvent('mousemove', {
        clientX: 100,
        clientY: 100,
        bubbles: true
      });
      document.dispatchEvent(moveEvent);
      
      console.log('[KeyPilot Debug] Cursor Test Result:', result);
      return result;
    })()
  `,

  /**
   * Custom script execution template
   */
  customScript: (userScript) => `
    (() => {
      try {
        console.log('[KeyPilot Debug] Executing custom script...');
        const result = (${userScript})();
        console.log('[KeyPilot Debug] Custom script result:', result);
        return result;
      } catch (error) {
        console.error('[KeyPilot Debug] Custom script error:', error);
        return { error: error.message, stack: error.stack };
      }
    })()
  `
};

// Export for use in background script
if (typeof module !== 'undefined' && module.exports) {
  module.exports = KeyPilotDebugScripts;
}
