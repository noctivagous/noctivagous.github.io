/**
 * Critical styles for early injection
 * Contains minimal CSS needed for immediate HUD and cursor visibility
 */

/**
 * Get critical CSS for cursor element - Optimized for minimal size
 * This includes only the essential positioning and visibility styles
 */
export function getCriticalCursorCSS() {
  return `#kpv2-cursor{position:fixed!important;left:var(--cursor-x,0)!important;top:var(--cursor-y,0)!important;transform:translate(-50%,-50%)!important;z-index:2147483647!important;pointer-events:none!important;display:block!important;visibility:visible!important;will-change:transform,left,top!important}html.kpv2-cursor-hidden,html.kpv2-cursor-hidden *{cursor:none!important}`;
}

/**
 * Get critical CSS for HUD element - Optimized for minimal size
 * This includes only the essential positioning and basic styling
 */
export function getCriticalHUDCSS() {
  return `.kpv2-hud{position:fixed;bottom:20px;left:20px;z-index:2147483647;font-family:system-ui,-apple-system,sans-serif;font-size:12px;background:rgba(0,0,0,.9);border:1px solid rgba(255,255,255,.2);border-radius:8px;backdrop-filter:blur(10px);box-shadow:0 4px 20px rgba(0,0,0,.3);min-width:200px;max-width:300px;pointer-events:auto;display:block;visibility:visible}.kpv2-hud-status-bar{display:flex;align-items:center;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,.1)}.kpv2-hud-mode-indicator{flex:1}.kpv2-hud-mode-text{color:#fff;font-weight:500;font-size:12px}.kpv2-hud-controls{display:flex;align-items:center;gap:8px}.kpv2-hud-expand-btn{background:none;border:none;color:rgba(255,255,255,.7);cursor:pointer;padding:4px;border-radius:4px;transition:color .2s ease,background-color .2s ease;margin-left:8px}.kpv2-hud-expand-icon{display:inline-block;font-size:10px;transition:transform .2s ease}.kpv2-hud-instructions{border-top:1px solid rgba(255,255,255,.1);display:none}.kpv2-hud.kpv2-hidden{display:none!important}`;
}

/**
 * Get combined critical CSS for early injection
 * This is the minimal CSS needed for immediate visual feedback
 */
export function getCriticalCSS() {
  return getCriticalCursorCSS() + '\n' + getCriticalHUDCSS();
}

/**
 * Optimized style injection method for early injection - Minimal payload
 * Uses the most efficient DOM manipulation for document_start timing
 */
export function injectCriticalStyles() {
  if (document.getElementById('kpv2-early-styles')) return;

  try {
    const style = document.createElement('style');
    style.id = 'kpv2-early-styles';
    style.textContent = getCriticalCSS();
    
    // Optimized DOM insertion
    const target = document.head || document.documentElement;
    if (target) {
      target.appendChild(style);
    } else {
      // Minimal fallback
      const observer = new MutationObserver((_, obs) => {
        const newTarget = document.head || document.documentElement;
        if (newTarget) {
          newTarget.appendChild(style);
          obs.disconnect();
        }
      });
      observer.observe(document, { childList: true });
    }
    
    // Hide default cursor immediately
    if (document.documentElement) {
      document.documentElement.classList.add('kpv2-cursor-hidden');
    }
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.error('[EarlyInjection] Style injection failed:', error);
    }
  }
}

/**
 * Create minimal cursor SVG for early injection - Optimized for size
 * Returns a lightweight SVG string for immediate cursor display
 */
export function createMinimalCursorSVG(mode = 'none') {
  const NS = 'http://www.w3.org/2000/svg';
  
  if (mode === 'text_focus') {
    return `<svg xmlns="${NS}" viewBox="0 0 94 94" width="94" height="94"><line x1="47" y1="10" x2="47" y2="34" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/><line x1="47" y1="60" x2="47" y2="84" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/><line x1="10" y1="47" x2="34" y2="47" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/><line x1="60" y1="47" x2="84" y2="47" stroke="#ff8c00" stroke-width="4" stroke-linecap="round"/></svg>`;
  } else if (mode === 'delete') {
    return `<svg xmlns="${NS}" viewBox="0 0 94 94" width="94" height="94"><line x1="18" y1="18" x2="76" y2="76" stroke="rgba(220,0,0,0.95)" stroke-width="5" stroke-linecap="round"/><line x1="76" y1="18" x2="18" y2="76" stroke="rgba(220,0,0,0.95)" stroke-width="5" stroke-linecap="round"/></svg>`;
  } else {
    return `<svg xmlns="${NS}" viewBox="0 0 94 94" width="94" height="94"><line x1="47" y1="10" x2="47" y2="34" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/><line x1="47" y1="60" x2="47" y2="84" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/><line x1="10" y1="47" x2="34" y2="47" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/><line x1="60" y1="47" x2="84" y2="47" stroke="rgba(0,128,0,0.95)" stroke-width="4" stroke-linecap="round"/></svg>`;
  }
}

/**
 * Create minimal HUD HTML structure for early injection - Optimized for size
 * Returns a lightweight HTML string for immediate HUD display
 */
export function createMinimalHUDHTML() {
  return `<div class="kpv2-hud-status-bar"><div class="kpv2-hud-mode-indicator"><span class="kpv2-hud-mode-text">Normal Mode</span></div><div class="kpv2-hud-controls"></div><button class="kpv2-hud-expand-btn" aria-label="Expand HUD"><span class="kpv2-hud-expand-icon">▲</span></button></div><div class="kpv2-hud-instructions"></div>`;
}

/**
 * Create early HUD placeholder element - Optimized for speed
 * Creates a basic HUD DOM structure with minimal styling for immediate visibility
 */
export function createEarlyHUDPlaceholder() {
  const existing = document.getElementById('kpv2-hud');
  if (existing) return existing;

  try {
    const hud = document.createElement('div');
    hud.id = 'kpv2-hud';
    hud.className = 'kpv2-hud';
    hud.setAttribute('data-early-injection', 'true');
    hud.innerHTML = createMinimalHUDHTML();
    
    // Optimized DOM insertion
    const target = document.body || document.documentElement;
    if (target) {
      target.appendChild(hud);
    } else {
      // Minimal fallback
      const observer = new MutationObserver((_, obs) => {
        const newTarget = document.body || document.documentElement;
        if (newTarget) {
          newTarget.appendChild(hud);
          obs.disconnect();
        }
      });
      observer.observe(document, { childList: true });
    }
    
    return hud;
  } catch (error) {
    if (typeof console !== 'undefined') {
      console.error('[EarlyInjection] HUD creation failed:', error);
    }
    return null;
  }
}

/**
 * Update HUD placeholder with current state
 * Restores HUD visibility and mode from storage for immediate display
 */
export async function updateHUDPlaceholderState() {
  const hudElement = document.getElementById('kpv2-hud');
  if (!hudElement) {
    console.warn('[EarlyInjection] No HUD placeholder found to update');
    return;
  }

  try {
    // Load HUD state from storage
    const hudState = await loadEarlyHUDState();
    
    // Update visibility
    if (!hudState.visible) {
      hudElement.classList.add('kpv2-hidden');
    } else {
      hudElement.classList.remove('kpv2-hidden');
    }
    
    // Update mode display if we can determine it
    const modeText = hudElement.querySelector('.kpv2-hud-mode-text');
    if (modeText && hudState.mode) {
      const modeDisplayMap = {
        'none': 'Normal Mode',
        'delete': 'Delete Mode',
        'text_focus': 'Text Focus Mode'
      };
      modeText.textContent = modeDisplayMap[hudState.mode] || 'Normal Mode';
    }
    
    console.log('[EarlyInjection] HUD placeholder state updated:', hudState);
  } catch (error) {
    console.error('[EarlyInjection] Failed to update HUD placeholder state:', error);
    // Continue with default visible state
  }
}

/**
 * Load early HUD state from storage
 * Simplified version for early injection with minimal dependencies
 */
async function loadEarlyHUDState() {
  const defaultState = {
    visible: true,
    expanded: false,
    mode: 'none'
  };

  try {
    // Storage keys matching HUDManager
    const storageKeys = {
      HUD_VISIBLE: 'keypilot_hud_visible',
      HUD_EXPANDED: 'keypilot_hud_expanded'
    };

    let storageResult = {};

    try {
      // Try chrome.storage.sync first
      storageResult = await chrome.storage.sync.get([
        storageKeys.HUD_VISIBLE,
        storageKeys.HUD_EXPANDED
      ]);
      
      // Check if we got any HUD data from sync storage
      if (storageResult[storageKeys.HUD_VISIBLE] === undefined) {
        throw new Error('No HUD data in sync storage');
      }
    } catch (syncError) {
      // Fallback to chrome.storage.local
      try {
        storageResult = await chrome.storage.local.get([
          storageKeys.HUD_VISIBLE,
          storageKeys.HUD_EXPANDED
        ]);
      } catch (localError) {
        console.warn('[EarlyInjection] Failed to load HUD state from storage:', localError);
        return defaultState;
      }
    }

    // Build state object with fallbacks to defaults
    const loadedState = {
      visible: storageResult[storageKeys.HUD_VISIBLE] !== undefined 
        ? storageResult[storageKeys.HUD_VISIBLE] 
        : defaultState.visible,
      expanded: storageResult[storageKeys.HUD_EXPANDED] !== undefined 
        ? storageResult[storageKeys.HUD_EXPANDED] 
        : defaultState.expanded,
      mode: defaultState.mode // Mode will be determined by main script
    };

    return loadedState;
  } catch (error) {
    console.warn('[EarlyInjection] Error loading early HUD state, using defaults:', error);
    return defaultState;
  }
}