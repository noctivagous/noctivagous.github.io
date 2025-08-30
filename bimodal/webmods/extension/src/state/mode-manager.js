/**
 * Mode Manager - Centralized mode state management with state machine pattern
 */
import { MODES } from '../config/index.js';

export class ModeManager {
  constructor(stateManager) {
    this.stateManager = stateManager;
    this.currentMode = MODES.NONE;
    this.previousMode = MODES.NONE;
    this.modeStack = [];
    this.modeData = new Map();
    
    // Define valid mode transitions
    this.validTransitions = {
      [MODES.NONE]: [MODES.TEXT_FOCUS, MODES.DELETE, MODES.HIGHLIGHT],
      [MODES.TEXT_FOCUS]: [MODES.NONE],
      [MODES.DELETE]: [MODES.NONE],
      [MODES.HIGHLIGHT]: [MODES.NONE, MODES.DELETE]
    };
    
    // Mode-specific cleanup handlers
    this.cleanupHandlers = {
      [MODES.TEXT_FOCUS]: () => this.cleanupTextFocus(),
      [MODES.DELETE]: () => this.cleanupDelete(),
      [MODES.HIGHLIGHT]: () => this.cleanupHighlight()
    };
    
    // Mode-specific entry handlers
    this.entryHandlers = {
      [MODES.TEXT_FOCUS]: (data) => this.enterTextFocus(data),
      [MODES.DELETE]: (data) => this.enterDelete(data),
      [MODES.HIGHLIGHT]: (data) => this.enterHighlight(data)
    };
  }

  /**
   * Get current mode
   */
  getCurrentMode() {
    return this.currentMode;
  }

  /**
   * Get previous mode
   */
  getPreviousMode() {
    return this.previousMode;
  }

  /**
   * Get mode-specific data
   */
  getModeData(key) {
    return this.modeData.get(key);
  }

  /**
   * Set mode-specific data
   */
  setModeData(key, value) {
    this.modeData.set(key, value);
  }

  /**
   * Check if transition is valid
   */
  isValidTransition(fromMode, toMode) {
    const validModes = this.validTransitions[fromMode];
    return validModes && validModes.includes(toMode);
  }

  /**
   * Transition to a new mode
   */
  async transitionTo(newMode, data = {}) {
    const currentMode = this.currentMode;
    
    // Check if transition is valid
    if (!this.isValidTransition(currentMode, newMode)) {
      console.warn(`[ModeManager] Invalid transition from ${currentMode} to ${newMode}`);
      return false;
    }

    // Exit current mode
    await this.exitMode(currentMode);
    
    // Update mode state
    this.previousMode = currentMode;
    this.currentMode = newMode;
    
    // Enter new mode
    await this.enterMode(newMode, data);
    
    // Update global state
    this.stateManager.setState({
      mode: newMode,
      ...data
    });

    console.log(`[ModeManager] Transitioned from ${currentMode} to ${newMode}`);
    return true;
  }

  /**
   * Force transition (bypass validation)
   */
  async forceTransition(newMode, data = {}) {
    const currentMode = this.currentMode;
    
    // Exit current mode
    await this.exitMode(currentMode);
    
    // Update mode state
    this.previousMode = currentMode;
    this.currentMode = newMode;
    
    // Enter new mode
    await this.enterMode(newMode, data);
    
    // Update global state
    this.stateManager.setState({
      mode: newMode,
      ...data
    });

    console.log(`[ModeManager] Force transitioned from ${currentMode} to ${newMode}`);
    return true;
  }

  /**
   * Push current mode to stack and transition
   */
  async pushMode(newMode, data = {}) {
    this.modeStack.push({
      mode: this.currentMode,
      data: Object.fromEntries(this.modeData.entries())
    });
    
    return await this.transitionTo(newMode, data);
  }

  /**
   * Pop mode from stack and transition back
   */
  async popMode() {
    if (this.modeStack.length === 0) {
      console.warn('[ModeManager] No modes in stack to pop');
      return false;
    }

    const previousState = this.modeStack.pop();
    
    // Restore mode data
    this.modeData.clear();
    for (const [key, value] of Object.entries(previousState.data)) {
      this.modeData.set(key, value);
    }
    
    return await this.forceTransition(previousState.mode);
  }

  /**
   * Exit current mode
   */
  async exitMode(mode) {
    if (this.cleanupHandlers[mode]) {
      try {
        await this.cleanupHandlers[mode]();
      } catch (error) {
        console.error(`[ModeManager] Error exiting mode ${mode}:`, error);
      }
    }
  }

  /**
   * Enter new mode
   */
  async enterMode(mode, data) {
    if (this.entryHandlers[mode]) {
      try {
        await this.entryHandlers[mode](data);
      } catch (error) {
        console.error(`[ModeManager] Error entering mode ${mode}:`, error);
      }
    }
  }

  /**
   * Text focus mode entry handler
   */
  async enterTextFocus(data) {
    const { focusedTextElement } = data;
    
    if (focusedTextElement) {
      this.setModeData('focusedElement', focusedTextElement);
      this.setModeData('entryTime', Date.now());
      
      console.log(`[ModeManager] Entered text focus mode for ${focusedTextElement.tagName}`);
    }
  }

  /**
   * Text focus mode cleanup handler
   */
  async cleanupTextFocus() {
    const focusedElement = this.getModeData('focusedElement');
    
    if (focusedElement) {
      try {
        focusedElement.blur();
      } catch (error) {
        console.debug('[ModeManager] Could not blur focused element:', error);
      }
    }
    
    this.modeData.delete('focusedElement');
    this.modeData.delete('entryTime');
    
    console.log('[ModeManager] Cleaned up text focus mode');
  }

  /**
   * Delete mode entry handler
   */
  async enterDelete(data) {
    const { deleteEl } = data;
    
    if (deleteEl) {
      this.setModeData('deleteElement', deleteEl);
      console.log(`[ModeManager] Entered delete mode for ${deleteEl.tagName}`);
    }
  }

  /**
   * Delete mode cleanup handler
   */
  async cleanupDelete() {
    this.modeData.delete('deleteElement');
    console.log('[ModeManager] Cleaned up delete mode');
  }

  /**
   * Highlight mode entry handler
   */
  async enterHighlight(data) {
    const { highlightStartPosition } = data;
    
    if (highlightStartPosition) {
      this.setModeData('startPosition', highlightStartPosition);
      this.setModeData('selectionType', data.selectionType || 'character');
      console.log('[ModeManager] Entered highlight mode');
    }
  }

  /**
   * Highlight mode cleanup handler
   */
  async cleanupHighlight() {
    // Clear any active selection
    if (window.getSelection) {
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        selection.removeAllRanges();
      }
    }
    
    this.modeData.delete('startPosition');
    this.modeData.delete('selectionType');
    console.log('[ModeManager] Cleaned up highlight mode');
  }

  /**
   * Cancel current mode and return to NONE
   */
  async cancel() {
    return await this.transitionTo(MODES.NONE);
  }

  /**
   * Check if currently in specific mode
   */
  isMode(mode) {
    return this.currentMode === mode;
  }

  /**
   * Check if in text focus mode
   */
  isTextFocusMode() {
    return this.currentMode === MODES.TEXT_FOCUS;
  }

  /**
   * Check if in delete mode
   */
  isDeleteMode() {
    return this.currentMode === MODES.DELETE;
  }

  /**
   * Check if in highlight mode
   */
  isHighlightMode() {
    return this.currentMode === MODES.HIGHLIGHT;
  }

  /**
   * Get mode statistics
   */
  getStats() {
    return {
      currentMode: this.currentMode,
      previousMode: this.previousMode,
      stackDepth: this.modeStack.length,
      modeDataSize: this.modeData.size,
      validTransitions: this.validTransitions[this.currentMode] || []
    };
  }

  /**
   * Reset mode manager
   */
  reset() {
    this.currentMode = MODES.NONE;
    this.previousMode = MODES.NONE;
    this.modeStack = [];
    this.modeData.clear();
  }

  /**
   * Lifecycle methods
   */
  async initialize() {
    this.reset();
  }

  async enable() {
    // Mode manager is always enabled
  }

  async disable() {
    await this.cancel();
  }

  async cleanup() {
    await this.exitMode(this.currentMode);
    this.reset();
  }
}
