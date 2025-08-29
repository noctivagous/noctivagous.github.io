import * as vscode from 'vscode';
import { AIIntegrationBridge, AIFormRequest, AIFormResponse, ConversationContext } from './aiIntegrationBridge';

/**
 * Workflow orchestration interfaces for multi-stage AI-driven processes
 */
export interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    stages: WorkflowStage[];
    metadata: WorkflowMetadata;
}

export interface WorkflowStage {
    id: string;
    name: string;
    type: 'form' | 'decision' | 'action' | 'aggregation';
    formRequest?: AIFormRequest;
    conditions?: WorkflowCondition[];
    nextStages?: string[];
    aggregationRules?: AggregationRule[];
}

export interface WorkflowCondition {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists';
    value: any;
    nextStage: string;
}

export interface AggregationRule {
    sourceFields: string[];
    targetField: string;
    operation: 'merge' | 'summarize' | 'calculate' | 'transform';
    parameters?: Record<string, any>;
}

export interface WorkflowMetadata {
    createdBy: 'ai' | 'user';
    createdAt: Date;
    conversationId?: string;
    priority: 'low' | 'medium' | 'high';
    estimatedDuration?: number;
}

export interface WorkflowInstance {
    id: string;
    workflowId: string;
    currentStage: string;
    status: 'pending' | 'active' | 'paused' | 'completed' | 'failed';
    stageData: Map<string, any>;
    aggregatedData: Record<string, any>;
    startTime: Date;
    lastActivity: Date;
    context: ConversationContext;
}

export interface WorkflowResult {
    workflowId: string;
    instanceId: string;
    success: boolean;
    aggregatedData: Record<string, any>;
    stageResults: Map<string, any>;
    completionTime: Date;
    nextActions?: string[];
}

/**
 * Workflow Orchestrator - Manages complex multi-stage AI-driven workflows
 */
export class WorkflowOrchestrator {
    private static instance: WorkflowOrchestrator;
    private extensionContext: vscode.ExtensionContext;
    private aiBridge: AIIntegrationBridge;
    private activeWorkflows: Map<string, WorkflowInstance> = new Map();
    private workflowDefinitions: Map<string, WorkflowDefinition> = new Map();
    private workflowCallbacks: Map<string, (result: WorkflowResult) => void> = new Map();

    private constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.aiBridge = AIIntegrationBridge.getInstance(context);
        this.initializeBuiltInWorkflows();
    }

    public static getInstance(context?: vscode.ExtensionContext): WorkflowOrchestrator {
        if (!WorkflowOrchestrator.instance && context) {
            WorkflowOrchestrator.instance = new WorkflowOrchestrator(context);
        }
        return WorkflowOrchestrator.instance;
    }

    /**
     * Start a new workflow instance
     */
    public async startWorkflow(
        workflowId: string, 
        context: ConversationContext,
        callback?: (result: WorkflowResult) => void
    ): Promise<string> {
        try {
            const workflowDef = this.workflowDefinitions.get(workflowId);
            if (!workflowDef) {
                throw new Error(`Workflow definition not found: ${workflowId}`);
            }

            const instanceId = `workflow-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
            
            const instance: WorkflowInstance = {
                id: instanceId,
                workflowId,
                currentStage: workflowDef.stages[0].id,
                status: 'active',
                stageData: new Map(),
                aggregatedData: {},
                startTime: new Date(),
                lastActivity: new Date(),
                context
            };

            this.activeWorkflows.set(instanceId, instance);
            
            if (callback) {
                this.workflowCallbacks.set(instanceId, callback);
            }

            // Start the first stage
            await this.executeStage(instanceId, workflowDef.stages[0]);

            return instanceId;
        } catch (error) {
            console.error('Error starting workflow:', error);
            throw error;
        }
    }

    /**
     * Process form response and advance workflow
     */
    public async processWorkflowFormResponse(
        instanceId: string, 
        stageId: string, 
        formResponse: AIFormResponse
    ): Promise<void> {
        try {
            const instance = this.activeWorkflows.get(instanceId);
            if (!instance) {
                throw new Error(`Workflow instance not found: ${instanceId}`);
            }

            const workflowDef = this.workflowDefinitions.get(instance.workflowId);
            if (!workflowDef) {
                throw new Error(`Workflow definition not found: ${instance.workflowId}`);
            }

            // Store stage data
            instance.stageData.set(stageId, formResponse.data);
            instance.lastActivity = new Date();

            // Find current stage
            const currentStage = workflowDef.stages.find(s => s.id === stageId);
            if (!currentStage) {
                throw new Error(`Stage not found: ${stageId}`);
            }

            // Determine next stage based on conditions or sequence
            const nextStageId = this.determineNextStage(currentStage, formResponse.data);
            
            if (nextStageId) {
                const nextStage = workflowDef.stages.find(s => s.id === nextStageId);
                if (nextStage) {
                    instance.currentStage = nextStageId;
                    await this.executeStage(instanceId, nextStage);
                } else {
                    // No next stage found, complete workflow
                    await this.completeWorkflow(instanceId);
                }
            } else {
                // No next stage, complete workflow
                await this.completeWorkflow(instanceId);
            }
        } catch (error) {
            console.error('Error processing workflow form response:', error);
            await this.failWorkflow(instanceId, error);
        }
    }

    /**
     * Execute a workflow stage
     */
    private async executeStage(instanceId: string, stage: WorkflowStage): Promise<void> {
        const instance = this.activeWorkflows.get(instanceId);
        if (!instance) {
            throw new Error(`Workflow instance not found: ${instanceId}`);
        }

        switch (stage.type) {
            case 'form':
                if (stage.formRequest) {
                    // Customize form request with workflow context
                    const customizedRequest = this.customizeFormForWorkflow(
                        stage.formRequest, 
                        instance
                    );
                    
                    // Generate form and track it for this workflow
                    const formId = await this.aiBridge.generateFormFromAISpec(customizedRequest);
                    
                    // Store form ID for tracking
                    instance.stageData.set(`${stage.id}_formId`, formId);
                }
                break;

            case 'decision':
                // Process decision logic based on accumulated data
                const nextStageId = this.processDecisionStage(stage, instance);
                if (nextStageId) {
                    const workflowDef = this.workflowDefinitions.get(instance.workflowId);
                    const nextStage = workflowDef?.stages.find(s => s.id === nextStageId);
                    if (nextStage) {
                        instance.currentStage = nextStageId;
                        await this.executeStage(instanceId, nextStage);
                    }
                }
                break;

            case 'action':
                // Execute custom actions (notifications, data processing, etc.)
                await this.executeActionStage(stage, instance);
                break;

            case 'aggregation':
                // Aggregate data from previous stages
                await this.executeAggregationStage(stage, instance);
                break;
        }
    }

    /**
     * Customize form request with workflow context
     */
    private customizeFormForWorkflow(
        baseRequest: AIFormRequest, 
        instance: WorkflowInstance
    ): AIFormRequest {
        const customized = { ...baseRequest };
        
        // Add workflow context to form title and description
        customized.title = `${customized.title} (Step ${this.getCurrentStepNumber(instance)})`;
        customized.description = `${customized.description}\n\nThis is part of a multi-step workflow: ${instance.workflowId}`;
        
        // Add workflow metadata
        if (!customized.customization) {
            customized.customization = {};
        }
        customized.customization.showProgress = true;
        
        return customized;
    }

    /**
     * Determine next stage based on conditions
     */
    private determineNextStage(stage: WorkflowStage, formData: Record<string, any>): string | null {
        if (stage.conditions && stage.conditions.length > 0) {
            // Check conditions to determine next stage
            for (const condition of stage.conditions) {
                if (this.evaluateCondition(condition, formData)) {
                    return condition.nextStage;
                }
            }
        }
        
        // If no conditions match, use the first next stage or null
        return stage.nextStages && stage.nextStages.length > 0 ? stage.nextStages[0] : null;
    }

    /**
     * Evaluate a workflow condition
     */
    private evaluateCondition(condition: WorkflowCondition, data: Record<string, any>): boolean {
        const fieldValue = data[condition.field];
        
        switch (condition.operator) {
            case 'equals':
                return fieldValue === condition.value;
            case 'contains':
                return typeof fieldValue === 'string' && fieldValue.includes(condition.value);
            case 'greater_than':
                return typeof fieldValue === 'number' && fieldValue > condition.value;
            case 'less_than':
                return typeof fieldValue === 'number' && fieldValue < condition.value;
            case 'exists':
                return fieldValue !== undefined && fieldValue !== null && fieldValue !== '';
            default:
                return false;
        }
    }

    /**
     * Process decision stage logic
     */
    private processDecisionStage(stage: WorkflowStage, instance: WorkflowInstance): string | null {
        // Aggregate all data from previous stages
        const allData: Record<string, any> = {};
        for (const [stageId, data] of instance.stageData.entries()) {
            if (!stageId.endsWith('_formId')) {
                Object.assign(allData, data);
            }
        }
        
        // Apply decision logic
        if (stage.conditions) {
            for (const condition of stage.conditions) {
                if (this.evaluateCondition(condition, allData)) {
                    return condition.nextStage;
                }
            }
        }
        
        return stage.nextStages && stage.nextStages.length > 0 ? stage.nextStages[0] : null;
    }

    /**
     * Execute action stage
     */
    private async executeActionStage(stage: WorkflowStage, instance: WorkflowInstance): Promise<void> {
        // Custom action execution logic
        // This could include notifications, data transformations, external API calls, etc.
        
        vscode.window.showInformationMessage(
            `Workflow Action: ${stage.name}`,
            'Continue'
        ).then(() => {
            // Continue to next stage after action
            const nextStageId = stage.nextStages && stage.nextStages.length > 0 ? stage.nextStages[0] : null;
            if (nextStageId) {
                const workflowDef = this.workflowDefinitions.get(instance.workflowId);
                const nextStage = workflowDef?.stages.find(s => s.id === nextStageId);
                if (nextStage) {
                    instance.currentStage = nextStageId;
                    this.executeStage(instance.id, nextStage);
                }
            } else {
                this.completeWorkflow(instance.id);
            }
        });
    }

    /**
     * Execute aggregation stage
     */
    private async executeAggregationStage(stage: WorkflowStage, instance: WorkflowInstance): Promise<void> {
        if (!stage.aggregationRules) {
            return;
        }

        // Collect all stage data
        const allData: Record<string, any> = {};
        for (const [stageId, data] of instance.stageData.entries()) {
            if (!stageId.endsWith('_formId')) {
                Object.assign(allData, data);
            }
        }

        // Apply aggregation rules
        for (const rule of stage.aggregationRules) {
            const aggregatedValue = this.applyAggregationRule(rule, allData);
            instance.aggregatedData[rule.targetField] = aggregatedValue;
        }

        // Continue to next stage
        const nextStageId = stage.nextStages && stage.nextStages.length > 0 ? stage.nextStages[0] : null;
        if (nextStageId) {
            const workflowDef = this.workflowDefinitions.get(instance.workflowId);
            const nextStage = workflowDef?.stages.find(s => s.id === nextStageId);
            if (nextStage) {
                instance.currentStage = nextStageId;
                await this.executeStage(instance.id, nextStage);
            }
        } else {
            await this.completeWorkflow(instance.id);
        }
    }

    /**
     * Apply aggregation rule to data
     */
    private applyAggregationRule(rule: AggregationRule, data: Record<string, any>): any {
        const sourceValues = rule.sourceFields.map(field => data[field]).filter(v => v !== undefined);
        
        switch (rule.operation) {
            case 'merge':
                return sourceValues.join(' ');
            case 'summarize':
                return `Summary of ${rule.sourceFields.join(', ')}: ${sourceValues.join('; ')}`;
            case 'calculate':
                // Simple calculation example
                return sourceValues.reduce((sum, val) => {
                    const num = typeof val === 'number' ? val : parseFloat(val) || 0;
                    return sum + num;
                }, 0);
            case 'transform':
                // Custom transformation based on parameters
                return this.applyTransformation(sourceValues, rule.parameters || {});
            default:
                return sourceValues[0];
        }
    }

    /**
     * Apply custom transformation
     */
    private applyTransformation(values: any[], parameters: Record<string, any>): any {
        // Example transformation logic
        if (parameters.format === 'list') {
            return values.filter(v => v).map(v => `• ${v}`).join('\n');
        } else if (parameters.format === 'json') {
            return JSON.stringify(values, null, 2);
        }
        return values.join(', ');
    }

    /**
     * Complete workflow
     */
    private async completeWorkflow(instanceId: string): Promise<void> {
        const instance = this.activeWorkflows.get(instanceId);
        if (!instance) {
            return;
        }

        instance.status = 'completed';
        instance.lastActivity = new Date();

        // Aggregate final results
        const allData: Record<string, any> = {};
        for (const [stageId, data] of instance.stageData.entries()) {
            if (!stageId.endsWith('_formId')) {
                Object.assign(allData, data);
            }
        }

        const result: WorkflowResult = {
            workflowId: instance.workflowId,
            instanceId: instanceId,
            success: true,
            aggregatedData: { ...instance.aggregatedData, ...allData },
            stageResults: instance.stageData,
            completionTime: new Date(),
            nextActions: ['review_results', 'start_implementation']
        };

        // Notify callback
        const callback = this.workflowCallbacks.get(instanceId);
        if (callback) {
            callback(result);
            this.workflowCallbacks.delete(instanceId);
        }

        // Save workflow result
        await this.saveWorkflowResult(result);

        // Clean up
        this.activeWorkflows.delete(instanceId);

        // Notify user
        vscode.window.showInformationMessage(
            `Workflow "${instance.workflowId}" completed successfully!`,
            'View Results'
        ).then(selection => {
            if (selection === 'View Results') {
                this.showWorkflowResults(result);
            }
        });
    }

    /**
     * Fail workflow
     */
    private async failWorkflow(instanceId: string, error: any): Promise<void> {
        const instance = this.activeWorkflows.get(instanceId);
        if (!instance) {
            return;
        }

        instance.status = 'failed';
        instance.lastActivity = new Date();

        const result: WorkflowResult = {
            workflowId: instance.workflowId,
            instanceId: instanceId,
            success: false,
            aggregatedData: instance.aggregatedData,
            stageResults: instance.stageData,
            completionTime: new Date()
        };

        // Notify callback
        const callback = this.workflowCallbacks.get(instanceId);
        if (callback) {
            callback(result);
            this.workflowCallbacks.delete(instanceId);
        }

        // Clean up
        this.activeWorkflows.delete(instanceId);

        // Notify user
        vscode.window.showErrorMessage(
            `Workflow "${instance.workflowId}" failed: ${error.message}`,
            'Retry', 'Cancel'
        ).then(selection => {
            if (selection === 'Retry') {
                // Restart workflow
                this.startWorkflow(instance.workflowId, instance.context);
            }
        });
    }

    /**
     * Get current step number for display
     */
    private getCurrentStepNumber(instance: WorkflowInstance): number {
        const workflowDef = this.workflowDefinitions.get(instance.workflowId);
        if (!workflowDef) {
            return 1;
        }
        
        const currentStageIndex = workflowDef.stages.findIndex(s => s.id === instance.currentStage);
        return currentStageIndex + 1;
    }

    /**
     * Save workflow result
     */
    private async saveWorkflowResult(result: WorkflowResult): Promise<void> {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                return;
            }

            const rillanDir = vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai');
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const filename = `workflow-result-${result.workflowId}-${timestamp}.json`;
            const filePath = vscode.Uri.joinPath(rillanDir, filename);

            // Ensure directory exists
            await vscode.workspace.fs.createDirectory(rillanDir);

            await vscode.workspace.fs.writeFile(
                filePath,
                Buffer.from(JSON.stringify(result, null, 2))
            );
        } catch (error) {
            console.error('Error saving workflow result:', error);
        }
    }

    /**
     * Show workflow results
     */
    private async showWorkflowResults(result: WorkflowResult): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'workflowResults',
            `Workflow Results: ${result.workflowId}`,
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getWorkflowResultsHtml(result);
    }

    /**
     * Generate HTML for workflow results
     */
    private getWorkflowResultsHtml(result: WorkflowResult): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Workflow Results</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { background: #007acc; color: white; padding: 15px; border-radius: 5px; }
                .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                .data { background: #f5f5f5; padding: 10px; border-radius: 3px; font-family: monospace; }
                .success { color: #28a745; }
                .failed { color: #dc3545; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Workflow Results</h1>
                <p>Workflow: ${result.workflowId}</p>
                <p>Status: <span class="${result.success ? 'success' : 'failed'}">${result.success ? 'Completed' : 'Failed'}</span></p>
                <p>Completed: ${result.completionTime.toLocaleString()}</p>
            </div>
            
            <div class="section">
                <h2>Aggregated Data</h2>
                <div class="data">${JSON.stringify(result.aggregatedData, null, 2)}</div>
            </div>
            
            <div class="section">
                <h2>Stage Results</h2>
                <div class="data">${JSON.stringify(Object.fromEntries(result.stageResults), null, 2)}</div>
            </div>
            
            ${result.nextActions ? `
            <div class="section">
                <h2>Next Actions</h2>
                <ul>
                    ${result.nextActions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
            ` : ''}
        </body>
        </html>
        `;
    }

    /**
     * Initialize built-in workflow definitions
     */
    private initializeBuiltInWorkflows(): void {
        // Project Creation Workflow
        this.registerWorkflow({
            id: 'project-creation-comprehensive',
            name: 'Comprehensive Project Creation',
            description: 'Multi-stage project creation with requirements, design, and planning',
            stages: [
                {
                    id: 'initial-requirements',
                    name: 'Initial Requirements',
                    type: 'form',
                    formRequest: {
                        id: 'initial-req',
                        title: 'Project Requirements',
                        formType: 'project_creation',
                        complexity: 'standard',
                        purpose: 'collection',
                        sections: [
                            {
                                id: 'basic-info',
                                title: 'Basic Information',
                                fields: [
                                    {
                                        id: 'projectName',
                                        type: 'text',
                                        label: 'Project Name',
                                        required: true
                                    },
                                    {
                                        id: 'projectType',
                                        type: 'select',
                                        label: 'Project Type',
                                        options: [
                                            { value: 'web', label: 'Web Application' },
                                            { value: 'mobile', label: 'Mobile App' },
                                            { value: 'desktop', label: 'Desktop Application' },
                                            { value: 'api', label: 'API/Backend' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    nextStages: ['technical-details']
                },
                {
                    id: 'technical-details',
                    name: 'Technical Details',
                    type: 'form',
                    formRequest: {
                        id: 'tech-details',
                        title: 'Technical Specifications',
                        formType: 'project_creation',
                        complexity: 'comprehensive',
                        purpose: 'collection',
                        sections: [
                            {
                                id: 'tech-stack',
                                title: 'Technology Stack',
                                fields: [
                                    {
                                        id: 'framework',
                                        type: 'select',
                                        label: 'Primary Framework',
                                        options: [
                                            { value: 'react', label: 'React' },
                                            { value: 'vue', label: 'Vue.js' },
                                            { value: 'angular', label: 'Angular' },
                                            { value: 'node', label: 'Node.js' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    nextStages: ['project-planning']
                },
                {
                    id: 'project-planning',
                    name: 'Project Planning',
                    type: 'form',
                    formRequest: {
                        id: 'planning',
                        title: 'Project Planning',
                        formType: 'project_creation',
                        complexity: 'standard',
                        purpose: 'collection',
                        sections: [
                            {
                                id: 'timeline',
                                title: 'Timeline & Resources',
                                fields: [
                                    {
                                        id: 'timeline',
                                        type: 'select',
                                        label: 'Expected Timeline',
                                        options: [
                                            { value: '1-2weeks', label: '1-2 weeks' },
                                            { value: '1month', label: '1 month' },
                                            { value: '2-3months', label: '2-3 months' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    nextStages: ['final-aggregation']
                },
                {
                    id: 'final-aggregation',
                    name: 'Final Aggregation',
                    type: 'aggregation',
                    aggregationRules: [
                        {
                            sourceFields: ['projectName', 'projectType', 'framework', 'timeline'],
                            targetField: 'projectSummary',
                            operation: 'summarize'
                        }
                    ]
                }
            ],
            metadata: {
                createdBy: 'ai',
                createdAt: new Date(),
                priority: 'medium'
            }
        });

        // Investigation Workflow
        this.registerWorkflow({
            id: 'investigation-comprehensive',
            name: 'Comprehensive Investigation',
            description: 'Multi-stage investigation with symptom analysis and solution planning',
            stages: [
                {
                    id: 'symptom-analysis',
                    name: 'Symptom Analysis',
                    type: 'form',
                    formRequest: {
                        id: 'symptoms',
                        title: 'Problem Analysis',
                        formType: 'investigation',
                        complexity: 'standard',
                        purpose: 'investigation',
                        sections: [
                            {
                                id: 'problem-description',
                                title: 'Problem Description',
                                fields: [
                                    {
                                        id: 'problemDescription',
                                        type: 'textarea',
                                        label: 'Describe the Problem',
                                        required: true
                                    },
                                    {
                                        id: 'severity',
                                        type: 'select',
                                        label: 'Severity Level',
                                        options: [
                                            { value: 'low', label: 'Low' },
                                            { value: 'medium', label: 'Medium' },
                                            { value: 'high', label: 'High' },
                                            { value: 'critical', label: 'Critical' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    conditions: [
                        {
                            field: 'severity',
                            operator: 'equals',
                            value: 'critical',
                            nextStage: 'immediate-action'
                        }
                    ],
                    nextStages: ['detailed-investigation']
                },
                {
                    id: 'immediate-action',
                    name: 'Immediate Action Required',
                    type: 'action',
                    nextStages: ['detailed-investigation']
                },
                {
                    id: 'detailed-investigation',
                    name: 'Detailed Investigation',
                    type: 'form',
                    formRequest: {
                        id: 'detailed-inv',
                        title: 'Detailed Investigation',
                        formType: 'investigation',
                        complexity: 'comprehensive',
                        purpose: 'investigation',
                        sections: [
                            {
                                id: 'investigation-details',
                                title: 'Investigation Details',
                                fields: [
                                    {
                                        id: 'investigationAreas',
                                        type: 'multiselect',
                                        label: 'Areas to Investigate',
                                        options: [
                                            { value: 'performance', label: 'Performance' },
                                            { value: 'security', label: 'Security' },
                                            { value: 'usability', label: 'Usability' },
                                            { value: 'architecture', label: 'Architecture' }
                                        ]
                                    }
                                ]
                            }
                        ]
                    },
                    nextStages: ['solution-planning']
                },
                {
                    id: 'solution-planning',
                    name: 'Solution Planning',
                    type: 'aggregation',
                    aggregationRules: [
                        {
                            sourceFields: ['problemDescription', 'severity', 'investigationAreas'],
                            targetField: 'investigationPlan',
                            operation: 'summarize'
                        }
                    ]
                }
            ],
            metadata: {
                createdBy: 'ai',
                createdAt: new Date(),
                priority: 'high'
            }
        });
    }

    /**
     * Register a new workflow definition
     */
    public registerWorkflow(workflow: WorkflowDefinition): void {
        this.workflowDefinitions.set(workflow.id, workflow);
    }

    /**
     * Get available workflows
     */
    public getAvailableWorkflows(): WorkflowDefinition[] {
        return Array.from(this.workflowDefinitions.values());
    }

    /**
     * Get active workflow instances
     */
    public getActiveWorkflows(): WorkflowInstance[] {
        return Array.from(this.activeWorkflows.values());
    }

    /**
     * Pause workflow
     */
    public pauseWorkflow(instanceId: string): boolean {
        const instance = this.activeWorkflows.get(instanceId);
        if (instance && instance.status === 'active') {
            instance.status = 'paused';
            instance.lastActivity = new Date();
            return true;
        }
        return false;
    }

    /**
     * Resume workflow
     */
    public async resumeWorkflow(instanceId: string): Promise<boolean> {
        const instance = this.activeWorkflows.get(instanceId);
        if (instance && instance.status === 'paused') {
            instance.status = 'active';
            instance.lastActivity = new Date();
            
            // Resume from current stage
            const workflowDef = this.workflowDefinitions.get(instance.workflowId);
            const currentStage = workflowDef?.stages.find(s => s.id === instance.currentStage);
            if (currentStage) {
                await this.executeStage(instanceId, currentStage);
            }
            return true;
        }
        return false;
    }

    /**
     * Cancel workflow
     */
    public cancelWorkflow(instanceId: string): boolean {
        const instance = this.activeWorkflows.get(instanceId);
        if (instance) {
            instance.status = 'failed';
            instance.lastActivity = new Date();
            this.activeWorkflows.delete(instanceId);
            this.workflowCallbacks.delete(instanceId);
            return true;
        }
        return false;
    }
}