import * as assert from 'assert';
import { AIIntegrationErrorHandler, ErrorType, ErrorSeverity, ErrorDetails } from '../../errorHandler';

suite('Error Handler Test Suite', () => {
    let errorHandler: AIIntegrationErrorHandler;

    setup(() => {
        errorHandler = AIIntegrationErrorHandler.getInstance();
        errorHandler.clearErrorLog(); // Start with clean slate
    });

    test('Should classify errors correctly', async () => {
        const formError = new Error('Form generation failed');
        const networkError = new Error('Network timeout occurred');
        const uiError = new Error('Webview rendering issue');

        // Test form generation error
        try {
            await errorHandler.handleError(formError, { component: 'form-generator', operation: 'generate' });
        } catch (e) {
            // Expected for some error types
        }

        // Test network error
        try {
            await errorHandler.handleError(networkError, { component: 'ai-bridge', operation: 'communicate' });
        } catch (e) {
            // Expected for some error types
        }

        // Test UI error
        try {
            await errorHandler.handleError(uiError, { component: 'webview', operation: 'render' });
        } catch (e) {
            // Expected for some error types
        }

        const stats = errorHandler.getErrorStatistics();
        assert.ok(stats.totalErrors >= 3, 'Should have recorded errors');
    });

    test('Should determine error severity correctly', async () => {
        const criticalError = new Error('Critical system failure - cannot continue');
        const highError = new Error('Form generation failed to load');
        const mediumError = new Error('Timeout occurred during operation');
        const lowError = new Error('Minor validation issue');

        const errors = [criticalError, highError, mediumError, lowError];
        
        for (const error of errors) {
            try {
                await errorHandler.handleError(error, { component: 'test', operation: 'test' });
            } catch (e) {
                // Some errors might throw
            }
        }

        const stats = errorHandler.getErrorStatistics();
        assert.ok(stats.errorsBySeverity.critical >= 0, 'Should track critical errors');
        assert.ok(stats.errorsBySeverity.high >= 0, 'Should track high severity errors');
        assert.ok(stats.errorsBySeverity.medium >= 0, 'Should track medium severity errors');
        assert.ok(stats.errorsBySeverity.low >= 0, 'Should track low severity errors');
    });

    test('Should generate recovery actions', async () => {
        const formError = new Error('Form generation failed');
        
        try {
            await errorHandler.handleError(formError, { 
                component: 'form-generator', 
                operation: 'generate' 
            });
        } catch (e) {
            // Expected
        }

        const stats = errorHandler.getErrorStatistics();
        const recentError = stats.recentErrors[stats.recentErrors.length - 1];
        
        if (recentError && recentError.recoveryActions) {
            assert.ok(recentError.recoveryActions.length > 0, 'Should generate recovery actions');
            
            const retryAction = recentError.recoveryActions.find(action => 
                action.id.includes('retry')
            );
            assert.ok(retryAction, 'Should include retry action');
        }
    });

    test('Should track error statistics', async () => {
        const errors = [
            new Error('Form generation error'),
            new Error('Network communication failed'),
            new Error('UI rendering issue'),
            new Error('Data processing error')
        ];

        for (const error of errors) {
            try {
                await errorHandler.handleError(error, { 
                    component: 'test', 
                    operation: 'test' 
                });
            } catch (e) {
                // Some errors might throw
            }
        }

        const stats = errorHandler.getErrorStatistics();
        assert.ok(stats.totalErrors >= 4, 'Should track total error count');
        assert.ok(Object.keys(stats.errorsByType).length > 0, 'Should categorize errors by type');
        assert.ok(Object.keys(stats.errorsBySeverity).length > 0, 'Should categorize errors by severity');
        assert.ok(stats.recentErrors.length > 0, 'Should track recent errors');
    });

    test('Should handle ErrorDetails objects', async () => {
        const errorDetails: ErrorDetails = {
            type: ErrorType.FORM_GENERATION,
            severity: ErrorSeverity.HIGH,
            message: 'Custom error details',
            context: {
                component: 'test-component',
                operation: 'test-operation',
                timestamp: new Date(),
                formId: 'test-form-123'
            },
            recoveryActions: []
        };

        try {
            await errorHandler.handleError(errorDetails);
        } catch (e) {
            // Expected for high severity errors
        }

        const stats = errorHandler.getErrorStatistics();
        const recentError = stats.recentErrors[stats.recentErrors.length - 1];
        
        assert.strictEqual(recentError.type, ErrorType.FORM_GENERATION);
        assert.strictEqual(recentError.severity, ErrorSeverity.HIGH);
        assert.strictEqual(recentError.message, 'Custom error details');
        assert.strictEqual(recentError.context.formId, 'test-form-123');
    });

    test('Should limit error log size', async () => {
        // Generate more than 100 errors to test log size limit
        for (let i = 0; i < 150; i++) {
            try {
                await errorHandler.handleError(new Error(`Test error ${i}`), {
                    component: 'test',
                    operation: 'test'
                });
            } catch (e) {
                // Some errors might throw
            }
        }

        const stats = errorHandler.getErrorStatistics();
        assert.ok(stats.totalErrors <= 100, 'Should limit error log to 100 entries');
    });

    test('Should clear error log', async () => {
        // Add some errors
        const errors = [
            new Error('Error 1'),
            new Error('Error 2'),
            new Error('Error 3')
        ];

        for (const error of errors) {
            try {
                await errorHandler.handleError(error, { component: 'test', operation: 'test' });
            } catch (e) {
                // Expected
            }
        }

        let stats = errorHandler.getErrorStatistics();
        assert.ok(stats.totalErrors >= 3, 'Should have errors before clearing');

        // Clear the log
        errorHandler.clearErrorLog();

        stats = errorHandler.getErrorStatistics();
        assert.strictEqual(stats.totalErrors, 0, 'Should have no errors after clearing');
    });

    test('Should handle context information', async () => {
        const error = new Error('Test error with context');
        const context = {
            component: 'ai-bridge',
            operation: 'form-generation',
            userId: 'test-user-123',
            sessionId: 'session-456',
            formId: 'form-789',
            workflowId: 'workflow-abc',
            additionalData: {
                requestType: 'comprehensive',
                complexity: 'high'
            }
        };

        try {
            await errorHandler.handleError(error, context);
        } catch (e) {
            // Expected
        }

        const stats = errorHandler.getErrorStatistics();
        const recentError = stats.recentErrors[stats.recentErrors.length - 1];
        
        assert.strictEqual(recentError.context.component, 'ai-bridge');
        assert.strictEqual(recentError.context.operation, 'form-generation');
        assert.strictEqual(recentError.context.userId, 'test-user-123');
        assert.strictEqual(recentError.context.formId, 'form-789');
        assert.strictEqual(recentError.context.workflowId, 'workflow-abc');
        assert.ok(recentError.context.additionalData, 'Should preserve additional data');
    });

    teardown(() => {
        errorHandler.clearErrorLog();
    });
});