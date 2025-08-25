/**
 * Text field focus detection and management
 */
import { SELECTORS, CSS_CLASSES } from '../config/constants.js';

export class FocusDetector {
  constructor(stateManager) {
    this.state = stateManager;
    this.currentFocusedElement = null;
    this.focusCheckInterval = null;
  }

  start() {
    // Listen for focus/blur events
    document.addEventListener('focusin', this.handleFocusIn.bind(this), true);
    document.addEventListener('focusout', this.handleFocusOut.bind(this), true);
    
    // Also check periodically for programmatic focus changes (more frequent)
    this.focusCheckInterval = setInterval(() => {
      this.checkCurrentFocus();
    }, 200);
    
    // Initial check with delay to catch elements focused on page load
    setTimeout(() => {
      this.checkCurrentFocus();
      console.debug('Initial focus check completed');
    }, 100);
    
    // Also check when DOM is fully loaded
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => this.checkCurrentFocus(), 100);
      });
    }
    
    // Check when page is fully loaded (including images, etc.)
    window.addEventListener('load', () => {
      setTimeout(() => this.checkCurrentFocus(), 100);
    });
  }

  stop() {
    document.removeEventListener('focusin', this.handleFocusIn, true);
    document.removeEventListener('focusout', this.handleFocusOut, true);
    
    if (this.focusCheckInterval) {
      clearInterval(this.focusCheckInterval);
      this.focusCheckInterval = null;
    }
    
    // Clean up any remaining glow
    if (this.currentFocusedElement) {
      this.currentFocusedElement.classList.remove(CSS_CLASSES.TEXT_FIELD_GLOW);
      this.currentFocusedElement = null;
    }
  }

  handleFocusIn(e) {
    if (this.isTextInput(e.target)) {
      console.debug('Text input focused:', e.target.tagName, e.target.type || 'N/A');
      this.setTextFocus(e.target);
    }
  }

  handleFocusOut(e) {
    if (this.isTextInput(e.target)) {
      console.debug('Text input blurred:', e.target.tagName, e.target.type || 'N/A');
      // Small delay to allow for focus changes
      setTimeout(() => {
        const currentlyFocused = this.getDeepActiveElement();
        if (!this.isTextInput(currentlyFocused)) {
          this.clearTextFocus();
        }
      }, 10);
    }
  }

  checkCurrentFocus() {
    const activeElement = this.getDeepActiveElement();
    
    if (this.isTextInput(activeElement)) {
      if (this.currentFocusedElement !== activeElement) {
        console.debug('Text focus detected during check:', activeElement.tagName, activeElement.type || 'N/A', 'ID:', activeElement.id || 'none');
        this.setTextFocus(activeElement);
      }
    } else if (this.currentFocusedElement) {
      console.debug('Text focus cleared during check');
      this.clearTextFocus();
    }
  }

  getDeepActiveElement() {
    let activeElement = document.activeElement;
    
    // Traverse shadow DOM if needed
    while (activeElement && activeElement.shadowRoot && activeElement.shadowRoot.activeElement) {
      activeElement = activeElement.shadowRoot.activeElement;
    }
    
    return activeElement;
  }

  isTextInput(element) {
    if (!element || element.nodeType !== 1) return false;
    
    // Check if it matches our text input selectors
    try {
      return element.matches(SELECTORS.FOCUSABLE_TEXT);
    } catch {
      return false;
    }
  }

  setTextFocus(element) {
    // Remove glow from previous element if any
    if (this.currentFocusedElement && this.currentFocusedElement !== element) {
      this.currentFocusedElement.classList.remove(CSS_CLASSES.TEXT_FIELD_GLOW);
    }
    
    this.currentFocusedElement = element;
    
    // Add glow to the focused text field
    element.classList.add(CSS_CLASSES.TEXT_FIELD_GLOW);
    
    this.state.setMode('text_focus');
    this.state.setState({ focusedTextElement: element });
  }

  clearTextFocus() {
    // Remove glow from the previously focused element
    if (this.currentFocusedElement) {
      this.currentFocusedElement.classList.remove(CSS_CLASSES.TEXT_FIELD_GLOW);
    }
    
    this.currentFocusedElement = null;
    this.state.setMode('none');
    this.state.setState({ focusedTextElement: null });
  }

  isInTextFocus() {
    return this.state.getState().mode === 'text_focus';
  }

  getFocusedElement() {
    return this.currentFocusedElement;
  }
}