import * as assert from 'assert';
import * as vscode from 'vscode';
import { WorkflowOrchestrator, WorkflowDefinition, WorkflowInstance } from '../../workflowOrchestrator';

suite('Workflow Orchestrator Test Suite', () => {
    let orchestrator: WorkflowOrchestrator;
    let mockContext: vscode.ExtensionContext;

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

        orchestrator = WorkflowOrchestrator.getInstance(mockContext);
    });

    test('Should initialize with built-in workflows', () => {
        const availableWorkflows = orchestrator.getAvailableWorkflows();
        assert.ok(availableWorkflows.length > 0, 'Should have built-in workflows');
        
        const projectCreationWorkflow = availableWorkflows.find(w => w.id === 'project-creation-comprehensive');
        assert.ok(projectCreationWorkflow, 'Should have project creation workflow');
        assert.strictEqual(projectCreationWorkflow.name, 'Comprehensive Project Creation');
    });

    test('Should register custom workflows', () => {
        const customWorkflow: WorkflowDefinition = {
            id: 'test-workflow',
            name: 'Test Workflow',
            description: 'A test workflow for unit testing',
            stages: [
                {
                    id: 'test-stage',
                    name: 'Test Stage',
                    type: 'form',
                    formRequest: {
                        id: 'test-form',
                        title: 'Test Form',
                        formType: 'custom',
                        complexity: 'minimal',
                        purpose: 'collection',
                        sections: []
                    }
                }
            ],
            metadata: {
                createdBy: 'ai',
                createdAt: new Date(),
                priority: 'low'
            }
        };

        orchestrator.registerWorkflow(customWorkflow);
        
        const workflows = orchestrator.getAvailableWorkflows();
        const testWorkflow = workflows.find(w => w.id === 'test-workflow');
        assert.ok(testWorkflow, 'Should register custom workflow');
        assert.strictEqual(testWorkflow.name, 'Test Workflow');
    });

    test('Should start workflow and return instance ID', async () => {
        const conversationContext = {
            messages: [{
                id: '1',
                content: 'Test message',
                role: 'user' as const,
                timestamp: new Date()
            }]
        };

        const instanceId = await orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext
        );

        assert.ok(instanceId, 'Should return workflow instance ID');
        assert.ok(instanceId.startsWith('workflow-'), 'Instance ID should have correct prefix');
    });

    test('Should track active workflows', async () => {
        const conversationContext = {
            messages: [{
                id: '1',
                content: 'Test message',
                role: 'user' as const,
                timestamp: new Date()
            }]
        };

        const instanceId = await orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext
        );

        const activeWorkflows = orchestrator.getActiveWorkflows();
        assert.ok(activeWorkflows.length > 0, 'Should have active workflows');
        
        const testInstance = activeWorkflows.find(w => w.id === instanceId);
        assert.ok(testInstance, 'Should track the started workflow');
        assert.strictEqual(testInstance.status, 'active');
    });

    test('Should pause and resume workflows', async () => {
        const conversationContext = {
            messages: [{
                id: '1',
                content: 'Test message',
                role: 'user' as const,
                timestamp: new Date()
            }]
        };

        const instanceId = await orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext
        );

        // Pause workflow
        const pauseResult = orchestrator.pauseWorkflow(instanceId);
        assert.ok(pauseResult, 'Should successfully pause workflow');

        const activeWorkflows = orchestrator.getActiveWorkflows();
        const pausedInstance = activeWorkflows.find(w => w.id === instanceId);
        assert.strictEqual(pausedInstance?.status, 'paused');

        // Resume workflow
        const resumeResult = await orchestrator.resumeWorkflow(instanceId);
        assert.ok(resumeResult, 'Should successfully resume workflow');

        const resumedWorkflows = orchestrator.getActiveWorkflows();
        const resumedInstance = resumedWorkflows.find(w => w.id === instanceId);
        assert.strictEqual(resumedInstance?.status, 'active');
    });

    test('Should cancel workflows', async () => {
        const conversationContext = {
            messages: [{
                id: '1',
                content: 'Test message',
                role: 'user' as const,
                timestamp: new Date()
            }]
        };

        const instanceId = await orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext
        );

        const cancelResult = orchestrator.cancelWorkflow(instanceId);
        assert.ok(cancelResult, 'Should successfully cancel workflow');

        const activeWorkflows = orchestrator.getActiveWorkflows();
        const cancelledInstance = activeWorkflows.find(w => w.id === instanceId);
        assert.ok(!cancelledInstance, 'Cancelled workflow should be removed from active workflows');
    });

    test('Should handle workflow completion callback', (done) => {
        const conversationContext = {
            messages: [{
                id: '1',
                content: 'Test message',
                role: 'user' as const,
                timestamp: new Date()
            }]
        };

        orchestrator.startWorkflow(
            'project-creation-comprehensive',
            conversationContext,
            (result) => {
                assert.ok(result, 'Should receive workflow result');
                assert.ok(result.workflowId, 'Result should have workflow ID');
                assert.ok(result.instanceId, 'Result should have instance ID');
                done();
            }
        );

        // Simulate workflow completion by processing a form response
        setTimeout(() => {
            // This would normally be triggered by form submission
            // For testing, we'll simulate completion
        }, 100);
    });

    teardown(() => {
        // Clean up any test data
        const activeWorkflows = orchestrator.getActiveWorkflows();
        activeWorkflows.forEach(workflow => {
            orchestrator.cancelWorkflow(workflow.id);
        });
    });
});