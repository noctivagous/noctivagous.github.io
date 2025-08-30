/**
 * Application state management
 */
import { MODES } from '../config/index.js';
import { ModeManager } from './mode-manager.js';

export class StateManager {
  constructor() {
    this.state = {
      mode: MODES.NONE,
      lastMouse: { x: 0, y: 0 },
      focusEl: null,
      deleteEl: null,
      highlightEl: null,
      highlightStartPosition: null,
      currentSelection: null,
      focusedTextElement: null,
      isInitialized: false
    };
    
    this.subscribers = new Set();
    this.modeManager = new ModeManager(this);
  }

  getState() {
    return { ...this.state };
  }

  setState(updates) {
    const prevState = { ...this.state };
    this.state = { ...this.state, ...updates };
    
    // Notify subscribers of state changes
    this.notifySubscribers(prevState, this.state);
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers.delete(callback);
    };
  }

  notifySubscribers(prevState, newState) {
    for (const callback of this.subscribers) {
      try {
        callback(newState, prevState);
      } catch (error) {
        console.error('State subscriber error:', error);
      }
    }
  }

  // Mode management methods
  async setMode(mode, data = {}) {
    return await this.modeManager.transitionTo(mode, data);
  }

  async cancelMode() {
    return await this.modeManager.cancel();
  }

  getModeManager() {
    return this.modeManager;
  }

  setMousePosition(x, y) {
    this.setState({ lastMouse: { x, y } });
  }

  setFocusElement(element) {
    this.setState({ focusEl: element });
  }

  setDeleteElement(element) {
    this.setState({ deleteEl: element });
  }

  setHighlightElement(element) {
    this.setState({ highlightEl: element });
  }

  setHighlightStartPosition(position) {
    this.setState({ highlightStartPosition: position });
  }

  setCurrentSelection(selection) {
    this.setState({ currentSelection: selection });
  }

  clearElements() {
    this.setState({ 
      focusEl: null, 
      deleteEl: null,
      highlightEl: null,
      highlightStartPosition: null,
      currentSelection: null
    });
  }

  isDeleteMode() {
    return this.modeManager.isDeleteMode();
  }

  isHighlightMode() {
    return this.modeManager.isHighlightMode();
  }

  isTextFocusMode() {
    return this.modeManager.isTextFocusMode();
  }

  reset() {
    this.modeManager.reset();
    this.setState({
      mode: MODES.NONE,
      focusEl: null,
      deleteEl: null,
      highlightEl: null,
      highlightStartPosition: null,
      currentSelection: null,
      focusedTextElement: null
    });
  }

  // New text mode state methods
  setTextFocusElement(element) {
    this.setState({ 
      focusedTextElement: element,
      _overlayUpdateTrigger: Date.now()
    });
  }

  clearTextFocusElement() {
    this.setState({ 
      focusedTextElement: null,
      _overlayUpdateTrigger: Date.now()
    });
  }

  // Lifecycle methods
  async initializeMode() {
    return await this.modeManager.initialize();
  }

  async cleanupMode() {
    return await this.modeManager.cleanup();
  }

  async initialize() {
    await this.modeManager.initialize();
  }

  async enable() {
    await this.modeManager.enable();
  }

  async disable() {
    await this.modeManager.disable();
  }

  async cleanup() {
    await this.modeManager.cleanup();
  }
}