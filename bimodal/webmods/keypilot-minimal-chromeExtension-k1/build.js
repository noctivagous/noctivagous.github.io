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
  'src/modules/overlay-manager.js',
  'src/modules/style-manager.js',
  'src/modules/shadow-dom-manager.js',
  'src/keypilot.js',
  'src/content-script.js'
];

let bundledContent = `/**
 * KeyPilot Chrome Extension - Bundled Version
 * Generated on ${new Date().toISOString()}
 */

(() => {
  // Global scope for bundled modules

`;

for (const modulePath of modules) {
  if (fs.existsSync(modulePath)) {
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
}

bundledContent += `
})();
`;

fs.writeFileSync('content-bundled.js', bundledContent);
console.log('Build complete! Generated content-bundled.js');