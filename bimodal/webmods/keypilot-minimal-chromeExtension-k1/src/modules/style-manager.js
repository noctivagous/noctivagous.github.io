/**
 * CSS injection and style management
 */
import { CSS_CLASSES, ELEMENT_IDS } from '../config/constants.js';

export class StyleManager {
  constructor() {
    this.injectedStyles = new Set();
    this.shadowRootStyles = new Map(); // Track shadow root styles for cleanup
    this.isEnabled = true; // Track if styles should be active
  }

  
  injectSharedStyles() {
    if (this.injectedStyles.has('main') || !this.isEnabled) return;

    // Don't put CSS comments inside the css variable.
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
        background: radial-gradient(circle, rgba(0,200,0,0.35) 0%, rgba(0,200,0,0.22) 60%, rgba(0,200,0,0) 70%); 
        animation: kpv2-ripple 420ms ease-out forwards; 
      }
      
      .${CSS_CLASSES.FOCUS_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid rgba(0,180,0,0.95); 
        box-shadow: 0 0 0 2px rgba(0,180,0,0.45), 0 0 10px 2px rgba(0,180,0,0.5); 
        background: transparent; 
      }
      
      .${CSS_CLASSES.DELETE_OVERLAY} { 
        position: fixed; 
        pointer-events: none; 
        z-index: 2147483646; 
        border: 3px solid rgba(220,0,0,0.95); 
        box-shadow: 0 0 0 2px rgba(220,0,0,0.35), 0 0 12px 2px rgba(220,0,0,0.45); 
        background: transparent; 
      }
      
      .${CSS_CLASSES.TEXT_FIELD_GLOW} { 
        outline: 2px solid rgba(255,165,0,0.8) !important;
        outline-offset: 2px !important;
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
      
      
      .kpv2-hud {
        position: fixed;
        bottom: 20px;
        left: 20px;
        z-index: 2147483647;
        font-family: system-ui, -apple-system, sans-serif;
        font-size: 12px;
        background: rgba(0, 0, 0, 0.9);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        backdrop-filter: blur(10px);
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        min-width: 200px;
        max-width: 300px;
        pointer-events: auto;
      }
      
      /* Status Bar */
      .kpv2-hud-status-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 8px 12px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      /* Mode Indicator */
      .kpv2-hud-mode-indicator {
        flex: 1;
      }
      
      .kpv2-hud-mode-text {
        color: #fff;
        font-weight: 500;
        font-size: 12px;
      }
      
      /* Controls Section */
      .kpv2-hud-controls {
        display: flex;
        align-items: center;
        gap: 8px;
      }
      
      /* Toggle Switches */
      .kpv2-hud-toggle {
        display: flex;
        align-items: center;
        gap: 4px;
        margin: 0;
        cursor: pointer;
      }
      
      .kpv2-hud-toggle-input {
        width: 32px;
        height: 16px;
        appearance: none;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 8px;
        position: relative;
        cursor: pointer;
        transition: background-color 0.2s ease;
      }
      
      .kpv2-hud-toggle-input:checked {
        background: #4CAF50;
      }
      
      .kpv2-hud-toggle-input::before {
        content: '';
        position: absolute;
        width: 12px;
        height: 12px;
        border-radius: 50%;
        background: white;
        top: 2px;
        left: 2px;
        transition: transform 0.2s ease;
      }
      
      .kpv2-hud-toggle-input:checked::before {
        transform: translateX(16px);
      }
      
      .kpv2-hud-toggle-label {
        color: rgba(255, 255, 255, 0.8);
        font-size: 10px;
        font-weight: 400;
        user-select: none;
      }
      
      /* Expand Button */
      .kpv2-hud-expand-btn {
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        padding: 4px;
        border-radius: 4px;
        transition: color 0.2s ease, background-color 0.2s ease;
        margin-left: 8px;
      }
      
      .kpv2-hud-expand-btn:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }
      
      .kpv2-hud-expand-icon {
        display: inline-block;
        font-size: 10px;
        transition: transform 0.2s ease;
      }
      
      .kpv2-hud-expand-btn.expanded .kpv2-hud-expand-icon {
        transform: rotate(180deg);
      }
      
      /* Instructions Panel */
      .kpv2-hud-instructions {
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        display: none;
      }
      
      .kpv2-hud-instructions.expanded {
        display: block;
      }
      
      /* Tabs */
      .kpv2-hud-tabs {
        display: flex;
        background: rgba(255, 255, 255, 0.05);
      }
      
      .kpv2-hud-tab {
        flex: 1;
        padding: 8px 12px;
        background: none;
        border: none;
        color: rgba(255, 255, 255, 0.7);
        cursor: pointer;
        font-size: 11px;
        transition: color 0.2s ease, background-color 0.2s ease;
      }
      
      .kpv2-hud-tab:hover {
        color: rgba(255, 255, 255, 0.9);
        background: rgba(255, 255, 255, 0.08);
      }
      
      .kpv2-hud-tab.active {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
      }
      
      /* Tab Content */
      .kpv2-hud-tab-content {
        position: relative;
      }
      
      .kpv2-hud-tab-panel {
        display: none;
      }
      
      .kpv2-hud-tab-panel.active {
        display: block;
      }
      
      /* Control List */
      .kpv2-hud-control-list {
        padding: 12px;
      }
      
      .kpv2-hud-control-item {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-bottom: 6px;
      }
      
      .kpv2-hud-control-item:last-child {
        margin-bottom: 0;
      }
      
      .kpv2-hud-control-item kbd {
        background: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 3px;
        padding: 2px 6px;
        font-size: 10px;
        color: #fff;
        min-width: 24px;
        text-align: center;
        font-family: monospace;
      }
      
      .kpv2-hud-control-item span {
        color: rgba(255, 255, 255, 0.8);
        font-size: 11px;
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
      
      .${CSS_CLASSES.TEXT_FIELD_GLOW} { 
        outline: 2px solid rgba(255,165,0,0.8) !important;
        outline-offset: 2px !important;
      }
    `;

    const style = document.createElement('style');
    style.id = 'keypilot-shadow-styles';
    style.textContent = css;
    shadowRoot.appendChild(style);

    this.injectedStyles.add(shadowRoot);
    this.shadowRootStyles.set(shadowRoot, style);
  }

  
   // Completely remove all KeyPilot CSS styles from the page
   // Used when extension is toggled off
   
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
      CSS_CLASSES.HIDDEN,
      CSS_CLASSES.TEXT_FIELD_GLOW,
      CSS_CLASSES.RIPPLE
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