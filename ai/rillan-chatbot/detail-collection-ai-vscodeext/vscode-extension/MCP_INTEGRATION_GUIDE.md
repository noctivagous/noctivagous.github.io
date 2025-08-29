# Rillan AI Workflow Interface - MCP Integration Guide

## Overview

The Rillan AI Workflow Interface extension now includes **Model Context Protocol (MCP) server integration**, making it fully controllable by AI agents like Kiro. This means AI agents can programmatically generate forms, collect project details, and analyze requirements without any manual VS Code interaction.

Install the VS Code Extension
To install the extension in VS Code:

cd vscode-extension
npm run vscode:prepublish
code --install-extension 

Here's the complete command sequence to build, package, and install the VS Code extension:

# 1. Navigate to extension directory
cd vscode-extension

# 2. Install dependencies
npm install

# 3. Run prepublish (compiles TypeScript and runs linting)
npm run vscode:prepublish

# 4. Install vsce packaging tool (if not already installed)
npm install -g @vscode/vsce

# 5. Package the extension into .vsix file
vsce package

# 6. Install the extension in VS Code
code --install-extension rillan-ai-workflow-interface-0.0.1.vsix

# 7. Alternative: Install for development/testing
code --install-extension . --force

# 8. Optional: Start VS Code with extension loaded
code .
Quick one-liner for development:

cd vscode-extension && npm run vscode:prepublish && code --install-extension . --force && code .

If you get permission errors with global npm install:

# Use npx instead of global install
cd vscode-extension && npm run vscode:prepublish && npx @vscode/vsce package && code --install-extension *.vsix
The extension will then be available in VS Code's Command Palette with commands like:

Rillan AI: Start Detail Collection
Rillan AI: Show Detail Collector
Rillan AI: Start MCP Server



## 🚀 Quick Start

### 1. Configure Kiro to Use the MCP Server

Add this configuration to your `.kiro/settings/mcp.json`:

```json
{
  "mcpServers": {
    "fetch": {
      "command": "uvx",
      "args": ["mcp-server-fetch"],
      "env": {},
      "disabled": false,
      "autoApprove": []
    },
    "rillan-ai-workflow": {
      "command": "node",
      "args": [".../vscode-extension/mcp-server.js"],
      "env": {},
      "disabled": false,
      "autoApprove": [
        "analyze_project_context",
        "generate_detail_collection_form",
        "collect_project_details",
        "get_workspace_context"
      ]
    }
  }
}
```

### 2. Test the Integration

Once configured, you can ask Kiro to:

- **"Analyze this project request: Build a web app for task management"**
- **"Generate a form for collecting mobile app requirements"**
- **"Create an investigation form for performance issues"**
- **"Help me collect details for a refactoring project"**

## 🛠️ Available MCP Tools

### Core Analysis Tools

#### `analyze_project_request`
Analyzes user requests to determine project type, complexity, and requirements.

**Parameters:**
- `userRequest` (string): The user's project description

**Example:**
```javascript
// Kiro can call this automatically when you describe a project
analyze_project_request({
  userRequest: "I want to build a React web app for managing customer data"
})
```

#### `generate_form_specification`
Creates detailed form specifications for collecting project requirements.

**Parameters:**
- `projectType` (string): web, mobile, desktop, api, database, ai_ml, game, general
- `complexity` (string): minimal, standard, comprehensive
- `purpose` (string): collection, investigation, refactoring, instruction

### Specialized Form Tools

#### `create_investigation_spec`
Creates specifications for investigating project issues.

**Parameters:**
- `issueDescription` (string): Description of the issue
- `urgency` (string): low, medium, high, critical

#### `create_refactoring_spec`
Creates specifications for code refactoring projects.

**Parameters:**
- `codeLocation` (string): Location of code to refactor
- `goals` (array): List of refactoring goals

#### `validate_form_data`
Validates collected form data against requirements.

**Parameters:**
- `formData` (object): The form data to validate
- `formType` (string): Type of form being validated

## 🎯 Real-World Usage Examples

### Example 1: AI-Driven Project Analysis

**You:** "I need help building a mobile app for fitness tracking"

**Kiro automatically:**
1. Calls `analyze_project_request` to understand it's a mobile fitness app
2. Calls `generate_form_specification` with mobile/standard/collection parameters
3. Creates a form in VS Code with sections for:
   - App features and functionality
   - Target platforms (iOS/Android)
   - User authentication requirements
   - Data tracking preferences
   - Integration needs (wearables, health apps)

### Example 2: Investigation Workflow

**You:** "Our login system is really slow, can you help me investigate?"

**Kiro automatically:**
1. Calls `create_investigation_spec` with the performance issue
2. Generates an investigation form covering:
   - Performance symptoms and frequency
   - Affected user groups
   - System architecture details
   - Available monitoring data
   - Timeline for resolution

### Example 3: Refactoring Planning

**You:** "I need to refactor the payment processing module"

**Kiro automatically:**
1. Calls `create_refactoring_spec` for the payment module
2. Creates a comprehensive refactoring form with:
   - Current code issues and technical debt
   - Refactoring goals and constraints
   - Testing strategy and risk assessment
   - Timeline and breaking change considerations

## 🔧 VS Code Extension Integration

### MCP Server Commands

The extension provides these commands for managing the MCP server:

- **🚀 Start MCP Server** - `rillan-ai-workflow-interface.startMCPServer`
- **🛑 Stop MCP Server** - `rillan-ai-workflow-interface.stopMCPServer`
- **🔄 Restart MCP Server** - `rillan-ai-workflow-interface.restartMCPServer`
- **📊 MCP Server Status** - `rillan-ai-workflow-interface.mcpServerStatus`
- **🧪 Test MCP Server** - `rillan-ai-workflow-interface.testMCPServer`

### Configuration Options

Add these to your VS Code settings:

```json
{
  "rillanAI.autoStartMCPServer": true,
  "rillanAI.mcpServerPort": 3000
}
```

## 🏗️ Architecture

### Two-Layer Design

1. **VS Code Extension Layer**: Provides UI, form generation, and VS Code integration
2. **MCP Server Layer**: Exposes functionality as tools for AI agents

### Communication Flow

```
AI Agent (Kiro) → MCP Protocol → MCP Server → VS Code Extension → User Interface
```

### Data Flow

1. **AI Request**: Kiro analyzes user intent
2. **MCP Tool Call**: Kiro calls appropriate MCP tool
3. **Form Generation**: Extension creates dynamic form
4. **User Interaction**: User fills out form in VS Code
5. **Data Collection**: Form data is collected and processed
6. **AI Response**: Results are returned to Kiro for next steps

## 🧪 Testing the Integration

### Manual Testing

1. **Start the MCP Server**:
   ```bash
   cd vscode-extension
   node mcp-server.js
   ```

2. **Test with Kiro**: Ask Kiro to help with a project and watch it automatically generate appropriate forms.

### Automated Testing

The extension includes test commands to verify MCP functionality:

- Use **🧪 Test MCP Server** command to see available tools
- Check server status with **📊 MCP Server Status**

## 🔍 Troubleshooting

### Common Issues

1. **MCP Server Won't Start**
   - Check Node.js is installed
   - Verify MCP SDK dependency: `npm install @modelcontextprotocol/sdk`
   - Check VS Code output panel for errors

2. **Kiro Can't Connect**
   - Verify MCP configuration in `.kiro/settings/mcp.json`
   - Check file paths are correct
   - Restart Kiro after configuration changes

3. **Tools Not Working**
   - Check MCP server logs for errors
   - Verify tool parameters match the schema
   - Test with simple requests first

### Debug Mode

Enable debug logging by setting:
```json
{
  "env": {
    "NODE_ENV": "development",
    "DEBUG": "mcp:*"
  }
}
```

## 🚀 Advanced Usage

### Custom Tool Development

You can extend the MCP server with custom tools by modifying `mcpServer.ts`:

```typescript
// Add new tool to the tools list
{
  name: 'my_custom_tool',
  description: 'My custom functionality',
  inputSchema: {
    // Define parameters
  }
}

// Add handler in CallToolRequestSchema
case 'my_custom_tool':
  return await this.myCustomTool(args);
```

### Integration with Other Tools

The MCP server can be integrated with other development tools:

- **CI/CD Pipelines**: Generate forms for deployment configurations
- **Project Templates**: Create forms for scaffolding new projects
- **Code Analysis**: Generate investigation forms based on static analysis

## 📚 Additional Resources

- [Model Context Protocol Documentation](https://modelcontextprotocol.io/)
- [VS Code Extension API](https://code.visualstudio.com/api)
- [Kiro MCP Configuration Guide](https://docs.kiro.ai/mcp)

## 🎉 Benefits

With MCP integration, the Rillan AI Workflow Interface becomes:

- **Fully AI-Controllable**: No manual form creation needed
- **Context-Aware**: AI understands project requirements automatically
- **Workflow-Integrated**: Seamlessly fits into AI-driven development workflows
- **Extensible**: Easy to add new tools and capabilities
- **Efficient**: Reduces back-and-forth between AI and user

This integration transforms the extension from a manual tool into an intelligent, AI-driven project specification system that works seamlessly with modern AI development workflows.