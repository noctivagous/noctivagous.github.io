# KeyPilot Chrome Extension

**Keyboard-first navigation for the web with instant visual feedback**

KeyPilot transforms your browsing experience by providing intuitive keyboard 
shortcuts for common web interactions, eliminating the need for mouse navigation. 



## 📦 Installation

### Manual Installation (PREVIEW)
1. Open `chrome://extensions/`
2. Enable "Developer mode" by clicking the switch.
3. Click "Load unpacked". Select the `extension/` subdirectory.


- **Extension Popup**: Shows how to use it.


## ✨ Key Features

### ⌨️ Keyboard Navigation
- **F key**: Activate links and controls under cursor
- **S key**: Browser back navigation  
- **R key**: Browser forward navigation
- **Q key**: Move tab left
- **W key**: Move tab right


### ⌨️ Operation Modes

- **Navigation Mode**: Green crosshair cursor with all shortcuts active
- **F key**: Activate links and controls under cursor
		- **Text Focus Mode**: Activation of text fields with orange crosshair and orange labels
		ESC key will exit Text Focus Mode or it will click
		the element located underneath it.

- **Delete Mode**: Red X cursor for element deletion
- **D key**: Toggle delete mode / Delete elements
	
- **Character Selection Mode**: H key enables character-level text selection (like click-and-drag)
- **H key**: Character-level text selection (default highlight mode)

- **R key**: Rectangle text selection (area-based highlight mode)
- **Rectangle Selection Mode**: R key enables rectangular area text selection

- **ESC key**: Cancel current mode / Exit text focus
- **/ key**: Close current tab


- **Alt+K**: Toggle entire extension on/off globally across all tabs.
	- **Disabled Mode**: Complete extension disable (no visual elements or shortcuts)
	- **Cross-Tab Sync**: State changes apply to all open tabs instantly.


### 🎛️ Modes



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


- **Automatic Detection**: Extension detects when you're in text fields
- **Context Switching**: Only ESC key intercepted in text mode
- **Visual Feedback**: Orange crosshair indicates text focus mode
- **F Key Activation**: Hover over text fields and press F to focus them


### Browser Compatibility
- ✅ **Chrome**: Full support (recommended)
- ✅ **Edge**: Full support  
- ⚠️ **Firefox**: Limited support
- ❌ **Safari**: Not supported


NOCTIVAGOUS 2025

