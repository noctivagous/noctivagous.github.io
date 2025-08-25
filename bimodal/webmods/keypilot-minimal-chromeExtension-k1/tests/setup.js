/**
 * Jest Setup for KeyPilot Extension Tests
 * Configures test environment and mocks Chrome APIs
 */

// Mock Chrome Extension APIs globally
global.chrome = {
  storage: {
    sync: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    },
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
  },
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    },
    onStartup: {
      addListener: jest.fn()
    },
    onInstalled: {
      addListener: jest.fn()
    },
    getManifest: jest.fn(() => ({
      version: '0.3.1',
      name: 'KeyPilot Minimal'
    }))
  },
  commands: {
    onCommand: {
      addListener: jest.fn(),
      removeListener: jest.fn()
    }
  },
  action: {
    setBadgeText: jest.fn(),
    setBadgeBackgroundColor: jest.fn()
  }
};

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn()
};

// Mock DOM APIs that might be used
global.document = {
  ...document,
  createElement: jest.fn(() => ({
    style: {},
    classList: {
      add: jest.fn(),
      remove: jest.fn(),
      contains: jest.fn()
    },
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    appendChild: jest.fn(),
    removeChild: jest.fn()
  })),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn()
  }
};

// Reset all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  
  // Reset Chrome API mocks to default behavior
  chrome.storage.sync.get.mockResolvedValue({});
  chrome.storage.sync.set.mockResolvedValue();
  chrome.storage.local.get.mockResolvedValue({});
  chrome.storage.local.set.mockResolvedValue();
  chrome.tabs.query.mockResolvedValue([]);
  chrome.tabs.sendMessage.mockResolvedValue();
  chrome.runtime.sendMessage.mockResolvedValue();
});

// Global test utilities
global.testUtils = {
  // Create a mock tab
  createMockTab: (id = 1, url = 'https://example.com') => ({
    id,
    url,
    title: 'Test Page',
    active: true,
    windowId: 1
  }),
  
  // Create a mock message
  createMockMessage: (type, data = {}) => ({
    type,
    timestamp: Date.now(),
    ...data
  }),
  
  // Wait for async operations
  waitFor: (ms = 10) => new Promise(resolve => setTimeout(resolve, ms)),
  
  // Mock Chrome storage with specific data
  mockStorageData: (data) => {
    chrome.storage.sync.get.mockImplementation((keys) => {
      if (Array.isArray(keys)) {
        const result = {};
        keys.forEach(key => {
          if (data[key] !== undefined) {
            result[key] = data[key];
          }
        });
        return Promise.resolve(result);
      }
      return Promise.resolve(data);
    });
  }
};