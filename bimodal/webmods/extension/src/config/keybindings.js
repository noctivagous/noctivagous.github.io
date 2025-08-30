/**
 * Keyboard bindings and input configuration
 */
export const KEYBINDINGS = {
  ACTIVATE: ['f', 'F'],
  ACTIVATE_NEW_TAB: ['g', 'G'],
  BACK: ['c', 'C'],
  BACK2: ['s', 'S'],
  FORWARD: ['r', 'R'],
  DELETE: ['d', 'D'],
  HIGHLIGHT: ['h', 'H'],
  RECTANGLE_HIGHLIGHT: ['y', 'Y'],
  TAB_LEFT: ['q', 'Q'],
  TAB_RIGHT: ['w', 'W'],
  ROOT: ['`', 'Backquote'],
  CLOSE_TAB: ['/', '/'],
  CANCEL: ['Escape'],
  OPEN_SETTINGS: ['Alt+0']
};

export const SELECTORS = {
  CLICKABLE: 'a[href], button, input, select, textarea',
  TEXT_INPUTS: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea',
  FOCUSABLE_TEXT: 'input[type="text"], input[type="search"], input[type="url"], input[type="email"], input[type="tel"], input[type="password"], input[type="number"], textarea, [contenteditable="true"]'
};

export const ARIA_ROLES = {
  CLICKABLE: ['link', 'button']
};
