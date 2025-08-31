/**
 * CSS injection and style management
 */
import { CSS_CLASSES, ELEMENT_IDS, COLORS, Z_INDEX } from '../config/constants.js';

export class StyleManager {
  constructor() {
    this.injectedStyles = new Set();
    this.shadowRootStyles = new Map(); // Track shadow root styles for cleanup
    this.isEnabled = true; // Track if styles should be active
  }

  injectSharedStyles() {
    if (this.injectedStyles.has('main') || !this.isEnabled) return;

    const css = `
      html.${CSS_CLASSES.CURSOR_HIDDEN}, 
      html.${CSS_CLASSES.CURSOR_HIDDEN} * { 
        cursor: none !important; 
      }
      
      .${CSS_CLASSES.FOCUS} { 
        filter: brightness(1.2) !important; 
      }
      
      .${CSS_CLASSES.DELETE} { 
        filter: brightness(0.8) contrast(1.2) !important; 
      }
      
      .${CSS_CLASSES.HIDDEN} { 
        display: none !important; 
      }
      
      @keyframes kpv2-ripple { 
        0% { transform: translate(-50%, -50%) scale(0.25); opacity: 0.35; }
        60% { transform: translate(-50%, -50%) scale(1); opacity: 0.2; }
        100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
      }
      
      .${CSS_CLASSES.RIPPLE} { 
        position: fixed; 
        left: 0; 
        top: 0; 
        z-index: 2147483646; 
        pointer-events: none; 
        width: 46px; 
        height: 46px; 
        border-radius: 50%; 
        background: radial-gradient(circle, ${COLORS.RIPPLE_GREEN} 0%, ${COLORS.RIPPLE_GREEN_MID} 60%, ${COLORS.RIPPLE_GREEN_TRANSPARENT} 70%); 
        animation: kpv2-ripple 420ms ease-out forwards; 
      }
      
      .${CSS_CLASSES.FOCUS_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid ${COLORS.FOCUS_GREEN}; 
        box-shadow: 0 0 0 2px ${COLORS.GREEN_SHADOW}, 0 0 10px 2px ${COLORS.GREEN_SHADOW_BRIGHT}; 
        background: transparent; 
      }
      
      .${CSS_CLASSES.DELETE_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid ${COLORS.DELETE_RED}; 
        box-shadow: 0 0 0 2px ${COLORS.DELETE_SHADOW}, 0 0 12px 2px ${COLORS.DELETE_SHADOW_BRIGHT}; 
        background: transparent; 
      }
      
      .${CSS_CLASSES.HIGHLIGHT_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid ${COLORS.HIGHLIGHT_BLUE}; 
        box-shadow: 0 0 0 2px ${COLORS.HIGHLIGHT_SHADOW}, 0 0 12px 2px ${COLORS.HIGHLIGHT_SHADOW_BRIGHT}; 
        background: transparent; 
      }
      
      .${CSS_CLASSES.HIGHLIGHT_SELECTION} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483645; 
        background: ${COLORS.HIGHLIGHT_SELECTION_BG}; 
        border: 1px solid ${COLORS.HIGHLIGHT_SELECTION_BORDER}; 
      }
      

      
      #${ELEMENT_IDS.CURSOR} { 
        position: fixed !important; 
        left: var(--cursor-x, 0) !important; 
        top: var(--cursor-y, 0) !important; 
        transform: translate(-50%, -50%) !important; 
        z-index: 2147483647 !important; 
        pointer-events: none !important;
        display: block !important;
        visibility: visible !important;
        will-change: transform, left, top !important;
      }
      
      .${CSS_CLASSES.VIEWPORT_MODAL_FRAME} {
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        border: 9pt solid ${COLORS.ORANGE};
        opacity: 0.7;
        pointer-events: none;
        z-index: ${Z_INDEX.VIEWPORT_MODAL_FRAME};
        box-sizing: border-box;
        will-change: transform;
      }
      
      @keyframes kpv2-pulse { 
        0% { opacity: 0.7; }
        50% { opacity: 1; }
        100% { opacity: 0.7; }
      }
      
      .${CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME} {
        position: fixed;
        pointer-events: none;
        z-index: ${Z_INDEX.OVERLAYS + 1};
        border: 3px solid ${COLORS.ORANGE};
        box-shadow: 0 0 0 2px ${COLORS.ORANGE_SHADOW}, 0 0 10px 2px ${COLORS.ORANGE_SHADOW_DARK};
        background: transparent;
        animation: kpv2-pulse 1.5s ease-in-out infinite;
        will-change: transform, opacity;
      }
      
      .${CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME}::before {
        content: "ACTIVE TEXT INPUT";
        position: absolute;
        top: -24px;
        left: 0;
        background: ${COLORS.ORANGE};
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        white-space: nowrap;
        border-radius: 2px;
        z-index: 1;
      }
      
      .${CSS_CLASSES.ESC_EXIT_LABEL} {
        position: fixed;
        pointer-events: none;
        z-index: ${Z_INDEX.OVERLAYS + 1};
        background: ${COLORS.ORANGE};
        color: white;
        padding: 4px 8px;
        font-size: 12px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        white-space: nowrap;
        border-radius: 2px;
        animation: kpv2-pulse 1.5s ease-in-out infinite;
        will-change: transform, opacity;
      }
      
      /* Add left padding to focused text inputs */
      input:focus,
      textarea:focus,
      [contenteditable="true"]:focus,
      [contenteditable=""]:focus {
        padding-left: 5pt !important;
      }
    `;

    this.injectCSS(css, ELEMENT_IDS.STYLE);
    this.injectedStyles.add('main');

    // Hide default cursor
    document.documentElement.classList.add(CSS_CLASSES.CURSOR_HIDDEN);
  }

  injectCSS(css, id) {
    const existing = document.getElementById(id);
    if (existing) return;

    const style = document.createElement('style');
    style.id = id;
    style.textContent = css;
    document.head.appendChild(style);
  }

  injectIntoShadowRoot(shadowRoot) {
    if (this.injectedStyles.has(shadowRoot) || !this.isEnabled) return;

    const css = `
      .${CSS_CLASSES.FOCUS} { 
        filter: brightness(1.2) !important; 
      }
      
      .${CSS_CLASSES.DELETE} { 
        filter: brightness(0.8) contrast(1.2) !important; 
      }
      
      .${CSS_CLASSES.HIDDEN} { 
        display: none !important; 
      }
      
      /* Add left padding to focused text inputs in shadow DOM */
      input:focus,
      textarea:focus,
      [contenteditable="true"]:focus,
      [contenteditable=""]:focus {
        padding-left: 5pt !important;
      }

    `;

    const style = document.createElement('style');
    style.id = 'keypilot-shadow-styles';
    style.textContent = css;
    shadowRoot.appendChild(style);

    this.injectedStyles.add(shadowRoot);
    this.shadowRootStyles.set(shadowRoot, style);
  }

  /**
   * Completely remove all KeyPilot CSS styles from the page
   * Used when extension is toggled off
   */
  removeAllStyles() {
    // Remove cursor hidden class
    document.documentElement.classList.remove(CSS_CLASSES.CURSOR_HIDDEN);

    // Remove main stylesheet
    const mainStyle = document.getElementById(ELEMENT_IDS.STYLE);
    if (mainStyle) {
      mainStyle.remove();
    }

    // Remove all shadow root styles
    for (const [shadowRoot, styleElement] of this.shadowRootStyles) {
      if (styleElement && styleElement.parentNode) {
        styleElement.remove();
      }
    }

    // Remove all KeyPilot classes from elements
    this.removeAllKeyPilotClasses();

    // Clear tracking
    this.injectedStyles.clear();
    this.shadowRootStyles.clear();
    this.isEnabled = false;
  }

  /**
   * Restore all KeyPilot CSS styles to the page
   * Used when extension is toggled back on
   */
  restoreAllStyles() {
    this.isEnabled = true;

    // Re-inject main styles
    this.injectSharedStyles();

    // Re-inject shadow root styles for any shadow roots we previously tracked
    // Note: We'll need to re-discover shadow roots since they may have changed
    // This will be handled by the shadow DOM manager during normal operation
  }

  /**
   * Remove all KeyPilot CSS classes from DOM elements
   */
  removeAllKeyPilotClasses() {
    const classesToRemove = [
      CSS_CLASSES.FOCUS,
      CSS_CLASSES.DELETE,
      CSS_CLASSES.HIGHLIGHT,
      CSS_CLASSES.HIDDEN,
      CSS_CLASSES.RIPPLE,
      CSS_CLASSES.VIEWPORT_MODAL_FRAME,
      CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME,
      CSS_CLASSES.ESC_EXIT_LABEL,
      CSS_CLASSES.HIGHLIGHT_OVERLAY,
      CSS_CLASSES.HIGHLIGHT_SELECTION
    ];

    // Remove classes from main document
    classesToRemove.forEach(className => {
      const elements = document.querySelectorAll(`.${className}`);
      elements.forEach(el => el.classList.remove(className));
    });

    // Remove classes from shadow roots
    for (const shadowRoot of this.shadowRootStyles.keys()) {
      classesToRemove.forEach(className => {
        const elements = shadowRoot.querySelectorAll(`.${className}`);
        elements.forEach(el => el.classList.remove(className));
      });
    }
  }

  /**
   * Check if styles are currently enabled
   */
  isStylesEnabled() {
    return this.isEnabled;
  }

  cleanup() {
    this.removeAllStyles();
  }
}