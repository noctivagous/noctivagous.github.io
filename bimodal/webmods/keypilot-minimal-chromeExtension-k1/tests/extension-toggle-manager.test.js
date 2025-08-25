/**
 * Unit Tests for ExtensionToggleManager
 * Tests state management, storage operations, and message coordination
 */

// Mock Chrome APIs
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  },
  runtime: {
    onMessage: {
      addListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    }
  }
};

// Import the class (would need to be extracted from background.js for testing)
class ExtensionToggleManager {
  constructor() {
    this.STORAGE_KEY = 'keypilot_enabled';
    this.DEFAULT_STATE = true;
    this.initialized = false;
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      const currentState = await this.getState();
      console.log('ExtensionToggleManager initialized with state:', currentState);
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize ExtensionToggleManager:', error);
      this.initialized = true;
    }
  }

  async getState() {
    try {
      const syncResult = await chrome.storage.sync.get([this.STORAGE_KEY]);
      if (syncResult[this.STORAGE_KEY] !== undefined) {
        return syncResult[this.STORAGE_KEY];
      }
    } catch (syncError) {
      console.warn('chrome.storage.sync unavailable, trying local storage:', syncError);
      
      try {
        const localResult = await chrome.storage.local.get([this.STORAGE_KEY]);
        if (localResult[this.STORAGE_KEY] !== undefined) {
          return localResult[this.STORAGE_KEY];
        }
      } catch (localError) {
        console.error('Both sync and local storage failed:', localError);
      }
    }
    
    return this.DEFAULT_STATE;
  }

  async setState(enabled) {
    const state = Boolean(enabled);
    const stateData = {
      [this.STORAGE_KEY]: state,
      timestamp: Date.now()
    };

    try {
      await chrome.storage.sync.set(stateData);
      console.log('State saved to sync storage:', state);
    } catch (syncError) {
      console.warn('Failed to save to sync storage, trying local:', syncError);
      
      try {
        await chrome.storage.local.set(stateData);
        console.log('State saved to local storage:', state);
      } catch (localError) {
        console.error('Failed to save state to any storage:', localError);
      }
    }

    await this.notifyAllTabs(state);
    return state;
  }

  async toggleState() {
    try {
      const currentState = await this.getState();
      const newState = !currentState;
      await this.setState(newState);
      console.log('Extension state toggled:', currentState, '->', newState);
      return newState;
    } catch (error) {
      console.error('Failed to toggle state:', error);
      return await this.getState();
    }
  }

  async notifyAllTabs(enabled) {
    try {
      const tabs = await chrome.tabs.query({});
      const message = {
        type: 'KP_TOGGLE_STATE',
        enabled: enabled,
        timestamp: Date.now()
      };

      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          console.debug('Could not notify tab', tab.id, ':', error.message);
        }
      });

      await Promise.allSettled(notifications);
      console.log('Notified', tabs.length, 'tabs about state change:', enabled);
    } catch (error) {
      console.error('Failed to notify tabs:', error);
    }
  }
}

describe('ExtensionToggleManager', () => {
  let manager;

  beforeEach(() => {
    manager = new ExtensionToggleManager();
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should initialize only once', async () => {
      chrome.storage.sync.get.mockResolvedValue({ keypilot_enabled: true });
      
      await manager.initialize();
      expect(manager.initialized).toBe(true);
      
      // Second call should not re-initialize
      await manager.initialize();
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(1);
    });

    test('should handle initialization errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      chrome.storage.local.get.mockRejectedValue(new Error('Local storage error'));
      
      await manager.initialize();
      expect(manager.initialized).toBe(true);
    });
  });

  describe('getState', () => {
    test('should return state from sync storage when available', async () => {
      chrome.storage.sync.get.mockResolvedValue({ keypilot_enabled: false });
      
      const state = await manager.getState();
      expect(state).toBe(false);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['keypilot_enabled']);
    });

    test('should fallback to local storage when sync fails', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Sync unavailable'));
      chrome.storage.local.get.mockResolvedValue({ keypilot_enabled: true });
      
      const state = await manager.getState();
      expect(state).toBe(true);
      expect(chrome.storage.local.get).toHaveBeenCalledWith(['keypilot_enabled']);
    });

    test('should return default state when all storage fails', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Sync unavailable'));
      chrome.storage.local.get.mockRejectedValue(new Error('Local unavailable'));
      
      const state = await manager.getState();
      expect(state).toBe(true); // DEFAULT_STATE
    });

    test('should return default state when no stored value exists', async () => {
      chrome.storage.sync.get.mockResolvedValue({});
      chrome.storage.local.get.mockResolvedValue({});
      
      const state = await manager.getState();
      expect(state).toBe(true); // DEFAULT_STATE
    });
  });

  describe('setState', () => {
    test('should save state to sync storage and notify tabs', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      chrome.tabs.sendMessage.mockResolvedValue();
      
      const result = await manager.setState(false);
      
      expect(result).toBe(false);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        keypilot_enabled: false,
        timestamp: expect.any(Number)
      });
      expect(chrome.tabs.query).toHaveBeenCalledWith({});
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });

    test('should fallback to local storage when sync fails', async () => {
      chrome.storage.sync.set.mockRejectedValue(new Error('Sync unavailable'));
      chrome.storage.local.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([]);
      
      const result = await manager.setState(true);
      
      expect(result).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalledWith({
        keypilot_enabled: true,
        timestamp: expect.any(Number)
      });
    });

    test('should convert non-boolean values to boolean', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([]);
      
      await manager.setState('truthy');
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        keypilot_enabled: true,
        timestamp: expect.any(Number)
      });
      
      await manager.setState(0);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        keypilot_enabled: false,
        timestamp: expect.any(Number)
      });
    });
  });

  describe('toggleState', () => {
    test('should toggle from true to false', async () => {
      chrome.storage.sync.get.mockResolvedValue({ keypilot_enabled: true });
      chrome.storage.sync.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([]);
      
      const result = await manager.toggleState();
      
      expect(result).toBe(false);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        keypilot_enabled: false,
        timestamp: expect.any(Number)
      });
    });

    test('should toggle from false to true', async () => {
      chrome.storage.sync.get.mockResolvedValue({ keypilot_enabled: false });
      chrome.storage.sync.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([]);
      
      const result = await manager.toggleState();
      
      expect(result).toBe(true);
      expect(chrome.storage.sync.set).toHaveBeenCalledWith({
        keypilot_enabled: true,
        timestamp: expect.any(Number)
      });
    });

    test('should handle toggle errors gracefully', async () => {
      chrome.storage.sync.get.mockRejectedValue(new Error('Storage error'));
      chrome.storage.local.get.mockResolvedValue({ keypilot_enabled: true });
      
      const result = await manager.toggleState();
      
      // Should return current state when toggle fails
      expect(result).toBe(true);
    });
  });

  describe('notifyAllTabs', () => {
    test('should send messages to all tabs', async () => {
      const tabs = [{ id: 1 }, { id: 2 }, { id: 3 }];
      chrome.tabs.query.mockResolvedValue(tabs);
      chrome.tabs.sendMessage.mockResolvedValue();
      
      await manager.notifyAllTabs(true);
      
      expect(chrome.tabs.query).toHaveBeenCalledWith({});
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(3);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(1, {
        type: 'KP_TOGGLE_STATE',
        enabled: true,
        timestamp: expect.any(Number)
      });
    });

    test('should handle tab message failures gracefully', async () => {
      const tabs = [{ id: 1 }, { id: 2 }];
      chrome.tabs.query.mockResolvedValue(tabs);
      chrome.tabs.sendMessage
        .mockResolvedValueOnce() // First tab succeeds
        .mockRejectedValueOnce(new Error('Tab not available')); // Second tab fails
      
      // Should not throw error
      await expect(manager.notifyAllTabs(false)).resolves.toBeUndefined();
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });

    test('should handle tabs query failure', async () => {
      chrome.tabs.query.mockRejectedValue(new Error('Tabs API unavailable'));
      
      // Should not throw error
      await expect(manager.notifyAllTabs(true)).resolves.toBeUndefined();
    });
  });
});

// Import KeyPilotToggleHandler for testing
class KeyPilotToggleHandler {
  constructor(keyPilotInstance) {
    this.keyPilot = keyPilotInstance;
    this.enabled = true;
    this.initialized = false;
  }

  setEnabled(enabled) {
    if (this.enabled === enabled) return;
    this.enabled = enabled;
    
    if (enabled) {
      this.enableKeyPilot();
    } else {
      this.disableKeyPilot();
    }
  }

  enableKeyPilot() {
    if (!this.keyPilot) return;

    try {
      if (this.keyPilot.styleManager) {
        this.keyPilot.styleManager.restoreAllStyles();
      }
      this.keyPilot.start();
      if (this.keyPilot.cursor) this.keyPilot.cursor.ensure();
      if (this.keyPilot.focusDetector) this.keyPilot.focusDetector.start();
      if (this.keyPilot.intersectionManager) this.keyPilot.intersectionManager.init();
      if (this.keyPilot.scrollManager) this.keyPilot.scrollManager.init();
    } catch (error) {
      console.error('Error enabling KeyPilot:', error);
    }
  }

  disableKeyPilot() {
    if (!this.keyPilot) return;

    try {
      this.keyPilot.stop();
      if (this.keyPilot.cursor) this.keyPilot.cursor.cleanup();
      if (this.keyPilot.focusDetector) this.keyPilot.focusDetector.stop();
      if (this.keyPilot.overlayManager) this.keyPilot.overlayManager.cleanup();
      if (this.keyPilot.intersectionManager) this.keyPilot.intersectionManager.cleanup();
      if (this.keyPilot.scrollManager) this.keyPilot.scrollManager.cleanup();
      if (this.keyPilot.state) this.keyPilot.state.reset();
      if (this.keyPilot.styleManager) this.keyPilot.styleManager.removeAllStyles();
    } catch (error) {
      console.error('Error disabling KeyPilot:', error);
    }
  }

  isEnabled() {
    return this.enabled;
  }
}

describe('KeyPilotToggleHandler CSS Management', () => {
  let toggleHandler;
  let mockKeyPilot;
  let mockStyleManager;

  beforeEach(() => {
    mockStyleManager = {
      removeAllStyles: jest.fn(),
      restoreAllStyles: jest.fn(),
      isStylesEnabled: jest.fn().mockReturnValue(true)
    };
    
    mockKeyPilot = {
      stop: jest.fn(),
      start: jest.fn(),
      cursor: { cleanup: jest.fn(), ensure: jest.fn() },
      focusDetector: { stop: jest.fn(), start: jest.fn() },
      overlayManager: { cleanup: jest.fn() },
      intersectionManager: { cleanup: jest.fn(), init: jest.fn() },
      scrollManager: { cleanup: jest.fn(), init: jest.fn() },
      state: { reset: jest.fn() },
      styleManager: mockStyleManager
    };

    toggleHandler = new KeyPilotToggleHandler(mockKeyPilot);
  });

  describe('CSS cleanup on disable', () => {
    test('should call styleManager.removeAllStyles when disabled', () => {
      toggleHandler.setEnabled(false);
      expect(mockStyleManager.removeAllStyles).toHaveBeenCalled();
    });

    test('should clean up cursor completely when disabled', () => {
      toggleHandler.setEnabled(false);
      expect(mockKeyPilot.cursor.cleanup).toHaveBeenCalled();
    });

    test('should clean up all overlays when disabled', () => {
      toggleHandler.setEnabled(false);
      expect(mockKeyPilot.overlayManager.cleanup).toHaveBeenCalled();
    });

    test('should reset state when disabled', () => {
      toggleHandler.setEnabled(false);
      expect(mockKeyPilot.state.reset).toHaveBeenCalled();
    });
  });

  describe('CSS restoration on enable', () => {
    test('should call styleManager.restoreAllStyles when enabled', () => {
      toggleHandler.setEnabled(false); // First disable
      jest.clearAllMocks();
      
      toggleHandler.setEnabled(true); // Then enable
      expect(mockStyleManager.restoreAllStyles).toHaveBeenCalled();
    });

    test('should restore cursor when enabled', () => {
      toggleHandler.setEnabled(false); // First disable
      jest.clearAllMocks();
      
      toggleHandler.setEnabled(true); // Then enable
      expect(mockKeyPilot.cursor.ensure).toHaveBeenCalled();
    });

    test('should restart all managers when enabled', () => {
      toggleHandler.setEnabled(false); // First disable
      jest.clearAllMocks();
      
      toggleHandler.setEnabled(true); // Then enable
      expect(mockKeyPilot.start).toHaveBeenCalled();
      expect(mockKeyPilot.focusDetector.start).toHaveBeenCalled();
      expect(mockKeyPilot.intersectionManager.init).toHaveBeenCalled();
      expect(mockKeyPilot.scrollManager.init).toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle CSS restoration errors gracefully', () => {
      mockStyleManager.restoreAllStyles.mockImplementation(() => {
        throw new Error('CSS injection failed');
      });
      
      // Should not throw error even if CSS restoration fails
      expect(() => toggleHandler.setEnabled(true)).not.toThrow();
      expect(mockStyleManager.restoreAllStyles).toHaveBeenCalled();
    });

    test('should handle CSS removal errors gracefully', () => {
      mockStyleManager.removeAllStyles.mockImplementation(() => {
        throw new Error('CSS removal failed');
      });
      
      // Should not throw error even if CSS removal fails
      expect(() => toggleHandler.setEnabled(false)).not.toThrow();
      expect(mockStyleManager.removeAllStyles).toHaveBeenCalled();
    });

    test('should continue with partial functionality if some components fail', () => {
      mockKeyPilot.cursor.ensure.mockImplementation(() => {
        throw new Error('Cursor creation failed');
      });
      
      // Should still call other methods even if cursor fails
      expect(() => toggleHandler.setEnabled(true)).not.toThrow();
      expect(mockStyleManager.restoreAllStyles).toHaveBeenCalled();
      expect(mockKeyPilot.start).toHaveBeenCalled();
    });
  });

  describe('state consistency', () => {
    test('should not change state if already in target state', () => {
      expect(toggleHandler.isEnabled()).toBe(true);
      
      toggleHandler.setEnabled(true); // Already enabled
      expect(mockStyleManager.restoreAllStyles).not.toHaveBeenCalled();
      expect(mockKeyPilot.start).not.toHaveBeenCalled();
    });

    test('should track enabled state correctly', () => {
      expect(toggleHandler.isEnabled()).toBe(true);
      
      toggleHandler.setEnabled(false);
      expect(toggleHandler.isEnabled()).toBe(false);
      
      toggleHandler.setEnabled(true);
      expect(toggleHandler.isEnabled()).toBe(true);
    });
  });
});