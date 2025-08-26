# KeyPilot Chrome Extension

**Keyboard-first navigation for the web with instant visual feedback**

KeyPilot transforms your browsing experience by providing intuitive keyboard shortcuts for common web interactions, eliminating the need for mouse navigation. With the latest **Early Injection** technology, the interface appears instantly during page navigation for a seamless, persistent experience.

## ✨ Key Features

### 🚀 Instant Interface (New!)
- **HUD appears within 50ms** of page navigation
- **Cursor appears within 50ms** of page navigation  
- **No visual flickering** during page loads
- **Seamless navigation** between pages
- **State persistence** across all page changes

### ⌨️ Keyboard Navigation
- **F key**: Activate links and controls under cursor
- **C key**: Browser back navigation  
- **V key**: Browser forward navigation
- **D key**: Toggle delete mode / Delete elements
- **ESC key**: Cancel current mode / Exit text focus

### 🎛️ Global Controls
- **Alt+K**: Toggle entire extension on/off globally
- **Alt+H**: Toggle HUD (Heads-Up Display) interface
- **Extension Popup**: Mouse-based toggle controls
- **Cross-Tab Sync**: State changes apply to all open tabs instantly

### 🎯 Smart Modes
- **Normal Mode**: Green crosshair cursor with all shortcuts active
- **Text Focus Mode**: Automatic activation in text fields with orange crosshair
- **Delete Mode**: Red X cursor for element deletion
- **Disabled Mode**: Complete extension disable (no visual elements or shortcuts)

### 📊 HUD Interface
- **Real-time Status**: Current mode display in bottom-left corner
- **Toggle Controls**: Built-in switches for extension and HUD control
- **Expandable Instructions**: Collapsible keyboard shortcut reference
- **Tabbed Interface**: Organized controls and help sections
- **Dark Theme**: Semi-transparent design that doesn't interfere with content

## 🚀 What's New: Early Injection

KeyPilot now uses advanced **two-phase injection** technology:

### Before vs After
| Before | After |
|--------|-------|
| Interface appeared after 2-5 seconds | ✅ Interface appears within 50ms |
| Jarring "pop-in" effect | ✅ Seamless, persistent interface |
| Settings reset during navigation | ✅ State maintained across all pages |
| Disconnected experience | ✅ Fluid, native-feeling navigation |

### How It Works
1. **Instant Phase**: Critical visual elements appear immediately when navigation starts
2. **Full Phase**: Complete functionality loads after the page is ready
3. **State Bridge**: Seamless transition between phases with no data loss

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
| **Alt+H** | Toggle HUD interface | Always |

### Smart Text Field Handling
- **Automatic Detection**: Extension detects when you're in text fields
- **Context Switching**: Only ESC key intercepted in text mode
- **Visual Feedback**: Orange crosshair indicates text focus mode
- **F Key Activation**: Hover over text fields and press F to focus them

### HUD Interface Controls
- **Status Display**: Shows current mode (Normal, Delete, Text Focus)
- **Extension Toggle**: Enable/disable KeyPilot entirely
- **HUD Toggle**: Show/hide the HUD interface
- **Instructions Panel**: Expandable keyboard shortcut reference
- **Cross-Tab Sync**: Changes apply to all browser tabs instantly

## 🔧 Advanced Features

### Cross-Tab Synchronization
- Settings sync instantly across all open tabs
- HUD state maintained when opening new tabs
- Extension toggle affects all tabs simultaneously
- State persists across browser sessions

### Performance Optimization
- **< 10ms page load impact** with early injection
- **Minimal memory footprint** (~25KB during early phase)
- **Efficient DOM manipulation** with hardware acceleration
- **Smart caching** for instant state restoration

### Browser Compatibility
- ✅ **Chrome**: Full support (recommended)
- ✅ **Edge**: Full support  
- ⚠️ **Firefox**: Limited support
- ❌ **Safari**: Not supported

## 🛠️ Development

### Build System
```bash
# Build the extension
node build.js

# Run tests
npm test

# Run specific test suites
npm test -- tests/early-injection-unit.test.js
npm test -- tests/hud-cross-tab-sync.test.js
npm run test:toggle
```

### Project Structure
```
├── src/                          # Source modules
│   ├── config/constants.js       # Application constants
│   ├── modules/                  # Core functionality
│   │   ├── state-manager.js      # State management
│   │   ├── cursor.js             # Cursor overlay
│   │   ├── hud-manager.js        # HUD interface
│   │   └── ...                   # Other modules
│   ├── early-injection.js        # Early injection script
│   └── keypilot.js               # Main application
├── docs/                         # Documentation
├── tests/                        # Test suites
├── build.js                      # Build script
├── early-injection.js            # Generated early bundle
├── content-bundled.js            # Generated main bundle
└── manifest.json                 # Extension manifest
```

### Testing
```bash
# Unit tests
npm test -- tests/early-injection-unit.test.js

# Integration tests  
npm test -- tests/early-injection-integration.test.js

# Performance tests
npm test -- tests/early-injection-performance.test.js

# Manual testing
open test-early-injection-detection.html
open test-hud-integration.html
```

## 📚 Documentation

### User Guides
- [User Guide - Early Injection](docs/user-guide-early-injection.md)
- [Troubleshooting Edge Cases](docs/troubleshooting-edge-cases.md)

### Technical Documentation
- [Early Injection Architecture](docs/early-injection-architecture.md)
- [Debugging Guide](docs/early-injection-debugging.md)
- [Build and Deployment](docs/build-deployment.md)

### Specifications
- [Early Injection Spec](.kiro/specs/early-injection/)
- [HUD Interface Spec](.kiro/specs/hud-interface/)
- [Extension Toggle Spec](.kiro/specs/extension-toggle/)

## 🐛 Troubleshooting

### Common Issues

#### Interface Not Appearing Instantly
1. Check extension is enabled in `chrome://extensions/`
2. Reload the extension
3. Test on different websites

#### Settings Not Persisting
1. Verify storage permissions are granted
2. Test cross-tab sync by opening multiple tabs
3. Clear extension data and reconfigure

#### Performance Issues
1. Check if other extensions conflict
2. Test in incognito mode
3. Monitor browser console for errors

### Debug Mode
Enable detailed logging in browser console:
```javascript
window.KPV2_DEBUG_EARLY_INJECTION = true;
```

### Getting Help
1. Check the [troubleshooting guides](docs/)
2. Test in incognito mode to isolate issues
3. Report bugs with browser version and specific steps to reproduce

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Run `npm install` to install dependencies
3. Run `node build.js` to build the extension
4. Load in Chrome for testing

### Testing Guidelines
- Write tests for new features
- Ensure early injection performance < 10ms
- Test across different page types
- Verify cross-browser compatibility

### Code Style
- Use ES6+ features
- Follow modular architecture
- Add JSDoc comments for public APIs
- Maintain performance optimization

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Chrome Extension APIs for powerful browser integration
- Modern web standards for performance optimization
- Community feedback for user experience improvements

## 📈 Roadmap

### Upcoming Features
- **Custom Themes**: Personalize colors and styles
- **Advanced Gestures**: Mouse gesture support
- **Enhanced Performance**: Even faster injection times
- **Mobile Support**: Extension for mobile browsers

### Performance Goals
- **< 5ms early injection**: Further optimize initial load
- **< 20KB bundle size**: Reduce early injection payload
- **Universal compatibility**: Support more edge cases

---

**Experience the web like never before with KeyPilot's instant, keyboard-first navigation.**