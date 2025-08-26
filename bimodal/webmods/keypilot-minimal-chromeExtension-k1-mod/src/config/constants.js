/**
 * Application constants and configuration
 */
export const KEYBINDINGS = {
  ACTIVATE: ['f', 'F'],
  BACK: ['c', 'C'],
  BACK2: ['s', 'S'],
  FORWARD: ['v', 'V'],
  DELETE: ['d', 'D'],
  ROOT: ['`', 'Backquote'],
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
  HIDDEN: 'kpv2-hidden',
  RIPPLE: 'kpv2-ripple',
  FOCUS_OVERLAY: 'kpv2-focus-overlay',
  DELETE_OVERLAY: 'kpv2-delete-overlay',
  TEXT_FIELD_GLOW: 'kpv2-text-field-glow'
};

export const ELEMENT_IDS = {
  CURSOR: 'kpv2-cursor',
  STYLE: 'kpv2-style'
};

export const Z_INDEX = {
  OVERLAYS: 2147483646,
  CURSOR: 2147483647
};

export const MODES = {
  NONE: 'none',
  DELETE: 'delete',
  TEXT_FOCUS: 'text_focus'
};

export const COLORS = {
  FOCUS: 'rgba(0,180,0,0.95)',
  DELETE: 'rgba(220,0,0,0.95)',
  RIPPLE: 'rgba(0,200,0,0.35)'
};