# Rillan AI Workflow Interface - Quick Start Guide

## How to Use Your New System

### 1. **Launch the Extension for Testing**

```bash
cd vscode-extension
code .
# Press F5 to launch Extension Development Host
```

### 2. **Available Commands (Use Cmd+Shift+P)**

#### **Core Commands:**
- **"Start Detail Collection"** - Main workflow with context analysis
- **"Show Detail Collector"** - Direct form access
- **"Quick Detail Collection"** - VS Code native interface

#### **AI-Enhanced Commands:**
- **"🧪 Test AI Form Suggestion"** - Test AI form suggestions
- **"🔍 AI Investigation Form (Enhanced)"** - Debug/analyze projects
- **"🔧 AI Refactoring Form (Enhanced)"** - Code improvement forms
- **"🤖 AI Instruction Form (Enhanced)"** - Task specification forms

#### **Workflow Commands:**
- **"🔄 Start AI Workflow"** - Multi-step AI workflows
- **"📋 Show Active Workflows"** - View running workflows

### 3. **Testing Scenarios**

#### **Scenario 1: Build a Calculator App**
1. Run "Start Detail Collection"
2. Enter: "Build a calculator app with scientific functions"
3. System detects: Type=Code, Complexity=Medium
4. Fill out the generated form
5. Check `.rillan-ai/` folder for exported JSON

#### **Scenario 2: Create an Image**
1. Run "Start Detail Collection"
2. Enter: "Create an image of a joker card in dark theme"
3. System detects: Type=Image, Complexity=Simple
4. Complete the image specification form
5. Export contains all image generation details

#### **Scenario 3: AI Investigation**
1. Run "🔍 AI Investigation Form (Enhanced)"
2. Analyze a project issue or codebase
3. Get structured investigation data for AI

### 4. **Integration with Kiro**

#### **Method 1: Use Exported JSON Files**
```bash
# After using the extension, find your exported data:
ls .rillan-ai/
# Copy the JSON content and paste into Kiro chat
```

#### **Method 2: Direct Integration (Future)**
The system is designed to integrate with AI assistants like Kiro through:
- Structured JSON exports
- Context-aware form generation
- Workflow orchestration

### 5. **File Locations**

- **Exported Data**: `.rillan-ai/rillan-ai-details-[timestamp].json`
- **Extension Source**: `vscode-extension/src/`
- **Configuration**: VS Code settings under "Rillan AI"

### 6. **Customization**

#### **VS Code Settings:**
```json
{
  "rillanAI.preferredComplexity": "standard",
  "rillanAI.formStyle": "slideshow",
  "rillanAI.gridThreshold": 5,
  "rillanAI.autoAdvance": false,
  "rillanAI.allowAISuggestions": true
}
```

### 7. **Troubleshooting**

#### **Extension Not Loading:**
- Ensure you're in Extension Development Host window
- Check Developer Console for errors
- Run `npm run compile` if needed

#### **Commands Not Available:**
- Wait for extension activation
- Check Command Palette spelling
- Restart Extension Development Host

#### **Forms Not Displaying:**
- Enable webview in VS Code
- Check JavaScript console
- Verify context analyzer is working

### 8. **Next Steps**

1. **Test Basic Functionality**: Try all core commands
2. **Export Data**: Generate JSON files for AI consumption
3. **Integrate with Kiro**: Use exported data in AI conversations
4. **Customize Forms**: Modify templates for your needs
5. **Build Workflows**: Create multi-step AI processes

## Example Workflow with Kiro

1. **Use Extension**: Run "Start Detail Collection" → "Build a React dashboard"
2. **Export Data**: Get structured JSON with all requirements
3. **Feed to Kiro**: Paste JSON into Kiro chat with context
4. **Get Better Results**: Kiro has complete project specification

This system transforms vague requests into precise, actionable specifications that AI can work with effectively!