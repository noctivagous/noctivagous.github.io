/**
 * EdgeCharacterDetector - Detects characters at the precise boundary level when elements intersect
 * 
 * This class provides character-level precision for rectangle selection by using the Range API
 * to calculate exact character positions and determine which characters intersect with rectangle boundaries.
 */

import { EDGE_ONLY_SELECTION, FEATURE_FLAGS } from '../config/constants.js';

export class EdgeCharacterDetector {
  constructor() {
    // Get configuration from constants
    const config = EDGE_ONLY_SELECTION.CHARACTER_DETECTION;
    
    this.enabled = config.ENABLED;
    this.useRangeAPI = config.USE_RANGE_API;
    this.cacheCharacterPositions = config.CACHE_CHARACTER_POSITIONS;
    this.characterCacheSize = config.CHARACTER_CACHE_SIZE;
    this.boundaryDetectionPrecision = config.BOUNDARY_DETECTION_PRECISION;
    this.batchCharacterProcessing = config.BATCH_CHARACTER_PROCESSING;
    this.characterBatchSize = config.CHARACTER_BATCH_SIZE;
    this.maxCharactersPerElement = config.MAX_CHARACTERS_PER_ELEMENT;
    
    // WeakMap cache for character positions to avoid recalculation
    this.characterCache = new WeakMap();
    
    // Performance tracking
    this.stats = {
      charactersDetected: 0,
      cacheHits: 0,
      cacheMisses: 0,
      processingTime: 0,
      elementsProcessed: 0
    };
  }

  /**
   * Detect characters at the boundary level when an element intersects with a rectangle
   * @param {Element} element - The element to detect characters in
   * @param {Object} rectangle - The rectangle bounds {left, top, right, bottom}
   * @returns {Array<Object>} Array of character objects that intersect with the rectangle
   */
  detectAtBoundary(element, rectangle) {
    if (!FEATURE_FLAGS.ENABLE_EDGE_CHARACTER_DETECTOR || !this.enabled) {
      return [];
    }

    const startTime = performance.now();
    let characterPositions = [];

    try {
      // Get cached character positions or calculate them
      if (this.cacheCharacterPositions) {
        characterPositions = this.characterCache.get(element);
        if (characterPositions) {
          this.stats.cacheHits++;
        } else {
          this.stats.cacheMisses++;
          characterPositions = this.calculateCharacterPositions(element);
          this.characterCache.set(element, characterPositions);
        }
      } else {
        characterPositions = this.calculateCharacterPositions(element);
      }

      // Find characters that intersect with rectangle boundaries
      const intersectingCharacters = this.findIntersectingCharacters(characterPositions, rectangle);
      
      // Update statistics
      const processingTime = performance.now() - startTime;
      this.stats.charactersDetected += intersectingCharacters.length;
      this.stats.processingTime += processingTime;
      this.stats.elementsProcessed++;

      return intersectingCharacters;
    } catch (error) {
      console.warn('[EdgeCharacterDetector] Error detecting characters at boundary:', error);
      return [];
    }
  }

  /**
   * Calculate character positions for all text nodes within an element
   * @param {Element} element - The element to calculate character positions for
   * @returns {Array<Object>} Array of character position objects
   */
  calculateCharacterPositions(element) {
    const characters = [];
    const textNodes = this.getTextNodes(element);
    
    for (const textNode of textNodes) {
      const nodeCharacters = this.calculateTextNodeCharacterPositions(textNode);
      characters.push(...nodeCharacters);
      
      // Respect maximum characters per element limit
      if (characters.length >= this.maxCharactersPerElement) {
        break;
      }
    }
    
    return characters.slice(0, this.maxCharactersPerElement);
  }

  /**
   * Calculate character positions for a specific text node
   * @param {Text} textNode - The text node to process
   * @returns {Array<Object>} Array of character position objects
   */
  calculateTextNodeCharacterPositions(textNode) {
    const characters = [];
    const text = textNode.textContent;
    
    if (!text || text.length === 0) {
      return characters;
    }

    if (this.batchCharacterProcessing) {
      return this.calculateCharacterPositionsBatched(textNode, text);
    } else {
      return this.calculateCharacterPositionsSequential(textNode, text);
    }
  }

  /**
   * Calculate character positions using batched processing
   * @param {Text} textNode - The text node to process
   * @param {string} text - The text content
   * @returns {Array<Object>} Array of character position objects
   */
  calculateCharacterPositionsBatched(textNode, text) {
    const characters = [];
    const batchSize = this.characterBatchSize;
    
    for (let i = 0; i < text.length; i += batchSize) {
      const endIndex = Math.min(i + batchSize, text.length);
      const batchCharacters = this.calculateCharacterBatch(textNode, text, i, endIndex);
      characters.push(...batchCharacters);
    }
    
    return characters;
  }

  /**
   * Calculate character positions for a batch of characters
   * @param {Text} textNode - The text node to process
   * @param {string} text - The text content
   * @param {number} startIndex - Start index of the batch
   * @param {number} endIndex - End index of the batch
   * @returns {Array<Object>} Array of character position objects
   */
  calculateCharacterBatch(textNode, text, startIndex, endIndex) {
    const characters = [];
    
    for (let i = startIndex; i < endIndex; i++) {
      const char = text[i];
      
      // Skip whitespace characters that don't contribute to selection
      if (char.trim().length === 0) {
        continue;
      }
      
      try {
        const characterData = this.calculateSingleCharacterPosition(textNode, i, char);
        if (characterData) {
          characters.push(characterData);
        }
      } catch (error) {
        // Skip characters that can't be positioned
        continue;
      }
    }
    
    return characters;
  }

  /**
   * Calculate character positions using sequential processing
   * @param {Text} textNode - The text node to process
   * @param {string} text - The text content
   * @returns {Array<Object>} Array of character position objects
   */
  calculateCharacterPositionsSequential(textNode, text) {
    const characters = [];
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      
      // Skip whitespace characters that don't contribute to selection
      if (char.trim().length === 0) {
        continue;
      }
      
      try {
        const characterData = this.calculateSingleCharacterPosition(textNode, i, char);
        if (characterData) {
          characters.push(characterData);
        }
      } catch (error) {
        // Skip characters that can't be positioned
        continue;
      }
    }
    
    return characters;
  }

  /**
   * Calculate position for a single character using Range API
   * @param {Text} textNode - The text node containing the character
   * @param {number} index - Index of the character within the text node
   * @param {string} char - The character
   * @returns {Object|null} Character position object or null if positioning fails
   */
  calculateSingleCharacterPosition(textNode, index, char) {
    if (!this.useRangeAPI) {
      return null;
    }

    try {
      const range = document.createRange();
      range.setStart(textNode, index);
      range.setEnd(textNode, index + 1);
      
      const rect = range.getBoundingClientRect();
      
      // Only include characters with valid dimensions
      if (rect.width > 0 && rect.height > 0) {
        return {
          char: char,
          node: textNode,
          index: index,
          rect: {
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            width: rect.width,
            height: rect.height
          },
          range: range.cloneRange()
        };
      }
    } catch (error) {
      // Range creation failed, skip this character
    }
    
    return null;
  }

  /**
   * Find characters that intersect with the given rectangle
   * @param {Array<Object>} characterPositions - Array of character position objects
   * @param {Object} rectangle - The rectangle bounds {left, top, right, bottom}
   * @returns {Array<Object>} Array of intersecting character objects
   */
  findIntersectingCharacters(characterPositions, rectangle) {
    const intersectingCharacters = [];
    
    for (const character of characterPositions) {
      if (this.isCharacterInRectangle(character, rectangle)) {
        intersectingCharacters.push(character);
      }
    }
    
    return intersectingCharacters;
  }

  /**
   * Check if a character intersects with a rectangle
   * @param {Object} character - Character position object
   * @param {Object} rectangle - Rectangle bounds {left, top, right, bottom}
   * @returns {boolean} True if the character intersects with the rectangle
   */
  isCharacterInRectangle(character, rectangle) {
    const charRect = character.rect;
    const precision = this.boundaryDetectionPrecision;
    
    // Check for intersection with precision tolerance
    return !(
      charRect.right < rectangle.left - precision ||
      charRect.left > rectangle.right + precision ||
      charRect.bottom < rectangle.top - precision ||
      charRect.top > rectangle.bottom + precision
    );
  }

  /**
   * Get all text nodes within an element
   * @param {Element} element - The element to search for text nodes
   * @returns {Array<Text>} Array of text nodes
   */
  getTextNodes(element) {
    const textNodes = [];
    
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // Only include text nodes with meaningful content
          return node.textContent && node.textContent.trim().length > 0
            ? NodeFilter.FILTER_ACCEPT 
            : NodeFilter.FILTER_REJECT;
        }
      }
    );
    
    let node;
    while (node = walker.nextNode()) {
      textNodes.push(node);
    }
    
    return textNodes;
  }

  /**
   * Clear the character position cache
   */
  clearCache() {
    this.characterCache = new WeakMap();
  }

  /**
   * Get performance statistics
   * @returns {Object} Performance statistics
   */
  getStats() {
    const totalCacheAccess = this.stats.cacheHits + this.stats.cacheMisses;
    const cacheHitRate = totalCacheAccess > 0 
      ? ((this.stats.cacheHits / totalCacheAccess) * 100).toFixed(1)
      : 0;
    
    return {
      charactersDetected: this.stats.charactersDetected,
      cacheHits: this.stats.cacheHits,
      cacheMisses: this.stats.cacheMisses,
      cacheHitRate: `${cacheHitRate}%`,
      averageProcessingTime: this.stats.processingTime / Math.max(1, this.stats.elementsProcessed),
      totalProcessingTime: this.stats.processingTime,
      elementsProcessed: this.stats.elementsProcessed
    };
  }

  /**
   * Reset performance statistics
   */
  resetStats() {
    this.stats = {
      charactersDetected: 0,
      cacheHits: 0,
      cacheMisses: 0,
      processingTime: 0,
      elementsProcessed: 0
    };
  }

  /**
   * Update configuration from constants (useful for runtime configuration changes)
   */
  updateConfiguration() {
    const config = EDGE_ONLY_SELECTION.CHARACTER_DETECTION;
    
    this.enabled = config.ENABLED;
    this.useRangeAPI = config.USE_RANGE_API;
    this.cacheCharacterPositions = config.CACHE_CHARACTER_POSITIONS;
    this.characterCacheSize = config.CHARACTER_CACHE_SIZE;
    this.boundaryDetectionPrecision = config.BOUNDARY_DETECTION_PRECISION;
    this.batchCharacterProcessing = config.BATCH_CHARACTER_PROCESSING;
    this.characterBatchSize = config.CHARACTER_BATCH_SIZE;
    this.maxCharactersPerElement = config.MAX_CHARACTERS_PER_ELEMENT;
  }

  /**
   * Create a selection range from intersecting characters
   * @param {Array<Object>} characters - Array of character objects
   * @returns {Range|null} DOM Range covering the characters, or null if no characters
   */
  createSelectionRange(characters) {
    if (!characters || characters.length === 0) {
      return null;
    }

    try {
      // Sort characters by their position in the document
      const sortedCharacters = this.sortCharactersByDocumentOrder(characters);
      
      const firstChar = sortedCharacters[0];
      const lastChar = sortedCharacters[sortedCharacters.length - 1];
      
      const range = document.createRange();
      range.setStart(firstChar.node, firstChar.index);
      range.setEnd(lastChar.node, lastChar.index + 1);
      
      return range;
    } catch (error) {
      console.warn('[EdgeCharacterDetector] Error creating selection range:', error);
      return null;
    }
  }

  /**
   * Sort characters by their position in the document
   * @param {Array<Object>} characters - Array of character objects
   * @returns {Array<Object>} Sorted array of character objects
   */
  sortCharactersByDocumentOrder(characters) {
    return characters.sort((a, b) => {
      // Compare by node position first
      const nodeComparison = a.node.compareDocumentPosition(b.node);
      
      if (nodeComparison & Node.DOCUMENT_POSITION_FOLLOWING) {
        return -1; // a comes before b
      } else if (nodeComparison & Node.DOCUMENT_POSITION_PRECEDING) {
        return 1; // a comes after b
      } else {
        // Same node, compare by index
        return a.index - b.index;
      }
    });
  }

  /**
   * Get character count for an element (useful for performance estimation)
   * @param {Element} element - The element to count characters in
   * @returns {number} Approximate character count
   */
  getCharacterCount(element) {
    const textNodes = this.getTextNodes(element);
    let totalCharacters = 0;
    
    for (const textNode of textNodes) {
      totalCharacters += textNode.textContent.trim().length;
    }
    
    return Math.min(totalCharacters, this.maxCharactersPerElement);
  }
}