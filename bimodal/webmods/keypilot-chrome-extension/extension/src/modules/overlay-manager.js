/**
 * Visual overlay management for focus and delete indicators
 */
import { CSS_CLASSES, Z_INDEX, SELECTORS, MODES, COLORS } from '../config/constants.js';
import { HighlightManager } from './highlight-manager.js';

export class OverlayManager {
  constructor() {
    this.focusOverlay = null;
    this.deleteOverlay = null;
    this.focusedTextOverlay = null; // New overlay for focused text fields
    this.viewportModalFrame = null; // Viewport modal frame for text focus mode
    this.activeTextInputFrame = null; // Pulsing frame for active text inputs
    this.escExitLabelText = null; // ESC label for text fields
    this.escExitLabelHover = null; // ESC label for hovered elements
    
    // Initialize highlight manager
    this.highlightManager = new HighlightManager();
    
    // Intersection observer for overlay visibility optimization
    this.overlayObserver = null;
    this.resizeObserver = null; // ResizeObserver for viewport modal frame
    
    // Track overlay visibility state
    this.overlayVisibility = {
      focus: true,
      delete: true,
      focusedText: true,
      activeTextInput: true,
      escExitLabel: true
    };
    
    this.setupOverlayObserver();
    
    // Initialize highlight manager with observer
    this.highlightManager.initialize(this.overlayObserver);
  }

  setupOverlayObserver() {
    // Observer to optimize overlay rendering when out of view
    this.overlayObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          const overlay = entry.target;
          const isVisible = entry.intersectionRatio > 0;
          
          // Optimize rendering by hiding completely out-of-view overlays
          if (overlay === this.focusOverlay) {
            this.overlayVisibility.focus = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.deleteOverlay) {
            this.overlayVisibility.delete = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.focusedTextOverlay) {
            this.overlayVisibility.focusedText = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.activeTextInputFrame) {
            this.overlayVisibility.activeTextInput = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.escExitLabelText) {
            this.overlayVisibility.escExitLabel = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          } else if (overlay === this.escExitLabelHover) {
            this.overlayVisibility.escExitLabel = isVisible;
            overlay.style.visibility = isVisible ? 'visible' : 'hidden';
          }
        });
      },
      {
        rootMargin: '10px',
        threshold: [0, 1.0]
      }
    );
  }

  updateOverlays(focusEl, deleteEl, mode, focusedTextElement = null) {
    // Debug logging when debug mode is enabled
    if (window.KEYPILOT_DEBUG && focusEl) {
      console.log('[KeyPilot Debug] Updating overlays:', {
        focusElement: focusEl.tagName,
        mode: mode,
        willShowFocus: mode === 'none' || mode === 'text_focus' || mode === 'highlight',
        focusedTextElement: focusedTextElement?.tagName
      });
    }
    
    // Show focus overlay in normal mode, text focus mode, AND highlight mode
    if (mode === 'none' || mode === 'text_focus' || mode === 'highlight') {
      this.updateFocusOverlay(focusEl, mode);
      
      // Show ESC labels only in text mode
      if (mode === 'text_focus') {
        // Only show hover label if we have a focus element, otherwise hide it
        if (focusEl) {
          this.updateEscExitLabelHover(focusEl);
        } else {
          this.hideEscExitLabelHover();
        }
        // Always show text field exit label if we have a focused text element
        if (focusedTextElement) {
          this.updateEscExitLabelText(focusedTextElement);
        } else {
          this.hideEscExitLabelText();
        }
      } else {
        this.hideEscExitLabelText();
        this.hideEscExitLabelHover();
      }
    } else {
      this.hideFocusOverlay();
    }
    
    // Show focused text overlay when in text focus mode
    if (mode === 'text_focus' && focusedTextElement) {
      this.updateFocusedTextOverlay(focusedTextElement);
      this.updateActiveTextInputFrame(focusedTextElement);
    } else {
      this.hideFocusedTextOverlay();
      this.hideActiveTextInputFrame();
    }
    
    // Show viewport modal frame when in text focus mode
    this.updateViewportModalFrame(mode === 'text_focus');
    
    // Only show delete overlay in delete mode
    if (mode === 'delete') {
      this.updateDeleteOverlay(deleteEl);
    } else {
      this.hideDeleteOverlay();
    }
    
    // Show highlight overlay in highlight mode
    if (mode === 'highlight') {
      this.highlightManager.updateHighlightOverlay(focusEl);
      this.highlightManager.showHighlightModeIndicator();
    } else {
      this.highlightManager.hideHighlightOverlay();
      this.highlightManager.hideHighlightModeIndicator();
      this.highlightManager.hideHighlightRectangleOverlay();
    }
  }

  updateFocusOverlay(element, mode = MODES.NONE) {
    if (!element) {
      this.hideFocusOverlay();
      return;
    }

    // Determine if this is a text input element
    const isTextInput = element.matches && element.matches(SELECTORS.FOCUSABLE_TEXT);
    
    // Determine overlay color based on element type
    let borderColor, shadowColor;
    if (isTextInput) {
      // Orange color for text inputs in both normal mode and text focus mode
      borderColor = COLORS.ORANGE;
      shadowColor = COLORS.ORANGE_SHADOW;
    } else {
      // Green color for all non-text elements
      borderColor = COLORS.FOCUS_GREEN;
      shadowColor = COLORS.GREEN_SHADOW;
    }

    // Debug logging
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateFocusOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        text: element.textContent?.substring(0, 30),
        mode: mode,
        isTextInput: isTextInput,
        borderColor: borderColor
      });
    }

    if (!this.focusOverlay) {
      this.focusOverlay = this.createElement('div', {
        className: CSS_CLASSES.FOCUS_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.focusOverlay);
      
      // Debug logging for overlay creation
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focus overlay created and added to DOM:', {
          element: this.focusOverlay,
          className: this.focusOverlay.className,
          style: this.focusOverlay.style.cssText,
          parent: this.focusOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.focusOverlay);
      }
    }

    // Update overlay colors based on current context
    this.focusOverlay.style.border = `3px solid ${borderColor}`;
    const brightShadowColor = isTextInput ? COLORS.ORANGE_SHADOW : COLORS.GREEN_SHADOW_BRIGHT;
    this.focusOverlay.style.boxShadow = `0 0 0 2px ${shadowColor}, 0 0 10px 2px ${brightShadowColor}`;

    const rect = this.getBestRect(element);
    
    // Debug logging for positioning
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Focus overlay positioning:', {
        rect: rect,
        overlayExists: !!this.focusOverlay,
        overlayVisibility: this.overlayVisibility.focus
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Set position using left/top for now (simpler than transform)
      this.focusOverlay.style.left = `${rect.left}px`;
      this.focusOverlay.style.top = `${rect.top}px`;
      this.focusOverlay.style.width = `${rect.width}px`;
      this.focusOverlay.style.height = `${rect.height}px`;
      this.focusOverlay.style.display = 'block';
      this.focusOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focus overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focus overlay hidden - invalid rect:', rect);
      }
      this.hideFocusOverlay();
    }
  }

  hideFocusOverlay() {
    if (this.focusOverlay) {
      this.focusOverlay.style.display = 'none';
    }
  }

  updateDeleteOverlay(element) {
    if (!element) {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] updateDeleteOverlay: no element provided');
      }
      this.hideDeleteOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateDeleteOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.deleteOverlay) {
      this.deleteOverlay = this.createElement('div', {
        className: CSS_CLASSES.DELETE_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid ${COLORS.DELETE_RED};
          box-shadow: 0 0 0 2px ${COLORS.DELETE_SHADOW}, 0 0 12px 2px ${COLORS.DELETE_SHADOW_BRIGHT};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.deleteOverlay);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete overlay created and added to DOM:', {
          element: this.deleteOverlay,
          className: this.deleteOverlay.className,
          parent: this.deleteOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.deleteOverlay);
      }
    }

    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Delete overlay positioning:', {
        rect: rect,
        overlayExists: !!this.deleteOverlay,
        overlayVisibility: this.overlayVisibility.delete
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Use left/top positioning instead of transform for consistency with focus overlay
      this.deleteOverlay.style.left = `${rect.left}px`;
      this.deleteOverlay.style.top = `${rect.top}px`;
      this.deleteOverlay.style.width = `${rect.width}px`;
      this.deleteOverlay.style.height = `${rect.height}px`;
      this.deleteOverlay.style.display = 'block';
      this.deleteOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Delete overlay hidden - invalid rect:', rect);
      }
      this.hideDeleteOverlay();
    }
  }

  hideDeleteOverlay() {
    if (this.deleteOverlay) {
      this.deleteOverlay.style.display = 'none';
    }
  }

  // Highlight methods delegated to HighlightManager
  updateHighlightRectangleOverlay(startPosition, currentPosition) {
    return this.highlightManager.updateHighlightRectangleOverlay(startPosition, currentPosition);
  }

  hideHighlightRectangleOverlay() {
    return this.highlightManager.hideHighlightRectangleOverlay();
  }

  updateHighlightSelectionOverlays(selection) {
    return this.highlightManager.updateHighlightSelectionOverlays(selection);
  }

  clearHighlightSelectionOverlays() {
    return this.highlightManager.clearHighlightSelectionOverlays();
  }

  // Character selection methods
  setSelectionMode(mode) {
    return this.highlightManager.setSelectionMode(mode);
  }

  getSelectionMode() {
    return this.highlightManager.getSelectionMode();
  }

  startCharacterSelection(position, findTextNodeAtPosition, getTextOffsetAtPosition) {
    return this.highlightManager.startCharacterSelection(position, findTextNodeAtPosition, getTextOffsetAtPosition);
  }

  updateCharacterSelection(currentPosition, startPosition, findTextNodeAtPosition, getTextOffsetAtPosition) {
    return this.highlightManager.updateCharacterSelection(currentPosition, startPosition, findTextNodeAtPosition, getTextOffsetAtPosition);
  }

  completeCharacterSelection() {
    return this.highlightManager.completeCharacterSelection();
  }

  clearCharacterSelection() {
    return this.highlightManager.clearCharacterSelection();
  }

  /**
   * Create selection overlays for a specific range with shadow DOM support
   * @param {Range} range - DOM Range object
   */
  createSelectionOverlaysForRangeWithShadowSupport(range) {
    if (!range || range.collapsed) {
      return;
    }

    try {
      // Get all rectangles for the range (handles multi-line selections)
      const rects = this.getClientRectsWithShadowSupport(range);
      
      for (let i = 0; i < rects.length; i++) {
        const rect = rects[i];
        
        // Skip zero-width or zero-height rectangles
        if (rect.width <= 0 || rect.height <= 0) {
          continue;
        }

        // Create overlay element for this rectangle
        const overlay = this.createElement('div', {
          className: CSS_CLASSES.HIGHLIGHT_SELECTION,
          style: `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: ${COLORS.HIGHLIGHT_SELECTION_BG};
            border: 1px solid ${COLORS.HIGHLIGHT_SELECTION_BORDER};
            pointer-events: none;
            z-index: ${Z_INDEX.OVERLAYS - 1};
            will-change: transform;
          `
        });

        // Append to main document body (overlays should always be in main document)
        document.body.appendChild(overlay);
        this.highlightSelectionOverlays.push(overlay);

        // Start observing the overlay for visibility optimization
        if (this.overlayObserver) {
          this.overlayObserver.observe(overlay);
        }
      }

      if (window.KEYPILOT_DEBUG && rects.length > 0) {
        console.log('[KeyPilot Debug] Created selection overlays for range with shadow DOM support:', {
          rectCount: rects.length,
          firstRect: {
            left: rects[0].left,
            top: rects[0].top,
            width: rects[0].width,
            height: rects[0].height
          }
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error creating selection overlays for range with shadow DOM support:', error);
    }
  }

  /**
   * Get client rectangles for a range with shadow DOM support
   * @param {Range} range - DOM Range object
   * @returns {DOMRectList|Array} - Client rectangles
   */
  getClientRectsWithShadowSupport(range) {
    try {
      // First try the standard method
      const rects = range.getClientRects();
      if (rects && rects.length > 0) {
        return rects;
      }

      // If no rectangles found, try alternative methods for shadow DOM
      return this.getAlternativeClientRects(range);
    } catch (error) {
      console.warn('[KeyPilot] Error getting client rects with shadow DOM support:', error);
      return [];
    }
  }

  /**
   * Get alternative client rectangles for shadow DOM ranges
   * @param {Range} range - DOM Range object
   * @returns {Array} - Array of rectangle objects
   */
  getAlternativeClientRects(range) {
    try {
      const rects = [];
      
      // Try to get bounding rect as fallback
      const boundingRect = range.getBoundingClientRect();
      if (boundingRect && boundingRect.width > 0 && boundingRect.height > 0) {
        rects.push(boundingRect);
      }
      
      // For shadow DOM, we might need to manually calculate rectangles
      // by walking through the range contents
      if (rects.length === 0) {
        const shadowRects = this.calculateShadowDOMRects(range);
        rects.push(...shadowRects);
      }
      
      return rects;
    } catch (error) {
      console.warn('[KeyPilot] Error getting alternative client rects:', error);
      return [];
    }
  }

  /**
   * Calculate rectangles for shadow DOM ranges manually
   * @param {Range} range - DOM Range object
   * @returns {Array} - Array of rectangle objects
   */
  calculateShadowDOMRects(range) {
    try {
      const rects = [];
      
      // Get start and end containers
      const startContainer = range.startContainer;
      const endContainer = range.endContainer;
      
      if (startContainer === endContainer && startContainer.nodeType === Node.TEXT_NODE) {
        // Single text node selection
        const textRect = this.getTextNodeRect(startContainer, range.startOffset, range.endOffset);
        if (textRect) {
          rects.push(textRect);
        }
      } else {
        // Multi-node selection - this is more complex for shadow DOM
        // For now, use bounding rect as approximation
        try {
          const boundingRect = range.getBoundingClientRect();
          if (boundingRect && boundingRect.width > 0 && boundingRect.height > 0) {
            rects.push(boundingRect);
          }
        } catch (error) {
          // Ignore errors in complex shadow DOM scenarios
        }
      }
      
      return rects;
    } catch (error) {
      console.warn('[KeyPilot] Error calculating shadow DOM rects:', error);
      return [];
    }
  }

  /**
   * Get rectangle for a portion of a text node
   * @param {Text} textNode - Text node
   * @param {number} startOffset - Start character offset
   * @param {number} endOffset - End character offset
   * @returns {DOMRect|null} - Rectangle or null
   */
  getTextNodeRect(textNode, startOffset, endOffset) {
    try {
      const ownerDocument = textNode.ownerDocument || document;
      const tempRange = ownerDocument.createRange();
      tempRange.setStart(textNode, startOffset);
      tempRange.setEnd(textNode, endOffset);
      
      const rect = tempRange.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 ? rect : null;
    } catch (error) {
      console.warn('[KeyPilot] Error getting text node rect:', error);
      return null;
    }
  }

  /**
   * Create selection overlays for a specific range (legacy method for compatibility)
   * @param {Range} range - DOM Range object
   */
  createSelectionOverlaysForRange(range) {
    // Delegate to the shadow DOM-aware method
    this.createSelectionOverlaysForRangeWithShadowSupport(range);
  }



  updateFocusedTextOverlay(element) {
    if (!element) {
      this.hideFocusedTextOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateFocusedTextOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.focusedTextOverlay) {
      this.focusedTextOverlay = this.createElement('div', {
        className: 'kpv2-focused-text-overlay',
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS - 1};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.focusedTextOverlay);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focused text overlay created and added to DOM:', {
          element: this.focusedTextOverlay,
          className: this.focusedTextOverlay.className,
          parent: this.focusedTextOverlay.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.focusedTextOverlay);
      }
    }

    // Darkened orange color for focused text fields
    const borderColor = COLORS.ORANGE_SHADOW_DARK; // Slightly more opaque
    const shadowColor = COLORS.ORANGE_SHADOW_LIGHT; // Darker shadow
    
    this.focusedTextOverlay.style.border = `3px solid ${borderColor}`;
    this.focusedTextOverlay.style.boxShadow = `0 0 0 2px ${shadowColor}, 0 0 10px 2px ${COLORS.ORANGE_BORDER}`;

    // Always get fresh rect to handle dynamic position/size changes
    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Focused text overlay positioning:', {
        rect: rect,
        overlayExists: !!this.focusedTextOverlay,
        overlayVisibility: this.overlayVisibility.focusedText,
        timestamp: Date.now()
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Position the overlay with fresh coordinates
      this.focusedTextOverlay.style.left = `${rect.left}px`;
      this.focusedTextOverlay.style.top = `${rect.top}px`;
      this.focusedTextOverlay.style.width = `${rect.width}px`;
      this.focusedTextOverlay.style.height = `${rect.height}px`;
      this.focusedTextOverlay.style.display = 'block';
      this.focusedTextOverlay.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focused text overlay positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          timestamp: Date.now()
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Focused text overlay hidden - invalid rect:', rect);
      }
      this.hideFocusedTextOverlay();
    }
  }

  hideFocusedTextOverlay() {
    if (this.focusedTextOverlay) {
      this.focusedTextOverlay.style.display = 'none';
    }
  }

  updateActiveTextInputFrame(element) {
    if (!element) {
      this.hideActiveTextInputFrame();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateActiveTextInputFrame called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.activeTextInputFrame) {
      this.activeTextInputFrame = this.createElement('div', {
        className: CSS_CLASSES.ACTIVE_TEXT_INPUT_FRAME,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS + 1};
          background: transparent;
          will-change: transform, opacity;
        `
      });
      document.body.appendChild(this.activeTextInputFrame);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Active text input frame created and added to DOM:', {
          element: this.activeTextInputFrame,
          className: this.activeTextInputFrame.className,
          parent: this.activeTextInputFrame.parentElement?.tagName
        });
      }
      
      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.activeTextInputFrame);
      }
    }

    // Always get fresh rect to handle dynamic position/size changes
    const rect = this.getBestRect(element);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Active text input frame positioning:', {
        rect: rect,
        overlayExists: !!this.activeTextInputFrame,
        overlayVisibility: this.overlayVisibility.activeTextInput,
        timestamp: Date.now()
      });
    }
    
    if (rect.width > 0 && rect.height > 0) {
      // Position the pulsing frame with fresh coordinates
      this.activeTextInputFrame.style.left = `${rect.left}px`;
      this.activeTextInputFrame.style.top = `${rect.top}px`;
      this.activeTextInputFrame.style.width = `${rect.width}px`;
      this.activeTextInputFrame.style.height = `${rect.height}px`;
      this.activeTextInputFrame.style.display = 'block';
      this.activeTextInputFrame.style.visibility = 'visible';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Active text input frame positioned at:', {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          timestamp: Date.now()
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Active text input frame hidden - invalid rect:', rect);
      }
      this.hideActiveTextInputFrame();
    }
  }

  hideActiveTextInputFrame() {
    if (this.activeTextInputFrame) {
      this.activeTextInputFrame.style.display = 'none';
    }
  }

  calculateLabelPosition(elementRect, labelHeight) {
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Try placing below the element first
    const belowPosition = {
      left: elementRect.left,
      top: elementRect.top + elementRect.height + 8,
      position: 'below'
    };
    
    // Check if below position is off-screen
    if (belowPosition.top + labelHeight > viewportHeight) {
      // Try above the element
      const abovePosition = {
        left: elementRect.left,
        top: elementRect.top - labelHeight - 8,
        position: 'above'
      };
      
      if (abovePosition.top < 0) {
        // Try right side if both above/below don't work
        return {
          left: elementRect.left + elementRect.width + 8,
          top: elementRect.top,
          position: 'right'
        };
      }
      return abovePosition;
    }
    return belowPosition;
  }

  updateEscExitLabelText(element) {
    if (!element) {
      this.hideEscExitLabelText();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateEscExitLabelText called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.escExitLabelText) {
      this.escExitLabelText = this.createElement('div', {
        className: CSS_CLASSES.ESC_EXIT_LABEL,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS + 1};
          will-change: transform, opacity;
          font-family: Arial, sans-serif;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          background-color: ${COLORS.ORANGE_BG};
          color: ${COLORS.ORANGE_TEXT};
          border: 1px solid ${COLORS.ORANGE_BORDER};
        `
      });
      this.escExitLabelText.textContent = 'Press ESC to exit';
      document.body.appendChild(this.escExitLabelText);
      this.labelHeight = this.escExitLabelText.offsetHeight;
      if (this.overlayObserver) this.overlayObserver.observe(this.escExitLabelText);
    }

    const rect = this.getBestRect(element);
    if (rect.width > 0 && rect.height > 0) {
      const position = this.calculateLabelPosition(rect, this.labelHeight);
      this.escExitLabelText.style.left = `${position.left}px`;
      this.escExitLabelText.style.top = `${position.top}px`;
      this.escExitLabelText.style.display = 'block';
      this.escExitLabelText.style.visibility = 'visible';
    } else {
      this.hideEscExitLabelText();
    }
  }

  updateEscExitLabelHover(element) {
    if (!element) {
      this.hideEscExitLabelHover();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateEscExitLabelHover called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.escExitLabelHover) {
      this.escExitLabelHover = this.createElement('div', {
        className: CSS_CLASSES.ESC_EXIT_LABEL,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS + 1};
          will-change: transform, opacity;
          font-family: Arial, sans-serif;
          font-size: 14px;
          padding: 4px 8px;
          border-radius: 4px;
          white-space: nowrap;
          background-color: ${COLORS.FOCUS_GREEN_BG};
          color: ${COLORS.FOCUS_GREEN_TEXT};
          border: 1px solid ${COLORS.FOCUS_GREEN};
        `
      });
      this.escExitLabelHover.textContent = 'ESC clicks';
      document.body.appendChild(this.escExitLabelHover);
      this.labelHeight = this.escExitLabelHover.offsetHeight;
      if (this.overlayObserver) this.overlayObserver.observe(this.escExitLabelHover);
    }

    const rect = this.getBestRect(element);
    if (rect.width > 0 && rect.height > 0) {
      const position = this.calculateLabelPosition(rect, this.labelHeight);
      this.escExitLabelHover.style.left = `${position.left}px`;
      this.escExitLabelHover.style.top = `${position.top}px`;
      this.escExitLabelHover.style.display = 'block';
      this.escExitLabelHover.style.visibility = 'visible';
    } else {
      this.hideEscExitLabelHover();
    }
  }

  hideEscExitLabelText() {
    if (this.escExitLabelText) this.escExitLabelText.style.display = 'none';
  }

  hideEscExitLabelHover() {
    if (this.escExitLabelHover) this.escExitLabelHover.style.display = 'none';
  }

  hideEscExitLabel() {
    this.hideEscExitLabelText();
    this.hideEscExitLabelHover();
  }

  updateElementClasses(focusEl, deleteEl, prevFocusEl, prevDeleteEl) {
    // Remove previous classes
    if (prevFocusEl && prevFocusEl !== focusEl) {
      prevFocusEl.classList.remove(CSS_CLASSES.FOCUS);
    }
    if (prevDeleteEl && prevDeleteEl !== deleteEl) {
      prevDeleteEl.classList.remove(CSS_CLASSES.DELETE);
    }

    // Add new classes
    if (focusEl) {
      focusEl.classList.add(CSS_CLASSES.FOCUS);
    }
    if (deleteEl) {
      deleteEl.classList.add(CSS_CLASSES.DELETE);
    }
  }

  getBestRect(element) {
    if (!element) return { left: 0, top: 0, width: 0, height: 0 };
    
    let rect = element.getBoundingClientRect();
    
    // Debug logging
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] getBestRect for element:', {
        tagName: element.tagName,
        originalRect: {
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height
        }
      });
    }
    
    // If the element has no height (common with links containing other elements),
    // try to find a child element with height
    if (rect.height === 0 && element.children.length > 0) {
      for (const child of element.children) {
        const childRect = child.getBoundingClientRect();
        if (childRect.height > 0) {
          // Use the child's rect but keep the parent's left position if it's a link
          if (element.tagName.toLowerCase() === 'a') {
            const finalRect = {
              left: Math.min(rect.left, childRect.left),
              top: childRect.top,
              width: Math.max(rect.width, childRect.width),
              height: childRect.height
            };
            if (window.KEYPILOT_DEBUG) {
              console.log('[KeyPilot Debug] Using child rect for link:', finalRect);
            }
            return finalRect;
          }
          if (window.KEYPILOT_DEBUG) {
            console.log('[KeyPilot Debug] Using child rect:', childRect);
          }
          return childRect;
        }
      }
    }
    
    // If still no height, try to get text content dimensions
    if (rect.height === 0 && element.textContent && element.textContent.trim()) {
      // For text-only elements, use a minimum height
      const finalRect = {
        left: rect.left,
        top: rect.top,
        width: Math.max(rect.width, 20), // Minimum width
        height: Math.max(rect.height, 20) // Minimum height
      };
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Using minimum dimensions:', finalRect);
      }
      return finalRect;
    }
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Using original rect:', rect);
    }
    return rect;
  }

  flashFocusOverlay() {
    if (!this.focusOverlay || this.focusOverlay.style.display === 'none') {
      return; // No overlay to flash
    }
    
    // Create flash animation by temporarily changing the overlay style
    const originalBorder = this.focusOverlay.style.border;
    const originalBoxShadow = this.focusOverlay.style.boxShadow;
    
    // Flash with brighter colors
    this.focusOverlay.style.border = `3px solid ${COLORS.FLASH_GREEN}`;
    this.focusOverlay.style.boxShadow = `0 0 0 2px ${COLORS.FLASH_GREEN_SHADOW}, 0 0 20px 4px ${COLORS.FLASH_GREEN_GLOW}`;
    this.focusOverlay.style.transition = 'border 0.15s ease-out, box-shadow 0.15s ease-out';
    
    // Reset after animation
    setTimeout(() => {
      if (this.focusOverlay) {
        this.focusOverlay.style.border = originalBorder;
        this.focusOverlay.style.boxShadow = originalBoxShadow;
        
        // Remove transition after reset to avoid interfering with normal updates
        setTimeout(() => {
          if (this.focusOverlay) {
            this.focusOverlay.style.transition = '';
          }
        }, 150);
      }
    }, 150);
  }

  createViewportModalFrame() {
    if (this.viewportModalFrame) {
      return this.viewportModalFrame;
    }

    this.viewportModalFrame = this.createElement('div', {
      className: CSS_CLASSES.VIEWPORT_MODAL_FRAME,
      style: `
        display: none;
      `
    });

    document.body.appendChild(this.viewportModalFrame);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame created and added to DOM:', {
        element: this.viewportModalFrame,
        className: this.viewportModalFrame.className,
        parent: this.viewportModalFrame.parentElement?.tagName
      });
    }

    return this.viewportModalFrame;
  }

  showViewportModalFrame() {
    if (!this.viewportModalFrame) {
      this.createViewportModalFrame();
    }

    this.viewportModalFrame.style.display = 'block';

    // Set up ResizeObserver to handle viewport changes with enhanced monitoring
    if (!this.resizeObserver && window.ResizeObserver) {
      this.resizeObserver = new ResizeObserver((entries) => {
        // Debounce resize updates to avoid excessive calls during continuous resizing
        if (this.resizeTimeout) {
          clearTimeout(this.resizeTimeout);
        }
        this.resizeTimeout = setTimeout(() => {
          this.updateViewportModalFrameSize();
          this.resizeTimeout = null;
        }, 16); // ~60fps for smooth updates
      });
      
      // Observe both document element and body for comprehensive viewport tracking
      this.resizeObserver.observe(document.documentElement);
      if (document.body) {
        this.resizeObserver.observe(document.body);
      }
    }

    // Enhanced fallback to window resize events if ResizeObserver is not available
    if (!window.ResizeObserver) {
      this.windowResizeHandler = this.debounce(() => {
        this.updateViewportModalFrameSize();
      }, 16);
      window.addEventListener('resize', this.windowResizeHandler);
      window.addEventListener('orientationchange', this.windowResizeHandler);
    }

    // Listen for fullscreen changes
    this.fullscreenHandler = () => {
      // Small delay to allow fullscreen transition to complete
      setTimeout(() => {
        this.updateViewportModalFrameSize();
      }, 100);
    };
    document.addEventListener('fullscreenchange', this.fullscreenHandler);
    document.addEventListener('webkitfullscreenchange', this.fullscreenHandler);
    document.addEventListener('mozfullscreenchange', this.fullscreenHandler);
    document.addEventListener('MSFullscreenChange', this.fullscreenHandler);

    // Listen for zoom changes (via visual viewport API if available)
    if (window.visualViewport) {
      this.visualViewportHandler = () => {
        this.updateViewportModalFrameSize();
      };
      window.visualViewport.addEventListener('resize', this.visualViewportHandler);
    }

    // Initial size update
    this.updateViewportModalFrameSize();

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame shown with enhanced resize handling');
    }
  }

  hideViewportModalFrame() {
    if (this.viewportModalFrame) {
      this.viewportModalFrame.style.display = 'none';
    }

    // Clean up ResizeObserver
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Remove window resize listener fallback
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      window.removeEventListener('orientationchange', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }

    // Remove fullscreen change listeners
    if (this.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenHandler);
      this.fullscreenHandler = null;
    }

    // Remove visual viewport listener
    if (this.visualViewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler);
      this.visualViewportHandler = null;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame hidden and all listeners cleaned up');
    }
  }

  updateViewportModalFrame(show) {
    if (show) {
      this.showViewportModalFrame();
    } else {
      this.hideViewportModalFrame();
    }
  }

  updateViewportModalFrameSize() {
    if (!this.viewportModalFrame || this.viewportModalFrame.style.display === 'none') {
      return;
    }

    // Get current viewport dimensions with fallbacks
    let viewportWidth, viewportHeight;

    // Use visual viewport API if available (handles zoom and mobile keyboards)
    if (window.visualViewport) {
      viewportWidth = window.visualViewport.width;
      viewportHeight = window.visualViewport.height;
    } else {
      // Fallback to standard viewport dimensions
      viewportWidth = window.innerWidth || document.documentElement.clientWidth;
      viewportHeight = window.innerHeight || document.documentElement.clientHeight;
    }

    // Handle fullscreen mode detection
    const isFullscreen = !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );

    // Adjust for developer tools if not in fullscreen
    if (!isFullscreen) {
      // Check if developer tools might be open by comparing window dimensions
      const windowWidth = window.outerWidth;
      const windowHeight = window.outerHeight;
      
      // If there's a significant difference, dev tools might be open
      const widthDiff = Math.abs(windowWidth - viewportWidth);
      const heightDiff = Math.abs(windowHeight - viewportHeight);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Viewport size analysis:', {
          viewportWidth,
          viewportHeight,
          windowWidth,
          windowHeight,
          widthDiff,
          heightDiff,
          isFullscreen,
          visualViewportAvailable: !!window.visualViewport
        });
      }
    }

    // Update frame dimensions using calculated viewport size
    this.viewportModalFrame.style.width = `${viewportWidth}px`;
    this.viewportModalFrame.style.height = `${viewportHeight}px`;

    // Ensure frame stays positioned at viewport origin
    this.viewportModalFrame.style.left = '0px';
    this.viewportModalFrame.style.top = '0px';

    // Handle zoom level changes by ensuring the frame covers the visible area
    if (window.visualViewport) {
      // Adjust position for visual viewport offset (mobile keyboards, etc.)
      this.viewportModalFrame.style.left = `${window.visualViewport.offsetLeft}px`;
      this.viewportModalFrame.style.top = `${window.visualViewport.offsetTop}px`;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Viewport modal frame size updated:', {
        width: `${viewportWidth}px`,
        height: `${viewportHeight}px`,
        left: this.viewportModalFrame.style.left,
        top: this.viewportModalFrame.style.top,
        isFullscreen,
        zoomLevel: window.devicePixelRatio || 1
      });
    }
  }

  cleanup() {
    if (this.overlayObserver) {
      this.overlayObserver.disconnect();
      this.overlayObserver = null;
    }
    
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    // Clean up resize timeout
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }

    // Clean up window resize handlers
    if (this.windowResizeHandler) {
      window.removeEventListener('resize', this.windowResizeHandler);
      window.removeEventListener('orientationchange', this.windowResizeHandler);
      this.windowResizeHandler = null;
    }

    // Clean up fullscreen handlers
    if (this.fullscreenHandler) {
      document.removeEventListener('fullscreenchange', this.fullscreenHandler);
      document.removeEventListener('webkitfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('mozfullscreenchange', this.fullscreenHandler);
      document.removeEventListener('MSFullscreenChange', this.fullscreenHandler);
      this.fullscreenHandler = null;
    }

    // Clean up visual viewport handler
    if (this.visualViewportHandler && window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler);
      this.visualViewportHandler = null;
    }
    
    if (this.focusOverlay) {
      this.focusOverlay.remove();
      this.focusOverlay = null;
    }
    if (this.deleteOverlay) {
      this.deleteOverlay.remove();
      this.deleteOverlay = null;
    }
    // Clean up highlight manager
    if (this.highlightManager) {
      this.highlightManager.cleanup();
    }
    if (this.focusedTextOverlay) {
      this.focusedTextOverlay.remove();
      this.focusedTextOverlay = null;
    }
    if (this.viewportModalFrame) {
      this.viewportModalFrame.remove();
      this.viewportModalFrame = null;
    }
    if (this.activeTextInputFrame) {
      this.activeTextInputFrame.remove();
      this.activeTextInputFrame = null;
    }
    if (this.escExitLabelText) {
      this.escExitLabelText.remove();
      this.escExitLabelText = null;
    }
    if (this.escExitLabelHover) {
      this.escExitLabelHover.remove();
      this.escExitLabelHover = null;
    }
  }

  createElement(tag, props = {}) {
    const element = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (key === 'className') {
        element.className = value;
      } else if (key === 'style') {
        element.style.cssText = value;
      } else {
        element.setAttribute(key, value);
      }
    }
    return element;
  }

  // Utility method for debouncing function calls
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
}