/**
 * New build script for KeyPilot extension
 */
import fs from 'fs';

console.log('Starting build...');

// Read all module files
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

let output = `/**
 * KeyPilot Chrome Extension - Bundled Version
 * Generated on ${new Date().toISOString()}
 */

(() => {
  // Bundled modules

`;

// Process each module
for (const modulePath of modules) {
  if (fs.existsSync(modulePath)) {
    console.log(`Processing ${modulePath}...`);
    let content = fs.readFileSync(modulePath, 'utf8');
    
    // Clean up imports and exports
    content = content
      .replace(/import\s+.*?from\s+['"][^'"]*['"];?\s*/g, '')
      .replace(/export\s+(const|let|var|class|function)\s+/g, '$1 ')
      .replace(/export\s*\{[^}]*\}\s*;?\s*/g, '');
    
    output += `
  // === ${modulePath} ===
  ${content}
  
`;
  }
}

output += `
  // Initialize KeyPilot
  if (typeof KeyPilot !== 'undefined') {
    new KeyPilot();
  }
})();
`;

// Write the bundled file
fs.writeFileSync('content-bundled.js', output);
console.log('Build complete! Generated content-bundled.js');