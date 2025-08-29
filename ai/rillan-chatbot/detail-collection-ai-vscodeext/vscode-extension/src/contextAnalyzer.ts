export interface DetailOption {
    id: string;
    label: string;
    description: string;
    type: 'dropdown' | 'text' | 'number' | 'checkbox' | 'radio';
    options?: string[];
    placeholder?: string;
    required?: boolean;
    defaultValue?: any;
}

export interface DetailCategory {
    id: string;
    title: string;
    description: string;
    options: DetailOption[];
}

export interface RequestContext {
    type: 'code' | 'image' | 'text' | 'video' | 'web' | 'app' | 'other';
    complexity: 'simple' | 'medium' | 'complex';
    categories: DetailCategory[];
    suggestedApproach?: string;
}

export class ContextAnalyzer {
    
    analyzeRequest(userRequest: string): RequestContext {
        const request = userRequest.toLowerCase();
        
        // Determine request type - check more specific types first
        let type: RequestContext['type'] = 'other';
        if (this.containsAppKeywords(request)) {type = 'app';}
        else if (this.containsWebKeywords(request)) {type = 'web';}
        else if (this.containsImageKeywords(request)) {type = 'image';}
        else if (this.containsVideoKeywords(request)) {type = 'video';}
        else if (this.containsTextKeywords(request)) {type = 'text';}
        else if (this.containsCodeKeywords(request)) {type = 'code';}
        
        // Determine complexity
        const complexity = this.assessComplexity(request);
        
        // Generate relevant detail categories
        const categories = this.generateDetailCategories(type);
        
        return {
            type,
            complexity,
            categories,
            suggestedApproach: this.generateSuggestedApproach(type, complexity)
        };
    }
    
    private containsCodeKeywords(request: string): boolean {
        const codeKeywords = [
            'build', 'create', 'make', 'write', 'program', 'function', 'class', 
            'api', 'backend', 'frontend', 'database', 'sort', 'algorithm'
        ];
        return codeKeywords.some(keyword => request.includes(keyword));
    }
    
    private containsImageKeywords(request: string): boolean {
        const imageKeywords = [
            'image', 'picture', 'photo', 'drawing', 'illustration', 'card',
            'joker', 'playing card', 'portrait', 'landscape', 'scene', 'logo',
            'icon', 'graphic', 'design', 'artwork'
        ];
        return imageKeywords.some(keyword => request.includes(keyword));
    }
    
    private containsTextKeywords(request: string): boolean {
        const textKeywords = [
            'write', 'story', 'article', 'blog', 'blog post', 'content', 'description',
            'narrative', 'poem', 'script', 'document', 'post'
        ];
        return textKeywords.some(keyword => request.includes(keyword));
    }
    
    private containsVideoKeywords(request: string): boolean {
        const videoKeywords = [
            'video', 'animation', 'movie', 'clip', 'sequence', 'scene',
            'chase', 'action', 'movement'
        ];
        return videoKeywords.some(keyword => request.includes(keyword));
    }
    
    private containsWebKeywords(request: string): boolean {
        const webKeywords = [
            'website', 'web app', 'webpage', 'frontend', 'ui', 'interface',
            'form', 'button', 'layout', 'responsive'
        ];
        return webKeywords.some(keyword => request.includes(keyword));
    }
    
    private containsAppKeywords(request: string): boolean {
        const appKeywords = [
            'mobile app', 'desktop app', 'ios', 'android', 'windows', 'mac',
            'native app', 'cross-platform', 'app', 'application', 'calculator app',
            'web app', 'website'
        ];
        return appKeywords.some(keyword => request.includes(keyword));
    }
    
    private assessComplexity(request: string): RequestContext['complexity'] {
        const simpleIndicators = ['simple', 'basic', 'quick', 'minimal'];
        const complexIndicators = ['complex', 'advanced', 'enterprise', 'scalable', 'robust'];
        
        if (complexIndicators.some(indicator => request.includes(indicator))) {
            return 'complex';
        } else if (simpleIndicators.some(indicator => request.includes(indicator))) {
            return 'simple';
        }
        return 'medium';
    }
    
    private generateDetailCategories(type: RequestContext['type']): DetailCategory[] {
        switch (type) {
            case 'code':
                return this.generateCodeCategories();
            case 'image':
                return this.generateImageCategories();
            case 'text':
                return this.generateTextCategories();
            case 'video':
                return this.generateVideoCategories();
            case 'web':
                return this.generateWebCategories();
            case 'app':
                return this.generateAppCategories();
            default:
                return this.generateGeneralCategories();
        }
    }
    
    private generateCodeCategories(): DetailCategory[] {
        const categories: DetailCategory[] = [];
        
        // Programming Language & Framework
        categories.push({
            id: 'language',
            title: 'Programming Language & Framework',
            description: 'Choose the technology stack for your project',
            options: [
                {
                    id: 'language',
                    label: 'Programming Language',
                    description: 'Primary language for the project',
                    type: 'dropdown',
                    options: ['Python', 'JavaScript', 'TypeScript', 'Java', 'C++', 'C#', 'Go', 'Rust', 'Other'],
                    required: true
                },
                {
                    id: 'framework',
                    label: 'Framework (if applicable)',
                    description: 'Framework or library to use',
                    type: 'dropdown',
                    options: ['None', 'React', 'Vue', 'Angular', 'Express', 'Django', 'Flask', 'Spring', 'Other'],
                    required: false
                }
            ]
        });
        
        // Project Scope
        categories.push({
            id: 'scope',
            title: 'Project Scope & Features',
            description: 'Define what your project will include',
            options: [
                {
                    id: 'projectType',
                    label: 'Project Type',
                    description: 'What kind of project are you building?',
                    type: 'dropdown',
                    options: ['Web Application', 'Mobile App', 'Desktop App', 'API/Backend', 'Library/Module', 'Script/Tool', 'Other'],
                    required: true
                },
                {
                    id: 'features',
                    label: 'Key Features',
                    description: 'What should your project do?',
                    type: 'text',
                    placeholder: 'e.g., user authentication, data processing, file handling...',
                    required: true
                }
            ]
        });
        
        // Technical Details
        categories.push({
            id: 'technical',
            title: 'Technical Specifications',
            description: 'Define technical requirements and constraints',
            options: [
                {
                    id: 'database',
                    label: 'Database Requirements',
                    description: 'Do you need data storage?',
                    type: 'dropdown',
                    options: ['No database needed', 'SQLite (simple)', 'PostgreSQL/MySQL', 'MongoDB', 'Other'],
                    required: false
                },
                {
                    id: 'deployment',
                    label: 'Deployment Target',
                    description: 'Where will this run?',
                    type: 'dropdown',
                    options: ['Local development', 'Web server', 'Cloud platform', 'Mobile device', 'Desktop', 'Other'],
                    required: false
                }
            ]
        });
        
        return categories;
    }
    
    private generateImageCategories(): DetailCategory[] {
        const categories: DetailCategory[] = [];
        
        // Visual Style
        categories.push({
            id: 'style',
            title: 'Visual Style & Aesthetics',
            description: 'Define the look and feel of your image',
            options: [
                {
                    id: 'artStyle',
                    label: 'Art Style',
                    description: 'How should the image look?',
                    type: 'dropdown',
                    options: ['Photorealistic', 'Cartoon/Anime', 'Painting', 'Sketch/Drawing', 'Abstract', 'Vintage', 'Modern', 'Other'],
                    required: true
                },
                {
                    id: 'colorScheme',
                    label: 'Color Scheme',
                    description: 'What colors should dominate?',
                    type: 'text',
                    placeholder: 'e.g., warm earth tones, cool blues, vibrant colors...',
                    required: false
                }
            ]
        });
        
        // Content & Composition
        categories.push({
            id: 'content',
            title: 'Content & Composition',
            description: 'What should be in the image and how should it be arranged?',
            options: [
                {
                    id: 'subject',
                    label: 'Main Subject',
                    description: 'What is the primary focus?',
                    type: 'text',
                    placeholder: 'e.g., a joker character, a landscape, an object...',
                    required: true
                },
                {
                    id: 'pose',
                    label: 'Pose/Action',
                    description: 'What is the subject doing?',
                    type: 'dropdown',
                    options: ['Standing', 'Sitting', 'Walking', 'Running', 'Dancing', 'Laughing', 'Serious', 'Other'],
                    required: false
                },
                {
                    id: 'perspective',
                    label: 'Camera Angle/Perspective',
                    description: 'How should the image be framed?',
                    type: 'dropdown',
                    options: ['Front view', 'Side view', 'Three-quarter view', 'Bird\'s eye', 'Worm\'s eye', 'Other'],
                    required: false
                }
            ]
        });
        
        // Context & Setting
        categories.push({
            id: 'context',
            title: 'Context & Setting',
            description: 'Where and when does this take place?',
            options: [
                {
                    id: 'setting',
                    label: 'Setting/Background',
                    description: 'What\'s in the background?',
                    type: 'text',
                    placeholder: 'e.g., playing card frame, tabletop, floating in space...',
                    required: false
                },
                {
                    id: 'lighting',
                    label: 'Lighting',
                    description: 'How is the scene lit?',
                    type: 'dropdown',
                    options: ['Natural daylight', 'Warm indoor lighting', 'Dramatic shadows', 'Bright and even', 'Moody/low-key', 'Other'],
                    required: false
                }
            ]
        });
        
        return categories;
    }
    
    private generateTextCategories(): DetailCategory[] {
        const categories: DetailCategory[] = [];
        
        // Content Type
        categories.push({
            id: 'content',
            title: 'Content Type & Style',
            description: 'Define what kind of text you want',
            options: [
                {
                    id: 'genre',
                    label: 'Genre',
                    description: 'What type of content?',
                    type: 'dropdown',
                    options: ['Story/Fiction', 'Article/Blog', 'Technical Documentation', 'Poetry', 'Script/Dialogue', 'Description', 'Other'],
                    required: true
                },
                {
                    id: 'tone',
                    label: 'Tone',
                    description: 'How should it sound?',
                    type: 'dropdown',
                    options: ['Formal', 'Casual', 'Humorous', 'Serious', 'Inspirational', 'Educational', 'Other'],
                    required: false
                }
            ]
        });
        
        // Structure & Length
        categories.push({
            id: 'structure',
            title: 'Structure & Length',
            description: 'Define the format and size',
            options: [
                {
                    id: 'length',
                    label: 'Length',
                    description: 'How long should it be?',
                    type: 'dropdown',
                    options: ['Very short (50-100 words)', 'Short (100-300 words)', 'Medium (300-800 words)', 'Long (800+ words)', 'Other'],
                    required: true
                },
                {
                    id: 'format',
                    label: 'Format',
                    description: 'How should it be structured?',
                    type: 'dropdown',
                    options: ['Paragraphs', 'Bullet points', 'Numbered list', 'Dialogue format', 'Free form', 'Other'],
                    required: false
                }
            ]
        });
        
        return categories;
    }
    
    private generateVideoCategories(): DetailCategory[] {
        const categories: DetailCategory[] = [];
        
        // Video Style
        categories.push({
            id: 'style',
            title: 'Video Style & Quality',
            description: 'Define the visual approach',
            options: [
                {
                    id: 'videoStyle',
                    label: 'Video Style',
                    description: 'How should the video look?',
                    type: 'dropdown',
                    options: ['Realistic', 'Animated', 'Cinematic', 'Documentary', 'Abstract', 'Other'],
                    required: true
                },
                {
                    id: 'duration',
                    label: 'Duration',
                    description: 'How long should the video be?',
                    type: 'dropdown',
                    options: ['Short (15-30 seconds)', 'Medium (30 seconds - 2 minutes)', 'Long (2-5 minutes)', 'Extended (5+ minutes)', 'Other'],
                    required: true
                }
            ]
        });
        
        // Content & Action
        categories.push({
            id: 'content',
            title: 'Content & Action',
            description: 'What should happen in the video?',
            options: [
                {
                    id: 'action',
                    label: 'Main Action',
                    description: 'What is the primary activity?',
                    type: 'text',
                    placeholder: 'e.g., car chase, character walking, object transformation...',
                    required: true
                },
                {
                    id: 'camera',
                    label: 'Camera Movement',
                    description: 'How should the camera move?',
                    type: 'dropdown',
                    options: ['Static', 'Panning', 'Zooming', 'Following action', 'Dynamic movement', 'Other'],
                    required: false
                }
            ]
        });
        
        return categories;
    }
    
    private generateWebCategories(): DetailCategory[] {
        const categories: DetailCategory[] = [];
        
        // Technology Stack
        categories.push({
            id: 'technology',
            title: 'Technology Stack',
            description: 'Choose your web development tools',
            options: [
                {
                    id: 'frontend',
                    label: 'Frontend Framework',
                    description: 'What frontend technology?',
                    type: 'dropdown',
                    options: ['HTML/CSS/JS', 'React', 'Vue', 'Angular', 'Svelte', 'Other'],
                    required: true
                },
                {
                    id: 'backend',
                    label: 'Backend (if needed)',
                    description: 'Do you need a backend?',
                    type: 'dropdown',
                    options: ['No backend needed', 'Node.js/Express', 'Python/Django', 'Python/Flask', 'PHP/Laravel', 'Other'],
                    required: false
                }
            ]
        });
        
        // Features & Functionality
        categories.push({
            id: 'features',
            title: 'Features & Functionality',
            description: 'What should your website do?',
            options: [
                {
                    id: 'purpose',
                    label: 'Website Purpose',
                    description: 'What is the main goal?',
                    type: 'dropdown',
                    options: ['Portfolio/Showcase', 'Business/Company', 'E-commerce', 'Blog/Content', 'Web Application', 'Landing Page', 'Other'],
                    required: true
                },
                {
                    id: 'interactive',
                    label: 'Interactive Elements',
                    description: 'What interactive features?',
                    type: 'text',
                    placeholder: 'e.g., contact forms, user accounts, search functionality...',
                    required: false
                }
            ]
        });
        
        return categories;
    }
    
    private generateAppCategories(): DetailCategory[] {
        const categories: DetailCategory[] = [];
        
        // Platform & Type
        categories.push({
            id: 'platform',
            title: 'Platform & Type',
            description: 'Define your app\'s target platform',
            options: [
                {
                    id: 'platform',
                    label: 'Target Platform',
                    description: 'Where will your app run?',
                    type: 'dropdown',
                    options: ['iOS', 'Android', 'Windows', 'macOS', 'Linux', 'Cross-platform', 'Web-based', 'Other'],
                    required: true
                },
                {
                    id: 'appType',
                    label: 'App Type',
                    description: 'What kind of app?',
                    type: 'dropdown',
                    options: ['Utility/Tool', 'Game', 'Social/Communication', 'Productivity', 'Entertainment', 'Business', 'Other'],
                    required: true
                }
            ]
        });
        
        // Core Functionality
        categories.push({
            id: 'functionality',
            title: 'Core Functionality',
            description: 'What should your app do?',
            options: [
                {
                    id: 'mainFeature',
                    label: 'Main Feature',
                    description: 'What is the primary function?',
                    type: 'text',
                    placeholder: 'e.g., task management, photo editing, social networking...',
                    required: true
                },
                {
                    id: 'complexity',
                    label: 'Feature Complexity',
                    description: 'How sophisticated should it be?',
                    type: 'dropdown',
                    options: ['Simple (1-2 main features)', 'Moderate (3-5 features)', 'Complex (5+ features)', 'Enterprise-level', 'Other'],
                    required: false
                }
            ]
        });
        
        return categories;
    }
    
    private generateGeneralCategories(): DetailCategory[] {
        return [{
            id: 'general',
            title: 'Project Details',
            description: 'Help me understand what you need',
            options: [
                {
                    id: 'description',
                    label: 'Detailed Description',
                    description: 'Tell me more about what you want',
                    type: 'text',
                    placeholder: 'Provide more context about your request...',
                    required: true
                },
                {
                    id: 'constraints',
                    label: 'Constraints or Requirements',
                    description: 'Any specific limitations or must-haves?',
                    type: 'text',
                    placeholder: 'e.g., must work on mobile, needs to be fast, budget considerations...',
                    required: false
                }
            ]
        }];
    }
    
    private generateSuggestedApproach(type: RequestContext['type'], complexity: RequestContext['complexity']): string {
        const approaches = {
            code: {
                simple: 'I\'ll create a straightforward implementation focusing on core functionality.',
                medium: 'I\'ll build a well-structured solution with proper error handling and documentation.',
                complex: 'I\'ll design a robust, scalable architecture with comprehensive features and testing.'
            },
            image: {
                simple: 'I\'ll generate a clear, focused image matching your specifications.',
                medium: 'I\'ll create a detailed image with good composition and visual appeal.',
                complex: 'I\'ll produce a sophisticated image with multiple elements and artistic depth.'
            },
            text: {
                simple: 'I\'ll write concise, clear content that gets your point across.',
                medium: 'I\'ll create engaging content with good structure and flow.',
                complex: 'I\'ll develop comprehensive content with depth, examples, and thorough coverage.'
            },
            video: {
                simple: 'I\'ll create a short, focused video sequence.',
                medium: 'I\'ll produce a well-paced video with good visual flow.',
                complex: 'I\'ll create a cinematic video with multiple scenes and dynamic elements.'
            },
            web: {
                simple: 'I\'ll build a clean, functional website with essential features.',
                medium: 'I\'ll create a responsive website with good UX and modern design.',
                complex: 'I\'ll develop a full-featured web application with advanced functionality.'
            },
            app: {
                simple: 'I\'ll create a focused app with core functionality.',
                medium: 'I\'ll build a well-designed app with good UX and essential features.',
                complex: 'I\'ll develop a comprehensive app with advanced features and polished design.'
            },
            other: {
                simple: 'I\'ll provide a straightforward solution for your request.',
                medium: 'I\'ll create a well-thought-out solution with good detail.',
                complex: 'I\'ll develop a comprehensive solution with thorough consideration of all aspects.'
            }
        };
        
        return approaches[type]?.[complexity] || 'I\'ll help you with your request based on the details you provide.';
    }
}
