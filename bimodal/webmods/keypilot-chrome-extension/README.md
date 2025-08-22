# KeyPilot Chrome Extension

**UNDER DEVELOPMENT**



## Features

- **Cursor Control Of Page**: Navigate and interact with web elements using key-clicks.


## Installation

1. Clone or download this repository
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked" and select the extension directory
5. The KeyPilot extension should now appear in your extensions list


## Usage

### Basic Controls


     F    → Click the element under the cursor (prefers links/buttons/ARIA roles)
     K    → Copy element under cursor to clipboard
     H    → Start text highlight mode; press H again to wrap selection in <mark>
     ESC  → Cancel current mode (highlight/delete)
     D    → Start delete mode; press D again to remove the hovered element

     

- **Alt+Shift+B**: Toggle KeyPilot on/off
- **Alt+Shift+P**: Toggle debug mode
- **Alt+Shift+H**: Show/hide HUD
- **F**: Click element under cursor
- **H**: Enter multi-select mode
- **D**: Enter delete mode
- **K**: Copy element to clipboard
- **ESC**: Exit current mode


### HUD Information

The HUD displays:
- Current status and mode
- Keyboard shortcuts
- Hover mode settings (Clickable vs Any)
- Debug information
- Real-time element selection count

### Popup Interface

The popup provides:
- Quick enable/disable toggle
- Current HUD status overview
- HUD control buttons
- Keyboard shortcut reference
- Access to settings and test page

## Development

### Project Structure

```
keypilot-extension/
├── content/           # Content scripts
│   ├── content.js     # Main content script
│   └── keypilot-core.js # Core KeyPilot functionality
├── popup/             # Extension popup interface
│   ├── popup.html     # Popup HTML structure
│   ├── popup.css      # Popup styling
│   └── popup.js       # Popup functionality
├── background/        # Background script
├── options/           # Options page
├── icons/             # Extension icons
└── manifest.json      # Extension manifest
```

### Key Components

- **Content Script**: Manages KeyPilot lifecycle and communication
- **Core Module**: Handles cursor control, element manipulation, and HUD display
- **Popup Interface**: Provides user control and status overview
- **Message Protocol**: Structured communication between components

### Testing

Use the included test page (`test-extension-context.html`) to verify functionality:
1. Load the extension
2. Navigate to the test page
3. Test various KeyPilot features
4. Verify HUD integration and status updates

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.