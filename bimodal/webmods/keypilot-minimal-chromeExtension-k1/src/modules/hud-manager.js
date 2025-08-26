/**
 * HUD (Heads-Up Display) interface management
 * Provides real-time status information and quick access to controls
 */
import { EventManager } from './event-manager.js';
import { MODES, ELEMENT_IDS } from '../config/constants.js';

export class HUDManager extends EventManager {
  constructor(stateManager, styleManager) {
    super();
    
    this.stateManager = stateManager;
    this.styleManager = styleManager;
    this.hudElement = null;
    this.statusBar = null;
    this.isUpdatingFromSync = false; // Flag to prevent broadcast loops
    
    // Storage keys for HUD state persistence
    this.STORAGE_KEYS = {
      HUD_VISIBLE: 'keypilot_hud_visible',
      HUD_EXPANDED: 'keypilot_hud_expanded',
      HUD_ACTIVE_TAB: 'keypilot_hud_active_tab'
    };
    
    // Mode display mapping
    this.modeDisplayMap = {
      [MODES.NONE]: 'Normal Mode',
      [MODES.DELETE]: 'Delete Mode',
      [MODES.TEXT_FOCUS]: 'Text Focus Mode'
    };
    
    // Subscribe to state changes
    this.unsubscribe = this.stateManager.subscribe((newState, prevState) => {
      this.handleStateChange(newState, prevState);
    });
  }

  /**
   * Create the main HUD container element
   */
  createHUDElement() {
    if (this.hudElement) return this.hudElement;
    
    const hud = document.createElement('div');
    hud.id = ELEMENT_IDS.HUD;
    hud.className = 'kpv2-hud';
    
    // Create status bar
    this.statusBar = this.createStatusBar();
    hud.appendChild(this.statusBar);
    
    // Create instructions panel
    const instructionsPanel = this.createInstructionsPanel();
    hud.appendChild(instructionsPanel);
    
    this.hudElement = hud;
    return hud;
  }

  /**
   * Detect existing HUD placeholder elements from early injection
   * @returns {HTMLElement|null} Existing HUD element or null
   */
  detectExistingHUDElement() {
    try {
      // Look for HUD element with early injection marker
      const existingHUD = document.querySelector('#' + ELEMENT_IDS.HUD + '[data-early-injection="true"]');
      if (existingHUD) {
        console.log('[HUDManager] Found existing HUD placeholder from early injection');
        return existingHUD;
      }
      
      // Also check for HUD element without marker (fallback)
      const fallbackHUD = document.getElementById(ELEMENT_IDS.HUD);
      if (fallbackHUD) {
        console.log('[HUDManager] Found existing HUD element (no early injection marker)');
        return fallbackHUD;
      }
      
      console.log('[HUDManager] No existing HUD element found');
      return null;
    } catch (error) {
      console.error('[HUDManager] Error detecting existing HUD element:', error);
      return null;
    }
  }

  /**
   * Create the status bar component
   */
  createStatusBar() {
    const statusBar = document.createElement('div');
    statusBar.className = 'kpv2-hud-status-bar';
    
    // Mode indicator
    const modeIndicator = document.createElement('div');
    modeIndicator.className = 'kpv2-hud-mode-indicator';
    
    const modeText = document.createElement('span');
    modeText.className = 'kpv2-hud-mode-text';
    modeText.textContent = this.getCurrentModeDisplay();
    
    modeIndicator.appendChild(modeText);
    statusBar.appendChild(modeIndicator);
    
    // Controls section
    const controls = this.createControlsSection();
    statusBar.appendChild(controls);
    
    // Expand button
    const expandBtn = this.createExpandButton();
    statusBar.appendChild(expandBtn);
    
    return statusBar;
  }

  /**
   * Create the controls section with toggle switches
   */
  createControlsSection() {
    const controls = document.createElement('div');
    controls.className = 'kpv2-hud-controls';
    
    // HUD toggle switch - initially checked since HUD is visible when created
    const hudVisible = this.stateManager.isHUDVisible();
    const hudToggle = this.createToggleSwitch('hud', 'HUD', hudVisible);
    controls.appendChild(hudToggle);
    
    // KeyPilot toggle switch - initially checked since extension is active
    const keypilotToggle = this.createToggleSwitch('keypilot', 'KeyPilot', true);
    controls.appendChild(keypilotToggle);
    
    return controls;
  }

  /**
   * Create a toggle switch element
   */
  createToggleSwitch(type, label, checked = false) {
    const toggle = document.createElement('label');
    toggle.className = 'kpv2-hud-toggle';
    
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.className = 'kpv2-hud-toggle-input';
    input.setAttribute('data-toggle', type);
    input.checked = checked;
    
    const slider = document.createElement('span');
    slider.className = 'kpv2-hud-toggle-slider';
    
    const labelSpan = document.createElement('span');
    labelSpan.className = 'kpv2-hud-toggle-label';
    labelSpan.textContent = label;
    
    // Add event listener for toggle switch
    input.addEventListener('change', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.handleToggleSwitch(type, e.target.checked);
    });
    
    toggle.appendChild(input);
    toggle.appendChild(slider);
    toggle.appendChild(labelSpan);
    
    return toggle;
  }

  /**
   * Create the expand/collapse button
   */
  createExpandButton() {
    const expandBtn = document.createElement('button');
    expandBtn.className = 'kpv2-hud-expand-btn';
    expandBtn.setAttribute('aria-label', 'Expand HUD');
    
    const icon = document.createElement('span');
    icon.className = 'kpv2-hud-expand-icon';
    icon.textContent = '▲';
    
    expandBtn.appendChild(icon);
    
    // Add click event listener for expand/collapse
    expandBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.toggleExpansion();
    });
    
    return expandBtn;
  }

  /**
   * Create the instructions panel
   */
  createInstructionsPanel() {
    const instructions = document.createElement('div');
    instructions.className = 'kpv2-hud-instructions';
    
    // Initially hidden (collapsed state)
    instructions.style.display = 'none';
    
    // Create tabs
    const tabs = this.createTabsSection();
    instructions.appendChild(tabs);
    
    // Create tab content
    const tabContent = this.createTabContent();
    instructions.appendChild(tabContent);
    
    return instructions;
  }

  /**
   * Create the tabs navigation section
   */
  createTabsSection() {
    const tabs = document.createElement('div');
    tabs.className = 'kpv2-hud-tabs';
    
    const basicTab = document.createElement('button');
    basicTab.className = 'kpv2-hud-tab active';
    basicTab.setAttribute('data-tab', 'basic');
    basicTab.textContent = 'Basic Controls';
    
    // Add click event listener for tab switching
    basicTab.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      this.setActiveTab('basic');
    });
    
    tabs.appendChild(basicTab);
    
    return tabs;
  }

  /**
   * Create the tab content section
   */
  createTabContent() {
    const tabContent = document.createElement('div');
    tabContent.className = 'kpv2-hud-tab-content';
    
    // Basic controls panel
    const basicPanel = this.createBasicControlsPanel();
    tabContent.appendChild(basicPanel);
    
    return tabContent;
  }

  /**
   * Create the basic controls panel
   */
  createBasicControlsPanel() {
    const panel = document.createElement('div');
    panel.className = 'kpv2-hud-tab-panel active';
    panel.setAttribute('data-panel', 'basic');
    
    const controlList = document.createElement('div');
    controlList.className = 'kpv2-hud-control-list';
    
    // Define control items
    const controls = [
      { key: 'F', description: 'Click/Activate element' },
      { key: 'C', description: 'Browser back' },
      { key: 'V', description: 'Browser forward' },
      { key: 'ESC', description: 'Cancel/Exit mode' },
      { key: 'Alt+K', description: 'Toggle KeyPilot' },
      { key: 'Alt+H', description: 'Toggle HUD' }
    ];
    
    // Create control items
    controls.forEach(control => {
      const item = this.createControlItem(control.key, control.description);
      controlList.appendChild(item);
    });
    
    panel.appendChild(controlList);
    
    return panel;
  }

  /**
   * Create a control item element
   */
  createControlItem(key, description) {
    const item = document.createElement('div');
    item.className = 'kpv2-hud-control-item';
    
    const kbd = document.createElement('kbd');
    kbd.textContent = key;
    
    const span = document.createElement('span');
    span.textContent = description;
    
    item.appendChild(kbd);
    item.appendChild(span);
    
    return item;
  }

  /**
   * Get the display text for the current mode
   */
  getCurrentModeDisplay() {
    const currentMode = this.stateManager.getState().mode;
    return this.modeDisplayMap[currentMode] || 'Unknown Mode';
  }

  /**
   * Show the HUD
   */
  show() {
    if (!this.hudElement) {
      this.createHUDElement();
      document.body.appendChild(this.hudElement);
    }
    
    // Remove hidden class and set display
    this.hudElement.classList.remove('kpv2-hidden');
    this.hudElement.style.display = 'block';
    
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDVisible(true);
  }

  /**
   * Hide the HUD
   */
  hide() {
    if (this.hudElement) {
      // Add hidden class and set display
      this.hudElement.classList.add('kpv2-hidden');
      this.hudElement.style.display = 'none';
    }
    
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDVisible(false);
  }

  /**
   * Preserve state during enhancement process
   * Maintains visibility, expansion, and active tab state
   */
  preserveStateFromPlaceholder(placeholderElement) {
    try {
      const preservedState = {
        visible: !placeholderElement.classList.contains('kpv2-hidden'),
        expanded: placeholderElement.classList.contains('kpv2-hud-expanded'),
        activeTab: 'basic' // Default tab for early injection
      };
      
      // Check for active tab from placeholder
      const activeTabButton = placeholderElement.querySelector('.kpv2-hud-tab-button.active');
      if (activeTabButton && activeTabButton.dataset.tab) {
        preservedState.activeTab = activeTabButton.dataset.tab;
      }
      
      console.log('[HUDManager] State preserved from placeholder:', preservedState);
      return preservedState;
    } catch (error) {
      console.error('[HUDManager] Failed to preserve state from placeholder:', error);
      return {
        visible: true,
        expanded: false,
        activeTab: 'basic'
      };
    }
  }

  /**
   * Toggle HUD visibility
   */
  toggle() {
    const isVisible = this.stateManager.isHUDVisible();
    if (isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Internal method to update DOM for expanded state
   */
  _updateExpandedDOM(expanded) {
    if (!this.hudElement) return;
    
    const instructionsPanel = this.hudElement.querySelector('.kpv2-hud-instructions');
    const expandBtn = this.hudElement.querySelector('.kpv2-hud-expand-btn');
    const expandIcon = this.hudElement.querySelector('.kpv2-hud-expand-icon');
    
    if (expanded) {
      if (instructionsPanel) {
        instructionsPanel.classList.add('expanded');
        instructionsPanel.style.display = 'block';
      }
      
      if (expandBtn) {
        expandBtn.classList.add('expanded');
        expandBtn.setAttribute('aria-label', 'Collapse HUD');
      }
      
      if (expandIcon) {
        expandIcon.textContent = '▼';
      }
    } else {
      if (instructionsPanel) {
        instructionsPanel.classList.remove('expanded');
        instructionsPanel.style.display = 'none';
      }
      
      if (expandBtn) {
        expandBtn.classList.remove('expanded');
        expandBtn.setAttribute('aria-label', 'Expand HUD');
      }
      
      if (expandIcon) {
        expandIcon.textContent = '▲';
      }
    }
  }

  /**
   * Expand the HUD to show instructions panel
   */
  expand() {
    this._updateExpandedDOM(true);
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDExpanded(true);
  }

  /**
   * Collapse the HUD to hide instructions panel
   */
  collapse() {
    this._updateExpandedDOM(false);
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDExpanded(false);
  }

  /**
   * Toggle HUD expansion state
   */
  toggleExpansion() {
    const isExpanded = this.stateManager.isHUDExpanded();
    if (isExpanded) {
      this.collapse();
    } else {
      this.expand();
    }
  }

  /**
   * Set the active tab in the instructions panel
   */
  setActiveTab(tabName) {
    if (!this.hudElement) return;
    
    // State change will trigger automatic saving via handleStateChange
    this.stateManager.setHUDActiveTab(tabName);
    
    // Update tab button states
    const tabs = this.hudElement.querySelectorAll('.kpv2-hud-tab');
    tabs.forEach(tab => {
      const tabType = tab.getAttribute('data-tab');
      if (tabType === tabName) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
    
    // Update tab panel states
    const panels = this.hudElement.querySelectorAll('.kpv2-hud-tab-panel');
    panels.forEach(panel => {
      const panelType = panel.getAttribute('data-panel');
      if (panelType === tabName) {
        panel.classList.add('active');
        panel.style.display = 'block';
      } else {
        panel.classList.remove('active');
        panel.style.display = 'none';
      }
    });
  }

  /**
   * Update the mode display in the status bar
   */
  updateModeDisplay(mode) {
    if (!this.statusBar) return;
    
    const modeText = this.statusBar.querySelector('.kpv2-hud-mode-text');
    if (modeText) {
      modeText.textContent = this.modeDisplayMap[mode] || 'Unknown Mode';
    }
  }

  /**
   * Handle toggle switch interactions
   */
  handleToggleSwitch(type, checked) {
    switch (type) {
      case 'hud':
        this.handleHUDToggle(checked);
        break;
      case 'keypilot':
        this.handleKeyPilotToggle(checked);
        break;
      default:
        console.warn('[HUDManager] Unknown toggle type:', type);
    }
  }

  /**
   * Handle HUD toggle switch (hide/show HUD)
   */
  handleHUDToggle(enabled) {
    if (enabled) {
      this.show();
    } else {
      this.hide();
    }
  }

  /**
   * Handle KeyPilot toggle switch (enable/disable extension)
   */
  async handleKeyPilotToggle(enabled) {
    try {
      // Send message to service worker to toggle KeyPilot state
      await chrome.runtime.sendMessage({
        type: 'KP_SET_STATE',
        enabled: enabled
      });
      
      // If KeyPilot is being disabled, hide the HUD
      if (!enabled) {
        this.hide();
        // Update the HUD toggle switch to reflect that HUD is now hidden
        this.updateToggleSwitchState('hud', false);
      }
    } catch (error) {
      console.error('[HUDManager] Failed to toggle KeyPilot state:', error);
      // Revert the toggle switch state on error
      this.updateToggleSwitchState('keypilot', !enabled);
    }
  }

  /**
   * Update the state of a toggle switch
   */
  updateToggleSwitchState(type, checked) {
    if (!this.hudElement) return;
    
    const toggleInput = this.hudElement.querySelector(`input[data-toggle="${type}"]`);
    if (toggleInput) {
      toggleInput.checked = checked;
    }
  }

  /**
   * Update toggle switches based on current state
   */
  updateToggleSwitches() {
    if (!this.hudElement) return;
    
    // Update HUD toggle switch
    const hudVisible = this.stateManager.isHUDVisible();
    this.updateToggleSwitchState('hud', hudVisible);
    
    // Update KeyPilot toggle switch - we'll need to get this from the toggle handler
    // For now, assume it's enabled if HUD is visible
    this.updateToggleSwitchState('keypilot', true);
  }

  /**
   * Handle KeyPilot being disabled externally (e.g., via Alt+K)
   * This should hide the HUD and update toggle switches
   */
  handleKeyPilotDisabled() {
    // Hide the HUD when KeyPilot is disabled
    this.hide();
    
    // Update toggle switches to reflect disabled state
    this.updateToggleSwitchState('hud', false);
    this.updateToggleSwitchState('keypilot', false);
  }

  /**
   * Handle KeyPilot being enabled externally (e.g., via Alt+K)
   * This should restore HUD state and update toggle switches
   */
  async handleKeyPilotEnabled() {
    // Update KeyPilot toggle switch
    this.updateToggleSwitchState('keypilot', true);
    
    try {
      // Load HUD state from storage to restore previous state
      const storedState = await this.loadHUDState();
      
      // Update StateManager with loaded state (this will trigger handleStateChange)
      this.stateManager.setState({
        hud: {
          visible: storedState.visible,
          expanded: storedState.expanded,
          activeTab: storedState.activeTab
        }
      });
      
      console.log('[HUDManager] KeyPilot enabled, restored HUD state:', storedState);
    } catch (error) {
      console.error('[HUDManager] Error restoring HUD state on KeyPilot enable:', error);
      
      // Fallback to current state if loading fails
      const hudState = this.stateManager.getHUDState();
      if (hudState.visible) {
        this.show();
        this.updateToggleSwitchState('hud', true);
      }
    }
  }

  /**
   * Handle state changes from StateManager
   */
  handleStateChange(newState, prevState) {
    // Track if any HUD state changed for storage persistence and cross-tab sync
    let hudStateChanged = false;
    const hudChanges = {};
    
    // Update mode display if mode changed
    if (newState.mode !== prevState.mode) {
      this.updateModeDisplay(newState.mode);
    }
    
    // Handle HUD visibility changes
    if (newState.hud.visible !== prevState.hud.visible) {
      this.preserveVisibilityState(newState.hud.visible);
      
      // Update toggle switch state
      this.updateToggleSwitchState('hud', newState.hud.visible);
      hudStateChanged = true;
      hudChanges.visible = newState.hud.visible;
    }
    
    // Handle HUD expansion changes
    if (newState.hud.expanded !== prevState.hud.expanded) {
      this.preserveExpansionState(newState.hud.expanded);
      hudStateChanged = true;
      hudChanges.expanded = newState.hud.expanded;
    }
    
    // Handle active tab changes
    if (newState.hud.activeTab !== prevState.hud.activeTab) {
      this.preserveActiveTabSelection(newState.hud.activeTab);
      hudStateChanged = true;
      hudChanges.activeTab = newState.hud.activeTab;
    }
    
    // Save HUD state to storage and broadcast to other tabs if any HUD state changed
    // Only broadcast if this change wasn't triggered by a sync message
    if (hudStateChanged) {
      this.saveHUDState();
      
      if (!this.isUpdatingFromSync) {
        this.broadcastHUDStateChange(newState.hud);
      }
    }
  }

  /**
   * Preserve visibility state during placeholder upgrade
   * Maintains smooth transition without flickering
   */
  preserveVisibilityState(visible) {
    try {
      if (!this.hudElement) return;
      
      if (visible) {
        // Show HUD smoothly
        this.hudElement.classList.remove('kpv2-hidden');
        this.hudElement.style.display = 'block';
        
        // Ensure HUD is in DOM if not already
        if (!this.hudElement.parentNode) {
          document.body.appendChild(this.hudElement);
        }
      } else {
        // Hide HUD smoothly
        this.hudElement.classList.add('kpv2-hidden');
        this.hudElement.style.display = 'none';
      }
      
      console.log('[HUDManager] Visibility state preserved:', visible);
    } catch (error) {
      console.error('[HUDManager] Failed to preserve visibility state:', error);
    }
  }

  /**
   * Preserve expansion state across injection phases
   * Maintains expanded/collapsed state during enhancement
   */
  preserveExpansionState(expanded) {
    try {
      if (!this.hudElement) return;
      
      // Update DOM to reflect expansion state
      this._updateExpandedDOM(expanded);
      
      // Ensure expansion state is consistent across all elements
      const instructionsPanel = this.hudElement.querySelector('.kpv2-hud-instructions');
      const expandBtn = this.hudElement.querySelector('.kpv2-hud-expand-btn');
      const expandIcon = this.hudElement.querySelector('.kpv2-hud-expand-icon');
      
      if (expanded) {
        // Expanded state
        if (instructionsPanel) {
          instructionsPanel.classList.add('expanded');
          instructionsPanel.style.display = 'block';
        }
        
        if (expandBtn) {
          expandBtn.classList.add('expanded');
          expandBtn.setAttribute('aria-label', 'Collapse HUD');
        }
        
        if (expandIcon) {
          expandIcon.textContent = '▼';
        }
        
        // Add expanded class to main HUD element
        this.hudElement.classList.add('kpv2-hud-expanded');
      } else {
        // Collapsed state
        if (instructionsPanel) {
          instructionsPanel.classList.remove('expanded');
          instructionsPanel.style.display = 'none';
        }
        
        if (expandBtn) {
          expandBtn.classList.remove('expanded');
          expandBtn.setAttribute('aria-label', 'Expand HUD');
        }
        
        if (expandIcon) {
          expandIcon.textContent = '▲';
        }
        
        // Remove expanded class from main HUD element
        this.hudElement.classList.remove('kpv2-hud-expanded');
      }
      
      console.log('[HUDManager] Expansion state preserved:', expanded);
    } catch (error) {
      console.error('[HUDManager] Failed to preserve expansion state:', error);
    }
  }

  /**
   * Keep active tab selection consistent across injection phases
   * Maintains selected tab during enhancement process
   */
  preserveActiveTabSelection(activeTab) {
    try {
      if (!this.hudElement) return;
      
      // Update tab button states
      const tabs = this.hudElement.querySelectorAll('.kpv2-hud-tab');
      tabs.forEach(tab => {
        const tabType = tab.getAttribute('data-tab');
        if (tabType === activeTab) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      // Update tab panel states
      const panels = this.hudElement.querySelectorAll('.kpv2-hud-tab-panel');
      panels.forEach(panel => {
        const panelType = panel.getAttribute('data-panel');
        if (panelType === activeTab) {
          panel.classList.add('active');
          panel.style.display = 'block';
        } else {
          panel.classList.remove('active');
          panel.style.display = 'none';
        }
      });
      
      // Also handle placeholder tab buttons if they exist
      const placeholderTabs = this.hudElement.querySelectorAll('.kpv2-hud-tab-button');
      placeholderTabs.forEach(tab => {
        const tabType = tab.getAttribute('data-tab');
        if (tabType === activeTab) {
          tab.classList.add('active');
        } else {
          tab.classList.remove('active');
        }
      });
      
      console.log('[HUDManager] Active tab selection preserved:', activeTab);
    } catch (error) {
      console.error('[HUDManager] Failed to preserve active tab selection:', error);
    }
  }

  /**
   * Enhance existing HUD placeholder element with full functionality
   */
  async enhanceExistingElement(existingElement, earlyState = null, stateBridge = null) {
    try {
      if (!existingElement) {
        console.warn('[HUDManager] No existing element to enhance, falling back to normal initialization');
        return await this.initialize();
      }
      
      console.log('[HUDManager] Enhancing existing HUD element');
      
      // Use the existing element as our HUD
      this.hudElement = existingElement;
      
      // Remove early injection marker
      this.hudElement.removeAttribute('data-early-injection');
      
      // Ensure proper ID and classes
      this.hudElement.id = ELEMENT_IDS.HUD;
      if (!this.hudElement.classList.contains('kpv2-hud')) {
        this.hudElement.classList.add('kpv2-hud');
      }
      
      // Preserve current visibility state from placeholder
      const wasVisible = !this.hudElement.classList.contains('kpv2-hidden');
      const wasExpanded = this.hudElement.classList.contains('kpv2-hud-expanded');
      
      // Find or create status bar
      this.statusBar = this.hudElement.querySelector('.kpv2-hud-status-bar');
      if (!this.statusBar) {
        this.statusBar = this.createStatusBar();
        this.hudElement.appendChild(this.statusBar);
      } else {
        // Enhance existing status bar
        this.enhanceStatusBar();
      }
      
      // Find or create instructions panel
      let instructionsPanel = this.hudElement.querySelector('.kpv2-hud-instructions');
      if (!instructionsPanel) {
        instructionsPanel = this.createInstructionsPanel();
        this.hudElement.appendChild(instructionsPanel);
      }
      
      // Load state from early injection or storage
      let targetState;
      if (earlyState && stateBridge) {
        // Use early state if available, preserving placeholder state as fallback
        targetState = {
          visible: earlyState.hudVisible !== undefined ? earlyState.hudVisible : wasVisible,
          expanded: earlyState.hudExpanded !== undefined ? earlyState.hudExpanded : wasExpanded,
          activeTab: earlyState.hudActiveTab || 'basic'
        };
        console.log('[HUDManager] Using early state for enhancement:', targetState);
      } else {
        // Fall back to storage, preserving placeholder state as final fallback
        try {
          const loadedState = await this.loadHUDState();
          targetState = {
            visible: loadedState.visible !== undefined ? loadedState.visible : wasVisible,
            expanded: loadedState.expanded !== undefined ? loadedState.expanded : wasExpanded,
            activeTab: loadedState.activeTab || 'basic'
          };
        } catch (error) {
          console.warn('[HUDManager] Failed to load stored state, using placeholder state:', error);
          targetState = {
            visible: wasVisible,
            expanded: wasExpanded,
            activeTab: 'basic'
          };
        }
        console.log('[HUDManager] Using stored state for enhancement:', targetState);
      }
      
      // Perform seamless transition from placeholder to full HUD
      const finalState = this.performSeamlessTransition(existingElement, targetState);
      
      // Update StateManager with final state (this will trigger handleStateChange)
      this.stateManager.setState({
        hud: {
          visible: finalState.visible,
          expanded: finalState.expanded,
          activeTab: finalState.activeTab
        }
      });
      
      // Update toggle switches to reflect current state
      this.updateToggleSwitches();
      
      // Set up message listener for cross-tab HUD toggle
      this.setupMessageListener();
      
      console.log('[HUDManager] HUD element enhanced successfully');
      return true;
      
    } catch (error) {
      console.error('[HUDManager] Failed to enhance existing element:', error);
      // Fall back to normal initialization
      return await this.initialize();
    }
  }

  /**
   * Apply state to DOM elements directly
   * Used during enhancement to prevent flickering
   */
  applyStateToDOM(state) {
    try {
      // Apply visibility state using preservation method
      this.preserveVisibilityState(state.visible);
      
      // Apply expansion state using preservation method
      this.preserveExpansionState(state.expanded);
      
      // Apply active tab using preservation method
      this.preserveActiveTabSelection(state.activeTab);
      
      console.log('[HUDManager] State applied to DOM:', state);
    } catch (error) {
      console.error('[HUDManager] Failed to apply state to DOM:', error);
    }
  }

  /**
   * Implement seamless transition from placeholder to full HUD
   * Ensures no visual disruption during enhancement
   */
  performSeamlessTransition(placeholderElement, targetState) {
    try {
      // Step 1: Capture current visual state
      const currentVisibility = !placeholderElement.classList.contains('kpv2-hidden');
      const currentExpansion = placeholderElement.classList.contains('kpv2-hud-expanded');
      
      // Step 2: Preserve visual continuity during DOM manipulation
      const transitionState = {
        visible: targetState.visible !== undefined ? targetState.visible : currentVisibility,
        expanded: targetState.expanded !== undefined ? targetState.expanded : currentExpansion,
        activeTab: targetState.activeTab || 'basic'
      };
      
      // Step 3: Apply transition state immediately to prevent flickering
      this.applyStateToDOM(transitionState);
      
      // Step 4: Update StateManager to reflect the transition
      this.stateManager.setState({
        hud: transitionState
      });
      
      // Step 5: Ensure all interactive elements are properly enhanced
      this.enhanceStatusBar();
      
      console.log('[HUDManager] Seamless transition completed:', transitionState);
      return transitionState;
    } catch (error) {
      console.error('[HUDManager] Failed to perform seamless transition:', error);
      // Return fallback state
      return {
        visible: true,
        expanded: false,
        activeTab: 'basic'
      };
    }
  }

  /**
   * Enhance status bar with full functionality (event listeners, etc.)
   */
  enhanceStatusBar() {
    try {
      // Find expand button and add event listener if not already present
      const expandBtn = this.statusBar.querySelector('.kpv2-hud-expand-btn');
      if (expandBtn && !expandBtn.hasAttribute('data-enhanced')) {
        expandBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.toggleExpansion();
        });
        expandBtn.setAttribute('data-enhanced', 'true');
      } else if (!expandBtn) {
        // Create expand button if it doesn't exist
        const newExpandBtn = this.createExpandButton();
        this.statusBar.appendChild(newExpandBtn);
      }
      
      // Find toggle switches and enhance them
      const toggleSwitches = this.statusBar.querySelectorAll('.kpv2-hud-toggle input[type="checkbox"]');
      toggleSwitches.forEach(toggle => {
        if (!toggle.hasAttribute('data-enhanced')) {
          toggle.addEventListener('change', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const toggleType = e.target.getAttribute('data-toggle');
            this.handleToggleSwitch(toggleType, e.target.checked);
          });
          toggle.setAttribute('data-enhanced', 'true');
        }
      });
      
      // If no toggle switches exist, create the controls section
      if (toggleSwitches.length === 0) {
        const existingControls = this.statusBar.querySelector('.kpv2-hud-controls');
        if (!existingControls) {
          const controls = this.createControlsSection();
          // Insert controls before expand button
          const expandBtn = this.statusBar.querySelector('.kpv2-hud-expand-btn');
          if (expandBtn) {
            this.statusBar.insertBefore(controls, expandBtn);
          } else {
            this.statusBar.appendChild(controls);
          }
        }
      }
      
      // Ensure mode indicator exists and is updated
      const modeIndicator = this.statusBar.querySelector('.kpv2-hud-mode-indicator');
      if (!modeIndicator) {
        const newModeIndicator = document.createElement('div');
        newModeIndicator.className = 'kpv2-hud-mode-indicator';
        
        const modeText = document.createElement('span');
        modeText.className = 'kpv2-hud-mode-text';
        modeText.textContent = this.getCurrentModeDisplay();
        
        newModeIndicator.appendChild(modeText);
        this.statusBar.insertBefore(newModeIndicator, this.statusBar.firstChild);
      }
      
      console.log('[HUDManager] Status bar enhanced with event listeners');
      
    } catch (error) {
      console.error('[HUDManager] Failed to enhance status bar:', error);
    }
  }

  /**
   * Check if HUD manager is initialized
   */
  isInitialized() {
    return this.hudElement !== null;
  }

  /**
   * Initialize the HUD based on stored state
   * Detects early injection placeholders and enhances them if found
   */
  async initialize(earlyState = null, stateBridge = null) {
    try {
      // First, check for existing HUD element from early injection
      const existingElement = this.detectExistingHUDElement();
      
      if (existingElement) {
        // Enhance existing placeholder element
        console.log('[HUDManager] Found existing HUD element, enhancing...');
        return await this.enhanceExistingElement(existingElement, earlyState, stateBridge);
      }
      
      // No existing element found, proceed with normal initialization
      console.log('[HUDManager] No existing HUD element found, creating new one');
      
      // Load HUD state from storage
      const storedState = await this.loadHUDState();
      
      // Update StateManager with loaded state (this will trigger handleStateChange)
      this.stateManager.setState({
        hud: {
          visible: storedState.visible,
          expanded: storedState.expanded,
          activeTab: storedState.activeTab
        }
      });
      
      // Explicitly show/hide HUD based on loaded state
      // This ensures HUD is shown even if state didn't change
      if (storedState.visible) {
        this.show();
      } else {
        this.hide();
      }
      
      // Set initial expansion state
      this._updateExpandedDOM(storedState.expanded);
      
      // Set initial active tab
      this.setActiveTab(storedState.activeTab);
      
      // Update toggle switches to reflect current state
      this.updateToggleSwitches();
      
      // Set up message listener for cross-tab HUD toggle
      this.setupMessageListener();
      
      console.log('[HUDManager] Initialized with stored state:', storedState);
      return true;
    } catch (error) {
      console.error('[HUDManager] Error during initialization, using current state:', error);
      
      // Fallback to current state if loading fails
      const hudState = this.stateManager.getHUDState();
      
      if (hudState.visible) {
        this.show();
      } else {
        this.hide();
      }
      
      // Set initial expansion state
      this._updateExpandedDOM(hudState.expanded);
      
      // Set initial active tab
      this.setActiveTab(hudState.activeTab);
      
      // Update toggle switches to reflect current state
      this.updateToggleSwitches();
      
      // Set up message listener for cross-tab HUD toggle
      this.setupMessageListener();
      
      return false;
    }
  }

  /**
   * Broadcast HUD state changes to other tabs via service worker
   */
  async broadcastHUDStateChange(hudState) {
    try {
      // Send complete HUD state to service worker for broadcasting
      await chrome.runtime.sendMessage({
        type: 'KP_SET_COMPLETE_HUD_STATE',
        hudState: hudState
      });
      
      console.log('[HUDManager] Broadcasted HUD state change:', hudState);
    } catch (error) {
      console.error('[HUDManager] Failed to broadcast HUD state change:', error);
      // Don't throw - allow the application to continue even if broadcasting fails
    }
  }

  /**
   * Set up Chrome runtime message listener for HUD synchronization messages
   */
  setupMessageListener() {
    // Remove existing listener if it exists
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
    }
    
    // Create new message listener
    this.messageListener = (message, sender, sendResponse) => {
      if (message.type === 'KP_HUD_TOGGLE') {
        console.log('[HUDManager] Received HUD toggle message:', message);
        
        // Set flag to prevent broadcast loop
        this.isUpdatingFromSync = true;
        
        // Update HUD visibility based on message (without triggering broadcast)
        this.stateManager.setState({
          hud: { ...this.stateManager.getHUDState(), visible: message.visible }
        });
        
        // Reset flag after state update
        this.isUpdatingFromSync = false;
        
        // Send acknowledgment
        sendResponse({
          type: 'KP_HUD_TOGGLE_ACK',
          visible: message.visible,
          timestamp: Date.now()
        });
        
        return true; // Indicate we'll send a response
      } else if (message.type === 'KP_HUD_STATE_SYNC') {
        console.log('[HUDManager] Received complete HUD state sync message:', message);
        
        // Set flag to prevent broadcast loop
        this.isUpdatingFromSync = true;
        
        // Update complete HUD state based on message (without triggering broadcast)
        this.stateManager.setState({
          hud: {
            visible: message.hudState.visible,
            expanded: message.hudState.expanded,
            activeTab: message.hudState.activeTab
          }
        });
        
        // Reset flag after state update
        this.isUpdatingFromSync = false;
        
        // Send acknowledgment
        sendResponse({
          type: 'KP_HUD_STATE_SYNC_ACK',
          hudState: message.hudState,
          timestamp: Date.now()
        });
        
        return true; // Indicate we'll send a response
      }
    };
    
    // Add the message listener
    chrome.runtime.onMessage.addListener(this.messageListener);
    console.log('[HUDManager] Message listener set up for cross-tab HUD synchronization');
  }

  /**
   * Save HUD state to Chrome storage
   * Uses sync storage with local storage fallback
   */
  async saveHUDState() {
    try {
      const hudState = this.stateManager.getHUDState();
      const stateData = {
        [this.STORAGE_KEYS.HUD_VISIBLE]: hudState.visible,
        [this.STORAGE_KEYS.HUD_EXPANDED]: hudState.expanded,
        [this.STORAGE_KEYS.HUD_ACTIVE_TAB]: hudState.activeTab,
        hud_timestamp: Date.now()
      };

      try {
        // Try chrome.storage.sync first
        await chrome.storage.sync.set(stateData);
        console.log('[HUDManager] HUD state saved to sync storage:', hudState);
      } catch (syncError) {
        console.warn('[HUDManager] Failed to save to sync storage, trying local:', syncError);
        
        try {
          // Fallback to chrome.storage.local
          await chrome.storage.local.set(stateData);
          console.log('[HUDManager] HUD state saved to local storage:', hudState);
        } catch (localError) {
          console.error('[HUDManager] Failed to save HUD state to any storage:', localError);
          throw localError;
        }
      }
    } catch (error) {
      console.error('[HUDManager] Error saving HUD state:', error);
      // Don't throw - allow the application to continue even if storage fails
    }
  }

  /**
   * Load HUD state from Chrome storage
   * Uses sync storage with local storage fallback
   * @returns {Promise<Object>} HUD state object with visible, expanded, and activeTab properties
   */
  async loadHUDState() {
    const defaultState = {
      visible: true,
      expanded: false,
      activeTab: 'basic'
    };

    try {
      let storageResult = {};

      try {
        // Try chrome.storage.sync first
        storageResult = await chrome.storage.sync.get([
          this.STORAGE_KEYS.HUD_VISIBLE,
          this.STORAGE_KEYS.HUD_EXPANDED,
          this.STORAGE_KEYS.HUD_ACTIVE_TAB
        ]);
        
        // Check if we got any HUD data from sync storage
        if (storageResult[this.STORAGE_KEYS.HUD_VISIBLE] === undefined) {
          throw new Error('No HUD data in sync storage');
        }
        
        console.log('[HUDManager] HUD state loaded from sync storage:', storageResult);
      } catch (syncError) {
        console.warn('[HUDManager] Failed to load from sync storage, trying local:', syncError);
        
        try {
          // Fallback to chrome.storage.local
          storageResult = await chrome.storage.local.get([
            this.STORAGE_KEYS.HUD_VISIBLE,
            this.STORAGE_KEYS.HUD_EXPANDED,
            this.STORAGE_KEYS.HUD_ACTIVE_TAB
          ]);
          
          console.log('[HUDManager] HUD state loaded from local storage:', storageResult);
        } catch (localError) {
          console.error('[HUDManager] Failed to load from local storage:', localError);
          throw localError;
        }
      }

      // Build state object with fallbacks to defaults
      const loadedState = {
        visible: storageResult[this.STORAGE_KEYS.HUD_VISIBLE] !== undefined 
          ? storageResult[this.STORAGE_KEYS.HUD_VISIBLE] 
          : defaultState.visible,
        expanded: storageResult[this.STORAGE_KEYS.HUD_EXPANDED] !== undefined 
          ? storageResult[this.STORAGE_KEYS.HUD_EXPANDED] 
          : defaultState.expanded,
        activeTab: storageResult[this.STORAGE_KEYS.HUD_ACTIVE_TAB] || defaultState.activeTab
      };

      console.log('[HUDManager] Final loaded HUD state:', loadedState);
      return loadedState;
    } catch (error) {
      console.error('[HUDManager] Error loading HUD state, using defaults:', error);
      return defaultState;
    }
  }

  /**
   * Clean up HUD elements and event listeners
   */
  cleanup() {
    super.cleanup();
    
    if (this.hudElement && this.hudElement.parentNode) {
      this.hudElement.parentNode.removeChild(this.hudElement);
    }
    
    this.hudElement = null;
    this.statusBar = null;
    
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    // Remove message listener
    if (this.messageListener) {
      chrome.runtime.onMessage.removeListener(this.messageListener);
      this.messageListener = null;
    }
  }

  /**
   * Override EventManager methods (not used for HUD but required by base class)
   */
  handleKeyDown(e) {
    // HUD doesn't handle keyboard events directly
    // Keyboard shortcuts will be handled by the main KeyPilot class
  }

  handleMouseMove(e) {
    // HUD doesn't need mouse move handling
  }

  handleScroll(e) {
    // HUD is fixed positioned, no scroll handling needed
  }
}