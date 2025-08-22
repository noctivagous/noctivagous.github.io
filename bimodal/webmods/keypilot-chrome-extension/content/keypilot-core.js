/* =========================================================================
   KeyPilot Core v2.1 — Chrome Extension Adapted Version
   -------------------------------------------------------------------------
   Adapted from keyPilot.js for use in Chrome extension content scripts
   - Removed auto-initialization and global window attachment
   - Added external API methods (enable, disable, getStatus, setDebug)
   - Modified to work within content script context without conflicts
   ========================================================================= */

(() => {
  // Prevent multiple initialization
  if (window.__KeyPilotExtensionCore) {
    console.warn('[KeyPilot Extension] Core already loaded.');
    return;
  }

  // ------------------------------ Utilities ------------------------------
  const $ = (s, r = document) => r.querySelector(s);
  const CLICKABLE_ROLES = [
    'button', 'link', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
    'option', 'checkbox', 'radio', 'switch', 'treeitem', 'gridcell', 'cell', 'row',
    'combobox', 'slider', 'spinbutton'
  ];
  const CLICKABLE_SEL = [
    'a[href]', 'button', 'summary',
    'input:not([type="hidden"])', 'select', 'textarea',
    '[contenteditable]', '[role]', '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  const KP = {
    enabled: false,
    mode: 'none', // 'none' | 'click' | 'highlight' | 'delete' | 'copy'
    lastMouse: { x: 0, y: 0 },
    focusEl: null,
    deleteEl: null,
    selectedElements: new Set(), // For multi-select with H key
    listeners: [],
    debug: false,
    shadowRoots: new Set(),
    lastFocusedInput: null, // Track last focused input for smart focus management
    isOverInput: false, // Track if cursor is over input field
    hoverMode: 'clickable', // 'clickable' | 'any'
  };

  function dbg(...args) {
    if (!KP.debug) return;
    try { console.debug('[KeyPilot Extension]', ...args); } catch { }
    const pane = $('#kpv2-log');
    if (!pane) return;
    const line = document.createElement('div');
    const ts = new Date().toISOString().split('T')[1].replace('Z', '');
    line.textContent = `${ts}  ${args.map(a => {
      try { return typeof a === 'string' ? a : JSON.stringify(a); } catch { return String(a); }
    }).join(' ')}`;
    pane.appendChild(line);
    // Trim log entries
    while (pane.childElementCount > 200) pane.removeChild(pane.firstChild);
    pane.scrollTop = pane.scrollHeight;
  }

  function isLikelyInteractive(el) {
    if (!el || el.nodeType !== 1) return false;
    
    // Check basic clickable selectors
    if (el.matches(CLICKABLE_SEL)) return true;
    
    // Check ARIA roles
    const role = (el.getAttribute('role') || '').trim().toLowerCase();
    if (role && CLICKABLE_ROLES.includes(role)) return true;
    
    // Check for semantic interactive elements
    if (/^(label|summary|details|option|select|legend)$/i.test(el.tagName)) return true;
    
    // Check for custom elements with event handlers
    if (el.tagName.includes('-')) {
      if (typeof el.onclick === 'function') return true;
      if (el.getAttribute('onclick')) return true;
      // Check for framework-specific handlers
      if (el.__vue__ && el.__vue__.$listeners && el.__vue__.$listeners.click) return true;
      if (el._reactInternalFiber && el._reactInternalFiber.memoizedProps && el._reactInternalFiber.memoizedProps.onClick) return true;
    }
    
    // Check for elements with click event listeners
    if (hasClickListeners(el)) return true;
    
    // Check for elements with cursor pointer style
    const computedStyle = window.getComputedStyle(el);
    if (computedStyle.cursor === 'pointer') return true;
    
    // Check for elements that look like buttons/links based on content
    if (looksLikeInteractiveContent(el)) return true;
    
    // Check for data attributes that suggest interactivity
    const dataAttrs = el.getAttributeNames().filter(name => name.startsWith('data-'));
    const interactiveDataAttrs = ['data-toggle', 'data-target', 'data-action', 'data-click', 'data-href', 'data-link'];
    if (dataAttrs.some(attr => interactiveDataAttrs.includes(attr))) return true;
    
    return false;
  }
  
  // Helper function to detect click event listeners
  function hasClickListeners(el) {
    try {
      // Check for onclick attribute
      if (el.getAttribute('onclick')) return true;
      
      // Check for common event listener indicators
      if (el._events && el._events.click) return true;
      
      // Check jQuery data
      if (window.jQuery && window.jQuery._data) {
        const events = window.jQuery._data(el, 'events');
        if (events && events.click) return true;
      }
      
      // Check for React props
      const reactFiber = el._reactInternalFiber || el.__reactInternalInstance;
      if (reactFiber && reactFiber.memoizedProps && reactFiber.memoizedProps.onClick) return true;
      
      // Check for Vue listeners
      if (el.__vue__ && el.__vue__.$listeners && el.__vue__.$listeners.click) return true;
      
    } catch (error) {
      // Ignore errors in listener detection
    }
    return false;
  }
  
  // Helper function to detect interactive-looking content
  function looksLikeInteractiveContent(el) {
    const text = (el.textContent || '').trim().toLowerCase();
    const interactiveWords = [
      'click', 'tap', 'press', 'select', 'choose', 'submit', 'send', 'go', 'next', 'prev',
      'login', 'signup', 'register', 'download', 'upload', 'save', 'delete', 'edit', 'view',
      'more', 'less', 'expand', 'collapse', 'show', 'hide', 'toggle', 'menu', 'close'
    ];
    
    // Check if text contains interactive words
    if (interactiveWords.some(word => text.includes(word))) return true;
    
    // Check for button-like text patterns
    if (/^(ok|yes|no|cancel|apply|reset|clear|search)$/i.test(text)) return true;
    
    // Check for navigation-like text
    if (/^(home|back|forward|up|down|left|right)$/i.test(text)) return true;
    
    // Check for short text that might be a button (1-3 words, under 50 chars)
    const words = text.split(/\s+/).filter(w => w.length > 0);
    if (words.length <= 3 && text.length <= 50 && text.length > 0) {
      // Additional heuristics for button-like appearance
      const style = window.getComputedStyle(el);
      if (style.backgroundColor !== 'rgba(0, 0, 0, 0)' || 
          style.border !== '0px none rgb(0, 0, 0)' ||
          style.padding !== '0px') {
        return true;
      }
    }
    
    return false;
  }

  function findClickable(el) {
    let n = el;
    while (n && n !== document.body && n.nodeType === 1) {
      if (isLikelyInteractive(n)) return n;
      n = n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null);
    }
    return el && isLikelyInteractive(el) ? el : null;
  }

  // Deepest element at point through nested open shadow roots
  function deepElementFromPoint(x, y) {
  function descend(doc, vx, vy, depth = 0) {
    if (depth > 10) return null;
    let el = doc.elementFromPoint(vx, vy);
    if (!el) return null;
    // Shadow DOM
    let guard = 0;
    while (el && el.shadowRoot && guard++ < 10) {
      const nested = el.shadowRoot.elementFromPoint(vx, vy);
      if (!nested || nested === el) break;
      el = nested;
    }
    // Same-origin iframe
    if (el && el.tagName === 'IFRAME') {
      try {
        const r = el.getBoundingClientRect();
        const idoc = el.contentDocument;
        if (idoc) {
          const nx = vx - r.left;
          const ny = vy - r.top;
          const inside = descend(idoc, nx, ny, depth + 1);
          return inside || el;
        }
      } catch { /* cross-origin */ }
    }
    return el;
  }
  return descend(document, x, y, 0);
}

function snapToLarger(el) {
  if (!el || el === document.body || el === document.documentElement) return el;
  const vw = Math.max(1, window.innerWidth), vh = Math.max(1, window.innerHeight);
  const maxArea = vw * vh * 0.9;
  const startRect = el.getBoundingClientRect();
  let best = el;
  let n = el;
  let hops = 0;
  while (n && n !== document.body && n !== document.documentElement && hops++ < 12) {
    const r = n.getBoundingClientRect();
    const area = r.width * r.height;
    if (area <= 0 || area > maxArea) break;
    const cs = getComputedStyle(n);
    const isBlockish = /block|grid|flex|table|inline-block/.test(cs.display);
    const padded = (parseFloat(cs.paddingTop) + parseFloat(cs.paddingRight) + parseFloat(cs.paddingBottom) + parseFloat(cs.paddingLeft)) > 8;
    const bordered = (parseFloat(cs.borderTopWidth) + parseFloat(cs.borderRightWidth) + parseFloat(cs.borderBottomWidth) + parseFloat(cs.borderLeftWidth)) > 0;
    const hasBg = (cs.backgroundImage !== 'none') || (cs.backgroundColor && cs.backgroundColor !== 'rgba(0, 0, 0, 0)');
    const grewEnough = (r.width >= startRect.width * 1.15) || (r.height >= startRect.height * 1.15);
    if (isBlockish && (padded || bordered || hasBg) && grewEnough) best = n;
    n = n.parentElement || (n.getRootNode() instanceof ShadowRoot ? n.getRootNode().host : null);
  }
  return best || el;
}


  function smartClick(el, clientX, clientY) {
    if (!el) return false;
    dbg('smartClick target:', el.tagName, el.id || '', el.className || '');
    
    // Show click feedback animation
    showClickFeedback(el);
    
    let success = false;
    
    // Strategy 1: Try native click() method first
    try {
      if (typeof el.click === 'function') {
        el.click();
        success = true;
        dbg('Native click() succeeded');
      }
    } catch (error) {
      dbg('Native click() failed:', error.message);
    }
    
    // Strategy 2: Dispatch comprehensive event sequence
    const opts = { 
      bubbles: true, 
      cancelable: true, 
      composed: true, 
      view: window, 
      clientX: clientX || 0, 
      clientY: clientY || 0,
      button: 0,
      buttons: 1,
      detail: 1
    };
    
    const events = [
      'pointerdown',
      'mousedown', 
      'mouseup',
      'click'
    ];
    
    for (const eventType of events) {
      try {
        const event = new MouseEvent(eventType, opts);
        const dispatched = el.dispatchEvent(event);
        if (dispatched) success = true;
        dbg(`${eventType} dispatched:`, dispatched);
      } catch (error) {
        dbg(`${eventType} dispatch failed:`, error.message);
      }
    }
    
    // Strategy 3: Try to find and invoke event listeners manually
    if (!success) {
      success = tryManualEventInvocation(el, 'click', opts);
    }
    
    // Strategy 4: Framework-specific handlers
    if (!success) {
      success = tryFrameworkHandlers(el, opts);
    }
    
    // Strategy 5: Focus and keyboard activation for form elements
    if (!success && isFormElement(el)) {
      success = tryKeyboardActivation(el);
    }
    
    // Strategy 6: Parent element delegation
    if (!success) {
      success = tryParentDelegation(el, clientX, clientY);
    }
    
    dbg('smartClick result:', success ? 'SUCCESS' : 'FAILED');
    return success;
  }
  
  // Helper function to manually invoke event listeners
  function tryManualEventInvocation(el, eventType, eventOptions) {
    try {
      // Check for common event listener properties
      const handlerProp = 'on' + eventType;
      if (el[handlerProp] && typeof el[handlerProp] === 'function') {
        const syntheticEvent = new MouseEvent(eventType, eventOptions);
        el[handlerProp].call(el, syntheticEvent);
        dbg('Manual handler invocation succeeded:', handlerProp);
        return true;
      }
      
      // Try to access internal event listeners (browser-specific)
      if (el._events && el._events[eventType]) {
        const handlers = Array.isArray(el._events[eventType]) ? el._events[eventType] : [el._events[eventType]];
        const syntheticEvent = new MouseEvent(eventType, eventOptions);
        handlers.forEach(handler => {
          if (typeof handler === 'function') {
            handler.call(el, syntheticEvent);
          } else if (handler.handler && typeof handler.handler === 'function') {
            handler.handler.call(el, syntheticEvent);
          }
        });
        dbg('Internal event listeners invoked');
        return true;
      }
    } catch (error) {
      dbg('Manual event invocation failed:', error.message);
    }
    return false;
  }
  
  // Helper function to try framework-specific handlers
  function tryFrameworkHandlers(el, eventOptions) {
    try {
      // jQuery event handlers
      if (window.jQuery && window.jQuery.fn) {
        const $el = window.jQuery(el);
        if ($el.length > 0) {
          // Try jQuery's trigger method
          $el.trigger('click');
          dbg('jQuery trigger succeeded');
          return true;
        }
      }
      
      // React event handlers (look for React fiber)
      const reactFiber = el._reactInternalFiber || el.__reactInternalInstance;
      if (reactFiber && reactFiber.memoizedProps && reactFiber.memoizedProps.onClick) {
        const syntheticEvent = new MouseEvent('click', eventOptions);
        reactFiber.memoizedProps.onClick(syntheticEvent);
        dbg('React onClick handler invoked');
        return true;
      }
      
      // Vue.js event handlers
      if (el.__vue__ && el.__vue__.$listeners && el.__vue__.$listeners.click) {
        const syntheticEvent = new MouseEvent('click', eventOptions);
        el.__vue__.$listeners.click(syntheticEvent);
        dbg('Vue click listener invoked');
        return true;
      }
      
      // Angular event handlers (look for ng-click or similar)
      if (el.getAttribute && el.getAttribute('ng-click')) {
        // Try to trigger Angular's digest cycle
        if (window.angular) {
          const scope = window.angular.element(el).scope();
          if (scope) {
            scope.$apply();
            dbg('Angular scope applied');
            return true;
          }
        }
      }
      
    } catch (error) {
      dbg('Framework handler invocation failed:', error.message);
    }
    return false;
  }
  
  // Helper function to check if element is a form element
  function isFormElement(el) {
    const formTags = ['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'OPTION'];
    return formTags.includes(el.tagName) || el.getAttribute('role') === 'button';
  }
  
  // Helper function to try keyboard activation
  function tryKeyboardActivation(el) {
    try {
      // Focus the element first
      if (typeof el.focus === 'function') {
        el.focus();
      }
      
      // Try Enter key for buttons and form elements
      const enterEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      
      const dispatched = el.dispatchEvent(enterEvent);
      
      // Also try keyup
      const enterUpEvent = new KeyboardEvent('keyup', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true,
        cancelable: true
      });
      
      el.dispatchEvent(enterUpEvent);
      
      if (dispatched) {
        dbg('Keyboard activation succeeded');
        return true;
      }
    } catch (error) {
      dbg('Keyboard activation failed:', error.message);
    }
    return false;
  }
  
  // Helper function to try parent element delegation
  function tryParentDelegation(el, clientX, clientY) {
    try {
      // Sometimes click handlers are on parent elements with event delegation
      let parent = el.parentElement;
      let attempts = 0;
      
      while (parent && attempts < 3) {
        // Check if parent has click handlers
        if (parent.onclick || parent.getAttribute('onclick')) {
          const opts = { 
            bubbles: true, 
            cancelable: true, 
            composed: true, 
            view: window, 
            clientX: clientX || 0, 
            clientY: clientY || 0,
            target: el // Set original target
          };
          
          const clickEvent = new MouseEvent('click', opts);
          Object.defineProperty(clickEvent, 'target', { value: el, enumerable: true });
          
          const dispatched = parent.dispatchEvent(clickEvent);
          if (dispatched) {
            dbg('Parent delegation succeeded on:', parent.tagName);
            return true;
          }
        }
        
        parent = parent.parentElement;
        attempts++;
      }
    } catch (error) {
      dbg('Parent delegation failed:', error.message);
    }
    return false;
  }

  function el(tag, props = {}, ...children) {
    const node = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) {
      if (v == null) continue;
      if (k === 'className') node.className = v;
      else if (k === 'text') node.textContent = v;
      else node.setAttribute(k, v);
    }
    for (const c of children) {
      if (c == null) continue;
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    }
    return node;
  }

  // ------------------------------- Styles --------------------------------
  const SHARED_CSS = `
/* Enhanced cursor system with override protection */
:host, :root {}

/* Default crosshair cursor - high specificity to override site CSS */
.kpv2-host-on, .kpv2-host-on *, 
.kpv2-host-on *:hover, .kpv2-host-on *:focus, .kpv2-host-on *:active,
.kpv2-host-on input, .kpv2-host-on button, .kpv2-host-on a, .kpv2-host-on select { 
  cursor: url("data:image/svg+xml;utf8,\\
<svg xmlns='http://www.w3.org/2000/svg' width='94' height='94' viewBox='0 0 94 94'>\\
  <g>\\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2'/>\\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(0,128,0,0.25)' stroke-width='6'/>\\
    <line x1='47' y1='10' x2='47' y2='34' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='47' y1='60' x2='47' y2='84' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='10' y1='47' x2='34' y2='47' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='60' y1='47' x2='84' y2='47' stroke='rgba(0,128,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
  </g>\\
</svg>") 47 47, crosshair !important; 
}

/* Red delete cursor for delete mode */
.kpv2-delete-mode, .kpv2-delete-mode *, 
.kpv2-delete-mode *:hover, .kpv2-delete-mode *:focus, .kpv2-delete-mode *:active { 
  cursor: url("data:image/svg+xml;utf8,\\
<svg xmlns='http://www.w3.org/2000/svg' width='94' height='94' viewBox='0 0 94 94'>\\
  <g>\\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2'/>\\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(220,0,0,0.25)' stroke-width='6'/>\\
    <line x1='47' y1='10' x2='47' y2='34' stroke='rgba(220,0,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='47' y1='60' x2='47' y2='84' stroke='rgba(220,0,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='10' y1='47' x2='34' y2='47' stroke='rgba(220,0,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='60' y1='47' x2='84' y2='47' stroke='rgba(220,0,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='30' y1='30' x2='64' y2='64' stroke='rgba(220,0,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='64' y1='30' x2='30' y2='64' stroke='rgba(220,0,0,0.95)' stroke-width='4' stroke-linecap='round'/>\\
  </g>\\
</svg>") 47 47, crosshair !important; 
}

/* Purple selection cursor for highlight mode */
.kpv2-highlight-mode, .kpv2-highlight-mode *, 
.kpv2-highlight-mode *:hover, .kpv2-highlight-mode *:focus, .kpv2-highlight-mode *:active { 
  cursor: url("data:image/svg+xml;utf8,\\
<svg xmlns='http://www.w3.org/2000/svg' width='94' height='94' viewBox='0 0 94 94'>\\
  <g>\\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(0,0,0,0.35)' stroke-width='2'/>\\
    <circle cx='47' cy='47' r='44' fill='none' stroke='rgba(111,66,193,0.25)' stroke-width='6'/>\\
    <line x1='47' y1='10' x2='47' y2='34' stroke='rgba(111,66,193,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='47' y1='60' x2='47' y2='84' stroke='rgba(111,66,193,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='10' y1='47' x2='34' y2='47' stroke='rgba(111,66,193,0.95)' stroke-width='4' stroke-linecap='round'/>\\
    <line x1='60' y1='47' x2='84' y2='47' stroke='rgba(111,66,193,0.95)' stroke-width='4' stroke-linecap='round'/>\\
  </g>\\
</svg>") 47 47, crosshair !important; 
}

/* Input field cursor override - only when hovering over input */
.kpv2-host-on input:hover, .kpv2-host-on textarea:hover, 
.kpv2-host-on [contenteditable]:hover {
  cursor: text !important;
}

.kpv2-focus { outline: 3px solid rgba(0,180,0,0.95) !important; box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5) !important; }
.kpv2-delete { outline: 3px solid rgba(220,0,0,0.95) !important; box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45) !important; }
.kpv2-selected { outline: 3px solid rgba(111,66,193,0.95) !important; box-shadow: 0 0 0 2px rgba(111,66,193,0.45), 0 0 10px 2px rgba(111,66,193,0.5) !important; background-color: rgba(111,66,193,0.1) !important; }
.kpv2-hidden { display: none !important; }
@keyframes kpv2-ripple { 0%{transform:translate(-50%,-50%) scale(.25); opacity:.35;} 60%{transform:translate(-50%,-50%) scale(1); opacity:.2;} 100%{transform:translate(-50%,-50%) scale(1.6); opacity:0;} }
.kpv2-ripple { position: fixed; left: 0; top: 0; z-index: 2147483646; pointer-events: none; width: 46px; height: 46px; border-radius: 50%; background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.22) 60%, rgba(0,200,0,0) 70%); animation: kpv2-ripple 420ms ease-out forwards; }
mark.kpv2-mark { background: rgba(255,230,0,.85); color: inherit; padding: 0 .05em; border-radius: .15em; }
#kpv2-hud { position: fixed; right: 10px; bottom: 10px; z-index: 2147483647; padding: 8px 10px; border-radius: 10px; font: 12px/1.3 system-ui, Arial, sans-serif; background: rgba(32,32,32,0.92); color: #fff; border: 1px solid rgba(255,255,255,0.15); box-shadow: 0 6px 16px rgba(0,0,0,0.3); min-width: 190px; max-width: 36ch; }
#kpv2-hud .row { display: flex; gap: 6px; align-items: baseline; margin: 2px 0; }
#kpv2-hud .k { display:inline-block; min-width: 22px; padding: 2px 6px; border-radius: 5px; background:#1e90ff; }
#kpv2-status.ok { color: #86f089; }
#kpv2-status.warn { color: #ffd36a; }
#kpv2-status.err { color: #ff7f7f; }
#kpv2-status.purple { color: #c084fc; }
#kpv2-log { max-height: 120px; overflow:auto; margin-top: 6px; padding: 6px; background: rgba(0,0,0,0.35); font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; font-size: 11px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.12); }

/* Status Box (upper left corner) - REMOVED - now integrated into HUD */

/* Tabbed HUD */
#kpv2-hud .tabs { display: flex !important; margin-bottom: 8px !important; border-bottom: 1px solid rgba(255,255,255,0.2) !important; }
#kpv2-hud .tab { padding: 4px 8px !important; cursor: pointer !important; border-radius: 4px 4px 0 0 !important; font-size: 11px !important; background: rgba(255,255,255,0.1) !important; margin-right: 2px !important; transition: background 0.2s ease !important; }
#kpv2-hud .tab:hover { background: rgba(255,255,255,0.2) !important; }
#kpv2-hud .tab.active { background: rgba(30,144,255,0.8) !important; color: white !important; }
#kpv2-hud .tab-content { display: none !important; }
#kpv2-hud .tab-content.active { display: block !important; }


/* Action Animations */
@keyframes kpv2-action-popup { 0% { transform: translate(-50%, -50%) scale(0.5); opacity: 0; } 20% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; } 100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0; } }
.kpv2-action-popup { position: fixed !important; left: 50% !important; top: 50% !important; transform: translate(-50%, -50%) !important; z-index: 2147483646 !important; pointer-events: none !important; background: rgba(0, 0, 0, 0.9) !important; color: white !important; padding: 12px 20px !important; border-radius: 8px !important; font: bold 16px/1.3 system-ui, Arial, sans-serif !important; border: 2px solid #28a745 !important; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important; animation: kpv2-action-popup 2s ease-out forwards !important; }
.kpv2-action-popup.delete { border-color: #dc3545 !important; background: rgba(220, 53, 69, 0.9) !important; }
.kpv2-action-popup.copy { border-color: #007cba !important; background: rgba(0, 124, 186, 0.9) !important; }

/* Enhanced Delete Mode Visualization */
.kpv2-delete-target-inner { 
  outline: 2px dashed #dc3545 !important; 
  outline-offset: -2px !important; 
  background: repeating-linear-gradient(45deg, rgba(220,53,69,0.1), rgba(220,53,69,0.1) 10px, rgba(220,53,69,0.2) 10px, rgba(220,53,69,0.2) 20px) !important;
}
.kpv2-delete-target-outer { 
  outline: 2px dashed #dc3545 !important; 
  outline-offset: 2px !important; 
}

.kpv2-focus-clickable { outline-color: #1e90ff !important; box-shadow: 0 0 0 2px rgba(30,144,255,0.35) inset !important; }
.kpv2-focus-any { outline-color: #ff9800 !important; box-shadow: 0 0 0 2px rgba(255,152,0,0.35) inset !important; }
#kpv2-hud .seg { display:inline-flex !important; border:1px solid rgba(255,255,255,0.2) !important; border-radius:8px !important; overflow:hidden !important; }
#kpv2-hud .seg-btn { padding:4px 8px !important; background:transparent !important; color:#fff !important; border:0 !important; cursor:pointer !important; font: 12px/1.2 system-ui, Arial, sans-serif !important; }
#kpv2-hud .seg-btn.active { background: rgba(255,255,255,0.12) !important; }

/* Status Section in HUD */
#kpv2-hud .status-section {
  margin: 8px 0 !important;
  padding: 8px !important;
  background: rgba(0, 124, 186, 0.1) !important;
  border: 1px solid rgba(0, 124, 186, 0.3) !important;
  border-radius: 6px !important;
}
#kpv2-hud .status-title {
  font-weight: bold !important;
  font-size: 13px !important;
  color: #fff !important;
  margin-bottom: 4px !important;
}
#kpv2-hud .status-detail {
  font-size: 11px !important;
  color: rgba(255, 255, 255, 0.8) !important;
  line-height: 1.3 !important;
}


/* Click Animation */
@keyframes kpv2-click-feedback { 
  0% { transform: scale(1) brightness(1); } 
  50% { transform: scale(1.05) brightness(0.8); } 
  100% { transform: scale(1) brightness(1); } 
}
.kpv2-click-feedback { 
  animation: kpv2-click-feedback 0.3s ease-out !important; 
}

/* Semi-transparent Status Box - REMOVED - now integrated into HUD */

/* Overlay Frame System */
.kpv2-overlay-frame {
  position: absolute !important;
  pointer-events: none !important;
  z-index: 2147483645 !important;
  border: 3px solid #007cba !important;
  border-radius: 4px !important;
  background: rgba(0, 124, 186, 0.1) !important;
  box-shadow: 0 0 0 1px rgba(0, 124, 186, 0.3) !important;
}

.kpv2-overlay-frame.delete {
  border-color: #dc3545 !important;
  background: rgba(220, 53, 69, 0.1) !important;
  box-shadow: 0 0 0 1px rgba(220, 53, 69, 0.3) !important;
}

.kpv2-overlay-frame.highlight {
  border-color: #6f42c1 !important;
  background: rgba(111, 66, 193, 0.1) !important;
  box-shadow: 0 0 0 1px rgba(111, 66, 193, 0.3) !important;
}

/* Element Type Indicator */
.kpv2-type-indicator {
  position: absolute !important;
  top: -25px !important;
  left: 0 !important;
  background: rgba(0, 0, 0, 0.9) !important;
  color: white !important;
  padding: 2px 8px !important;
  border-radius: 4px !important;
  font: bold 12px/1.2 system-ui, Arial, sans-serif !important;
  z-index: 2147483646 !important;
  pointer-events: none !important;
}

.kpv2-type-indicator.text { background: rgba(40, 167, 69, 0.9) !important; }
.kpv2-type-indicator.image { background: rgba(255, 193, 7, 0.9) !important; color: black !important; }
.kpv2-type-indicator.link { background: rgba(0, 123, 255, 0.9) !important; }

/* Tab Overlay */
.kpv2-tab-overlay {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background: rgba(0, 0, 0, 0.8) !important;
  z-index: 2147483647 !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 20px !important;
  box-sizing: border-box !important;
}

.kpv2-tab-overlay-header {
  color: white !important;
  font: bold 24px/1.3 system-ui, Arial, sans-serif !important;
  margin-bottom: 20px !important;
  text-align: center !important;
}

.kpv2-tab-overlay-content {
  flex: 1 !important;
  overflow-y: auto !important;
  display: grid !important;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)) !important;
  gap: 20px !important;
}

.kpv2-window-group {
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 8px !important;
  padding: 15px !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
}

.kpv2-window-title {
  color: #fff !important;
  font: bold 16px/1.3 system-ui, Arial, sans-serif !important;
  margin-bottom: 10px !important;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2) !important;
  padding-bottom: 5px !important;
}

.kpv2-tab-item {
  display: flex !important;
  align-items: center !important;
  padding: 8px 12px !important;
  margin: 4px 0 !important;
  background: rgba(255, 255, 255, 0.1) !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  transition: background 0.2s ease !important;
  border: 1px solid transparent !important;
}

.kpv2-tab-item:hover {
  background: rgba(255, 255, 255, 0.2) !important;
  border-color: rgba(255, 255, 255, 0.3) !important;
}

.kpv2-tab-item.current {
  background: rgba(0, 124, 186, 0.3) !important;
  border-color: #007cba !important;
}

.kpv2-tab-favicon {
  width: 16px !important;
  height: 16px !important;
  margin-right: 8px !important;
  flex-shrink: 0 !important;
}

.kpv2-tab-title {
  color: white !important;
  font: 14px/1.3 system-ui, Arial, sans-serif !important;
  flex: 1 !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  white-space: nowrap !important;
}

.kpv2-tab-url {
  color: rgba(255, 255, 255, 0.7) !important;
  font: 12px/1.3 system-ui, Arial, sans-serif !important;
  margin-left: 8px !important;
  flex-shrink: 0 !important;
}

/* Also apply host class from <html> if present */
html.kpv2-host-on, html.kpv2-host-on *, 
html.kpv2-host-on *:hover, html.kpv2-host-on *:focus, html.kpv2-host-on *:active {
  cursor: inherit !important; /* Inherit from html where we set the data-URL through body rule */
}


.kpv2-overlay-close {
  position: absolute !important;
  top: 20px !important;
  right: 20px !important;
  background: rgba(220, 53, 69, 0.8) !important;
  color: white !important;
  border: none !important;
  padding: 8px 12px !important;
  border-radius: 4px !important;
  cursor: pointer !important;
  font: bold 14px/1.3 system-ui, Arial, sans-serif !important;
}

.kpv2-overlay-close:hover {
  background: rgba(220, 53, 69, 1) !important;
}
`;

  function ensureSharedStylesIn(docOrRoot = document) {
    const root = docOrRoot instanceof ShadowRoot ? docOrRoot : docOrRoot.documentElement;
    if (!root) return;
    const id = 'kpv2-style';
    const existing = (docOrRoot instanceof ShadowRoot ? docOrRoot : document).getElementById?.(id);
    if (existing) return; // Avoid duplicating in documents
    const styleEl = document.createElement('style');
    styleEl.id = id;
    styleEl.textContent = SHARED_CSS;
    (docOrRoot instanceof ShadowRoot ? docOrRoot : document.head).appendChild(styleEl);
  }

  // Inject styles to current open shadow roots and patch attachShadow for future ones
  (function patchAttachShadow() {
    const orig = Element.prototype.attachShadow;
    Element.prototype.attachShadow = function (init) {
      const root = orig.call(this, init);
      // Only open shadow roots are accessible
      try { ensureSharedStylesIn(root); KP.shadowRoots.add(root); dbg('attachShadow patched + injected for', this.tagName); } catch { }
      return root;
    };
    // Inject into existing open roots
    const walker = document.createTreeWalker(document, NodeFilter.SHOW_ELEMENT);
    let n;
    while ((n = walker.nextNode())) {
      if (n.shadowRoot) {
        try { ensureSharedStylesIn(n.shadowRoot); KP.shadowRoots.add(n.shadowRoot); } catch { }
      }
    }
  })();
  // ------------------------------- HUD -----------------------------------

  // HUD toggle helpers
function toggleHUDVisibility() { $('#kpv2-hud') ? removeHUD() : ensureHUD(); }
function showHUD() { ensureHUD(); }
function hideHUD() { removeHUD(); }
function expandHUD() { showHUD(); }
function compactHUD() { showHUD(); }


function setHoverMode(mode) {
  const next = (mode === 'any') ? 'any' : 'clickable';
  if (KP.hoverMode === next) return;
  KP.hoverMode = next;
  if ($('#kpv2-hud')) {
    $('#kpv2-hover-clickable')?.classList.toggle('active', KP.hoverMode === 'clickable');
    $('#kpv2-hover-any')?.classList.toggle('active', KP.hoverMode === 'any');
  }
  const detail = KP.hoverMode === 'clickable'
    ? 'Hover: Clickable — Press F to click, H to select'
    : 'Hover: Any — Press F to click, H to select';
  updateHUDStatus('KeyPilot Ready', detail);
  
  // Update HUD status to reflect hover mode change
  if (KP.enabled) {
    updateHUDStatus('KeyPilot Ready', detail);
  }
  
  try {
    if (chrome?.storage?.sync) {
      chrome.storage.sync.get(['keyPilotSettings']).then(({ keyPilotSettings }) => {
        const cur = keyPilotSettings || {};
        chrome.storage.sync.set({ keyPilotSettings: { ...cur, hoverMode: KP.hoverMode } });
      });
    }
  } catch {}
}

  function ensureHUD() {
    if ($('#kpv2-hud')) return;
    const hud = el('div', { id: 'kpv2-hud' });

    // Enhanced header with status information
    const head = el('div', { className: 'row' },
      el('span', { text: 'KeyPilot' }),
      el('span', { id: 'kpv2-status', className: 'ok', text: 'ON' })
    );
    
    // Status info section
    const statusSection = el('div', { className: 'status-section' });
    const statusTitle = el('div', { id: 'kpv2-status-title', className: 'status-title', text: 'KeyPilot Ready' });
    const statusDetail = el('div', { id: 'kpv2-status-detail', className: 'status-detail', text: 'Press F to click, H to select' });
    statusSection.append(statusTitle, statusDetail);
    
    // Create tabs
    const tabs = el('div', { className: 'tabs' });
    const basicsTab = el('div', { className: 'tab active', text: 'Basics' });
    const advancedTab = el('div', { className: 'tab', text: 'Advanced' });
    const debugTab = el('div', { className: 'tab', text: 'Debug' });
    
    tabs.append(basicsTab, advancedTab, debugTab);
    
    const mkRow = (k, msg) => el('div', { className: 'row' }, el('span', { className: 'k', text: k }), el('span', { text: msg }));

    // Basics tab content
    const basicsContent = el('div', { className: 'tab-content active' });
    basicsContent.append(
      mkRow('F', 'Click under cursor'),
      mkRow('H', 'Multi-select mode'),
      mkRow('D', 'Delete mode'),
      mkRow('K', 'Copy to clipboard'),
      mkRow('Alt+Shift+B', 'Toggle ON/OFF')
    );
    
    // HUD Basics tab content: add segmented control
const hoverRow = el('div', { className: 'row' });
const hoverLabel = el('span', { text: 'Hover' });
const seg = el('div', { className: 'seg', id: 'kpv2-hover-seg' });
const btnClickable = el('button', { className: 'seg-btn', id: 'kpv2-hover-clickable', text: 'Clickable' });
const btnAny = el('button', { className: 'seg-btn', id: 'kpv2-hover-any', text: 'Any' });
seg.append(btnClickable, btnAny);
hoverRow.append(hoverLabel, seg);
basicsContent.append(hoverRow);

  // HUD wiring
  function reflectHoverMode() {
    $('#kpv2-hover-clickable')?.classList.toggle('active', KP.hoverMode === 'clickable');
    $('#kpv2-hover-any')?.classList.toggle('active', KP.hoverMode === 'any');
    const detail = KP.hoverMode === 'clickable'
      ? 'Hover: Clickable — Press F to click, H to select'
      : 'Hover: Any — Press F to click, H to select';
    updateHUDStatus('KeyPilot Ready', detail);
    
    // Dispatch custom event for hover mode change
    document.dispatchEvent(new CustomEvent('keyPilotHoverModeChange', {
      detail: { 
        hoverMode: KP.hoverMode,
        enabled: KP.enabled 
      }
    }));
  }
btnClickable.addEventListener('click', () => setHoverMode('clickable'));
btnAny.addEventListener('click', () => setHoverMode('any'));
reflectHoverMode();



    // Advanced tab content
    const advancedContent = el('div', { className: 'tab-content' });
    advancedContent.append(
      mkRow('[ ]', 'Scale selected elements'),
      mkRow('O', 'Show all tabs overlay'),
      mkRow('`', 'Go to site root'),
      mkRow('ESC', 'Cancel current mode'),
      mkRow('Alt+Shift+P', 'Toggle debug mode')
    );
    
    // Debug tab content
    const debugContent = el('div', { className: 'tab-content' });
    const log = el('div', { id: 'kpv2-log' });
    debugContent.append(log);

    hud.append(head, statusSection, tabs, basicsContent, advancedContent, debugContent);
    
    // Add tab click handlers
    basicsTab.addEventListener('click', () => switchTab('basics'));
    advancedTab.addEventListener('click', () => switchTab('advanced'));
    debugTab.addEventListener('click', () => switchTab('debug'));
    
    document.body.appendChild(hud);
  }
  
  
  function switchTab(tabName) {
    const hud = $('#kpv2-hud');
    if (!hud) return;
    
    // Remove active class from all tabs and contents
    hud.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    hud.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    // Add active class to selected tab and content
    const tabs = hud.querySelectorAll('.tab');
    const contents = hud.querySelectorAll('.tab-content');
    
    if (tabName === 'basics') {
      tabs[0].classList.add('active');
      contents[0].classList.add('active');
    } else if (tabName === 'advanced') {
      tabs[1].classList.add('active');
      contents[1].classList.add('active');
    } else if (tabName === 'debug') {
      tabs[2].classList.add('active');
      contents[2].classList.add('active');
    }
  }
  function setHUDStatus(text, cls) {
    const s = $('#kpv2-status'); if (!s) return; s.textContent = text; s.className = cls || 'ok';
    
    // Also update the status section if it exists
    if (text === 'DELETE') {
      updateHUDStatus('Delete Mode', 'Move cursor over elements and press D to delete');
    } else if (text === 'SELECT') {
      updateHUDStatus('Multi-Select Mode', 'Click elements to select/deselect them');
    } else if (text === 'DEBUG') {
      updateHUDStatus('Debug Mode', 'Enhanced logging and debugging enabled');
    } else if (text === 'ON') {
      updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
    }
  }
  function removeHUD() { $('#kpv2-hud')?.remove(); }

  // ------------------------- Ripple (click feedback) ----------------------
  function rippleAt(x, y) {
    const r = el('div', { className: 'kpv2-ripple' });
    r.style.left = x + 'px'; r.style.top = y + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), { once: true });
  }

  // --------------------------- Highlight helpers --------------------------
  function getActiveSelection() {
    // Prefer selection belonging to the deepest node under cursor (shadow-aware)
    const under = deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
    const root = under ? under.getRootNode() : document;
    if (root instanceof ShadowRoot && root.getSelection) return root.getSelection();
    return document.getSelection();
  }

  function markSelectionPrimary() {
    const sel = getActiveSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    try {
      const range = sel.getRangeAt(0).cloneRange();
      const frag = range.extractContents();
      const wrap = el('mark', { className: 'kpv2-mark' });
      wrap.appendChild(frag);
      range.insertNode(wrap);
      sel.removeAllRanges();
      dbg('highlight primary applied');
      return true;
    } catch (e) { dbg('highlight primary failed', e.message || e); return false; }
  }

  function markSelectionFallback() {
    const sel = getActiveSelection();
    if (!sel || sel.rangeCount === 0 || sel.isCollapsed) return false;
    const range = sel.getRangeAt(0);

    const intersects = (textNode) => {
      const r = document.createRange();
      r.selectNodeContents(textNode);
      return !(range.compareBoundaryPoints(Range.END_TO_START, r) <= 0 ||
        range.compareBoundaryPoints(Range.START_TO_END, r) >= 0);
    };

    const walker = document.createTreeWalker(
      range.commonAncestorContainer,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode(node) {
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return intersects(node) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
        }
      }
    );

    const nodes = [];
    let cur; while ((cur = walker.nextNode())) nodes.push(cur);
    if (!nodes.length) return false;

    const first = nodes[0], last = nodes[nodes.length - 1];
    if (first === last) {
      const pre = first.splitText(range.startOffset);
      pre.splitText(range.endOffset - range.startOffset);
      nodes.length = 0; nodes.push(pre);
    } else {
      first.splitText(range.startOffset);
      last.splitText(range.endOffset);
    }

    for (const n of nodes) {
      if (!n.parentNode) continue;
      const m = el('mark', { className: 'kpv2-mark' });
      n.parentNode.insertBefore(m, n);
      m.appendChild(n);
    }
    sel.removeAllRanges();
    dbg('highlight fallback applied');
    return true;
  }

  function applyHighlight() {
    if (markSelectionPrimary()) return true;
    if (markSelectionFallback()) return true;

    // Last resort: mark a single character at caret under cursor
    const caretRange = (function () {
      if (document.caretRangeFromPoint) return document.caretRangeFromPoint(KP.lastMouse.x, KP.lastMouse.y);
      if (document.caretPositionFromPoint) {
        const pos = document.caretPositionFromPoint(KP.lastMouse.x, KP.lastMouse.y);
        if (!pos) return null;
        const r = document.createRange();
        r.setStart(pos.offsetNode, pos.offset);
        r.setEnd(pos.offsetNode, Math.min(pos.offset + 1, (pos.offsetNode.textContent || '').length));
        return r;
      }
      return null;
    })();

    if (caretRange) {
      const sel = getActiveSelection();
      try { sel.removeAllRanges(); sel.addRange(caretRange); } catch { }
      return markSelectionPrimary() || markSelectionFallback();
    }
    dbg('highlight failed: no selection');
    return false;
  }
  // ----------------------------- Event logic ------------------------------
  function updateFocusRings(candidate, deletingTarget) {
  // Remove from previous elements
  if (KP.focusEl) {
    KP.focusEl.classList.remove('kpv2-focus', 'kpv2-focus-clickable', 'kpv2-focus-any');
  }
  if (KP.deleteEl) {
    KP.deleteEl.classList.remove('kpv2-delete');
  }

  // Assign new targets
  KP.focusEl = candidate || null;
  KP.deleteEl = deletingTarget || null;

  // Add to new targets
  if (KP.focusEl) {
    KP.focusEl.classList.add('kpv2-focus');
    KP.focusEl.classList.add(KP.hoverMode === 'clickable' ? 'kpv2-focus-clickable' : 'kpv2-focus-any');
  }
  if (KP.deleteEl) {
    KP.deleteEl.classList.add('kpv2-delete');
  }
}


  function onMouseMove(e) {
    KP.lastMouse.x = e.clientX; KP.lastMouse.y = e.clientY;

   // onMouseMove
const under = deepElementFromPoint(e.clientX, e.clientY);
let candidate = null;
if (KP.hoverMode === 'clickable') {
  candidate = findClickable(under) || null;
} else {
  const snapped = snapToLarger(under);
  candidate = snapped || under || null;
}
updateFocusRings(candidate, null);

    const clickable = findClickable(under) || null;

    // Smart input field focus management
    const isInputField = under && (
      under.tagName === 'INPUT' || 
      under.tagName === 'TEXTAREA' || 
      under.isContentEditable
    );
    
    if (isInputField && !KP.isOverInput) {
      // Cursor moved over input field - focus it
      KP.isOverInput = true;
      KP.lastFocusedInput = under;
      updateHUDStatus('Input Field Active', 'Type normally - cursor controls focus');
      try {
        under.focus();
        dbg('input field focused on hover');
      } catch (err) {
        dbg('failed to focus input field:', err.message);
      }
    } else if (!isInputField && KP.isOverInput) {
      // Cursor moved away from input field - blur it
      KP.isOverInput = false;
      blurCurrentInput();
      // Restore previous status
      if (KP.mode === 'delete') {
        updateHUDStatus('Delete Mode', 'Move cursor over elements and press D to delete');
      } else if (KP.mode === 'highlight') {
        updateHUDStatus('Multi-Select Mode', 'Click elements to select/deselect them');
      } else {
        updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
      }
    }

    // Enhanced visualization for different modes
    if (KP.mode === 'delete' && under && !$('#kpv2-hud')?.contains(under)) {
      createDeleteVisualization(under);
    } else if (KP.mode === 'highlight' && under && !$('#kpv2-hud')?.contains(under)) {
      // Remove old overlay frames
      removeOverlayFrames();
      
      // Create new overlay frame with type indicator
      const frame = createOverlayFrame(under, 'highlight');
      if (frame) {
        showElementTypeIndicator(under, frame);
      }
    } else {
      // Clean up visualizations when not in special modes
      removeDeleteVisualization();
      removeOverlayFrames();
    }
    
    updateFocusRings(clickable, null);
  }

  function cancelModes() {
    KP.mode = 'none';
    
    // Clean up delete mode
    KP.deleteEl?.classList.remove('kpv2-delete'); 
    KP.deleteEl = null;
    document.body.classList.remove('kpv2-delete-mode');
    removeDeleteVisualization();
    
    // Clean up highlight mode
    document.body.classList.remove('kpv2-highlight-mode');
    KP.selectedElements.forEach(el => {
      try {
        el.classList.remove('kpv2-selected');
      } catch (err) {
        dbg('failed to remove selection from element:', err.message);
      }
    });
    KP.selectedElements.clear();
    removeOverlayFrames();
    
    // Clean up tab overlay
    hideTabOverlay();
    
        // Restore defaults
    setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok');
    updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
    document.documentElement.style.removeProperty('user-select');
    document.body.style.removeProperty('user-select');
    
    // Dispatch custom event for mode change
    document.dispatchEvent(new CustomEvent('keyPilotModeChange', {
      detail: { mode: 'none', enabled: KP.enabled }
    }));
    
    dbg('all modes cancelled');
  }

  function onKeyDown(e) {
    // Global toggles - Modified for extension context
    if (e.altKey && e.shiftKey && e.code === 'KeyB') {
      e.preventDefault();
      KP.enabled ? disable() : enable();
      return;
    }
    if (e.altKey && e.shiftKey && e.code === 'KeyH') {
  e.preventDefault();
  toggleHUDVisibility();
  return;
}
    if (e.altKey && e.shiftKey && e.code === 'KeyP') {
      e.preventDefault();
      KP.debug = !KP.debug;
      setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok');
      
      // Update HUD status to reflect debug mode change
      if (KP.debug) {
        updateHUDStatus('Debug Mode', 'Enhanced logging and debugging enabled');
      } else {
        updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
      }
      
      // Dispatch custom event for debug mode change
      document.dispatchEvent(new CustomEvent('keyPilotDebugChange', {
        detail: { 
          debug: KP.debug,
          enabled: KP.enabled 
        }
      }));
      
      dbg('debug toggled', KP.debug);
      return;
    }

    if (!KP.enabled) return;

    // Smart input field handling - only allow typing when cursor is over input
    const tag = (e.target && e.target.tagName || '').toLowerCase();
    const isInputField = tag === 'input' || tag === 'textarea' || (e.target && e.target.isContentEditable);
    
    if (isInputField && KP.isOverInput) {
      // Allow typing in input fields when cursor is over them
      if (e.key === 'Escape') {
        e.preventDefault();
        cancelModes();
        blurCurrentInput();
      }
      return; // permit typing
    } else if (isInputField && !KP.isOverInput) {
      // Prevent typing in input fields when cursor is not over them
      e.preventDefault();
    }

    if (e.key === 'Escape') { 
      e.preventDefault(); 
      cancelModes(); 
      blurCurrentInput();
      return; 
    }

    // D key - Delete mode (enhanced with multi-select support)
    if (e.key === 'd' || e.key === 'D') {
      e.preventDefault();
      
      if (KP.mode === 'highlight' && KP.selectedElements.size > 0) {
        // Delete all selected elements
        deleteSelectedElements();
        return;
      }
      
      if (KP.mode !== 'delete') {
        enterDeleteMode();
      } else {
        // Single delete mode - delete element under cursor
        const hud = $('#kpv2-hud');
        const victim = KP.deleteEl || deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
        cancelModes();
        if (!victim || (hud && hud.contains(victim)) || victim === document.documentElement || victim === document.body) {
          dbg('delete aborted: invalid target');
          return;
        }
        deleteElement(victim);
      }
      return;
    }

    // H key - Multi-select highlight mode
    if (e.key === 'h' || e.key === 'H') {
      e.preventDefault();
      
      if (KP.mode !== 'highlight') {
        enterHighlightMode();
      } else {
        // Toggle selection of element under cursor
        const el = deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
        if (el && !$('#kpv2-hud')?.contains(el)) {
          toggleElementSelection(el);
        }
      }
      return;
    }

    // K key - Copy to clipboard
    if (e.key === 'k' || e.key === 'K') {
      e.preventDefault();
      copyElementToClipboard();
      return;
    }

    // [ key - Scale down (in highlight mode)
    if (e.key === '[' && KP.mode === 'highlight') {
      e.preventDefault();
      scaleSelectedElements(0.9);
      return;
    }

    // ] key - Scale up (in highlight mode)
    if (e.key === ']' && KP.mode === 'highlight') {
      e.preventDefault();
      scaleSelectedElements(1.1);
      return;
    }

    // Prime/Tilde key - Navigate to site root
    if (e.key === '`' || e.key === '~') {
      e.preventDefault();
      navigateToSiteRoot();
      return;
    }

    // O key - Show tab overlay
    if (e.key === 'o' || e.key === 'O') {
      console.log('[KeyPilot Tab Overlay] O key pressed, triggering tab overlay');
      e.preventDefault();
      showTabOverlay();
      return;
    }

    // F key - Click mode
    if (e.key === 'f' || e.key === 'F') {
      e.preventDefault();
      const el = KP.focusEl || deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
      const target = findClickable(el) || el;
      rippleAt(KP.lastMouse.x, KP.lastMouse.y);
      if (target) smartClick(target, KP.lastMouse.x, KP.lastMouse.y);
      return;
    }
  }

  // --------------------------- New Helper Functions -----------------------
  
  // Smart input field focus management
  function blurCurrentInput() {
    if (document.activeElement && (
      document.activeElement.tagName === 'INPUT' || 
      document.activeElement.tagName === 'TEXTAREA' || 
      document.activeElement.isContentEditable
    )) {
      document.activeElement.blur();
      KP.lastFocusedInput = null;
      dbg('input field blurred');
    }
  }
  
  // Enhanced delete mode with visual indicators
  function enterDeleteMode() {
    KP.mode = 'delete';
    setHUDStatus('DELETE', 'err');
    document.body.classList.add('kpv2-delete-mode');
    KP.deleteEl = null;
    updateHUDStatus('Delete Mode', 'Move cursor over elements and press D to delete');
    
    // Dispatch custom event for mode change
    document.dispatchEvent(new CustomEvent('keyPilotModeChange', {
      detail: { mode: 'delete', enabled: KP.enabled }
    }));
    
    dbg('delete mode entered');
  }
  
  // Enhanced highlight mode for multi-select
  function enterHighlightMode() {
    KP.mode = 'highlight';
    setHUDStatus('SELECT', 'purple');
    document.body.classList.add('kpv2-highlight-mode');
    KP.selectedElements.clear();
    
    // Auto-select element under cursor when entering mode
    const el = deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
    if (el && !$('#kpv2-hud')?.contains(el)) {
      toggleElementSelection(el);
    }
    
    updateHUDStatus('Multi-Select Mode', 'Click elements to select/deselect them');
    
    // Dispatch custom event for mode change
    document.dispatchEvent(new CustomEvent('keyPilotModeChange', {
      detail: { mode: 'highlight', enabled: KP.enabled }
    }));
    
    dbg('highlight/select mode entered');
  }
  
  // Toggle element selection in highlight mode
  function toggleElementSelection(el) {
    if (!el || el === document.documentElement || el === document.body) return;
    
    if (KP.selectedElements.has(el)) {
      KP.selectedElements.delete(el);
      el.classList.remove('kpv2-selected');
      dbg('element deselected', el.tagName);
    } else {
      KP.selectedElements.add(el);
      el.classList.add('kpv2-selected');
      dbg('element selected', el.tagName);
    }
    
    updateHUDWithSelectionCount();
    
    // Dispatch custom event for selection change
    document.dispatchEvent(new CustomEvent('keyPilotSelectionChange', {
      detail: { 
        selectedCount: KP.selectedElements.size,
        mode: KP.mode,
        enabled: KP.enabled 
      }
    }));
  }
  
  // Update HUD to show selection count
  function updateHUDWithSelectionCount() {
    const count = KP.selectedElements.size;
    if (count > 0) {
      setHUDStatus(`SELECT (${count})`, 'purple');
      updateHUDStatus('Multi-Select Mode', `${count} element(s) selected - Press D to delete all, [ ] to scale`);
    } else {
      setHUDStatus('SELECT', 'purple');
      updateHUDStatus('Multi-Select Mode', 'Click elements to select/deselect them');
    }
  }
  
  // Delete selected elements
  function deleteSelectedElements() {
    const elements = Array.from(KP.selectedElements);
    elements.forEach(el => deleteElement(el));
    KP.selectedElements.clear();
    cancelModes();
    dbg(`deleted ${elements.length} selected elements`);
  }
  
  // Enhanced element deletion
  function deleteElement(element) {
    if (!element || element === document.documentElement || element === document.body) {
      dbg('delete aborted: invalid target');
      return;
    }
    
    // Show delete animation
    showActionAnimation(element, 'Deleted', 'delete');
    
    try {
      // Remove from selected elements if it was selected
      KP.selectedElements.delete(element);
      element.classList.remove('kpv2-selected');
      
      // Try to remove the element
      element.remove();
      dbg('element removed', element.tagName);
    } catch (err) {
      dbg('remove() failed; using fallback', err && err.message);
      // Fallback: hide the element
      try {
        element.classList.add('kpv2-hidden');
        element.setAttribute('aria-hidden', 'true');
        element.style.display = 'none';
        dbg('element force-hidden');
      } catch (hideErr) {
        dbg('hide fallback also failed', hideErr.message);
      }
    }
  }
  
  // Copy element to clipboard
  function copyElementToClipboard() {
    const el = deepElementFromPoint(KP.lastMouse.x, KP.lastMouse.y);
    if (!el || $('#kpv2-hud')?.contains(el)) {
      dbg('copy aborted: invalid target');
      return;
    }
    
    let textToCopy = '';
    
    // Try different methods to get meaningful text
    if (el.tagName === 'IMG') {
      textToCopy = el.alt || el.src || el.title || 'Image';
    } else if (el.tagName === 'A') {
      textToCopy = el.href || el.textContent || 'Link';
    } else if (el.tagName === 'INPUT') {
      textToCopy = el.value || el.placeholder || 'Input field';
    } else {
      textToCopy = el.textContent || el.innerText || el.outerHTML;
    }
    
    // Copy to clipboard
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        dbg('copied to clipboard:', textToCopy.substring(0, 50) + (textToCopy.length > 50 ? '...' : ''));
        showActionAnimation(el, 'Copied to Clipboard', 'copy');
        showTemporaryMessage('Copied to clipboard');
      }).catch(err => {
        dbg('clipboard copy failed:', err.message);
        fallbackCopyToClipboard(textToCopy, el);
      });
    } else {
      fallbackCopyToClipboard(textToCopy, el);
    }
  }
  
  // Fallback clipboard copy method
  function fallbackCopyToClipboard(text, element) {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (successful) {
        dbg('fallback copy successful');
        if (element) showActionAnimation(element, 'Copied to Clipboard', 'copy');
        showTemporaryMessage('Copied to clipboard');
      } else {
        dbg('fallback copy failed');
        showTemporaryMessage('Copy failed');
      }
    } catch (err) {
      dbg('fallback copy error:', err.message);
      showTemporaryMessage('Copy failed');
    }
  }
  
  // Scale selected elements
  function scaleSelectedElements(factor) {
    if (KP.selectedElements.size === 0) {
      dbg('no elements selected for scaling');
      return;
    }
    
    KP.selectedElements.forEach(el => {
      try {
        const currentTransform = el.style.transform || '';
        const scaleMatch = currentTransform.match(/scale\(([^)]+)\)/);
        const currentScale = scaleMatch ? parseFloat(scaleMatch[1]) : 1;
        const newScale = Math.max(0.1, Math.min(5, currentScale * factor)); // Limit scale between 0.1 and 5
        
        const otherTransforms = currentTransform.replace(/scale\([^)]+\)/g, '').trim();
        el.style.transform = `${otherTransforms} scale(${newScale})`.trim();
        
        dbg(`scaled element to ${newScale}x`, el.tagName);
      } catch (err) {
        dbg('scaling failed for element:', err.message);
      }
    });
    
    const action = factor > 1 ? 'scaled up' : 'scaled down';
    showTemporaryMessage(`${KP.selectedElements.size} elements ${action}`);
  }
  
  // Show temporary message in HUD
  function showTemporaryMessage(message) {
    const originalStatus = $('#kpv2-status')?.textContent || 'ON';
    const originalClass = $('#kpv2-status')?.className || 'ok';
    
    setHUDStatus(message, 'ok');
    
    setTimeout(() => {
      if (KP.mode === 'highlight') {
        updateHUDWithSelectionCount();
      } else {
        setHUDStatus(originalStatus, originalClass);
      }
    }, 2000);
  }
  
  // Show action animation over element
  function showActionAnimation(element, message, type = 'default') {
    if (!element) return;
    
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const popup = document.createElement('div');
    popup.className = `kpv2-action-popup ${type}`;
    popup.textContent = message;
    popup.style.left = centerX + 'px';
    popup.style.top = centerY + 'px';
    
    document.body.appendChild(popup);
    
    // Remove after animation completes
    setTimeout(() => {
      if (popup.parentNode) {
        popup.parentNode.removeChild(popup);
      }
    }, 2000);
    
    dbg(`action animation: ${message} at (${centerX}, ${centerY})`);
  }
  

  
  function updateHUDStatus(title, detail = '') {
    const titleEl = $('#kpv2-status-title');
    const detailEl = $('#kpv2-status-detail');
    
    if (titleEl) titleEl.textContent = title;
    if (detailEl) detailEl.textContent = detail;
  }
  
  // Navigate to site root
  function navigateToSiteRoot() {
    try {
      const rootUrl = window.location.protocol + '//' + window.location.host + '/';
      dbg('navigating to site root:', rootUrl);
      updateHUDStatus('Navigating to Root', rootUrl);
      window.location.href = rootUrl;
    } catch (err) {
      dbg('navigation to root failed:', err.message);
              updateHUDStatus('Navigation Failed', 'Could not navigate to site root');
    }
  }
  
  // Enhanced delete mode visualization
  function createDeleteVisualization(element) {
    if (!element) return;
    
    // Remove existing visualizations
    removeDeleteVisualization();
    
    // Add inner dashed outline and diagonal hashing
    element.classList.add('kpv2-delete-target-inner');
    
    // Add outer dashed outline to parent if it exists
    const parent = element.parentElement;
    if (parent && parent !== document.body && parent !== document.documentElement) {
      parent.classList.add('kpv2-delete-target-outer');
    }
    
    KP.deleteEl = element;
    dbg('delete visualization created for:', element.tagName);
  }
  
  function removeDeleteVisualization() {
    // Remove all delete visualization classes
    document.querySelectorAll('.kpv2-delete-target-inner, .kpv2-delete-target-outer').forEach(el => {
      el.classList.remove('kpv2-delete-target-inner', 'kpv2-delete-target-outer');
    });
  }
  
  // Click feedback animation
  function showClickFeedback(element) {
    if (!element) return;
    
    element.classList.add('kpv2-click-feedback');
    
    // Remove the class after animation completes
    setTimeout(() => {
      element.classList.remove('kpv2-click-feedback');
    }, 300);
    
    dbg('click feedback shown for:', element.tagName);
  }
  
  // Overlay frame system for reliable highlighting
  function createOverlayFrame(element, type = 'default') {
    if (!element) return null;
    
    const rect = element.getBoundingClientRect();
    const frame = document.createElement('div');
    frame.className = `kpv2-overlay-frame ${type}`;
    frame.style.left = (rect.left + window.scrollX) + 'px';
    frame.style.top = (rect.top + window.scrollY) + 'px';
    frame.style.width = rect.width + 'px';
    frame.style.height = rect.height + 'px';
    
    document.body.appendChild(frame);
    return frame;
  }
  
  function removeOverlayFrames() {
    document.querySelectorAll('.kpv2-overlay-frame').forEach(frame => frame.remove());
  }
  
  // Element type detection for highlight mode
  function getElementType(element) {
    if (!element) return 'unknown';
    
    const tagName = element.tagName.toLowerCase();
    
    if (tagName === 'img' || (tagName === 'input' && element.type === 'image')) {
      return 'image';
    }
    
    if (tagName === 'a' && element.href) {
      return 'link';
    }
    
    if (element.textContent && element.textContent.trim().length > 0) {
      return 'text';
    }
    
    return 'element';
  }
  
  function showElementTypeIndicator(element, frame) {
    if (!element || !frame) return;
    
    const type = getElementType(element);
    const indicator = document.createElement('div');
    indicator.className = `kpv2-type-indicator ${type}`;
    
    let text = type.toUpperCase();
    if (type === 'link') {
      text += ` (${element.href})`;
    } else if (type === 'image') {
      text += ` (${element.alt || element.src || 'no alt'})`;
    } else if (type === 'text') {
      const textContent = element.textContent.trim();
      text += ` (${textContent.substring(0, 30)}${textContent.length > 30 ? '...' : ''})`;
    }
    
    indicator.textContent = text;
    frame.appendChild(indicator);
    
    // Update status box with element type info
    updateHUDStatus('Multi-Select Mode', `Highlighting ${type}: ${element.tagName.toLowerCase()}`);
    
    return indicator;
  }
  
  // Check if extension has required permissions
  async function checkTabPermissions() {
    try {
      console.log('[KeyPilot Tab Overlay] Checking tab permissions...');
      
      // Check if chrome.runtime is available
      if (!chrome || !chrome.runtime) {
        console.error('[KeyPilot Tab Overlay] chrome.runtime not available');
        return false;
      }
      
      console.log('[KeyPilot Tab Overlay] chrome.runtime available, testing message passing...');
      
      // Try to query tabs to test permissions
      const testResponse = await chrome.runtime.sendMessage({
        action: 'getAllTabs',
        source: 'content',
        timestamp: Date.now()
      });
      
      console.log('[KeyPilot Tab Overlay] Permission test response:', testResponse);
      return testResponse && testResponse.success;
    } catch (error) {
      console.error('[KeyPilot Tab Overlay] Permission check failed:', error);
      return false;
    }
  }

  // Tab overlay functionality
  async function showTabOverlay() {
    console.log('[KeyPilot Tab Overlay] Starting showTabOverlay...');
    
    // First check if we have the required permissions
    const hasPermissions = await checkTabPermissions();
    if (!hasPermissions) {
      console.error('[KeyPilot Tab Overlay] Missing required permissions for tab access');
      updateHUDStatus('Tab Overlay Failed', 'Missing tab permissions - check extension settings');
      return;
    }
    
    try {
      updateHUDStatus('Loading Tabs', 'Gathering window and tab information...');
      console.log('[KeyPilot Tab Overlay] Status box updated, requesting tab data...');
      
      // Request tabs data from background script
      const response = await chrome.runtime.sendMessage({
        action: 'getAllTabs',
        source: 'content',
        timestamp: Date.now()
      });
      
      console.log('[KeyPilot Tab Overlay] Background response received:', response);
      
      if (!response || !response.success) {
        const errorMsg = response?.error || 'Failed to get tabs data';
        console.error('[KeyPilot Tab Overlay] Error from background:', errorMsg);
        throw new Error(errorMsg);
      }
      
      const windows = response.tabsData;
      console.log('[KeyPilot Tab Overlay] Tab data received:', windows.length, 'windows');
      
      // Create overlay
      const overlay = document.createElement('div');
      overlay.className = 'kpv2-tab-overlay';
      overlay.id = 'kpv2-tab-overlay';
      console.log('[KeyPilot Tab Overlay] Overlay element created');
      
      // Header
      const header = document.createElement('div');
      header.className = 'kpv2-tab-overlay-header';
      header.textContent = 'All Windows and Tabs';
      
      // Close button
      const closeBtn = document.createElement('button');
      closeBtn.className = 'kpv2-overlay-close';
      closeBtn.textContent = 'Close (ESC)';
      closeBtn.onclick = hideTabOverlay;
      
      // Content container
      const content = document.createElement('div');
      content.className = 'kpv2-tab-overlay-content';
      
      overlay.appendChild(header);
      overlay.appendChild(closeBtn);
      overlay.appendChild(content);
      
      windows.forEach((window, windowIndex) => {
        const windowGroup = document.createElement('div');
        windowGroup.className = 'kpv2-window-group';
        
        const windowTitle = document.createElement('div');
        windowTitle.className = 'kpv2-window-title';
        windowTitle.textContent = `Window ${windowIndex + 1} (${window.tabs.length} tabs)${window.focused ? ' - Current' : ''}`;
        
        windowGroup.appendChild(windowTitle);
        
        window.tabs.forEach(tab => {
          const tabItem = document.createElement('div');
          tabItem.className = 'kpv2-tab-item';
          if (tab.active) tabItem.classList.add('current');
          
          // Favicon
          const favicon = document.createElement('img');
          favicon.className = 'kpv2-tab-favicon';
          favicon.src = tab.favIconUrl || 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23ccc"/></svg>';
          favicon.onerror = () => {
            favicon.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><rect width="16" height="16" fill="%23ccc"/></svg>';
          };
          
          // Title
          const title = document.createElement('div');
          title.className = 'kpv2-tab-title';
          title.textContent = tab.title || 'Untitled';
          
          // URL
          const url = document.createElement('div');
          url.className = 'kpv2-tab-url';
          try {
            url.textContent = new URL(tab.url).hostname;
          } catch (e) {
            url.textContent = tab.url;
          }
          
          tabItem.appendChild(favicon);
          tabItem.appendChild(title);
          tabItem.appendChild(url);
          
          // Click handler to switch to tab
          tabItem.onclick = async () => {
            try {
              await chrome.tabs.update(tab.id, { active: true });
              await chrome.windows.update(tab.windowId, { focused: true });
              hideTabOverlay();
            } catch (err) {
              dbg('failed to switch to tab:', err.message);
              // Fallback: try to send message to background to handle tab switching
              try {
                await chrome.runtime.sendMessage({
                  action: 'switchToTab',
                  tabId: tab.id,
                  windowId: tab.windowId
                });
                hideTabOverlay();
              } catch (bgErr) {
                dbg('background tab switch also failed:', bgErr.message);
              }
            }
          };
          
          windowGroup.appendChild(tabItem);
        });
        
        content.appendChild(windowGroup);
      });
      
      document.body.appendChild(overlay);
      console.log('[KeyPilot Tab Overlay] Overlay added to DOM');
      updateHUDStatus('Tab Overlay Active', 'Click tabs to switch, ESC to close');
      
      dbg(`tab overlay shown with ${windows.length} windows`);
      console.log('[KeyPilot Tab Overlay] Tab overlay successfully shown with', windows.length, 'windows');
      
    } catch (err) {
      console.error('[KeyPilot Tab Overlay] Failed to show tab overlay:', err);
      console.error('[KeyPilot Tab Overlay] Error stack:', err.stack);
      dbg('failed to show tab overlay:', err.message);
      updateHUDStatus('Tab Overlay Failed', 'Could not access browser tabs');
    }
  }
  
  function hideTabOverlay() {
    console.log('[KeyPilot Tab Overlay] hideTabOverlay called');
    const overlay = document.getElementById('kpv2-tab-overlay');
    if (overlay) {
      console.log('[KeyPilot Tab Overlay] Overlay found, removing...');
      overlay.remove();
      updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
      dbg('tab overlay hidden');
      console.log('[KeyPilot Tab Overlay] Overlay successfully hidden');
    } else {
      console.log('[KeyPilot Tab Overlay] No overlay found to hide');
    }
  }

  // ----------------------------- Enable/Disable ---------------------------
  function addL(t, type, fn, opts) { t.addEventListener(type, fn, opts); KP.listeners.push(() => t.removeEventListener(type, fn, opts)); }

function enable() {
  if (KP.enabled) return;
  KP.enabled = true;

  ensureSharedStylesIn(document);
  KP.shadowRoots.forEach(r => { try { ensureSharedStylesIn(r); } catch {} });

  ensureHUD();
  setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok');
  updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
  
  // Dispatch custom event for status change
  document.dispatchEvent(new CustomEvent('keyPilotStateChange', {
    detail: { enabled: true, debug: KP.debug, hoverMode: KP.hoverMode }
  }));

  // Apply cursor host class to both body and html for stronger coverage
  document.body.classList.add('kpv2-host-on');
  document.documentElement.classList.add('kpv2-host-on');

  addL(document, 'mousemove', onMouseMove, true);
  addL(document, 'keydown', onKeyDown, true);

  // Compute initial hover immediately (avoid “no cursor until lots of movement”)
  try {
    const x = KP.lastMouse.x || 0, y = KP.lastMouse.y || 0;
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
    // Run again next frame in case the DOM/styles weren’t ready
    requestAnimationFrame(() => {
      document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: x, clientY: y }));
    });
  } catch {}

  dbg('enabled');
}

function disable() {
  if (!KP.enabled) return;
  KP.enabled = false;

  cancelModes();

  // Clean up focus state completely
  if (KP.focusEl) {
    KP.focusEl.classList.remove('kpv2-focus', 'kpv2-focus-clickable', 'kpv2-focus-any');
    KP.focusEl = null;
  }
  KP.isOverInput = false;
  KP.lastFocusedInput = null;
  
  // Dispatch custom event for status change
  document.dispatchEvent(new CustomEvent('keyPilotStateChange', {
    detail: { enabled: false, debug: KP.debug, hoverMode: KP.hoverMode }
  }));

  // Remove cursor host class from both body and html
  document.body.classList.remove('kpv2-host-on', 'kpv2-delete-mode', 'kpv2-highlight-mode');
  document.documentElement.classList.remove('kpv2-host-on');

  // Remove listeners
  KP.listeners.splice(0).forEach(off => { try { off(); } catch {} });

  removeHUD();
  dbg('disabled');
}


  // --------------------------- External API Methods -----------------------
  function getStatus() {
    return {
      enabled: KP.enabled,
      debug: KP.debug,
      mode: KP.mode,
      hoverMode: KP.hoverMode
    };
  }

  function setDebug(debugEnabled) {
    KP.debug = !!debugEnabled;
    if (KP.enabled) {
      setHUDStatus(KP.debug ? 'DEBUG' : 'ON', KP.debug ? 'warn' : 'ok');
      if (KP.debug) {
        updateHUDStatus('Debug Mode', 'Enhanced logging and debugging enabled');
      } else {
        updateHUDStatus('KeyPilot Ready', 'Press F to click, H to select');
      }
    }
    dbg('debug mode set to', KP.debug);
  }

  // ------------------------------- Bootstrap ------------------------------
  // Removed auto-initialization and global window attachment
  // No longer starts enabled by default - must be explicitly enabled

  // Extension-specific API (no global window attachment)
  window.__KeyPilotExtensionCore = {
    enable,
    disable,
    getStatus,
    setDebug,
    setHoverMode,
getHUDInfo: () => ({
  status: KP.debug ? 'DEBUG' : (KP.enabled ? 'ON' : 'OFF'),
  detail: KP.hoverMode === 'clickable' ? 'Hover: Clickable' : 'Hover: Any',
  mode: KP.mode,
  enabled: KP.enabled,
  debug: KP.debug,
  hoverMode: KP.hoverMode,
  hudVisible: !!$('#kpv2-hud'),
  selectedCount: KP.selectedElements.size,
  statusTitle: $('#kpv2-status-title')?.textContent || 'KeyPilot Ready',
  statusDetail: $('#kpv2-status-detail')?.textContent || 'Press F to click, H to select'
}),
toggleHUDVisibility,
showHUD,
hideHUD,
expandHUD,
compactHUD,
    _internal: () => KP // For debugging only
  };

  dbg('KeyPilot Extension Core initialized (not enabled)');
})();