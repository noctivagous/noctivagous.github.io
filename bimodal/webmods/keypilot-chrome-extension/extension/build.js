/**
 * Build script for KeyPilot extension
 */
import fs from 'fs';

console.log('Starting build...');

const modules = [
  'src/config/constants.js',
  'src/modules/state-manager.js',
  'src/modules/event-manager.js',
  'src/modules/cursor.js',
  'src/modules/element-detector.js',
  'src/modules/activation-handler.js',
  'src/modules/focus-detector.js',
  'src/modules/mouse-coordinate-manager.js',
  'src/modules/highlight-manager.js',
  'src/modules/overlay-manager.js',
  'src/modules/style-manager.js',
  'src/modules/shadow-dom-manager.js',
  'src/modules/intersection-observer-manager.js',
  'src/modules/optimized-scroll-manager.js',
  'src/modules/keypilot-toggle-handler.js',
  'src/modules/text-element-filter.js',
  'src/modules/edge-character-detector.js',
  'src/modules/rectangle-intersection-observer.js',
  'src/keypilot.js',
  'src/content-script.js'
];

// Validate all source files exist before bundling
console.log('Validating source files...');
for (const modulePath of modules) {
  if (!fs.existsSync(modulePath)) {
    console.error(`ERROR: Source file not found: ${modulePath}`);
    process.exit(1);
  }
}
console.log('All source files validated successfully.');

let bundledContent = `/**
 * KeyPilot Chrome Extension - Bundled Version
 * Generated on ${new Date().toISOString()}
 */

(() => {
  // Global scope for bundled modules

`;

for (const modulePath of modules) {
  console.log(`Processing ${modulePath}...`);
  let moduleContent = fs.readFileSync(modulePath, 'utf8');
  
  // Remove imports and exports
  moduleContent = moduleContent
    .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*\n?/g, '')
    .replace(/^export\s+(class|function|const|let|var)\s+/gm, '$1 ')
    .replace(/export\s*\{[^}]*\}\s*;?\s*\n?/g, '')
    .replace(/^export\s+/gm, '');
  
  bundledContent += `
  // Module: ${modulePath}
${moduleContent}

`;
}

bundledContent += `
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