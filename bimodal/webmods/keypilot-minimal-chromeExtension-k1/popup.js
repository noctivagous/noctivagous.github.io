(function () {
const statusEl = document.getElementById('status');

class PopupToggleController {
    constructor() {
        this.toggleSwitch = null;
        this.isInitialized = false;
    }

    async initialize() {
        this.toggleSwitch = document.getElementById('extension-toggle');
        if (!this.toggleSwitch) {
            console.error('Toggle switch element not found');
            return;
        }

        // Query current state from service worker
        try {
            const response = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
            const enabled = response && response.enabled !== undefined ? response.enabled : true;
            this.updateToggleState(enabled);
        } catch (error) {
            console.error('Failed to get initial state:', error);
            // Default to enabled if service worker is not available
            this.updateToggleState(true);
        }

        // Set up event listener for toggle clicks
        this.toggleSwitch.addEventListener('change', this.handleToggleClick.bind(this));

        // Listen for state changes from service worker
        chrome.runtime.onMessage.addListener((message) => {
            if (message && message.type === 'KP_STATE_CHANGED') {
                this.updateToggleState(message.enabled);
            }
        });

        this.isInitialized = true;
    }

    async handleToggleClick() {
        if (!this.isInitialized) return;

        const enabled = this.toggleSwitch.checked;
        
        try {
            // Send toggle command to service worker
            await chrome.runtime.sendMessage({ 
                type: 'KP_SET_STATE', 
                enabled: enabled 
            });
        } catch (error) {
            console.error('Failed to set extension state:', error);
            // Revert toggle state on error
            this.toggleSwitch.checked = !enabled;
        }
    }

    updateToggleState(enabled) {
        if (this.toggleSwitch) {
            this.toggleSwitch.checked = enabled;
        }
    }
}

// Initialize toggle controller
const toggleController = new PopupToggleController();


function setStatus(mode, extensionEnabled = true) {
    if (!extensionEnabled) {
        statusEl.textContent = 'OFF';
        statusEl.classList.remove('ok', 'warn');
        statusEl.classList.add('err');
    } else if (mode === 'delete') {
        statusEl.textContent = 'DELETE';
        statusEl.classList.remove('ok', 'warn');
        statusEl.classList.add('err');
    } else if (mode === 'text_focus') {
        statusEl.textContent = 'TEXT';
        statusEl.classList.remove('ok', 'err');
        statusEl.classList.add('warn');
    } else {
        statusEl.textContent = 'ON';
        statusEl.classList.remove('err', 'warn');
        statusEl.classList.add('ok');
    }
}


async function queryActiveTab() {
const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
return tab;
}


async function getStatus() {
    try {
        // First check if extension is globally enabled
        let extensionEnabled = true;
        try {
            const stateResponse = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
            extensionEnabled = stateResponse && stateResponse.enabled !== undefined ? stateResponse.enabled : true;
        } catch (error) {
            console.error('Failed to get extension state:', error);
        }

        // If extension is disabled globally, show OFF status
        if (!extensionEnabled) {
            return setStatus('none', false);
        }

        // If extension is enabled, get the current mode from content script
        const tab = await queryActiveTab();
        if (!tab || !tab.id) return setStatus('none', true);
        
        const resp = await chrome.tabs.sendMessage(tab.id, { type: 'KP_GET_STATUS' });
        setStatus(resp && resp.mode || 'none', true);
    } catch (e) {
        // Content script may not be injected yet (e.g., chrome:// pages). 
        // Check extension state and show appropriate status
        try {
            const stateResponse = await chrome.runtime.sendMessage({ type: 'KP_GET_STATE' });
            const extensionEnabled = stateResponse && stateResponse.enabled !== undefined ? stateResponse.enabled : true;
            setStatus('none', extensionEnabled);
        } catch (error) {
            // If service worker is not available, assume enabled
            setStatus('none', true);
        }
    }
}


// Listen for push updates from the content script while the popup is open
chrome.runtime.onMessage.addListener((msg) => {
    if (msg && msg.type === 'KP_STATUS') {
        // When receiving status updates, check if extension is still enabled
        chrome.runtime.sendMessage({ type: 'KP_GET_STATE' }).then(response => {
            const extensionEnabled = response && response.enabled !== undefined ? response.enabled : true;
            setStatus(msg.mode, extensionEnabled);
        }).catch(() => {
            // If service worker is not available, assume enabled
            setStatus(msg.mode, true);
        });
    } else if (msg && msg.type === 'KP_STATE_CHANGED') {
        // Extension toggle state changed, refresh status
        getStatus();
    }
});


getStatus();
toggleController.initialize();
})();
