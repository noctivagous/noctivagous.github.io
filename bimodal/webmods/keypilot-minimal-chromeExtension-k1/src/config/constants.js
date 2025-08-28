/**
 * Application constants and configuration
 */
export const KEYBINDINGS = {
  ACTIVATE: ['f', 'F'],
  BACK: ['c', 'C'],
  BACK2: ['s', 'S'],
  FORWARD: ['v', 'V'],
  DELETE: ['d', 'D'],
  HIGHLIGHT: ['h', 'H'],
  ROOT: ['`', 'Backquote'],
  CLOSE_TAB: ['/', '/'],
  CANCEL: ['Escape']
};

export const SELECTORS = {
  CLICKABLE: 'a[href], button, input, select, textarea',
  TEXT_INPUTS: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea',
  FOCUSABLE_TEXT: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]'
};

export const ARIA_ROLES = {
  CLICKABLE: ['link', 'button']
};

export const CSS_CLASSES = {
  CURSOR_HIDDEN: 'kpv2-cursor-hidden',
  FOCUS: 'kpv2-focus',
  DELETE: 'kpv2-delete',
  HIGHLIGHT: 'kpv2-highlight',
  HIDDEN: 'kpv2-hidden',
  RIPPLE: 'kpv2-ripple',
  FOCUS_OVERLAY: 'kpv2-focus-overlay',
  DELETE_OVERLAY: 'kpv2-delete-overlay',
  HIGHLIGHT_OVERLAY: 'kpv2-highlight-overlay',
  HIGHLIGHT_SELECTION: 'kpv2-highlight-selection',
  TEXT_FIELD_GLOW: 'kpv2-text-field-glow',
  VIEWPORT_MODAL_FRAME: 'kpv2-viewport-modal-frame',
  ACTIVE_TEXT_INPUT_FRAME: 'kpv2-active-text-input-frame',
  ESC_EXIT_LABEL: 'kpv2-esc-exit-label'
};

export const ELEMENT_IDS = {
  CURSOR: 'kpv2-cursor',
  STYLE: 'kpv2-style'
};

export const Z_INDEX = {
  VIEWPORT_MODAL_FRAME: 2147483645,
  OVERLAYS: 2147483646,
  CURSOR: 2147483647,
  MESSAGE_BOX: 2147483648
};

export const MODES = {
  NONE: 'none',
  DELETE: 'delete',
  TEXT_FOCUS: 'text_focus',
  HIGHLIGHT: 'highlight'
};

export const COLORS = {
  // Primary cursor colors
  FOCUS_GREEN: 'rgba(0,180,0,0.95)',
  FOCUS_GREEN_BRIGHT: 'rgba(0,128,0,0.95)',
  DELETE_RED: 'rgba(220,0,0,0.95)',
  HIGHLIGHT_BLUE: 'rgba(0,120,255,0.95)',
  ORANGE: '#ff8c00',

  // Text and background colors
  TEXT_WHITE_PRIMARY: 'rgba(255,255,255,0.95)',
  TEXT_WHITE_SECONDARY: 'rgba(255,255,255,0.8)',
  TEXT_GREEN_BRIGHT: '#6ced2b',

  // Background colors
  MESSAGE_BG_BROWN: '#ad6007',
  MESSAGE_BG_GREEN: '#10911b',

  // Border and shadow colors
  ORANGE_BORDER: 'rgba(255,140,0,0.4)',
  ORANGE_SHADOW: 'rgba(255,140,0,0.45)',
  ORANGE_SHADOW_DARK: 'rgba(255,140,0,0.8)',
  ORANGE_SHADOW_LIGHT: 'rgba(255,140,0,0.3)',
  GREEN_SHADOW: 'rgba(0,180,0,0.45)',
  GREEN_SHADOW_BRIGHT: 'rgba(0,180,0,0.5)',
  DELETE_SHADOW: 'rgba(220,0,0,0.35)',
  DELETE_SHADOW_BRIGHT: 'rgba(220,0,0,0.45)',
  HIGHLIGHT_SHADOW: 'rgba(0,120,255,0.35)',
  HIGHLIGHT_SHADOW_BRIGHT: 'rgba(0,120,255,0.45)',
  BLACK_SHADOW: 'rgba(40, 40, 40, 0.7)',

  // Ripple effect colors
  RIPPLE_GREEN: 'rgba(0,200,0,0.35)',
  RIPPLE_GREEN_MID: 'rgba(0,200,0,0.22)',
  RIPPLE_GREEN_TRANSPARENT: 'rgba(0,200,0,0)',

  // Flash animation colors
  FLASH_GREEN: 'rgba(0,255,0,1)',
  FLASH_GREEN_SHADOW: 'rgba(0,255,0,0.8)',
  FLASH_GREEN_GLOW: 'rgba(0,255,0,0.9)',

  // Notification colors
  NOTIFICATION_SUCCESS: '#4CAF50',
  NOTIFICATION_ERROR: '#f44336',
  NOTIFICATION_INFO: '#2196F3',
  NOTIFICATION_SHADOW: 'rgba(0, 0, 0, 0.15)',

  // Text field glow
  TEXT_FIELD_GLOW: 'rgba(255,165,0,0.8)',

  // Highlight selection colors
  HIGHLIGHT_SELECTION_BG: 'rgba(0,120,255,0.3)',
  HIGHLIGHT_SELECTION_BORDER: 'rgba(0,120,255,0.6)'
};

export const CURSOR_SETTINGS = {
  DEFAULT_SIZE: 1.0,
  MIN_SIZE: 0.5,
  MAX_SIZE: 2.0,
  SIZE_STEP: 0.1,
  DEFAULT_VISIBLE: true,
  STORAGE_KEYS: {
    SIZE: 'keypilot_cursor_size',
    VISIBLE: 'keypilot_cursor_visible'
  }
};