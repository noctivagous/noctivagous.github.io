import * as vscode from 'vscode';
import { DetailCollectorPanel } from './detailCollectorPanel';
import { AIIntegrationBridge, ConversationContext, ChatMessage } from './aiIntegrationBridge';
import { MCPLauncher } from './mcpLauncher';

export function activate(context: vscode.ExtensionContext) {
    console.log('Rillan AI Workflow Interface extension is now active!');

    // Initialize MCP Server
    const mcpLauncher = MCPLauncher.getInstance(context);
    
    // Register MCP commands
    const mcpCommands = mcpLauncher.registerCommands();
    mcpCommands.forEach(command => context.subscriptions.push(command));
    
    // Auto-start MCP server if configured
    mcpLauncher.autoStart();

    // Command to start the intelligent detail collection process
    let startDetailCollection = vscode.commands.registerCommand('rillan-ai-workflow-interface.startDetailCollection', async () => {
        // Get user request first
        const userRequest = await vscode.window.showInputBox({
            prompt: 'What would you like me to help you create?',
            placeHolder: 'e.g., Build a calculator app, Create an image of a joker card, Write a blog post...',
            validateInput: (text) => {
                if (!text || text.trim().length < 10) {
                    return 'Please provide a detailed description (at least 10 characters)';
                }
                return null;
            }
        });

        if (userRequest) {
            // Create and show the detail collector panel with the user's request
            DetailCollectorPanel.createOrShow(context.extensionUri, userRequest);
        }
    });

    // Command to show the detail collector without initial request
    let showDetailCollector = vscode.commands.registerCommand('rillan-ai-workflow-interface.showDetailCollector', () => {
        DetailCollectorPanel.createOrShow(context.extensionUri);
    });

    // Command for Rillan AI Form Demo
    let rillanDemo = vscode.commands.registerCommand('rillan-ai-workflow-interface.rillanDemo', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const userRequest = await vscode.window.showInputBox({
            prompt: 'What would you like me to help you create? (I\'ll generate a dynamic form for you)',
            placeHolder: 'e.g., "Build a web app for e-commerce" or "Create a mobile game"'
        });

        if (userRequest) {
            const context = {
                messages: [{
                    id: `msg-${Date.now()}`,
                    content: userRequest,
                    role: 'user' as const,
                    timestamp: new Date(),
                    metadata: { source: 'rillan-demo' }
                }],
                currentTask: userRequest
            };
            await bridge.generateFormFromContext(context);
        }
    });

    // Command for Rillan Process Model - Expert-Client Consultation
    let rillanProcessDemo = vscode.commands.registerCommand('rillan-ai-workflow-interface.rillanProcess', async () => {
        const userRequest = await vscode.window.showInputBox({
            prompt: 'What would you like me to help you with? (I\'ll act like a professional consultant)',
            placeHolder: 'e.g., Build a web app, Create a marketing strategy, Design a system architecture...',
            validateInput: (text) => {
                if (!text || text.trim().length < 5) {
                    return 'Please provide a description (at least 5 characters)';
                }
                return null;
            }
        });

        if (userRequest) {
            // Implement the 3-stage Rillan process
            await implementRillanProcess(userRequest, context);
        }
    });

    // Command for quick detail collection using VS Code's native interface
    let quickDetailCollection = vscode.commands.registerCommand('rillan-ai-workflow-interface.quickCollection', async () => {
        const userRequest = await vscode.window.showInputBox({
            prompt: 'What would you like me to help you create?',
            placeHolder: 'Describe your request...',
            validateInput: (text) => {
                if (!text || text.trim().length < 10) {
                    return 'Please provide a detailed description (at least 10 characters)';
                }
                return null;
            }
        });

        if (!userRequest) {return;}

        // Use the context analyzer to determine what details are needed
        const contextAnalyzerModule = await import('./contextAnalyzer');
        const analyzer = new contextAnalyzerModule.ContextAnalyzer();
        const requestContext = analyzer.analyzeRequest(userRequest);

        // Show the suggested approach
        if (requestContext.suggestedApproach) {
            vscode.window.showInformationMessage(
                `Based on your request, here's my suggested approach: ${requestContext.suggestedApproach}`
            );
        }

        // Ask if they want to proceed with detailed collection
        const proceed = await vscode.window.showInformationMessage(
            `I've analyzed your request for a ${requestContext.type} project with ${requestContext.complexity} complexity. Would you like me to collect the specific details needed?`,
            'Yes, Show Details Form',
            'No, Proceed with Basic Info'
        );

        if (proceed === 'Yes, Show Details Form') {
            DetailCollectorPanel.createOrShow(context.extensionUri, userRequest);
        } else {
            // Proceed with basic information collection
            await collectBasicDetails(requestContext, userRequest);
        }
    });

    // AI Integration Commands
    let aiGenerateForm = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiGenerateForm', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        // Simulate AI conversation context
        const userInput = await vscode.window.showInputBox({
            prompt: 'Enter your request (AI will generate appropriate form)',
            placeHolder: 'e.g., I want to build a web application for managing tasks'
        });
        
        if (!userInput) return;
        
        try {
            const conversationContext: ConversationContext = {
                messages: [
                    {
                        id: '1',
                        content: userInput,
                        role: 'user',
                        timestamp: new Date()
                    }
                ],
                projectType: 'unknown',
                currentTask: 'form_generation'
            };
            
            const formId = await bridge.requestFormGeneration({
                id: '',
                context: conversationContext,
                formType: 'project_creation',
                complexity: 'standard',
                purpose: 'collection'
            });
            
            // Register callback to handle form completion
            bridge.registerFormCallback(formId, (response) => {
                vscode.window.showInformationMessage(
                    `AI received form data! Next action: ${response.nextAction}`
                );
            });
            
        } catch (error) {
            bridge.handleError(error as Error, 'AI Form Generation');
        }
    });

    let aiTestFormResponse = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiTestFormResponse', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        // Test form response processing
        const testResponse = {
            formId: 'test-form-123',
            success: true,
            data: {
                projectName: 'Test Project',
                description: 'This is a test project generated by AI',
                framework: 'React'
            },
            nextAction: 'continue' as const
        };
        
        try {
            await bridge.processFormResponse(testResponse);
        } catch (error) {
            bridge.handleError(error as Error, 'Form Response Processing');
        }
    });

    // AI Form Template Commands
    let aiMinimalForm = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiMinimalForm', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const projectType = await vscode.window.showQuickPick(
            ['web', 'mobile', 'desktop', 'api', 'database', 'ai_ml', 'game', 'general'],
            { placeHolder: 'Select project type for minimal form' }
        );
        
        if (!projectType) return;
        
        try {
            const form = bridge.generateMinimalForm('collection', projectType as any, 'Minimal form template');
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Minimal Form Generation');
        }
    });

    let aiStandardForm = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiStandardForm', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const projectType = await vscode.window.showQuickPick(
            ['web', 'mobile', 'desktop', 'api', 'database', 'ai_ml', 'game', 'general'],
            { placeHolder: 'Select project type for standard form' }
        );
        
        if (!projectType) return;
        
        try {
            const form = bridge.generateStandardForm('collection', projectType as any, 'Standard form template');
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Standard Form Generation');
        }
    });

    let aiComprehensiveForm = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiComprehensiveForm', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const projectType = await vscode.window.showQuickPick(
            ['web', 'mobile', 'desktop', 'api', 'database', 'ai_ml', 'game', 'general'],
            { placeHolder: 'Select project type for comprehensive form' }
        );
        
        if (!projectType) return;
        
        try {
            const form = bridge.generateComprehensiveForm('collection', projectType as any, 'Comprehensive form template');
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Comprehensive Form Generation');
        }
    });

    let aiInvestigationForm = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiInvestigationForm', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const description = await vscode.window.showInputBox({
            prompt: 'Describe what you want to investigate',
            placeHolder: 'e.g., Performance issues in the user authentication system'
        });
        
        if (!description) return;
        
        try {
            const form = bridge.generateInvestigationForm({ description });
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Investigation Form Generation');
        }
    });

    let aiRefactoringForm = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiRefactoringForm', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const description = await vscode.window.showInputBox({
            prompt: 'Describe what you want to refactor',
            placeHolder: 'e.g., Legacy payment processing module needs modernization'
        });
        
        if (!description) return;
        
        try {
            const form = bridge.generateRefactoringForm({ description });
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Refactoring Form Generation');
        }
    });

    // NEW: Specialized Form Templates Test Commands
    let aiInvestigationFormEnhanced = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiInvestigationFormEnhanced', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const description = await vscode.window.showInputBox({
            prompt: 'What do you want to investigate?',
            placeHolder: 'e.g., Performance issues in the user authentication system'
        });
        
        if (!description) return;
        
        try {
            // AI can customize the investigation form
            const aiCustomizations = {
                title: '🔍 Custom Investigation: Performance Analysis',
                complexity: 'comprehensive' as const,
                customization: {
                    submitButtonText: 'Begin Deep Investigation',
                    theme: 'default' as const
                }
            };
            
            const form = bridge.generateInvestigationForm({ description }, aiCustomizations);
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Enhanced Investigation Form');
        }
    });

    let aiRefactoringFormEnhanced = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiRefactoringFormEnhanced', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const description = await vscode.window.showInputBox({
            prompt: 'What code needs refactoring?',
            placeHolder: 'e.g., Legacy payment processing module'
        });
        
        if (!description) return;
        
        try {
            // AI can customize the refactoring form
            const aiCustomizations = {
                title: '🔧 Smart Refactoring Assistant',
                complexity: 'comprehensive' as const,
                customization: {
                    submitButtonText: 'Generate Refactoring Strategy',
                    showProgress: true
                }
            };
            
            const form = bridge.generateRefactoringForm({ description }, aiCustomizations);
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Enhanced Refactoring Form');
        }
    });

    let aiInstructionFormEnhanced = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiInstructionFormEnhanced', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        const description = await vscode.window.showInputBox({
            prompt: 'What task should the AI perform?',
            placeHolder: 'e.g., Create a REST API for user management'
        });
        
        if (!description) return;
        
        try {
            // AI can customize the instruction form
            const aiCustomizations = {
                title: '🤖 AI Task Configuration',
                sections: [
                    {
                        id: 'task-definition',
                        title: 'Task Definition',
                        description: 'Define what the AI should do',
                        fields: [
                            {
                                id: 'taskDescription',
                                type: 'textarea' as const,
                                label: 'Task Description',
                                description: 'Clearly describe what you want the AI to accomplish',
                                required: true,
                                defaultValue: description
                            },
                            {
                                id: 'complexity',
                                type: 'select' as const,
                                label: 'Task Complexity',
                                options: [
                                    { value: 'simple', label: 'Simple (basic implementation)' },
                                    { value: 'moderate', label: 'Moderate (with best practices)' },
                                    { value: 'complex', label: 'Complex (enterprise-grade)' }
                                ]
                            }
                        ]
                    }
                ],
                customization: {
                    submitButtonText: 'Execute AI Task',
                    allowSkip: false
                }
            };
            
            const form = bridge.generateInstructionForm({ description }, aiCustomizations);
            DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, form);
        } catch (error) {
            bridge.handleError(error as Error, 'Enhanced Instruction Form');
        }
    });

    // NEW: Enhanced AI Form Specification Test Command
    let aiEnhancedSpecTest = vscode.commands.registerCommand('rillan-ai-workflow-interface.aiEnhancedSpecTest', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        // This simulates what I (as the AI) would specify for a form
        const enhancedAIFormSpec = {
            id: 'ai-enhanced-test',
            title: '🤖 AI-Specified Enhanced Form',
            description: 'This form was generated using the enhanced AI specification interface. I (the AI) specified exactly what fields, validation, and layout I wanted.',
            formType: 'project_creation' as const,
            complexity: 'standard' as const,
            purpose: 'collection' as const,
            sections: [
                {
                    id: 'project-overview',
                    title: 'Project Overview',
                    description: 'Let me understand what you want to build',
                    fields: [
                        {
                            id: 'projectName',
                            type: 'text' as const,
                            label: 'Project Name',
                            description: 'What should we call this project?',
                            required: true,
                            placeholder: 'My Awesome Project',
                            validation: {
                                minLength: 3,
                                maxLength: 50,
                                customMessage: 'Project name must be between 3-50 characters'
                            }
                        },
                        {
                            id: 'projectType',
                            type: 'select' as const,
                            label: 'Project Type',
                            description: 'What kind of project is this?',
                            required: true,
                            options: [
                                { value: 'web', label: 'Web Application', description: 'Browser-based application' },
                                { value: 'mobile', label: 'Mobile App', description: 'iOS/Android application' },
                                { value: 'desktop', label: 'Desktop Software', description: 'Windows/Mac/Linux application' },
                                { value: 'api', label: 'API/Backend', description: 'Server-side service' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 2,
                                allowAdditions: true,
                                addButtonText: 'Add Custom Type'
                            }
                        }
                    ],
                    slideIndex: 0
                },
                {
                    id: 'technical-details',
                    title: 'Technical Requirements',
                    description: 'Now let\'s get into the technical specifics',
                    fields: [
                        {
                            id: 'technologies',
                            type: 'multiselect' as const,
                            label: 'Preferred Technologies',
                            description: 'Select all technologies you\'d like to use',
                            options: [
                                { value: 'react', label: 'React' },
                                { value: 'vue', label: 'Vue.js' },
                                { value: 'angular', label: 'Angular' },
                                { value: 'node', label: 'Node.js' },
                                { value: 'python', label: 'Python' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 3,
                                allowAdditions: true,
                                addButtonText: '+ Add Technology'
                            }
                        },
                        {
                            id: 'complexity',
                            type: 'slider' as const,
                            label: 'Project Complexity',
                            description: 'How complex should this project be?',
                            defaultValue: 5,
                            validation: {
                                customMessage: 'Complexity level from 1 (simple) to 10 (enterprise-grade)'
                            }
                        }
                    ],
                    slideIndex: 1
                },
                {
                    id: 'project-goals',
                    title: 'Goals & Timeline',
                    description: 'Finally, let\'s talk about your goals and timeline',
                    fields: [
                        {
                            id: 'goals',
                            type: 'textarea' as const,
                            label: 'Project Goals',
                            description: 'What do you hope to achieve with this project?',
                            required: true,
                            placeholder: 'Describe your main objectives...',
                            validation: {
                                minLength: 20,
                                customMessage: 'Please provide at least 20 characters describing your goals'
                            }
                        },
                        {
                            id: 'timeline',
                            type: 'select' as const,
                            label: 'Desired Timeline',
                            options: [
                                { value: 'asap', label: 'ASAP (Rush job)' },
                                { value: '1week', label: '1 Week' },
                                { value: '1month', label: '1 Month' },
                                { value: '3months', label: '3 Months' },
                                { value: 'flexible', label: 'Flexible' }
                            ]
                        }
                    ],
                    slideIndex: 2
                }
            ],
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both' as const,
                progressIndicator: true,
                autoAdvance: false
            },
            validation: {
                requiredSections: ['project-overview', 'project-goals']
            },
            customization: {
                submitButtonText: 'Send to AI for Analysis',
                allowSkip: false,
                showProgress: true,
                theme: 'default' as const
            }
        };
        
        try {
            const formId = await bridge.generateFormFromAISpec(enhancedAIFormSpec);
            
            // Register callback to handle the response
            bridge.registerFormCallback(formId, (response) => {
                vscode.window.showInformationMessage(
                    `🎉 AI received enhanced form data! The AI specification interface is working perfectly. Form ID: ${response.formId}`,
                    'View Response Data'
                ).then(selection => {
                    if (selection === 'View Response Data') {
                        vscode.workspace.openTextDocument({
                            content: JSON.stringify(response.data, null, 2),
                            language: 'json'
                        }).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            });
            
        } catch (error) {
            bridge.handleError(error as Error, 'Enhanced AI Specification Test');
        }
    });

    // Command to test slideshow functionality specifically
    let testSlideshowDemo = vscode.commands.registerCommand('rillan-ai-workflow-interface.testSlideshow', () => {
        const slideshowTestForm = {
            id: 'slideshow-test-form',
            title: '🎬 Slideshow Demo Form',
            description: 'This form demonstrates the slideshow functionality with navigation controls, progress indicators, and smooth transitions.',
            stage: 'preliminary' as const,
            sections: [
                {
                    id: 'slide1',
                    title: 'Welcome to Slideshow Mode',
                    fields: [
                        {
                            id: 'userName',
                            type: 'text' as const,
                            label: 'Your Name',
                            required: true,
                            placeholder: 'Enter your name'
                        },
                        {
                            id: 'experience',
                            type: 'select' as const,
                            label: 'Experience Level',
                            options: ['Beginner', 'Intermediate', 'Advanced', 'Expert']
                        }
                    ]
                },
                {
                    id: 'slide2',
                    title: 'Project Preferences',
                    fields: [
                        {
                            id: 'projectTypes',
                            type: 'multiselect' as const,
                            label: 'Interested Project Types',
                            options: ['Web Development', 'Mobile Apps', 'Desktop Software', 'AI/ML', 'Data Science']
                        },
                        {
                            id: 'complexity',
                            type: 'slider' as const,
                            label: 'Preferred Complexity',
                            min: 1,
                            max: 10,
                            defaultValue: 5,
                            description: 'How complex do you like your projects?'
                        }
                    ]
                },
                {
                    id: 'slide3',
                    title: 'Final Details',
                    fields: [
                        {
                            id: 'goals',
                            type: 'textarea' as const,
                            label: 'Your Goals',
                            description: 'What do you hope to achieve?',
                            required: true
                        },
                        {
                            id: 'newsletter',
                            type: 'checkbox' as const,
                            label: 'Subscribe to Newsletter',
                            defaultValue: false
                        }
                    ]
                }
            ],
            submitLabel: 'Complete Demo',
            allowSkip: false,
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both' as const,
                progressIndicator: true
            },
            formStyle: 'slideshow' as const
        };
        
        DetailCollectorPanel.showAIGeneratedForm(context.extensionUri, slideshowTestForm);
    });

    // Test command for AI form suggestions
    let testAISuggestion = vscode.commands.registerCommand('rillan-ai-workflow-interface.testAISuggestion', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        
        try {
            // Create a test suggestion
            const suggestionId = await bridge.suggestForm({
                title: '🔍 Project Investigation Form',
                description: 'AI detected you might need to investigate a project issue',
                reason: 'Based on your recent messages about performance problems, I suggest collecting structured information about the issue.',
                priority: 'medium',
                formRequest: {
                    id: '',
                    title: '🔍 Project Investigation Form',
                    description: 'Let\'s gather details about the performance issue you mentioned',
                    formType: 'investigation',
                    complexity: 'standard',
                    purpose: 'investigation',
                    sections: [
                        {
                            id: 'issue-details',
                            title: 'Issue Details',
                            description: 'Tell us about the performance problem',
                            fields: [
                                {
                                    id: 'issueDescription',
                                    type: 'textarea',
                                    label: 'Describe the performance issue',
                                    required: true,
                                    placeholder: 'e.g., Pages load slowly, API responses are delayed...'
                                },
                                {
                                    id: 'affectedAreas',
                                    type: 'multiselect',
                                    label: 'Which areas are affected?',
                                    options: [
                                        { value: 'frontend', label: 'Frontend/UI' },
                                        { value: 'backend', label: 'Backend/API' },
                                        { value: 'database', label: 'Database' },
                                        { value: 'network', label: 'Network' }
                                    ],
                                    gridConfig: {
                                        displayAsGrid: true,
                                        maxColumns: 2,
                                        allowAdditions: true
                                    }
                                }
                            ]
                        }
                    ],
                    slideshow: {
                        enabled: false
                    }
                },
                conversationContext: {
                    messages: [
                        {
                            id: '1',
                            content: 'My app is running slowly and users are complaining',
                            role: 'user',
                            timestamp: new Date()
                        }
                    ]
                }
            });
            
            vscode.window.showInformationMessage(`AI suggestion created with ID: ${suggestionId}`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Error creating AI suggestion: ${error}`);
        }
    });

    // Workflow Orchestration Commands
    let startWorkflow = vscode.commands.registerCommand('rillan-ai-workflow-interface.startWorkflow', async () => {
        const { WorkflowOrchestrator } = await import('./workflowOrchestrator');
        const orchestrator = WorkflowOrchestrator.getInstance(context);
        
        const availableWorkflows = orchestrator.getAvailableWorkflows();
        const workflowNames = availableWorkflows.map(w => `${w.name} - ${w.description}`);
        
        const selectedWorkflow = await vscode.window.showQuickPick(workflowNames, {
            placeHolder: 'Select a workflow to start'
        });
        
        if (!selectedWorkflow) return;
        
        const workflowIndex = workflowNames.indexOf(selectedWorkflow);
        const workflow = availableWorkflows[workflowIndex];
        
        const userRequest = await vscode.window.showInputBox({
            prompt: `Starting workflow: ${workflow.name}`,
            placeHolder: 'Describe your project or requirements...'
        });
        
        if (!userRequest) return;
        
        try {
            const conversationContext = {
                messages: [{
                    id: '1',
                    content: userRequest,
                    role: 'user' as const,
                    timestamp: new Date()
                }]
            };
            
            const instanceId = await orchestrator.startWorkflow(workflow.id, conversationContext, (result) => {
                vscode.window.showInformationMessage(
                    `Workflow "${workflow.name}" completed! Check the results in .rillan-ai folder.`,
                    'View Results'
                ).then(selection => {
                    if (selection === 'View Results') {
                        // Show results in a new document
                        vscode.workspace.openTextDocument({
                            content: JSON.stringify(result.aggregatedData, null, 2),
                            language: 'json'
                        }).then(doc => {
                            vscode.window.showTextDocument(doc);
                        });
                    }
                });
            });
            
            vscode.window.showInformationMessage(`Started workflow: ${workflow.name} (ID: ${instanceId})`);
            
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to start workflow: ${error}`);
        }
    });

    let showActiveWorkflows = vscode.commands.registerCommand('rillan-ai-workflow-interface.showActiveWorkflows', async () => {
        const { WorkflowOrchestrator } = await import('./workflowOrchestrator');
        const orchestrator = WorkflowOrchestrator.getInstance(context);
        
        const activeWorkflows = orchestrator.getActiveWorkflows();
        
        if (activeWorkflows.length === 0) {
            vscode.window.showInformationMessage('No active workflows');
            return;
        }
        
        const workflowItems = activeWorkflows.map(w => 
            `${w.workflowId} - Stage: ${w.currentStage} - Status: ${w.status}`
        );
        
        const selected = await vscode.window.showQuickPick(workflowItems, {
            placeHolder: 'Select a workflow to manage'
        });
        
        if (!selected) return;
        
        const workflowIndex = workflowItems.indexOf(selected);
        const workflow = activeWorkflows[workflowIndex];
        
        const action = await vscode.window.showQuickPick(
            ['Pause', 'Resume', 'Cancel', 'View Details'],
            { placeHolder: `Manage workflow: ${workflow.workflowId}` }
        );
        
        switch (action) {
            case 'Pause':
                if (orchestrator.pauseWorkflow(workflow.id)) {
                    vscode.window.showInformationMessage(`Paused workflow: ${workflow.workflowId}`);
                }
                break;
            case 'Resume':
                if (await orchestrator.resumeWorkflow(workflow.id)) {
                    vscode.window.showInformationMessage(`Resumed workflow: ${workflow.workflowId}`);
                }
                break;
            case 'Cancel':
                const confirm = await vscode.window.showWarningMessage(
                    `Cancel workflow: ${workflow.workflowId}?`,
                    'Yes', 'No'
                );
                if (confirm === 'Yes' && orchestrator.cancelWorkflow(workflow.id)) {
                    vscode.window.showInformationMessage(`Cancelled workflow: ${workflow.workflowId}`);
                }
                break;
            case 'View Details':
                vscode.workspace.openTextDocument({
                    content: JSON.stringify(workflow, null, 2),
                    language: 'json'
                }).then(doc => {
                    vscode.window.showTextDocument(doc);
                });
                break;
        }
    });

    let testDynamicWorkflow = vscode.commands.registerCommand('rillan-ai-workflow-interface.testDynamicWorkflow', async () => {
        const { DynamicWorkflowController } = await import('./dynamicWorkflowController');
        const controller = DynamicWorkflowController.getInstance(context);
        
        // Simulate AI modifying a workflow
        const modification = {
            instanceId: 'test-instance',
            type: 'add_stage' as const,
            newStage: {
                id: 'ai-suggested-stage',
                name: 'AI-Suggested Validation',
                type: 'form' as const,
                formRequest: {
                    id: 'validation-form',
                    title: 'Additional Validation',
                    description: 'AI suggests collecting additional validation data',
                    formType: 'custom' as const,
                    complexity: 'minimal' as const,
                    purpose: 'collection' as const,
                    sections: [{
                        id: 'validation',
                        title: 'Validation Details',
                        fields: [{
                            id: 'validationLevel',
                            type: 'select' as const,
                            label: 'Validation Level',
                            options: [
                                { value: 'basic', label: 'Basic' },
                                { value: 'thorough', label: 'Thorough' },
                                { value: 'comprehensive', label: 'Comprehensive' }
                            ]
                        }]
                    }]
                }
            },
            reason: 'Based on the project complexity, additional validation would improve quality',
            aiContext: {
                messages: [{
                    id: '1',
                    content: 'This is a complex project that needs validation',
                    role: 'assistant' as const,
                    timestamp: new Date()
                }]
            }
        };
        
        try {
            const success = await controller.modifyWorkflow(modification);
            if (success) {
                vscode.window.showInformationMessage('Dynamic workflow modification test completed successfully!');
            } else {
                vscode.window.showWarningMessage('Workflow modification was declined or failed');
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Dynamic workflow test failed: ${error}`);
        }
    });

    // Command to show form suggestion (triggered by status bar or other UI)
    let showFormSuggestion = vscode.commands.registerCommand('rillanAI.showFormSuggestion', async () => {
        const bridge = AIIntegrationBridge.getInstance(context);
        const suggestions = bridge.getActiveSuggestions();
        
        if (suggestions.length === 0) {
            vscode.window.showInformationMessage('No active form suggestions');
            return;
        }
        
        // Show the most recent suggestion
        const suggestion = suggestions[suggestions.length - 1];
        const actions = ['Accept', 'Decline', 'Modify', 'Later'];
        
        const result = await vscode.window.showInformationMessage(
            `AI suggests: ${suggestion.title}\n\n${suggestion.reason}`,
            { modal: true },
            ...actions
        );
        
        if (result) {
            const actionMap: Record<string, 'accept' | 'decline' | 'modify' | 'later'> = {
                'Accept': 'accept',
                'Decline': 'decline', 
                'Modify': 'modify',
                'Later': 'later'
            };
            
            // Handle the action through the bridge's private method
            // For now, we'll implement a simple version
            if (result === 'Accept') {
                try {
                    await bridge.generateFormFromAISpec(suggestion.formRequest);
                    vscode.window.showInformationMessage(`Form "${suggestion.title}" has been generated`);
                } catch (error) {
                    vscode.window.showErrorMessage(`Error generating form: ${error}`);
                }
            } else {
                vscode.window.showInformationMessage(`Form suggestion ${result.toLowerCase()}ed`);
            }
        }
    });

    // Register all commands
    context.subscriptions.push(
        startDetailCollection,
        showDetailCollector,
        quickDetailCollection,
        rillanDemo,
        rillanProcessDemo,
        testSlideshowDemo,
        aiGenerateForm,
        aiTestFormResponse,
        aiMinimalForm,
        aiStandardForm,
        aiComprehensiveForm,
        aiInvestigationForm,
        aiRefactoringForm,
        aiInvestigationFormEnhanced,
        aiRefactoringFormEnhanced,
        aiInstructionFormEnhanced,
        aiEnhancedSpecTest,
        showFormSuggestion,
        testAISuggestion
    );
}

export async function deactivate() {
    console.log('Rillan AI Workflow Interface extension is being deactivated...');
    
    // Cleanup MCP Server
    const mcpLauncher = MCPLauncher.getInstance();
    await mcpLauncher.dispose();
    
    console.log('Extension deactivated successfully');
}

async function collectBasicDetails(requestContext: any, userRequest: string) {
    // Collect minimal required details based on context
    const basicDetails: Record<string, any> = {
        request: userRequest,
        type: requestContext.type,
        complexity: requestContext.complexity
    };

    // Add type-specific basic questions
    switch (requestContext.type) {
        case 'code':
            const language = await vscode.window.showQuickPick(
                ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Other'],
                { placeHolder: 'Select programming language' }
            );
            if (language) {basicDetails.language = language;}
            break;

        case 'image':
            const style = await vscode.window.showQuickPick(
                ['Photorealistic', 'Cartoon/Anime', 'Painting', 'Sketch', 'Abstract', 'Other'],
                { placeHolder: 'Select art style' }
            );
            if (style) {basicDetails.artStyle = style;}
            break;

        case 'text':
            const genre = await vscode.window.showQuickPick(
                ['Story/Fiction', 'Article/Blog', 'Technical Doc', 'Poetry', 'Script', 'Other'],
                { placeHolder: 'Select content type' }
            );
            if (genre) {basicDetails.genre = genre;}
            break;

        case 'web':
            const purpose = await vscode.window.showQuickPick(
                ['Portfolio', 'Business', 'E-commerce', 'Blog', 'Web App', 'Landing Page', 'Other'],
                { placeHolder: 'Select website purpose' }
            );
            if (purpose) {basicDetails.purpose = purpose;}
            break;

        case 'app':
            const platform = await vscode.window.showQuickPick(
                ['iOS', 'Android', 'Windows', 'macOS', 'Cross-platform', 'Web-based', 'Other'],
                { placeHolder: 'Select target platform' }
            );
            if (platform) {basicDetails.platform = platform;}
            break;
    }

    // Save basic details
    await saveBasicDetails(basicDetails);

    vscode.window.showInformationMessage(
        'Basic details collected! I\'ll proceed with your request based on this information.'
    );
}

async function implementRillanProcess(userRequest: string, context: vscode.ExtensionContext) {
    const bridge = AIIntegrationBridge.getInstance(context);
    
    try {
        // Stage 1: Preliminary Questions
        vscode.window.showInformationMessage('🔍 Stage 1: Preliminary Questions - Let me understand your needs like a professional consultant would.');
        
        const conversationContext = {
            messages: [{ id: '1', content: userRequest, role: 'user' as const, timestamp: new Date() }],
            projectType: 'consultation',
            currentTask: 'preliminary_questions'
        };
        
        const preliminaryForm = await bridge.generateFormFromContext(conversationContext);
        const formId = await bridge.generateFormFromAISpec(preliminaryForm);
        
        // Register callback for Stage 2: Plans Notification
        bridge.registerFormCallback(formId, async (response) => {
            if (response.success) {
                await showPlansNotification(response.data, context);
            }
        });
        
    } catch (error) {
        bridge.handleError(error as Error, 'Rillan Process Implementation');
    }
}

async function showPlansNotification(preliminaryData: any, context: vscode.ExtensionContext) {
    // Stage 2: Plans Notification
    vscode.window.showInformationMessage('📋 Stage 2: Plans Notification - Here\'s what I plan to do based on your input.');
    
    const plansSummary = generatePlansSummary(preliminaryData);
    
    const proceed = await vscode.window.showInformationMessage(
        `Based on your input, here's my plan:\n\n${plansSummary}\n\nWould you like me to proceed with this approach?`,
        'Proceed as Planned',
        'Modify Plans',
        'Show Detailed Plans Form'
    );
    
    if (proceed === 'Proceed as Planned') {
        await executeWithGuidance(preliminaryData, context);
    } else if (proceed === 'Modify Plans') {
        await showPlansModificationForm(preliminaryData, context);
    } else if (proceed === 'Show Detailed Plans Form') {
        await showDetailedPlansForm(preliminaryData, context);
    }
}

async function executeWithGuidance(planData: any, context: vscode.ExtensionContext) {
    // Stage 3: Guided Execution
    vscode.window.showInformationMessage('⚡ Stage 3: Guided Execution - I\'ll execute the plan with your oversight.');
    
    // Show execution checklist
    const executionSteps = generateExecutionSteps(planData);
    
    // This would integrate with the actual AI execution
    vscode.window.showInformationMessage(
        `Execution Plan:\n${executionSteps.map((step, i) => `${i + 1}. ${step}`).join('\n')}\n\nI'll now execute these steps and report progress.`
    );
}

function generatePlansSummary(data: any): string {
    // Generate a summary of what the AI plans to do
    return `• Project Type: ${data.projectType || 'General consultation'}
• Approach: ${data.approach || 'Collaborative development'}
• Estimated Complexity: ${data.complexity || 'Standard'}
• Key Focus Areas: ${data.focusAreas?.join(', ') || 'To be determined'}`;
}

function generateExecutionSteps(data: any): string[] {
    // Generate execution steps based on the plan
    return [
        'Analyze requirements and constraints',
        'Create initial structure/framework',
        'Implement core functionality',
        'Add refinements and optimizations',
        'Generate documentation and summaries',
        'Provide post-completion review tools'
    ];
}

async function showPlansModificationForm(data: any, context: vscode.ExtensionContext) {
    // Allow user to modify the AI's plans
    const bridge = AIIntegrationBridge.getInstance(context);
    
    const modificationForm = {
        id: 'plans-modification',
        title: '📝 Modify AI Plans',
        description: 'Adjust what I plan to do before I begin execution',
        formType: 'instruction' as const,
        complexity: 'minimal' as const,
        purpose: 'instruction' as const,
        sections: [
            {
                id: 'plan-adjustments',
                title: 'Plan Adjustments',
                description: 'Modify any aspect of my planned approach',
                fields: [
                    {
                        id: 'approachChanges',
                        type: 'textarea' as const,
                        label: 'Approach Changes',
                        description: 'How would you like me to modify my approach?',
                        placeholder: 'e.g., Focus more on security, use a different framework, add more detail...'
                    },
                    {
                        id: 'priorityAdjustments',
                        type: 'multiselect' as const,
                        label: 'Priority Adjustments',
                        options: [
                            { value: 'performance', label: 'Prioritize Performance' },
                            { value: 'security', label: 'Prioritize Security' },
                            { value: 'simplicity', label: 'Prioritize Simplicity' },
                            { value: 'scalability', label: 'Prioritize Scalability' },
                            { value: 'speed', label: 'Prioritize Development Speed' }
                        ],
                        gridConfig: {
                            displayAsGrid: true,
                            maxColumns: 2,
                            allowAdditions: true
                        }
                    }
                ]
            }
        ],
        slideshow: { enabled: false },
        customization: {
            submitButtonText: 'Update Plans & Execute',
            allowSkip: false
        }
    };
    
    const formId = await bridge.generateFormFromAISpec(modificationForm);
    bridge.registerFormCallback(formId, async (response) => {
        if (response.success) {
            const updatedPlan = { ...data, ...response.data };
            await executeWithGuidance(updatedPlan, context);
        }
    });
}

async function showDetailedPlansForm(data: any, context: vscode.ExtensionContext) {
    // Show detailed plans in an interactive form
    const bridge = AIIntegrationBridge.getInstance(context);
    
    const detailedPlansForm = {
        id: 'detailed-plans',
        title: '📊 Detailed Execution Plans',
        description: 'Review and modify my detailed execution plan',
        formType: 'instruction' as const,
        complexity: 'comprehensive' as const,
        purpose: 'instruction' as const,
        sections: [
            {
                id: 'execution-details',
                title: 'Execution Details',
                description: 'Detailed breakdown of what I will do',
                fields: [
                    {
                        id: 'responseLength',
                        type: 'slider' as const,
                        label: 'Response Length',
                        description: 'How detailed should my response be?',
                        defaultValue: 5
                    },
                    {
                        id: 'sectionsToGenerate',
                        type: 'multiselect' as const,
                        label: 'Sections to Generate',
                        options: [
                            { value: 'overview', label: 'Project Overview' },
                            { value: 'technical', label: 'Technical Details' },
                            { value: 'implementation', label: 'Implementation Guide' },
                            { value: 'examples', label: 'Code Examples' },
                            { value: 'documentation', label: 'Documentation' }
                        ],
                        gridConfig: {
                            displayAsGrid: true,
                            maxColumns: 2,
                            allowAdditions: true
                        }
                    }
                ]
            }
        ],
        slideshow: { enabled: false },
        customization: {
            submitButtonText: 'Execute Detailed Plan',
            allowSkip: false
        }
    };
    
    const formId = await bridge.generateFormFromAISpec(detailedPlansForm);
    bridge.registerFormCallback(formId, async (response) => {
        if (response.success) {
            const detailedPlan = { ...data, ...response.data };
            await executeWithGuidance(detailedPlan, context);
        }
    });
}

async function saveBasicDetails(details: Record<string, any>) {
    try {
        const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
        if (!workspaceFolder) {
            throw new Error('No workspace folder found');
        }

        const fileName = `rillan-ai-basic-details-${Date.now()}.json`;
        const filePath = vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai', fileName);

        // Ensure directory exists
        await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai'));

        const content = JSON.stringify({
            timestamp: new Date().toISOString(),
            details: details
        }, null, 2);

        await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));

        vscode.window.showInformationMessage(`Basic details saved to ${fileName}`);
    } catch (error) {
        vscode.window.showErrorMessage(`Failed to save basic details: ${error}`);
    }
}


// AI Form Generation Function (simulates what an AI would generate)
function generateAIForm(userRequest: string): any {
    const request = userRequest.toLowerCase();
    
    // Simulate AI analysis and form generation
    if (request.includes('web app') || request.includes('website')) {
        return {
            id: 'web-app-form',
            title: '🌐 Web Application Specification',
            description: 'Let\'s gather the details needed to build your web application',
            stage: 'preliminary',
            sections: [
                {
                    id: 'project-basics',
                    title: 'Project Basics',
                    fields: [
                        {
                            id: 'projectName',
                            type: 'text',
                            label: 'Project Name',
                            required: true,
                            placeholder: 'My Awesome Web App'
                        },
                        {
                            id: 'description',
                            type: 'textarea',
                            label: 'Project Description',
                            description: 'Describe what your web app will do',
                            required: true
                        }
                    ]
                },
                {
                    id: 'technical-specs',
                    title: 'Technical Specifications',
                    collapsible: true,
                    defaultExpanded: true,
                    fields: [
                        {
                            id: 'framework',
                            type: 'select',
                            label: 'Frontend Framework',
                            defaultValue: 'react',
                            options: [
                                { value: 'react', label: 'React' },
                                { value: 'vue', label: 'Vue.js' },
                                { value: 'angular', label: 'Angular' },
                                { value: 'vanilla', label: 'Vanilla JavaScript' }
                            ]
                        },
                        {
                            id: 'features',
                            type: 'multiselect',
                            label: 'Required Features',
                            options: ['User Authentication', 'Database Integration', 'API Integration', 'Real-time Updates', 'File Upload', 'Payment Processing']
                        },
                        {
                            id: 'complexity',
                            type: 'slider',
                            label: 'Project Complexity',
                            min: 1,
                            max: 10,
                            defaultValue: 5,
                            description: '1 = Simple landing page, 10 = Complex enterprise app'
                        }
                    ]
                }
            ],
            submitLabel: 'Generate Next Form',
            allowSkip: true,
            skipLabel: 'Skip to Planning',
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            }
        };
    } else if (request.includes('marketing') || request.includes('campaign')) {
        return {
            id: 'marketing-campaign-form',
            title: '📈 Marketing Campaign Planner',
            description: 'Let\'s create a comprehensive marketing strategy',
            stage: 'preliminary',
            sections: [
                {
                    id: 'campaign-basics',
                    title: 'Campaign Overview',
                    fields: [
                        {
                            id: 'campaignName',
                            type: 'text',
                            label: 'Campaign Name',
                            required: true
                        },
                        {
                            id: 'targetAudience',
                            type: 'textarea',
                            label: 'Target Audience',
                            description: 'Describe your ideal customer'
                        },
                        {
                            id: 'budget',
                            type: 'select',
                            label: 'Budget Range',
                            options: ['Under $1,000', '$1,000 - $5,000', '$5,000 - $10,000', '$10,000+']
                        }
                    ]
                },
                {
                    id: 'channels',
                    title: 'Marketing Channels',
                    fields: [
                        {
                            id: 'channels',
                            type: 'multiselect',
                            label: 'Preferred Channels',
                            options: ['Social Media', 'Email Marketing', 'Content Marketing', 'Paid Advertising', 'SEO', 'Influencer Marketing']
                        }
                    ]
                }
            ],
            submitLabel: 'Create Campaign Strategy',
            allowSkip: false,
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            }
        };
    } else {
        // Generic form for other requests - enhanced with multiple sections for slideshow demo
        return {
            id: 'generic-project-form',
            title: '🚀 Project Specification',
            description: `Let's gather details for: "${userRequest}"`,
            stage: 'preliminary',
            sections: [
                {
                    id: 'project-basics',
                    title: 'Project Basics',
                    fields: [
                        {
                            id: 'projectName',
                            type: 'text',
                            label: 'Project Name',
                            required: true,
                            placeholder: 'Enter your project name'
                        },
                        {
                            id: 'projectType',
                            type: 'select',
                            label: 'Project Type',
                            options: ['Software/Code', 'Design/Creative', 'Content/Writing', 'Business/Strategy', 'Other']
                        }
                    ]
                },
                {
                    id: 'project-scope',
                    title: 'Project Scope & Timeline',
                    fields: [
                        {
                            id: 'timeline',
                            type: 'select',
                            label: 'Timeline',
                            options: ['ASAP', '1 week', '1 month', '3 months', '6+ months']
                        },
                        {
                            id: 'budget',
                            type: 'select',
                            label: 'Budget Range',
                            options: ['Under $500', '$500-$2000', '$2000-$5000', '$5000+', 'Not specified']
                        },
                        {
                            id: 'complexity',
                            type: 'slider',
                            label: 'Project Complexity',
                            min: 1,
                            max: 10,
                            defaultValue: 5,
                            description: '1 = Very simple, 10 = Very complex'
                        }
                    ]
                },
                {
                    id: 'project-details',
                    title: 'Project Details',
                    fields: [
                        {
                            id: 'requirements',
                            type: 'textarea',
                            label: 'Specific Requirements',
                            description: 'Any specific requirements or constraints?',
                            required: true
                        },
                        {
                            id: 'features',
                            type: 'multiselect',
                            label: 'Desired Features',
                            options: ['User Interface', 'Database', 'API Integration', 'Authentication', 'Analytics']
                        }
                    ]
                },
                {
                    id: 'project-preferences',
                    title: 'Preferences & Final Details',
                    fields: [
                        {
                            id: 'platform',
                            type: 'radio',
                            label: 'Target Platform',
                            options: ['Web', 'Mobile', 'Desktop', 'Cross-platform']
                        },
                        {
                            id: 'additionalNotes',
                            type: 'textarea',
                            label: 'Additional Notes',
                            description: 'Any other information you\'d like to share?'
                        }
                    ]
                }
            ],
            submitLabel: 'Analyze & Generate Next Steps',
            allowSkip: true,
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            }
        };
    }
}