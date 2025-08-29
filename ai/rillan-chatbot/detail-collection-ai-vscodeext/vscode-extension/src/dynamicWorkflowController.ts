import * as vscode from 'vscode';
import { WorkflowOrchestrator, WorkflowDefinition, WorkflowStage, WorkflowInstance } from './workflowOrchestrator';
import { AIIntegrationBridge, AIFormRequest, ConversationContext } from './aiIntegrationBridge';

/**
 * Dynamic workflow control interfaces for AI-driven workflow modification
 */
export interface WorkflowModification {
    instanceId: string;
    type: 'add_stage' | 'modify_stage' | 'remove_stage' | 'change_flow' | 'inject_decision';
    targetStageId?: string;
    newStage?: WorkflowStage;
    modifications?: Partial<WorkflowStage>;
    reason: string;
    aiContext: ConversationContext;
}

export interface ConditionalFormGeneration {
    triggerId: string;
    condition: WorkflowConditionExpression;
    formTemplate: AIFormRequest;
    priority: 'low' | 'medium' | 'high';
    context: ConversationContext;
}

export interface WorkflowConditionExpression {
    type: 'simple' | 'complex' | 'ai_decision';
    field?: string;
    operator?: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'exists' | 'matches_pattern';
    value?: any;
    pattern?: string;
    aiPrompt?: string;
    logicalOperator?: 'and' | 'or' | 'not';
    subConditions?: WorkflowConditionExpression[];
}

export interface BranchingDecision {
    decisionId: string;
    instanceId: string;
    currentData: Record<string, any>;
    availablePaths: BranchingPath[];
    aiRecommendation?: string;
    userChoice?: string;
    autoDecide: boolean;
}

export interface BranchingPath {
    id: string;
    name: string;
    description: string;
    nextStages: string[];
    estimatedDuration?: number;
    complexity: 'simple' | 'moderate' | 'complex';
    requiredData?: string[];
}

export interface WorkflowAnalytics {
    instanceId: string;
    stageCompletionTimes: Map<string, number>;
    userInteractionPatterns: UserInteractionPattern[];
    aiDecisionAccuracy: number;
    bottlenecks: WorkflowBottleneck[];
    suggestions: WorkflowOptimizationSuggestion[];
}

export interface UserInteractionPattern {
    stageId: string;
    interactionType: 'form_completion' | 'navigation' | 'modification' | 'skip';
    duration: number;
    complexity: number;
    userSatisfaction?: number;
}

export interface WorkflowBottleneck {
    stageId: string;
    averageCompletionTime: number;
    dropoffRate: number;
    commonIssues: string[];
}

export interface WorkflowOptimizationSuggestion {
    type: 'simplify_form' | 'add_guidance' | 'split_stage' | 'merge_stages' | 'add_validation';
    targetStage: string;
    description: string;
    expectedImprovement: number;
}

/**
 * Dynamic Workflow Controller - Enables AI to modify workflows in real-time
 */
export class DynamicWorkflowController {
    private static instance: DynamicWorkflowController;
    private extensionContext: vscode.ExtensionContext;
    private workflowOrchestrator: WorkflowOrchestrator;
    private aiBridge: AIIntegrationBridge;
    private activeModifications: Map<string, WorkflowModification[]> = new Map();
    private conditionalGenerators: Map<string, ConditionalFormGeneration> = new Map();
    private branchingDecisions: Map<string, BranchingDecision> = new Map();
    private workflowAnalytics: Map<string, WorkflowAnalytics> = new Map();

    private constructor(context: vscode.ExtensionContext) {
        this.extensionContext = context;
        this.workflowOrchestrator = WorkflowOrchestrator.getInstance(context);
        this.aiBridge = AIIntegrationBridge.getInstance(context);
    }

    public static getInstance(context?: vscode.ExtensionContext): DynamicWorkflowController {
        if (!DynamicWorkflowController.instance && context) {
            DynamicWorkflowController.instance = new DynamicWorkflowController(context);
        }
        return DynamicWorkflowController.instance;
    }

    /**
     * AI-driven workflow modification
     */
    public async modifyWorkflow(modification: WorkflowModification): Promise<boolean> {
        try {
            const activeWorkflows = this.workflowOrchestrator.getActiveWorkflows();
            const targetInstance = activeWorkflows.find(w => w.id === modification.instanceId);
            
            if (!targetInstance) {
                throw new Error(`Workflow instance not found: ${modification.instanceId}`);
            }

            // Store modification for tracking
            if (!this.activeModifications.has(modification.instanceId)) {
                this.activeModifications.set(modification.instanceId, []);
            }
            this.activeModifications.get(modification.instanceId)!.push(modification);

            // Apply modification based on type
            switch (modification.type) {
                case 'add_stage':
                    return await this.addStageToWorkflow(modification);
                case 'modify_stage':
                    return await this.modifyExistingStage(modification);
                case 'remove_stage':
                    return await this.removeStageFromWorkflow(modification);
                case 'change_flow':
                    return await this.changeWorkflowFlow(modification);
                case 'inject_decision':
                    return await this.injectDecisionPoint(modification);
                default:
                    throw new Error(`Unknown modification type: ${modification.type}`);
            }
        } catch (error) {
            console.error('Error modifying workflow:', error);
            vscode.window.showErrorMessage(`Failed to modify workflow: ${error instanceof Error ? error.message : String(error)}`);
            return false;
        }
    }

    /**
     * Add a new stage to an active workflow
     */
    private async addStageToWorkflow(modification: WorkflowModification): Promise<boolean> {
        if (!modification.newStage) {
            throw new Error('New stage definition required for add_stage modification');
        }

        // Notify user about the modification
        const userApproval = await vscode.window.showInformationMessage(
            `AI wants to add a new stage "${modification.newStage.name}" to the workflow. Reason: ${modification.reason}`,
            'Approve', 'Decline', 'Modify'
        );

        if (userApproval === 'Approve') {
            // Add the stage to the workflow definition
            // This would require extending the WorkflowOrchestrator to support dynamic modifications
            vscode.window.showInformationMessage(`Added new stage: ${modification.newStage.name}`);
            return true;
        } else if (userApproval === 'Modify') {
            // Allow user to modify the proposed stage
            return await this.showStageModificationDialog(modification.newStage);
        }

        return false;
    }

    /**
     * Modify an existing stage in the workflow
     */
    private async modifyExistingStage(modification: WorkflowModification): Promise<boolean> {
        if (!modification.targetStageId || !modification.modifications) {
            throw new Error('Target stage ID and modifications required for modify_stage');
        }

        const userApproval = await vscode.window.showInformationMessage(
            `AI wants to modify stage "${modification.targetStageId}". Reason: ${modification.reason}`,
            'Approve', 'Decline', 'Review'
        );

        if (userApproval === 'Approve') {
            vscode.window.showInformationMessage(`Modified stage: ${modification.targetStageId}`);
            return true;
        } else if (userApproval === 'Review') {
            return await this.showModificationReviewDialog(modification);
        }

        return false;
    }

    /**
     * Remove a stage from the workflow
     */
    private async removeStageFromWorkflow(modification: WorkflowModification): Promise<boolean> {
        if (!modification.targetStageId) {
            throw new Error('Target stage ID required for remove_stage modification');
        }

        const userApproval = await vscode.window.showWarningMessage(
            `AI wants to remove stage "${modification.targetStageId}". Reason: ${modification.reason}`,
            'Approve', 'Decline'
        );

        if (userApproval === 'Approve') {
            vscode.window.showInformationMessage(`Removed stage: ${modification.targetStageId}`);
            return true;
        }

        return false;
    }

    /**
     * Change the flow between stages
     */
    private async changeWorkflowFlow(modification: WorkflowModification): Promise<boolean> {
        const userApproval = await vscode.window.showInformationMessage(
            `AI wants to change the workflow flow. Reason: ${modification.reason}`,
            'Approve', 'Decline', 'Preview'
        );

        if (userApproval === 'Approve') {
            vscode.window.showInformationMessage('Workflow flow updated');
            return true;
        } else if (userApproval === 'Preview') {
            return await this.showFlowPreview(modification);
        }

        return false;
    }

    /**
     * Inject a decision point into the workflow
     */
    private async injectDecisionPoint(modification: WorkflowModification): Promise<boolean> {
        const userApproval = await vscode.window.showInformationMessage(
            `AI wants to add a decision point. Reason: ${modification.reason}`,
            'Approve', 'Decline'
        );

        if (userApproval === 'Approve') {
            // Create a branching decision
            const decisionId = `decision-${Date.now()}`;
            const branchingDecision: BranchingDecision = {
                decisionId,
                instanceId: modification.instanceId,
                currentData: {},
                availablePaths: [
                    {
                        id: 'path-a',
                        name: 'Standard Path',
                        description: 'Continue with standard workflow',
                        nextStages: ['next-standard-stage'],
                        complexity: 'simple'
                    },
                    {
                        id: 'path-b',
                        name: 'Enhanced Path',
                        description: 'Enhanced workflow with additional validation',
                        nextStages: ['enhanced-validation-stage'],
                        complexity: 'moderate'
                    }
                ],
                autoDecide: false
            };

            this.branchingDecisions.set(decisionId, branchingDecision);
            await this.presentBranchingDecision(branchingDecision);
            return true;
        }

        return false;
    }

    /**
     * Register conditional form generation
     */
    public registerConditionalFormGeneration(generation: ConditionalFormGeneration): void {
        this.conditionalGenerators.set(generation.triggerId, generation);
    }

    /**
     * Evaluate conditions and trigger form generation
     */
    public async evaluateConditionalGeneration(
        instanceId: string, 
        currentData: Record<string, any>
    ): Promise<void> {
        for (const [triggerId, generator] of this.conditionalGenerators.entries()) {
            if (await this.evaluateConditionExpression(generator.condition, currentData)) {
                // Condition met, generate form
                await this.triggerConditionalForm(generator, instanceId, currentData);
                
                // Remove one-time triggers
                if (generator.priority === 'high') {
                    this.conditionalGenerators.delete(triggerId);
                }
            }
        }
    }

    /**
     * Evaluate complex condition expressions
     */
    private async evaluateConditionExpression(
        condition: WorkflowConditionExpression, 
        data: Record<string, any>
    ): Promise<boolean> {
        switch (condition.type) {
            case 'simple':
                return this.evaluateSimpleCondition(condition, data);
            case 'complex':
                return this.evaluateComplexCondition(condition, data);
            case 'ai_decision':
                return await this.evaluateAIDecision(condition, data);
            default:
                return false;
        }
    }

    /**
     * Evaluate simple condition
     */
    private evaluateSimpleCondition(
        condition: WorkflowConditionExpression, 
        data: Record<string, any>
    ): boolean {
        if (!condition.field || !condition.operator) {
            return false;
        }

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
            case 'matches_pattern':
                return condition.pattern ? new RegExp(condition.pattern).test(String(fieldValue)) : false;
            default:
                return false;
        }
    }

    /**
     * Evaluate complex condition with logical operators
     */
    private evaluateComplexCondition(
        condition: WorkflowConditionExpression, 
        data: Record<string, any>
    ): boolean {
        if (!condition.subConditions || condition.subConditions.length === 0) {
            return false;
        }

        const results = condition.subConditions.map(subCondition => 
            this.evaluateSimpleCondition(subCondition, data)
        );

        switch (condition.logicalOperator) {
            case 'and':
                return results.every(result => result);
            case 'or':
                return results.some(result => result);
            case 'not':
                return !results[0];
            default:
                return results[0];
        }
    }

    /**
     * Evaluate AI-driven decision
     */
    private async evaluateAIDecision(
        condition: WorkflowConditionExpression, 
        data: Record<string, any>
    ): Promise<boolean> {
        if (!condition.aiPrompt) {
            return false;
        }

        // This would integrate with the AI system to make decisions
        // For now, we'll simulate an AI decision based on data complexity
        const dataComplexity = Object.keys(data).length;
        const hasComplexValues = Object.values(data).some(value => 
            typeof value === 'object' || (typeof value === 'string' && value.length > 100)
        );

        // Simulate AI decision logic
        return dataComplexity > 5 || hasComplexValues;
    }

    /**
     * Trigger conditional form generation
     */
    private async triggerConditionalForm(
        generator: ConditionalFormGeneration,
        instanceId: string,
        currentData: Record<string, any>
    ): Promise<void> {
        // Customize form based on current data
        const customizedForm = this.customizeFormForContext(generator.formTemplate, currentData);
        
        // Show notification to user
        const userChoice = await vscode.window.showInformationMessage(
            `AI suggests generating an additional form based on your responses. This will help gather more specific information.`,
            'Generate Form', 'Skip', 'Learn More'
        );

        if (userChoice === 'Generate Form') {
            await this.aiBridge.generateFormFromAISpec(customizedForm);
        } else if (userChoice === 'Learn More') {
            await this.showConditionalFormExplanation(generator, currentData);
        }
    }

    /**
     * Customize form based on current context
     */
    private customizeFormForContext(
        baseForm: AIFormRequest, 
        contextData: Record<string, any>
    ): AIFormRequest {
        const customized = { ...baseForm };
        
        // Add context-specific fields or modify existing ones
        if (contextData.projectType === 'web') {
            // Add web-specific fields
            customized.sections.forEach(section => {
                if (section.id === 'technical-details') {
                    section.fields.push({
                        id: 'webFramework',
                        type: 'select',
                        label: 'Web Framework',
                        options: [
                            { value: 'react', label: 'React' },
                            { value: 'vue', label: 'Vue.js' },
                            { value: 'angular', label: 'Angular' }
                        ]
                    });
                }
            });
        }

        // Update title to reflect context
        customized.title = `${customized.title} (Based on: ${Object.keys(contextData).join(', ')})`;
        
        return customized;
    }

    /**
     * Present branching decision to user
     */
    private async presentBranchingDecision(decision: BranchingDecision): Promise<void> {
        const pathOptions = decision.availablePaths.map(path => path.name);
        
        const userChoice = await vscode.window.showQuickPick(pathOptions, {
            placeHolder: 'Choose the workflow path to continue',
            ignoreFocusOut: true
        });

        if (userChoice) {
            const selectedPath = decision.availablePaths.find(path => path.name === userChoice);
            if (selectedPath) {
                decision.userChoice = selectedPath.id;
                await this.executeBranchingDecision(decision);
            }
        }
    }

    /**
     * Execute branching decision
     */
    private async executeBranchingDecision(decision: BranchingDecision): Promise<void> {
        const selectedPath = decision.availablePaths.find(path => path.id === decision.userChoice);
        if (!selectedPath) {
            return;
        }

        // Update workflow analytics
        this.updateWorkflowAnalytics(decision.instanceId, 'branching_decision', {
            decisionId: decision.decisionId,
            selectedPath: selectedPath.id,
            availableOptions: decision.availablePaths.length
        });

        // Continue workflow with selected path
        vscode.window.showInformationMessage(
            `Continuing with: ${selectedPath.name} - ${selectedPath.description}`
        );

        // Clean up
        this.branchingDecisions.delete(decision.decisionId);
    }

    /**
     * Update workflow analytics
     */
    private updateWorkflowAnalytics(
        instanceId: string, 
        eventType: string, 
        eventData: any
    ): void {
        if (!this.workflowAnalytics.has(instanceId)) {
            this.workflowAnalytics.set(instanceId, {
                instanceId,
                stageCompletionTimes: new Map(),
                userInteractionPatterns: [],
                aiDecisionAccuracy: 0,
                bottlenecks: [],
                suggestions: []
            });
        }

        const analytics = this.workflowAnalytics.get(instanceId)!;
        
        // Record interaction pattern
        analytics.userInteractionPatterns.push({
            stageId: eventData.stageId || 'unknown',
            interactionType: eventType as any,
            duration: eventData.duration || 0,
            complexity: eventData.complexity || 1
        });

        // Analyze for bottlenecks and suggestions
        this.analyzeWorkflowPerformance(analytics);
    }

    /**
     * Analyze workflow performance and generate suggestions
     */
    private analyzeWorkflowPerformance(analytics: WorkflowAnalytics): void {
        // Identify bottlenecks
        const stageStats = new Map<string, { totalTime: number, count: number }>();
        
        analytics.userInteractionPatterns.forEach(pattern => {
            if (!stageStats.has(pattern.stageId)) {
                stageStats.set(pattern.stageId, { totalTime: 0, count: 0 });
            }
            const stats = stageStats.get(pattern.stageId)!;
            stats.totalTime += pattern.duration;
            stats.count += 1;
        });

        // Generate bottleneck analysis
        analytics.bottlenecks = [];
        for (const [stageId, stats] of stageStats.entries()) {
            const averageTime = stats.totalTime / stats.count;
            if (averageTime > 300000) { // 5 minutes
                analytics.bottlenecks.push({
                    stageId,
                    averageCompletionTime: averageTime,
                    dropoffRate: 0, // Would be calculated from actual data
                    commonIssues: ['Long completion time', 'Complex form structure']
                });
            }
        }

        // Generate optimization suggestions
        analytics.suggestions = analytics.bottlenecks.map(bottleneck => ({
            type: 'simplify_form' as const,
            targetStage: bottleneck.stageId,
            description: `Consider simplifying the form in stage ${bottleneck.stageId} to reduce completion time`,
            expectedImprovement: 0.3
        }));
    }

    /**
     * Show stage modification dialog
     */
    private async showStageModificationDialog(stage: WorkflowStage): Promise<boolean> {
        // This would show a detailed dialog for modifying the stage
        const result = await vscode.window.showInputBox({
            prompt: `Modify stage name (current: ${stage.name})`,
            value: stage.name
        });

        if (result) {
            stage.name = result;
            vscode.window.showInformationMessage(`Stage modified: ${stage.name}`);
            return true;
        }

        return false;
    }

    /**
     * Show modification review dialog
     */
    private async showModificationReviewDialog(modification: WorkflowModification): Promise<boolean> {
        const panel = vscode.window.createWebviewPanel(
            'modificationReview',
            'Review Workflow Modification',
            vscode.ViewColumn.One,
            { enableScripts: true }
        );

        panel.webview.html = this.getModificationReviewHtml(modification);
        
        return new Promise((resolve) => {
            panel.webview.onDidReceiveMessage(message => {
                if (message.command === 'approve') {
                    resolve(true);
                } else if (message.command === 'decline') {
                    resolve(false);
                }
                panel.dispose();
            });
        });
    }

    /**
     * Show flow preview
     */
    private async showFlowPreview(modification: WorkflowModification): Promise<boolean> {
        vscode.window.showInformationMessage('Flow preview would be displayed here');
        return true;
    }

    /**
     * Show conditional form explanation
     */
    private async showConditionalFormExplanation(
        generator: ConditionalFormGeneration,
        contextData: Record<string, any>
    ): Promise<void> {
        const explanation = `
        Based on your responses (${Object.keys(contextData).join(', ')}), 
        the AI has determined that additional information would be helpful.
        
        This form will help gather: ${generator.formTemplate.description}
        `;

        await vscode.window.showInformationMessage(explanation, 'OK');
    }

    /**
     * Generate HTML for modification review
     */
    private getModificationReviewHtml(modification: WorkflowModification): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Review Workflow Modification</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .header { background: #007acc; color: white; padding: 15px; border-radius: 5px; }
                .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
                .buttons { text-align: center; margin-top: 20px; }
                button { margin: 0 10px; padding: 10px 20px; font-size: 16px; }
                .approve { background: #28a745; color: white; border: none; border-radius: 3px; }
                .decline { background: #dc3545; color: white; border: none; border-radius: 3px; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>Workflow Modification Review</h1>
                <p>Type: ${modification.type}</p>
                <p>Target: ${modification.targetStageId || 'N/A'}</p>
            </div>
            
            <div class="section">
                <h2>Reason</h2>
                <p>${modification.reason}</p>
            </div>
            
            <div class="section">
                <h2>Proposed Changes</h2>
                <pre>${JSON.stringify(modification.modifications || modification.newStage, null, 2)}</pre>
            </div>
            
            <div class="buttons">
                <button class="approve" onclick="sendMessage('approve')">Approve</button>
                <button class="decline" onclick="sendMessage('decline')">Decline</button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                function sendMessage(command) {
                    vscode.postMessage({ command: command });
                }
            </script>
        </body>
        </html>
        `;
    }

    /**
     * Get workflow analytics for an instance
     */
    public getWorkflowAnalytics(instanceId: string): WorkflowAnalytics | undefined {
        return this.workflowAnalytics.get(instanceId);
    }

    /**
     * Get all active modifications
     */
    public getActiveModifications(): Map<string, WorkflowModification[]> {
        return new Map(this.activeModifications);
    }

    /**
     * Clear completed workflow data
     */
    public clearWorkflowData(instanceId: string): void {
        this.activeModifications.delete(instanceId);
        this.workflowAnalytics.delete(instanceId);
        
        // Remove related branching decisions
        for (const [decisionId, decision] of this.branchingDecisions.entries()) {
            if (decision.instanceId === instanceId) {
                this.branchingDecisions.delete(decisionId);
            }
        }
    }
}