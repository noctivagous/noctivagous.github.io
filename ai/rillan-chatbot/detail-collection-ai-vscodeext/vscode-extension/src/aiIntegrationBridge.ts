import * as vscode from 'vscode';
import { DetailCollectorPanel } from './detailCollectorPanel';
import { DynamicFormGenerator, FormGenerationSpec, ComplexityLevel, FormPurpose, ProjectType } from './dynamicFormGenerator';

/**
 * Enhanced interfaces for AI-Extension communication
 */
export interface AIFormRequest {
    id: string;
    title: string;
    description?: string;
    formType: FormType;
    complexity: 'minimal' | 'standard' | 'comprehensive';
    purpose: 'collection' | 'instruction' | 'investigation' | 'refactoring';
    sections: AIFormSection[];
    slideshow?: SlideshowConfig;
    validation?: FormValidationRules;
    customization?: FormCustomization;
}

export interface AIFormSection {
    id: string;
    title: string;
    description?: string;
    fields: AIFormField[];
    slideIndex?: number;
    required?: boolean;
}

export interface AIFormField {
    id: string;
    type: FieldType;
    label: string;
    description?: string;
    required?: boolean;
    defaultValue?: any;
    options?: AIFieldOption[];
    validation?: FieldValidationRules;
    gridConfig?: GridConfiguration;
    placeholder?: string;
}

export interface AIFieldOption {
    value: string;
    label: string;
    description?: string;
    selected?: boolean;
}

export interface GridConfiguration {
    displayAsGrid: boolean;
    maxColumns?: number;
    allowAdditions?: boolean;
    addButtonText?: string;
}

export interface SlideshowConfig {
    enabled: boolean;
    sectionsPerSlide?: number;
    navigationStyle?: 'arrows' | 'dots' | 'both';
    progressIndicator?: boolean;
    autoAdvance?: boolean;
}

export interface FormValidationRules {
    requiredSections?: string[];
    customRules?: ValidationRule[];
}

export interface FieldValidationRules {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    customMessage?: string;
}

export interface ValidationRule {
    field: string;
    rule: string;
    message: string;
}

export interface FormCustomization {
    theme?: 'default' | 'dark' | 'light';
    submitButtonText?: string;
    allowSkip?: boolean;
    showProgress?: boolean;
}

export interface AIFormResponse {
    formId: string;
    success: boolean;
    data: Record<string, any>;
    userModifications?: FormModification[];
    nextAction?: 'continue' | 'generate_next' | 'complete';
}

export interface ConversationContext {
    messages: ChatMessage[];
    projectType?: string;
    currentTask?: string;
    userPreferences?: UserPreferences;
}

export interface ChatMessage {
    id: string;
    content: string;
    role: 'user' | 'assistant';
    timestamp: Date;
    metadata?: Record<string, any>;
}

export interface FormFieldSpec {
    id: string;
    type: FieldType;
    label: string;
    options?: string[];
    required?: boolean;
    defaultValue?: any;
}

export interface FormModification {
    type: 'add_option' | 'remove_option' | 'modify_field' | 'add_section';
    fieldId: string;
    oldValue?: any;
    newValue: any;
    timestamp: Date;
}

export interface UserPreferences {
    preferredComplexity: 'minimal' | 'standard' | 'comprehensive';
    formStyle: 'slideshow' | 'single_page' | 'accordion';
    gridThreshold: number;
    autoAdvance: boolean;
    allowAISuggestions: boolean;
    autoAcceptSuggestions: boolean;
    suggestionNotificationStyle: 'popup' | 'statusbar' | 'both';
}

/**
 * AI Form Suggestion interfaces
 */
export interface AIFormSuggestion {
    id: string;
    title: string;
    description: string;
    reason: string;
    formRequest: AIFormRequest;
    priority: 'low' | 'medium' | 'high';
    timestamp: Date;
    conversationContext?: ConversationContext;
}

export interface SuggestionResponse {
    suggestionId: string;
    accepted: boolean;
    userFeedback?: string;
    timestamp: Date;
}

export interface SuggestionNotification {
    id: string;
    message: string;
    actions: SuggestionAction[];
    timeout?: number;
    style: 'info' | 'warning' | 'question';
}

export interface SuggestionAction {
    id: string;
    label: string;
    action: 'accept' | 'decline' | 'modify' | 'later';
    primary?: boolean;
}

export type FormType = 'project_creation' | 'investigation' | 'refactoring' | 'instruction' | 'custom';
export type FieldType = 'text' | 'textarea' | 'select' | 'multiselect' | 'checkbox' | 'radio' | 'slider';

/**
 * AI Integration Bridge - Central communication hub between AI and VS Code extension
 */
export class AIIntegrationBridge {
    private static instance: AIIntegrationBridge;
    private extensionContext: vscode.ExtensionContext;
    private activeFormRequests: Map<string, AIFormRequest> = new Map();
    private formResponseCallbacks: Map<string, (response: AIFormResponse) => void> = new Map();
    private formGenerator: DynamicFormGenerator;
    private activeSuggestions: Map<string, AIFormSuggestion> = new Map();
    private suggestionCallbacks: Map<string, (response: SuggestionResponse) => void> = new Map();
    private userPreferences: UserPreferences;

    private constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.formGenerator = new DynamicFormGenerator();
        this.userPreferences = this.getUserPreferences();
    }

    public static getInstance(context?: vscode.ExtensionContext): AIIntegrationBridge {
        if (!AIIntegrationBridge.instance && context) {
            AIIntegrationBridge.instance = new AIIntegrationBridge(context);
        }
        return AIIntegrationBridge.instance;
    }

    /**
     * Generate a form based on conversation context
     */
    public async generateFormFromContext(context: ConversationContext): Promise<any> {
        try {
            // Analyze context to determine form type and complexity
            const analysis = this.analyzeConversationContext(context);
            
            // Create form generation specification
            const spec: FormGenerationSpec = {
                purpose: analysis.purpose as FormPurpose,
                complexity: analysis.complexity as ComplexityLevel,
                projectType: analysis.projectType as ProjectType,
                context: analysis.context
            };
            
            // Generate form using the dynamic form generator
            const rillanForm = this.formGenerator.generateForm(spec);
            
            return rillanForm;
        } catch (error) {
            console.error('Error generating form from context:', error);
            throw new Error(`Form generation failed: ${error}`);
        }
    }

    /**
     * Generate form from enhanced AI specification
     */
    public async generateFormFromAISpec(request: AIFormRequest): Promise<string> {
        try {
            const formId = `ai-form-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            // Store the request
            this.activeFormRequests.set(formId, { ...request, id: formId });
            
            // Convert AI specification to RillanForm format
            const rillanForm = this.convertAISpecToRillanForm(request, formId);
            
            // Show the form
            DetailCollectorPanel.showAIGeneratedForm(this.extensionContext.extensionUri, rillanForm);
            
            return formId;
        } catch (error) {
            console.error('Error generating form from AI specification:', error);
            throw error;
        }
    }

    /**
     * Request form generation with specific parameters (legacy method)
     */
    public async requestFormGeneration(legacyRequest: any): Promise<string> {
        // Convert legacy request to new format
        const enhancedRequest: AIFormRequest = this.convertLegacyToEnhancedRequest(legacyRequest);
        return this.generateFormFromAISpec(enhancedRequest);
    }

    /**
     * Convert legacy request format to enhanced format
     */
    private convertLegacyToEnhancedRequest(legacyRequest: any): AIFormRequest {
        return {
            id: legacyRequest.id || `legacy-${Date.now()}`,
            title: `${legacyRequest.purpose} Form`,
            description: `Generated form for ${legacyRequest.formType}`,
            formType: legacyRequest.formType,
            complexity: legacyRequest.complexity,
            purpose: legacyRequest.purpose,
            sections: legacyRequest.customFields ? [
                {
                    id: 'main-section',
                    title: 'Details',
                    description: 'Please provide the following information',
                    fields: legacyRequest.customFields.map((field: any) => ({
                        id: field.id,
                        type: field.type,
                        label: field.label,
                        required: field.required || false,
                        options: field.options?.map((opt: string) => ({ value: opt, label: opt })) || []
                    }))
                }
            ] : [
                {
                    id: 'basic-section',
                    title: 'Project Information',
                    description: 'Basic project details',
                    fields: [
                        {
                            id: 'projectName',
                            type: 'text' as const,
                            label: 'Project Name',
                            required: true
                        },
                        {
                            id: 'description',
                            type: 'textarea' as const,
                            label: 'Description',
                            required: true
                        }
                    ]
                }
            ],
            slideshow: {
                enabled: false
            }
        };
    }

    /**
     * Process form response and notify AI
     */
    public async processFormResponse(response: AIFormResponse): Promise<void> {
        try {
            // Get the original request
            const originalRequest = this.activeFormRequests.get(response.formId);
            if (!originalRequest) {
                throw new Error(`No active request found for form ID: ${response.formId}`);
            }

            // Process the response data
            const processedData = this.processResponseData(response.data, originalRequest);
            
            // Save the response
            await this.saveFormResponse(response.formId, processedData);
            
            // Notify AI (callback or message)
            await this.notifyAIFormCompleted(response.formId, processedData);
            
            // Clean up
            this.activeFormRequests.delete(response.formId);
            
        } catch (error) {
            console.error('Error processing form response:', error);
            throw error;
        }
    }

    /**
     * Generate minimal form template
     */
    public generateMinimalForm(purpose: FormPurpose, projectType: ProjectType, context: string): any {
        const spec: FormGenerationSpec = {
            purpose,
            complexity: 'minimal',
            projectType,
            context
        };
        return this.formGenerator.generateForm(spec);
    }

    /**
     * Generate standard form template
     */
    public generateStandardForm(purpose: FormPurpose, projectType: ProjectType, context: string): any {
        const spec: FormGenerationSpec = {
            purpose,
            complexity: 'standard',
            projectType,
            context
        };
        return this.formGenerator.generateForm(spec);
    }

    /**
     * Generate comprehensive form template
     */
    public generateComprehensiveForm(purpose: FormPurpose, projectType: ProjectType, context: string): any {
        const spec: FormGenerationSpec = {
            purpose,
            complexity: 'comprehensive',
            projectType,
            context
        };
        return this.formGenerator.generateForm(spec);
    }

    /**
     * Generate investigation form with AI customization
     */
    public generateInvestigationForm(projectContext: any, aiCustomizations?: Partial<AIFormRequest>): any {
        const baseTemplate = this.createInvestigationTemplate(projectContext);
        return this.applyAICustomizations(baseTemplate, aiCustomizations);
    }

    /**
     * Generate refactoring form with AI customization
     */
    public generateRefactoringForm(codeContext: any, aiCustomizations?: Partial<AIFormRequest>): any {
        const baseTemplate = this.createRefactoringTemplate(codeContext);
        return this.applyAICustomizations(baseTemplate, aiCustomizations);
    }

    /**
     * Generate instruction form with AI customization
     */
    public generateInstructionForm(instructionContext: any, aiCustomizations?: Partial<AIFormRequest>): any {
        const baseTemplate = this.createInstructionTemplate(instructionContext);
        return this.applyAICustomizations(baseTemplate, aiCustomizations);
    }

    /**
     * Create investigation form template
     */
    private createInvestigationTemplate(context: any): AIFormRequest {
        return {
            id: `investigation-${Date.now()}`,
            title: '🔍 Project Investigation Form',
            description: `Investigating: ${context.description || 'Project Analysis'}`,
            formType: 'investigation',
            complexity: 'standard',
            purpose: 'investigation',
            sections: [
                {
                    id: 'investigation-scope',
                    title: 'Investigation Scope',
                    description: 'Define what we need to investigate',
                    fields: [
                        {
                            id: 'investigationGoal',
                            type: 'textarea',
                            label: 'What are you trying to understand?',
                            description: 'Describe the specific issue or area you want to investigate',
                            required: true,
                            placeholder: 'e.g., Why is the login system slow? What causes the memory leaks?'
                        },
                        {
                            id: 'investigationAreas',
                            type: 'multiselect',
                            label: 'Areas to Investigate',
                            options: [
                                { value: 'performance', label: 'Performance Issues' },
                                { value: 'bugs', label: 'Bug Analysis' },
                                { value: 'security', label: 'Security Concerns' },
                                { value: 'architecture', label: 'Architecture Review' },
                                { value: 'dependencies', label: 'Dependencies Analysis' },
                                { value: 'user-experience', label: 'User Experience' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 2,
                                allowAdditions: true,
                                addButtonText: 'Add Custom Area'
                            }
                        }
                    ]
                },
                {
                    id: 'investigation-context',
                    title: 'Context & Symptoms',
                    description: 'Provide context about the issue',
                    fields: [
                        {
                            id: 'symptoms',
                            type: 'textarea',
                            label: 'Observed Symptoms',
                            description: 'What specific problems have you noticed?',
                            placeholder: 'e.g., Page loads take 5+ seconds, users report errors...'
                        },
                        {
                            id: 'frequency',
                            type: 'select',
                            label: 'How Often Does This Occur?',
                            options: [
                                { value: 'always', label: 'Always' },
                                { value: 'frequently', label: 'Frequently (>50% of time)' },
                                { value: 'sometimes', label: 'Sometimes (10-50% of time)' },
                                { value: 'rarely', label: 'Rarely (<10% of time)' },
                                { value: 'unknown', label: 'Unknown' }
                            ]
                        },
                        {
                            id: 'impactLevel',
                            type: 'select',
                            label: 'Impact Level',
                            options: [
                                { value: 'critical', label: 'Critical - System Unusable' },
                                { value: 'high', label: 'High - Major Functionality Affected' },
                                { value: 'medium', label: 'Medium - Some Features Impacted' },
                                { value: 'low', label: 'Low - Minor Inconvenience' }
                            ]
                        }
                    ]
                },
                {
                    id: 'investigation-resources',
                    title: 'Available Resources',
                    description: 'What resources do we have for investigation?',
                    fields: [
                        {
                            id: 'accessLevel',
                            type: 'multiselect',
                            label: 'What Access Do You Have?',
                            options: [
                                { value: 'source-code', label: 'Source Code' },
                                { value: 'logs', label: 'Application Logs' },
                                { value: 'database', label: 'Database Access' },
                                { value: 'monitoring', label: 'Monitoring Tools' },
                                { value: 'user-feedback', label: 'User Feedback' },
                                { value: 'team-knowledge', label: 'Team Knowledge' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 2,
                                allowAdditions: true
                            }
                        },
                        {
                            id: 'timeframe',
                            type: 'select',
                            label: 'Investigation Timeframe',
                            options: [
                                { value: 'urgent', label: 'Urgent (within hours)' },
                                { value: 'soon', label: 'Soon (within days)' },
                                { value: 'planned', label: 'Planned (within weeks)' },
                                { value: 'flexible', label: 'Flexible timeline' }
                            ]
                        }
                    ]
                }
            ],
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            },
            customization: {
                submitButtonText: 'Start Investigation',
                allowSkip: false,
                showProgress: true
            }
        };
    }

    /**
     * Create refactoring form template
     */
    private createRefactoringTemplate(context: any): AIFormRequest {
        return {
            id: `refactoring-${Date.now()}`,
            title: '🔧 Code Refactoring Form',
            description: `Refactoring: ${context.description || 'Code Improvement'}`,
            formType: 'refactoring',
            complexity: 'standard',
            purpose: 'refactoring',
            sections: [
                {
                    id: 'refactoring-target',
                    title: 'Refactoring Target',
                    description: 'What code needs to be refactored?',
                    fields: [
                        {
                            id: 'codeLocation',
                            type: 'text',
                            label: 'Code Location',
                            description: 'File path, class name, or module to refactor',
                            required: true,
                            placeholder: 'e.g., src/components/UserAuth.js, PaymentProcessor class'
                        },
                        {
                            id: 'refactoringGoals',
                            type: 'multiselect',
                            label: 'Refactoring Goals',
                            options: [
                                { value: 'performance', label: 'Improve Performance' },
                                { value: 'readability', label: 'Improve Readability' },
                                { value: 'maintainability', label: 'Improve Maintainability' },
                                { value: 'testability', label: 'Improve Testability' },
                                { value: 'security', label: 'Fix Security Issues' },
                                { value: 'modernize', label: 'Modernize Code' },
                                { value: 'reduce-complexity', label: 'Reduce Complexity' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 2,
                                allowAdditions: true
                            }
                        }
                    ]
                },
                {
                    id: 'current-issues',
                    title: 'Current Issues',
                    description: 'What problems exist with the current code?',
                    fields: [
                        {
                            id: 'currentProblems',
                            type: 'textarea',
                            label: 'Current Problems',
                            description: 'Describe specific issues with the existing code',
                            required: true,
                            placeholder: 'e.g., Code is hard to test, performance is slow, difficult to understand...'
                        },
                        {
                            id: 'codeSmells',
                            type: 'multiselect',
                            label: 'Code Smells Identified',
                            options: [
                                { value: 'long-methods', label: 'Long Methods' },
                                { value: 'large-classes', label: 'Large Classes' },
                                { value: 'duplicate-code', label: 'Duplicate Code' },
                                { value: 'complex-conditionals', label: 'Complex Conditionals' },
                                { value: 'tight-coupling', label: 'Tight Coupling' },
                                { value: 'magic-numbers', label: 'Magic Numbers/Strings' },
                                { value: 'poor-naming', label: 'Poor Naming' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 2,
                                allowAdditions: true
                            }
                        }
                    ]
                },
                {
                    id: 'refactoring-constraints',
                    title: 'Constraints & Requirements',
                    description: 'What constraints should we consider?',
                    fields: [
                        {
                            id: 'breakingChanges',
                            type: 'select',
                            label: 'Breaking Changes Allowed?',
                            options: [
                                { value: 'none', label: 'No Breaking Changes' },
                                { value: 'minimal', label: 'Minimal Breaking Changes OK' },
                                { value: 'major', label: 'Major Changes OK' },
                                { value: 'complete-rewrite', label: 'Complete Rewrite OK' }
                            ]
                        },
                        {
                            id: 'testCoverage',
                            type: 'select',
                            label: 'Current Test Coverage',
                            options: [
                                { value: 'none', label: 'No Tests' },
                                { value: 'minimal', label: 'Minimal Tests' },
                                { value: 'partial', label: 'Partial Coverage' },
                                { value: 'good', label: 'Good Coverage' },
                                { value: 'comprehensive', label: 'Comprehensive Tests' }
                            ]
                        },
                        {
                            id: 'timeline',
                            type: 'select',
                            label: 'Refactoring Timeline',
                            options: [
                                { value: 'immediate', label: 'Immediate (hours)' },
                                { value: 'short', label: 'Short-term (days)' },
                                { value: 'medium', label: 'Medium-term (weeks)' },
                                { value: 'long', label: 'Long-term (months)' }
                            ]
                        }
                    ]
                }
            ],
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            },
            customization: {
                submitButtonText: 'Create Refactoring Plan',
                allowSkip: false,
                showProgress: true
            }
        };
    }

    /**
     * Create instruction form template
     */
    private createInstructionTemplate(context: any): AIFormRequest {
        return {
            id: `instruction-${Date.now()}`,
            title: '📋 AI Task Instructions Form',
            description: `Instructions for: ${context.description || 'AI Task'}`,
            formType: 'instruction',
            complexity: 'minimal',
            purpose: 'instruction',
            sections: [
                {
                    id: 'task-definition',
                    title: 'Task Definition',
                    description: 'Define what the AI should do',
                    fields: [
                        {
                            id: 'taskDescription',
                            type: 'textarea',
                            label: 'Task Description',
                            description: 'Clearly describe what you want the AI to accomplish',
                            required: true,
                            placeholder: 'e.g., Create a REST API for user management, Write unit tests for the payment module...'
                        },
                        {
                            id: 'taskType',
                            type: 'select',
                            label: 'Task Type',
                            options: [
                                { value: 'code-generation', label: 'Code Generation' },
                                { value: 'code-review', label: 'Code Review' },
                                { value: 'documentation', label: 'Documentation' },
                                { value: 'testing', label: 'Testing' },
                                { value: 'debugging', label: 'Debugging' },
                                { value: 'optimization', label: 'Optimization' },
                                { value: 'analysis', label: 'Analysis' }
                            ]
                        }
                    ]
                },
                {
                    id: 'task-requirements',
                    title: 'Requirements & Preferences',
                    description: 'Specify requirements and preferences',
                    fields: [
                        {
                            id: 'requirements',
                            type: 'textarea',
                            label: 'Specific Requirements',
                            description: 'List any specific requirements or constraints',
                            placeholder: 'e.g., Must use TypeScript, Follow existing code style, Include error handling...'
                        },
                        {
                            id: 'preferences',
                            type: 'multiselect',
                            label: 'Preferences',
                            options: [
                                { value: 'detailed-comments', label: 'Detailed Comments' },
                                { value: 'step-by-step', label: 'Step-by-step Explanation' },
                                { value: 'best-practices', label: 'Follow Best Practices' },
                                { value: 'error-handling', label: 'Include Error Handling' },
                                { value: 'performance-focused', label: 'Performance Focused' },
                                { value: 'security-focused', label: 'Security Focused' }
                            ],
                            gridConfig: {
                                displayAsGrid: true,
                                maxColumns: 2,
                                allowAdditions: true
                            }
                        },
                        {
                            id: 'outputFormat',
                            type: 'select',
                            label: 'Preferred Output Format',
                            options: [
                                { value: 'code-only', label: 'Code Only' },
                                { value: 'code-with-comments', label: 'Code with Comments' },
                                { value: 'code-with-explanation', label: 'Code with Explanation' },
                                { value: 'step-by-step-guide', label: 'Step-by-step Guide' }
                            ]
                        }
                    ]
                }
            ],
            slideshow: {
                enabled: false
            },
            customization: {
                submitButtonText: 'Execute AI Task',
                allowSkip: true,
                showProgress: false
            }
        };
    }

    /**
     * Apply AI customizations to a base template
     */
    private applyAICustomizations(baseTemplate: AIFormRequest, customizations?: Partial<AIFormRequest>): any {
        if (!customizations) {
            return this.convertAISpecToRillanForm(baseTemplate, baseTemplate.id);
        }

        // Merge customizations with base template
        const customizedTemplate: AIFormRequest = {
            ...baseTemplate,
            ...customizations,
            sections: customizations.sections || baseTemplate.sections,
            slideshow: customizations.slideshow ? { ...baseTemplate.slideshow, ...customizations.slideshow } : baseTemplate.slideshow,
            customization: customizations.customization ? { ...baseTemplate.customization, ...customizations.customization } : baseTemplate.customization
        };

        return this.convertAISpecToRillanForm(customizedTemplate, customizedTemplate.id);
    }

    /**
     * Notify AI that form has been completed
     */
    public async notifyAIFormCompleted(formId: string, data: any): Promise<void> {
        try {
            // For now, show the data in VS Code
            // In future, this would send data back to AI chat context
            const message = `Form ${formId} completed with data: ${JSON.stringify(data, null, 2)}`;
            
            vscode.window.showInformationMessage(
                'Form completed! Data has been processed.',
                'View Data'
            ).then(selection => {
                if (selection === 'View Data') {
                    // Show data in a new document
                    vscode.workspace.openTextDocument({
                        content: message,
                        language: 'json'
                    }).then(doc => {
                        vscode.window.showTextDocument(doc);
                    });
                }
            });

            // Execute callback if registered
            const callback = this.formResponseCallbacks.get(formId);
            if (callback) {
                callback({
                    formId,
                    success: true,
                    data,
                    nextAction: 'continue'
                });
                this.formResponseCallbacks.delete(formId);
            }
            
        } catch (error) {
            console.error('Error notifying AI of form completion:', error);
            throw error;
        }
    }

    /**
     * Register a callback for form completion
     */
    public registerFormCallback(formId: string, callback: (response: AIFormResponse) => void): void {
        this.formResponseCallbacks.set(formId, callback);
    }

    /**
     * Analyze conversation context to determine form requirements
     */
    private analyzeConversationContext(context: ConversationContext): any {
        // Simple analysis for now - can be enhanced with more sophisticated logic
        const lastMessage = context.messages[context.messages.length - 1];
        const content = lastMessage?.content?.toLowerCase() || '';
        
        let projectType = 'general';
        let complexity = 'standard';
        let purpose = 'collection';
        
        // Detect project type
        if (content.includes('web') || content.includes('website') || content.includes('app')) {
            projectType = 'web';
        } else if (content.includes('code') || content.includes('program') || content.includes('software')) {
            projectType = 'code';
        } else if (content.includes('design') || content.includes('image') || content.includes('visual')) {
            projectType = 'design';
        }
        
        // Detect complexity
        if (content.includes('simple') || content.includes('basic') || content.includes('quick')) {
            complexity = 'minimal';
        } else if (content.includes('complex') || content.includes('advanced') || content.includes('enterprise')) {
            complexity = 'comprehensive';
        }
        
        // Detect purpose
        if (content.includes('investigate') || content.includes('analyze') || content.includes('understand')) {
            purpose = 'investigation';
        } else if (content.includes('refactor') || content.includes('improve') || content.includes('optimize')) {
            purpose = 'refactoring';
        } else if (content.includes('instruction') || content.includes('guide') || content.includes('help')) {
            purpose = 'instruction';
        }
        
        return {
            projectType,
            complexity,
            purpose,
            context: content
        };
    }

    /**
     * Create form specification based on analysis
     */
    private createFormSpecification(analysis: any): any {
        const baseSpec = {
            purpose: analysis.purpose,
            complexity: analysis.complexity,
            projectType: analysis.projectType
        };
        
        // Add fields based on project type and purpose
        const fields: FormFieldSpec[] = [];
        
        if (analysis.purpose === 'collection') {
            fields.push(
                {
                    id: 'projectName',
                    type: 'text' as FieldType,
                    label: 'Project Name',
                    required: true
                },
                {
                    id: 'description',
                    type: 'textarea' as FieldType,
                    label: 'Description',
                    required: true
                }
            );
            
            if (analysis.projectType === 'web') {
                fields.push({
                    id: 'framework',
                    type: 'select' as FieldType,
                    label: 'Framework',
                    options: ['React', 'Vue', 'Angular', 'Vanilla JS']
                });
            } else if (analysis.projectType === 'code') {
                fields.push({
                    id: 'language',
                    type: 'select' as FieldType,
                    label: 'Programming Language',
                    options: ['JavaScript', 'Python', 'Java', 'C++', 'Other']
                });
            }
        }
        
        return {
            ...baseSpec,
            fields
        };
    }

    /**
     * Convert AI specification to RillanForm format
     */
    private convertAISpecToRillanForm(request: AIFormRequest, formId: string): any {
        return {
            id: formId,
            title: request.title,
            description: request.description || `AI-generated form for ${request.purpose}`,
            stage: 'preliminary' as const,
            sections: request.sections.map(section => ({
                id: section.id,
                title: section.title,
                description: section.description,
                fields: section.fields.map(field => ({
                    id: field.id,
                    type: field.type,
                    label: field.label,
                    description: field.description,
                    required: field.required || false,
                    options: field.options?.map(opt => opt.label) || [],
                    defaultValue: field.defaultValue,
                    placeholder: field.placeholder,
                    gridConfig: field.gridConfig
                }))
            })),
            submitLabel: request.customization?.submitButtonText || 'Submit to AI',
            allowSkip: request.customization?.allowSkip || false,
            slideshow: {
                enabled: request.slideshow?.enabled || request.sections.length > 1,
                sectionsPerSlide: request.slideshow?.sectionsPerSlide || 1,
                navigationStyle: request.slideshow?.navigationStyle || 'both' as const,
                progressIndicator: request.slideshow?.progressIndicator !== false
            }
        };
    }

    /**
     * Process response data for AI consumption
     */
    private processResponseData(data: Record<string, any>, request: AIFormRequest): any {
        return {
            formId: request.id,
            timestamp: new Date().toISOString(),
            purpose: request.purpose,
            complexity: request.complexity,
            formType: request.formType,
            responses: data,
            title: request.title
        };
    }

    /**
     * Save form response to workspace
     */
    private async saveFormResponse(formId: string, data: any): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const fileName = `ai-form-response-${formId}.json`;
            const filePath = vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai', fileName);

            // Ensure directory exists
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai'));

            const content = JSON.stringify(data, null, 2);
            await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));

        } catch (error) {
            console.error('Error saving form response:', error);
            throw error;
        }
    }

    /**
     * Handle errors gracefully
     */
    public handleError(error: Error, context?: string): void {
        const message = context ? `${context}: ${error.message}` : error.message;
        console.error('AI Integration Bridge Error:', message);
        
        vscode.window.showErrorMessage(
            `AI Integration Error: ${message}`,
            'Retry',
            'Report Issue'
        ).then(selection => {
            if (selection === 'Report Issue') {
                // Could open issue reporting or logs
                vscode.window.showInformationMessage('Please check the console for detailed error information.');
            }
        });
    }

    /**
     * Suggest a form to the user
     */
    public async suggestForm(suggestion: any): Promise<string> {
        const suggestionId = `suggestion-${Date.now()}`;
        // Store the suggestion for later retrieval
        this.activeSuggestions.set(suggestionId, suggestion);
        return suggestionId;
    }

    /**
     * Get active suggestions
     */
    public getActiveSuggestions(): any[] {
        return Array.from(this.activeSuggestions.values());
    }

    /**
     * Get user preferences
     */
    private getUserPreferences(): UserPreferences {
        return {
            preferredComplexity: 'standard',
            formStyle: 'slideshow',
            gridThreshold: 5,
            autoAdvance: false,
            allowAISuggestions: true,
            autoAcceptSuggestions: false,
            suggestionNotificationStyle: 'popup'
        };
    }
}