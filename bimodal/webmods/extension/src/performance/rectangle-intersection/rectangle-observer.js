/**
 * Core Rectangle Intersection Observer
 * Handles the main intersection observation logic
 */
import { EDGE_ONLY_SELECTION, FEATURE_FLAGS } from '../../config/index.js';

export class RectangleObserver {
  constructor() {
    // Main intersection observer for text elements
    this.textObserver = null;
    
    // Dynamic root element that represents the selection rectangle
    this.rectangleRoot = null;
    
    // Set of text elements currently intersecting the rectangle
    this.intersectingTextElements = new Set();
    
    // Set of text nodes found within intersecting elements
    this.intersectingTextNodes = new Set();
    
    // Callback for when intersection changes
    this.onIntersectionChange = null;
    
    // Current rectangle bounds
    this.currentRectangle = null;
    
    // Observer configuration
    this.observerConfig = {
      root: null, // Will be set to rectangleRoot
      rootMargin: '0px',
      threshold: EDGE_ONLY_SELECTION.INTERSECTION_OBSERVER_THRESHOLDS
    };
  }

  /**
   * Initialize the rectangle observer with a callback
   * @param {Function} callback - Called when intersection changes
   */
  initialize(callback) {
    this.onIntersectionChange = callback;
    this.createRectangleRoot();
    this.setupTextObserver();
    this.startObservingPageElements();
  }

  /**
   * Create the dynamic rectangle root element
   */
  createRectangleRoot() {
    if (this.rectangleRoot) {
      this.rectangleRoot.remove();
    }

    this.rectangleRoot = document.createElement('div');
    this.rectangleRoot.id = 'kpv2-rectangle-root';
    this.rectangleRoot.style.cssText = `
      position: absolute;
      pointer-events: none;
      z-index: -1;
      opacity: 0;
      left: 0;
      top: 0;
      width: 0;
      height: 0;
    `;
    
    document.body.appendChild(this.rectangleRoot);
  }

  /**
   * Setup the intersection observer for text elements
   */
  setupTextObserver() {
    if (this.textObserver) {
      this.textObserver.disconnect();
    }

    this.observerConfig.root = this.rectangleRoot;
    
    this.textObserver = new IntersectionObserver((entries) => {
      this.handleIntersectionEntries(entries);
    }, this.observerConfig);
  }

  /**
   * Handle intersection observer entries
   * @param {IntersectionObserverEntry[]} entries
   */
  handleIntersectionEntries(entries) {
    let hasChanges = false;

    for (const entry of entries) {
      const element = entry.target;
      
      if (entry.isIntersecting) {
        if (!this.intersectingTextElements.has(element)) {
          this.intersectingTextElements.add(element);
          this.addTextNodesFromElement(element);
          hasChanges = true;
        }
      } else {
        if (this.intersectingTextElements.has(element)) {
          this.intersectingTextElements.delete(element);
          this.removeTextNodesFromElement(element);
          hasChanges = true;
        }
      }
    }

    if (hasChanges && this.onIntersectionChange) {
      this.onIntersectionChange({
        intersectingElements: Array.from(this.intersectingTextElements),
        intersectingTextNodes: Array.from(this.intersectingTextNodes)
      });
    }
  }

  /**
   * Add text nodes from an element to the intersecting set
   * @param {Element} element
   */
  addTextNodesFromElement(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return node.textContent.trim().length > 0 ? 
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_REJECT;
        }
      }
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      this.intersectingTextNodes.add(textNode);
    }
  }

  /**
   * Remove text nodes from an element from the intersecting set
   * @param {Element} element
   */
  removeTextNodesFromElement(element) {
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          return this.intersectingTextNodes.has(node) ? 
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_REJECT;
        }
      }
    );

    let textNode;
    while (textNode = walker.nextNode()) {
      this.intersectingTextNodes.delete(textNode);
    }
  }

  /**
   * Update the rectangle bounds
   * @param {Object} rectangle - {left, top, width, height}
   */
  updateRectangle(rectangle) {
    if (!this.rectangleRoot) return;

    this.currentRectangle = rectangle;
    
    // Update rectangle root position and size
    this.rectangleRoot.style.left = rectangle.left + 'px';
    this.rectangleRoot.style.top = rectangle.top + 'px';
    this.rectangleRoot.style.width = rectangle.width + 'px';
    this.rectangleRoot.style.height = rectangle.height + 'px';
  }

  /**
   * Observe an element for intersection
   * @param {Element} element
   */
  observeElement(element) {
    if (this.textObserver && element) {
      this.textObserver.observe(element);
    }
  }

  /**
   * Unobserve an element
   * @param {Element} element
   */
  unobserveElement(element) {
    if (this.textObserver && element) {
      this.textObserver.unobserve(element);
    }
  }

  /**
   * Start observing all text-containing elements on the page
   */
  startObservingPageElements() {
    const textElements = this.findTextElements();
    textElements.forEach(element => {
      this.observeElement(element);
    });
  }

  /**
   * Find all elements on the page that contain meaningful text
   * @returns {Element[]} Array of elements with text content
   */
  findTextElements() {
    const textElements = [];
    const allElements = document.querySelectorAll('*');
    
    for (const element of allElements) {
      if (this.hasTextContent(element)) {
        textElements.push(element);
      }
    }
    
    return textElements;
  }

  /**
   * Check if an element has meaningful text content
   * @param {Element} element - Element to check
   * @returns {boolean} True if element has meaningful text
   */
  hasTextContent(element) {
    // Skip script, style, and other non-visible elements
    const skipTags = new Set(['SCRIPT', 'STYLE', 'META', 'LINK', 'HEAD', 'TITLE']);
    if (skipTags.has(element.tagName)) {
      return false;
    }
    
    // Skip hidden elements
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.display === 'none' || 
        computedStyle.visibility === 'hidden' || 
        computedStyle.opacity === '0') {
      return false;
    }
    
    // Check for direct text content (not from child elements)
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Only accept text nodes that are direct children
          return node.parentNode === element && 
                 node.textContent.trim().length > 0 ?
            NodeFilter.FILTER_ACCEPT : 
            NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    return walker.nextNode() !== null;
  }

  /**
   * Get current intersection data
   * @returns {Object}
   */
  getIntersectionData() {
    return {
      intersectingElements: Array.from(this.intersectingTextElements),
      intersectingTextNodes: Array.from(this.intersectingTextNodes),
      rectangle: this.currentRectangle
    };
  }

  /**
   * Cleanup and disconnect observer
   */
  cleanup() {
    if (this.textObserver) {
      this.textObserver.disconnect();
      this.textObserver = null;
    }

    if (this.rectangleRoot) {
      this.rectangleRoot.remove();
      this.rectangleRoot = null;
    }

    this.intersectingTextElements.clear();
    this.intersectingTextNodes.clear();
    this.onIntersectionChange = null;
  }
}
