/**
 * Keyboard Handler - Processes keyboard events
 */
import { MODES } from '../config/index.js';

export class KeyboardHandler {
  constructor(stateManager, commandDispatcher) {
    this.stateManager = stateManager;
    this.commandDispatcher = commandDispatcher;
    this.enabled = true;
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event
   */
  handleKeyDown(event) {
    if (!this.enabled) return;

    // Debug key presses
    if (window.KEYPILOT_DEBUG) {
      console.log('[KeyPilot] Key pressed:', event.key, 'Code:', event.code);
    }

    // Check for settings shortcut first (Alt+0)
    if (this.isSettingsShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
      this.commandDispatcher.handleOpenSettings();
      return;
    }

    // Don't interfere with other modifier key combinations
    if (this.hasModifierKeys(event)) {
      return;
    }

    const currentState = this.stateManager.getState();

    // In text focus mode, only handle ESC
    if (currentState.mode === MODES.TEXT_FOCUS) {
      if (event.key === 'Escape') {
        console.debug('Escape key detected in text focus mode');
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        this.commandDispatcher.handleCancel();
      }
      return;
    }

    // Don't handle keys if we're in a typing context
    if (this.isTypingContext(event.target)) {
      if (event.key === 'Escape') {
        this.commandDispatcher.handleCancel();
      }
      return;
    }

    // Special handling for highlight mode
    if (currentState.mode === MODES.HIGHLIGHT) {
      if (event.key === 'Escape') {
        event.preventDefault();
        this.commandDispatcher.handleCancel();
        return;
      } else if (event.key === 'h' || event.key === 'H') {
        event.preventDefault();
        this.commandDispatcher.handleHighlight();
        return;
      } else if (event.key === 'y' || event.key === 'Y') {
        event.preventDefault();
        this.commandDispatcher.handleRectangleHighlight();
        return;
      } else {
        // Any other key cancels highlight mode
        this.commandDispatcher.handleCancel();
        // Don't prevent default - allow the key to execute normally
      }
    }

    // Try to dispatch the command
    if (this.commandDispatcher.dispatch(event)) {
      event.preventDefault();
    }
  }

  /**
   * Check if event has modifier keys
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  hasModifierKeys(event) {
    return event.ctrlKey || event.metaKey || event.altKey || event.shiftKey;
  }

  /**
   * Check if key combination matches Alt+0
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  isAltZero(event) {
    return event.altKey && event.key === '0' && !event.ctrlKey && !event.shiftKey && !event.metaKey;
  }

  /**
   * Check if event matches settings shortcut (Alt+0)
   * @param {KeyboardEvent} event
   * @returns {boolean}
   */
  isSettingsShortcut(event) {
    return this.isAltZero(event);
  }

  /**
   * Check if target is in a typing context
   * @param {Element} target
   * @returns {boolean}
   */
  isTypingContext(target) {
    if (!target) return false;

    const tagName = target.tagName.toLowerCase();
    const inputTypes = ['input', 'textarea', 'select'];
    
    if (inputTypes.includes(tagName)) return true;
    if (target.contentEditable === 'true') return true;
    if (target.isContentEditable) return true;

    return false;
  }

  /**
   * Enable keyboard handling
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disable keyboard handling
   */
  disable() {
    this.enabled = false;
  }
}
