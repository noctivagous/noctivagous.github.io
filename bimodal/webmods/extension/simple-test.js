/**
 * Simple test to verify basic functionality
 */

// Mock minimal DOM environment
global.window = {};
global.document = {
  createElement: () => ({ style: {}, appendChild: () => {} }),
  body: { appendChild: () => {} },
  querySelectorAll: () => [],
  createTreeWalker: () => ({ nextNode: () => null })
};
global.Node = { TEXT_NODE: 3 };
global.NodeFilter = { SHOW_TEXT: 4, FILTER_ACCEPT: 1 };
global.IntersectionObserver = class { constructor() {} observe() {} disconnect() {} };
global.performance = { now: () => Date.now() };

import { TextElementFilter } from './src/modules/text-element-filter.js';
import { EdgeCharacterDetector } from './src/modules/edge-character-detector.js';
import { PerformanceMonitor } from './src/modules/performance-monitor.js';

console.log('Testing individual components...\n');

// Test TextElementFilter
try {
  const filter = new TextElementFilter();
  console.log('✅ TextElementFilter: OK');
  console.log(`   - Configuration loaded: ${filter.textContainingTags.size > 0}`);
} catch (error) {
  console.log('❌ TextElementFilter:', error.message);
}

// Test EdgeCharacterDetector
try {
  const detector = new EdgeCharacterDetector();
  console.log('✅ EdgeCharacterDetector: OK');
  console.log(`   - Configuration loaded: ${detector.enabled !== undefined}`);
} catch (error) {
  console.log('❌ EdgeCharacterDetector:', error.message);
}

// Test PerformanceMonitor
try {
  const monitor = new PerformanceMonitor();
  console.log('✅ PerformanceMonitor: OK');
  console.log(`   - Methods available: ${typeof monitor.recordSmartTargeting === 'function'}`);
  
  // Test method calls
  monitor.recordElementProcessing({ elementsProcessed: 1, processingTime: 10 });
  monitor.recordSmartTargeting({ elementReductionPercentage: 85 });
  monitor.recordCharacterDetection({ charactersDetected: 5 });
  
  const metrics = monitor.getMetrics();
  console.log(`   - Metrics working: ${metrics.elementsProcessed === 1}`);
  
} catch (error) {
  console.log('❌ PerformanceMonitor:', error.message);
}

console.log('\n🎉 Component tests complete!');