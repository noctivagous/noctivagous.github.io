import { RillanForm, RillanFormSection, RillanFormField } from './detailCollectorPanel';

export type ComplexityLevel = 'minimal' | 'standard' | 'comprehensive';
export type FormPurpose = 'collection' | 'instruction' | 'investigation' | 'refactoring';
export type ProjectType = 'web' | 'mobile' | 'desktop' | 'api' | 'database' | 'ai_ml' | 'game' | 'general';

export interface FormGenerationSpec {
    purpose: FormPurpose;
    complexity: ComplexityLevel;
    projectType: ProjectType;
    context: string;
    customFields?: FormFieldSpec[];
}

export interface FormFieldSpec {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'slider';
    label: string;
    description?: string;
    required?: boolean;
    options?: string[];
    defaultValue?: any;
}

/**
 * Dynamic Form Generator - Creates contextual forms based on AI specifications
 */
export class DynamicFormGenerator {
    
    /**
     * Generate a form based on specification
     */
    public generateForm(spec: FormGenerationSpec): RillanForm {
        const baseForm = this.createBaseForm(spec);
        
        switch (spec.complexity) {
            case 'minimal':
                return this.createMinimalForm(baseForm, spec);
            case 'standard':
                return this.createStandardForm(baseForm, spec);
            case 'comprehensive':
                return this.createComprehensiveForm(baseForm, spec);
            default:
                return this.createStandardForm(baseForm, spec);
        }
    }

    /**
     * Create minimal form for simple requests
     */
    public createMinimalForm(baseForm: RillanForm, spec: FormGenerationSpec): RillanForm {
        const sections: RillanFormSection[] = [
            {
                id: 'basics',
                title: 'Essential Details',
                fields: this.getMinimalFields(spec.projectType, spec.purpose)
            }
        ];

        return {
            ...baseForm,
            sections,
            slideshow: {
                enabled: false,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: false
            }
        };
    }

    /**
     * Create standard form for typical requests
     */
    public createStandardForm(baseForm: RillanForm, spec: FormGenerationSpec): RillanForm {
        const sections: RillanFormSection[] = [
            {
                id: 'project-overview',
                title: 'Project Overview',
                fields: this.getOverviewFields(spec.projectType, spec.purpose)
            },
            {
                id: 'technical-details',
                title: 'Technical Details',
                fields: this.getTechnicalFields(spec.projectType, spec.purpose)
            }
        ];

        // Add purpose-specific sections
        if (spec.purpose === 'investigation') {
            sections.push({
                id: 'investigation-scope',
                title: 'Investigation Scope',
                fields: this.getInvestigationFields(spec.projectType)
            });
        } else if (spec.purpose === 'refactoring') {
            sections.push({
                id: 'refactoring-goals',
                title: 'Refactoring Goals',
                fields: this.getRefactoringFields(spec.projectType)
            });
        }

        return {
            ...baseForm,
            sections,
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            }
        };
    }

    /**
     * Create comprehensive form for complex requests
     */
    public createComprehensiveForm(baseForm: RillanForm, spec: FormGenerationSpec): RillanForm {
        const sections: RillanFormSection[] = [
            {
                id: 'project-definition',
                title: 'Project Definition',
                fields: this.getProjectDefinitionFields(spec.projectType, spec.purpose)
            },
            {
                id: 'requirements',
                title: 'Requirements & Constraints',
                fields: this.getRequirementsFields(spec.projectType, spec.purpose)
            },
            {
                id: 'technical-architecture',
                title: 'Technical Architecture',
                fields: this.getArchitectureFields(spec.projectType, spec.purpose)
            },
            {
                id: 'implementation-details',
                title: 'Implementation Details',
                fields: this.getImplementationFields(spec.projectType, spec.purpose)
            }
        ];

        // Add purpose-specific comprehensive sections
        if (spec.purpose === 'investigation') {
            sections.push({
                id: 'investigation-methodology',
                title: 'Investigation Methodology',
                fields: this.getInvestigationMethodologyFields(spec.projectType)
            });
        } else if (spec.purpose === 'refactoring') {
            sections.push({
                id: 'refactoring-strategy',
                title: 'Refactoring Strategy',
                fields: this.getRefactoringStrategyFields(spec.projectType)
            });
        }

        sections.push({
            id: 'timeline-resources',
            title: 'Timeline & Resources',
            fields: this.getTimelineResourcesFields(spec.projectType, spec.purpose)
        });

        return {
            ...baseForm,
            sections,
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            }
        };
    }

    /**
     * Create investigation-focused form
     */
    public createInvestigationForm(projectContext: any): RillanForm {
        const spec: FormGenerationSpec = {
            purpose: 'investigation',
            complexity: 'standard',
            projectType: this.detectProjectType(projectContext.description || ''),
            context: projectContext.description || ''
        };

        return this.generateForm(spec);
    }

    /**
     * Create refactoring-focused form
     */
    public createRefactoringForm(codeContext: any): RillanForm {
        const spec: FormGenerationSpec = {
            purpose: 'refactoring',
            complexity: 'standard',
            projectType: this.detectProjectType(codeContext.description || ''),
            context: codeContext.description || ''
        };

        return this.generateForm(spec);
    }

    /**
     * Create instruction-focused form
     */
    public createInstructionForm(instructionContext: any): RillanForm {
        const spec: FormGenerationSpec = {
            purpose: 'instruction',
            complexity: 'minimal',
            projectType: 'general',
            context: instructionContext.description || ''
        };

        return this.generateForm(spec);
    }

    // Private helper methods

    private createBaseForm(spec: FormGenerationSpec): RillanForm {
        const purposeEmojis = {
            collection: '📋',
            instruction: '📖',
            investigation: '🔍',
            refactoring: '🔧'
        };

        const complexityLabels = {
            minimal: 'Quick',
            standard: 'Standard',
            comprehensive: 'Detailed'
        };

        return {
            id: `ai-${spec.purpose}-${Date.now()}`,
            title: `${purposeEmojis[spec.purpose]} ${complexityLabels[spec.complexity]} ${spec.purpose.charAt(0).toUpperCase() + spec.purpose.slice(1)} Form`,
            description: `AI-generated ${spec.complexity} form for ${spec.purpose} based on your request`,
            stage: 'preliminary',
            sections: [],
            submitLabel: `Submit ${spec.purpose.charAt(0).toUpperCase() + spec.purpose.slice(1)}`,
            allowSkip: spec.complexity === 'minimal',
            slideshow: {
                enabled: true,
                sectionsPerSlide: 1,
                navigationStyle: 'both',
                progressIndicator: true
            }
        };
    }

    private detectProjectType(context: string): ProjectType {
        const lowerContext = context.toLowerCase();
        
        if (lowerContext.includes('web') || lowerContext.includes('website') || lowerContext.includes('frontend') || lowerContext.includes('backend')) {
            return 'web';
        } else if (lowerContext.includes('mobile') || lowerContext.includes('app') || lowerContext.includes('ios') || lowerContext.includes('android')) {
            return 'mobile';
        } else if (lowerContext.includes('desktop') || lowerContext.includes('electron') || lowerContext.includes('gui')) {
            return 'desktop';
        } else if (lowerContext.includes('api') || lowerContext.includes('rest') || lowerContext.includes('graphql') || lowerContext.includes('microservice')) {
            return 'api';
        } else if (lowerContext.includes('database') || lowerContext.includes('sql') || lowerContext.includes('nosql') || lowerContext.includes('data')) {
            return 'database';
        } else if (lowerContext.includes('ai') || lowerContext.includes('ml') || lowerContext.includes('machine learning') || lowerContext.includes('neural')) {
            return 'ai_ml';
        } else if (lowerContext.includes('game') || lowerContext.includes('unity') || lowerContext.includes('unreal')) {
            return 'game';
        }
        
        return 'general';
    }

    private getMinimalFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        const baseFields: RillanFormField[] = [
            {
                id: 'name',
                type: 'text',
                label: purpose === 'collection' ? 'Project Name' : 'Task Name',
                required: true,
                placeholder: 'Enter a descriptive name'
            },
            {
                id: 'description',
                type: 'textarea',
                label: 'Description',
                required: true,
                description: 'Provide a clear description of what you want to achieve'
            }
        ];

        if (purpose === 'collection') {
            baseFields.push({
                id: 'priority',
                type: 'select',
                label: 'Priority Level',
                options: ['Low', 'Medium', 'High', 'Critical'],
                defaultValue: 'Medium'
            });
        }

        return baseFields;
    }

    private getOverviewFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        const fields: RillanFormField[] = [
            {
                id: 'projectName',
                type: 'text',
                label: 'Project Name',
                required: true,
                placeholder: 'Enter project name'
            },
            {
                id: 'description',
                type: 'textarea',
                label: 'Project Description',
                required: true,
                description: 'Describe the project goals and objectives'
            },
            {
                id: 'scope',
                type: 'select',
                label: 'Project Scope',
                options: ['Small (1-2 weeks)', 'Medium (1-2 months)', 'Large (3-6 months)', 'Enterprise (6+ months)'],
                defaultValue: 'Medium (1-2 months)'
            }
        ];

        if (projectType !== 'general') {
            fields.push({
                id: 'targetAudience',
                type: 'multiselect',
                label: 'Target Audience',
                options: ['End Users', 'Developers', 'Administrators', 'Business Users', 'External APIs']
            });
        }

        return fields;
    }

    private getTechnicalFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        const commonFields: RillanFormField[] = [];

        switch (projectType) {
            case 'web':
                commonFields.push(
                    {
                        id: 'framework',
                        type: 'select',
                        label: 'Frontend Framework',
                        options: ['React', 'Vue.js', 'Angular', 'Svelte', 'Vanilla JavaScript', 'Other']
                    },
                    {
                        id: 'backend',
                        type: 'select',
                        label: 'Backend Technology',
                        options: ['Node.js', 'Python (Django/Flask)', 'Java (Spring)', 'C# (.NET)', 'PHP', 'Ruby on Rails', 'Other']
                    }
                );
                break;
            case 'mobile':
                commonFields.push(
                    {
                        id: 'platform',
                        type: 'multiselect',
                        label: 'Target Platforms',
                        options: ['iOS', 'Android', 'Web (PWA)', 'Desktop']
                    },
                    {
                        id: 'framework',
                        type: 'select',
                        label: 'Development Framework',
                        options: ['React Native', 'Flutter', 'Native (Swift/Kotlin)', 'Xamarin', 'Ionic', 'Other']
                    }
                );
                break;
            case 'desktop':
                commonFields.push(
                    {
                        id: 'platform',
                        type: 'multiselect',
                        label: 'Target Platforms',
                        options: ['Windows', 'macOS', 'Linux']
                    },
                    {
                        id: 'framework',
                        type: 'select',
                        label: 'Development Framework',
                        options: ['Electron', 'Tauri', 'Qt', 'WPF', 'GTK', 'Native', 'Other']
                    }
                );
                break;
            default:
                commonFields.push({
                    id: 'technology',
                    type: 'text',
                    label: 'Primary Technology/Language',
                    placeholder: 'e.g., Python, JavaScript, Java'
                });
        }

        return commonFields;
    }

    private getProjectDefinitionFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        return [
            {
                id: 'projectName',
                type: 'text',
                label: 'Project Name',
                required: true
            },
            {
                id: 'businessGoals',
                type: 'textarea',
                label: 'Business Goals',
                required: true,
                description: 'What business problems does this solve?'
            },
            {
                id: 'successCriteria',
                type: 'textarea',
                label: 'Success Criteria',
                required: true,
                description: 'How will you measure success?'
            },
            {
                id: 'stakeholders',
                type: 'multiselect',
                label: 'Key Stakeholders',
                options: ['Product Manager', 'Engineering Team', 'Design Team', 'QA Team', 'DevOps', 'Business Users', 'External Partners']
            }
        ];
    }

    private getRequirementsFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        return [
            {
                id: 'functionalRequirements',
                type: 'textarea',
                label: 'Functional Requirements',
                required: true,
                description: 'What should the system do?'
            },
            {
                id: 'nonFunctionalRequirements',
                type: 'textarea',
                label: 'Non-Functional Requirements',
                description: 'Performance, security, scalability requirements'
            },
            {
                id: 'constraints',
                type: 'textarea',
                label: 'Constraints & Limitations',
                description: 'Budget, time, technology, or other constraints'
            },
            {
                id: 'compliance',
                type: 'multiselect',
                label: 'Compliance Requirements',
                options: ['GDPR', 'HIPAA', 'SOX', 'PCI DSS', 'ISO 27001', 'None', 'Other']
            }
        ];
    }

    private getArchitectureFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        const fields: RillanFormField[] = [
            {
                id: 'architecturePattern',
                type: 'select',
                label: 'Architecture Pattern',
                options: ['Monolithic', 'Microservices', 'Serverless', 'Event-Driven', 'Layered', 'Hexagonal', 'Other']
            },
            {
                id: 'dataStorage',
                type: 'multiselect',
                label: 'Data Storage',
                options: ['SQL Database', 'NoSQL Database', 'File Storage', 'Cache (Redis)', 'Search Engine', 'Data Warehouse']
            }
        ];

        if (projectType === 'web' || projectType === 'api') {
            fields.push({
                id: 'deployment',
                type: 'multiselect',
                label: 'Deployment Environment',
                options: ['Cloud (AWS)', 'Cloud (Azure)', 'Cloud (GCP)', 'On-Premise', 'Hybrid', 'Edge Computing']
            });
        }

        return fields;
    }

    private getImplementationFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        return [
            {
                id: 'developmentMethodology',
                type: 'select',
                label: 'Development Methodology',
                options: ['Agile/Scrum', 'Kanban', 'Waterfall', 'DevOps', 'Lean', 'Other']
            },
            {
                id: 'testingStrategy',
                type: 'multiselect',
                label: 'Testing Strategy',
                options: ['Unit Testing', 'Integration Testing', 'E2E Testing', 'Performance Testing', 'Security Testing', 'Manual Testing']
            },
            {
                id: 'cicd',
                type: 'checkbox',
                label: 'CI/CD Pipeline Required',
                defaultValue: true
            },
            {
                id: 'monitoring',
                type: 'multiselect',
                label: 'Monitoring & Observability',
                options: ['Application Monitoring', 'Infrastructure Monitoring', 'Log Aggregation', 'Error Tracking', 'Performance Monitoring']
            }
        ];
    }

    private getTimelineResourcesFields(projectType: ProjectType, purpose: FormPurpose): RillanFormField[] {
        return [
            {
                id: 'timeline',
                type: 'select',
                label: 'Expected Timeline',
                options: ['1-2 weeks', '1 month', '2-3 months', '3-6 months', '6-12 months', '1+ years']
            },
            {
                id: 'teamSize',
                type: 'select',
                label: 'Team Size',
                options: ['Solo (1 person)', 'Small (2-3 people)', 'Medium (4-8 people)', 'Large (9-15 people)', 'Enterprise (15+ people)']
            },
            {
                id: 'budget',
                type: 'select',
                label: 'Budget Range',
                options: ['Under $10K', '$10K - $50K', '$50K - $100K', '$100K - $500K', '$500K+', 'Not specified']
            },
            {
                id: 'resources',
                type: 'multiselect',
                label: 'Required Resources',
                options: ['Development Team', 'Design Team', 'QA Team', 'DevOps Engineer', 'Project Manager', 'External Consultants']
            }
        ];
    }

    private getInvestigationFields(projectType: ProjectType): RillanFormField[] {
        return [
            {
                id: 'investigationGoals',
                type: 'textarea',
                label: 'Investigation Goals',
                required: true,
                description: 'What do you want to understand or discover?'
            },
            {
                id: 'currentState',
                type: 'textarea',
                label: 'Current State',
                description: 'Describe the current situation or system'
            },
            {
                id: 'investigationScope',
                type: 'multiselect',
                label: 'Investigation Scope',
                options: ['Code Quality', 'Performance', 'Security', 'Architecture', 'User Experience', 'Business Logic', 'Data Flow']
            }
        ];
    }

    private getInvestigationMethodologyFields(projectType: ProjectType): RillanFormField[] {
        return [
            {
                id: 'investigationMethods',
                type: 'multiselect',
                label: 'Investigation Methods',
                options: ['Code Review', 'Performance Profiling', 'Security Audit', 'User Research', 'Data Analysis', 'System Monitoring', 'Stakeholder Interviews']
            },
            {
                id: 'deliverables',
                type: 'multiselect',
                label: 'Expected Deliverables',
                options: ['Investigation Report', 'Recommendations Document', 'Action Plan', 'Risk Assessment', 'Performance Metrics', 'Code Analysis']
            }
        ];
    }

    private getRefactoringFields(projectType: ProjectType): RillanFormField[] {
        return [
            {
                id: 'refactoringGoals',
                type: 'textarea',
                label: 'Refactoring Goals',
                required: true,
                description: 'What do you want to improve or change?'
            },
            {
                id: 'currentIssues',
                type: 'textarea',
                label: 'Current Issues',
                description: 'What problems exist in the current implementation?'
            },
            {
                id: 'refactoringScope',
                type: 'multiselect',
                label: 'Refactoring Scope',
                options: ['Code Structure', 'Performance', 'Maintainability', 'Scalability', 'Security', 'User Experience', 'Architecture']
            }
        ];
    }

    private getRefactoringStrategyFields(projectType: ProjectType): RillanFormField[] {
        return [
            {
                id: 'refactoringApproach',
                type: 'select',
                label: 'Refactoring Approach',
                options: ['Big Bang (Complete Rewrite)', 'Incremental (Step by Step)', 'Strangler Fig Pattern', 'Branch by Abstraction', 'Parallel Run']
            },
            {
                id: 'riskMitigation',
                type: 'multiselect',
                label: 'Risk Mitigation Strategies',
                options: ['Comprehensive Testing', 'Feature Flags', 'Rollback Plan', 'Monitoring & Alerts', 'Gradual Rollout', 'A/B Testing']
            },
            {
                id: 'successMetrics',
                type: 'textarea',
                label: 'Success Metrics',
                description: 'How will you measure the success of the refactoring?'
            }
        ];
    }
}