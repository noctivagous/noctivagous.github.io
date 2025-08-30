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

### ⌨️ Operation Modes
- **D key**: Toggle delete mode / Delete elements
- **H key**: Character-level text selection (default highlight mode)
- **R key**: Rectangle text selection (area-based highlight mode)
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
- **Character Selection Mode**: H key enables character-level text selection (like click-and-drag)
- **Rectangle Selection Mode**: R key enables rectangular area text selection
- **Disabled Mode**: Complete extension disable (no visual elements or shortcuts)


## 📝 Text Selection Features

KeyPilot offers two powerful text selection modes that both show the same visual rectangle overlay:

### Character-Level Selection (H key - Default)
- **Natural text flow**: Selects text character by character within the rectangle, following natural reading flow
- **Cross-element selection**: Works seamlessly across different HTML elements and text nodes
- **Rectangle overlay**: Shows the same visual rectangle as rectangle mode for consistent UX
- **Usage**: Press H to start, move cursor to extend rectangle, press H again to copy text within rectangle

### Rectangle Selection (R key)
- **Area-based selection**: Selects all text that intersects with the rectangular region
- **Column selection**: Perfect for selecting columns of data or specific rectangular text areas
- **Same visual rectangle**: Uses identical rectangle overlay as character mode
- **Usage**: Press R to start, drag to create rectangle, press R again to copy all text in rectangle

### Unified Visual Experience
- **Same Rectangle Overlay**: Both modes show identical visual rectangle during selection
- **Different Selection Logic**: H selects flowing text within rectangle, R selects all intersecting text
- **Consistent Interaction**: Same drag-to-extend behavior for both modes
- **Mode Indicators**: Clear labels show which selection type is active

### Selection Workflow
1. Position cursor over desired text
2. Press **H** for character selection or **R** for rectangle selection
3. Move cursor to extend selection rectangle (same visual feedback for both modes)
4. Press **H** or **R** again to copy selected text to clipboard
5. Press **ESC** to cancel selection without copying

Both modes provide identical visual feedback with the rectangle overlay, but use different text selection algorithms underneath.

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
2. Run `npm run build` to build the extension (builds from `extension/` subdirectory)
3. Open `chrome://extensions/`
4. Enable "Developer mode"
5. Click "Load unpacked" and select the `extension/` subdirectory

## 🎮 Usage Guide

### Getting Started
1. **Install the extension** and grant permissions
2. **Navigate to any webpage** - the HUD and cursor appear instantly
3. **Move your mouse** to see the green crosshair cursor
4. **Press F** while hovering over links to activate them
5. **Press Alt+H** to toggle the HUD interface


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

The project is organized with a clear separation between extension code and project management files:

```
KeyPilot/
├── 📄 README.md                  # Project overview and documentation
├── 📄 package.json               # Node.js dependencies and scripts
├── 📄 babel.config.cjs           # Babel configuration
│
├── 📁 extension/                 # Chrome extension code
│   ├── 📄 manifest.json          # Chrome extension configuration
│   ├── 📄 background.js          # Service worker for global commands
│   ├── 📄 content-bundled.js     # Generated content script (do not edit)
│   ├── 📄 build.js               # Build system for bundling modules
│   ├── 📄 popup.html             # Extension popup interface
│   ├── 📄 popup.js               # Popup functionality
│   │
│   ├── 📁 src/                   # Source modules (edit these)
│   │   ├── 📄 content-script.js  # Entry point for content script
│   │   ├── 📄 keypilot.js        # Main orchestrator class
│   │   │
│   │   ├── 📁 config/
│   │   │   └── 📄 constants.js   # Central configuration constants
│   │   │
│   │   ├── 📁 modules/           # Core functionality modules
│   │   │   ├── 📄 state-manager.js           # Global state with subscriber pattern
│   │   │   ├── 📄 event-manager.js           # Base class for event handling
│   │   │   ├── 📄 cursor.js                  # Visual cursor overlays
│   │   │   ├── 📄 element-detector.js        # DOM traversal & classification
│   │   │   ├── 📄 activation-handler.js      # Click/interaction logic
│   │   │   ├── 📄 focus-detector.js          # Text field detection
│   │   │   ├── 📄 overlay-manager.js         # Visual feedback system
│   │   │   ├── 📄 keypilot-toggle-handler.js # Cross-tab state sync
│   │   │   ├── 📄 optimized-scroll-manager.js # Scroll optimization
│   │   │   ├── 📄 intersection-observer-manager.js # Performance monitoring
│   │   │   ├── 📄 shadow-dom-manager.js      # Shadow DOM support
│   │   │   └── 📄 style-manager.js           # CSS injection management
│   │   │
│   │   └── 📁 utils/             # Utility functions
│   │       └── 📄 logger.js      # Logging utilities
│   │
│   ├── 📁 styles/
│   │   └── 📄 popup.css          # Popup styling
│   │
│   ├── 📁 icons/                 # Extension icons
│   │   ├── 📄 icon.svg           # Source icon
│   │   ├── 📄 icon16.png         # 16x16 icon
│   │   ├── 📄 icon48.png         # 48x48 icon
│   │   └── 📄 icon128.png        # 128x128 icon
│   │
│   ├── 📁 tests/                 # Test suites
│   │   ├── 📄 setup.js           # Test configuration
│   │   ├── 📄 *.test.js          # Jest unit and integration tests
│   │   └── 📄 manual-*.md        # Manual testing procedures
│   │
│   └── 📁 test-pages/            # HTML test files for manual testing
│       └── 📄 test-*.html        # Interactive test pages
│
├── 📁 docs/                      # Project documentation
│   ├── 📁 architecture/          # Architecture and design documents
│   ├── 📁 performance/           # Performance analysis and reports
│   └── 📁 compatibility/         # Browser compatibility documentation
│
├── 📁 .kiro/                     # Kiro IDE configuration and specs
├── 📁 .vscode/                   # VS Code settings
├── 📁 .git/                      # Git repository
└── 📁 node_modules/              # Dependencies
```

### Key Files Explained

#### Extension Directory (`extension/`)
All Chrome extension code is contained within the `extension/` subdirectory:

- **`manifest.json`**: Chrome extension configuration and permissions
- **`background.js`**: Service worker handling global shortcuts (Alt+K)
- **`content-bundled.js`**: Auto-generated from `src/` modules (never edit directly)
- **`build.js`**: Bundles ES6 modules into browser-compatible code

#### Source Architecture (`extension/src/`)
- **`content-script.js`**: Entry point that instantiates the main KeyPilot class
- **`keypilot.js`**: Main orchestrator that coordinates all modules
- **`config/constants.js`**: Central configuration for keybindings and selectors
- **`modules/`**: Single-responsibility classes following dependency injection pattern

#### Documentation (`docs/`)
- **`architecture/`**: Design documents and architectural decisions
- **`performance/`**: Performance analysis and optimization reports
- **`compatibility/`**: Browser compatibility testing and results

#### Development Workflow
1. **Edit**: Modify files in `extension/src/` directory or `extension/background.js`
2. **Build**: Run `npm run build` to regenerate `extension/content-bundled.js`
3. **Test**: Reload extension in Chrome from the `extension/` directory
4. **Debug**: Use browser console and test files in `extension/test-pages/`

## 📚 Documentation

For detailed technical documentation, see the `docs/` directory:

- **[Architecture Documentation](docs/architecture/)**: Design decisions, implementation details, and architectural patterns
- **[Performance Documentation](docs/performance/)**: Performance analysis, optimization reports, and benchmarking results
- **[Compatibility Documentation](docs/compatibility/)**: Browser compatibility testing results and cross-platform considerations

## 🛠️ Development

### Build System
```bash
# Build the extension (runs from extension/ subdirectory)
npm run build

# Alternative: build directly from extension directory
cd extension && node build.js


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

