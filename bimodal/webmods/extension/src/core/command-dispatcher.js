/**
 * Command Dispatcher - Routes key commands to appropriate handlers
 */
import { KEYBINDINGS, MODES } from '../config/index.js';

export class CommandDispatcher {
  constructor(stateManager, lifecycleManager) {
    this.stateManager = stateManager;
    this.lifecycleManager = lifecycleManager;
    this.commandHandlers = new Map();
    this.setupDefaultHandlers();
  }

  /**
   * Setup default command handlers
   */
  setupDefaultHandlers() {
    // Navigation commands
    this.registerHandler(KEYBINDINGS.BACK, () => history.back());
    this.registerHandler(KEYBINDINGS.BACK2, () => history.back());
    this.registerHandler(KEYBINDINGS.FORWARD, () => history.forward());
    this.registerHandler(KEYBINDINGS.ROOT, () => window.location.href = '/');
    
    // Tab commands
    this.registerHandler(KEYBINDINGS.TAB_LEFT, () => {
      chrome.runtime.sendMessage({ type: 'KP_TAB_LEFT' });
    });
    this.registerHandler(KEYBINDINGS.TAB_RIGHT, () => {
      chrome.runtime.sendMessage({ type: 'KP_TAB_RIGHT' });
    });
    this.registerHandler(KEYBINDINGS.CLOSE_TAB, () => {
      chrome.runtime.sendMessage({ type: 'KP_CLOSE_TAB' });
    });

    // Mode commands
    this.registerHandler(KEYBINDINGS.CANCEL, () => this.handleCancel());
    this.registerHandler(KEYBINDINGS.DELETE, () => {
      const command = this.stateManager.getCommand();
      switch (command) {
        case 'HIGHLIGHT':
          this.handleHighlightMode();
          break;
        case 'RECTANGLE_HIGHLIGHT':
          this.handleRectangleHighlightMode();
          break;
        case 'ACTIVATE':
          this.handleActivateElement();
          break;
        case 'DELETE':
          this.handleDeleteElement();
          break;
        case 'CANCEL':
          this.handleCancel();
          break;
        case 'OPEN_SETTINGS':
          this.handleOpenSettings();
          break;
        default:
          console.warn(`[CommandDispatcher] Unknown command: ${command}`);
      }
    });
    this.registerHandler(KEYBINDINGS.HIGHLIGHT, () => this.handleHighlight());
    this.registerHandler(KEYBINDINGS.RECTANGLE_HIGHLIGHT, () => this.handleRectangleHighlight());
    this.registerHandler(KEYBINDINGS.ACTIVATE, () => this.handleActivate());
    this.registerHandler(KEYBINDINGS.ACTIVATE_NEW_TAB, () => this.handleActivateNewTab());
    this.registerHandler(KEYBINDINGS.OPEN_SETTINGS, () => this.handleOpenSettings());
  }

  /**
   * Register a command handler
   * @param {Array} keys - Array of key bindings
   * @param {Function} handler - Command handler function
   */
  registerHandler(keys, handler) {
    keys.forEach(key => {
      this.commandHandlers.set(key, handler);
    });
  }

  /**
   * Dispatch key command
   * @param {KeyboardEvent} event
   * @returns {boolean} - True if command was handled
   */
  dispatch(event) {
    const handler = this.commandHandlers.get(event.key);
    if (handler) {
      try {
        handler(event);
        return true;
      } catch (error) {
        console.error('[KeyPilot] Error executing command:', error);
      }
    }
    return false;
  }

  /**
   * Handle cancel command
   */
  async handleCancel() {
    const modeManager = this.stateManager.getModeManager();
    
    if (modeManager.isTextFocusMode()) {
      await this.handleEscapeFromTextFocus();
    } else if (modeManager.isHighlightMode()) {
      await this.cancelHighlightMode();
    } else {
      await this.stateManager.cancelMode();
    }
  }

  /**
   * Handle delete command
   */
  async handleDelete() {
    const elementDetector = this.lifecycleManager.getComponent('elementDetector');
    const currentState = this.stateManager.getState();
    
    if (elementDetector) {
      const element = elementDetector.findClickable(currentState.lastMouse);
      if (element) {
        await this.stateManager.setMode(MODES.DELETE, {
          deleteEl: element
        });
      }
    }
  }

  /**
   * Handle highlight command
   */
  async handleHighlight() {
    const modeManager = this.stateManager.getModeManager();
    const currentMode = modeManager.getCurrentMode();
    
    if (modeManager.isTextFocusMode()) {
      console.log('[KeyPilot] H key ignored - currently in text focus mode');
      return;
    }
    
    const highlightManager = this.lifecycleManager.getComponent('highlightManager');
    if (!highlightManager) {
      console.warn('[KeyPilot] HighlightManager not available');
      return;
    }
    
    // If already in HIGHLIGHT mode, complete the selection
    if (currentMode === MODES.HIGHLIGHT) {
      const selectedText = await highlightManager.completeSelection();
      if (selectedText) {
        console.log('[KeyPilot] Selection completed and copied to clipboard');
      }
      
      // Exit highlight mode
      await this.stateManager.cancelMode();
      return;
    }
    
    // Otherwise, start highlight mode
    const currentState = this.stateManager.getState();
    
    await this.stateManager.setMode(MODES.HIGHLIGHT, {
      highlightStartPosition: currentState.lastMouse,
      selectionType: 'character'
    });
    
    // Start character selection at current mouse position
    const elementDetector = this.lifecycleManager.getComponent('elementDetector');
    if (elementDetector && currentState.lastMouse) {
      const success = highlightManager.startCharacterSelection(
        currentState.lastMouse,
        (x, y) => elementDetector.findTextNodeAtPosition(x, y),
        (textNode, x, y) => elementDetector.getTextOffsetAtPosition(textNode, x, y)
      );
      
      if (success) {
        highlightManager.showHighlightModeIndicator();
        console.log('[KeyPilot] Highlight mode started - press H again to copy selection');
      }
    }
  }

  /**
   * Handle rectangle highlight command
   */
  async handleRectangleHighlight() {
    const modeManager = this.stateManager.getModeManager();
    const currentMode = modeManager.getCurrentMode();
    
    if (modeManager.isTextFocusMode()) {
      console.log('[KeyPilot] Y key ignored - currently in text focus mode');
      return;
    }
    
    const highlightManager = this.lifecycleManager.getComponent('highlightManager');
    if (!highlightManager) {
      console.warn('[KeyPilot] HighlightManager not available');
      return;
    }
    
    // If already in HIGHLIGHT mode, complete the selection
    if (currentMode === MODES.HIGHLIGHT) {
      const selectedText = await highlightManager.completeSelection();
      if (selectedText) {
        console.log('[KeyPilot] Rectangle selection completed and copied to clipboard');
      }
      
      // Exit highlight mode
      await this.stateManager.cancelMode();
      return;
    }
    
    // Otherwise, start rectangle highlight mode
    const currentState = this.stateManager.getState();
    
    await this.stateManager.setMode(MODES.HIGHLIGHT, {
      highlightStartPosition: currentState.lastMouse,
      selectionType: 'rectangle'
    });
    
    // Start rectangle selection at current mouse position
    if (currentState.lastMouse) {
      // Set the rectangle origin point
      highlightManager.rectOriginPoint = { ...currentState.lastMouse };
      highlightManager.rectOriginDocumentPoint = {
        x: currentState.lastMouse.x + window.scrollX,
        y: currentState.lastMouse.y + window.scrollY
      };
      
      highlightManager.setSelectionMode('rectangle');
      highlightManager.showHighlightModeIndicator();
      console.log('[KeyPilot] Rectangle highlight mode started - press Y again to copy selection');
    }
  }

  /**
   * Handle activate command
   */
  async handleActivate(newTab = false) {
    const modeManager = this.stateManager.getModeManager();
    
    // Block activation in text focus mode
    if (modeManager.isTextFocusMode()) {
      console.log('[KeyPilot] F/G key ignored - currently in text focus mode');
      return;
    }
    
    const activationHandler = this.lifecycleManager.getComponent('activationHandler');
    if (activationHandler) {
      activationHandler.activate(newTab);
    }
  }

  /**
   * Handle activate in new tab command
   */
  async handleActivateNewTab() {
    const activationHandler = this.lifecycleManager.getComponent('activationHandler');
    if (activationHandler) {
      activationHandler.activate(true); // true = new tab
    }
  }

  /**
   * Handle escape from text focus
   */
  async handleEscapeFromTextFocus() {
    console.log('[KeyPilot] Escape pressed in text focus mode');
    
    // Get focus detector and exit text focus
    const focusDetector = this.lifecycleManager.getComponent('focusDetector');
    if (focusDetector) {
      await focusDetector.exitTextFocus();
    }
  }

  /**
   * Cancel highlight mode
   */
  async cancelHighlightMode() {
    console.log('[KeyPilot] Canceling highlight mode');
    
    // Get highlight manager and cancel
    const highlightManager = this.lifecycleManager.getComponent('highlightManager');
    if (highlightManager) {
      highlightManager.cancelHighlight();
    }
    
    // Cancel mode through mode manager
    await this.stateManager.cancelMode();
  }

  /**
   * Delete an element
   * @param {Element} element
   */
  deleteElement(element) {
    if (element && element.parentNode) {
      element.remove();
      
      const notificationOverlay = this.lifecycleManager.getComponent('notificationOverlay');
      if (notificationOverlay) {
        notificationOverlay.show('Element deleted', 'success', 2000);
      }
    }
  }

  /**
   * Handle open settings command
   */
  handleOpenSettings() {
    const settingsManager = this.lifecycleManager.getComponent('settingsManager');
    if (settingsManager) {
      settingsManager.open();
    }
  }

  /**
   * Get element under cursor coordinates
   * @param {number} x
   * @param {number} y
   * @returns {Element|null}
   */
  getElementUnderCursor(x, y) {
    const elementDetector = this.lifecycleManager.getComponent('elementDetector');
    if (elementDetector) {
      return elementDetector.deepElementFromPoint(x, y);
    }
    return document.elementFromPoint(x, y);
  }
}
