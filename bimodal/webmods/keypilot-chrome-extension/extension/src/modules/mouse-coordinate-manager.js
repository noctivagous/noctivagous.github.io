/**
 * Mouse coordinate storage and management
 * Stores mouse coordinates in Chrome storage when links are clicked
 * and retrieves them for cursor positioning on page load
 */
export class MouseCoordinateManager {
  constructor() {
    this.storageKey = 'keypilot_last_mouse_coordinates';
    this.lastStoredCoordinates = null;
    this.isMonitoringInactive = false;
    this.inactiveMouseHandler = null;
    this.beforeUnloadHandler = null;
    this.currentMousePosition = { x: 0, y: 0 };
    
    // Initialize by loading any existing coordinates
    this.loadStoredCoordinates();
    
    // Set up beforeunload listener to store coordinates when leaving page
    this.setupBeforeUnloadListener();
  }

  /**
   * Store mouse coordinates to Chrome storage
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   * @param {string} url - Current page URL for context
   */
  async storeCoordinates(x, y, url = window.location.href) {
    const coordinates = {
      x: x,
      y: y,
      url: url,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      }
    };

    try {
      // Store in Chrome storage (sync if available, local as fallback)
      if (chrome?.storage?.sync) {
        await chrome.storage.sync.set({ [this.storageKey]: coordinates });
      } else if (chrome?.storage?.local) {
        await chrome.storage.local.set({ [this.storageKey]: coordinates });
      } else {
        // Fallback to localStorage if Chrome storage not available
        localStorage.setItem(this.storageKey, JSON.stringify(coordinates));
      }

      this.lastStoredCoordinates = coordinates;
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Mouse coordinates stored:', coordinates);
      }
    } catch (error) {
      console.warn('[KeyPilot] Failed to store mouse coordinates:', error);
    }
  }

  /**
   * Load stored mouse coordinates from Chrome storage
   * @returns {Promise<Object|null>} Stored coordinates or null if none found
   */
  async loadStoredCoordinates() {
    try {
      let result = null;

      // Try Chrome storage first (sync, then local)
      if (chrome?.storage?.sync) {
        const syncResult = await chrome.storage.sync.get([this.storageKey]);
        result = syncResult[this.storageKey];
      }
      
      if (!result && chrome?.storage?.local) {
        const localResult = await chrome.storage.local.get([this.storageKey]);
        result = localResult[this.storageKey];
      }
      
      // Fallback to localStorage
      if (!result) {
        const localStorageData = localStorage.getItem(this.storageKey);
        if (localStorageData) {
          result = JSON.parse(localStorageData);
        }
      }

      this.lastStoredCoordinates = result;
      
      if (window.KEYPILOT_DEBUG && result) {
        console.log('[KeyPilot] Loaded stored mouse coordinates:', result);
      }

      return result;
    } catch (error) {
      console.warn('[KeyPilot] Failed to load stored mouse coordinates:', error);
      return null;
    }
  }

  /**
   * Get the best cursor position for initialization
   * Uses stored coordinates if available, otherwise falls back to upper left with margin
   * @returns {Object} Object with x, y coordinates
   */
  getInitialCursorPosition() {
    // If we have stored coordinates, use them (with viewport validation)
    if (this.lastStoredCoordinates) {
      const stored = this.lastStoredCoordinates;
      
      // Validate coordinates are within current viewport
      const x = Math.min(stored.x, window.innerWidth - 20);
      const y = Math.min(stored.y, window.innerHeight - 20);
      
      // Ensure coordinates are not negative
      const validX = Math.max(10, x);
      const validY = Math.max(10, y);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Using stored coordinates for cursor position:', {
          original: { x: stored.x, y: stored.y },
          adjusted: { x: validX, y: validY }
        });
      }
      
      return { x: validX, y: validY };
    }

    // Fallback: upper left corner with 10pt margin
    const fallbackX = 10;
    const fallbackY = 10;
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot] No stored coordinates, using fallback position:', {
        x: fallbackX, 
        y: fallbackY
      });
    }
    
    return { x: fallbackX, y: fallbackY };
  }

  /**
   * Update current mouse position for beforeunload storage
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  updateCurrentMousePosition(x, y) {
    this.currentMousePosition.x = x;
    this.currentMousePosition.y = y;
  }

  /**
   * Set up beforeunload listener to store coordinates when leaving page
   */
  setupBeforeUnloadListener() {
    this.beforeUnloadHandler = () => {
      // Store current mouse position when leaving the page
      if (this.currentMousePosition.x !== 0 || this.currentMousePosition.y !== 0) {
        // Use synchronous storage for beforeunload to ensure it completes
        this.storeCoordinatesSync(this.currentMousePosition.x, this.currentMousePosition.y);
        
        if (window.KEYPILOT_DEBUG) {
          console.log('[KeyPilot] Page unloading, stored coordinates:', this.currentMousePosition);
        }
      }
    };

    window.addEventListener('beforeunload', this.beforeUnloadHandler);
    
    // Also listen for pagehide as a more reliable alternative
    window.addEventListener('pagehide', this.beforeUnloadHandler);
    
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot] Set up beforeunload coordinate storage');
    }
  }

  /**
   * Synchronous coordinate storage for beforeunload events
   * @param {number} x - X coordinate
   * @param {number} y - Y coordinate
   */
  storeCoordinatesSync(x, y) {
    const coordinates = {
      x: x,
      y: y,
      url: window.location.href,
      timestamp: Date.now(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      storedOnUnload: true
    };

    try {
      // Use localStorage for synchronous storage during beforeunload
      localStorage.setItem(this.storageKey, JSON.stringify(coordinates));
      this.lastStoredCoordinates = coordinates;
      
      // Also try Chrome storage but don't wait for it
      if (chrome?.storage?.local) {
        chrome.storage.local.set({ [this.storageKey]: coordinates }).catch(() => {
          // Ignore errors during beforeunload
        });
      }
    } catch (error) {
      // Ignore storage errors during beforeunload
      if (window.KEYPILOT_DEBUG) {
        console.warn('[KeyPilot] Failed to store coordinates on beforeunload:', error);
      }
    }
  }

  /**
   * Handle link click event to store coordinates (legacy method, now optional)
   * @param {number} x - X coordinate where link was clicked
   * @param {number} y - Y coordinate where link was clicked
   * @param {Element} linkElement - The link element that was clicked
   */
  handleLinkClick(x, y, linkElement) {
    // Update current position for beforeunload storage
    this.updateCurrentMousePosition(x, y);
    
    if (linkElement && linkElement.tagName === 'A' && linkElement.href) {
      // Optionally store coordinates immediately on link click for redundancy
      this.storeCoordinates(x, y, linkElement.href);
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Link clicked, storing coordinates:', {
          x, y, 
          href: linkElement.href,
          linkText: linkElement.textContent?.substring(0, 50)
        });
      }
    }
  }

  /**
   * Start monitoring mouse events when application is not active
   * Uses Page Visibility API to detect when page is not active
   */
  startInactiveMouseMonitoring() {
    if (this.isMonitoringInactive) {
      return; // Already monitoring
    }

    // Check if Page Visibility API is available
    if (typeof document.hidden === 'undefined') {
      console.warn('[KeyPilot] Page Visibility API not available, cannot monitor inactive mouse events');
      return;
    }

    this.isMonitoringInactive = true;

    // Create mouse event handler for inactive monitoring
    this.inactiveMouseHandler = (event) => {
      // Only track when page is hidden/inactive
      if (document.hidden) {
        // Store coordinates even when page is inactive
        // This helps maintain cursor position context
        this.storeCoordinates(event.clientX, event.clientY);
        
        if (window.KEYPILOT_DEBUG) {
          console.log('[KeyPilot] Mouse event captured while page inactive:', {
            x: event.clientX,
            y: event.clientY,
            hidden: document.hidden
          });
        }
      }
    };

    // Add mouse move listener with passive option for performance
    document.addEventListener('mousemove', this.inactiveMouseHandler, { 
      passive: true,
      capture: true 
    });

    // Listen for visibility changes
    document.addEventListener('visibilitychange', () => {
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Page visibility changed:', {
          hidden: document.hidden,
          visibilityState: document.visibilityState
        });
      }
    });

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot] Started inactive mouse monitoring');
    }
  }

  /**
   * Stop monitoring mouse events when application is not active
   */
  stopInactiveMouseMonitoring() {
    if (!this.isMonitoringInactive) {
      return;
    }

    this.isMonitoringInactive = false;

    if (this.inactiveMouseHandler) {
      document.removeEventListener('mousemove', this.inactiveMouseHandler, { 
        passive: true,
        capture: true 
      });
      this.inactiveMouseHandler = null;
    }

    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot] Stopped inactive mouse monitoring');
    }
  }

  /**
   * Clear stored coordinates
   */
  async clearStoredCoordinates() {
    try {
      if (chrome?.storage?.sync) {
        await chrome.storage.sync.remove([this.storageKey]);
      }
      if (chrome?.storage?.local) {
        await chrome.storage.local.remove([this.storageKey]);
      }
      localStorage.removeItem(this.storageKey);
      
      this.lastStoredCoordinates = null;
      
      if (window.KEYPILOT_DEBUG) {
        console.log('[KeyPilot] Cleared stored mouse coordinates');
      }
    } catch (error) {
      console.warn('[KeyPilot] Failed to clear stored coordinates:', error);
    }
  }

  /**
   * Get debug information about stored coordinates
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    return {
      hasStoredCoordinates: !!this.lastStoredCoordinates,
      storedCoordinates: this.lastStoredCoordinates,
      isMonitoringInactive: this.isMonitoringInactive,
      storageKey: this.storageKey,
      pageVisibilitySupported: typeof document.hidden !== 'undefined',
      currentVisibility: {
        hidden: document.hidden,
        visibilityState: document.visibilityState
      }
    };
  }

  /**
   * Cleanup method to be called when the extension is disabled or unloaded
   */
  cleanup() {
    this.stopInactiveMouseMonitoring();
    
    // Remove beforeunload listeners
    if (this.beforeUnloadHandler) {
      window.removeEventListener('beforeunload', this.beforeUnloadHandler);
      window.removeEventListener('pagehide', this.beforeUnloadHandler);
      this.beforeUnloadHandler = null;
    }
  }
}
