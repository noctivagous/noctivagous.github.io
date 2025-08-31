/**
 * Early injection script for KeyPilot - runs at document_start
 * Makes SVG cursor available immediately before page load
 */

(function() {
  'use strict';

  // Constants extracted from main extension for early injection
  const CURSOR_ID = 'kpv2-cursor';
  const STYLE_ID = 'kpv2-early-style';
  const Z_INDEX_CURSOR = 2147483647;
  const FOCUS_GREEN_BRIGHT = 'rgba(0,128,0,0.95)';
  const SVG_NS = 'http://www.w3.org/2000/svg';

  // Essential CSS for early injection with maximum specificity
  const EARLY_CSS = `
    html body #${CURSOR_ID}, 
    html #${CURSOR_ID}, 
    #${CURSOR_ID} {
      position: fixed !important;
      pointer-events: none !important;
      z-index: ${Z_INDEX_CURSOR} !important;
      transform: translate(-50%, -50%) !important;
      user-select: none !important;
      -webkit-user-select: none !important;
      -moz-user-select: none !important;
      -ms-user-select: none !important;
      display: block !important;
      visibility: visible !important;
      opacity: 1 !important;
      width: 94px !important;
      height: 94px !important;
    }
    
    html body #${CURSOR_ID} svg,
    html #${CURSOR_ID} svg,
    #${CURSOR_ID} svg {
      filter: drop-shadow(2px 2px 4px rgba(0,0,0,0.3)) !important;
      display: block !important;
      width: 100% !important;
      height: 100% !important;
    }
  `;

  // Early cursor state
  let earlyCursor = null;
  let isExtensionEnabled = true;
  let currentMode = 'none';
  let mousePosition = { x: 0, y: 0 };
  let earlyObserver = null;
  let earlyClickableElements = new Set();
  let keyboardListenersActive = false;
  let pendingKeyEvents = [];

  /**
   * Create minimal SVG cursor for early injection
   */
  function createEarlyCursor() {
    if (earlyCursor) return earlyCursor;

    // Create cursor container
    const container = document.createElement('div');
    container.id = CURSOR_ID;
    container.setAttribute('aria-hidden', 'true');
    
    // Apply essential styles for immediate visibility
    Object.assign(container.style, {
      position: 'fixed',
      left: '0px',
      top: '0px',
      width: '94px',
      height: '94px',
      transform: 'translate(-50%, -50%)',
      pointerEvents: 'none',
      zIndex: Z_INDEX_CURSOR.toString(),
      display: 'block', // Show immediately for early injection
      visibility: 'visible'
    });

    // Create SVG cursor
    const svg = createCursorSVG('none');
    container.appendChild(svg);

    earlyCursor = container;
    return container;
  }

  /**
   * Create SVG cursor element
   */
  function createCursorSVG(mode) {
    const svg = document.createElementNS(SVG_NS, 'svg');
    svg.setAttribute('viewBox', '0 0 94 94');
    svg.setAttribute('width', '94');
    svg.setAttribute('height', '94');
    svg.setAttribute('xmlns', SVG_NS);

    const addLine = (x1, y1, x2, y2, color, width = '4') => {
      const line = document.createElementNS(SVG_NS, 'line');
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      line.setAttribute('stroke', color);
      line.setAttribute('stroke-width', width);
      line.setAttribute('stroke-linecap', 'round');
      svg.appendChild(line);
    };

    // Default green crosshair
    const color = FOCUS_GREEN_BRIGHT;
    addLine('47', '10', '47', '34', color);
    addLine('47', '60', '47', '84', color);
    addLine('10', '47', '34', '47', color);
    addLine('60', '47', '84', '47', color);

    return svg;
  }

  /**
   * Update cursor position
   */
  function updateCursorPosition(x, y) {
    if (!earlyCursor) return;
    
    mousePosition = { x, y };
    earlyCursor.style.left = `${x}px`;
    earlyCursor.style.top = `${y}px`;
  }

  /**
   * Show/hide cursor based on extension state
   */
  function updateCursorVisibility() {
    if (!earlyCursor) return;
    
    earlyCursor.style.display = isExtensionEnabled ? 'block' : 'none';
  }

  /**
   * Handle mouse movement for early cursor tracking
   */
  function handleMouseMove(event) {
    if (!isExtensionEnabled) return;
    updateCursorPosition(event.clientX, event.clientY);
  }

  /**
   * Initialize early storage for faster state loading
   */
  function initEarlyStorage() {
    // Pre-warm storage connections for faster access
    if (typeof chrome !== 'undefined' && chrome.storage) {
      // Test storage availability early
      chrome.storage.sync.get(['keypilot_enabled'], (result) => {
        if (chrome.runtime.lastError) {
          // Storage not available, will fallback to localStorage
          isExtensionEnabled = true; // Default to enabled
          updateCursorVisibility();
          return;
        }
        isExtensionEnabled = result.keypilot_enabled !== false;
        updateCursorVisibility();
      });
    } else {
      // No chrome storage available, default to enabled
      isExtensionEnabled = true;
      updateCursorVisibility();
    }
  }

  /**
   * Check extension state from storage
   */
  async function checkExtensionState() {
    try {
      if (typeof chrome !== 'undefined' && chrome.storage) {
        const result = await chrome.storage.sync.get(['keypilot_enabled']);
        isExtensionEnabled = result.keypilot_enabled !== false; // Default to true
      }
    } catch (error) {
      // Fallback to localStorage if Chrome storage fails
      try {
        const stored = localStorage.getItem('keypilot_enabled');
        isExtensionEnabled = stored !== 'false';
      } catch (e) {
        isExtensionEnabled = true; // Default enabled
      }
    }
    updateCursorVisibility();
  }

  /**
   * Listen for extension state changes
   */
  function setupStateListener() {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'EXTENSION_TOGGLED') {
          isExtensionEnabled = message.enabled;
          updateCursorVisibility();
        } else if (message.type === 'CURSOR_MODE_CHANGE') {
          currentMode = message.mode;
          // Early cursor only shows basic crosshair, mode changes handled by main extension
        }
      });
    }
  }

  /**
   * Inject essential CSS for early cursor styling
   */
  function injectEarlyCSS() {
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = EARLY_CSS;
    
    // Inject at the end of head to prevent override, or use documentElement
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    }
  }

  /**
   * Re-inject CSS to ensure it's not overridden by page styles
   */
  function reInjectCSS() {
    const existingStyle = document.getElementById(STYLE_ID);
    if (existingStyle) {
      existingStyle.remove();
    }
    injectEarlyCSS();
  }

  /**
   * Check if element is clickable for early detection
   */
  function isClickableElement(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) return false;
    
    const tagName = element.tagName.toLowerCase();
    const clickableTags = ['a', 'button', 'input', 'select', 'textarea'];
    
    return clickableTags.includes(tagName) || 
           element.hasAttribute('onclick') ||
           element.getAttribute('role') === 'button' ||
           element.getAttribute('role') === 'link';
  }

  /**
   * Start early DOM observation for clickable elements
   */
  function startEarlyDOMObservation() {
    if (!window.MutationObserver) return;

    earlyObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        // Check added nodes
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // Check the node itself
            if (isClickableElement(node)) {
              earlyClickableElements.add(node);
            }
            
            // Check child elements (lightweight scan)
            const clickables = node.querySelectorAll?.('a, button, input, select, textarea, [role="button"], [role="link"]');
            if (clickables) {
              clickables.forEach(el => earlyClickableElements.add(el));
            }
          }
        });

        // Remove deleted nodes
        mutation.removedNodes.forEach((node) => {
          if (node.nodeType === Node.ELEMENT_NODE) {
            earlyClickableElements.delete(node);
          }
        });
      });
    });

    // Start observing
    earlyObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true
    });

    // Initial scan of existing elements
    const existingClickables = document.querySelectorAll('a, button, input, select, textarea, [role="button"], [role="link"]');
    existingClickables.forEach(el => earlyClickableElements.add(el));
  }

  /**
   * Handle early keyboard events for immediate responsiveness
   */
  function handleEarlyKeydown(event) {
    if (!isExtensionEnabled) return;

    // Store key event for main extension
    pendingKeyEvents.push({
      key: event.key,
      code: event.code,
      timestamp: Date.now(),
      ctrlKey: event.ctrlKey,
      altKey: event.altKey,
      shiftKey: event.shiftKey,
      metaKey: event.metaKey
    });

    // Keep only recent events (last 5 seconds)
    const fiveSecondsAgo = Date.now() - 5000;
    pendingKeyEvents = pendingKeyEvents.filter(e => e.timestamp > fiveSecondsAgo);

    // Handle Alt+K toggle immediately for responsiveness
    if (event.altKey && (event.key === 'k' || event.key === 'K')) {
      event.preventDefault();
      // Send toggle message to background script
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'KP_TOGGLE_EXTENSION' });
      }
    }
  }

  /**
   * Start early keyboard event capture
   */
  function startEarlyKeyboardCapture() {
    if (keyboardListenersActive) return;
    
    document.addEventListener('keydown', handleEarlyKeydown, { 
      passive: false, 
      capture: true 
    });
    keyboardListenersActive = true;
  }

  /**
   * Stop early keyboard event capture
   */
  function stopEarlyKeyboardCapture() {
    if (!keyboardListenersActive) return;
    
    document.removeEventListener('keydown', handleEarlyKeydown, { capture: true });
    keyboardListenersActive = false;
  }

  /**
   * Initialize early injection
   */
  function initEarlyInjection() {
    // Initialize early storage for faster state loading
    initEarlyStorage();
    
    // Inject CSS immediately for proper styling
    injectEarlyCSS();
    
    // Start early DOM observation
    startEarlyDOMObservation();
    
    // Start early keyboard capture for immediate responsiveness
    startEarlyKeyboardCapture();
    
    // Create cursor immediately
    const cursor = createEarlyCursor();
    
    // Add to DOM as soon as possible
    const addToDOM = () => {
      if (document.body) {
        document.body.appendChild(cursor);
        // Re-inject CSS after DOM is ready to prevent override
        reInjectCSS();
        // Start mouse tracking
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        // Ensure cursor is visible and positioned
        updateCursorVisibility();
        updateCursorPosition(window.innerWidth / 2, window.innerHeight / 2); // Start at center
        
        // Debug logging
        console.log('[KeyPilot Early] Cursor added to DOM:', {
          element: cursor,
          display: cursor.style.display,
          position: cursor.style.position,
          zIndex: cursor.style.zIndex
        });
      } else if (document.documentElement) {
        document.documentElement.appendChild(cursor);
        reInjectCSS();
        document.addEventListener('mousemove', handleMouseMove, { passive: true });
        updateCursorVisibility();
        updateCursorPosition(window.innerWidth / 2, window.innerHeight / 2); // Start at center
        
        console.log('[KeyPilot Early] Cursor added to documentElement');
      } else {
        // Retry in next tick
        setTimeout(addToDOM, 1);
      }
    };

    addToDOM();
    setupStateListener();

    // Clean up when main extension loads - but DON'T remove the cursor
    window.addEventListener('keypilot-main-loaded', () => {
      // Stop early mouse tracking (main extension will handle this)
      document.removeEventListener('mousemove', handleMouseMove);
      
      // Stop early keyboard capture
      stopEarlyKeyboardCapture();
      
      // Stop early DOM observation
      if (earlyObserver) {
        earlyObserver.disconnect();
        earlyObserver = null;
      }
      
      // Keep early CSS to prevent style conflicts - main extension will override as needed
      // Don't remove the cursor element - main extension has taken it over
      
      console.log('[KeyPilot Early] Handed off to main extension, cursor preserved');
    });
  }

  /**
   * Expose early cursor API for main extension
   */
  window.KEYPILOT_EARLY = {
    getCursor: () => earlyCursor,
    getPosition: () => mousePosition,
    getClickableElements: () => Array.from(earlyClickableElements),
    getPendingKeyEvents: () => [...pendingKeyEvents],
    clearPendingKeyEvents: () => { pendingKeyEvents = []; },
    updatePosition: updateCursorPosition,
    setEnabled: (enabled) => {
      isExtensionEnabled = enabled;
      updateCursorVisibility();
    },
    cleanup: () => {
      if (earlyCursor && earlyCursor.parentNode) {
        earlyCursor.remove();
        document.removeEventListener('mousemove', handleMouseMove);
      }
      stopEarlyKeyboardCapture();
      if (earlyObserver) {
        earlyObserver.disconnect();
      }
    }
  };

  // Check extension state before initialization
  async function init() {
    await checkExtensionState();
    if (isExtensionEnabled) {
      initEarlyInjection();
    } else {
      console.log('[KeyPilot Early] Extension is disabled, skipping early injection');
    }
  }
  
  // Start initialization
  init();

})();
