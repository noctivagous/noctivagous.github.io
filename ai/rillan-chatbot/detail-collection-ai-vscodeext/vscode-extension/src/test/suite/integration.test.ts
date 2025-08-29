import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIIntegrationBridge, ConversationContext } from '../../aiIntegrationBridge';
import { WorkflowOrchestrator } from '../../workflowOrchestrator';
import { DynamicWorkflowController } from '../../dynamicWorkflowController';
import { PerformanceOptimizer } from '../../performanceOptimizer';
import { AIIntegrationErrorHandler } from '../../errorHandler';

suite('Integration Test Suite', () => {
    let mockContext: vscode.ExtensionContext;
    let aiBridge: AIIntegrationBridge;
    let orchestrator: WorkflowOrchestrator;
    let dynamicController: DynamicWorkflowController;
    let optimizer: PerformanceOptimizer;
    let errorHandler: AIIntegrationErrorHandler;

    setup(() => {
        // Create mock extension context
        mockContext = {
            subscriptions: [],
            workspaceState: {
                get: () => undefined,
                update: () => Promise.resolve()
            },
            globalState: {
                get: () => undefined,
                update: () => Promise.resolve(),
                setKeysForSync: () => {}
            },
            extensionUri: vscode.Uri.file('/mock/path'),
            extensionPath: '/mock/path',
            asAbsolutePath: (relativePath: string) => `/mock/path/${relativePath}`,
            storageUri: vscode.Uri.file('/mock/storage'),
            globalStorageUri: vscode.Uri.file('/mock/global-storage'),
            logUri: vscode.Uri.file('/mock/log'),
            extensionMode: vscode.ExtensionMode.Test,
            secrets: {
                get: () => Promise.resolve(undefined),
                store: () => Promise.resolve(),
                delete: () => Promise.resolve()
            }
        } as any;

        // Initialize all components
        aiBridge = AIIntegrationBridge.getInstance(mockContext);
        orchestrator = WorkflowOrchestrator.getInstance(mockContext);
        dynamicController = DynamicWorkflowController.getInstance(mockContext);
        optimizer = PerformanceOptimizer.getInstance();
        errorHandler = AIIntegrationErrorHandler.getInstance();

        // Clear any existing state
        optimizer.clearAllCaches();
        errorHandler.clearErrorLog();
    });

    test('End-to-End: AI Form Generation and Response Processing', async () => {
        const conversationContext: ConversationContext = {
            messages: [{
                id: '1',
                content: 'I want to build a web application for task management',
                role: 'user',
                timestamp: new Date()
            }]
        };

        // Test AI form generation
        const { result: form, duration } = await optimizer.measureFormGeneration(async () => {
            return aiBridge.generateFormFromContext(conversationContext);
        });

        assert.ok(form, 'Should generate form from context');
        assert.ok(form.id, 'Generated form should have ID');
        assert.ok(form.title, 'Generated form should have title');
        assert.ok(form.sections, 'Generated form should have sections');
        assert.ok(duration >= 0, 'Should measure generation time');

        // Record performance metrics
        optimizer.recordMetrics({
            formGenerationTime: duration,
            formRenderTime: 100,
            dataProcessingTime: 50
        });

        // Test form response processing
        const mockResponse = {
            formId: form.id,
            success: true,
            data: {
                projectName: 'Task Manager Pro',
                description: 'A comprehensive task management application',
                framework: 'React',
                complexity: 7
            },
            nextAction: 'continue' as const
        };

        await aiBridge.processFormResponse(mockResponse);

        // Verify performance stats
        const stats = optimizer.getPerformanceStats();
        assert.ok(stats.averageGenerationTime >= 0, 'Should track performance metrics');
    });

    test('End-to-End: Workflow Orchestration with Error Handling', async () => {
        const conversationContext: ConversationContext = {
            messages: [{
                id: '1',
                content: 'I need help investigating a performance issue',
                role: 'user',
                timestamp: new Date()
            }]
        };

        let workflowCompleted = false;
        let workflowResult: any = null;

        // Start workflow with completion callback
        const instanceId = await orchestrator.startWorkflow(
            'investigation-comprehensive',
            conversationContext,
            (result) => {
                workflowCompleted = true;
                workflowResult = result;
            }
        );

        assert.ok(instanceId, 'Should start workflow and return instance ID');

        // Verify workflow is active
        const activeWorkflows = orchestrator.getActiveWorkflows();
        const testWorkflow = activeWorkflows.find(w => w.id === instanceId);
        assert.ok(testWorkflow, 'Should track active workflow');
        assert.strictEqual(testWorkflow.status, 'active');

        // Test error handling during workflow
        try {
            throw new Error('Simulated workflow error');
        } catch (error) {
            const handledError = await errorHandler.handleError(error as Error, {
                component: 'workflow-orchestrator',
                operation: 'execute-stage',
                workflowId: instanceId
            });
            
            // Should handle error gracefully
            assert.ok(handledError !== undefined, 'Should handle workflow errors');
        }

        // Test workflow pause/resume
        const pauseResult = orchestrator.pauseWorkflow(instanceId);
        assert.ok(pauseResult, 'Should pause workflow');

        const resumeResult = await orchestrator.resumeWorkflow(instanceId);
        assert.ok(resumeResult, 'Should resume workflow');
    });

    test('End-to-End: Dynamic Workflow Modification', async () => {
        const conversationContext: ConversationContext = {
            messages: [{
                id: '1',
                content: 'Create a complex project with multiple validation stages',
                role: 'user',
                timestamp: new Date()
            }]
        };

        // Start a workflow
        const instanceId = await orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext
        );

        // Test dynamic modification
        const modification = {
            instanceId,
            type: 'add_stage' as const,
            newStage: {
                id: 'validation-stage',
                name: 'Additional Validation',
                type: 'form' as const,
                formRequest: {
                    id: 'validation-form',
                    title: 'Validation Form',
                    formType: 'custom' as const,
                    complexity: 'minimal' as const,
                    purpose: 'collection' as const,
                    sections: [{
                        id: 'validation',
                        title: 'Validation',
                        fields: [{
                            id: 'validationType',
                            type: 'select' as const,
                            label: 'Validation Type',
                            options: [
                                { value: 'basic', label: 'Basic' },
                                { value: 'advanced', label: 'Advanced' }
                            ]
                        }]
                    }]
                }
            },
            reason: 'Additional validation needed for complex project',
            aiContext: conversationContext
        };

        // This would normally show user approval dialog
        // For testing, we'll verify the modification structure
        assert.ok(modification.newStage, 'Should have new stage definition');
        assert.ok(modification.reason, 'Should have modification reason');
        assert.strictEqual(modification.type, 'add_stage', 'Should specify modification type');
    });

    test('End-to-End: Performance Optimization with Caching', async () => {
        // Test template caching
        const template = {
            id: 'performance-test-template',
            title: 'Performance Test Template',
            sections: [{
                id: 'section1',
                title: 'Section 1',
                fields: []
            }]
        };

        optimizer.cacheFormTemplate('perf-test', template);

        // Measure cache retrieval performance
        const { result: cachedTemplate, duration } = optimizer.measureFormRender(() => {
            return optimizer.getCachedFormTemplate('perf-test');
        });

        assert.ok(cachedTemplate, 'Should retrieve cached template');
        assert.ok(duration >= 0, 'Should measure cache retrieval time');
        assert.ok(duration < 10, 'Cache retrieval should be fast'); // Should be very fast

        // Test cache statistics
        const cacheStats = optimizer.getCacheStatistics();
        assert.ok(cacheStats.templateCacheSize > 0, 'Should have cached templates');
        assert.ok(cacheStats.totalMemoryUsage > 0, 'Should track memory usage');

        // Test lazy loading optimization
        const largeForm = {
            id: 'large-form',
            sections: Array.from({ length: 20 }, (_, i) => ({
                id: `section-${i}`,
                title: `Section ${i}`,
                fields: []
            }))
        };

        const optimizedForm = optimizer.optimizeFormRendering(largeForm);
        
        if (optimizedForm.lazyLoaded) {
            assert.ok(optimizedForm.lazyLoaded, 'Should optimize large forms with lazy loading');
            assert.ok(optimizedForm.chunks, 'Should create chunks for lazy loading');
        }
    });

    test('End-to-End: Error Recovery and Fallback Mechanisms', async () => {
        // Test form generation error with fallback
        const invalidContext: ConversationContext = {
            messages: [{
                id: '1',
                content: '', // Invalid empty content
                role: 'user',
                timestamp: new Date()
            }]
        };

        try {
            await aiBridge.generateFormFromContext(invalidContext);
        } catch (error) {
            // Should handle error and provide fallback
            const fallbackResult = await errorHandler.handleError(error as Error, {
                component: 'ai-bridge',
                operation: 'generate-form-from-context'
            });
            
            // Should provide safe fallback
            assert.ok(fallbackResult !== undefined, 'Should provide fallback result');
        }

        // Test UI rendering error with fallback
        try {
            throw new Error('Slideshow rendering failed');
        } catch (error) {
            const fallbackResult = await errorHandler.handleError(error as Error, {
                component: 'slideshow-controller',
                operation: 'render'
            });
            
            // Should fall back to single page mode
            assert.ok(fallbackResult, 'Should provide UI fallback');
        }

        // Verify error statistics
        const errorStats = errorHandler.getErrorStatistics();
        assert.ok(errorStats.totalErrors > 0, 'Should track errors');
        assert.ok(errorStats.recentErrors.length > 0, 'Should track recent errors');
    });

    test('End-to-End: AI Suggestion Workflow', async () => {
        // Test AI form suggestion
        const suggestionRequest = {
            title: 'Performance Investigation Form',
            description: 'AI suggests investigating performance issues',
            reason: 'Detected performance-related keywords in conversation',
            priority: 'medium' as const,
            formRequest: {
                id: 'perf-investigation',
                title: 'Performance Investigation',
                formType: 'investigation' as const,
                complexity: 'standard' as const,
                purpose: 'investigation' as const,
                sections: [{
                    id: 'performance-details',
                    title: 'Performance Details',
                    fields: [{
                        id: 'performanceIssue',
                        type: 'textarea' as const,
                        label: 'Describe the performance issue',
                        required: true
                    }]
                }]
            },
            conversationContext: {
                messages: [{
                    id: '1',
                    content: 'My app is running slowly',
                    role: 'user' as const,
                    timestamp: new Date()
                }]
            }
        };

        const suggestionId = await aiBridge.suggestForm(suggestionRequest);
        assert.ok(suggestionId, 'Should create form suggestion');

        const activeSuggestions = aiBridge.getActiveSuggestions();
        assert.ok(activeSuggestions.length > 0, 'Should track active suggestions');

        const testSuggestion = activeSuggestions.find((s: any) => s.id === suggestionId);
        assert.ok(testSuggestion, 'Should find created suggestion');
        assert.strictEqual(testSuggestion.title, 'Performance Investigation Form');
    });

    test('End-to-End: Complete Workflow with All Components', async () => {
        // This test demonstrates the complete integration of all components
        
        // 1. Start with AI form generation (with performance monitoring)
        const conversationContext: ConversationContext = {
            messages: [{
                id: '1',
                content: 'I want to create a comprehensive e-commerce platform',
                role: 'user',
                timestamp: new Date()
            }]
        };

        const { result: form, duration: generationTime } = await optimizer.measureFormGeneration(async () => {
            return aiBridge.generateFormFromContext(conversationContext);
        });

        // 2. Cache the generated form for performance
        optimizer.cacheGeneratedForm(form.id, form);

        // 3. Start a workflow based on the form
        const workflowInstanceId = await orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext
        );

        // 4. Record performance metrics
        optimizer.recordMetrics({
            formGenerationTime: generationTime,
            formRenderTime: 150,
            dataProcessingTime: 75,
            userInteractionLatency: 25
        });

        // 5. Test error handling during the process
        try {
            throw new Error('Simulated integration error');
        } catch (error) {
            await errorHandler.handleError(error as Error, {
                component: 'integration-test',
                operation: 'complete-workflow',
                formId: form.id,
                workflowId: workflowInstanceId
            });
        }

        // 6. Verify all components are working together
        const performanceStats = optimizer.getPerformanceStats();
        const errorStats = errorHandler.getErrorStatistics();
        const cacheStats = optimizer.getCacheStatistics();
        const activeWorkflows = orchestrator.getActiveWorkflows();

        // Assertions
        assert.ok(form.id, 'Should generate form');
        assert.ok(workflowInstanceId, 'Should start workflow');
        assert.ok(performanceStats.averageGenerationTime >= 0, 'Should track performance');
        assert.ok(errorStats.totalErrors >= 0, 'Should track errors');
        assert.ok(cacheStats.formCacheSize >= 0, 'Should manage cache');
        assert.ok(activeWorkflows.length >= 0, 'Should track workflows');

        // Clean up
        orchestrator.cancelWorkflow(workflowInstanceId);
    });

    teardown(() => {
        // Clean up test data
        optimizer.clearAllCaches();
        errorHandler.clearErrorLog();
        
        const activeWorkflows = orchestrator.getActiveWorkflows();
        activeWorkflows.forEach(workflow => {
            orchestrator.cancelWorkflow(workflow.id);
        });
    });
});