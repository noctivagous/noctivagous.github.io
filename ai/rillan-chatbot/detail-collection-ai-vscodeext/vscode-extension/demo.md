# Rillan AI Workflow Interface - Demo Guide

## Quick Start

### 1. Open the Extension in VS Code
```bash
cd vscode-extension
code .
```

### 2. Launch the Extension
- Press `F5` to launch the Extension Development Host
- A new VS Code window will open with your extension loaded

### 3. Test the Commands

#### Method 1: Start Detail Collection (Recommended)
1. Open Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Type "Start Detail Collection"
3. Enter your project request (e.g., "Build a calculator app", "Create an image of a joker card")
4. The system will:
   - Analyze your request to determine project type and complexity
   - Show a context analysis with suggested approach
   - Present a detail collection form
5. Fill out the form and submit

#### Method 2: Show Detail Collector
1. Open Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Type "Show Detail Collector"
3. This opens the detail collector without initial context analysis

#### Method 3: Quick Collection
1. Open Command Palette (`Cmd+Shift+P` on Mac, `Ctrl+Shift+P` on Windows/Linux)
2. Type "Quick Collection"
3. Use VS Code's native interface for fast detail collection

## How It Works

### Intelligent Context Analysis
The extension automatically analyzes your request to determine:
- **Project Type**: Code, Image, Text, Video, Web, App, or Other
- **Complexity Level**: Simple, Medium, or Complex
- **Suggested Approach**: Based on the analysis

### Dynamic Detail Collection
Based on your project type and complexity, the system generates relevant detail collection forms that include:
- Project name and description
- Type-specific requirements
- Complexity-appropriate detail levels
- Context-aware suggestions

### File Export
All collected details are automatically saved to:
- Location: `.rillan-ai/` folder in your workspace
- Format: JSON with timestamp and full context
- Naming: `rillan-ai-details-[timestamp].json`

## Example Workflows

### Building a Calculator App
1. Start Detail Collection
2. Enter: "Build a calculator app with scientific functions"
3. System detects: Type=Code, Complexity=Medium
4. Collects: Project name, description, programming language preferences, UI requirements
5. Saves details for AI to use in development

### Creating an Image
1. Start Detail Collection
2. Enter: "Create an image of a joker card in dark theme"
3. System detects: Type=Image, Complexity=Simple
4. Collects: Style preferences, color scheme, dimensions, artistic direction
5. Saves details for AI image generation

## Troubleshooting

### Extension Not Loading
- Ensure you're in the Extension Development Host window
- Check the Developer Console for errors
- Verify all dependencies are installed

### Commands Not Available
- Make sure the extension is activated
- Check the Command Palette for the correct command names
- Restart the Extension Development Host if needed

### Form Not Displaying
- Check that the webview is enabled
- Look for JavaScript errors in the Developer Console
- Ensure the context analyzer is working properly

## Development Notes

- The extension uses VS Code's Webview API for interactive forms
- Context analysis is powered by keyword detection and pattern matching
- All collected data is stored locally in your workspace
- The system is designed to be extensible for additional project types
