import { EventManager } from './event-manager.js';
import { COLORS, Z_INDEX, CSS_CLASSES, FEATURE_FLAGS, RECTANGLE_SELECTION } from '../config/constants.js';

/**
 * HighlightManager - Manages all highlighting functionality including overlays and selection
 */
export class HighlightManager extends EventManager {
  constructor() {
    super();

    // Highlight overlays
    this.highlightOverlay = null; // Overlay for highlight mode
    this.highlightRectangleOverlay = null; // Real-time highlight rectangle overlay
    this.highlightSelectionOverlays = []; // Array of overlays for selected text regions
    this.highlightModeIndicator = null; // Visual indicator for highlight mode

    // Selection mode state
    this.selectionMode = 'character'; // 'character' or 'rectangle'
    
    // Character selection state
    this.characterSelectionActive = false;
    this.characterStartPosition = null; // Starting position for character selection
    this.characterStartTextNode = null; // Starting text node
    this.characterStartOffset = 0; // Starting character offset

    // Rectangle selection state
    this.rectOriginPoint = null; // Origin point established by first H key press (viewport coordinates)
    this.rectOriginDocumentPoint = null; // Origin point in document coordinates (accounts for scroll)



    // Debug HUD
    this.debugHUD = null; // Debug HUD overlay for live rectangle debugging
    this.debugUpdateCount = 0; // Counter for debug updates

    // Overlay visibility tracking
    this.overlayVisibility = {
      highlight: true,
      highlightRectangle: true
    };

    // Intersection observer for performance optimization
    this.overlayObserver = null;
  }

  /**
   * Initialize the highlight manager with intersection observer
   */
  initialize(overlayObserver) {
    this.overlayObserver = overlayObserver;
  }

  /**
   * Set the selection mode
   * @param {string} mode - 'character' or 'rectangle'
   */
  setSelectionMode(mode) {
    if (mode === 'character' || mode === 'rectangle') {
      this.selectionMode = mode;
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Selection mode set to:', mode);
      }
    }
  }

  /**
   * Get the current selection mode
   * @returns {string} - Current selection mode
   */
  getSelectionMode() {
    return this.selectionMode;
  }

  /**
   * Initialize the highlight manager with edge-only rectangle intersection observer
   * @param {RectangleIntersectionObserver} rectangleObserver - Edge-only intersection observer
   * @param {Function} notificationCallback - Callback for user notifications
   */
  initializeEdgeOnlyProcessing(rectangleObserver, notificationCallback = null) {
    this.rectangleIntersectionObserver = rectangleObserver;
    this.edgeOnlyProcessingEnabled = FEATURE_FLAGS.USE_EDGE_ONLY_SELECTION && FEATURE_FLAGS.ENABLE_EDGE_ONLY_PROCESSING;
    
    // Set up notification callback for performance monitoring
    if (notificationCallback && this.rectangleIntersectionObserver) {
      this.rectangleIntersectionObserver.setNotificationCallback(notificationCallback);
    }
    
    if (window.KEYPILOT_DEBUG && FEATURE_FLAGS.DEBUG_EDGE_ONLY_PROCESSING) {
      console.log('[KeyPilot Debug] Highlight manager initialized with edge-only processing:', {
        enabled: this.edgeOnlyProcessingEnabled,
        observer: !!this.rectangleIntersectionObserver,
        caching: FEATURE_FLAGS.ENABLE_SELECTION_CACHING,
        monitoring: FEATURE_FLAGS.ENABLE_EDGE_PERFORMANCE_MONITORING,
        notificationCallback: !!notificationCallback
      });
    }
  }

  /**
   * Create a DOM element with specified properties
   */
  createElement(tagName, properties = {}) {
    const element = document.createElement(tagName);

    if (properties.className) {
      element.className = properties.className;
    }

    if (properties.style) {
      element.style.cssText = properties.style;
    }

    return element;
  }

  /**
   * Update highlight overlay for focused element
   */
  updateHighlightOverlay(element) {
    if (!element) {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] updateHighlightOverlay: no element provided');
      }
      this.hideHighlightOverlay();
      return;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateHighlightOverlay called for:', {
        tagName: element.tagName,
        className: element.className,
        id: element.id
      });
    }

    if (!this.highlightOverlay) {
      this.highlightOverlay = this.createElement('div', {
        className: CSS_CLASSES.HIGHLIGHT_OVERLAY,
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS};
          border: 3px solid ${COLORS.HIGHLIGHT_BLUE};
          box-shadow: 0 0 0 2px ${COLORS.HIGHLIGHT_SHADOW}, 0 0 12px 2px ${COLORS.HIGHLIGHT_SHADOW_BRIGHT};
          background: transparent;
          will-change: transform;
        `
      });
      document.body.appendChild(this.highlightOverlay);

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay created and added to DOM:', {
          element: this.highlightOverlay,
          className: this.highlightOverlay.className,
          parent: this.highlightOverlay.parentElement?.tagName
        });
      }

      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.highlightOverlay);
      }
    }

    const rect = element.getBoundingClientRect();

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Highlight overlay positioning:', {
        rect: rect,
        overlayExists: !!this.highlightOverlay,
        overlayVisibility: this.overlayVisibility.highlight
      });
    }

    if (rect.width > 0 && rect.height > 0) {
      this.highlightOverlay.style.left = `${rect.left}px`;
      this.highlightOverlay.style.top = `${rect.top}px`;
      this.highlightOverlay.style.width = `${rect.width}px`;
      this.highlightOverlay.style.height = `${rect.height}px`;
      this.highlightOverlay.style.display = 'block';
      this.highlightOverlay.style.visibility = 'visible';

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay positioned at:', {
          left: rect.left, top: rect.top, width: rect.width, height: rect.height
        });
      }
    } else {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay hidden - invalid rect:', rect);
      }
      this.hideHighlightOverlay();
    }
  }

  /**
   * Hide the highlight overlay
   */
  hideHighlightOverlay() {
    if (this.highlightOverlay) {
      this.highlightOverlay.style.display = 'none';

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight overlay hidden');
      }
    }
  }

  /**
   * Update edge-only processing rectangle bounds for all workflows
   * @param {Object} rectOriginPoint - Origin point {x, y} (viewport coordinates)
   * @param {Object} currentPosition - Current cursor position {x, y} (viewport coordinates)
   */
  updateEdgeOnlyProcessingRectangle(rectOriginPoint, currentPosition) {
    if (!this.edgeOnlyProcessingEnabled || !this.rectangleIntersectionObserver) {
      return;
    }

    if (!rectOriginPoint || !currentPosition) {
      return;
    }

    try {
      // Convert viewport coordinates to document coordinates
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;

      const originDocX = rectOriginPoint.x + scrollX;
      const originDocY = rectOriginPoint.y + scrollY;
      const currentDocX = currentPosition.x + scrollX;
      const currentDocY = currentPosition.y + scrollY;

      // Calculate rectangle bounds in document coordinates
      const rect = {
        left: Math.min(originDocX, currentDocX),
        top: Math.min(originDocY, currentDocY),
        width: Math.abs(currentDocX - originDocX),
        height: Math.abs(currentDocY - originDocY)
      };

      // Update edge-only processing rectangle
      this.rectangleIntersectionObserver.updateRectangle(rect);

      if (window.KEYPILOT_DEBUG && FEATURE_FLAGS.DETAILED_EDGE_LOGGING) {
        console.log('[KeyPilot Debug] Edge-only processing rectangle updated:', {
          viewport: { origin: rectOriginPoint, current: currentPosition },
          document: { originDocX, originDocY, currentDocX, currentDocY },
          rect: rect
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error updating edge-only processing rectangle:', error);
    }
  }

  /**
   * Update the highlight rectangle overlay showing the selection area
   * @param {Object} rectOriginPoint - Origin point from first H key press {x, y} (viewport coordinates)
   * @param {Object} currentPosition - Current cursor position {x, y} (viewport coordinates)
   */
  updateHighlightRectangleOverlay(rectOriginPoint, currentPosition) {
    if (!rectOriginPoint || !currentPosition) {
      this.hideHighlightRectangleOverlay();
      return;
    }

    // Store the original document coordinates when rectangle starts
    if (!this.rectOriginDocumentPoint) {
      this.rectOriginDocumentPoint = {
        x: rectOriginPoint.x + window.scrollX,
        y: rectOriginPoint.y + window.scrollY
      };

      // Show debug HUD when rectangle selection starts
      this.showDebugHUD();
    }

    // Convert current viewport position to document coordinates
    const currentDocumentPosition = {
      x: currentPosition.x + window.scrollX,
      y: currentPosition.y + window.scrollY
    };

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] updateHighlightRectangleOverlay called:', {
        rectOriginPoint,
        currentPosition,
        rectOriginDocumentPoint: this.rectOriginDocumentPoint,
        currentDocumentPosition,
        scrollX: window.scrollX,
        scrollY: window.scrollY
      });
    }

    if (!this.highlightRectangleOverlay) {
      this.highlightRectangleOverlay = this.createElement('div', {
        className: 'kpv2-highlight-rectangle-overlay',
        style: `
          position: fixed;
          pointer-events: none;
          z-index: ${Z_INDEX.OVERLAYS - 2};
          background: ${COLORS.HIGHLIGHT_SELECTION_BG};
          border: 2px dashed ${COLORS.HIGHLIGHT_BLUE};
          box-shadow: 0 0 0 1px ${COLORS.HIGHLIGHT_SHADOW}, 0 0 8px 1px ${COLORS.HIGHLIGHT_SHADOW_BRIGHT};
          will-change: transform;
          opacity: 0.8;
          box-sizing: border-box;
        `
      });
      document.body.appendChild(this.highlightRectangleOverlay);

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay created and added to DOM:', {
          element: this.highlightRectangleOverlay,
          className: this.highlightRectangleOverlay.className,
          parent: this.highlightRectangleOverlay.parentElement?.tagName
        });
      }

      // Start observing the overlay for visibility optimization
      if (this.overlayObserver) {
        this.overlayObserver.observe(this.highlightRectangleOverlay);
      }
    }

    // Desktop file selection behavior: rectangle drawn from origin to current position
    // Use document coordinates for calculation, then convert back to viewport for positioning
    const documentLeft = Math.min(this.rectOriginDocumentPoint.x, currentDocumentPosition.x);
    const documentTop = Math.min(this.rectOriginDocumentPoint.y, currentDocumentPosition.y);
    const width = Math.abs(currentDocumentPosition.x - this.rectOriginDocumentPoint.x);
    const height = Math.abs(currentDocumentPosition.y - this.rectOriginDocumentPoint.y);

    // Convert document coordinates back to viewport coordinates for positioning
    const viewportLeft = documentLeft - window.scrollX;
    const viewportTop = documentTop - window.scrollY;

    // Calculate direction for debugging
    const deltaX = currentDocumentPosition.x - this.rectOriginDocumentPoint.x;
    const deltaY = currentDocumentPosition.y - this.rectOriginDocumentPoint.y;
    const quadrant = this.getQuadrant(deltaX, deltaY);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Highlight rectangle overlay positioning:', {
        documentLeft, documentTop, width, height,
        viewportLeft, viewportTop,
        rectOriginDocumentPoint: this.rectOriginDocumentPoint,
        currentDocumentPosition,
        deltaX, deltaY, quadrant,
        direction: {
          horizontal: deltaX >= 0 ? 'right' : 'left',
          vertical: deltaY >= 0 ? 'down' : 'up'
        }
      });
    }

    // Prepare calculated values for debug HUD
    const calculatedValues = {
      documentLeft,
      documentTop,
      width,
      height,
      viewportLeft,
      viewportTop,
      quadrant
    };

    // Update debug HUD with current information
    this.updateDebugHUD(
      rectOriginPoint,
      currentPosition,
      this.rectOriginDocumentPoint,
      currentDocumentPosition,
      calculatedValues
    );

    // Update edge-only processing rectangle for all workflows
    this.updateEdgeOnlyProcessingRectangle(rectOriginPoint, currentPosition);

    // Determine if rectangle should be visible based on configuration
    const shouldShowRectangle = this.shouldShowRectangle(width, height, deltaX, deltaY);
    
    if (shouldShowRectangle) {
      this.highlightRectangleOverlay.style.left = `${viewportLeft}px`;
      this.highlightRectangleOverlay.style.top = `${viewportTop}px`;
      this.highlightRectangleOverlay.style.width = `${width}px`;
      this.highlightRectangleOverlay.style.height = `${height}px`;
      this.highlightRectangleOverlay.style.display = 'block';
      this.highlightRectangleOverlay.style.visibility = 'visible';

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay positioned at:', {
          viewportLeft, viewportTop, width, height, quadrant,
          shouldShow: shouldShowRectangle,
          minWidth: RECTANGLE_SELECTION.MIN_WIDTH,
          minHeight: RECTANGLE_SELECTION.MIN_HEIGHT
        });
      }
    } else {
      this.highlightRectangleOverlay.style.display = 'none';

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay hidden:', { 
          width, height, 
          shouldShow: shouldShowRectangle,
          minWidth: RECTANGLE_SELECTION.MIN_WIDTH,
          minHeight: RECTANGLE_SELECTION.MIN_HEIGHT,
          reason: width < RECTANGLE_SELECTION.MIN_WIDTH ? 'width too small' : 
                  height < RECTANGLE_SELECTION.MIN_HEIGHT ? 'height too small' : 'other'
        });
      }
    }
  }

  /**
   * Determine which quadrant the current position is relative to the origin
   * @param {number} deltaX - Horizontal distance from origin
   * @param {number} deltaY - Vertical distance from origin
   * @returns {string} - Quadrant identifier
   */
  getQuadrant(deltaX, deltaY) {
    if (deltaX >= 0 && deltaY >= 0) return 'bottom-right';
    if (deltaX < 0 && deltaY >= 0) return 'bottom-left';
    if (deltaX < 0 && deltaY < 0) return 'top-left';
    if (deltaX >= 0 && deltaY < 0) return 'top-right';
    return 'origin';
  }

  /**
   * Determine if the rectangle should be visible based on size and configuration
   * @param {number} width - Rectangle width in pixels
   * @param {number} height - Rectangle height in pixels
   * @param {number} deltaX - Horizontal distance from origin
   * @param {number} deltaY - Vertical distance from origin
   * @returns {boolean} - Whether rectangle should be shown
   */
  shouldShowRectangle(width, height, deltaX, deltaY) {
    // Always hide if zero dimensions and HIDE_ZERO_SIZE is enabled
    if (RECTANGLE_SELECTION.HIDE_ZERO_SIZE && (width === 0 || height === 0)) {
      return false;
    }

    // Show immediate feedback for any movement if enabled
    if (RECTANGLE_SELECTION.SHOW_IMMEDIATE_FEEDBACK && (Math.abs(deltaX) > 0 || Math.abs(deltaY) > 0)) {
      return true;
    }

    // Check minimum size requirements
    const meetsMinWidth = width >= RECTANGLE_SELECTION.MIN_WIDTH;
    const meetsMinHeight = height >= RECTANGLE_SELECTION.MIN_HEIGHT;
    
    // Check minimum drag distance
    const dragDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const meetsMinDrag = dragDistance >= RECTANGLE_SELECTION.MIN_DRAG_DISTANCE;

    // Rectangle is visible if it meets size requirements OR minimum drag distance
    return (meetsMinWidth && meetsMinHeight) || meetsMinDrag;
  }

  /**
   * Hide the highlight rectangle overlay
   */
  hideHighlightRectangleOverlay() {
    if (this.highlightRectangleOverlay) {
      this.highlightRectangleOverlay.style.display = 'none';

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight rectangle overlay hidden');
      }
    }

    // Reset rectangle selection state
    this.resetRectangleSelection();
  }

  /**
   * Get current selection from edge-only processing
   * @returns {Selection|null} - Browser selection object or null
   */
  getEdgeOnlySelection() {
    if (!this.edgeOnlyProcessingEnabled || !this.rectangleIntersectionObserver) {
      return null;
    }

    try {
      return this.rectangleIntersectionObserver.createSelectionFromIntersection();
    } catch (error) {
      console.warn('[KeyPilot] Error getting edge-only selection:', error);
      return null;
    }
  }

  /**
   * Start character-level selection at the given position
   * @param {Object} position - Position {x, y} in viewport coordinates
   * @param {Function} findTextNodeAtPosition - Function to find text node at position
   * @param {Function} getTextOffsetAtPosition - Function to get text offset at position
   */
  startCharacterSelection(position, findTextNodeAtPosition, getTextOffsetAtPosition) {
    if (!position || typeof position.x !== 'number' || typeof position.y !== 'number') {
      console.warn('[KeyPilot] Invalid position for character selection:', position);
      return false;
    }

    try {
      // Initialize rectangle selection state for visual rectangle overlay
      this.rectOriginPoint = { ...position };
      this.rectOriginDocumentPoint = {
        x: position.x + window.scrollX,
        y: position.y + window.scrollY
      };

      // Find text node at the starting position
      const textNode = findTextNodeAtPosition(position.x, position.y);
      if (!textNode) {
        if (window.KEYPILOT_DEBUG) {
          console.log('[KeyPilot Debug] No text node found at position for character selection');
        }
        return false;
      }

      // Get character offset within the text node
      const offset = getTextOffsetAtPosition(textNode, position.x, position.y);

      // Store character selection state
      this.characterSelectionActive = true;
      this.characterStartPosition = { ...position };
      this.characterStartTextNode = textNode;
      this.characterStartOffset = offset;

      // Create initial selection range
      const ownerDocument = textNode.ownerDocument || document;
      const range = ownerDocument.createRange();
      range.setStart(textNode, offset);
      range.setEnd(textNode, offset);

      // Set browser selection
      const selection = this.getSelectionForDocument(ownerDocument);
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Character selection started:', {
          position,
          textNode: textNode.textContent?.substring(0, 50),
          offset,
          selectedText: textNode.textContent?.charAt(offset)
        });
      }

      return true;
    } catch (error) {
      console.error('[KeyPilot] Error starting character selection:', error);
      this.resetCharacterSelection();
      return false;
    }
  }

  /**
   * Update character-level selection to the current position
   * @param {Object} currentPosition - Current position {x, y} in viewport coordinates
   * @param {Object} startPosition - Start position {x, y} in viewport coordinates  
   * @param {Function} findTextNodeAtPosition - Function to find text node at position
   * @param {Function} getTextOffsetAtPosition - Function to get text offset at position
   */
  updateCharacterSelection(currentPosition, startPosition, findTextNodeAtPosition, getTextOffsetAtPosition) {
    if (!this.characterSelectionActive || !this.characterStartTextNode) {
      return false;
    }

    if (!currentPosition || typeof currentPosition.x !== 'number' || typeof currentPosition.y !== 'number') {
      return false;
    }

    try {
      // Show the same rectangle overlay as rectangle selection mode
      if (startPosition) {
        this.updateHighlightRectangleOverlay(startPosition, currentPosition);
      }

      // Calculate rectangle bounds in document coordinates
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      const startDocX = startPosition.x + scrollX;
      const startDocY = startPosition.y + scrollY;
      const currentDocX = currentPosition.x + scrollX;
      const currentDocY = currentPosition.y + scrollY;
      
      const rectBounds = {
        left: Math.min(startDocX, currentDocX),
        top: Math.min(startDocY, currentDocY),
        right: Math.max(startDocX, currentDocX),
        bottom: Math.max(startDocY, currentDocY)
      };

      // Create rectangle-constrained character selection
      const selection = this.createRectangleConstrainedCharacterSelection(rectBounds);
      
      if (selection) {
        // Update visual selection overlays
        this.updateHighlightSelectionOverlays(selection);

        if (window.KEYPILOT_DEBUG) {
          console.log('[KeyPilot Debug] Rectangle-constrained character selection updated:', {
            selectedText: selection.toString().substring(0, 100),
            rangeCount: selection.rangeCount,
            rectBounds
          });
        }
      }

      return true;
    } catch (error) {
      console.error('[KeyPilot] Error updating character selection:', error);
      return false;
    }
  }

  /**
   * Create a character selection constrained to rectangle bounds
   * @param {Object} rectBounds - Rectangle bounds {left, top, right, bottom} in document coordinates
   * @returns {Selection|null} - Browser selection object or null
   */
  createRectangleConstrainedCharacterSelection(rectBounds) {
    try {
      const ownerDocument = this.characterStartTextNode.ownerDocument || document;
      const selection = this.getSelectionForDocument(ownerDocument);
      
      if (!selection) {
        return null;
      }

      // Clear existing selection
      selection.removeAllRanges();

      // Find the first and last character positions within the rectangle
      const { startPosition, endPosition } = this.findRectangleBoundaryPositions(rectBounds);
      
      if (!startPosition || !endPosition) {
        if (window.KEYPILOT_DEBUG) {
          console.log('[KeyPilot Debug] No valid start/end positions found in rectangle');
        }
        return selection;
      }

      // Create a single range from start to end position
      const range = ownerDocument.createRange();
      range.setStart(startPosition.textNode, startPosition.offset);
      range.setEnd(endPosition.textNode, endPosition.offset);

      selection.addRange(range);

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Rectangle character selection created:', {
          startText: startPosition.textNode.textContent?.substring(startPosition.offset, startPosition.offset + 10),
          endText: endPosition.textNode.textContent?.substring(Math.max(0, endPosition.offset - 10), endPosition.offset),
          selectedText: selection.toString().substring(0, 100)
        });
      }

      return selection;
    } catch (error) {
      console.error('[KeyPilot] Error creating rectangle-constrained character selection:', error);
      return null;
    }
  }

  /**
   * Find the first and last character positions within the rectangle bounds
   * @param {Object} rectBounds - Rectangle bounds in document coordinates
   * @returns {Object} - {startPosition, endPosition} with textNode and offset
   */
  findRectangleBoundaryPositions(rectBounds) {
    let startPosition = null;
    let endPosition = null;

    try {
      // Find all text nodes that intersect with the rectangle
      const intersectingTextNodes = this.findTextNodesInRectangle(rectBounds);
      
      if (intersectingTextNodes.length === 0) {
        return { startPosition: null, endPosition: null };
      }

      // Sort text nodes by document position
      intersectingTextNodes.sort((a, b) => {
        const comparison = a.compareDocumentPosition(b);
        if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
          return -1; // a comes before b
        } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
          return 1; // a comes after b
        }
        return 0;
      });

      // Find the first character in the rectangle (topmost, leftmost)
      for (const textNode of intersectingTextNodes) {
        const firstCharOffset = this.findFirstCharacterInRectangle(textNode, rectBounds);
        if (firstCharOffset !== -1) {
          startPosition = { textNode, offset: firstCharOffset };
          break;
        }
      }

      // Find the last character in the rectangle (bottommost, rightmost)
      for (let i = intersectingTextNodes.length - 1; i >= 0; i--) {
        const textNode = intersectingTextNodes[i];
        const lastCharOffset = this.findLastCharacterInRectangle(textNode, rectBounds);
        if (lastCharOffset !== -1) {
          endPosition = { textNode, offset: lastCharOffset };
          break;
        }
      }

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Rectangle boundary positions:', {
          intersectingNodes: intersectingTextNodes.length,
          startPosition: startPosition ? {
            text: startPosition.textNode.textContent?.substring(0, 30),
            offset: startPosition.offset
          } : null,
          endPosition: endPosition ? {
            text: endPosition.textNode.textContent?.substring(0, 30),
            offset: endPosition.offset
          } : null
        });
      }

      return { startPosition, endPosition };
    } catch (error) {
      console.error('[KeyPilot] Error finding rectangle boundary positions:', error);
      return { startPosition: null, endPosition: null };
    }
  }

  /**
   * Find the first character in a text node that falls within the rectangle
   * @param {Text} textNode - Text node to search
   * @param {Object} rectBounds - Rectangle bounds in document coordinates
   * @returns {number} - Character offset or -1 if none found
   */
  findFirstCharacterInRectangle(textNode, rectBounds) {
    const text = textNode.textContent;
    if (!text) return -1;

    for (let i = 0; i < text.length; i++) {
      if (this.isCharacterInRectangle(textNode, i, rectBounds)) {
        return i;
      }
    }
    return -1;
  }

  /**
   * Find the last character in a text node that falls within the rectangle
   * @param {Text} textNode - Text node to search
   * @param {Object} rectBounds - Rectangle bounds in document coordinates
   * @returns {number} - Character offset + 1 (for range end) or -1 if none found
   */
  findLastCharacterInRectangle(textNode, rectBounds) {
    const text = textNode.textContent;
    if (!text) return -1;

    for (let i = text.length - 1; i >= 0; i--) {
      if (this.isCharacterInRectangle(textNode, i, rectBounds)) {
        return i + 1; // Return offset + 1 for range end position
      }
    }
    return -1;
  }



  /**
   * Find text nodes that intersect with the rectangle
   * @param {Object} rectBounds - Rectangle bounds in document coordinates
   * @returns {Text[]} - Array of intersecting text nodes
   */
  findTextNodesInRectangle(rectBounds) {
    const textNodes = [];
    
    try {
      // Use TreeWalker to find all text nodes in the document
      const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // Skip empty text nodes
            if (!node.textContent || !node.textContent.trim()) {
              return NodeFilter.FILTER_REJECT;
            }
            
            // Check if text node intersects with rectangle
            if (this.textNodeIntersectsRectangle(node, rectBounds)) {
              return NodeFilter.FILTER_ACCEPT;
            }
            
            return NodeFilter.FILTER_REJECT;
          }
        }
      );

      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
    } catch (error) {
      console.warn('[KeyPilot] Error finding text nodes in rectangle:', error);
    }

    return textNodes;
  }

  /**
   * Check if a text node intersects with the rectangle
   * @param {Text} textNode - Text node to check
   * @param {Object} rectBounds - Rectangle bounds in document coordinates
   * @returns {boolean} - True if intersects
   */
  textNodeIntersectsRectangle(textNode, rectBounds) {
    try {
      const range = document.createRange();
      range.selectNodeContents(textNode);
      const rect = range.getBoundingClientRect();
      
      // Convert viewport coordinates to document coordinates
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      const nodeLeft = rect.left + scrollX;
      const nodeTop = rect.top + scrollY;
      const nodeRight = nodeLeft + rect.width;
      const nodeBottom = nodeTop + rect.height;
      
      // Check for intersection
      return !(nodeRight < rectBounds.left || 
               nodeLeft > rectBounds.right || 
               nodeBottom < rectBounds.top || 
               nodeTop > rectBounds.bottom);
    } catch (error) {
      console.warn('[KeyPilot] Error checking text node intersection:', error);
      return false;
    }
  }



  /**
   * Check if a character position is within rectangle bounds
   * @param {Text} textNode - Text node containing the character
   * @param {number} offset - Character offset within the text node
   * @param {Object} rectBounds - Rectangle bounds in document coordinates
   * @returns {boolean} - True if character is within bounds
   */
  isCharacterInRectangle(textNode, offset, rectBounds) {
    try {
      const range = document.createRange();
      range.setStart(textNode, offset);
      range.setEnd(textNode, Math.min(offset + 1, textNode.textContent.length));
      
      const rect = range.getBoundingClientRect();
      
      // Skip zero-size rectangles (like at end of text)
      if (rect.width === 0 && rect.height === 0) {
        return false;
      }
      
      // Convert viewport coordinates to document coordinates
      const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
      const scrollY = window.pageYOffset || document.documentElement.scrollTop;
      
      const charLeft = rect.left + scrollX;
      const charTop = rect.top + scrollY;
      const charRight = charLeft + rect.width;
      const charBottom = charTop + rect.height;
      
      // Check if character center is within rectangle bounds
      const charCenterX = charLeft + rect.width / 2;
      const charCenterY = charTop + rect.height / 2;
      
      return charCenterX >= rectBounds.left && 
             charCenterX <= rectBounds.right && 
             charCenterY >= rectBounds.top && 
             charCenterY <= rectBounds.bottom;
    } catch (error) {
      console.warn('[KeyPilot] Error checking character in rectangle:', error);
      return false;
    }
  }

  /**
   * Complete character selection and return the selected text
   * @returns {string|null} - Selected text or null if no selection
   */
  completeCharacterSelection() {
    if (!this.characterSelectionActive) {
      return null;
    }

    try {
      const selection = window.getSelection();
      const selectedText = selection ? selection.toString() : '';
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Character selection completed:', {
          selectedText: selectedText.substring(0, 100),
          length: selectedText.length
        });
      }

      return selectedText;
    } catch (error) {
      console.error('[KeyPilot] Error completing character selection:', error);
      return null;
    } finally {
      this.resetCharacterSelection();
    }
  }

  /**
   * Clear the current character selection without completing it
   */
  clearCharacterSelection() {
    try {
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
      this.clearHighlightSelectionOverlays();
      this.hideHighlightRectangleOverlay();
    } catch (error) {
      console.warn('[KeyPilot] Error clearing character selection:', error);
    }
  }

  /**
   * Reset character selection state
   */
  resetCharacterSelection() {
    this.characterSelectionActive = false;
    this.characterStartPosition = null;
    this.characterStartTextNode = null;
    this.characterStartOffset = 0;

    // Also reset rectangle state since character selection uses rectangle overlay
    this.resetRectangleSelection();

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Character selection state reset');
    }
  }

  /**
   * Compare the document positions of two text nodes
   * @param {Text} node1 - First text node
   * @param {Text} node2 - Second text node
   * @returns {number} - Negative if node1 comes before node2, positive if after, 0 if same
   */
  compareTextNodePositions(node1, node2) {
    if (node1 === node2) {
      return 0;
    }

    try {
      const comparison = node1.compareDocumentPosition(node2);
      
      if (comparison & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1; // node1 comes before node2
      } else if (comparison & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1; // node1 comes after node2
      } else {
        return 0; // Same position (shouldn't happen)
      }
    } catch (error) {
      console.warn('[KeyPilot] Error comparing text node positions:', error);
      return 0;
    }
  }

  /**
   * Get selection object for the given document context
   * @param {Document} ownerDocument - Document context
   * @returns {Selection|null} - Selection object or null
   */
  getSelectionForDocument(ownerDocument) {
    try {
      if (ownerDocument && ownerDocument.getSelection) {
        return ownerDocument.getSelection();
      }
      return window.getSelection();
    } catch (error) {
      console.warn('[KeyPilot] Error getting selection for document:', error);
      return window.getSelection();
    }
  }

  /**
   * Reset rectangle selection state
   */
  resetRectangleSelection() {
    this.rectOriginPoint = null;
    this.rectOriginDocumentPoint = null;
    this.debugUpdateCount = 0;

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Rectangle selection state reset');
    }

    // Hide debug HUD when selection ends
    this.hideDebugHUD();
  }

  /**
   * Toggle debug HUD feature flag
   */
  toggleDebugHUD(enabled) {
    // Temporarily override the feature flag
    FEATURE_FLAGS.DEBUG_RECTANGLE_HUD = enabled;

    if (!enabled) {
      this.hideDebugHUD();
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Debug HUD toggled:', enabled);
    }
  }



  /**
   * Create or show the debug HUD for rectangle selection
   */
  showDebugHUD() {
    // Enable debug HUD if KEYPILOT_DEBUG is true or feature flag is enabled
    if (!FEATURE_FLAGS.DEBUG_RECTANGLE_HUD && !window.KEYPILOT_DEBUG) {
      return;
    }

    if (this.debugHUD) {
      this.debugHUD.style.display = 'block';
      return;
    }

    this.debugHUD = this.createElement('div', {
      className: 'kpv2-rectangle-debug-hud',
      style: `
        position: fixed;
        top: 10px;
        left: 10px;
        background: rgba(0, 0, 0, 0.9);
        color: #00ff00;
        font-family: 'Courier New', monospace;
        font-size: 12px;
        padding: 15px;
        border-radius: 8px;
        z-index: ${Z_INDEX.MESSAGE_BOX + 1};
        pointer-events: none;
        white-space: pre-line;
        min-width: 400px;
        max-width: 500px;
        border: 2px solid #00ff00;
        box-shadow: 0 0 10px rgba(0, 255, 0, 0.3);
      `
    });

    document.body.appendChild(this.debugHUD);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Debug HUD created and shown');
    }
  }

  /**
   * Hide the debug HUD
   */
  hideDebugHUD() {
    if (this.debugHUD) {
      this.debugHUD.style.display = 'none';

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Debug HUD hidden');
      }
    }
  }

  /**
   * Update the debug HUD with current rectangle information
   */
  updateDebugHUD(rectOriginPoint, currentPosition, rectOriginDocumentPoint, currentDocumentPosition, calculatedValues) {
    if ((!FEATURE_FLAGS.DEBUG_RECTANGLE_HUD && !window.KEYPILOT_DEBUG) || !this.debugHUD) {
      return;
    }

    this.debugUpdateCount++;

    const timestamp = new Date().toLocaleTimeString();
    const pageInfo = {
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight
    };

    const debugInfo = `🎯 RECTANGLE DEBUG HUD - Update #${this.debugUpdateCount}
⏰ Time: ${timestamp}

📍 VIEWPORT COORDINATES:
  Origin: (${rectOriginPoint?.x || 'null'}, ${rectOriginPoint?.y || 'null'})
  Current: (${currentPosition?.x || 'null'}, ${currentPosition?.y || 'null'})
  Delta: (${currentPosition && rectOriginPoint ? currentPosition.x - rectOriginPoint.x : 'null'}, ${currentPosition && rectOriginPoint ? currentPosition.y - rectOriginPoint.y : 'null'})

📄 DOCUMENT COORDINATES:
  Origin: (${rectOriginDocumentPoint?.x || 'null'}, ${rectOriginDocumentPoint?.y || 'null'})
  Current: (${currentDocumentPosition?.x || 'null'}, ${currentDocumentPosition?.y || 'null'})
  Delta: (${currentDocumentPosition && rectOriginDocumentPoint ? currentDocumentPosition.x - rectOriginDocumentPoint.x : 'null'}, ${currentDocumentPosition && rectOriginDocumentPoint ? currentDocumentPosition.y - rectOriginDocumentPoint.y : 'null'})

📏 CALCULATED RECTANGLE:
  Document Left: ${calculatedValues?.documentLeft || 'null'}
  Document Top: ${calculatedValues?.documentTop || 'null'}
  Width: ${calculatedValues?.width || 'null'}
  Height: ${calculatedValues?.height || 'null'}
  Viewport Left: ${calculatedValues?.viewportLeft || 'null'}
  Viewport Top: ${calculatedValues?.viewportTop || 'null'}
  Quadrant: ${calculatedValues?.quadrant || 'null'}

🌐 PAGE CONTEXT:
  Scroll: (${pageInfo.scrollX}, ${pageInfo.scrollY})
  Viewport: ${pageInfo.innerWidth} × ${pageInfo.innerHeight}
  Document: ${pageInfo.documentWidth} × ${pageInfo.documentHeight}

📐 RECTANGLE INFO:
  Area: ${(calculatedValues?.width * calculatedValues?.height) || 0}px²
  Min Width: ${RECTANGLE_SELECTION.MIN_WIDTH}px
  Min Height: ${RECTANGLE_SELECTION.MIN_HEIGHT}px
  Min Drag: ${RECTANGLE_SELECTION.MIN_DRAG_DISTANCE}px

🔧 OVERLAY CALLS:
  Position: left=${calculatedValues?.viewportLeft}px, top=${calculatedValues?.viewportTop}px
  Size: width=${calculatedValues?.width}px, height=${calculatedValues?.height}px
  Drag Distance: ${Math.sqrt((currentDocumentPosition?.x - rectOriginDocumentPoint?.x) ** 2 + (currentDocumentPosition?.y - rectOriginDocumentPoint?.y) ** 2).toFixed(1)}px
  Should Show: ${this.shouldShowRectangle(calculatedValues?.width, calculatedValues?.height, currentDocumentPosition?.x - rectOriginDocumentPoint?.x, currentDocumentPosition?.y - rectOriginDocumentPoint?.y)}
  Display: ${this.shouldShowRectangle(calculatedValues?.width, calculatedValues?.height, currentDocumentPosition?.x - rectOriginDocumentPoint?.x, currentDocumentPosition?.y - rectOriginDocumentPoint?.y) ? 'block' : 'none'}
  Visibility: ${this.shouldShowRectangle(calculatedValues?.width, calculatedValues?.height, currentDocumentPosition?.x - rectOriginDocumentPoint?.x, currentDocumentPosition?.y - rectOriginDocumentPoint?.y) ? 'visible' : 'hidden'}`;

    this.debugHUD.textContent = debugInfo;
  }

  /**
   * Update selection overlays to highlight the actual selected text regions with shadow DOM support
   * @param {Selection} selection - Browser Selection object
   */
  updateHighlightSelectionOverlays(selection) {
    // Clear existing selection overlays
    this.clearHighlightSelectionOverlays();

    if (!selection || selection.rangeCount === 0) {
      return;
    }

    try {
      // Create overlays for each range in the selection
      for (let i = 0; i < selection.rangeCount; i++) {
        const range = selection.getRangeAt(i);
        this.createSelectionOverlaysForRangeWithShadowSupport(range);
      }

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Updated highlight selection overlays with shadow DOM support:', {
          rangeCount: selection.rangeCount,
          overlayCount: this.highlightSelectionOverlays.length,
          selectedText: selection.toString().substring(0, 50)
        });
      }
    } catch (error) {
      console.warn('[KeyPilot] Error updating highlight selection overlays with shadow DOM support:', error);
      this.clearHighlightSelectionOverlays();
    }
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
          className: 'kpv2-highlight-selection-overlay',
          style: `
            position: fixed;
            left: ${rect.left}px;
            top: ${rect.top}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            background: ${COLORS.HIGHLIGHT_SELECTION_BG};
            border: 1px solid ${COLORS.HIGHLIGHT_BLUE};
            pointer-events: none;
            z-index: ${Z_INDEX.OVERLAYS - 1};
            will-change: transform;
            opacity: 0.7;
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
   * Create highlight selection overlay for a range (legacy method for compatibility)
   */
  createHighlightSelectionOverlay(range) {
    // Delegate to the shadow DOM-aware method
    this.createSelectionOverlaysForRangeWithShadowSupport(range);
  }

  /**
   * Clear all highlight selection overlays
   */
  clearHighlightSelectionOverlays() {
    this.highlightSelectionOverlays.forEach(overlay => {
      if (this.overlayObserver) {
        this.overlayObserver.unobserve(overlay);
      }
      overlay.remove();
    });
    this.highlightSelectionOverlays = [];

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Cleared highlight selection overlays');
    }
  }

  /**
   * Show highlight mode indicator
   */
  showHighlightModeIndicator() {
    if (this.highlightModeIndicator) {
      return; // Already showing
    }

    const modeText = this.selectionMode === 'character' 
      ? 'CHARACTER SELECTION - Press H to copy' 
      : 'RECTANGLE SELECTION - Press H to copy';

    this.highlightModeIndicator = this.createElement('div', {
      className: 'kpv2-highlight-mode-indicator',
      style: `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${COLORS.HIGHLIGHT_BLUE};
        color: white;
        padding: 8px 12px;
        font-size: 14px;
        font-weight: bold;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        border-radius: 4px;
        box-shadow: 0 2px 8px ${COLORS.HIGHLIGHT_SHADOW};
        z-index: ${Z_INDEX.MESSAGE_BOX};
        pointer-events: none;
        will-change: transform, opacity;
        animation: kpv2-pulse 1.5s ease-in-out infinite;
      `
    });

    this.highlightModeIndicator.textContent = modeText;
    document.body.appendChild(this.highlightModeIndicator);

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] Highlight mode indicator shown:', modeText);
    }
  }

  /**
   * Hide highlight mode indicator
   */
  hideHighlightModeIndicator() {
    if (this.highlightModeIndicator) {
      this.highlightModeIndicator.remove();
      this.highlightModeIndicator = null;

      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot Debug] Highlight mode indicator hidden');
      }
    }
  }

  /**
   * Set overlay visibility
   */
  setOverlayVisibility(overlayType, isVisible) {
    if (overlayType === 'highlight' && this.highlightOverlay) {
      this.overlayVisibility.highlight = isVisible;
      this.highlightOverlay.style.visibility = isVisible ? 'visible' : 'hidden';
    } else if (overlayType === 'highlightRectangle' && this.highlightRectangleOverlay) {
      this.overlayVisibility.highlightRectangle = isVisible;
      this.highlightRectangleOverlay.style.visibility = isVisible ? 'visible' : 'hidden';
    }
  }

  /**
   * Clean up all highlight overlays and resources
   */
  cleanup() {
    // Clean up highlight overlays
    if (this.highlightOverlay) {
      this.highlightOverlay.remove();
      this.highlightOverlay = null;
    }
    if (this.highlightRectangleOverlay) {
      this.highlightRectangleOverlay.remove();
      this.highlightRectangleOverlay = null;
    }

    // Clear highlight selection overlays
    this.clearHighlightSelectionOverlays();

    if (this.highlightModeIndicator) {
      this.highlightModeIndicator.remove();
      this.highlightModeIndicator = null;
    }

    // Clean up debug HUD
    if (this.debugHUD) {
      this.debugHUD.remove();
      this.debugHUD = null;
    }

    // Reset selection states
    this.resetCharacterSelection();
    this.resetRectangleSelection();

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot Debug] HighlightManager cleanup completed');
    }
  }
}