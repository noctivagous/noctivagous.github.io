/**
 * Settings Manager - Handles settings UI and configuration
 */
import { KEYBINDINGS, UI_CONSTANTS } from '../config/index.js';

export class SettingsManager {
  constructor() {
    this.isOpen = false;
    this.settingsContainer = null;
    this.currentTab = 'keybindings';
    this.keybindingRecorder = null;
    this.settings = {
      keybindings: {},
      ui: {},
      performance: {},
      features: {}
    };
    
    this.init();
  }

  /**
   * Initialize settings manager
   */
  init() {
    this.loadSettings();
    this.createSettingsUI();
    this.setupEventListeners();
  }

  /**
   * Create the settings UI structure
   */
  createSettingsUI() {
    // Create settings container
    this.settingsContainer = document.createElement('div');
    this.settingsContainer.id = 'keypilot-settings';
    this.settingsContainer.className = 'keypilot-settings-container';
    this.settingsContainer.style.display = 'none';
    
    this.settingsContainer.innerHTML = `
      <div class="keypilot-settings-overlay">
        <div class="keypilot-settings-modal">
          <div class="keypilot-settings-header">
            <h2>KeyPilot Settings</h2>
            <button class="keypilot-settings-close" aria-label="Close Settings">×</button>
          </div>
          
          <div class="keypilot-settings-tabs">
            <button class="keypilot-tab-button active" data-tab="keybindings">
              ⌨️ Key Bindings
            </button>
            <button class="keypilot-tab-button" data-tab="ui">
              🎨 Interface
            </button>
            <button class="keypilot-tab-button" data-tab="performance">
              ⚡ Performance
            </button>
            <button class="keypilot-tab-button" data-tab="features">
              🎯 Features
            </button>
          </div>
          
          <div class="keypilot-settings-content">
            <div class="keypilot-tab-panel active" data-panel="keybindings">
              ${this.createKeybindingsPanel()}
            </div>
            
            <div class="keypilot-tab-panel" data-panel="ui">
              ${this.createUIPanel()}
            </div>
            
            <div class="keypilot-tab-panel" data-panel="performance">
              ${this.createPerformancePanel()}
            </div>
            
            <div class="keypilot-tab-panel" data-panel="features">
              ${this.createFeaturesPanel()}
            </div>
          </div>
          
          <div class="keypilot-settings-footer">
            <button class="keypilot-btn keypilot-btn-secondary" id="reset-settings">
              Reset to Defaults
            </button>
            <button class="keypilot-btn keypilot-btn-secondary" id="export-settings">
              Export Settings
            </button>
            <button class="keypilot-btn keypilot-btn-secondary" id="import-settings">
              Import Settings
            </button>
            <button class="keypilot-btn keypilot-btn-primary" id="save-settings">
              Save Changes
            </button>
          </div>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(this.settingsContainer);
  }

  /**
   * Create keybindings configuration panel
   */
  createKeybindingsPanel() {
    const keybindings = Object.entries(KEYBINDINGS);
    
    return `
      <div class="keypilot-keybindings-panel">
        <div class="keypilot-panel-description">
          <p>Configure keyboard shortcuts for KeyPilot actions. Click on a key combination to record a new binding.</p>
        </div>
        
        <div class="keypilot-keybindings-grid">
          ${keybindings.map(([action, key]) => `
            <div class="keypilot-keybinding-item">
              <div class="keypilot-keybinding-info">
                <span class="keypilot-action-name">${this.formatActionName(action)}</span>
                <span class="keypilot-action-description">${this.getActionDescription(action)}</span>
              </div>
              <div class="keypilot-keybinding-input" data-action="${action}">
                <span class="keypilot-key-display">${key}</span>
                <button class="keypilot-record-btn" title="Record new key combination">
                  🎯 Record
                </button>
              </div>
            </div>
          `).join('')}
        </div>
        
        <div class="keypilot-keybinding-recorder" id="keybinding-recorder" style="display: none;">
          <div class="keypilot-recorder-content">
            <span class="keypilot-recorder-text">Press keys to record combination...</span>
            <button class="keypilot-recorder-cancel">Cancel</button>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create UI configuration panel
   */
  createUIPanel() {
    return `
      <div class="keypilot-ui-panel">
        <div class="keypilot-panel-description">
          <p>Customize the visual appearance and behavior of KeyPilot.</p>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Cursor Settings</h3>
          <div class="keypilot-setting-item">
            <label for="cursor-size">Cursor Size</label>
            <input type="range" id="cursor-size" min="16" max="48" value="24">
            <span class="keypilot-setting-value">24px</span>
          </div>
          
          <div class="keypilot-setting-item">
            <label for="cursor-color">Cursor Color</label>
            <input type="color" id="cursor-color" value="#ff6b35">
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="cursor-animation"> 
              Enable cursor animations
            </label>
          </div>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Overlay Settings</h3>
          <div class="keypilot-setting-item">
            <label for="overlay-opacity">Overlay Opacity</label>
            <input type="range" id="overlay-opacity" min="0.1" max="1" step="0.1" value="0.8">
            <span class="keypilot-setting-value">80%</span>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="show-focus-overlay" checked> 
              Show focus overlay
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="show-delete-overlay" checked> 
              Show delete overlay
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create performance configuration panel
   */
  createPerformancePanel() {
    return `
      <div class="keypilot-performance-panel">
        <div class="keypilot-panel-description">
          <p>Adjust performance settings to optimize KeyPilot for your system.</p>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Intersection Observer</h3>
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-intersection-observer" checked> 
              Enable intersection observer optimization
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label for="intersection-threshold">Intersection Threshold</label>
            <input type="range" id="intersection-threshold" min="0" max="1" step="0.1" value="0.1">
            <span class="keypilot-setting-value">10%</span>
          </div>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Performance Monitoring</h3>
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-performance-monitoring"> 
              Enable performance monitoring
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label for="frame-rate-target">Target Frame Rate</label>
            <select id="frame-rate-target">
              <option value="30">30 FPS</option>
              <option value="60" selected>60 FPS</option>
              <option value="120">120 FPS</option>
            </select>
          </div>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Cache Settings</h3>
          <div class="keypilot-setting-item">
            <label for="cache-size">Cache Size (MB)</label>
            <input type="number" id="cache-size" min="1" max="100" value="10">
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-predictive-cache" checked> 
              Enable predictive caching
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Create features configuration panel
   */
  createFeaturesPanel() {
    return `
      <div class="keypilot-features-panel">
        <div class="keypilot-panel-description">
          <p>Enable or disable KeyPilot features and experimental functionality.</p>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Core Features</h3>
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-text-selection" checked> 
              Text Selection Mode
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-rectangle-selection" checked> 
              Rectangle Selection Mode
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-edge-detection" checked> 
              Edge Character Detection
            </label>
          </div>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Advanced Features</h3>
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-smart-targeting"> 
              Smart Element Targeting
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-adaptive-processing"> 
              Adaptive Processing
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-debug-mode"> 
              Debug Mode
            </label>
          </div>
        </div>
        
        <div class="keypilot-settings-group">
          <h3>Experimental</h3>
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-ai-assistance"> 
              AI-Powered Selection (Beta)
            </label>
          </div>
          
          <div class="keypilot-setting-item">
            <label>
              <input type="checkbox" id="enable-gesture-controls"> 
              Gesture Controls (Experimental)
            </label>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Close button
    this.settingsContainer.querySelector('.keypilot-settings-close').addEventListener('click', () => {
      this.close();
    });

    // Tab switching
    this.settingsContainer.querySelectorAll('.keypilot-tab-button').forEach(button => {
      button.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // Settings actions
    this.settingsContainer.querySelector('#save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    this.settingsContainer.querySelector('#reset-settings').addEventListener('click', () => {
      this.resetSettings();
    });

    this.settingsContainer.querySelector('#export-settings').addEventListener('click', () => {
      this.exportSettings();
    });

    this.settingsContainer.querySelector('#import-settings').addEventListener('click', () => {
      this.importSettings();
    });

    // Keybinding recording
    this.setupKeybindingRecording();

    // Range input updates
    this.setupRangeInputs();

    // Overlay click to close
    this.settingsContainer.querySelector('.keypilot-settings-overlay').addEventListener('click', (e) => {
      if (e.target.classList.contains('keypilot-settings-overlay')) {
        this.close();
      }
    });
  }

  /**
   * Setup keybinding recording functionality
   */
  setupKeybindingRecording() {
    this.settingsContainer.querySelectorAll('.keypilot-record-btn').forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.closest('.keypilot-keybinding-input').dataset.action;
        this.startKeybindingRecording(action);
      });
    });
  }

  /**
   * Setup range input value displays
   */
  setupRangeInputs() {
    this.settingsContainer.querySelectorAll('input[type="range"]').forEach(input => {
      const updateValue = () => {
        const valueSpan = input.parentElement.querySelector('.keypilot-setting-value');
        if (valueSpan) {
          let value = input.value;
          if (input.id === 'overlay-opacity') {
            value = Math.round(value * 100) + '%';
          } else if (input.id === 'intersection-threshold') {
            value = Math.round(value * 100) + '%';
          } else if (input.id.includes('size')) {
            value += 'px';
          }
          valueSpan.textContent = value;
        }
      };

      input.addEventListener('input', updateValue);
      updateValue(); // Initial update
    });
  }

  /**
   * Open settings modal
   */
  open() {
    this.isOpen = true;
    this.settingsContainer.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    // Focus management
    this.settingsContainer.querySelector('.keypilot-settings-close').focus();
  }

  /**
   * Close settings modal
   */
  close() {
    this.isOpen = false;
    this.settingsContainer.style.display = 'none';
    document.body.style.overflow = '';
    
    // Stop any active recording
    this.stopKeybindingRecording();
  }

  /**
   * Switch between tabs
   */
  switchTab(tabName) {
    // Update tab buttons
    this.settingsContainer.querySelectorAll('.keypilot-tab-button').forEach(button => {
      button.classList.toggle('active', button.dataset.tab === tabName);
    });

    // Update tab panels
    this.settingsContainer.querySelectorAll('.keypilot-tab-panel').forEach(panel => {
      panel.classList.toggle('active', panel.dataset.panel === tabName);
    });

    this.currentTab = tabName;
  }

  /**
   * Start recording a keybinding
   */
  startKeybindingRecording(action) {
    const recorder = this.settingsContainer.querySelector('#keybinding-recorder');
    const keyDisplay = this.settingsContainer.querySelector(`[data-action="${action}"] .keypilot-key-display`);
    
    this.keybindingRecorder = {
      action,
      keyDisplay,
      keys: new Set(),
      recording: true
    };

    recorder.style.display = 'block';
    keyDisplay.textContent = 'Press keys...';
    keyDisplay.classList.add('recording');

    // Setup keyboard listeners
    this.setupRecordingListeners();
  }

  /**
   * Stop keybinding recording
   */
  stopKeybindingRecording() {
    if (!this.keybindingRecorder) return;

    const recorder = this.settingsContainer.querySelector('#keybinding-recorder');
    recorder.style.display = 'none';

    if (this.keybindingRecorder.keyDisplay) {
      this.keybindingRecorder.keyDisplay.classList.remove('recording');
    }

    this.removeRecordingListeners();
    this.keybindingRecorder = null;
  }

  /**
   * Setup recording event listeners
   */
  setupRecordingListeners() {
    this.recordingKeyDown = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.keybindingRecorder && this.keybindingRecorder.recording) {
        this.keybindingRecorder.keys.add(e.code);
        this.updateRecordingDisplay();
      }
    };

    this.recordingKeyUp = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      if (this.keybindingRecorder && this.keybindingRecorder.recording) {
        // Complete recording after a short delay
        setTimeout(() => {
          this.completeKeybindingRecording();
        }, 100);
      }
    };

    document.addEventListener('keydown', this.recordingKeyDown, true);
    document.addEventListener('keyup', this.recordingKeyUp, true);
  }

  /**
   * Remove recording event listeners
   */
  removeRecordingListeners() {
    if (this.recordingKeyDown) {
      document.removeEventListener('keydown', this.recordingKeyDown, true);
    }
    if (this.recordingKeyUp) {
      document.removeEventListener('keyup', this.recordingKeyUp, true);
    }
  }

  /**
   * Update recording display
   */
  updateRecordingDisplay() {
    if (!this.keybindingRecorder) return;

    const keys = Array.from(this.keybindingRecorder.keys);
    const keyString = this.formatKeyString(keys);
    this.keybindingRecorder.keyDisplay.textContent = keyString || 'Press keys...';
  }

  /**
   * Complete keybinding recording
   */
  completeKeybindingRecording() {
    if (!this.keybindingRecorder) return;

    const keys = Array.from(this.keybindingRecorder.keys);
    const keyString = this.formatKeyString(keys);
    
    if (keyString) {
      this.keybindingRecorder.keyDisplay.textContent = keyString;
      // Store the new keybinding
      this.settings.keybindings[this.keybindingRecorder.action] = keyString;
    } else {
      // Restore original if no valid keys
      const originalKey = KEYBINDINGS[this.keybindingRecorder.action];
      this.keybindingRecorder.keyDisplay.textContent = Array.isArray(originalKey) ? originalKey[0] : originalKey;
    }

    this.stopKeybindingRecording();
  }

  /**
   * Format key codes into readable string
   */
  formatKeyString(keyCodes) {
    const modifiers = [];
    const keys = [];

    keyCodes.forEach(code => {
      if (code.includes('Control')) modifiers.push('Ctrl');
      else if (code.includes('Shift')) modifiers.push('Shift');
      else if (code.includes('Alt')) modifiers.push('Alt');
      else if (code.includes('Meta')) modifiers.push('Cmd');
      else keys.push(code.replace('Key', '').replace('Digit', ''));
    });

    return [...modifiers, ...keys].join('+');
  }

  /**
   * Format action name for display
   */
  formatActionName(action) {
    return action.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  /**
   * Get action description
   */
  getActionDescription(action) {
    const descriptions = {
      'TOGGLE_EXTENSION': 'Enable or disable KeyPilot',
      'HIGHLIGHT_MODE': 'Enter text selection mode',
      'RECTANGLE_HIGHLIGHT_MODE': 'Enter rectangle selection mode',
      'ACTIVATE_ELEMENT': 'Activate focused element',
      'DELETE_ELEMENT': 'Delete focused element',
      'ESCAPE': 'Exit current mode or cancel action'
    };
    
    return descriptions[action] || 'KeyPilot action';
  }

  /**
   * Load settings from storage
   */
  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['keypilot_settings']);
      if (result.keypilot_settings) {
        this.settings = { ...this.settings, ...result.keypilot_settings };
      }
    } catch (error) {
      console.warn('[KeyPilot Settings] Could not load settings:', error);
    }
  }

  /**
   * Save settings to storage
   */
  async saveSettings() {
    try {
      // Collect current form values
      this.collectFormValues();
      
      // Save to Chrome storage
      await chrome.storage.sync.set({ keypilot_settings: this.settings });
      
      // Notify other components
      chrome.runtime.sendMessage({
        type: 'KP_SETTINGS_UPDATED',
        settings: this.settings
      });
      
      // Show success feedback
      this.showNotification('Settings saved successfully!', 'success');
      
    } catch (error) {
      console.error('[KeyPilot Settings] Save failed:', error);
      this.showNotification('Failed to save settings', 'error');
    }
  }

  /**
   * Collect form values into settings object
   */
  collectFormValues() {
    // Collect all form inputs and update settings
    const inputs = this.settingsContainer.querySelectorAll('input, select');
    
    inputs.forEach(input => {
      const id = input.id;
      let value;
      
      if (input.type === 'checkbox') {
        value = input.checked;
      } else if (input.type === 'range' || input.type === 'number') {
        value = parseFloat(input.value);
      } else {
        value = input.value;
      }
      
      // Organize by category
      if (id.includes('cursor') || id.includes('overlay')) {
        this.settings.ui[id] = value;
      } else if (id.includes('performance') || id.includes('cache') || id.includes('frame')) {
        this.settings.performance[id] = value;
      } else if (id.includes('enable')) {
        this.settings.features[id] = value;
      }
    });
  }

  /**
   * Reset settings to defaults
   */
  resetSettings() {
    if (confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      this.settings = {
        keybindings: {},
        ui: {},
        performance: {},
        features: {}
      };
      
      // Reset form values
      this.resetFormValues();
      this.showNotification('Settings reset to defaults', 'info');
    }
  }

  /**
   * Reset form values to defaults
   */
  resetFormValues() {
    // Reset all inputs to their default values
    const inputs = this.settingsContainer.querySelectorAll('input, select');
    inputs.forEach(input => {
      if (input.type === 'checkbox') {
        input.checked = input.hasAttribute('checked');
      } else if (input.hasAttribute('value')) {
        input.value = input.getAttribute('value');
      }
    });
    
    // Update range displays
    this.setupRangeInputs();
  }

  /**
   * Export settings to JSON file
   */
  exportSettings() {
    this.collectFormValues();
    
    const dataStr = JSON.stringify(this.settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `keypilot-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    this.showNotification('Settings exported successfully!', 'success');
  }

  /**
   * Import settings from JSON file
   */
  importSettings() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const importedSettings = JSON.parse(e.target.result);
          this.settings = { ...this.settings, ...importedSettings };
          this.applySettingsToForm();
          this.showNotification('Settings imported successfully!', 'success');
        } catch (error) {
          this.showNotification('Invalid settings file', 'error');
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  }

  /**
   * Apply settings to form inputs
   */
  applySettingsToForm() {
    Object.entries(this.settings).forEach(([category, categorySettings]) => {
      Object.entries(categorySettings).forEach(([key, value]) => {
        const input = this.settingsContainer.querySelector(`#${key}`);
        if (input) {
          if (input.type === 'checkbox') {
            input.checked = value;
          } else {
            input.value = value;
          }
        }
      });
    });
    
    // Update range displays
    this.setupRangeInputs();
  }

  /**
   * Show notification
   */
  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `keypilot-notification keypilot-notification-${type}`;
    notification.textContent = message;
    
    // Add to settings container
    this.settingsContainer.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 3000);
  }

  /**
   * Check if settings are open
   */
  isSettingsOpen() {
    return this.isOpen;
  }

  /**
   * Get current settings
   */
  getSettings() {
    return this.settings;
  }

  /**
   * Update specific setting
   */
  updateSetting(category, key, value) {
    if (!this.settings[category]) {
      this.settings[category] = {};
    }
    this.settings[category][key] = value;
  }

  /**
   * Cleanup
   */
  cleanup() {
    this.removeRecordingListeners();
    if (this.settingsContainer && this.settingsContainer.parentNode) {
      this.settingsContainer.parentNode.removeChild(this.settingsContainer);
    }
  }
}
