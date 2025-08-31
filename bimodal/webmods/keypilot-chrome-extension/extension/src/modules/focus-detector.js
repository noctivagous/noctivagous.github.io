/**
 * Text field focus detection and management
 */
import { SELECTORS, CSS_CLASSES } from '../config/constants.js';

export class FocusDetector {
  constructor(stateManager, mouseCoordinateManager = null) {
    this.state = stateManager;
    this.mouseCoordinateManager = mouseCoordinateManager;
    this.currentFocusedElement = null;
    this.focusCheckInterval = null;
    this.textElementObserver = null; // MutationObserver for focused text element
    this.textElementResizeObserver = null; // ResizeObserver for focused text element
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

    // Clean up observers
    this.cleanupTextElementObservers();

    // Clean up any remaining focused element reference
    if (this.currentFocusedElement) {
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
      console.debug('Text input blurred:', e.target.tagName, e.target.type || 'N/A', 'ID:', e.target.id);
      // Longer delay to allow for focus changes and prevent premature clearing during slider interaction
      setTimeout(() => {
        const currentlyFocused = this.getDeepActiveElement();
        console.debug('Focus check after blur - currently focused:', currentlyFocused?.tagName, currentlyFocused?.type, currentlyFocused?.id);
        if (!this.isTextInput(currentlyFocused)) {
          console.debug('Clearing text focus - no text input currently focused');
          this.clearTextFocus();
        } else {
          console.debug('Keeping text focus - text input still focused');
        }
      }, 100); // Increased delay to handle slider interactions
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
    // Update current focused element reference
    this.currentFocusedElement = element;

    // Set up observers for the focused text element
    this.setupTextElementObservers(element);

    // Position cursor appropriately for text focus mode
    this.positionCursorForTextFocus(element);

    // Set mode and focused element in a single state update to ensure proper cursor initialization
    this.state.setState({
      mode: 'text_focus',
      focusedTextElement: element,
      focusEl: null // Clear to ensure hasClickableElement starts as false
    });
  }

  /**
   * Position cursor for text focus mode
   * Uses stored coordinates if available, otherwise positions underneath the text field
   * @param {Element} element - The focused text element
   */
  positionCursorForTextFocus(element) {
    if (!element || !this.mouseCoordinateManager) {
      return;
    }

    // Try to get stored coordinates first
    const storedCoordinates = this.mouseCoordinateManager.lastStoredCoordinates;
    
    if (storedCoordinates) {
      // Use stored coordinates if available and valid
      const x = Math.min(storedCoordinates.x, window.innerWidth - 20);
      const y = Math.min(storedCoordinates.y, window.innerHeight - 20);
      const validX = Math.max(10, x);
      const validY = Math.max(10, y);
      
      this.state.setMousePosition(validX, validY);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Positioned cursor using stored coordinates for text focus:', {
          x: validX, y: validY
        });
      }
    } else {
      // Fallback: position cursor underneath the text field
      const rect = element.getBoundingClientRect();
      const x = rect.left + (rect.width / 2);
      const y = rect.bottom + 10; // 10px below the text field
      
      // Ensure coordinates are within viewport bounds
      const validX = Math.min(Math.max(10, x), window.innerWidth - 20);
      const validY = Math.min(Math.max(10, y), window.innerHeight - 20);
      
      this.state.setMousePosition(validX, validY);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Positioned cursor underneath text field:', {
          x: validX, y: validY, elementRect: rect
        });
      }
    }
  }

  clearTextFocus() {
    // Clean up observers
    this.cleanupTextElementObservers();

    // Clear focused element reference
    this.currentFocusedElement = null;
    this.state.setState({
      mode: 'none',
      focusedTextElement: null
    });
  }

  isInTextFocus() {
    return this.state.getState().mode === 'text_focus';
  }

  getFocusedElement() {
    return this.currentFocusedElement;
  }

  setupTextElementObservers(element) {
    if (!element) return;

    // Clean up any existing observers first
    this.cleanupTextElementObservers();

    // Store initial position for comparison
    this.lastKnownRect = element.getBoundingClientRect();

    // 1. ResizeObserver for size changes
    if (window.ResizeObserver) {
      this.textElementResizeObserver = new ResizeObserver((entries) => {
        // Debounce resize updates
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          this.triggerOverlayUpdate();
          this.resizeTimeout = null;
        }, 16); // ~60fps
      });

      // Observe the text element itself
      this.textElementResizeObserver.observe(element);
      console.debug('ResizeObserver set up for text element');
    }

    // 2. Input event listener for content changes that affect size
    this.inputEventHandler = () => {
      // Debounce input updates
      if (this.inputTimeout) {
        clearTimeout(this.inputTimeout);
      }
      this.inputTimeout = setTimeout(() => {
        console.debug('Input event detected - triggering overlay update');
        this.triggerOverlayUpdate();
        this.inputTimeout = null;
      }, 16);
    };

    element.addEventListener('input', this.inputEventHandler);
    console.debug('Input event listener set up for text element');

    // 3. MutationObserver for attribute and DOM changes
    if (window.MutationObserver) {
      this.textElementObserver = new MutationObserver((mutations) => {
        let shouldUpdate = false;

        mutations.forEach((mutation) => {
          // Watch for style and class changes that affect position/size
          if (mutation.type === 'attributes') {
            const attrName = mutation.attributeName;
            if (attrName === 'style' || attrName === 'class') {
              console.debug('MutationObserver detected attribute change:', attrName, mutation.target.tagName);
              shouldUpdate = true;
            }
            // Also watch for size-related attributes
            if (['rows', 'cols', 'width', 'height'].includes(attrName)) {
              console.debug('MutationObserver detected size attribute change:', attrName);
              shouldUpdate = true;
            }
          }

          // DOM structure changes
          if (mutation.type === 'childList') {
            console.debug('MutationObserver detected DOM structure change');
            shouldUpdate = true;
          }

          // Content changes
          if (mutation.type === 'characterData') {
            console.debug('MutationObserver detected content change');
            shouldUpdate = true;
          }
        });

        if (shouldUpdate) {
          // Debounce mutation updates
          if (this.mutationTimeout) {
            clearTimeout(this.mutationTimeout);
          }
          this.mutationTimeout = setTimeout(() => {
            this.triggerOverlayUpdate();
            this.mutationTimeout = null;
          }, 16);
        }
      });

      // Observe the element itself with comprehensive options
      this.textElementObserver.observe(element, {
        attributes: true,
        attributeOldValue: true,
        characterData: true,
        childList: true,
        subtree: true
      });

      // Observe parent elements for layout changes
      let parent = element.parentElement;
      let observedParents = 0;
      while (parent && observedParents < 2) {
        this.textElementObserver.observe(parent, {
          attributes: true,
          attributeFilter: ['style', 'class'],
          childList: true
        });
        parent = parent.parentElement;
        observedParents++;
      }

      console.debug('MutationObserver set up for element and', observedParents, 'parents');
    }

    // 4. Position polling as reliable fallback for position changes
    this.setupPositionPolling(element);
  }

  setupPositionPolling(element) {
    // Fast polling to catch position changes that observers miss
    this.positionPollInterval = setInterval(() => {
      if (this.currentFocusedElement && this.state.getState().mode === 'text_focus') {
        const currentRect = this.currentFocusedElement.getBoundingClientRect();

        // Check if position OR size changed (comprehensive tracking)
        if (this.lastKnownRect.left !== currentRect.left ||
          this.lastKnownRect.top !== currentRect.top ||
          this.lastKnownRect.width !== currentRect.width ||
          this.lastKnownRect.height !== currentRect.height) {

          console.debug('Position polling detected element change:', {
            oldRect: {
              left: this.lastKnownRect.left,
              top: this.lastKnownRect.top,
              width: this.lastKnownRect.width,
              height: this.lastKnownRect.height
            },
            newRect: {
              left: currentRect.left,
              top: currentRect.top,
              width: currentRect.width,
              height: currentRect.height
            }
          });

          this.lastKnownRect = currentRect;
          this.triggerOverlayUpdate();
        }
      }
    }, 16); // 16ms = ~60fps for smooth tracking

    console.debug('Position polling started (16ms interval for 60fps)');
  }

  cleanupTextElementObservers() {
    if (this.textElementObserver) {
      this.textElementObserver.disconnect();
      this.textElementObserver = null;
    }

    if (this.textElementResizeObserver) {
      this.textElementResizeObserver.disconnect();
      this.textElementResizeObserver = null;
    }

    if (this.inputEventHandler && this.currentFocusedElement) {
      this.currentFocusedElement.removeEventListener('input', this.inputEventHandler);
      this.inputEventHandler = null;
    }

    if (this.positionPollInterval) {
      clearInterval(this.positionPollInterval);
      this.positionPollInterval = null;
    }

    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    if (this.mutationTimeout) {
      clearTimeout(this.mutationTimeout);
      this.mutationTimeout = null;
    }

    if (this.inputTimeout) {
      clearTimeout(this.inputTimeout);
      this.inputTimeout = null;
    }

    console.debug('Text element observers cleaned up');
  }

  triggerOverlayUpdate() {
    // Trigger a state update to refresh overlays with current element position
    if (this.currentFocusedElement && this.state.getState().mode === 'text_focus') {
      // Force overlay update by triggering a state change
      this.state.setState({
        mode: 'text_focus',
        focusedTextElement: this.currentFocusedElement,
        _overlayUpdateTrigger: Date.now() // Unique value to force update
      });

      console.debug('Triggered overlay update for text element position/size change');
    }
  }
}