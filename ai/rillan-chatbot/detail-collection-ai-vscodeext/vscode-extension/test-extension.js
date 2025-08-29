// Simple test script for Rillan AI Workflow Interface
// Run with: node test-extension.js

console.log('🧪 Testing Rillan AI Workflow Interface Extension Logic...\n');

// Test the context analyzer logic
async function testContextAnalyzer() {
    try {
        console.log('📋 Testing Context Analyzer...');
        
        // Import the compiled context analyzer
        const { ContextAnalyzer } = require('./out/contextAnalyzer.js');
        const analyzer = new ContextAnalyzer();
        
        // Test different request types
        const testRequests = [
            "Build a calculator app with scientific functions",
            "Create a logo for a coffee shop", 
            "Write a blog post about AI in healthcare",
            "Develop a mobile app for task management"
        ];
        
        testRequests.forEach((request, index) => {
            console.log(`\n🔍 Test ${index + 1}: "${request}"`);
            const result = analyzer.analyzeRequest(request);
            console.log(`   Type: ${result.type}`);
            console.log(`   Complexity: ${result.complexity}`);
            console.log(`   Categories: ${result.categories.length}`);
            console.log(`   Approach: ${result.suggestedApproach}`);
        });
        
        console.log('\n✅ Context Analyzer tests completed successfully!');
        
    } catch (error) {
        console.error('❌ Error testing Context Analyzer:', error.message);
    }
}

// Test the detail collector panel logic
async function testDetailCollector() {
    try {
        console.log('\n📋 Testing Detail Collector Panel...');
        
        // Import the compiled detail collector
        const { DetailCollectorPanel } = require('./out/detailCollectorPanel.js');
        
        console.log('✅ Detail Collector Panel imported successfully!');
        console.log('   (Note: Webview functionality requires VS Code environment)');
        
    } catch (error) {
        console.error('❌ Error testing Detail Collector Panel:', error.message);
    }
}

// Run all tests
async function runAllTests() {
    console.log('🚀 Starting Extension Tests...\n');
    
    await testContextAnalyzer();
    await testDetailCollector();
    
    console.log('\n🎉 All tests completed!');
    console.log('\n💡 To test the full VS Code extension:');
    console.log('   1. Open the project in VS Code');
    console.log('   2. Press F5 to launch Extension Development Host');
    console.log('   3. Use Command Palette (Ctrl+Shift+P) to find "Start Detail Collection"');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}
