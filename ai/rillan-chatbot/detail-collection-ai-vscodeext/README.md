# Rillan AI Workflow Interface

NOT WORKING YET.


A VS Code/Kiro extension with MCP (Model Context Protocol) integration that provides intelligent, context-aware GUI menus for collecting project details and specifications directly within your editor.

## 🎯 Overview

This extension transforms how AI assistants interact with developers by implementing a sophisticated detail collection system that bridges AI agents to visual interfaces:

- **MCP Server Integration** - AI agents can directly trigger webview forms through standardized protocols
- **Cross-Platform Support** - Works seamlessly in both VS Code and Kiro IDE environments
- **Intelligent Context Analysis** - Automatically understands project type and complexity from AI requests
- **Dynamic Form Generation** - Creates relevant detail collection interfaces on-demand
- **Real-time Feedback** - AI agents receive confirmation when webviews are successfully displayed

## ✨ Key Features

### 🔌 MCP Server Bridge
- **Standalone MCP Server** (`mcp-server.mjs`) that AI agents can communicate with
- **Cross-Editor Detection** - Automatically detects VS Code vs Kiro environments
- **Command Translation** - Uses appropriate methods for each editor (VS Code commands vs file-based communication)
- **Webview Confirmation** - Reports back to AI agents whether forms were successfully displayed
- **Fallback Mechanisms** - Multiple approaches ensure reliable webview creation

### 🧠 Intelligent Context Analysis
- Automatically detects project types (code, image, text, video, web, app)
- Assesses project complexity (simple, medium, complex)
- Generates relevant detail collection categories
- Provides suggested approaches based on analysis

### 🎨 Dynamic Detail Collection
- **Full Interactive Webview** - Comprehensive forms with real-time validation
- **Slideshow Mode** - Progressive detail collection for complex projects
- **Quick VS Code Interface** - Native VS Code inputs for simple requests
- **Adaptive Complexity** - Adjusts detail requirements based on project scope

### 🔄 AI-Driven Workflow
1. **AI Agent Request** - Agent calls MCP tools with user requirements
2. **Context Analysis** - Server analyzes request and determines form complexity
3. **Webview Creation** - Appropriate editor displays the generated form
4. **User Interaction** - User fills out the contextual detail collection form
5. **Data Export** - Results saved to `.rillan-ai/` folder for AI processing
6. **Confirmation** - AI agent receives success/failure feedback

## 🚀 Getting Started

### For AI Agents (MCP Integration)

#### Available MCP Tools:
- `analyze_project_context` - Analyze user requests for project type and complexity
- `generate_detail_collection_form` - Create and optionally display forms
- `collect_project_details` - Start full detail collection workflow
- `get_workspace_context` - Get current workspace information

#### Example Usage:
```javascript
// AI agent calls MCP tool
await mcp.call('generate_detail_collection_form', {
  userRequest: "Build a web app for task management",
  formType: "slideshow",
  complexity: "comprehensive",
  showForm: true
});

// Response includes webview creation status
{
  "success": true,
  "webviewCreated": true,
  "message": "Form generated and webview created successfully in kiro"
}
```

### For Developers (Manual Usage)

#### Method 1: Start Detail Collection (Recommended)
1. Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Type "Rillan AI: Start Detail Collection"
3. Enter your project request
4. Fill out the generated detail form

#### Method 2: Show Detail Collector
1. Open Command Palette
2. Type "Rillan AI: Show Detail Collector"
3. Use the comprehensive webview form

### MCP Server Configuration

#### For Kiro:
Add to your `~/.kiro/settings/mcp.json`:
```json
{
  "mcpServers": {
    "rillan-ai-workflow": {
      "command": "node",
      "args": ["./vscode-extension/mcp-server.mjs"],
      "env": {"NODE_ENV": "development"},
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

#### For VS Code:
The extension includes built-in MCP server functionality that can be started via:
- Command: "Rillan AI: Start MCP Server"

## 🏗️ Architecture

### MCP Integration Flow
```
AI Agent → MCP Server → Editor Detection → Webview Creation → User Interaction → Data Export → AI Feedback
```

### Core Components

#### MCP Layer
- **`mcp-server.mjs`** - Standalone MCP server for AI agent communication
- **`mcpServer.ts`** - VS Code extension integrated MCP server
- **`mcpLauncher.ts`** - MCP server lifecycle management

#### Extension Layer
- **`extension.ts`** - Main extension entry point and command registration
- **`contextAnalyzer.ts`** - Intelligent request analysis and context detection
- **`detailCollectorPanel.ts`** - Dynamic webview form generation and management
- **`slideshowFormController.ts`** - Progressive form presentation logic

### Cross-Platform Compatibility

#### VS Code Environment:
- Uses `code --command` for direct command execution
- Integrated MCP server within extension context
- Native VS Code webview APIs

#### Kiro Environment:
- File-based communication via `.rillan-ai/` directory
- Standalone MCP server process
- Kiro-specific webview integration

## 📋 MCP Tools Reference

### `analyze_project_context`
Analyzes user requests to determine project characteristics.

**Input:**
```json
{
  "userRequest": "Build a mobile app for fitness tracking"
}
```

**Output:**
```json
{
  "projectType": "mobile",
  "complexity": "medium",
  "suggestedApproach": "Progressive detail collection with technical focus",
  "detailCategories": ["UI/UX", "Data", "Integration"]
}
```

### `generate_detail_collection_form`
Creates dynamic forms based on project analysis.

**Input:**
```json
{
  "userRequest": "Create an e-commerce website",
  "formType": "slideshow",
  "complexity": "comprehensive",
  "showForm": true
}
```

**Output:**
```json
{
  "success": true,
  "formId": "form_1234567890",
  "webviewCreated": true,
  "message": "Form generated and webview created successfully in kiro",
  "sectionsCount": 3,
  "fieldsCount": 12
}
```

### `collect_project_details`
Initiates complete detail collection workflow.

**Input:**
```json
{
  "userRequest": "Build a REST API for user management",
  "skipAnalysis": false
}
```

**Output:**
```json
{
  "success": true,
  "workflowId": "workflow_1234567890",
  "webviewCreated": true,
  "status": "started",
  "message": "Detail collection workflow initiated and webview created in kiro"
}
```

## 🛠️ Development

### Prerequisites
- Node.js 16+
- VS Code 1.74+ or Kiro IDE
- TypeScript 4.9+
- @modelcontextprotocol/sdk

### Build Commands
```bash
cd vscode-extension
npm install          # Install dependencies
npm run compile      # Compile TypeScript
npm run watch        # Watch for changes
npm run test         # Run tests

# MCP Server Testing
node mcp-server.mjs  # Test standalone MCP server
npm run mcp:test     # Run MCP integration tests
```

### Project Structure
```
vscode-extension/
├── src/                    # TypeScript source files
│   ├── extension.ts       # Main extension logic
│   ├── contextAnalyzer.ts # Context analysis engine
│   ├── detailCollectorPanel.ts # Webview management
│   ├── mcpServer.ts       # Integrated MCP server
│   └── mcpLauncher.ts     # MCP lifecycle management
├── mcp-server.mjs         # Standalone MCP server
├── out/                   # Compiled JavaScript
├── .rillan-ai/           # Data export directory
└── package.json          # Extension manifest
```

## 🔧 Configuration

### MCP Server Settings
- **Auto-detection** - Automatically detects VS Code vs Kiro environments
- **Command translation** - Uses appropriate methods for each editor
- **Fallback mechanisms** - File-based communication when commands fail
- **Debug logging** - Comprehensive logging for troubleshooting

### Extension Settings
- Detail collection preferences
- Form validation rules
- Export formats
- MCP server auto-start options

## 📊 Benefits

### For AI Agents
- **Direct UI Control** - Can trigger visual interfaces programmatically
- **Real-time Feedback** - Know immediately if webviews were created successfully
- **Cross-platform** - Works in multiple editor environments
- **Structured Data** - Receive organized, validated user input
- **Reduced Iterations** - Comprehensive detail collection upfront

### For Developers
- **Seamless Integration** - AI agents can create forms without manual intervention
- **Better AI Results** - More complete project specifications
- **Cross-editor Support** - Works in both VS Code and Kiro
- **Maintains Control** - You still specify exactly what you want

### For Development Teams
- **Standardized Process** - Consistent detail collection across projects
- **AI-Human Collaboration** - Smooth handoff between AI analysis and human input
- **Export Integration** - Easy integration with existing workflows

## 🔮 Future Enhancements

- **Additional Editor Support** - Extend to more IDEs and editors
- **Enhanced MCP Tools** - More sophisticated AI-to-UI communication
- **Template Library** - Pre-built detail collection templates
- **Real-time Collaboration** - Multi-user form completion
- **Advanced Analytics** - Usage patterns and optimization insights


VS Code Extension API:

Internal to VS Code - Only works within the VS Code process
JavaScript/TypeScript only - Extensions must be written in these languages
User-initiated - Requires user to manually trigger commands
Single editor - VS Code specific, doesn't work in other editors
MCP Server:
External AI Agent Access - AI agents running outside VS Code can control the extension
Language agnostic - AI agents can be written in any language (Python, Go, etc.)
AI-initiated - AI agents can programmatically trigger webviews without user intervention
Cross-platform - Works with both VS Code and Kiro (and potentially other editors)

🎯 The Real Problem We Solved:
Before MCP Server:

AI Agent → User → Manual VS Code Command → Webview
AI agent tells user "please run this command"
User manually opens Command Palette
User types and executes command
Webview appears
After MCP Server:

AI Agent → MCP Tool Call → Automatic Webview Creation
AI agent directly calls MCP tool
Webview automatically appears
AI agent gets confirmation of success/failure


## 🤝 Contributing

Contributions welcome! Priority areas:

- MCP tool enhancements
- Additional editor integrations
- Cross-platform testing
- Performance optimizations
- Documentation improvements

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

- Built on the Model Context Protocol (MCP) standard
- Inspired by the need for better AI-human collaboration
- Designed for the future of AI-assisted development

---

**Bridge the gap between AI agents and visual interfaces with intelligent, cross-platform detail collection.**