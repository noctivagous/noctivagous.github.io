# KeyPilot Chrome Extension

**Keyboard-first navigation for the web with instant visual feedback**

KeyPilot transforms your browsing experience by providing intuitive keyboard 
shortcuts for common web interactions, eliminating the need for mouse navigation. 


KeyPilot Chrome Extension
------------------------------------

**Keyboard-first navigation for the web with instant visual feedback**

KeyPilot transforms your browsing experience by providing keyboard shortcuts for common web interactions, eliminating the 
need for mouse navigation.


## ✨ Key Features

### ⌨️ Keyboard Navigation
- **F key**: Activate links and controls under cursor
- **S key**: Browser back navigation  
- **V key**: Browser forward navigation
- **D key**: Toggle delete mode / Delete elements
- **ESC key**: Cancel current mode / Exit text focus
- **/ key**: Close current tab


### 🎛️ Global Controls
- **Alt+K**: Toggle entire extension on/off globally across all tabs.
- **Extension Popup**: Shows how to use it.
- **Cross-Tab Sync**: State changes apply to all open tabs instantly.

### 🎯 Smart Modes
- **Normal Mode**: Green crosshair cursor with all shortcuts active
- **Text Focus Mode**: Automatic activation in text fields with orange crosshair
- **Delete Mode**: Red X cursor for element deletion
- **Disabled Mode**: Complete extension disable (no visual elements or shortcuts)


There are two main modes in play unless the user
activates a separate one, the delete mode.

The two main activities a user engages in while using
a web browser is either clicking on links
or entering and editing text in a text field.

The extension has its own criteria of what is
clickable under the mouse.  On hover, 
clickable link objects are outlined with a green rectangle. 
Clickable text fields (inputs with text, textarea, etc.)
are given an orange outline.

There is one main mode monitored, which is text mode (text entry).
That is when keys will enter text into a text field and
the only key that KeyPilot monitors is the ESC key, which
will move the mode back to hovering over page elements.
A text mode is activated either because the page focused on a text field,
usually on load, or the user clicked a text field (with regular mouse button
clicks or the F key in KeyPilot).  This triggers a 
semi-transparent overlay frame around the page frame as an internal
border of the web page and then the orange outlines
stays in place on the text field. 

The D key activates a selection hovering mode where
the outlines is red and the second press of D deletes
that page element.  The ESC key escapes the delete mode.




## 📦 Installation

### From Chrome Web Store (Recommended)
1. Visit the Chrome Web Store
2. Search for "KeyPilot"
3. Click "Add to Chrome"
4. Grant necessary permissions

### Manual Installation (Development)
1. Download or clone this repository
2. Run `node build.js` to build the extension
3. Open `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the project directory

## 🎮 Usage Guide

### Getting Started
1. **Install the extension** and grant permissions
2. **Navigate to any webpage** - the HUD and cursor appear instantly
3. **Move your mouse** to see the green crosshair cursor
4. **Press F** while hovering over links to activate them
5. **Press Alt+H** to toggle the HUD interface

### Keyboard Shortcuts

| Shortcut | Action | Available In |
|----------|--------|--------------|
| **F** | Activate element under cursor | Normal mode |
| **C** | Browser back | Normal mode |
| **V** | Browser forward | Normal mode |
| **D** | Toggle delete mode / Delete element | Normal mode |
| **ESC** | Cancel mode / Exit text focus | All modes |
| **Alt+K** | Toggle extension globally | Always |


### Smart Text Field Handling
- **Automatic Detection**: Extension detects when you're in text fields
- **Context Switching**: Only ESC key intercepted in text mode
- **Visual Feedback**: Orange crosshair indicates text focus mode
- **F Key Activation**: Hover over text fields and press F to focus them


## 🔧 Advanced Features

### Cross-Tab Synchronization
- Settings sync instantly across all open tabs
- Extension toggle affects all tabs simultaneously
- State persists across browser sessions


### Browser Compatibility
- ✅ **Chrome**: Full support (recommended)
- ✅ **Edge**: Full support  
- ⚠️ **Firefox**: Limited support
- ❌ **Safari**: Not supported

## 📁 Project Structure

```
KeyPilot/
├── 📄 manifest.json              # Chrome extension configuration
├── 📄 background.js              # Service worker for global commands
├── 📄 content-bundled.js         # Generated content script (do not edit)
├── 📄 build.js                   # Build system for bundling modules
├── 📄 popup.html                 # Extension popup interface
├── 📄 popup.js                   # Popup functionality
├── 📄 page.js                    # Page-level scripts
├── 📄 package.json               # Node.js dependencies and scripts
├── 📄 babel.config.cjs           # Babel configuration
│
├── 📁 src/                       # Source modules (edit these)
│   ├── 📄 content-script.js      # Entry point for content script
│   ├── 📄 keypilot.js            # Main orchestrator class
│   │
│   ├── 📁 config/
│   │   └── 📄 constants.js       # Central configuration constants
│   │
│   ├── 📁 modules/               # Core functionality modules
│   │   ├── 📄 state-manager.js           # Global state with subscriber pattern
│   │   ├── 📄 event-manager.js           # Base class for event handling
│   │   ├── 📄 cursor.js                  # Visual cursor overlays
│   │   ├── 📄 element-detector.js        # DOM traversal & classification
│   │   ├── 📄 activation-handler.js      # Click/interaction logic
│   │   ├── 📄 focus-detector.js          # Text field detection
│   │   ├── 📄 overlay-manager.js         # Visual feedback system
│   │   ├── 📄 keypilot-toggle-handler.js # Cross-tab state sync
│   │   ├── 📄 optimized-scroll-manager.js # Scroll optimization
│   │   ├── 📄 intersection-observer-manager.js # Performance monitoring
│   │   ├── 📄 shadow-dom-manager.js      # Shadow DOM support
│   │   └── 📄 style-manager.js           # CSS injection management
│   │
│   └── 📁 utils/                 # Utility functions
│
├── 📁 styles/
│   └── 📄 popup.css              # Popup styling
│
├── 📁 icons/                     # Extension icons
│   ├── 📄 icon.svg               # Source icon
│   ├── 📄 icon16.png             # 16x16 icon
│   ├── 📄 icon48.png             # 48x48 icon
│   └── 📄 icon128.png            # 128x128 icon
│
├── 📁 tests/                     # Test suites
│   ├── 📄 setup.js               # Test configuration
│   ├── 📄 esc-exit-label.test.js # ESC key functionality tests
│   ├── 📄 esc-exit-label-simple.test.js # Simplified ESC tests
│   └── 📄 manual-esc-exit-label-test.md # Manual testing procedures
│
├── 📁 .kiro/                     # Kiro IDE configuration
├── 📁 .vscode/                   # VS Code settings
├── 📁 .git/                      # Git repository
└── 📁 node_modules/              # Dependencies
```

### Key Files Explained

#### Core Extension Files
- **`manifest.json`**: Chrome extension configuration and permissions
- **`background.js`**: Service worker handling global shortcuts (Alt+K)
- **`content-bundled.js`**: Auto-generated from `src/` modules (never edit directly)
- **`build.js`**: Bundles ES6 modules into browser-compatible code

#### Source Architecture (`src/`)
- **`content-script.js`**: Entry point that instantiates the main KeyPilot class
- **`keypilot.js`**: Main orchestrator that coordinates all modules
- **`config/constants.js`**: Central configuration for keybindings and selectors
- **`modules/`**: Single-responsibility classes following dependency injection pattern

#### Development Workflow
1. **Edit**: Modify files in `src/` directory or `background.js`
2. **Build**: Run `node build.js` to regenerate `content-bundled.js`
3. **Test**: Reload extension in Chrome and validate functionality
4. **Debug**: Use browser console and test files for validation

## 🛠️ Development

### Build System
```bash
# Build the extension
node build.js


### Testing Guidelines
- Write tests for new features
- Test across different page types
- Verify cross-browser compatibility

### Code Style
- Use ES6+ features
- Follow modular architecture
- Add JSDoc comments for public APIs
- Maintain performance optimization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

