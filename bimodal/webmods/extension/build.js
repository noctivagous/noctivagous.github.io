/**
 * Build script for KeyPilot extension
 */
import fs from 'fs';

console.log('Starting build...');

const modules = [
  // Configuration
  'src/config/keybindings.js',
  'src/config/ui-constants.js',
  'src/config/selection-config.js',
  'src/config/performance.js',
  'src/config/feature-flags.js',
  'src/config/index.js',
  
  // Core foundation (must come before classes that extend them)
  'src/core/event-manager.js',
  
  // Utilities (must come early)
  'src/utils/logger.js',
  'src/utils/file-logger.js',
  
  // Text mode (simplified text mode system)
  'src/text-mode/text-mode-manager.js',
  
  // State management
  'src/state/mode-manager.js',
  'src/state/state-manager.js',
  'src/state/mouse-coordinate-manager.js',
  
  // Detection
  'src/detection/element-detector.js',
  'src/detection/focus-detector.js',
  'src/detection/text-element-filter.js',
  'src/detection/edge-character-detector.js',
  
  // Selection (after EventManager is defined)
  'src/selection/activation-handler.js',
  'src/selection/highlight-manager.js',
  
  // UI
  'src/ui/cursor.js',
  'src/ui/settings-manager.js',
  'src/ui/keymapping-adapter.js',
  
  // Rendering
  'src/rendering/style-manager.js',
  'src/rendering/shadow-dom-manager.js',
  'src/rendering/overlays/focus-overlay.js',
  'src/rendering/overlays/delete-overlay.js',
  'src/rendering/overlays/highlight-overlay.js',
  'src/rendering/overlays/notification-overlay.js',
  'src/rendering/overlays/overlay-coordinator.js',
  
  // Performance
  'src/performance/intersection-observer-manager.js',
  'src/performance/optimized-scroll-manager.js',
  'src/performance/performance-monitor.js',
  'src/performance/rectangle-intersection/rectangle-observer.js',
  'src/performance/rectangle-intersection/cache-manager.js',
  'src/performance/rectangle-intersection/performance-tracker.js',
  'src/performance/rectangle-intersection/fallback-handler.js',
  'src/performance/rectangle-intersection/index.js',
  
  // Core (remaining core modules)
  'src/core/lifecycle-manager.js',
  'src/core/command-dispatcher.js',
  'src/core/keypilot-toggle-handler.js',
  
  // Input
  'src/input/keyboard-handler.js',
  'src/input/mouse-handler.js',
  'src/input/input-coordinator.js',
  
  // Main application
  'src/core/keypilot-app.js'
];

// Content script entry point (handled separately)
const contentScriptPath = 'src/content-script.js';

// Validate all source files exist before bundling
console.log('Validating source files...');
for (const modulePath of modules) {
  if (!fs.existsSync(modulePath)) {
    console.error(`ERROR: Source file not found: ${modulePath}`);
    process.exit(1);
  }
}

// Validate content script exists
if (!fs.existsSync(contentScriptPath)) {
  console.error(`ERROR: Content script not found: ${contentScriptPath}`);
  process.exit(1);
}

console.log('All source files validated successfully.');

let bundledContent = `/**
 * KeyPilot Chrome Extension - Bundled Version
 * Generated on ${new Date().toISOString()}
 */

(() => {
  // Global scope for bundled modules

`;

// Process all modules first
for (const modulePath of modules) {
  console.log(`Processing ${modulePath}...`);
  let moduleContent = fs.readFileSync(modulePath, 'utf8');
  
  // Remove imports and exports
  moduleContent = moduleContent
    .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*\n?/g, '')
    .replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ')
    .replace(/export\s*\{[^}]*\}\s*;?\s*\n?/g, '')
    .replace(/^export\s*\*\s*from\s+['"][^'"]*['"];?\s*\n?/gm, '') // Remove export * from statements
    .replace(/^export\s+/gm, '');
  
  bundledContent += `
  // Module: ${modulePath}
${moduleContent}

`;
}

// Process content script entry point
console.log(`Processing entry point: ${contentScriptPath}...`);
let contentScriptContent = fs.readFileSync(contentScriptPath, 'utf8');

// Remove imports from content script but keep the initialization logic
contentScriptContent = contentScriptContent
  .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*\n?/g, '')
  .replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ')
  .replace(/export\s*\{[^}]*\}\s*;?\s*\n?/g, '')
  .replace(/^export\s*\*\s*from\s+['"][^'"]*['"];?\s*\n?/gm, '') // Remove export * from statements
  .replace(/^export\s+/gm, '');

bundledContent += `
  // Entry Point: ${contentScriptPath}
${contentScriptContent}

})();
`;

// Generate content-bundled.js in extension directory
fs.writeFileSync('content-bundled.js', bundledContent);
console.log('Generated content-bundled.js in extension directory');

// Validate background.js exists in extension directory
if (fs.existsSync('background.js')) {
  console.log('background.js found and ready for extension');
} else {
  console.error('ERROR: background.js not found in extension directory! Extension will not work properly.');
  process.exit(1);
}

console.log('Build complete! Extension files ready:');
console.log('  - content-bundled.js (content script)');
console.log('  - background.js (service worker)');