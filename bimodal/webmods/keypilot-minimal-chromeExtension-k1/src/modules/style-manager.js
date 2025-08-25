/**
 * CSS injection and style management
 */
import { CSS_CLASSES, ELEMENT_IDS } from '../config/constants.js';

export class StyleManager {
  constructor() {
    this.injectedStyles = new Set();
  }

  injectSharedStyles() {
    if (this.injectedStyles.has('main')) return;

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
      
      #${ELEMENT_IDS.CURSOR} { 
        position: fixed; 
        left: 0; 
        top: 0; 
        transform: translate(-50%, -50%); 
        z-index: 2147483647; 
        pointer-events: none; 
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
    if (this.injectedStyles.has(shadowRoot)) return;

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
    `;

    const style = document.createElement('style');
    style.textContent = css;
    shadowRoot.appendChild(style);
    
    this.injectedStyles.add(shadowRoot);
  }

  cleanup() {
    document.documentElement.classList.remove(CSS_CLASSES.CURSOR_HIDDEN);
    
    const mainStyle = document.getElementById(ELEMENT_IDS.STYLE);
    if (mainStyle) {
      mainStyle.remove();
    }
    
    this.injectedStyles.clear();
  }
}