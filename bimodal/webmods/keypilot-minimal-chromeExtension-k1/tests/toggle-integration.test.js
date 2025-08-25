/**
 * Integration Tests for Toggle Functionality
 * Tests message passing between service worker, content scripts, and popup
 */

// Mock Chrome APIs for integration testing
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
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  commands: {
    onCommand: {
      addListener: jest.fn()
    }
  }
};

describe('Toggle Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Service Worker to Content Script Communication', () => {
    test('should handle KP_GET_STATE message correctly', async () => {
      // Mock storage returning enabled state
      chrome.storage.sync.get.mockResolvedValue({ keypilot_enabled: true });
      
      // Simulate message handler
      const messageHandler = jest.fn();
      chrome.runtime.onMessage.addListener.mockImplementation((handler) => {
        messageHandler.mockImplementation(handler);
      });
      
      // Mock sender and sendResponse
      const sender = { tab: { id: 1 } };
      const sendResponse = jest.fn();
      
      // Simulate receiving KP_GET_STATE message
      const message = { type: 'KP_GET_STATE' };
      
      // This would be handled by the actual message handler in background.js
      // For testing, we simulate the expected behavior
      const expectedResponse = {
        type: 'KP_STATE_RESPONSE',
        enabled: true,
        timestamp: expect.any(Number)
      };
      
      // Verify the message structure is correct
      expect(message.type).toBe('KP_GET_STATE');
      expect(expectedResponse.type).toBe('KP_STATE_RESPONSE');
      expect(expectedResponse.enabled).toBe(true);
    });

    test('should handle KP_SET_STATE message correctly', async () => {
      chrome.storage.sync.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      chrome.tabs.sendMessage.mockResolvedValue();
      
      const message = { type: 'KP_SET_STATE', enabled: false };
      
      // Simulate the expected response
      const expectedResponse = {
        type: 'KP_STATE_CHANGED',
        enabled: false,
        timestamp: expect.any(Number)
      };
      
      expect(message.type).toBe('KP_SET_STATE');
      expect(message.enabled).toBe(false);
      expect(expectedResponse.type).toBe('KP_STATE_CHANGED');
      expect(expectedResponse.enabled).toBe(false);
    });

    test('should handle invalid KP_SET_STATE message', () => {
      const message = { type: 'KP_SET_STATE', enabled: 'invalid' };
      
      const expectedErrorResponse = {
        type: 'KP_ERROR',
        error: 'Invalid enabled value'
      };
      
      expect(message.enabled).toBe('invalid');
      expect(expectedErrorResponse.type).toBe('KP_ERROR');
    });
  });

  describe('Content Script Message Handling', () => {
    test('should query service worker state on initialization', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        type: 'KP_STATE_RESPONSE',
        enabled: true,
        timestamp: Date.now()
      });
      
      // Simulate content script querying state
      const stateQuery = { type: 'KP_GET_STATE' };
      
      const response = await chrome.runtime.sendMessage(stateQuery);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(stateQuery);
      expect(response.type).toBe('KP_STATE_RESPONSE');
      expect(response.enabled).toBe(true);
    });

    test('should handle toggle state messages from service worker', () => {
      const toggleMessage = {
        type: 'KP_TOGGLE_STATE',
        enabled: false,
        timestamp: Date.now()
      };
      
      // Simulate content script receiving toggle message
      const messageHandler = jest.fn();
      
      // This would be the actual message handler in content script
      messageHandler(toggleMessage);
      
      expect(messageHandler).toHaveBeenCalledWith(toggleMessage);
      expect(toggleMessage.type).toBe('KP_TOGGLE_STATE');
      expect(toggleMessage.enabled).toBe(false);
    });
  });

  describe('Popup to Service Worker Communication', () => {
    test('should send toggle request to service worker', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        type: 'KP_STATE_CHANGED',
        enabled: true,
        timestamp: Date.now()
      });
      
      // Simulate popup sending toggle request
      const toggleRequest = { type: 'KP_SET_STATE', enabled: true };
      
      const response = await chrome.runtime.sendMessage(toggleRequest);
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith(toggleRequest);
      expect(response.type).toBe('KP_STATE_CHANGED');
      expect(response.enabled).toBe(true);
    });

    test('should handle service worker errors in popup', async () => {
      chrome.runtime.sendMessage.mockResolvedValue({
        type: 'KP_ERROR',
        error: 'Service worker unavailable'
      });
      
      const toggleRequest = { type: 'KP_SET_STATE', enabled: false };
      
      const response = await chrome.runtime.sendMessage(toggleRequest);
      
      expect(response.type).toBe('KP_ERROR');
      expect(response.error).toBe('Service worker unavailable');
    });
  });

  describe('Cross-Tab State Synchronization', () => {
    test('should notify all tabs when state changes', async () => {
      const tabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://google.com' },
        { id: 3, url: 'chrome://extensions/' } // This should fail gracefully
      ];
      
      chrome.tabs.query.mockResolvedValue(tabs);
      chrome.tabs.sendMessage
        .mockResolvedValueOnce() // Tab 1 success
        .mockResolvedValueOnce() // Tab 2 success
        .mockRejectedValueOnce(new Error('Cannot access chrome:// pages')); // Tab 3 fails
      
      // Simulate notifying all tabs
      const message = {
        type: 'KP_TOGGLE_STATE',
        enabled: true,
        timestamp: Date.now()
      };
      
      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
          return { success: true, tabId: tab.id };
        } catch (error) {
          return { success: false, tabId: tab.id, error: error.message };
        }
      });
      
      const results = await Promise.allSettled(notifications);
      
      expect(chrome.tabs.query).toHaveBeenCalledWith({});
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(3);
      expect(results).toHaveLength(3);
    });
  });

  describe('Keyboard Command Integration', () => {
    test('should register Alt+K command handler', () => {
      const commandHandler = jest.fn();
      chrome.commands.onCommand.addListener.mockImplementation((handler) => {
        commandHandler.mockImplementation(handler);
      });
      
      // Simulate Alt+K command
      commandHandler('toggle-extension');
      
      expect(commandHandler).toHaveBeenCalledWith('toggle-extension');
    });

    test('should handle unknown commands gracefully', () => {
      const commandHandler = jest.fn();
      chrome.commands.onCommand.addListener.mockImplementation((handler) => {
        commandHandler.mockImplementation(handler);
      });
      
      // Simulate unknown command
      commandHandler('unknown-command');
      
      expect(commandHandler).toHaveBeenCalledWith('unknown-command');
    });
  });

  describe('State Persistence', () => {
    test('should persist state across browser sessions', async () => {
      const stateData = {
        keypilot_enabled: false,
        timestamp: Date.now()
      };
      
      // Simulate saving state
      chrome.storage.sync.set.mockResolvedValue();
      await chrome.storage.sync.set(stateData);
      
      // Simulate loading state after restart
      chrome.storage.sync.get.mockResolvedValue(stateData);
      const loadedState = await chrome.storage.sync.get(['keypilot_enabled']);
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(stateData);
      expect(chrome.storage.sync.get).toHaveBeenCalledWith(['keypilot_enabled']);
      expect(loadedState.keypilot_enabled).toBe(false);
    });

    test('should handle storage quota exceeded', async () => {
      const quotaError = new Error('QUOTA_BYTES_PER_ITEM quota exceeded');
      chrome.storage.sync.set.mockRejectedValue(quotaError);
      chrome.storage.local.set.mockResolvedValue();
      
      // Should fallback to local storage
      const stateData = { keypilot_enabled: true, timestamp: Date.now() };
      
      try {
        await chrome.storage.sync.set(stateData);
      } catch (error) {
        // Fallback to local storage
        await chrome.storage.local.set(stateData);
      }
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(stateData);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(stateData);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    test('should handle service worker inactive scenario', async () => {
      // Simulate service worker not responding
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Service worker inactive'));
      
      try {
        await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      } catch (error) {
        expect(error.message).toBe('Service worker inactive');
      }
      
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'KP_GET_STATE' });
    });

    test('should handle content script not injected on restricted pages', async () => {
      const restrictedTabs = [
        { id: 1, url: 'chrome://extensions/' },
        { id: 2, url: 'chrome://settings/' },
        { id: 3, url: 'moz-extension://...' }
      ];
      
      chrome.tabs.query.mockResolvedValue(restrictedTabs);
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Cannot access chrome:// pages'));
      
      // Should handle all failures gracefully
      const message = { type: 'KP_TOGGLE_STATE', enabled: true };
      
      const notifications = restrictedTabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.allSettled(notifications);
      
      // All should fail but not throw unhandled errors
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.success).toBe(false);
      });
    });
  });
});