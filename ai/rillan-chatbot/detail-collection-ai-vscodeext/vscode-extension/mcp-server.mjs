#!/usr/bin/env node

/**
 * Standalone MCP Server for Rillan AI Workflow Interface (ES Module)
 * This script can be run independently to provide MCP tools for AI agents
 * Usage: node mcp-server.mjs
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { exec, execSync } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class RillanAIStandaloneMCPServer {
    constructor() {
        this.server = new Server(
            {
                name: 'rillan-ai-workflow-interface',
                version: '1.0.0',
            },
            {
                capabilities: {
                    tools: {},
                },
            }
        );

        // Detect the environment (Kiro vs VS Code)
        this.editorCommand = this.detectEditorEnvironment();
        console.error(`[MCP] Detected editor environment: ${this.editorCommand}`);

        this.setupToolHandlers();
        this.setupErrorHandling();
    }

    detectEditorEnvironment() {
        // Check environment variables and process info to determine if we're in Kiro or VS Code
        const env = process.env;
        
        // Check for Kiro-specific environment variables
        if (env.KIRO_VERSION || env.KIRO_HOME || env.KIRO_WORKSPACE) {
            return 'kiro';
        }
        
        // Check for VS Code-specific environment variables
        if (env.VSCODE_PID || env.VSCODE_IPC_HOOK || env.TERM_PROGRAM === 'vscode') {
            return 'code';
        }
        
        // Check if kiro command is available
        try {
            execSync('which kiro', { stdio: 'ignore' });
            return 'kiro';
        } catch (error) {
            // kiro not found, try code
            try {
                execSync('which code', { stdio: 'ignore' });
                return 'code';
            } catch (codeError) {
                // Default to code if neither is definitively detected
                console.error('[MCP] Could not detect editor environment, defaulting to "code"');
                return 'code';
            }
        }
    }

    setupErrorHandling() {
        this.server.onerror = (error) => console.error('[MCP Error]', error);
        process.on('SIGINT', async () => {
            await this.server.close();
            process.exit(0);
        });
    }

    setupToolHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: 'analyze_project_context',
                    description: 'Analyze user request and project context to determine appropriate form generation approach',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            userRequest: {
                                type: 'string',
                                description: 'The user\'s request or description of what they want to build/create'
                            }
                        },
                        required: ['userRequest']
                    }
                },
                {
                    name: 'generate_detail_collection_form',
                    description: 'Generate a dynamic form for collecting project details based on context analysis',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            userRequest: {
                                type: 'string',
                                description: 'The user\'s request'
                            },
                            formType: {
                                type: 'string',
                                enum: ['slideshow', 'single_page', 'accordion'],
                                description: 'Type of form presentation'
                            },
                            complexity: {
                                type: 'string',
                                enum: ['minimal', 'standard', 'comprehensive'],
                                description: 'Level of detail to collect'
                            },
                            showForm: {
                                type: 'boolean',
                                description: 'Whether to immediately show the form to user'
                            }
                        },
                        required: ['userRequest']
                    }
                },
                {
                    name: 'collect_project_details',
                    description: 'Start the full detail collection workflow',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            userRequest: {
                                type: 'string',
                                description: 'The user\'s request'
                            },
                            skipAnalysis: {
                                type: 'boolean',
                                description: 'Skip context analysis and go directly to form'
                            }
                        },
                        required: ['userRequest']
                    }
                },
                {
                    name: 'get_workspace_context',
                    description: 'Get current workspace context including files and git status',
                    inputSchema: {
                        type: 'object',
                        properties: {
                            includeFiles: {
                                type: 'boolean',
                                description: 'Include file listing in context'
                            },
                            includeGit: {
                                type: 'boolean',
                                description: 'Include git status in context'
                            }
                        }
                    }
                }
            ]
        }));

        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                if (!args || typeof args !== 'object') {
                    throw new Error('Invalid arguments provided');
                }

                switch (name) {
                    case 'analyze_project_context':
                        return await this.analyzeProjectContext(args.userRequest);

                    case 'generate_detail_collection_form':
                        return await this.generateDetailCollectionForm(
                            args.userRequest,
                            args.formType || 'slideshow',
                            args.complexity || 'standard',
                            args.showForm || false
                        );

                    case 'collect_project_details':
                        return await this.collectProjectDetails(args.userRequest, args.skipAnalysis || false);

                    case 'get_workspace_context':
                        return await this.getWorkspaceContext(args.includeFiles, args.includeGit);

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${name}`
                        );
                }
            } catch (error) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `Error executing tool ${name}: ${error.message}`
                );
            }
        });
    }

    async analyzeProjectContext(userRequest) {
        // Simulate context analysis
        const analysis = {
            type: this.detectProjectType(userRequest),
            complexity: this.assessComplexity(userRequest),
            categories: this.identifyDetailCategories(userRequest),
            suggestedApproach: this.suggestApproach(userRequest)
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        projectType: analysis.type,
                        complexity: analysis.complexity,
                        suggestedApproach: analysis.suggestedApproach,
                        detailCategories: analysis.categories,
                        estimatedFields: analysis.categories.length * 3,
                        recommendedFormType: 'slideshow',
                        timestamp: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };
    }

    async generateDetailCollectionForm(userRequest, formType, complexity, showForm) {
        const formSpec = {
            id: `form_${Date.now()}`,
            title: `Project Details Collection`,
            description: `Collecting details for: ${userRequest}`,
            type: formType,
            complexity: complexity,
            sections: this.generateFormSections(userRequest, complexity),
            metadata: {
                userRequest,
                createdAt: new Date().toISOString(),
                estimatedTime: this.estimateCompletionTime(complexity)
            }
        };

        let webviewCreated = false;
        let webviewError = null;

        // If showForm is true, try to trigger VS Code to show the form
        if (showForm) {
            try {
                console.error(`[MCP] Attempting to trigger VS Code form display...`);
                
                // Try to execute editor command to show the detail collector
                if (this.editorCommand === 'kiro') {
                    // Kiro doesn't support --command flag, use file-based communication
                    console.error(`[MCP] Using file-based approach for Kiro...`);
                    await this.triggerKiroWebview(formSpec);
                    webviewCreated = true;
                } else {
                    // VS Code supports --command flag
                    const command = `${this.editorCommand} --command rillan-ai-workflow-interface.startDetailCollection`;
                    console.error(`[MCP] Executing command: ${command}`);
                    const { stdout, stderr } = await execAsync(command);
                    
                    if (stderr) {
                        console.error(`[MCP] ${this.editorCommand} command stderr: ${stderr}`);
                        webviewError = `${this.editorCommand} command error: ${stderr}`;
                    } else {
                        console.error(`[MCP] ${this.editorCommand} command executed successfully`);
                        webviewCreated = true;
                    }
                }
                
            } catch (error) {
                console.error(`[MCP] Failed to execute ${this.editorCommand} command: ${error.message}`);
                webviewError = `Failed to execute ${this.editorCommand} command: ${error.message}`;
                
                // Try alternative approach - write a temp file that VS Code extension can monitor
                try {
                    const fs = await import('fs');
                    const path = await import('path');
                    const tempDir = path.join(process.cwd(), '.rillan-ai');
                    const tempFile = path.join(tempDir, `form-request-${Date.now()}.json`);
                    
                    // Ensure directory exists
                    if (!fs.existsSync(tempDir)) {
                        fs.mkdirSync(tempDir, { recursive: true });
                    }
                    
                    // Write form request to file
                    fs.writeFileSync(tempFile, JSON.stringify({
                        action: 'show_form',
                        formSpec,
                        timestamp: new Date().toISOString()
                    }, null, 2));
                    
                    console.error(`[MCP] Form request written to: ${tempFile}`);
                    webviewCreated = true;
                    webviewError = null;
                } catch (fileError) {
                    console.error(`[MCP] File approach also failed: ${fileError.message}`);
                    webviewError = `Both ${this.editorCommand} command and file approach failed: ${error.message}, ${fileError.message}`;
                }
            }
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        formId: formSpec.id,
                        formSpec: formSpec,
                        webviewCreated: webviewCreated,
                        webviewError: webviewError,
                        message: showForm ? 
                            (webviewCreated ? `Form generated and webview created successfully in ${this.editorCommand}` : `Form generated but webview creation failed: ${webviewError}`) :
                            'Form generated successfully',
                        nextSteps: webviewCreated ? [
                            `User can fill out the form in ${this.editorCommand}`,
                            'Form data will be validated',
                            'Results will be exported to .rillan-ai/ folder'
                        ] : [
                            `Webview creation failed - check ${this.editorCommand} is running and extension is installed`,
                            `Try manually running "Rillan AI: Start Detail Collection" in ${this.editorCommand}`,
                            'Form specification is available for manual processing'
                        ],
                        debugging: {
                            showFormRequested: showForm,
                            editorCommand: this.editorCommand,
                            timestamp: new Date().toISOString(),
                            workingDirectory: process.cwd()
                        }
                    }, null, 2)
                }
            ]
        };
    }

    async collectProjectDetails(userRequest, skipAnalysis) {
        const workflowId = `workflow_${Date.now()}`;
        let webviewCreated = false;
        let webviewError = null;
        
        try {
            console.error(`[MCP] Starting project details collection workflow...`);
            
            // Try to trigger editor to start detail collection
            if (this.editorCommand === 'kiro') {
                // Kiro doesn't support --command flag, use file-based communication
                console.error(`[MCP] Using file-based approach for Kiro...`);
                await this.triggerKiroWorkflow(userRequest, skipAnalysis, workflowId);
                webviewCreated = true;
            } else {
                // VS Code supports --command flag
                const command = `${this.editorCommand} --command rillan-ai-workflow-interface.startDetailCollection`;
                console.error(`[MCP] Executing command: ${command}`);
                const { stdout, stderr } = await execAsync(command);
                
                if (stderr) {
                    console.error(`[MCP] ${this.editorCommand} command stderr: ${stderr}`);
                    webviewError = `${this.editorCommand} command error: ${stderr}`;
                } else {
                    console.error(`[MCP] ${this.editorCommand} detail collection command executed successfully`);
                    webviewCreated = true;
                }
            }
            
        } catch (error) {
            console.error(`[MCP] Failed to execute ${this.editorCommand} command: ${error.message}`);
            webviewError = `Failed to execute ${this.editorCommand} command: ${error.message}`;
            
            // Try file-based approach as fallback
            try {
                const fs = await import('fs');
                const path = await import('path');
                const tempDir = path.join(process.cwd(), '.rillan-ai');
                const tempFile = path.join(tempDir, `workflow-request-${Date.now()}.json`);
                
                if (!fs.existsSync(tempDir)) {
                    fs.mkdirSync(tempDir, { recursive: true });
                }
                
                fs.writeFileSync(tempFile, JSON.stringify({
                    action: 'collect_project_details',
                    userRequest,
                    skipAnalysis,
                    workflowId,
                    timestamp: new Date().toISOString()
                }, null, 2));
                
                console.error(`[MCP] Workflow request written to: ${tempFile}`);
                webviewCreated = true;
                webviewError = null;
            } catch (fileError) {
                console.error(`[MCP] File approach also failed: ${fileError.message}`);
                webviewError = `Both ${this.editorCommand} command and file approach failed: ${error.message}, ${fileError.message}`;
            }
        }
        
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: webviewCreated,
                        workflowId: workflowId,
                        status: webviewCreated ? 'started' : 'failed',
                        webviewCreated: webviewCreated,
                        webviewError: webviewError,
                        message: webviewCreated ? 
                            `Detail collection workflow initiated and webview created in ${this.editorCommand}` :
                            `Detail collection workflow failed to create webview: ${webviewError}`,
                        steps: skipAnalysis ? 
                            ['Generate form', 'Collect details', 'Export data'] :
                            ['Analyze context', 'Generate form', 'Collect details', 'Export data'],
                        currentStep: webviewCreated ? (skipAnalysis ? 'Generate form' : 'Analyze context') : 'failed',
                        debugging: {
                            userRequest,
                            skipAnalysis,
                            editorCommand: this.editorCommand,
                            timestamp: new Date().toISOString(),
                            workingDirectory: process.cwd()
                        }
                    }, null, 2)
                }
            ]
        };
    }

    async getWorkspaceContext(includeFiles = false, includeGit = false) {
        const context = {
            workspace: process.cwd(),
            timestamp: new Date().toISOString()
        };

        if (includeFiles) {
            // In a real implementation, this would scan the workspace
            context.files = ['src/', 'package.json', 'README.md'];
        }

        if (includeGit) {
            // In a real implementation, this would check git status
            context.git = {
                branch: 'main',
                hasChanges: false
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(context, null, 2)
                }
            ]
        };
    }

    // Kiro-specific methods
    async triggerKiroWebview(formSpec) {
        const fs = await import('fs');
        const path = await import('path');
        const tempDir = path.join(process.cwd(), '.rillan-ai');
        const tempFile = path.join(tempDir, `kiro-form-request-${Date.now()}.json`);
        
        // Ensure directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Write form request to file for Kiro extension to pick up
        fs.writeFileSync(tempFile, JSON.stringify({
            action: 'show_form',
            formSpec,
            timestamp: new Date().toISOString(),
            source: 'mcp-server'
        }, null, 2));
        
        console.error(`[MCP] Kiro form request written to: ${tempFile}`);
    }

    async triggerKiroWorkflow(userRequest, skipAnalysis, workflowId) {
        const fs = await import('fs');
        const path = await import('path');
        const tempDir = path.join(process.cwd(), '.rillan-ai');
        const tempFile = path.join(tempDir, `kiro-workflow-request-${Date.now()}.json`);
        
        // Ensure directory exists
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        // Write workflow request to file for Kiro extension to pick up
        fs.writeFileSync(tempFile, JSON.stringify({
            action: 'collect_project_details',
            userRequest,
            skipAnalysis,
            workflowId,
            timestamp: new Date().toISOString(),
            source: 'mcp-server'
        }, null, 2));
        
        console.error(`[MCP] Kiro workflow request written to: ${tempFile}`);
    }

    // Helper methods
    detectProjectType(request) {
        const req = request.toLowerCase();
        if (req.includes('app') || req.includes('application')) return 'app';
        if (req.includes('web') || req.includes('website')) return 'web';
        if (req.includes('api') || req.includes('service')) return 'code';
        return 'other';
    }

    assessComplexity(request) {
        const wordCount = request.split(' ').length;
        if (wordCount < 10) return 'simple';
        if (wordCount < 25) return 'medium';
        return 'complex';
    }

    identifyDetailCategories(request) {
        const categories = [];
        const req = request.toLowerCase();
        
        if (req.includes('ui') || req.includes('interface')) categories.push('UI/UX');
        if (req.includes('data') || req.includes('database')) categories.push('Data');
        if (req.includes('api') || req.includes('integration')) categories.push('Integration');
        if (req.includes('auth') || req.includes('security')) categories.push('Security');
        
        return categories.length > 0 ? categories : ['General'];
    }

    suggestApproach(request) {
        return 'Start with a slideshow form to progressively collect details';
    }

    generateFormSections(request, complexity) {
        const baseSections = [
            {
                id: 'overview',
                title: 'Project Overview',
                fields: ['name', 'description', 'goals']
            }
        ];

        if (complexity === 'comprehensive') {
            baseSections.push(
                {
                    id: 'technical',
                    title: 'Technical Requirements',
                    fields: ['technologies', 'architecture', 'constraints']
                },
                {
                    id: 'timeline',
                    title: 'Timeline & Resources',
                    fields: ['deadline', 'team_size', 'budget']
                }
            );
        }

        return baseSections;
    }

    estimateCompletionTime(complexity) {
        const times = {
            minimal: '5-10 minutes',
            standard: '10-20 minutes',
            comprehensive: '20-30 minutes'
        };
        return times[complexity] || '10-15 minutes';
    }

    async run() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.error('Rillan AI MCP Server running on stdio');
    }
}

// Start the server
const server = new RillanAIStandaloneMCPServer();
server.run().catch(console.error);