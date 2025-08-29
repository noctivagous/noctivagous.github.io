// Simple test to verify the extension can be loaded
const vscode = require('vscode');

async function testExtension() {
    try {
        console.log('Testing Rillan AI Workflow Interface extension...');
        
        // Check if commands are registered
        const commands = await vscode.commands.getCommands();
        const rillanCommands = commands.filter(cmd => cmd.includes('rillan-ai-workflow-interface'));
        
        console.log('Found Rillan AI commands:', rillanCommands);
        
        if (rillanCommands.length > 0) {
            console.log('✅ Extension commands are registered successfully!');
        } else {
            console.log('❌ Extension commands not found');
        }
        
    } catch (error) {
        console.error('❌ Error testing extension:', error);
    }
}

// Export for use in extension host
module.exports = { testExtension };