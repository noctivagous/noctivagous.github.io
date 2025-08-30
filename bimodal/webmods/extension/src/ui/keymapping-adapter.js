/**
 * KeyMapping Adapter - Integrates the keymapping configuration with KeyPilot
 */
export class KeyMappingAdapter {
  constructor() {
    this.functions = null;
    this.mappings = new Map();
    this.categories = new Map();
    this.loadFunctions();
  }

  /**
   * Load function definitions (adapted from future-features/keymappingconfiguration)
   */
  loadFunctions() {
    this.functions = {
      "keypilot": {
        "name": "KeyPilot Controls",
        "icon": "🎯",
        "functions": [
          {
            "id": "toggle-extension",
            "name": "Toggle Extension",
            "icon": "🔄",
            "description": "Enable or disable KeyPilot extension"
          },
          {
            "id": "highlight-mode",
            "name": "Text Selection",
            "icon": "📝",
            "description": "Enter text selection mode"
          },
          {
            "id": "rectangle-mode",
            "name": "Rectangle Selection",
            "icon": "⬜",
            "description": "Enter rectangle selection mode"
          },
          {
            "id": "activate-element",
            "name": "Activate Element",
            "icon": "👆",
            "description": "Activate the focused element"
          },
          {
            "id": "delete-element",
            "name": "Delete Element",
            "icon": "🗑️",
            "description": "Delete the focused element"
          },
          {
            "id": "escape-mode",
            "name": "Escape/Cancel",
            "icon": "⎋",
            "description": "Exit current mode or cancel action"
          }
        ]
      },
      "navigation": {
        "name": "Navigation",
        "icon": "🧭",
        "functions": [
          {
            "id": "scroll-up",
            "name": "Scroll Up",
            "icon": "⬆️",
            "description": "Scroll page up"
          },
          {
            "id": "scroll-down",
            "name": "Scroll Down",
            "icon": "⬇️",
            "description": "Scroll page down"
          },
          {
            "id": "page-up",
            "name": "Page Up",
            "icon": "📄⬆️",
            "description": "Scroll up one page"
          },
          {
            "id": "page-down",
            "name": "Page Down",
            "icon": "📄⬇️",
            "description": "Scroll down one page"
          },
          {
            "id": "go-home",
            "name": "Go to Top",
            "icon": "🏠",
            "description": "Scroll to top of page"
          },
          {
            "id": "go-end",
            "name": "Go to Bottom",
            "icon": "🔚",
            "description": "Scroll to bottom of page"
          }
        ]
      },
      "browser": {
        "name": "Browser Controls",
        "icon": "🌐",
        "functions": [
          {
            "id": "back",
            "name": "Back",
            "icon": "⬅️",
            "description": "Go back in browser history"
          },
          {
            "id": "forward",
            "name": "Forward",
            "icon": "➡️",
            "description": "Go forward in browser history"
          },
          {
            "id": "refresh",
            "name": "Refresh",
            "icon": "🔄",
            "description": "Refresh current page"
          },
          {
            "id": "new-tab",
            "name": "New Tab",
            "icon": "➕",
            "description": "Open new browser tab"
          },
          {
            "id": "close-tab",
            "name": "Close Tab",
            "icon": "❌",
            "description": "Close current tab"
          },
          {
            "id": "bookmark",
            "name": "Bookmark",
            "icon": "⭐",
            "description": "Bookmark current page"
          }
        ]
      },
      "productivity": {
        "name": "Productivity",
        "icon": "📝",
        "functions": [
          {
            "id": "copy",
            "name": "Copy",
            "icon": "📋",
            "description": "Copy selected content"
          },
          {
            "id": "paste",
            "name": "Paste",
            "icon": "📄",
            "description": "Paste from clipboard"
          },
          {
            "id": "cut",
            "name": "Cut",
            "icon": "✂️",
            "description": "Cut selected content"
          },
          {
            "id": "undo",
            "name": "Undo",
            "icon": "↶",
            "description": "Undo last action"
          },
          {
            "id": "redo",
            "name": "Redo",
            "icon": "↷",
            "description": "Redo last undone action"
          },
          {
            "id": "select-all",
            "name": "Select All",
            "icon": "🔘",
            "description": "Select all content"
          }
        ]
      },
      "system": {
        "name": "System Controls",
        "icon": "⚙️",
        "functions": [
          {
            "id": "screenshot",
            "name": "Screenshot",
            "icon": "📸",
            "description": "Take a screenshot"
          },
          {
            "id": "fullscreen",
            "name": "Fullscreen",
            "icon": "⛶",
            "description": "Toggle fullscreen mode"
          },
          {
            "id": "zoom-in",
            "name": "Zoom In",
            "icon": "🔍➕",
            "description": "Zoom in on page"
          },
          {
            "id": "zoom-out",
            "name": "Zoom Out",
            "icon": "🔍➖",
            "description": "Zoom out on page"
          },
          {
            "id": "zoom-reset",
            "name": "Reset Zoom",
            "icon": "🔍",
            "description": "Reset zoom to 100%"
          }
        ]
      }
    };

    // Build category map
    Object.entries(this.functions).forEach(([categoryId, category]) => {
      this.categories.set(categoryId, category);
    });
  }

  /**
   * Get all function categories
   */
  getCategories() {
    return Array.from(this.categories.entries()).map(([id, category]) => ({
      id,
      name: category.name,
      icon: category.icon,
      functions: category.functions
    }));
  }

  /**
   * Get functions by category
   */
  getFunctionsByCategory(categoryId) {
    const category = this.categories.get(categoryId);
    return category ? category.functions : [];
  }

  /**
   * Get function by ID
   */
  getFunction(functionId) {
    for (const category of this.categories.values()) {
      const func = category.functions.find(f => f.id === functionId);
      if (func) return func;
    }
    return null;
  }

  /**
   * Set key mapping for a function
   */
  setMapping(functionId, keyCombo) {
    this.mappings.set(functionId, keyCombo);
    this.saveToStorage();
  }

  /**
   * Get key mapping for a function
   */
  getMapping(functionId) {
    return this.mappings.get(functionId);
  }

  /**
   * Get all mappings
   */
  getAllMappings() {
    return Object.fromEntries(this.mappings);
  }

  /**
   * Remove mapping for a function
   */
  removeMapping(functionId) {
    this.mappings.delete(functionId);
    this.saveToStorage();
  }

  /**
   * Clear all mappings
   */
  clearAllMappings() {
    this.mappings.clear();
    this.saveToStorage();
  }

  /**
   * Load mappings from storage
   */
  async loadFromStorage() {
    try {
      const result = await chrome.storage.sync.get(['keypilot_keymappings']);
      if (result.keypilot_keymappings) {
        this.mappings = new Map(Object.entries(result.keypilot_keymappings));
      }
    } catch (error) {
      console.warn('[KeyMapping] Could not load mappings:', error);
    }
  }

  /**
   * Save mappings to storage
   */
  async saveToStorage() {
    try {
      const mappingsObj = Object.fromEntries(this.mappings);
      await chrome.storage.sync.set({ keypilot_keymappings: mappingsObj });
    } catch (error) {
      console.error('[KeyMapping] Could not save mappings:', error);
    }
  }

  /**
   * Export mappings to JSON
   */
  exportMappings() {
    const exportData = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      mappings: Object.fromEntries(this.mappings),
      functions: this.functions
    };
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `keypilot-keymappings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  /**
   * Import mappings from JSON
   */
  async importMappings(jsonData) {
    try {
      const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
      
      if (data.mappings) {
        this.mappings = new Map(Object.entries(data.mappings));
        await this.saveToStorage();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('[KeyMapping] Import failed:', error);
      return false;
    }
  }

  /**
   * Get default KeyPilot mappings
   */
  getDefaultKeypilotMappings() {
    return {
      'toggle-extension': 'Ctrl+Shift+K',
      'highlight-mode': 'H',
      'rectangle-mode': 'Y',
      'activate-element': 'F',
      'delete-element': 'G',
      'escape-mode': 'Escape'
    };
  }

  /**
   * Reset to default mappings
   */
  async resetToDefaults() {
    const defaults = this.getDefaultKeypilotMappings();
    this.mappings = new Map(Object.entries(defaults));
    await this.saveToStorage();
  }

  /**
   * Check if a key combination is already mapped
   */
  isKeyMapped(keyCombo) {
    return Array.from(this.mappings.values()).includes(keyCombo);
  }

  /**
   * Get function mapped to a key combination
   */
  getFunctionForKey(keyCombo) {
    for (const [functionId, mappedKey] of this.mappings.entries()) {
      if (mappedKey === keyCombo) {
        return functionId;
      }
    }
    return null;
  }

  /**
   * Validate key combination format
   */
  isValidKeyCombo(keyCombo) {
    if (!keyCombo || typeof keyCombo !== 'string') return false;
    
    // Basic validation - should contain at least one key
    const parts = keyCombo.split('+').map(part => part.trim());
    return parts.length > 0 && parts.every(part => part.length > 0);
  }

  /**
   * Format key combination for display
   */
  formatKeyCombo(keyCombo) {
    if (!keyCombo) return '';
    
    return keyCombo
      .split('+')
      .map(key => key.trim())
      .map(key => {
        // Standardize modifier key names
        const keyMap = {
          'ctrl': 'Ctrl',
          'control': 'Ctrl',
          'shift': 'Shift',
          'alt': 'Alt',
          'meta': 'Cmd',
          'cmd': 'Cmd',
          'escape': 'Esc',
          'enter': 'Enter',
          'space': 'Space',
          'tab': 'Tab',
          'backspace': 'Backspace'
        };
        
        return keyMap[key.toLowerCase()] || key.toUpperCase();
      })
      .join(' + ');
  }

  /**
   * Get keyboard layout for visual representation
   */
  getKeyboardLayout() {
    return {
      rows: [
        ['Esc', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12'],
        ['`', '1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '=', 'Backspace'],
        ['Tab', 'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', '[', ']', '\\'],
        ['Caps', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', ';', "'", 'Enter'],
        ['Shift', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ',', '.', '/', 'Shift'],
        ['Ctrl', 'Alt', 'Cmd', 'Space', 'Cmd', 'Alt', 'Ctrl']
      ]
    };
  }

  /**
   * Get statistics about current mappings
   */
  getStatistics() {
    const totalFunctions = Object.values(this.functions)
      .reduce((sum, category) => sum + category.functions.length, 0);
    
    const mappedFunctions = this.mappings.size;
    const unmappedFunctions = totalFunctions - mappedFunctions;
    
    const categoryStats = Object.entries(this.functions).map(([categoryId, category]) => {
      const categoryMapped = category.functions.filter(func => 
        this.mappings.has(func.id)
      ).length;
      
      return {
        category: category.name,
        total: category.functions.length,
        mapped: categoryMapped,
        unmapped: category.functions.length - categoryMapped
      };
    });

    return {
      total: totalFunctions,
      mapped: mappedFunctions,
      unmapped: unmappedFunctions,
      categories: categoryStats
    };
  }
}
