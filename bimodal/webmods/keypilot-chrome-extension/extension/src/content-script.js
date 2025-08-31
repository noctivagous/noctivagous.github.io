/**
 * Content script entry point
 */
import { KeyPilot } from './keypilot.js';
import { KeyPilotToggleHandler } from './modules/keypilot-toggle-handler.js';

// Initialize KeyPilot with toggle functionality
async function initializeKeyPilot() {
  try {
    // Create KeyPilot instance
    const keyPilot = new KeyPilot();
    
    // Create toggle handler and wrap KeyPilot instance
    const toggleHandler = new KeyPilotToggleHandler(keyPilot);
    
    // Initialize toggle handler (queries service worker for state)
    await toggleHandler.initialize();
    
    // Store reference globally for debugging
    window.__KeyPilotToggleHandler = toggleHandler;
    
  } catch (error) {
    console.error('[KeyPilot] Failed to initialize with toggle functionality:', error);
    
    // Fallback: initialize KeyPilot without toggle functionality
    try {
      new KeyPilot();
      console.warn('[KeyPilot] Initialized without toggle functionality as fallback');
    } catch (fallbackError) {
      console.error('[KeyPilot] Complete initialization failure:', fallbackError);
    }
  }
}

// Initialize KeyPilot
initializeKeyPilot();