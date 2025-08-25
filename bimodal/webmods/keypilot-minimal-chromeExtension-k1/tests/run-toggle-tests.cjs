#!/usr/bin/env node

/**
 * Test Runner for Extension Toggle Functionality
 * Runs unit tests and integration tests for the toggle feature
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 KeyPilot Extension Toggle Test Suite');
console.log('=====================================\n');

// Check if Jest is available
function checkJestAvailability() {
  try {
    execSync('npx jest --version', { stdio: 'pipe' });
    return true;
  } catch (error) {
    console.log('⚠️  Jest not found. Installing jest for testing...');
    try {
      execSync('npm install --save-dev jest', { stdio: 'inherit' });
      return true;
    } catch (installError) {
      console.error('❌ Failed to install Jest. Please install manually: npm install --save-dev jest');
      return false;
    }
  }
}

// Run a specific test file
function runTest(testFile, description) {
  console.log(`\n🔍 Running ${description}...`);
  console.log(`   File: ${testFile}`);
  
  try {
    const result = execSync(`npx jest ${testFile} --verbose`, { 
      encoding: 'utf8',
      stdio: 'pipe'
    });
    
    console.log('✅ PASSED');
    return true;
  } catch (error) {
    console.log('❌ FAILED');
    console.log('Error output:');
    console.log(error.stdout || error.message);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  if (!checkJestAvailability()) {
    process.exit(1);
  }

  const testResults = [];
  
  // Test files to run
  const tests = [
    {
      file: 'tests/extension-toggle-manager.test.js',
      description: 'ExtensionToggleManager Unit Tests'
    },
    {
      file: 'tests/toggle-integration.test.js', 
      description: 'Toggle Integration Tests'
    },
    {
      file: 'tests/cross-tab-edge-cases.test.js',
      description: 'Cross-Tab Synchronization and Edge Cases'
    }
  ];

  // Run each test
  for (const test of tests) {
    if (fs.existsSync(test.file)) {
      const passed = runTest(test.file, test.description);
      testResults.push({ ...test, passed });
    } else {
      console.log(`⚠️  Test file not found: ${test.file}`);
      testResults.push({ ...test, passed: false });
    }
  }

  // Summary
  console.log('\n📊 Test Summary');
  console.log('===============');
  
  const passedTests = testResults.filter(t => t.passed).length;
  const totalTests = testResults.length;
  
  testResults.forEach(test => {
    const status = test.passed ? '✅' : '❌';
    console.log(`${status} ${test.description}`);
  });
  
  console.log(`\nResults: ${passedTests}/${totalTests} test suites passed`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All automated tests passed!');
    console.log('\n📋 Next Steps:');
    console.log('   1. Run manual tests using tests/manual-test-cases.md');
    console.log('   2. Load extension in Chrome and test Alt+K shortcut');
    console.log('   3. Test popup toggle functionality');
    console.log('   4. Verify cross-tab synchronization');
    console.log('   5. Test state persistence across browser restarts');
  } else {
    console.log('\n⚠️  Some tests failed. Please review and fix issues before proceeding.');
    process.exit(1);
  }
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node run-toggle-tests.cjs [options]');
  console.log('');
  console.log('Options:');
  console.log('  --help, -h     Show this help message');
  console.log('  --unit         Run only unit tests');
  console.log('  --integration  Run only integration tests');
  console.log('');
  console.log('Examples:');
  console.log('  node run-toggle-tests.cjs              # Run all tests');
  console.log('  node run-toggle-tests.cjs --unit       # Run unit tests only');
  console.log('  node run-toggle-tests.cjs --integration # Run integration tests only');
  process.exit(0);
}

if (process.argv.includes('--unit')) {
  console.log('Running unit tests only...');
  runTest('tests/extension-toggle-manager.test.js', 'ExtensionToggleManager Unit Tests');
} else if (process.argv.includes('--integration')) {
  console.log('Running integration tests only...');
  runTest('tests/toggle-integration.test.js', 'Toggle Integration Tests');
} else {
  runAllTests();
}