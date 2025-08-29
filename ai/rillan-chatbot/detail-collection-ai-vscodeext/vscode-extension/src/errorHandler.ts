import * as vscode from 'vscode';

/**
 * Comprehensive error handling system for the AI Integration Layer
 */

export enum ErrorType {
    FORM_GENERATION = 'form_generation',
    COMMUNICATION = 'communication',
    UI_RENDERING = 'ui_rendering',
    DATA_PROCESSING = 'data_processing',
    WORKFLOW_ORCHESTRATION = 'workflow_orchestration',
    VALIDATION = 'validation',
    NETWORK = 'network',
    STORAGE = 'storage'
}

export enum ErrorSeverity {
    LOW = 'low',
    MEDIUM = 'medium',
    HIGH = 'high',
    CRITICAL = 'critical'
}

export interface ErrorContext {
    component: string;
    operation: string;
    userId?: string;
    sessionId?: string;
    formId?: string;
    workflowId?: string;
    timestamp: Date;
    userAgent?: string;
    additionalData?: Record<string, any>;
}

export interface ErrorDetails {
    type: ErrorType;
    severity: ErrorSeverity;
    message: string;
    originalError?: Error;
    context: ErrorContext;
    stackTrace?: string;
    recoveryActions?: RecoveryAction[];
}

export interface RecoveryAction {
    id: string;
    label: string;
    description: string;
    action: () => Promise<boolean>;
    fallbackLevel: number; // 0 = primary, 1 = secondary, etc.
}

export interface FallbackStrategy {
    condition: (error: ErrorDetails) => boolean;
    action: (error: ErrorDetails) => Promise<any>;
    description: string;
}

/**
 * Comprehensive Error Handler with graceful degradation and recovery
 */
export class AIIntegrationErrorHandler {
    private static instance: AIIntegrationErrorHandler;
    private errorLog: ErrorDetails[] = [];
    private fallbackStrategies: FallbackStrategy[] = [];
    private retryAttempts: Map<string, number> = new Map();
    private maxRetries = 3;
    private retryDelay = 1000; // ms

    private constructor() {
        this.initializeFallbackStrategies();
    }

    public static getInstance(): AIIntegrationErrorHandler {
        if (!AIIntegrationErrorHandler.instance) {
            AIIntegrationErrorHandler.instance = new AIIntegrationErrorHandler();
        }
        return AIIntegrationErrorHandler.instance;
    }

    /**
     * Handle errors with comprehensive recovery strategies
     */
    public async handleError(
        error: Error | ErrorDetails,
        context?: Partial<ErrorContext>
    ): Promise<any> {
        const errorDetails = this.normalizeError(error, context);
        
        // Log the error
        this.logError(errorDetails);
        
        // Attempt recovery based on error type and severity
        const recoveryResult = await this.attemptRecovery(errorDetails);
        
        if (recoveryResult.success) {
            return recoveryResult.data;
        }
        
        // If recovery failed, try fallback strategies
        const fallbackResult = await this.attemptFallback(errorDetails);
        
        if (fallbackResult.success) {
            return fallbackResult.data;
        }
        
        // If all recovery attempts failed, notify user appropriately
        await this.notifyUser(errorDetails);
        
        // Return safe default or throw if critical
        if (errorDetails.severity === ErrorSeverity.CRITICAL) {
            throw new Error(`Critical error: ${errorDetails.message}`);
        }
        
        return this.getSafeDefault(errorDetails);
    }

    /**
     * Normalize error into standard format
     */
    private normalizeError(
        error: Error | ErrorDetails, 
        context?: Partial<ErrorContext>
    ): ErrorDetails {
        if ('type' in error && 'severity' in error) {
            // Already an ErrorDetails object
            return error as ErrorDetails;
        }
        
        const originalError = error as Error;
        const errorType = this.classifyError(originalError);
        const severity = this.determineSeverity(originalError, errorType);
        
        return {
            type: errorType,
            severity,
            message: originalError.message || 'Unknown error occurred',
            originalError,
            context: {
                component: 'unknown',
                operation: 'unknown',
                timestamp: new Date(),
                ...context
            },
            stackTrace: originalError.stack,
            recoveryActions: this.generateRecoveryActions(errorType, severity)
        };
    }

    /**
     * Classify error type based on error characteristics
     */
    private classifyError(error: Error): ErrorType {
        const message = error.message.toLowerCase();
        const stack = error.stack?.toLowerCase() || '';
        
        if (message.includes('form') || message.includes('generation')) {
            return ErrorType.FORM_GENERATION;
        } else if (message.includes('network') || message.includes('fetch') || message.includes('timeout')) {
            return ErrorType.NETWORK;
        } else if (message.includes('communication') || message.includes('bridge')) {
            return ErrorType.COMMUNICATION;
        } else if (message.includes('render') || message.includes('webview') || message.includes('ui')) {
            return ErrorType.UI_RENDERING;
        } else if (message.includes('workflow') || message.includes('orchestrat')) {
            return ErrorType.WORKFLOW_ORCHESTRATION;
        } else if (message.includes('validation') || message.includes('invalid')) {
            return ErrorType.VALIDATION;
        } else if (message.includes('storage') || message.includes('file') || message.includes('save')) {
            return ErrorType.STORAGE;
        } else if (message.includes('data') || message.includes('parse') || message.includes('json')) {
            return ErrorType.DATA_PROCESSING;
        }
        
        return ErrorType.COMMUNICATION; // Default fallback
    }

    /**
     * Determine error severity
     */
    private determineSeverity(error: Error, type: ErrorType): ErrorSeverity {
        const message = error.message.toLowerCase();
        
        // Critical errors that break core functionality
        if (message.includes('critical') || 
            message.includes('fatal') || 
            message.includes('cannot continue') ||
            type === ErrorType.WORKFLOW_ORCHESTRATION && message.includes('corruption')) {
            return ErrorSeverity.CRITICAL;
        }
        
        // High severity errors that significantly impact user experience
        if (message.includes('failed to load') ||
            message.includes('connection lost') ||
            type === ErrorType.FORM_GENERATION ||
            type === ErrorType.WORKFLOW_ORCHESTRATION) {
            return ErrorSeverity.HIGH;
        }
        
        // Medium severity errors that cause inconvenience
        if (message.includes('timeout') ||
            message.includes('retry') ||
            type === ErrorType.UI_RENDERING ||
            type === ErrorType.VALIDATION) {
            return ErrorSeverity.MEDIUM;
        }
        
        return ErrorSeverity.LOW;
    }

    /**
     * Generate recovery actions based on error type and severity
     */
    private generateRecoveryActions(type: ErrorType, severity: ErrorSeverity): RecoveryAction[] {
        const actions: RecoveryAction[] = [];
        
        switch (type) {
            case ErrorType.FORM_GENERATION:
                actions.push({
                    id: 'retry-form-generation',
                    label: 'Retry Form Generation',
                    description: 'Attempt to generate the form again',
                    action: async () => this.retryFormGeneration(),
                    fallbackLevel: 0
                });
                actions.push({
                    id: 'use-basic-form',
                    label: 'Use Basic Form',
                    description: 'Fall back to a simple form template',
                    action: async () => this.useBasicFormFallback(),
                    fallbackLevel: 1
                });
                break;
                
            case ErrorType.COMMUNICATION:
                actions.push({
                    id: 'retry-communication',
                    label: 'Retry Communication',
                    description: 'Attempt to re-establish communication',
                    action: async () => this.retryCommunication(),
                    fallbackLevel: 0
                });
                actions.push({
                    id: 'offline-mode',
                    label: 'Switch to Offline Mode',
                    description: 'Continue with cached data',
                    action: async () => this.switchToOfflineMode(),
                    fallbackLevel: 1
                });
                break;
                
            case ErrorType.UI_RENDERING:
                actions.push({
                    id: 'refresh-ui',
                    label: 'Refresh Interface',
                    description: 'Reload the user interface',
                    action: async () => this.refreshUI(),
                    fallbackLevel: 0
                });
                actions.push({
                    id: 'simple-ui',
                    label: 'Use Simple Interface',
                    description: 'Fall back to basic UI components',
                    action: async () => this.useSimpleUI(),
                    fallbackLevel: 1
                });
                break;
                
            case ErrorType.WORKFLOW_ORCHESTRATION:
                actions.push({
                    id: 'resume-workflow',
                    label: 'Resume Workflow',
                    description: 'Attempt to resume from last checkpoint',
                    action: async () => this.resumeWorkflow(),
                    fallbackLevel: 0
                });
                actions.push({
                    id: 'restart-workflow',
                    label: 'Restart Workflow',
                    description: 'Start the workflow from the beginning',
                    action: async () => this.restartWorkflow(),
                    fallbackLevel: 1
                });
                break;
                
            default:
                actions.push({
                    id: 'generic-retry',
                    label: 'Retry Operation',
                    description: 'Attempt the operation again',
                    action: async () => this.genericRetry(),
                    fallbackLevel: 0
                });
        }
        
        return actions;
    }

    /**
     * Attempt recovery using generated recovery actions
     */
    private async attemptRecovery(errorDetails: ErrorDetails): Promise<{success: boolean, data?: any}> {
        const retryKey = `${errorDetails.context.component}-${errorDetails.context.operation}`;
        const currentAttempts = this.retryAttempts.get(retryKey) || 0;
        
        if (currentAttempts >= this.maxRetries) {
            return { success: false };
        }
        
        this.retryAttempts.set(retryKey, currentAttempts + 1);
        
        // Try recovery actions in order of fallback level
        const sortedActions = errorDetails.recoveryActions?.sort((a, b) => a.fallbackLevel - b.fallbackLevel) || [];
        
        for (const action of sortedActions) {
            try {
                // Add delay for retries
                if (currentAttempts > 0) {
                    await this.delay(this.retryDelay * Math.pow(2, currentAttempts));
                }
                
                const result = await action.action();
                if (result) {
                    // Reset retry count on success
                    this.retryAttempts.delete(retryKey);
                    return { success: true, data: result };
                }
            } catch (recoveryError) {
                console.warn(`Recovery action ${action.id} failed:`, recoveryError);
                continue;
            }
        }
        
        return { success: false };
    }

    /**
     * Attempt fallback strategies
     */
    private async attemptFallback(errorDetails: ErrorDetails): Promise<{success: boolean, data?: any}> {
        for (const strategy of this.fallbackStrategies) {
            if (strategy.condition(errorDetails)) {
                try {
                    const result = await strategy.action(errorDetails);
                    return { success: true, data: result };
                } catch (fallbackError) {
                    console.warn(`Fallback strategy failed:`, fallbackError);
                    continue;
                }
            }
        }
        
        return { success: false };
    }

    /**
     * Initialize fallback strategies
     */
    private initializeFallbackStrategies(): void {
        // Grid to Dropdown fallback
        this.fallbackStrategies.push({
            condition: (error) => error.type === ErrorType.UI_RENDERING && 
                                 error.message.includes('grid'),
            action: async (error) => {
                vscode.window.showWarningMessage(
                    'Grid display failed, falling back to dropdown menus'
                );
                return { fallbackMode: 'dropdown' };
            },
            description: 'Fall back from grid to dropdown when grid rendering fails'
        });
        
        // Slideshow to Single Page fallback
        this.fallbackStrategies.push({
            condition: (error) => error.type === ErrorType.UI_RENDERING && 
                                 error.message.includes('slideshow'),
            action: async (error) => {
                vscode.window.showWarningMessage(
                    'Slideshow mode failed, displaying as single page form'
                );
                return { fallbackMode: 'single_page' };
            },
            description: 'Fall back from slideshow to single page when navigation fails'
        });
        
        // AI Communication to Cached Templates fallback
        this.fallbackStrategies.push({
            condition: (error) => error.type === ErrorType.COMMUNICATION,
            action: async (error) => {
                vscode.window.showWarningMessage(
                    'AI communication failed, using cached form templates'
                );
                return { fallbackMode: 'cached_templates' };
            },
            description: 'Use cached templates when AI communication fails'
        });
        
        // Workflow Orchestration to Simple Form fallback
        this.fallbackStrategies.push({
            condition: (error) => error.type === ErrorType.WORKFLOW_ORCHESTRATION,
            action: async (error) => {
                vscode.window.showWarningMessage(
                    'Workflow orchestration failed, using simple form collection'
                );
                return { fallbackMode: 'simple_form' };
            },
            description: 'Fall back to simple forms when workflow orchestration fails'
        });
    }

    /**
     * Notify user about errors appropriately
     */
    private async notifyUser(errorDetails: ErrorDetails): Promise<void> {
        const userMessage = this.generateUserFriendlyMessage(errorDetails);
        
        switch (errorDetails.severity) {
            case ErrorSeverity.CRITICAL:
                await vscode.window.showErrorMessage(
                    userMessage,
                    'Report Issue', 'View Details'
                ).then(selection => {
                    if (selection === 'Report Issue') {
                        this.reportIssue(errorDetails);
                    } else if (selection === 'View Details') {
                        this.showErrorDetails(errorDetails);
                    }
                });
                break;
                
            case ErrorSeverity.HIGH:
                await vscode.window.showErrorMessage(
                    userMessage,
                    'Retry', 'Use Fallback'
                ).then(selection => {
                    if (selection === 'Retry') {
                        this.attemptRecovery(errorDetails);
                    } else if (selection === 'Use Fallback') {
                        this.attemptFallback(errorDetails);
                    }
                });
                break;
                
            case ErrorSeverity.MEDIUM:
                await vscode.window.showWarningMessage(userMessage, 'OK');
                break;
                
            case ErrorSeverity.LOW:
                // Log only, don't disturb user
                console.warn('Low severity error:', userMessage);
                break;
        }
    }

    /**
     * Generate user-friendly error messages
     */
    private generateUserFriendlyMessage(errorDetails: ErrorDetails): string {
        const baseMessages = {
            [ErrorType.FORM_GENERATION]: 'Unable to generate the requested form',
            [ErrorType.COMMUNICATION]: 'Communication with AI service failed',
            [ErrorType.UI_RENDERING]: 'Interface display issue occurred',
            [ErrorType.DATA_PROCESSING]: 'Data processing error occurred',
            [ErrorType.WORKFLOW_ORCHESTRATION]: 'Workflow execution encountered an issue',
            [ErrorType.VALIDATION]: 'Input validation failed',
            [ErrorType.NETWORK]: 'Network connection issue',
            [ErrorType.STORAGE]: 'File storage operation failed'
        };
        
        const baseMessage = baseMessages[errorDetails.type] || 'An unexpected error occurred';
        
        // Add context-specific information
        let contextMessage = '';
        if (errorDetails.context.formId) {
            contextMessage += ` (Form: ${errorDetails.context.formId})`;
        }
        if (errorDetails.context.workflowId) {
            contextMessage += ` (Workflow: ${errorDetails.context.workflowId})`;
        }
        
        // Add recovery suggestion
        const recoveryMessage = errorDetails.recoveryActions && errorDetails.recoveryActions.length > 0
            ? ` We'll attempt to recover automatically.`
            : ` Please try again or contact support if the issue persists.`;
        
        return `${baseMessage}${contextMessage}.${recoveryMessage}`;
    }

    /**
     * Get safe default values for different error types
     */
    private getSafeDefault(errorDetails: ErrorDetails): any {
        switch (errorDetails.type) {
            case ErrorType.FORM_GENERATION:
                return {
                    id: 'fallback-form',
                    title: 'Basic Information Form',
                    sections: [{
                        id: 'basic',
                        title: 'Basic Details',
                        fields: [{
                            id: 'description',
                            type: 'textarea',
                            label: 'Description',
                            required: true
                        }]
                    }]
                };
                
            case ErrorType.UI_RENDERING:
                return { fallbackMode: 'simple' };
                
            case ErrorType.DATA_PROCESSING:
                return {};
                
            default:
                return null;
        }
    }

    /**
     * Log error for debugging and analytics
     */
    private logError(errorDetails: ErrorDetails): void {
        this.errorLog.push(errorDetails);
        
        // Keep only last 100 errors to prevent memory issues
        if (this.errorLog.length > 100) {
            this.errorLog = this.errorLog.slice(-100);
        }
        
        // Log to console with structured format
        console.error('AI Integration Error:', {
            type: errorDetails.type,
            severity: errorDetails.severity,
            message: errorDetails.message,
            context: errorDetails.context,
            timestamp: errorDetails.context.timestamp.toISOString()
        });
    }

    /**
     * Recovery action implementations
     */
    private async retryFormGeneration(): Promise<boolean> {
        // Implementation would retry the form generation
        return true;
    }

    private async useBasicFormFallback(): Promise<boolean> {
        // Implementation would use a basic form template
        return true;
    }

    private async retryCommunication(): Promise<boolean> {
        // Implementation would retry AI communication
        return true;
    }

    private async switchToOfflineMode(): Promise<boolean> {
        // Implementation would switch to offline mode
        return true;
    }

    private async refreshUI(): Promise<boolean> {
        // Implementation would refresh the UI
        return true;
    }

    private async useSimpleUI(): Promise<boolean> {
        // Implementation would use simple UI components
        return true;
    }

    private async resumeWorkflow(): Promise<boolean> {
        // Implementation would resume workflow from checkpoint
        return true;
    }

    private async restartWorkflow(): Promise<boolean> {
        // Implementation would restart workflow
        return true;
    }

    private async genericRetry(): Promise<boolean> {
        // Implementation would perform generic retry
        return true;
    }

    /**
     * Utility methods
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private async reportIssue(errorDetails: ErrorDetails): Promise<void> {
        // Implementation would open issue reporting
        vscode.env.openExternal(vscode.Uri.parse('https://github.com/example/rillan-ai-workflow-interface/issues'));
    }

    private async showErrorDetails(errorDetails: ErrorDetails): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'errorDetails',
            'Error Details',
            vscode.ViewColumn.One,
            {}
        );
        
        panel.webview.html = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Error Details</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                .error-header { background: #dc3545; color: white; padding: 15px; border-radius: 5px; }
                .error-section { margin: 15px 0; padding: 10px; border: 1px solid #ddd; border-radius: 3px; }
                pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
            </style>
        </head>
        <body>
            <div class="error-header">
                <h1>Error Details</h1>
                <p>Type: ${errorDetails.type} | Severity: ${errorDetails.severity}</p>
            </div>
            
            <div class="error-section">
                <h2>Message</h2>
                <p>${errorDetails.message}</p>
            </div>
            
            <div class="error-section">
                <h2>Context</h2>
                <pre>${JSON.stringify(errorDetails.context, null, 2)}</pre>
            </div>
            
            ${errorDetails.stackTrace ? `
            <div class="error-section">
                <h2>Stack Trace</h2>
                <pre>${errorDetails.stackTrace}</pre>
            </div>
            ` : ''}
        </body>
        </html>
        `;
    }

    /**
     * Get error statistics for monitoring
     */
    public getErrorStatistics(): {
        totalErrors: number;
        errorsByType: Record<ErrorType, number>;
        errorsBySeverity: Record<ErrorSeverity, number>;
        recentErrors: ErrorDetails[];
    } {
        const errorsByType = {} as Record<ErrorType, number>;
        const errorsBySeverity = {} as Record<ErrorSeverity, number>;
        
        // Initialize counters
        Object.values(ErrorType).forEach(type => errorsByType[type] = 0);
        Object.values(ErrorSeverity).forEach(severity => errorsBySeverity[severity] = 0);
        
        // Count errors
        this.errorLog.forEach(error => {
            errorsByType[error.type]++;
            errorsBySeverity[error.severity]++;
        });
        
        return {
            totalErrors: this.errorLog.length,
            errorsByType,
            errorsBySeverity,
            recentErrors: this.errorLog.slice(-10)
        };
    }

    /**
     * Clear error log (for testing or maintenance)
     */
    public clearErrorLog(): void {
        this.errorLog = [];
        this.retryAttempts.clear();
    }
}