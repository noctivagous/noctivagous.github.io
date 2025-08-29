import * as assert from 'assert';
import * as vscode from 'vscode';
import { AIIntegrationBridge, ConversationContext, ChatMessage } from '../../aiIntegrationBridge';

suite('AI Integration Bridge Test Suite', () => {
    let bridge: AIIntegrationBridge;
    let mockContext: vscode.ExtensionContext;

    suiteSetup(() => {
        // Create a mock extension context
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

        bridge = AIIntegrationBridge.getInstance(mockContext);
    });

    test('Should create singleton instance', () => {
        const bridge1 = AIIntegrationBridge.getInstance();
        const bridge2 = AIIntegrationBridge.getInstance();
        assert.strictEqual(bridge1, bridge2, 'Should return same instance');
    });

    test('Should analyze conversation context correctly', async () => {
        const context: ConversationContext = {
            messages: [
                {
                    id: '1',
                    content: 'I want to build a web application',
                    role: 'user',
                    timestamp: new Date()
                }
            ]
        };

        const form = await bridge.generateFormFromContext(context);
        
        assert.ok(form, 'Should generate a form');
        assert.ok(form.id, 'Form should have an ID');
        assert.ok(form.title, 'Form should have a title');
        assert.ok(form.sections, 'Form should have sections');
        assert.ok(form.sections.length > 0, 'Form should have at least one section');
    });

    test('Should handle form generation request', async () => {
        const context: ConversationContext = {
            messages: [
                {
                    id: '1',
                    content: 'Create a simple calculator app',
                    role: 'user',
                    timestamp: new Date()
                }
            ]
        };

        const formId = await bridge.requestFormGeneration({
            id: '',
            context,
            formType: 'project_creation',
            complexity: 'minimal',
            purpose: 'collection'
        });

        assert.ok(formId, 'Should return a form ID');
        assert.ok(formId.startsWith('ai-form-'), 'Form ID should have correct prefix');
    });

    test('Should handle errors gracefully', () => {
        const error = new Error('Test error');
        
        // Should not throw
        assert.doesNotThrow(() => {
            bridge.handleError(error, 'Test context');
        });
    });

    test('Should register and execute form callbacks', () => {
        let callbackExecuted = false;
        const testFormId = 'test-form-123';
        
        bridge.registerFormCallback(testFormId, (response) => {
            callbackExecuted = true;
            assert.strictEqual(response.formId, testFormId);
        });

        // Simulate callback execution
        const callback = (bridge as any).formResponseCallbacks.get(testFormId);
        if (callback) {
            callback({
                formId: testFormId,
                success: true,
                data: {},
                nextAction: 'continue'
            });
        }

        assert.ok(callbackExecuted, 'Callback should have been executed');
    });
});