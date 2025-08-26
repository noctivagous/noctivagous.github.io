/**
 * Build script for KeyPilot extension
 */
import fs from 'fs';

console.log('Starting build...');

// Main content script modules
const modules = [
  'src/config/constants.js',
  'src/modules/state-manager.js',
  'src/modules/event-manager.js',
  'src/modules/cursor.js',
  'src/modules/element-detector.js',
  'src/modules/activation-handler.js',
  'src/modules/focus-detector.js',
  'src/modules/overlay-manager.js',
  'src/modules/style-manager.js',
  'src/modules/shadow-dom-manager.js',
  'src/modules/intersection-observer-manager.js',
  'src/modules/optimized-scroll-manager.js',
  'src/modules/keypilot-toggle-handler.js',
  'src/modules/hud-manager.js',
  'src/modules/state-bridge.js',
  'src/keypilot.js',
  'src/content-script.js'
];

// Early injection modules (minimal set for performance)
const earlyInjectionModules = [
  'src/early-injection-styles.js',
  'src/modules/state-bridge.js',
  'src/early-injection.js'
];

/**
 * Build early injection bundle
 */
function buildEarlyInjection() {
  console.log('Building early injection bundle...');
  
  let earlyBundledContent = `/**
 * KeyPilot Chrome Extension - Early Injection Bundle
 * Generated on ${new Date().toISOString()}
 * Optimized for minimal payload and fast execution
 */

(() => {
  // Global scope for early injection modules

`;

  for (const modulePath of earlyInjectionModules) {
    if (fs.existsSync(modulePath)) {
      console.log(`Processing early injection module ${modulePath}...`);
      let moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // Remove imports and exports (including multi-line imports)
      moduleContent = moduleContent
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]*['"];?\s*\n?/g, '')
        .replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ')
        .replace(/export\s*\{[^}]*\}\s*;?\s*\n?/g, '')
        .replace(/^export\s+/gm, '');
      
      earlyBundledContent += `
  // Early Injection Module: ${modulePath}
${moduleContent}

`;
    } else {
      console.warn(`Early injection module not found: ${modulePath}`);
    }
  }

  earlyBundledContent += `
})();
`;

  fs.writeFileSync('early-injection.js', earlyBundledContent);
  console.log('Generated early-injection.js');
}

/**
 * Build main content script bundle
 */
function buildMainContentScript() {
  console.log('Building main content script bundle...');
  
  let bundledContent = `/**
 * KeyPilot Chrome Extension - Main Content Script Bundle
 * Generated on ${new Date().toISOString()}
 */

(() => {
  // Global scope for bundled modules

`;

  for (const modulePath of modules) {
    if (fs.existsSync(modulePath)) {
      console.log(`Processing ${modulePath}...`);
      let moduleContent = fs.readFileSync(modulePath, 'utf8');
      
      // Remove imports and exports (including multi-line imports)
      moduleContent = moduleContent
        .replace(/import\s+[\s\S]*?from\s+['"][^'"]*['"];?\s*\n?/g, '')
        .replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ')
        .replace(/export\s*\{[^}]*\}\s*;?\s*\n?/g, '')
        .replace(/^export\s+/gm, '');
      
      bundledContent += `
  // Module: ${modulePath}
${moduleContent}

`;
    }
  }

  bundledContent += `
})();
`;

  fs.writeFileSync('content-bundled.js', bundledContent);
  console.log('Generated content-bundled.js');
}

// Build both bundles
buildEarlyInjection();
buildMainContentScript();

// Verify background.js exists
if (fs.existsSync('background.js')) {
  console.log('background.js found and ready for extension');
} else {
  console.error('ERROR: background.js not found! Extension will not work properly.');
  process.exit(1);
}

// Calculate bundle sizes for optimization monitoring
const earlyInjectionSize = fs.statSync('early-injection.js').size;
const mainContentSize = fs.statSync('content-bundled.js').size;

console.log('Build complete! Extension files ready:');
console.log(`  - early-injection.js (${(earlyInjectionSize / 1024).toFixed(1)}KB) - document_start`);
console.log(`  - content-bundled.js (${(mainContentSize / 1024).toFixed(1)}KB) - document_idle`);
console.log('  - background.js (service worker)');

// Performance optimization check
if (earlyInjectionSize > 50000) { // 50KB threshold
  console.warn(`WARNING: Early injection bundle is ${(earlyInjectionSize / 1024).toFixed(1)}KB. Consider optimizing for faster page load.`);
}