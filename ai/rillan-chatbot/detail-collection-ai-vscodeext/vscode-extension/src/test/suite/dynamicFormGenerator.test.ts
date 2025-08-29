import * as assert from 'assert';
import { DynamicFormGenerator, FormGenerationSpec } from '../../dynamicFormGenerator';

suite('Dynamic Form Generator Test Suite', () => {
    let generator: DynamicFormGenerator;

    suiteSetup(() => {
        generator = new DynamicFormGenerator();
    });

    test('Should generate minimal form', () => {
        const spec: FormGenerationSpec = {
            purpose: 'collection',
            complexity: 'minimal',
            projectType: 'web',
            context: 'Simple web project'
        };

        const form = generator.generateForm(spec);
        
        assert.ok(form, 'Should generate a form');
        assert.strictEqual(form.sections.length, 1, 'Minimal form should have 1 section');
        assert.strictEqual(form.slideshow?.enabled, false, 'Minimal form should not use slideshow');
        assert.ok(form.title.includes('Quick'), 'Minimal form should indicate quick complexity');
    });

    test('Should generate standard form', () => {
        const spec: FormGenerationSpec = {
            purpose: 'collection',
            complexity: 'standard',
            projectType: 'web',
            context: 'Standard web application'
        };

        const form = generator.generateForm(spec);
        
        assert.ok(form, 'Should generate a form');
        assert.ok(form.sections.length >= 2, 'Standard form should have multiple sections');
        assert.strictEqual(form.slideshow?.enabled, true, 'Standard form should use slideshow');
        assert.ok(form.title.includes('Standard'), 'Standard form should indicate standard complexity');
    });

    test('Should generate comprehensive form', () => {
        const spec: FormGenerationSpec = {
            purpose: 'collection',
            complexity: 'comprehensive',
            projectType: 'web',
            context: 'Complex enterprise web application'
        };

        const form = generator.generateForm(spec);
        
        assert.ok(form, 'Should generate a form');
        assert.ok(form.sections.length >= 5, 'Comprehensive form should have many sections');
        assert.strictEqual(form.slideshow?.enabled, true, 'Comprehensive form should use slideshow');
        assert.ok(form.title.includes('Detailed'), 'Comprehensive form should indicate detailed complexity');
    });

    test('Should generate investigation form', () => {
        const projectContext = {
            description: 'Performance issues in user authentication system'
        };

        const form = generator.createInvestigationForm(projectContext);
        
        assert.ok(form, 'Should generate investigation form');
        assert.ok(form.title.includes('Investigation'), 'Should be investigation form');
        
        // Check for investigation-specific fields
        const hasInvestigationFields = form.sections.some((section: any) => 
            section.fields.some((field: any) => 
                field.id === 'investigationGoals' || field.id === 'investigationScope'
            )
        );
        assert.ok(hasInvestigationFields, 'Should have investigation-specific fields');
    });

    test('Should generate refactoring form', () => {
        const codeContext = {
            description: 'Legacy payment processing module needs modernization'
        };

        const form = generator.createRefactoringForm(codeContext);
        
        assert.ok(form, 'Should generate refactoring form');
        assert.ok(form.title.includes('Refactoring'), 'Should be refactoring form');
        
        // Check for refactoring-specific fields
        const hasRefactoringFields = form.sections.some((section: any) => 
            section.fields.some((field: any) => 
                field.id === 'refactoringGoals' || field.id === 'refactoringScope'
            )
        );
        assert.ok(hasRefactoringFields, 'Should have refactoring-specific fields');
    });

    test('Should adapt fields based on project type', () => {
        const webSpec: FormGenerationSpec = {
            purpose: 'collection',
            complexity: 'standard',
            projectType: 'web',
            context: 'Web application'
        };

        const mobileSpec: FormGenerationSpec = {
            purpose: 'collection',
            complexity: 'standard',
            projectType: 'mobile',
            context: 'Mobile application'
        };

        const webForm = generator.generateForm(webSpec);
        const mobileForm = generator.generateForm(mobileSpec);
        
        // Check that web form has web-specific fields
        const webHasFrameworkField = webForm.sections.some((section: any) => 
            section.fields.some((field: any) => 
                field.id === 'framework' && field.options?.includes('React')
            )
        );
        
        // Check that mobile form has mobile-specific fields
        const mobileHasPlatformField = mobileForm.sections.some((section: any) => 
            section.fields.some((field: any) => 
                field.id === 'platform' && field.options?.includes('iOS')
            )
        );
        
        assert.ok(webHasFrameworkField, 'Web form should have web framework options');
        assert.ok(mobileHasPlatformField, 'Mobile form should have mobile platform options');
    });

    test('Should create instruction form', () => {
        const instructionContext = {
            description: 'How to set up development environment'
        };

        const form = generator.createInstructionForm(instructionContext);
        
        assert.ok(form, 'Should generate instruction form');
        assert.ok(form.title.includes('Instruction'), 'Should be instruction form');
        assert.strictEqual(form.sections.length, 1, 'Instruction form should be minimal');
    });

    test('Should handle different purposes correctly', () => {
        const purposes: Array<'collection' | 'investigation' | 'refactoring' | 'instruction'> = 
            ['collection', 'investigation', 'refactoring', 'instruction'];
        
        purposes.forEach(purpose => {
            const spec: FormGenerationSpec = {
                purpose,
                complexity: 'standard',
                projectType: 'general',
                context: `Test ${purpose} form`
            };

            const form = generator.generateForm(spec);
            assert.ok(form, `Should generate ${purpose} form`);
            assert.ok(form.title.toLowerCase().includes(purpose), `Form title should include ${purpose}`);
        });
    });
});