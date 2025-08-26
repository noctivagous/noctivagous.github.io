# Early Injection Styles Documentation

## Overview

The early injection styles module provides critical CSS and HTML generation for immediate visual feedback during page load. This is part of the two-phase injection strategy that ensures the HUD and cursor appear within 50ms of page navigation.

## Architecture

### Critical CSS Extraction

The module extracts only the essential styles needed for immediate visibility:

1. **Cursor Positioning**: Fixed positioning with CSS custom properties for performance
2. **HUD Layout**: Basic positioning and styling for immediate visibility
3. **High Specificity**: Uses `!important` declarations to override page styles
4. **Minimal Payload**: Optimized for fast injection at `document_start`

### Performance Characteristics

- **CSS Payload**: < 5KB for fast injection
- **SVG Generation**: Lightweight inline SVG for cursor modes
- **DOM Manipulation**: Efficient element creation and injection
- **Memory Usage**: Minimal footprint during early injection phase

## API Reference

### Core Functions

#### `getCriticalCSS()`
Returns the combined critical CSS for both cursor and HUD elements.

```javascript
const css = getCriticalCSS();
// Returns: Complete critical CSS string
```

#### `getCriticalCursorCSS()`
Returns only the cursor-specific critical CSS.

```javascript
const cursorCSS = getCriticalCursorCSS();
// Includes: positioning, z-index, cursor hiding
```

#### `getCriticalHUDCSS()`
Returns only the HUD-specific critical CSS.

```javascript
const hudCSS = getCriticalHUDCSS();
// Includes: positioning, basic styling, status bar layout
```

#### `injectCriticalStyles()`
Injects critical styles into the document with fallback handling.

```javascript
const success = injectCriticalStyles();
// Returns: true if injection succeeded, false otherwise
```

**Features:**
- Prevents duplicate injection
- Handles missing `document.head`
- Adds cursor hidden class automatically
- Uses MutationObserver fallback for early DOM states

#### `createMinimalCursorSVG(mode)`
Generates lightweight SVG for cursor display.

```javascript
const svg = createMinimalCursorSVG('none');     // Green crosshair
const svg = createMinimalCursorSVG('delete');   // Red X
const svg = createMinimalCursorSVG('text_focus'); // Orange crosshair
```

**Modes:**
- `'none'` (default): Green crosshair for normal mode
- `'delete'`: Red X pattern for delete mode
- `'text_focus'`: Orange crosshair for text focus mode

#### `createMinimalHUDHTML()`
Generates minimal HUD HTML structure for placeholder.

```javascript
const html = createMinimalHUDHTML();
// Returns: Basic HUD structure with placeholders
```

## CSS Architecture

### Cursor Styles

```css
#kpv2-cursor { 
  position: fixed !important; 
  left: var(--cursor-x, 0) !important; 
  top: var(--cursor-y, 0) !important; 
  transform: translate(-50%, -50%) !important; 
  z-index: 2147483647 !important; 
  pointer-events: none !important;
  display: block !important;
  visibility: visible !important;
  will-change: transform, left, top !important;
}

html.kpv2-cursor-hidden, 
html.kpv2-cursor-hidden * { 
  cursor: none !important; 
}
```

**Key Features:**
- CSS custom properties for performance (`--cursor-x`, `--cursor-y`)
- Maximum z-index for layering (2147483647)
- Hardware acceleration hints (`will-change`)
- Cursor hiding for entire page

### HUD Styles

```css
.kpv2-hud {
  position: fixed;
  bottom: 20px;
  left: 20px;
  z-index: 2147483647;
  /* Basic styling for immediate visibility */
  background: rgba(0, 0, 0, 0.9);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  backdrop-filter: blur(10px);
  /* ... */
}
```

**Key Features:**
- Fixed positioning in bottom-left corner
- Semi-transparent background with blur
- Responsive sizing constraints
- Status bar layout structure

## Integration Points

### Early Injection Script

The styles are designed to be injected by the early injection script at `document_start`:

```javascript
import { injectCriticalStyles } from './early-injection-styles.js';

// Inject immediately when script runs
injectCriticalStyles();
```

### Main Script Enhancement

The main script detects and enhances the placeholder elements:

```javascript
// Detect existing early injection elements
const existingCursor = document.getElementById('kpv2-cursor');
const existingHUD = document.getElementById('kpv2-hud');

if (existingCursor) {
  // Enhance cursor with full functionality
  cursorManager.enhance(existingCursor);
}

if (existingHUD) {
  // Enhance HUD with full functionality
  hudManager.enhance(existingHUD);
}
```

## Performance Considerations

### Injection Timing

- **Target**: < 5ms execution time at `document_start`
- **Payload**: < 5KB total CSS size
- **DOM Operations**: Minimal element creation and insertion

### Memory Usage

- **CSS**: Inline styles to avoid additional HTTP requests
- **SVG**: Inline SVG strings to avoid external resources
- **DOM**: Minimal element creation during early phase

### Browser Compatibility

- **CSS Custom Properties**: Supported in all modern browsers
- **Backdrop Filter**: Graceful degradation if not supported
- **Fixed Positioning**: Universal support
- **High Z-Index**: Ensures layering across all browsers

## Testing

The module includes comprehensive tests covering:

- CSS generation and structure
- Style injection mechanisms
- SVG generation for all cursor modes
- HUD HTML structure
- Performance characteristics
- CSS specificity and isolation

Run tests with:
```bash
npm test -- tests/early-injection-styles-simple.test.js
```

## Error Handling

### Injection Failures

- **Missing Head**: Falls back to `document.documentElement`
- **DOM Not Ready**: Uses MutationObserver to wait for DOM
- **Style Conflicts**: High specificity with `!important`
- **Duplicate Injection**: Checks for existing elements

### Graceful Degradation

- **CSS Unsupported**: Basic positioning still works
- **SVG Issues**: Fallback to text-based cursors
- **Performance Issues**: Minimal impact on page load

## Future Enhancements

### Planned Improvements

1. **Dynamic CSS Variables**: Runtime theme adaptation
2. **Reduced Payload**: Further CSS optimization
3. **Enhanced Fallbacks**: Better error recovery
4. **Performance Monitoring**: Injection timing metrics

### Extension Points

- **Custom Themes**: CSS variable-based theming
- **Additional Modes**: New cursor modes and styles
- **Layout Options**: Alternative HUD positioning
- **Animation Support**: Smooth transitions during enhancement