/**
 * Application state management
 */
import { MODES } from '../config/constants.js';

export class StateManager {
  constructor() {
    this.state = {
      mode: MODES.NONE,
      lastMouse: { x: 0, y: 0 },
      focusEl: null,
      deleteEl: null,
      isInitialized: false,
      hud: {
        visible: true,        // HUD visibility state
        expanded: false,      // HUD expansion state (collapsed by default)
        activeTab: 'basic'    // Currently active tab in expanded view
      }
    };
    
    this.subscribers = new Set();
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

  // Convenience methods
  setMode(mode) {
    this.setState({ mode });
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

  clearElements() {
    this.setState({ 
      focusEl: null, 
      deleteEl: null 
    });
  }

  isDeleteMode() {
    return this.state.mode === MODES.DELETE;
  }

  isTextFocusMode() {
    return this.state.mode === MODES.TEXT_FOCUS;
  }

  reset() {
    this.setState({
      mode: MODES.NONE,
      focusEl: null,
      deleteEl: null,
      hud: {
        visible: true,
        expanded: false,
        activeTab: 'basic'
      }
    });
  }

  // HUD-specific state methods
  setHUDVisible(visible) {
    this.setState({ 
      hud: { ...this.state.hud, visible } 
    });
  }

  setHUDExpanded(expanded) {
    this.setState({ 
      hud: { ...this.state.hud, expanded } 
    });
  }

  setHUDActiveTab(activeTab) {
    this.setState({ 
      hud: { ...this.state.hud, activeTab } 
    });
  }

  // HUD convenience methods
  getHUDState() {
    return { ...this.state.hud };
  }

  isHUDVisible() {
    return this.state.hud.visible;
  }

  isHUDExpanded() {
    return this.state.hud.expanded;
  }

  getHUDActiveTab() {
    return this.state.hud.activeTab;
  }
}