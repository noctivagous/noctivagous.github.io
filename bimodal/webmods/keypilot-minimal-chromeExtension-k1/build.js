/**
 * Simple build script to bundle the modular KeyPilot extension
 */
import fs from 'fs';
import path from 'path';

// Read all module files and combine them
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

`;

// Simple module bundler - replace imports/exports with IIFE pattern
const moduleContents = new Map();

// Read all modules
for (const modulePath of modules) {
  if (fs.existsSync(modulePath)) {
    const content = fs.readFileSync(modulePath, 'utf8');
    moduleContents.set(modulePath, content);
  }
}

// Create bundled version
bundledContent += `
(() => {
  // Module system simulation
  const modules = {};
  const exports = {};
  
  // Define modules
`;

// Process each module
for (const [modulePath, content] of moduleContents) {
  const moduleName = modulePath.replace(/[^a-zA-Z0-9]/g, '_');
  
  // Remove import/export statements and wrap in module function
  let processedContent = content
    .replace(/^import\s+.*?from\s+['"].*?['"];?\s*$/gm, '')
    .replace(/^export\s+/gm, 'modules.' + moduleName + '.')
    .replace(/export\s+\{[^}]*\}/g, '');
  
  bundledContent += `
  // Module: ${modulePath}
  (() => {
    ${processedContent}
  })();
  `;
}

bundledContent += `
  
  // Initialize KeyPilot
  if (modules.src_keypilot_js && modules.src_keypilot_js.KeyPilot) {
    new modules.src_keypilot_js.KeyPilot();
  }
})();
`;

// Write bundled file
fs.writeFileSync('content-bundled.js', bundledContent);

console.log('Build complete! Generated content-bundled.js');