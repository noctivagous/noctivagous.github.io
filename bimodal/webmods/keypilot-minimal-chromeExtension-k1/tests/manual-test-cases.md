# Manual Test Cases for Extension Toggle Functionality

## Test Environment Setup

1. Load the extension in Chrome Developer Mode
2. Open multiple tabs with different types of content:
   - Regular website (e.g., google.com)
   - Text-heavy site (e.g., wikipedia.org)
   - Site with shadow DOM (e.g., youtube.com)
   - Chrome extension page (chrome://extensions/)
   - Chrome settings (chrome://settings/)

## Test Case 1: Alt+K Keyboard Shortcut

### Test 1.1: Basic Toggle Functionality
**Steps:**
1. Open a regular website (e.g., google.com)
2. Verify KeyPilot is active (green crosshair cursor visible)
3. Press Alt+K
4. Verify notification appears: "KeyPilot Disabled"
5. Verify crosshair cursor disappears
6. Try pressing F, C, V, D keys - should not trigger KeyPilot actions
7. Press Alt+K again
8. Verify notification appears: "KeyPilot Enabled"
9. Verify crosshair cursor reappears
10. Test F key - should activate links under cursor

**Expected Results:**
- Toggle notifications appear and disappear smoothly
- Visual elements (crosshair) appear/disappear immediately
- Keyboard shortcuts work only when enabled
- State persists until next toggle

### Test 1.2: Multi-Tab Synchronization
**Steps:**
1. Open 3 tabs with different websites
2. Verify KeyPilot is active in all tabs
3. In tab 1, press Alt+K to disable
4. Switch to tab 2 - verify KeyPilot is disabled
5. Switch to tab 3 - verify KeyPilot is disabled
6. In tab 2, press Alt+K to enable
7. Switch to tab 1 - verify KeyPilot is enabled
8. Switch to tab 3 - verify KeyPilot is enabled

**Expected Results:**
- State changes immediately across all tabs
- No delay in synchronization
- Visual feedback consistent across tabs

### Test 1.3: Text Focus Mode Integration
**Steps:**
1. Open a website with text fields
2. Click in a text field to enter text focus mode
3. Verify orange message box appears in lower left
4. Press Alt+K to disable extension
5. Verify orange message box disappears immediately
6. Press Alt+K to enable extension
7. Verify orange message box reappears (if still in text field)

**Expected Results:**
- Text focus mode respects global toggle state
- Orange message box appears/disappears with toggle
- ESC key behavior changes with toggle state

## Test Case 2: Popup Toggle Switch

### Test 2.1: Visual State Indication
**Steps:**
1. Ensure extension is enabled
2. Click extension icon to open popup
3. Verify toggle switch shows "ON" state
4. Press Alt+K to disable extension
5. Open popup again
6. Verify toggle switch shows "OFF" state
7. Click toggle switch to enable
8. Verify toggle switch shows "ON" state

**Expected Results:**
- Toggle switch accurately reflects current state
- Visual feedback is immediate and clear
- Switch state updates when changed via Alt+K

### Test 2.2: Popup Toggle Functionality
**Steps:**
1. Open popup with extension enabled
2. Click toggle switch to disable
3. Verify extension becomes disabled across all tabs
4. Verify popup shows "OFF" state
5. Click toggle switch to enable
6. Verify extension becomes enabled across all tabs
7. Verify popup shows "ON" state

**Expected Results:**
- Popup toggle affects all tabs immediately
- State changes are synchronized
- No conflicts between popup and keyboard toggle

### Test 2.3: Status Display Integration
**Steps:**
1. Open popup with extension enabled
2. Verify status pill shows current mode (e.g., "NORMAL")
3. Click toggle switch to disable
4. Verify status pill shows "OFF"
5. Click toggle switch to enable
6. Verify status pill returns to mode display

**Expected Results:**
- Status display differentiates between disabled and mode states
- "OFF" state overrides mode-specific status
- Status updates immediately with toggle changes

## Test Case 3: State Persistence

### Test 3.1: Browser Session Persistence
**Steps:**
1. Enable extension and verify it's working
2. Press Alt+K to disable extension
3. Verify extension is disabled across all tabs
4. Close all browser windows
5. Restart Chrome
6. Open a new tab and navigate to a website
7. Verify extension remains disabled
8. Press Alt+K to enable
9. Close and restart browser again
10. Verify extension is now enabled

**Expected Results:**
- Disabled state persists across browser restarts
- Enabled state persists across browser restarts
- No reset to default state on restart

### Test 3.2: Extension Reload Persistence
**Steps:**
1. Disable extension via Alt+K
2. Go to chrome://extensions/
3. Click "Reload" on KeyPilot extension
4. Navigate to a regular website
5. Verify extension remains disabled
6. Enable via popup toggle
7. Reload extension again
8. Verify extension remains enabled

**Expected Results:**
- State persists through extension reloads
- No loss of user preference during development

## Test Case 4: Edge Cases and Error Handling

### Test 4.1: Restricted Pages Behavior
**Steps:**
1. Enable extension on regular website
2. Navigate to chrome://extensions/
3. Press Alt+K (should still work for global toggle)
4. Navigate back to regular website
5. Verify extension state changed globally
6. Test on chrome://settings/ and other restricted pages

**Expected Results:**
- Alt+K works on restricted pages for global toggle
- State changes affect regular pages appropriately
- No errors or crashes on restricted pages

### Test 4.2: Service Worker Inactive Recovery
**Steps:**
1. Enable extension and verify working
2. Wait for service worker to become inactive (5+ minutes idle)
3. Press Alt+K on a website
4. Verify service worker reactivates and processes toggle
5. Verify state change propagates to all tabs

**Expected Results:**
- Service worker reactivates on Alt+K command
- Toggle functionality works after reactivation
- No loss of functionality during inactive period

### Test 4.3: Storage Fallback Testing
**Steps:**
1. Use Chrome DevTools to simulate storage quota exceeded
2. Toggle extension state multiple times
3. Verify fallback to local storage works
4. Restart browser and verify state persistence
5. Clear storage and verify default state behavior

**Expected Results:**
- Graceful fallback to local storage
- No user-visible errors
- State persistence continues to work

## Test Case 5: Performance and User Experience

### Test 5.1: Toggle Response Time
**Steps:**
1. Open multiple tabs (10+) with various content
2. Press Alt+K and measure response time
3. Verify all tabs update within 100ms
4. Test popup toggle response time
5. Verify immediate visual feedback

**Expected Results:**
- Toggle response under 100ms
- No noticeable delay in visual feedback
- Smooth animations for notifications

### Test 5.2: Resource Usage
**Steps:**
1. Open Chrome Task Manager
2. Monitor extension memory usage
3. Toggle extension state multiple times
4. Verify no memory leaks
5. Test with many tabs open (20+)

**Expected Results:**
- Stable memory usage
- No significant resource consumption
- Scales well with multiple tabs

## Test Case 6: CSS Cleanup and Visual Element Removal

### Test 6.1: Complete CSS Cleanup on Disable
**Test File:** `test-css-cleanup.html`

**Steps:**
1. Load the KeyPilot extension and navigate to `test-css-cleanup.html`
2. Verify green crosshair cursor is visible
3. Hover over test elements to see green overlays
4. Open DevTools and inspect DOM for KeyPilot elements:
   - `#kpv2-cursor` (cursor SVG)
   - `#kpv2-style` (main stylesheet)
   - Elements with `kpv2-cursor-hidden` class on `<html>`
5. Press Alt+K to disable extension
6. Verify in DevTools that ALL KeyPilot elements are removed:
   - No `#kpv2-cursor` element in DOM
   - No `#kpv2-style` element in DOM
   - No `kpv2-cursor-hidden` class on `<html>`
   - No elements with KeyPilot CSS classes
7. Verify visually that no cursor SVG is stuck on page
8. Press Alt+K to enable extension
9. Verify all KeyPilot elements are restored correctly

**Expected Results:**
- ✅ Complete removal of all KeyPilot CSS and DOM elements when disabled
- ✅ No visual artifacts or stuck cursors
- ✅ Normal browser cursor restored when disabled
- ✅ Complete restoration of functionality when re-enabled
- ✅ No CSS injection errors in console

### Test 6.2: Cross-Tab CSS Cleanup
**Steps:**
1. Open 3 tabs, each with different content
2. Verify KeyPilot cursor and overlays work in all tabs
3. In tab 1, press Alt+K to disable
4. Check all tabs - verify no KeyPilot visual elements remain
5. Use DevTools in each tab to confirm DOM cleanup
6. In tab 2, press Alt+K to enable
7. Verify KeyPilot elements restored in all tabs

**Expected Results:**
- CSS cleanup happens immediately across all tabs
- No tab retains KeyPilot visual elements when disabled
- Restoration works correctly across all tabs

### Test 6.3: Shadow DOM CSS Cleanup
**Steps:**
1. Navigate to a site with shadow DOM (e.g., YouTube)
2. Verify KeyPilot works with shadow DOM elements
3. Press Alt+K to disable
4. Use DevTools to inspect shadow roots for KeyPilot styles
5. Verify no KeyPilot CSS remains in shadow DOM
6. Press Alt+K to enable
7. Verify shadow DOM functionality restored

**Expected Results:**
- Shadow DOM styles properly cleaned up
- No KeyPilot CSS artifacts in shadow roots
- Proper restoration of shadow DOM functionality

## Test Case 7: Integration with Existing Features

### Test 7.1: Mode Switching Integration
**Steps:**
1. Enable extension and enter delete mode (press D)
2. Verify red X cursor appears
3. Press Alt+K to disable
4. Verify red X cursor disappears
5. Press Alt+K to enable
6. Verify returns to normal mode (green crosshair)

**Expected Results:**
- Mode state resets appropriately on disable
- Clean return to normal mode on enable
- No stuck modes or visual artifacts

### Test 7.2: Scroll and Overlay Integration
**Steps:**
1. Open a long webpage
2. Scroll to middle of page
3. Press Alt+K to disable
4. Verify all overlays disappear
5. Scroll page and press Alt+K to enable
6. Verify overlays reappear at correct positions

**Expected Results:**
- Overlays properly cleaned up on disable
- Correct positioning on re-enable
- No visual glitches during scroll

## Success Criteria

All test cases should pass with:
- ✅ No JavaScript errors in console
- ✅ Smooth visual transitions
- ✅ Immediate state synchronization
- ✅ Persistent state across sessions
- ✅ Graceful error handling
- ✅ Good performance (< 100ms response)
- ✅ Clean integration with existing features

## Automated Test Execution

Run the automated test suite:
```bash
# Run unit tests
npm test tests/extension-toggle-manager.test.js

# Run integration tests  
npm test tests/toggle-integration.test.js

# Run all toggle-related tests
npm test -- --testPathPattern=toggle
```