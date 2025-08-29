import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import * as vscode from 'vscode';
import { AIIntegrationBridge, AIFormRequest, ConversationContext } from './aiIntegrationBridge';
import { DetailCollectorPanel } from './detailCollectorPanel';
import { ContextAnalyzer } from './contextAnalyzer';

/**
 * MCP Server for Rillan AI Workflow Interface Extension
 * Exposes extension functionality as MCP tools for AI agents
 */
export class RillanAIMCPServer {
    private server: Server;
    private extensionContext: vscode.ExtensionContext;
    private aiIntegrationBridge: AIIntegrationBridge;
    private contextAnalyzer: ContextAnalyzer;
    private activeRequests: Map<string, any> = new Map();

    constructor(extensionContext: vscode.ExtensionContext) {
        this.extensionContext = extensionContext;
        this.aiIntegrationBridge = AIIntegrationBridge.getInstance(extensionContext);
        this.contextAnalyzer = new ContextAnalyzer();
        
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

        this.setupToolHandlers();
    }

    private setupToolHandlers() {
        // List available tools
        this.server.setRequestHandler(ListToolsRequestSchema, async () => {
            return {
                tools: [
                    {
                        name: 'analyze_project_context',
                        description: 'Analyze a user request to determine project type, complexity, and required details',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                userRequest: {
                                    type: 'string',
                                    description: 'The user\'s project request or description'
                                }
                            },
                            required: ['userRequest']
                        }
                    },
                    {
                        name: 'generate_detail_collection_form',
                        description: 'Generate a dynamic form for collecting project details based on context',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                userRequest: {
                                    type: 'string',
                                    description: 'The user\'s project request'
                                },
                                formType: {
                                    type: 'string',
                                    enum: ['project_creation', 'investigation', 'refactoring', 'instruction'],
                                    description: 'Type of form to generate'
                                },
                                complexity: {
                                    type: 'string',
                                    enum: ['minimal', 'standard', 'comprehensive'],
                                    description: 'Form complexity level'
                                },
                                showForm: {
                                    type: 'boolean',
                                    description: 'Whether to display the form in VS Code',
                                    default: true
                                }
                            },
                            required: ['userRequest']
                        }
                    },
                    {
                        name: 'create_custom_form',
                        description: 'Create a custom form with specific fields and configuration',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formSpec: {
                                    type: 'object',
                                    description: 'Complete form specification including sections, fields, and configuration'
                                }
                            },
                            required: ['formSpec']
                        }
                    },
                    {
                        name: 'collect_project_details',
                        description: 'Start the complete detail collection workflow for a project',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                userRequest: {
                                    type: 'string',
                                    description: 'The user\'s project request'
                                },
                                skipAnalysis: {
                                    type: 'boolean',
                                    description: 'Skip context analysis and use default form',
                                    default: false
                                }
                            },
                            required: ['userRequest']
                        }
                    },
                    {
                        name: 'get_form_response',
                        description: 'Retrieve the response data from a completed form',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formId: {
                                    type: 'string',
                                    description: 'The ID of the form to get response for'
                                }
                            },
                            required: ['formId']
                        }
                    },
                    {
                        name: 'export_collected_data',
                        description: 'Export collected form data to a file in the workspace',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formId: {
                                    type: 'string',
                                    description: 'The ID of the form data to export'
                                },
                                format: {
                                    type: 'string',
                                    enum: ['json', 'yaml', 'markdown'],
                                    description: 'Export format',
                                    default: 'json'
                                },
                                filename: {
                                    type: 'string',
                                    description: 'Custom filename (optional)'
                                }
                            },
                            required: ['formId']
                        }
                    },
                    {
                        name: 'suggest_form_improvements',
                        description: 'Analyze a form and suggest improvements based on AI best practices',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                formId: {
                                    type: 'string',
                                    description: 'The ID of the form to analyze'
                                },
                                context: {
                                    type: 'string',
                                    description: 'Additional context about the form\'s purpose'
                                }
                            },
                            required: ['formId']
                        }
                    },
                    {
                        name: 'create_investigation_form',
                        description: 'Create a specialized form for investigating project issues',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                issueDescription: {
                                    type: 'string',
                                    description: 'Description of the issue to investigate'
                                },
                                investigationAreas: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Specific areas to focus the investigation on'
                                },
                                urgency: {
                                    type: 'string',
                                    enum: ['low', 'medium', 'high', 'critical'],
                                    description: 'Investigation urgency level',
                                    default: 'medium'
                                }
                            },
                            required: ['issueDescription']
                        }
                    },
                    {
                        name: 'create_refactoring_form',
                        description: 'Create a specialized form for code refactoring planning',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                codeLocation: {
                                    type: 'string',
                                    description: 'Location of code to refactor (file path, class, etc.)'
                                },
                                refactoringGoals: {
                                    type: 'array',
                                    items: { type: 'string' },
                                    description: 'Goals for the refactoring'
                                },
                                allowBreakingChanges: {
                                    type: 'boolean',
                                    description: 'Whether breaking changes are allowed',
                                    default: false
                                }
                            },
                            required: ['codeLocation']
                        }
                    },
                    {
                        name: 'get_workspace_context',
                        description: 'Get context about the current VS Code workspace',
                        inputSchema: {
                            type: 'object',
                            properties: {
                                includeFiles: {
                                    type: 'boolean',
                                    description: 'Include file structure information',
                                    default: false
                                },
                                includeGit: {
                                    type: 'boolean',
                                    description: 'Include git repository information',
                                    default: false
                                }
                            }
                        }
                    }
                ]
            };
        });

        // Handle tool calls
        this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
            const { name, arguments: args } = request.params;

            try {
                if (!args || typeof args !== 'object') {
                    throw new Error('Invalid arguments provided');
                }

                switch (name) {
                    case 'analyze_project_context':
                        return await this.analyzeProjectContext((args as any).userRequest);

                    case 'generate_detail_collection_form':
                        return await this.generateDetailCollectionForm(
                            (args as any).userRequest,
                            (args as any).formType,
                            (args as any).complexity,
                            (args as any).showForm
                        );

                    case 'create_custom_form':
                        return await this.createCustomForm((args as any).formSpec);

                    case 'collect_project_details':
                        return await this.collectProjectDetails((args as any).userRequest, (args as any).skipAnalysis);

                    case 'get_form_response':
                        return await this.getFormResponse((args as any).formId);

                    case 'export_collected_data':
                        return await this.exportCollectedData((args as any).formId, (args as any).format, (args as any).filename);

                    case 'suggest_form_improvements':
                        return await this.suggestFormImprovements((args as any).formId, (args as any).context);

                    case 'create_investigation_form':
                        return await this.createInvestigationForm(
                            (args as any).issueDescription,
                            (args as any).investigationAreas,
                            (args as any).urgency
                        );

                    case 'create_refactoring_form':
                        return await this.createRefactoringForm(
                            (args as any).codeLocation,
                            (args as any).refactoringGoals,
                            (args as any).allowBreakingChanges
                        );

                    case 'get_workspace_context':
                        return await this.getWorkspaceContext((args as any).includeFiles, (args as any).includeGit);

                    default:
                        throw new McpError(
                            ErrorCode.MethodNotFound,
                            `Unknown tool: ${name}`
                        );
                }
            } catch (error) {
                throw new McpError(
                    ErrorCode.InternalError,
                    `Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`
                );
            }
        });
    }

    private async analyzeProjectContext(userRequest: string) {
        const analysis = this.contextAnalyzer.analyzeRequest(userRequest);
        
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
                        recommendedFormType: this.getRecommendedFormType(analysis),
                        analysis: analysis
                    }, null, 2)
                }
            ]
        };
    }

    private async generateDetailCollectionForm(
        userRequest: string,
        formType?: string,
        complexity?: string,
        showForm: boolean = true
    ) {
        try {
            // Analyze the request if no specific type provided
            const analysis = this.contextAnalyzer.analyzeRequest(userRequest);
            
            // Generate form specification based on analysis
            const formId = `mcp-form-${Date.now()}`;
            const form = this.createFormFromAnalysis(analysis, userRequest, formType, complexity, formId);
            
            // Store the form for later retrieval
            this.activeRequests.set(formId, {
                form,
                userRequest,
                analysis,
                timestamp: new Date()
            });

            // Show form in VS Code if requested
            let webviewCreated = false;
            let webviewError = null;
            
            if (showForm) {
                try {
                    console.log('MCP Server: Attempting to create webview...');
                    
                    // Create and show the webview with the generated form
                    const panel = DetailCollectorPanel.showAIGeneratedForm(this.extensionContext.extensionUri, form);
                    
                    if (panel) {
                        webviewCreated = true;
                        console.log('MCP Server: Webview panel created successfully');
                        
                        // Show a notification to the user
                        vscode.window.showInformationMessage(
                            `📋 ${form.title} is ready for you to fill out!`,
                            'View Form'
                        ).then(selection => {
                            if (selection === 'View Form') {
                                // Trigger the command to show the detail collector
                                vscode.commands.executeCommand('rillan-ai-workflow-interface.showDetailCollector');
                            }
                        });
                    } else {
                        webviewError = 'DetailCollectorPanel.showAIGeneratedForm returned null';
                        console.error('MCP Server: Failed to create webview panel');
                    }
                } catch (error) {
                    webviewError = error instanceof Error ? error.message : String(error);
                    console.error('MCP Server: Error creating webview:', webviewError);
                    
                    // Try alternative approach - use the command directly
                    try {
                        console.log('MCP Server: Trying alternative approach with command...');
                        await vscode.commands.executeCommand('rillan-ai-workflow-interface.startDetailCollection');
                        webviewCreated = true;
                        console.log('MCP Server: Alternative command executed successfully');
                    } catch (cmdError) {
                        console.error('MCP Server: Alternative command also failed:', cmdError);
                        webviewError = `Primary: ${webviewError}, Alternative: ${cmdError instanceof Error ? cmdError.message : String(cmdError)}`;
                    }
                }
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            formId,
                            formTitle: form.title,
                            sectionsCount: form.sections?.length || 0,
                            fieldsCount: form.sections?.reduce((total: number, section: any) => 
                                total + (section.fields?.length || 0), 0) || 0,
                            formShown: showForm,
                            webviewCreated: webviewCreated,
                            webviewError: webviewError,
                            message: showForm 
                                ? (webviewCreated 
                                    ? 'Form generated and webview created successfully in VS Code. User can now fill it out.'
                                    : `Form generated but webview creation failed: ${webviewError}`)
                                : 'Form generated successfully. Use show_form to display it.',
                            nextSteps: webviewCreated ? [
                                'User can fill out the form',
                                'Form data will be validated',
                                'Results will be exported to .rillan-ai/ folder'
                            ] : [
                                'Webview creation failed - check VS Code extension is installed and active',
                                'Try manually running "Rillan AI: Start Detail Collection" command',
                                'Check VS Code developer console for errors'
                            ],
                            debugging: {
                                extensionContextExists: !!this.extensionContext,
                                extensionUriExists: !!this.extensionContext?.extensionUri,
                                detailCollectorPanelExists: !!DetailCollectorPanel,
                                timestamp: new Date().toISOString()
                            },
                            form: form
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error)
                        }, null, 2)
                    }
                ]
            };
        }
    }

    private async createCustomForm(formSpec: AIFormRequest) {
        try {
            const formId = await this.aiIntegrationBridge.generateFormFromAISpec(formSpec);
            
            this.activeRequests.set(formId, {
                form: formSpec,
                timestamp: new Date(),
                type: 'custom'
            });

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            formId,
                            message: 'Custom form created and displayed in VS Code',
                            formTitle: formSpec.title,
                            sectionsCount: formSpec.sections.length
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error)
                        }, null, 2)
                    }
                ]
            };
        }
    }

    private async collectProjectDetails(userRequest: string, skipAnalysis: boolean = false) {
        let webviewCreated = false;
        let webviewError = null;
        
        try {
            console.log('MCP Server: collectProjectDetails called with:', { userRequest, skipAnalysis });
            
            if (skipAnalysis) {
                // Use basic detail collection
                console.log('MCP Server: Using basic detail collection...');
                try {
                    const panel = DetailCollectorPanel.createOrShow(this.extensionContext.extensionUri, userRequest);
                    webviewCreated = !!panel;
                    console.log('MCP Server: Basic detail collection result:', webviewCreated);
                } catch (error) {
                    webviewError = error instanceof Error ? error.message : String(error);
                    console.error('MCP Server: Basic detail collection failed:', webviewError);
                }
            } else {
                // Use intelligent detail collection with analysis
                console.log('MCP Server: Using intelligent detail collection with analysis...');
                try {
                    const analysis = this.contextAnalyzer.analyzeRequest(userRequest);
                    console.log('MCP Server: Analysis result:', analysis);
                    
                    const form = this.createFormFromAnalysis(analysis, userRequest, undefined, undefined, `collect-${Date.now()}`);
                    console.log('MCP Server: Form created:', { id: form.id, title: form.title });
                    
                    const panel = DetailCollectorPanel.showAIGeneratedForm(this.extensionContext.extensionUri, form);
                    webviewCreated = !!panel;
                    console.log('MCP Server: Intelligent detail collection result:', webviewCreated);
                    
                    if (webviewCreated) {
                        // Show notification
                        vscode.window.showInformationMessage(
                            `📋 ${form.title} is ready!`,
                            'Open Form'
                        ).then(selection => {
                            if (selection === 'Open Form') {
                                vscode.commands.executeCommand('rillan-ai-workflow-interface.showDetailCollector');
                            }
                        });
                    }
                } catch (error) {
                    webviewError = error instanceof Error ? error.message : String(error);
                    console.error('MCP Server: Intelligent detail collection failed:', webviewError);
                }
            }

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: webviewCreated,
                            message: webviewCreated 
                                ? 'Detail collection workflow started and webview created in VS Code'
                                : `Detail collection workflow failed to create webview: ${webviewError}`,
                            userRequest,
                            analysisSkipped: skipAnalysis,
                            webviewCreated,
                            webviewError,
                            debugging: {
                                extensionContextExists: !!this.extensionContext,
                                extensionUriExists: !!this.extensionContext?.extensionUri,
                                detailCollectorPanelExists: !!DetailCollectorPanel,
                                contextAnalyzerExists: !!this.contextAnalyzer,
                                timestamp: new Date().toISOString()
                            }
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error('MCP Server: collectProjectDetails error:', errorMessage);
            
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: errorMessage,
                            webviewCreated: false,
                            webviewError: errorMessage
                        }, null, 2)
                    }
                ]
            };
        }
    }

    private async getFormResponse(formId: string) {
        // This would need to be implemented to retrieve completed form data
        // For now, return a placeholder response
        const request = this.activeRequests.get(formId);
        
        if (!request) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `No form found with ID: ${formId}`
                        }, null, 2)
                    }
                ]
            };
        }

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        formId,
                        status: 'pending',
                        message: 'Form is still active. Response will be available when user completes the form.',
                        formInfo: {
                            title: request.form.title,
                            created: request.timestamp
                        }
                    }, null, 2)
                }
            ]
        };
    }

    private async exportCollectedData(formId: string, format: string = 'json', filename?: string) {
        // Implementation for exporting form data
        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        message: 'Export functionality would be implemented here',
                        formId,
                        format,
                        filename
                    }, null, 2)
                }
            ]
        };
    }

    private async suggestFormImprovements(formId: string, context?: string) {
        const request = this.activeRequests.get(formId);
        
        if (!request) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: `No form found with ID: ${formId}`
                        }, null, 2)
                    }
                ]
            };
        }

        // Analyze form and suggest improvements
        const suggestions = [
            'Consider adding validation rules for required fields',
            'Group related fields into logical sections',
            'Add help text for complex fields',
            'Consider using grid layout for multiple choice options',
            'Add progress indicators for multi-step forms'
        ];

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify({
                        success: true,
                        formId,
                        suggestions,
                        context,
                        analysisDate: new Date().toISOString()
                    }, null, 2)
                }
            ]
        };
    }

    private async createInvestigationForm(
        issueDescription: string,
        investigationAreas?: string[],
        urgency: string = 'medium'
    ) {
        try {
            const form = this.aiIntegrationBridge.generateInvestigationForm({
                description: issueDescription,
                areas: investigationAreas,
                urgency
            });

            const formId = `investigation-${Date.now()}`;
            this.activeRequests.set(formId, {
                form,
                type: 'investigation',
                timestamp: new Date()
            });

            DetailCollectorPanel.showAIGeneratedForm(this.extensionContext.extensionUri, form);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            formId,
                            message: 'Investigation form created and displayed',
                            issueDescription,
                            urgency
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error)
                        }, null, 2)
                    }
                ]
            };
        }
    }

    private async createRefactoringForm(
        codeLocation: string,
        refactoringGoals?: string[],
        allowBreakingChanges: boolean = false
    ) {
        try {
            const form = this.aiIntegrationBridge.generateRefactoringForm({
                location: codeLocation,
                goals: refactoringGoals,
                allowBreaking: allowBreakingChanges
            });

            const formId = `refactoring-${Date.now()}`;
            this.activeRequests.set(formId, {
                form,
                type: 'refactoring',
                timestamp: new Date()
            });

            DetailCollectorPanel.showAIGeneratedForm(this.extensionContext.extensionUri, form);

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: true,
                            formId,
                            message: 'Refactoring form created and displayed',
                            codeLocation,
                            allowBreakingChanges
                        }, null, 2)
                    }
                ]
            };
        } catch (error) {
            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error)
                        }, null, 2)
                    }
                ]
            };
        }
    }

    private async getWorkspaceContext(includeFiles: boolean = false, includeGit: boolean = false) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        const activeEditor = vscode.window.activeTextEditor;
        
        const context = {
            hasWorkspace: !!workspaceFolders,
            workspaceName: workspaceFolders?.[0]?.name,
            workspacePath: workspaceFolders?.[0]?.uri.fsPath,
            activeFile: activeEditor?.document.fileName,
            language: activeEditor?.document.languageId,
            timestamp: new Date().toISOString()
        };

        return {
            content: [
                {
                    type: 'text',
                    text: JSON.stringify(context, null, 2)
                }
            ]
        };
    }

    private createFormFromAnalysis(analysis: any, userRequest: string, formType?: string, complexity?: string, formId?: string): any {
        const finalComplexity = complexity || analysis.complexity || 'standard';
        const finalFormType = formType || this.getRecommendedFormType(analysis);
        
        const form = {
            id: formId || `form-${Date.now()}`,
            title: this.getFormTitle(analysis, finalFormType),
            description: `Collecting details for: ${userRequest}`,
            stage: 'preliminary' as const,
            sections: this.generateFormSections(analysis, finalComplexity, finalFormType),
            submitLabel: this.getSubmitButtonText(finalFormType),
            allowSkip: finalComplexity === 'minimal',
            slideshow: {
                enabled: finalComplexity !== 'minimal',
                sectionsPerSlide: 1,
                navigationStyle: 'both' as const,
                progressIndicator: true,
                autoAdvance: false
            },
            formStyle: finalComplexity === 'minimal' ? 'single_page' as const : 'slideshow' as const
        };

        return form;
    }

    private getFormTitle(analysis: any, formType: string): string {
        const typeMap: Record<string, string> = {
            'project_creation': 'Project Details Collection',
            'investigation': '🔍 Project Investigation',
            'refactoring': '🔧 Code Refactoring Plan',
            'instruction': '🤖 AI Task Configuration'
        };
        return typeMap[formType] || 'Project Details Collection';
    }

    private generateFormSections(analysis: any, complexity: string, formType: string): any[] {
        const sections = [];

        // Always include overview section
        sections.push({
            id: 'overview',
            title: 'Project Overview',
            description: 'Basic information about your project',
            fields: [
                {
                    id: 'name',
                    type: 'text',
                    label: 'Project Name',
                    required: true,
                    placeholder: 'Enter project name'
                },
                {
                    id: 'description',
                    type: 'textarea',
                    label: 'Description',
                    required: true,
                    placeholder: 'Describe your project in detail'
                },
                {
                    id: 'goals',
                    type: 'textarea',
                    label: 'Goals & Objectives',
                    required: complexity !== 'minimal',
                    placeholder: 'What do you want to achieve?'
                }
            ]
        });

        // Add technical section for standard and comprehensive
        if (complexity !== 'minimal') {
            sections.push({
                id: 'technical',
                title: 'Technical Requirements',
                description: 'Technical specifications and preferences',
                fields: [
                    {
                        id: 'technologies',
                        type: 'multiselect',
                        label: 'Preferred Technologies',
                        options: this.getTechnologiesForProjectType(analysis.type),
                        description: 'Select technologies you\'d like to use'
                    },
                    {
                        id: 'architecture',
                        type: 'select',
                        label: 'Architecture Pattern',
                        options: this.getArchitectureOptions(analysis.type),
                        description: 'Choose an architectural approach'
                    },
                    {
                        id: 'constraints',
                        type: 'textarea',
                        label: 'Constraints & Limitations',
                        placeholder: 'Any technical constraints or limitations?'
                    }
                ]
            });
        }

        // Add comprehensive section for detailed forms
        if (complexity === 'comprehensive') {
            sections.push({
                id: 'timeline',
                title: 'Timeline & Resources',
                description: 'Project timeline and resource requirements',
                fields: [
                    {
                        id: 'deadline',
                        type: 'select',
                        label: 'Target Timeline',
                        options: ['1 week', '2-4 weeks', '1-3 months', '3-6 months', '6+ months', 'Flexible'],
                        description: 'When do you need this completed?'
                    },
                    {
                        id: 'team_size',
                        type: 'select',
                        label: 'Team Size',
                        options: ['Solo', '2-3 people', '4-6 people', '7+ people'],
                        description: 'How many people will work on this?'
                    },
                    {
                        id: 'budget',
                        type: 'select',
                        label: 'Budget Range',
                        options: ['Personal project', 'Small budget (<$10k)', 'Medium budget ($10k-$50k)', 'Large budget ($50k+)', 'Enterprise'],
                        description: 'What\'s the budget range for this project?'
                    }
                ]
            });
        }

        return sections;
    }

    private getTechnologiesForProjectType(projectType: string): string[] {
        const techMap: Record<string, string[]> = {
            'web': ['React', 'Vue.js', 'Angular', 'Node.js', 'Express', 'Django', 'Flask', 'Next.js'],
            'mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Xamarin', 'Ionic'],
            'desktop': ['Electron', 'Qt', 'WPF', '.NET', 'JavaFX', 'Tkinter', 'Tauri'],
            'api': ['REST API', 'GraphQL', 'gRPC', 'FastAPI', 'Express.js', 'Django REST'],
            'database': ['PostgreSQL', 'MongoDB', 'MySQL', 'Redis', 'Elasticsearch', 'SQLite'],
            'ai_ml': ['TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'Jupyter'],
            'game': ['Unity', 'Unreal Engine', 'Godot', 'Phaser', 'Three.js', 'GameMaker'],
            'code': ['TypeScript', 'Python', 'Java', 'C#', 'Go', 'Rust', 'JavaScript']
        };
        return techMap[projectType] || ['Custom Technology'];
    }

    private getArchitectureOptions(projectType: string): string[] {
        const archMap: Record<string, string[]> = {
            'web': ['MVC', 'Component-based', 'Microservices', 'Serverless', 'JAMstack'],
            'mobile': ['MVVM', 'MVP', 'Clean Architecture', 'Redux Pattern', 'BLoC Pattern'],
            'desktop': ['MVVM', 'MVP', 'MVC', 'Plugin Architecture', 'Layered Architecture'],
            'api': ['REST', 'GraphQL', 'Microservices', 'Monolithic', 'Event-driven'],
            'database': ['Relational', 'Document-based', 'Key-value', 'Graph', 'Time-series'],
            'ai_ml': ['Pipeline Architecture', 'Microservices', 'Batch Processing', 'Stream Processing'],
            'game': ['Entity-Component-System', 'MVC', 'State Machine', 'Observer Pattern']
        };
        return archMap[projectType] || ['Standard Architecture', 'Custom Architecture'];
    }

    private getSubmitButtonText(formType: string): string {
        const buttonMap: Record<string, string> = {
            'project_creation': 'Create Project Specification',
            'investigation': 'Start Investigation',
            'refactoring': 'Plan Refactoring',
            'instruction': 'Execute Instructions'
        };
        return buttonMap[formType] || 'Submit Details';
    }

    private getRecommendedFormType(analysis: any): string {
        if (analysis.type === 'code' && analysis.complexity === 'complex') {
            return 'comprehensive';
        } else if (analysis.type === 'investigation') {
            return 'investigation';
        } else if (analysis.type === 'refactoring') {
            return 'refactoring';
        } else {
            return 'project_creation';
        }
    }

    public async start() {
        const transport = new StdioServerTransport();
        await this.server.connect(transport);
        console.log('Rillan AI MCP Server started');
    }

    public async stop() {
        await this.server.close();
        console.log('Rillan AI MCP Server stopped');
    }
}