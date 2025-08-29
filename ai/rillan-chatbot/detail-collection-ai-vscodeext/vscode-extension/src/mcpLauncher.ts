import * as vscode from 'vscode';
import { RillanAIMCPServer } from './mcpServer';

/**
 * MCP Server Launcher - Manages the lifecycle of the MCP server within VS Code extension
 */
export class MCPLauncher {
    private static instance: MCPLauncher;
    private mcpServer: RillanAIMCPServer | null = null;
    private extensionContext: vscode.ExtensionContext;
    private isRunning: boolean = false;

    private constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
    }

    public static getInstance(context?: vscode.ExtensionContext): MCPLauncher {
        if (!MCPLauncher.instance && context) {
            MCPLauncher.instance = new MCPLauncher(context);
        }
        return MCPLauncher.instance;
    }

    /**
     * Start the MCP server
     */
    public async startServer(): Promise<boolean> {
        if (this.isRunning) {
            console.log('MCP Server is already running');
            return true;
        }

        try {
            this.mcpServer = new RillanAIMCPServer(this.extensionContext);
            await this.mcpServer.start();
            this.isRunning = true;
            
            // Show status in VS Code
            vscode.window.showInformationMessage(
                '🚀 Rillan AI MCP Server started - AI agents can now control this extension!'
            );
            
            console.log('Rillan AI MCP Server started successfully');
            return true;
        } catch (error) {
            console.error('Failed to start MCP Server:', error);
            vscode.window.showErrorMessage(
                `Failed to start Rillan AI MCP Server: ${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * Stop the MCP server
     */
    public async stopServer(): Promise<boolean> {
        if (!this.isRunning || !this.mcpServer) {
            console.log('MCP Server is not running');
            return true;
        }

        try {
            await this.mcpServer.stop();
            this.mcpServer = null;
            this.isRunning = false;
            
            vscode.window.showInformationMessage('🛑 Rillan AI MCP Server stopped');
            console.log('Rillan AI MCP Server stopped successfully');
            return true;
        } catch (error) {
            console.error('Failed to stop MCP Server:', error);
            vscode.window.showErrorMessage(
                `Failed to stop Rillan AI MCP Server: ${error instanceof Error ? error.message : String(error)}`
            );
            return false;
        }
    }

    /**
     * Restart the MCP server
     */
    public async restartServer(): Promise<boolean> {
        console.log('Restarting MCP Server...');
        await this.stopServer();
        return await this.startServer();
    }

    /**
     * Get server status
     */
    public getStatus(): { running: boolean; uptime?: number } {
        return {
            running: this.isRunning,
            uptime: this.isRunning ? Date.now() : undefined
        };
    }

    /**
     * Register MCP-related commands
     */
    public registerCommands(): vscode.Disposable[] {
        const commands: vscode.Disposable[] = [];

        // Start MCP Server command
        commands.push(
            vscode.commands.registerCommand('rillan-ai-workflow-interface.startMCPServer', async () => {
                await this.startServer();
            })
        );

        // Stop MCP Server command
        commands.push(
            vscode.commands.registerCommand('rillan-ai-workflow-interface.stopMCPServer', async () => {
                await this.stopServer();
            })
        );

        // Restart MCP Server command
        commands.push(
            vscode.commands.registerCommand('rillan-ai-workflow-interface.restartMCPServer', async () => {
                await this.restartServer();
            })
        );

        // Show MCP Server status
        commands.push(
            vscode.commands.registerCommand('rillan-ai-workflow-interface.mcpServerStatus', () => {
                const status = this.getStatus();
                const message = status.running 
                    ? '✅ Rillan AI MCP Server is running and ready for AI agent connections'
                    : '❌ Rillan AI MCP Server is not running';
                
                vscode.window.showInformationMessage(message, 
                    status.running ? 'Stop Server' : 'Start Server'
                ).then(selection => {
                    if (selection === 'Stop Server') {
                        this.stopServer();
                    } else if (selection === 'Start Server') {
                        this.startServer();
                    }
                });
            })
        );

        // Test MCP Server functionality
        commands.push(
            vscode.commands.registerCommand('rillan-ai-workflow-interface.testMCPServer', async () => {
                if (!this.isRunning) {
                    vscode.window.showWarningMessage('MCP Server is not running. Start it first.');
                    return;
                }

                // Show information about available MCP tools
                const toolsInfo = `
🔧 Available MCP Tools:

• analyze_project_context - Analyze user requests
• generate_detail_collection_form - Create dynamic forms
• create_custom_form - Build custom forms
• collect_project_details - Start detail collection workflow
• create_investigation_form - Create investigation forms
• create_refactoring_form - Create refactoring forms
• get_workspace_context - Get VS Code workspace info
• export_collected_data - Export form data

AI agents can now use these tools to control the Rillan AI Workflow Interface extension programmatically!
                `.trim();

                vscode.window.showInformationMessage(
                    'MCP Server is running with 10 available tools',
                    'Show Tools'
                ).then(selection => {
                    if (selection === 'Show Tools') {
                        vscode.workspace.openTextDocument({
                            content: toolsInfo,
                            language: 'markdown'
                        }).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            })
        );

        return commands;
    }

    /**
     * Auto-start server based on configuration
     */
    public async autoStart(): Promise<void> {
        const config = vscode.workspace.getConfiguration('rillanAI');
        const autoStartMCP = config.get<boolean>('autoStartMCPServer', false);

        if (autoStartMCP) {
            console.log('Auto-starting MCP Server based on configuration...');
            await this.startServer();
        }
    }

    /**
     * Cleanup when extension is deactivated
     */
    public async dispose(): Promise<void> {
        if (this.isRunning) {
            console.log('Disposing MCP Server...');
            await this.stopServer();
        }
    }
}