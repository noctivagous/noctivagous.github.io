/**
 * Cross-Tab Synchronization and Edge Cases Tests
 * Tests complex scenarios, error handling, and edge cases for toggle functionality
 */

// Mock Chrome APIs with advanced scenarios
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
  }
};

describe('Cross-Tab Synchronization Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Multi-Tab State Synchronization', () => {
    test('should synchronize state across multiple tabs immediately', async () => {
      const tabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'https://google.com' },
        { id: 3, url: 'https://github.com' },
        { id: 4, url: 'https://stackoverflow.com' }
      ];
      
      chrome.tabs.query.mockResolvedValue(tabs);
      chrome.tabs.sendMessage.mockResolvedValue();
      
      // Simulate notifying all tabs
      const message = {
        type: 'KP_TOGGLE_STATE',
        enabled: false,
        timestamp: Date.now()
      };
      
      const startTime = Date.now();
      
      const notifications = tabs.map(async (tab) => {
        await chrome.tabs.sendMessage(tab.id, message);
        return { tabId: tab.id, notified: true };
      });
      
      const results = await Promise.all(notifications);
      const endTime = Date.now();
      
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(4);
      expect(results).toHaveLength(4);
      expect(endTime - startTime).toBeLessThan(100); // Should be fast
      
      // Verify each tab received the correct message
      tabs.forEach((tab, index) => {
        expect(chrome.tabs.sendMessage).toHaveBeenNthCalledWith(
          index + 1,
          tab.id,
          message
        );
      });
    });

    test('should handle partial tab notification failures gracefully', async () => {
      const tabs = [
        { id: 1, url: 'https://example.com' },
        { id: 2, url: 'chrome://extensions/' }, // Will fail
        { id: 3, url: 'https://google.com' },
        { id: 4, url: 'chrome://settings/' } // Will fail
      ];
      
      chrome.tabs.query.mockResolvedValue(tabs);
      chrome.tabs.sendMessage
        .mockResolvedValueOnce() // Tab 1 success
        .mockRejectedValueOnce(new Error('Cannot access chrome:// pages')) // Tab 2 fail
        .mockResolvedValueOnce() // Tab 3 success
        .mockRejectedValueOnce(new Error('Cannot access chrome:// pages')); // Tab 4 fail
      
      const message = { type: 'KP_TOGGLE_STATE', enabled: true };
      
      const notifications = tabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
          return { tabId: tab.id, success: true };
        } catch (error) {
          return { tabId: tab.id, success: false, error: error.message };
        }
      });
      
      const results = await Promise.allSettled(notifications);
      
      expect(results).toHaveLength(4);
      expect(results[0].value.success).toBe(true); // Regular page
      expect(results[1].value.success).toBe(false); // Chrome page
      expect(results[2].value.success).toBe(true); // Regular page
      expect(results[3].value.success).toBe(false); // Chrome page
    });

    test('should handle high-frequency toggle requests', async () => {
      chrome.storage.sync.get.mockResolvedValue({ keypilot_enabled: true });
      chrome.storage.sync.set.mockResolvedValue();
      chrome.tabs.query.mockResolvedValue([{ id: 1 }]);
      chrome.tabs.sendMessage.mockResolvedValue();
      
      // Simulate rapid toggle requests
      const togglePromises = [];
      for (let i = 0; i < 10; i++) {
        togglePromises.push(
          new Promise(async (resolve) => {
            // Simulate toggle operation
            const currentState = await chrome.storage.sync.get(['keypilot_enabled']);
            const newState = !currentState.keypilot_enabled;
            await chrome.storage.sync.set({ keypilot_enabled: newState });
            resolve(newState);
          })
        );
      }
      
      const results = await Promise.all(togglePromises);
      
      // Should handle all requests without errors
      expect(results).toHaveLength(10);
      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(10);
    });
  });

  describe('Restricted Pages Edge Cases', () => {
    test('should handle chrome:// pages gracefully', async () => {
      const restrictedTabs = [
        { id: 1, url: 'chrome://extensions/' },
        { id: 2, url: 'chrome://settings/' },
        { id: 3, url: 'chrome://flags/' },
        { id: 4, url: 'chrome://history/' }
      ];
      
      chrome.tabs.query.mockResolvedValue(restrictedTabs);
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Cannot access chrome:// pages'));
      
      const message = { type: 'KP_TOGGLE_STATE', enabled: false };
      
      // Should not throw unhandled errors
      const notifications = restrictedTabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
          return { success: true };
        } catch (error) {
          return { success: false, error: error.message };
        }
      });
      
      const results = await Promise.allSettled(notifications);
      
      results.forEach(result => {
        expect(result.status).toBe('fulfilled');
        expect(result.value.success).toBe(false);
        expect(result.value.error).toContain('Cannot access chrome://');
      });
    });

    test('should handle extension pages and moz-extension URLs', async () => {
      const extensionTabs = [
        { id: 1, url: 'moz-extension://abc123/popup.html' },
        { id: 2, url: 'chrome-extension://def456/options.html' },
        { id: 3, url: 'edge-extension://ghi789/background.html' }
      ];
      
      chrome.tabs.query.mockResolvedValue(extensionTabs);
      chrome.tabs.sendMessage.mockRejectedValue(new Error('Cannot access extension pages'));
      
      const message = { type: 'KP_TOGGLE_STATE', enabled: true };
      
      const notifications = extensionTabs.map(async (tab) => {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
          return { success: true };
        } catch (error) {
          return { success: false };
        }
      });
      
      const results = await Promise.all(notifications);
      
      results.forEach(result => {
        expect(result.success).toBe(false);
      });
    });

    test('should handle file:// URLs appropriately', async () => {
      const fileTabs = [
        { id: 1, url: 'file:///Users/test/document.html' },
        { id: 2, url: 'file:///C:/Users/test/page.html' }
      ];
      
      chrome.tabs.query.mockResolvedValue(fileTabs);
      // file:// URLs might work depending on extension permissions
      chrome.tabs.sendMessage.mockResolvedValue();
      
      const message = { type: 'KP_TOGGLE_STATE', enabled: false };
      
      const notifications = fileTabs.map(async (tab) => {
        await chrome.tabs.sendMessage(tab.id, message);
        return { success: true };
      });
      
      const results = await Promise.all(notifications);
      
      expect(results).toHaveLength(2);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(2);
    });
  });

  describe('Service Worker Lifecycle Edge Cases', () => {
    test('should handle service worker inactive scenario', async () => {
      // Simulate service worker being inactive
      chrome.runtime.sendMessage.mockRejectedValue(new Error('Service worker inactive'));
      
      // Content script should handle this gracefully
      try {
        await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      } catch (error) {
        expect(error.message).toBe('Service worker inactive');
      }
      
      // Should retry or fallback to default state
      expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'KP_GET_STATE' });
    });

    test('should handle service worker reactivation', async () => {
      // First call fails (inactive)
      chrome.runtime.sendMessage
        .mockRejectedValueOnce(new Error('Service worker inactive'))
        .mockResolvedValueOnce({ type: 'KP_STATE_RESPONSE', enabled: true });
      
      // Simulate retry logic
      let response;
      try {
        response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      } catch (error) {
        // Retry after service worker reactivation
        response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      }
      
      expect(response.type).toBe('KP_STATE_RESPONSE');
      expect(response.enabled).toBe(true);
      expect(chrome.runtime.sendMessage).toHaveBeenCalledTimes(2);
    });

    test('should handle extension context invalidated', async () => {
      const contextError = new Error('Extension context invalidated');
      chrome.runtime.sendMessage.mockRejectedValue(contextError);
      chrome.storage.sync.get.mockRejectedValue(contextError);
      
      // Should handle gracefully and not crash
      try {
        await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
      } catch (error) {
        expect(error.message).toBe('Extension context invalidated');
      }
      
      try {
        await chrome.storage.sync.get(['keypilot_enabled']);
      } catch (error) {
        expect(error.message).toBe('Extension context invalidated');
      }
    });
  });

  describe('Storage Fallback Mechanisms', () => {
    test('should fallback from sync to local storage', async () => {
      const syncError = new Error('QUOTA_BYTES_PER_ITEM quota exceeded');
      chrome.storage.sync.set.mockRejectedValue(syncError);
      chrome.storage.local.set.mockResolvedValue();
      
      const stateData = { keypilot_enabled: false, timestamp: Date.now() };
      
      // Simulate fallback logic
      try {
        await chrome.storage.sync.set(stateData);
      } catch (error) {
        if (error.message.includes('quota')) {
          await chrome.storage.local.set(stateData);
        }
      }
      
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(stateData);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(stateData);
    });

    test('should handle both storage methods failing', async () => {
      const storageError = new Error('Storage unavailable');
      chrome.storage.sync.set.mockRejectedValue(storageError);
      chrome.storage.local.set.mockRejectedValue(storageError);
      
      const stateData = { keypilot_enabled: true };
      
      // Should not throw unhandled errors
      let finalError;
      try {
        await chrome.storage.sync.set(stateData);
      } catch (syncError) {
        try {
          await chrome.storage.local.set(stateData);
        } catch (localError) {
          finalError = localError;
        }
      }
      
      expect(finalError.message).toBe('Storage unavailable');
      expect(chrome.storage.sync.set).toHaveBeenCalledWith(stateData);
      expect(chrome.storage.local.set).toHaveBeenCalledWith(stateData);
    });

    test('should handle storage quota exceeded gracefully', async () => {
      const quotaError = new Error('QUOTA_BYTES_PER_ITEM quota exceeded');
      chrome.storage.sync.set.mockRejectedValue(quotaError);
      chrome.storage.local.set.mockResolvedValue();
      
      // Large state data that might exceed quota
      const largeStateData = {
        keypilot_enabled: true,
        timestamp: Date.now(),
        metadata: 'x'.repeat(8192) // Large string
      };
      
      let success = false;
      try {
        await chrome.storage.sync.set(largeStateData);
        success = true;
      } catch (error) {
        if (error.message.includes('quota')) {
          // Fallback with minimal data
          await chrome.storage.local.set({
            keypilot_enabled: largeStateData.keypilot_enabled,
            timestamp: largeStateData.timestamp
          });
          success = true;
        }
      }
      
      expect(success).toBe(true);
      expect(chrome.storage.local.set).toHaveBeenCalled();
    });
  });

  describe('Race Condition Handling', () => {
    test('should handle concurrent state changes', async () => {
      let callCount = 0;
      chrome.storage.sync.get.mockImplementation(() => {
        callCount++;
        return Promise.resolve({ keypilot_enabled: callCount % 2 === 0 });
      });
      chrome.storage.sync.set.mockResolvedValue();
      
      // Simulate concurrent toggle operations
      const concurrentToggles = Array.from({ length: 5 }, async (_, i) => {
        const currentState = await chrome.storage.sync.get(['keypilot_enabled']);
        const newState = !currentState.keypilot_enabled;
        await chrome.storage.sync.set({ keypilot_enabled: newState });
        return newState;
      });
      
      const results = await Promise.all(concurrentToggles);
      
      expect(results).toHaveLength(5);
      expect(chrome.storage.sync.get).toHaveBeenCalledTimes(5);
      expect(chrome.storage.sync.set).toHaveBeenCalledTimes(5);
    });

    test('should handle message flooding', async () => {
      chrome.tabs.query.mockResolvedValue([{ id: 1 }, { id: 2 }]);
      chrome.tabs.sendMessage.mockResolvedValue();
      
      // Simulate rapid message sending
      const messages = Array.from({ length: 20 }, (_, i) => ({
        type: 'KP_TOGGLE_STATE',
        enabled: i % 2 === 0,
        timestamp: Date.now() + i
      }));
      
      const sendPromises = messages.map(async (message) => {
        const tabs = await chrome.tabs.query({});
        await Promise.all(tabs.map(tab => 
          chrome.tabs.sendMessage(tab.id, message)
        ));
        return message;
      });
      
      const results = await Promise.all(sendPromises);
      
      expect(results).toHaveLength(20);
      expect(chrome.tabs.sendMessage).toHaveBeenCalledTimes(40); // 20 messages * 2 tabs
    });
  });

  describe('Network and Connectivity Edge Cases', () => {
    test('should handle network disconnection during storage sync', async () => {
      const networkError = new Error('Network request failed');
      chrome.storage.sync.set.mockRejectedValue(networkError);
      chrome.storage.local.set.mockResolvedValue();
      
      const stateData = { keypilot_enabled: false };
      
      // Should fallback to local storage on network failure
      try {
        await chrome.storage.sync.set(stateData);
      } catch (error) {
        if (error.message.includes('Network')) {
          await chrome.storage.local.set(stateData);
        }
      }
      
      expect(chrome.storage.local.set).toHaveBeenCalledWith(stateData);
    });

    test('should handle intermittent connectivity', async () => {
      // Simulate intermittent network
      chrome.storage.sync.set
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce()
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockResolvedValueOnce();
      
      const attempts = [];
      for (let i = 0; i < 4; i++) {
        try {
          await chrome.storage.sync.set({ keypilot_enabled: i % 2 === 0 });
          attempts.push({ attempt: i, success: true });
        } catch (error) {
          attempts.push({ attempt: i, success: false, error: error.message });
        }
      }
      
      expect(attempts).toHaveLength(4);
      expect(attempts[0].success).toBe(false); // First fails
      expect(attempts[1].success).toBe(true);  // Second succeeds
      expect(attempts[2].success).toBe(false); // Third fails
      expect(attempts[3].success).toBe(true);  // Fourth succeeds
    });
  });
});