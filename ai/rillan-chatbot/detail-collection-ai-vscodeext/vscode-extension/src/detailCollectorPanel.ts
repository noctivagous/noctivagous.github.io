import * as vscode from 'vscode';
import { ContextAnalyzer, RequestContext } from './contextAnalyzer';
import { SlideshowFormController, SlideshowConfig } from './slideshowFormController';
import { AIIntegrationBridge, AIFormResponse } from './aiIntegrationBridge';

export interface RillanFormField {
    id: string;
    type: 'text' | 'textarea' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'number' | 'slider' | 'file';
    label: string;
    description?: string;
    required?: boolean;
    defaultValue?: any;
    options?: string[] | { value: string; label: string }[];
    placeholder?: string;
    min?: number;
    max?: number;
    step?: number;
}

export interface RillanFormSection {
    id: string;
    title: string;
    description?: string;
    fields: RillanFormField[];
    collapsible?: boolean;
    defaultExpanded?: boolean;
}

export interface RillanForm {
    id: string;
    title: string;
    description?: string;
    stage: 'preliminary' | 'planning' | 'execution' | 'review';
    sections: RillanFormSection[];
    submitLabel?: string;
    cancelLabel?: string;
    allowSkip?: boolean;
    skipLabel?: string;
    slideshow?: {
        enabled: boolean;
        sectionsPerSlide?: number;
        navigationStyle?: 'arrows' | 'dots' | 'both';
        autoAdvance?: boolean;
        progressIndicator?: boolean;
    };
    formStyle?: 'slideshow' | 'single_page' | 'auto';
}

export class DetailCollectorPanel {
    public static currentPanel: DetailCollectorPanel | undefined;
    public static readonly viewType = 'rillanDetailCollector';
    
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private _contextAnalyzer: ContextAnalyzer;
    private _currentContext: RequestContext | null = null;
    private _userRequest: string = '';
    private _currentForm: RillanForm | null = null;
    private _formHistory: RillanForm[] = [];
    private _collectedData: Record<string, any> = {};
    private _slideshowController: SlideshowFormController | null = null;
    
    public static createOrShow(extensionUri: vscode.Uri, userRequest?: string) {
        const column = vscode.window.activeTextEditor
            ? vscode.window.activeTextEditor.viewColumn
            : undefined;

        if (DetailCollectorPanel.currentPanel) {
            DetailCollectorPanel.currentPanel._panel.reveal(column);
            if (userRequest) {
                DetailCollectorPanel.currentPanel._updateContext(userRequest);
            }
            return DetailCollectorPanel.currentPanel;
        }

        const panel = vscode.window.createWebviewPanel(
            DetailCollectorPanel.viewType,
            'Rillan AI Form Interface',
            column || vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [extensionUri]
            }
        );

        DetailCollectorPanel.currentPanel = new DetailCollectorPanel(panel, extensionUri, userRequest);
        return DetailCollectorPanel.currentPanel;
    }

    // Method for AI to dynamically create and show forms
    public static showAIGeneratedForm(extensionUri: vscode.Uri, form: RillanForm) {
        const panel = DetailCollectorPanel.createOrShow(extensionUri);
        panel.displayForm(form);
        return panel;
    }

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri, userRequest?: string) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._contextAnalyzer = new ContextAnalyzer();

        if (userRequest) {
            this._updateContext(userRequest);
        }

        this._setWebviewMessageListener(panel.webview);
        this._updateWebviewContent();

        panel.onDidDispose(() => this.dispose(), null, this._disposables);
    }

    private _updateContext(userRequest: string) {
        this._userRequest = userRequest;
        this._currentContext = this._contextAnalyzer.analyzeRequest(userRequest);
    }

    public displayForm(form: RillanForm) {
        this._currentForm = form;
        this._formHistory.push(form);
        
        // Initialize slideshow controller based on form preferences
        const shouldUseSlideshow = this._shouldUseSlideshow(form);
        if (shouldUseSlideshow) {
            this._slideshowController = new SlideshowFormController(form, form.slideshow);
        } else {
            this._slideshowController = null;
        }
        
        this._updateWebviewContent();
        this._panel.reveal();
    }

    public updateFormField(fieldId: string, value: any) {
        if (this._currentForm) {
            // Update the form field value
            this._updateWebviewContent();
        }
    }

    public getCollectedData(): Record<string, any> {
        return { ...this._collectedData };
    }

    private _shouldUseSlideshow(form: RillanForm): boolean {
        // If explicitly set to single_page, don't use slideshow
        if (form.formStyle === 'single_page') {
            return false;
        }
        
        // If explicitly set to slideshow, use it (if enabled and multiple sections)
        if (form.formStyle === 'slideshow') {
            return form.slideshow?.enabled === true && form.sections.length > 1;
        }
        
        // Auto mode: use slideshow if enabled and multiple sections
        return form.slideshow?.enabled === true && form.sections.length > 1;
    }

    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage(
            (message) => {
                switch (message.command) {
                    case 'submitForm':
                        this._handleFormSubmit(message.data);
                        return;
                    case 'skipForm':
                        this._handleFormSkip();
                        return;
                    case 'goBack':
                        this._handleGoBack();
                        return;
                    case 'fieldChanged':
                        this._handleFieldChange(message.fieldId, message.value);
                        return;
                    case 'addCustomOption':
                        this._handleAddCustomOption(message.fieldId, message.optionValue);
                        return;
                    case 'removeOption':
                        this._handleRemoveOption(message.fieldId, message.optionValue);
                        return;
                    case 'cancel':
                        this.dispose();
                        return;
                    case 'requestAIHelp':
                        this._handleAIHelpRequest(message.context);
                        return;
                    case 'navigateToSlide':
                        this._handleSlideNavigation(message.slideIndex);
                        return;
                    case 'nextSlide':
                        this._handleNextSlide();
                        return;
                    case 'previousSlide':
                        this._handlePreviousSlide();
                        return;
                    case 'toggleFormStyle':
                        this._handleToggleFormStyle();
                        return;
                }
            },
            undefined,
            this._disposables
        );
    }

    private _handleFormSubmit(formData: Record<string, any>) {
        // Collect data from slideshow if active
        let allFormData = formData;
        if (this._slideshowController) {
            const slideshowData = this._slideshowController.exportSlideshowData();
            allFormData = { ...slideshowData, ...formData };
        }
        
        // Store the collected data
        Object.assign(this._collectedData, allFormData);
        
        // Include user modifications in the submission
        const submissionData = {
            ...allFormData,
            _userModifications: this._collectedData._userModifications || []
        };
        
        // Notify AI that form was submitted
        this._notifyAIFormSubmitted(submissionData);
        
        // Save to file
        this._saveFormDataToFile(submissionData);
        
        // Show success message with modification count
        const modCount = this._collectedData._userModifications?.length || 0;
        const message = modCount > 0 
            ? `${this._currentForm?.title || 'Form'} submitted successfully! (${modCount} user modifications included)`
            : `${this._currentForm?.title || 'Form'} submitted successfully!`;
        
        vscode.window.showInformationMessage(message);
    }

    private _handleFormSkip() {
        vscode.window.showInformationMessage('Form skipped');
        this._notifyAIFormSkipped();
    }

    private _handleGoBack() {
        if (this._formHistory.length > 1) {
            this._formHistory.pop(); // Remove current form
            const previousForm = this._formHistory[this._formHistory.length - 1];
            this._currentForm = previousForm;
            this._updateWebviewContent();
        }
    }

    private _handleFieldChange(fieldId: string, value: any) {
        // Real-time field updates for dynamic forms
        this._collectedData[fieldId] = value;
        
        // Update slideshow controller if active
        if (this._slideshowController) {
            const currentSlide = this._slideshowController.getSlideState().currentSlide;
            this._slideshowController.updateSlideData(currentSlide, fieldId, value);
        }
    }

    private _handleSlideNavigation(slideIndex: number) {
        if (this._slideshowController && this._slideshowController.navigateToSlide(slideIndex)) {
            this._updateWebviewContent();
        }
    }

    private _handleNextSlide() {
        if (this._slideshowController && this._slideshowController.nextSlide()) {
            this._updateWebviewContent();
        }
    }

    private _handlePreviousSlide() {
        if (this._slideshowController && this._slideshowController.previousSlide()) {
            this._updateWebviewContent();
        }
    }

    private _handleToggleFormStyle() {
        if (!this._currentForm || this._currentForm.sections.length <= 1) {
            return;
        }

        // Toggle between slideshow and single page
        const currentlySlideshow = this._slideshowController !== null;
        
        if (currentlySlideshow && this._slideshowController) {
            // Switch to single page - collect current slideshow data first
            const slideshowData = this._slideshowController.exportSlideshowData();
            Object.assign(this._collectedData, slideshowData);
            this._slideshowController = null;
            this._currentForm.formStyle = 'single_page';
        } else {
            // Switch to slideshow
            this._currentForm.formStyle = 'slideshow';
            if (!this._currentForm.slideshow) {
                this._currentForm.slideshow = {
                    enabled: true,
                    sectionsPerSlide: 1,
                    navigationStyle: 'both',
                    progressIndicator: true
                };
            }
            this._slideshowController = new SlideshowFormController(this._currentForm, this._currentForm.slideshow);
            
            // Restore data to slideshow controller
            for (const [key, value] of Object.entries(this._collectedData)) {
                if (key !== '_userModifications') {
                    this._slideshowController.updateSlideData(0, key, value);
                }
            }
        }
        
        this._updateWebviewContent();
    }

    private _handleAddCustomOption(fieldId: string, optionValue: string) {
        if (!this._currentForm || !optionValue.trim()) {
            return;
        }

        // Find the field and add the custom option
        for (const section of this._currentForm.sections) {
            const field = section.fields.find(f => f.id === fieldId);
            if (field && (field.type === 'select' || field.type === 'multiselect' || field.type === 'radio')) {
                if (!field.options) {
                    field.options = [];
                }
                
                // Convert to object format if needed and add the new option
                const options = field.options.map(opt => 
                    typeof opt === 'string' ? { value: opt, label: opt } : opt
                );
                
                // Check if option already exists
                const exists = options.some(opt => opt.value === optionValue || opt.label === optionValue);
                if (!exists) {
                    options.push({ 
                        value: optionValue, 
                        label: optionValue,
                        userAdded: true 
                    } as any);
                    field.options = options;
                    
                    // Track the modification
                    if (!this._collectedData._userModifications) {
                        this._collectedData._userModifications = [];
                    }
                    this._collectedData._userModifications.push({
                        type: 'add_option',
                        fieldId: fieldId,
                        newValue: optionValue,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Refresh the form
                    this._updateWebviewContent();
                }
                break;
            }
        }
    }

    private _handleRemoveOption(fieldId: string, optionValue: string) {
        if (!this._currentForm) {
            return;
        }

        // Find the field and remove the option (only if user-added)
        for (const section of this._currentForm.sections) {
            const field = section.fields.find(f => f.id === fieldId);
            if (field && field.options) {
                const options = field.options.map(opt => 
                    typeof opt === 'string' ? { value: opt, label: opt } : opt
                );
                
                const optionIndex = options.findIndex(opt => 
                    (opt.value === optionValue || opt.label === optionValue) && 
                    (opt as any).userAdded
                );
                
                if (optionIndex !== -1) {
                    options.splice(optionIndex, 1);
                    field.options = options;
                    
                    // Track the modification
                    if (!this._collectedData._userModifications) {
                        this._collectedData._userModifications = [];
                    }
                    this._collectedData._userModifications.push({
                        type: 'remove_option',
                        fieldId: fieldId,
                        oldValue: optionValue,
                        timestamp: new Date().toISOString()
                    });
                    
                    // Refresh the form
                    this._updateWebviewContent();
                }
                break;
            }
        }
    }

    private _handleAIHelpRequest(context: any) {
        // Send message back to AI chat that user needs help
        vscode.window.showInformationMessage('AI help requested - check chat for assistance');
        // This would trigger AI to provide guidance in the chat
    }

    private _notifyAIFormSubmitted(formData: Record<string, any>) {
        // Send data back to AI through the integration bridge
        try {
            const bridge = AIIntegrationBridge.getInstance();
            if (bridge && this._currentForm) {
                const response: AIFormResponse = {
                    formId: this._currentForm.id,
                    success: true,
                    data: formData,
                    userModifications: this._collectedData._userModifications || [],
                    nextAction: 'continue'
                };
                
                bridge.processFormResponse(response).catch(error => {
                    console.error('Error processing form response:', error);
                });
            }
        } catch (error) {
            console.error('Error notifying AI of form submission:', error);
        }
        
        console.log('Form submitted:', formData);
    }

    private _notifyAIFormSkipped() {
        // Notify AI that user skipped the form
        try {
            const bridge = AIIntegrationBridge.getInstance();
            if (bridge && this._currentForm) {
                const response: AIFormResponse = {
                    formId: this._currentForm.id,
                    success: false,
                    data: {},
                    nextAction: 'complete'
                };
                
                bridge.processFormResponse(response).catch(error => {
                    console.error('Error processing form skip:', error);
                });
            }
        } catch (error) {
            console.error('Error notifying AI of form skip:', error);
        }
        
        console.log('Form skipped');
    }

    private async _saveFormDataToFile(formData: Record<string, any>) {
        try {
            const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
            if (!workspaceFolder) {
                throw new Error('No workspace folder found');
            }

            const fileName = `rillan-form-${this._currentForm?.stage || 'data'}-${Date.now()}.json`;
            const filePath = vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai', fileName);

            // Ensure directory exists
            await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(workspaceFolder.uri, '.rillan-ai'));

            const content = JSON.stringify({
                timestamp: new Date().toISOString(),
                formId: this._currentForm?.id,
                stage: this._currentForm?.stage,
                userRequest: this._userRequest,
                formData: formData,
                userModifications: this._collectedData._userModifications || [],
                allCollectedData: this._collectedData
            }, null, 2);

            await vscode.workspace.fs.writeFile(filePath, Buffer.from(content, 'utf8'));
            console.log(`Form data saved to ${fileName}`);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to save form data: ${error}`);
        }
    }

    private _updateWebviewContent() {
        if (!this._currentForm) {
            this._panel.webview.html = this._getWelcomeHtml();
            return;
        }

        this._panel.webview.html = this._getFormHtml(this._currentForm);
    }

    private _getWelcomeHtml(): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Rillan AI Form Interface</title>
            <style>${this._getFormStyles()}</style>
        </head>
        <body>
            <div class="container">
                <h1>🤖 Rillan AI Form Interface</h1>
                <p>Waiting for AI to generate a form...</p>
                <div class="info-box">
                    <p>This interface allows AI to dynamically create forms for collecting detailed project specifications.</p>
                    <p>The AI will analyze your requests and present appropriate forms to gather the information needed.</p>
                </div>
            </div>
        </body>
        </html>`;
    }

    private _getFormHtml(form: RillanForm): string {
        // Check if slideshow is enabled and we have a controller
        const isSlideshow = this._slideshowController !== null;
        
        let sectionsHtml = '';
        let slideshowControls = '';
        let progressIndicator = '';
        
        if (isSlideshow && this._slideshowController) {
            // Render current slide sections only
            const currentSections = this._slideshowController.getCurrentSlideSections();
            sectionsHtml = currentSections.map(section => this._getSectionHtml(section)).join('');
            
            // Add slideshow navigation controls
            slideshowControls = this._getSlideshowControlsHtml();
            
            // Add progress indicator
            if (this._slideshowController.getConfig().progressIndicator) {
                progressIndicator = this._getProgressIndicatorHtml();
            }
        } else {
            // Traditional single-page form
            sectionsHtml = form.sections.map(section => this._getSectionHtml(section)).join('');
        }
        
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${form.title}</title>
            <style>${this._getFormStyles()}</style>
        </head>
        <body>
            <div class="container">
                <div class="form-header">
                    <h1>${form.title}</h1>
                    ${form.description ? `<p class="form-description">${form.description}</p>` : ''}
                    <div class="header-indicators">
                        <div class="stage-indicator stage-${form.stage}">${form.stage.toUpperCase()}</div>
                        ${isSlideshow ? '<div class="slideshow-indicator">📊 Slideshow Mode</div>' : '<div class="singlepage-indicator">📄 Single Page Mode</div>'}
                        ${form.sections.length > 1 ? `
                        <button type="button" class="style-toggle-btn" onclick="toggleFormStyle()" title="Switch form style">
                            ${isSlideshow ? '📄 Switch to Single Page' : '📊 Switch to Slideshow'}
                        </button>` : ''}
                        <div class="modifications-indicator" id="modificationsIndicator" style="display: none;">
                            <span class="mod-count">0</span> modifications
                        </div>
                    </div>
                </div>
                
                ${progressIndicator}
                
                <form id="rillanForm">
                    ${sectionsHtml}
                    
                    ${slideshowControls}
                    
                    <div class="form-actions">
                        ${this._formHistory.length > 1 ? '<button type="button" id="goBackBtn" class="btn btn-secondary">← Go Back</button>' : ''}
                        ${form.allowSkip ? `<button type="button" id="skipBtn" class="btn btn-secondary">${form.skipLabel || 'Skip'}</button>` : ''}
                        <button type="button" id="aiHelpBtn" class="btn btn-help">🤖 Ask AI for Help</button>
                        <button type="submit" class="btn btn-primary">${form.submitLabel || 'Submit'}</button>
                    </div>
                </form>
            </div>
            
            <script>
                ${this._getFormScript()}
                
                // Update modifications indicator
                const modCount = ${this._collectedData._userModifications?.length || 0};
                const indicator = document.getElementById('modificationsIndicator');
                if (modCount > 0 && indicator) {
                    indicator.style.display = 'inline-block';
                    indicator.querySelector('.mod-count').textContent = modCount;
                }
            </script>
        </body>
        </html>`;
    }

    private _getSectionHtml(section: RillanFormSection): string {
        const fieldsHtml = section.fields.map(field => this._getFieldHtml(field)).join('');
        
        if (section.collapsible) {
            return `
            <div class="form-section collapsible ${section.defaultExpanded !== false ? 'expanded' : ''}">
                <div class="section-header" onclick="toggleSection('${section.id}')">
                    <h3>${section.title}</h3>
                    <span class="toggle-icon">▼</span>
                </div>
                <div class="section-content" id="${section.id}">
                    ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
                    ${fieldsHtml}
                </div>
            </div>`;
        }
        
        return `
        <div class="form-section">
            <h3>${section.title}</h3>
            ${section.description ? `<p class="section-description">${section.description}</p>` : ''}
            ${fieldsHtml}
        </div>`;
    }

    private _getFieldHtml(field: RillanFormField): string {
        const commonAttrs = `
            id="${field.id}" 
            name="${field.id}"
            ${field.required ? 'required' : ''}
            onchange="handleFieldChange('${field.id}', this.value)"
        `;

        let inputHtml = '';
        
        switch (field.type) {
            case 'text':
                inputHtml = `<input type="text" ${commonAttrs} placeholder="${field.placeholder || ''}" value="${field.defaultValue || ''}">`;
                break;
                
            case 'textarea':
                inputHtml = `<textarea ${commonAttrs} placeholder="${field.placeholder || ''}" rows="4">${field.defaultValue || ''}</textarea>`;
                break;
                
            case 'select':
                const selectOptions = field.options || [];
                if (selectOptions.length <= 5) {
                    // Use grid layout for 5 or fewer options
                    const gridOptions = selectOptions.map(opt => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const isUserAdded = typeof opt === 'object' && (opt as any).userAdded;
                        const selected = field.defaultValue === value ? 'checked' : '';
                        return `
                        <div class="grid-option ${selected ? 'selected' : ''}" data-value="${value}" ${isUserAdded ? 'data-user-added="true"' : ''}>
                            <input type="radio" name="${field.id}" value="${value}" ${selected} 
                                   onchange="handleFieldChange('${field.id}', this.value)" style="display: none;">
                            <span class="option-label">${label}</span>
                            ${isUserAdded ? `<button type="button" class="remove-option" onclick="removeOption('${field.id}', '${value}')" title="Remove option">×</button>` : ''}
                        </div>`;
                    }).join('');
                    inputHtml = `
                    <div class="options-grid">
                        ${gridOptions}
                        <div class="add-option-container">
                            <input type="text" class="add-option-input" placeholder="Add custom option..." 
                                   onkeypress="handleAddOption(event, '${field.id}')">
                            <button type="button" class="add-option-btn" onclick="addCustomOption('${field.id}')">+ Add</button>
                        </div>
                    </div>`;
                } else {
                    // Use dropdown for more than 5 options
                    const options = selectOptions.map(opt => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const selected = field.defaultValue === value ? 'selected' : '';
                        return `<option value="${value}" ${selected}>${label}</option>`;
                    }).join('');
                    inputHtml = `<select ${commonAttrs}>${options}</select>`;
                }
                break;
                
            case 'multiselect':
                const multiselectOptions = field.options || [];
                if (multiselectOptions.length <= 5) {
                    // Use grid layout for 5 or fewer options
                    const gridCheckboxes = multiselectOptions.map(opt => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const isUserAdded = typeof opt === 'object' && (opt as any).userAdded;
                        const checked = Array.isArray(field.defaultValue) && field.defaultValue.includes(value) ? 'checked' : '';
                        return `
                        <div class="grid-option ${checked ? 'selected' : ''}" data-value="${value}" ${isUserAdded ? 'data-user-added="true"' : ''}>
                            <input type="checkbox" name="${field.id}" value="${value}" ${checked} 
                                   onchange="handleMultiSelectChange('${field.id}'); toggleGridSelection(this)" style="display: none;">
                            <span class="option-label">${label}</span>
                            ${isUserAdded ? `<button type="button" class="remove-option" onclick="removeOption('${field.id}', '${value}')" title="Remove option">×</button>` : ''}
                        </div>`;
                    }).join('');
                    inputHtml = `
                    <div class="options-grid multiselect">
                        ${gridCheckboxes}
                        <div class="add-option-container">
                            <input type="text" class="add-option-input" placeholder="Add custom option..." 
                                   onkeypress="handleAddOption(event, '${field.id}')">
                            <button type="button" class="add-option-btn" onclick="addCustomOption('${field.id}')">+ Add</button>
                        </div>
                    </div>`;
                } else {
                    // Use checkbox list for more than 5 options
                    const checkboxes = multiselectOptions.map(opt => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const checked = Array.isArray(field.defaultValue) && field.defaultValue.includes(value) ? 'checked' : '';
                        return `
                        <label class="checkbox-label">
                            <input type="checkbox" name="${field.id}" value="${value}" ${checked} 
                                   onchange="handleMultiSelectChange('${field.id}')"> ${label}
                        </label>`;
                    }).join('');
                    inputHtml = `<div class="checkbox-group">${checkboxes}</div>`;
                }
                break;
                
            case 'radio':
                const radioOptions = field.options || [];
                if (radioOptions.length <= 5) {
                    // Use grid layout for 5 or fewer options
                    const gridRadios = radioOptions.map(opt => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const isUserAdded = typeof opt === 'object' && (opt as any).userAdded;
                        const checked = field.defaultValue === value ? 'checked' : '';
                        return `
                        <div class="grid-option ${checked ? 'selected' : ''}" data-value="${value}" ${isUserAdded ? 'data-user-added="true"' : ''}>
                            <input type="radio" name="${field.id}" value="${value}" ${checked} 
                                   onchange="handleFieldChange('${field.id}', this.value)" style="display: none;">
                            <span class="option-label">${label}</span>
                            ${isUserAdded ? `<button type="button" class="remove-option" onclick="removeOption('${field.id}', '${value}')" title="Remove option">×</button>` : ''}
                        </div>`;
                    }).join('');
                    inputHtml = `
                    <div class="options-grid">
                        ${gridRadios}
                        <div class="add-option-container">
                            <input type="text" class="add-option-input" placeholder="Add custom option..." 
                                   onkeypress="handleAddOption(event, '${field.id}')">
                            <button type="button" class="add-option-btn" onclick="addCustomOption('${field.id}')">+ Add</button>
                        </div>
                    </div>`;
                } else {
                    // Use radio list for more than 5 options
                    const radios = radioOptions.map(opt => {
                        const value = typeof opt === 'string' ? opt : opt.value;
                        const label = typeof opt === 'string' ? opt : opt.label;
                        const checked = field.defaultValue === value ? 'checked' : '';
                        return `
                        <label class="radio-label">
                            <input type="radio" name="${field.id}" value="${value}" ${checked}> ${label}
                        </label>`;
                    }).join('');
                    inputHtml = `<div class="radio-group">${radios}</div>`;
                }
                break;
                
            case 'checkbox':
                const isChecked = field.defaultValue ? 'checked' : '';
                inputHtml = `
                <label class="checkbox-label">
                    <input type="checkbox" ${commonAttrs} ${isChecked}> ${field.label}
                </label>`;
                break;
                
            case 'number':
                inputHtml = `<input type="number" ${commonAttrs} 
                    min="${field.min || ''}" max="${field.max || ''}" step="${field.step || ''}"
                    value="${field.defaultValue || ''}">`;
                break;
                
            case 'slider':
                inputHtml = `
                <input type="range" ${commonAttrs} 
                    min="${field.min || 0}" max="${field.max || 100}" step="${field.step || 1}"
                    value="${field.defaultValue || field.min || 0}">
                <span class="slider-value" id="${field.id}_value">${field.defaultValue || field.min || 0}</span>`;
                break;
                
            case 'file':
                inputHtml = `<input type="file" ${commonAttrs}>`;
                break;
        }

        return `
        <div class="form-field">
            <label for="${field.id}" class="field-label">
                ${field.label}
                ${field.required ? '<span class="required">*</span>' : ''}
            </label>
            ${field.description ? `<p class="field-description">${field.description}</p>` : ''}
            ${inputHtml}
        </div>`;
    }

    private _getSlideshowControlsHtml(): string {
        if (!this._slideshowController) {
            return '';
        }

        const slideState = this._slideshowController.getSlideState();
        const config = this._slideshowController.getConfig();
        const canPrevious = this._slideshowController.canNavigatePrevious();
        const canNext = this._slideshowController.canNavigateNext();
        const isLastSlide = this._slideshowController.isLastSlide();

        let navigationHtml = '';
        
        if (config.navigationStyle === 'arrows' || config.navigationStyle === 'both') {
            navigationHtml += `
            <div class="slideshow-navigation">
                <button type="button" class="nav-btn prev-btn" ${!canPrevious ? 'disabled' : ''} 
                        onclick="previousSlide()">← Previous</button>
                <span class="slide-counter">${slideState.currentSlide + 1} of ${slideState.totalSlides}</span>
                <button type="button" class="nav-btn next-btn" ${!canNext ? 'disabled' : ''} 
                        onclick="nextSlide()">${isLastSlide ? 'Review' : 'Next'} →</button>
            </div>`;
        }

        if (config.navigationStyle === 'dots' || config.navigationStyle === 'both') {
            const slideSummary = this._slideshowController.getSlideSummary();
            const dotsHtml = slideSummary.map(slide => `
                <button type="button" class="slide-dot ${slide.current ? 'current' : ''} ${slide.completed ? 'completed' : ''}"
                        onclick="navigateToSlide(${slide.index})" title="${slide.title}">
                    ${slide.index + 1}
                </button>
            `).join('');
            
            navigationHtml += `
            <div class="slideshow-dots">
                ${dotsHtml}
            </div>`;
        }

        return `<div class="slideshow-controls">${navigationHtml}</div>`;
    }

    private _getProgressIndicatorHtml(): string {
        if (!this._slideshowController) {
            return '';
        }

        const progress = this._slideshowController.getProgressPercentage();
        const slideState = this._slideshowController.getSlideState();
        
        return `
        <div class="progress-container">
            <div class="progress-bar">
                <div class="progress-fill" style="width: ${progress}%"></div>
            </div>
            <div class="progress-text">${progress}% Complete (${slideState.completedSlides.size + 1}/${slideState.totalSlides})</div>
        </div>`;
    }

    private _getFormStyles(): string {
        return `
        * {
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: var(--vscode-editor-background);
            color: var(--vscode-editor-foreground);
        }
        
        .container {
            max-width: 800px;
            margin: 0 auto;
        }
        
        .form-header {
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .form-header h1 {
            margin: 0 0 10px 0;
            color: var(--vscode-titleBar-activeForeground);
        }
        
        .form-description {
            margin: 10px 0;
            color: var(--vscode-descriptionForeground);
        }
        
        .header-indicators {
            display: flex;
            gap: 12px;
            align-items: center;
            flex-wrap: wrap;
        }
        
        .stage-indicator {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            text-transform: uppercase;
        }
        
        .modifications-indicator {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            background: #ca5010;
            color: white;
        }
        
        .modifications-indicator .mod-count {
            font-weight: bold;
        }
        
        .stage-preliminary { background: #0078d4; color: white; }
        .stage-planning { background: #ca5010; color: white; }
        .stage-execution { background: #107c10; color: white; }
        .stage-review { background: #5c2d91; color: white; }
        
        .form-section {
            margin-bottom: 30px;
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            background: var(--vscode-panel-background);
        }
        
        .slideshow-indicator {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            background: #107c10;
            color: white;
        }
        
        .singlepage-indicator {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            background: #0078d4;
            color: white;
        }
        
        .style-toggle-btn {
            padding: 4px 12px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            border: 1px solid var(--vscode-button-border);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .style-toggle-btn:hover {
            background: var(--vscode-button-secondaryHoverBackground);
        }
        
        .progress-container {
            margin: 20px 0;
            padding: 15px;
            background: var(--vscode-panel-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .progress-bar {
            width: 100%;
            height: 8px;
            background: var(--vscode-progressBar-background);
            border-radius: 4px;
            overflow: hidden;
            margin-bottom: 8px;
        }
        
        .progress-fill {
            height: 100%;
            background: var(--vscode-progressBar-foreground);
            transition: width 0.3s ease;
        }
        
        .progress-text {
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
            text-align: center;
        }
        
        .slideshow-controls {
            margin: 30px 0;
            padding: 20px;
            background: var(--vscode-panel-background);
            border-radius: 6px;
            border: 1px solid var(--vscode-panel-border);
        }
        
        .slideshow-navigation {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .nav-btn {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background-color 0.2s;
        }
        
        .nav-btn:hover:not(:disabled) {
            background: var(--vscode-button-hoverBackground);
        }
        
        .nav-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        
        .slide-counter {
            font-weight: bold;
            color: var(--vscode-editor-foreground);
        }
        
        .slideshow-dots {
            display: flex;
            justify-content: center;
            gap: 8px;
            flex-wrap: wrap;
        }
        
        .slide-dot {
            width: 32px;
            height: 32px;
            border-radius: 50%;
            border: 2px solid var(--vscode-panel-border);
            background: var(--vscode-panel-background);
            color: var(--vscode-editor-foreground);
            cursor: pointer;
            font-size: 12px;
            font-weight: bold;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.2s;
        }
        
        .slide-dot:hover {
            border-color: var(--vscode-button-background);
        }
        
        .slide-dot.current {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border-color: var(--vscode-button-background);
        }
        
        .slide-dot.completed {
            background: var(--vscode-charts-green);
            color: white;
            border-color: var(--vscode-charts-green);
        }
        
        .slide-dot.completed::after {
            content: '✓';
            font-size: 10px;
        }
        
        /* Slide transition animations */
        .form-section {
            animation: slideIn 0.3s ease-in-out;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateX(20px);
            }
            to {
                opacity: 1;
                transform: translateX(0);
            }
        }
        
        .slideshow-controls {
            animation: fadeIn 0.2s ease-in-out;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
            }
            to {
                opacity: 1;
            }
        }
        
        /* Enhanced form section styling for slideshow */
        .container:has(.slideshow-controls) .form-section {
            min-height: 300px;
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
        }
        
        .container:has(.slideshow-controls) .form-section h3 {
            font-size: 1.5em;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--vscode-button-background);
        }
        
        /* Focus management for slideshow */
        .slideshow-controls .nav-btn:focus,
        .slideshow-controls .slide-dot:focus {
            outline: 2px solid var(--vscode-focusBorder);
            outline-offset: 2px;
        }
        
        .form-section h3 {
            margin: 0 0 15px 0;
            color: var(--vscode-titleBar-activeForeground);
        }
        
        .section-description {
            margin: 0 0 20px 0;
            color: var(--vscode-descriptionForeground);
            font-style: italic;
        }
        
        .collapsible .section-header {
            cursor: pointer;
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: -20px -20px 0 -20px;
            padding: 20px;
            border-bottom: 1px solid var(--vscode-panel-border);
        }
        
        .collapsible .section-content {
            padding-top: 20px;
        }
        
        .collapsible:not(.expanded) .section-content {
            display: none;
        }
        
        .collapsible.expanded .toggle-icon {
            transform: rotate(180deg);
        }
        
        .form-field {
            margin-bottom: 20px;
        }
        
        .field-label {
            display: block;
            margin-bottom: 5px;
            font-weight: 500;
            color: var(--vscode-input-foreground);
        }
        
        .required {
            color: #f85149;
        }
        
        .field-description {
            margin: 0 0 8px 0;
            font-size: 13px;
            color: var(--vscode-descriptionForeground);
        }
        
        input[type="text"], input[type="number"], textarea, select {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 14px;
        }
        
        input[type="range"] {
            width: calc(100% - 60px);
            margin-right: 10px;
        }
        
        .slider-value {
            display: inline-block;
            width: 50px;
            text-align: center;
            font-weight: bold;
        }
        
        .checkbox-group, .radio-group {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }
        
        .checkbox-label, .radio-label {
            display: flex;
            align-items: center;
            gap: 8px;
            cursor: pointer;
        }
        
        .form-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid var(--vscode-panel-border);
        }
        
        .btn {
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 500;
        }
        
        .btn-primary {
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .btn-secondary {
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
        }
        
        .btn-help {
            background: #0078d4;
            color: white;
        }
        
        .btn:hover {
            opacity: 0.9;
        }
        
        .info-box {
            padding: 20px;
            border: 1px solid var(--vscode-panel-border);
            border-radius: 6px;
            background: var(--vscode-panel-background);
            margin-top: 20px;
        }
        
        /* Grid Options Styles */
        .options-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
            margin-top: 8px;
        }
        
        .grid-option {
            position: relative;
            padding: 12px 16px;
            border: 2px solid var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-input-background);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: space-between;
            min-height: 44px;
        }
        
        .grid-option:hover {
            border-color: var(--vscode-focusBorder);
            background: var(--vscode-list-hoverBackground);
        }
        
        .grid-option.selected {
            border-color: var(--vscode-button-background);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
        }
        
        .grid-option .option-label {
            flex: 1;
            font-weight: 500;
        }
        
        .grid-option .remove-option {
            background: none;
            border: none;
            color: inherit;
            cursor: pointer;
            font-size: 18px;
            font-weight: bold;
            padding: 0;
            margin-left: 8px;
            opacity: 0.7;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 50%;
        }
        
        .grid-option .remove-option:hover {
            opacity: 1;
            background: rgba(255, 255, 255, 0.2);
        }
        
        .add-option-container {
            display: flex;
            gap: 8px;
            align-items: center;
            padding: 8px;
            border: 2px dashed var(--vscode-input-border);
            border-radius: 6px;
            background: var(--vscode-editor-background);
        }
        
        .add-option-input {
            flex: 1;
            padding: 6px 8px;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            font-size: 13px;
        }
        
        .add-option-btn {
            padding: 6px 12px;
            border: none;
            border-radius: 4px;
            background: var(--vscode-button-secondaryBackground);
            color: var(--vscode-button-secondaryForeground);
            cursor: pointer;
            font-size: 13px;
            font-weight: 500;
            white-space: nowrap;
        }
        
        .add-option-btn:hover {
            opacity: 0.9;
        }
        
        /* Responsive grid adjustments */
        @media (max-width: 600px) {
            .options-grid {
                grid-template-columns: 1fr;
            }
        }
        
        /* User modification indicators */
        .grid-option[data-user-added="true"] {
            border-style: dashed;
        }
        
        .grid-option[data-user-added="true"]::before {
            content: "👤";
            margin-right: 6px;
            font-size: 12px;
        }
        `;
    }

    private _getFormScript(): string {
        return `
        const vscode = acquireVsCodeApi();
        
        function toggleSection(sectionId) {
            const section = document.querySelector('.collapsible:has(#' + sectionId + ')');
            if (section) {
                section.classList.toggle('expanded');
            }
        }
        
        function handleFieldChange(fieldId, value) {
            vscode.postMessage({
                command: 'fieldChanged',
                fieldId: fieldId,
                value: value
            });
            
            // Update slider display
            const sliderValue = document.getElementById(fieldId + '_value');
            if (sliderValue) {
                sliderValue.textContent = value;
            }
        }
        
        function handleMultiSelectChange(fieldId) {
            const checkboxes = document.querySelectorAll('input[name="' + fieldId + '"]:checked');
            const values = Array.from(checkboxes).map(cb => cb.value);
            vscode.postMessage({
                command: 'fieldChanged',
                fieldId: fieldId,
                value: values
            });
        }
        
        document.getElementById('rillanForm').addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = {};
            
            for (let [key, value] of formData.entries()) {
                if (data[key]) {
                    if (Array.isArray(data[key])) {
                        data[key].push(value);
                    } else {
                        data[key] = [data[key], value];
                    }
                } else {
                    data[key] = value;
                }
            }
            
            vscode.postMessage({
                command: 'submitForm',
                data: data
            });
        });
        
        document.getElementById('skipBtn')?.addEventListener('click', function() {
            vscode.postMessage({ command: 'skipForm' });
        });
        
        document.getElementById('goBackBtn')?.addEventListener('click', function() {
            vscode.postMessage({ command: 'goBack' });
        });
        
        document.getElementById('aiHelpBtn')?.addEventListener('click', function() {
            vscode.postMessage({ 
                command: 'requestAIHelp',
                context: {
                    currentForm: '${this._currentForm?.id}',
                    stage: '${this._currentForm?.stage}'
                }
            });
        });
        
        // Grid option click handlers
        document.addEventListener('click', function(e) {
            const gridOption = e.target.closest('.grid-option');
            if (gridOption && !e.target.classList.contains('remove-option')) {
                const input = gridOption.querySelector('input');
                if (input) {
                    if (input.type === 'radio') {
                        // Clear other selections in the same group
                        const groupName = input.name;
                        document.querySelectorAll('input[name="' + groupName + '"]').forEach(radio => {
                            radio.closest('.grid-option').classList.remove('selected');
                        });
                        input.checked = true;
                        gridOption.classList.add('selected');
                        handleFieldChange(input.name, input.value);
                    } else if (input.type === 'checkbox') {
                        input.checked = !input.checked;
                        gridOption.classList.toggle('selected', input.checked);
                        handleMultiSelectChange(input.name);
                    }
                }
            }
        });
        
        function toggleGridSelection(checkbox) {
            const gridOption = checkbox.closest('.grid-option');
            if (gridOption) {
                gridOption.classList.toggle('selected', checkbox.checked);
            }
        }
        
        function addCustomOption(fieldId) {
            const container = document.querySelector('.form-field input[name="' + fieldId + '"]')?.closest('.form-field');
            if (!container) return;
            
            const input = container.querySelector('.add-option-input');
            if (input && input.value.trim()) {
                vscode.postMessage({
                    command: 'addCustomOption',
                    fieldId: fieldId,
                    optionValue: input.value.trim()
                });
                input.value = '';
            }
        }
        
        function removeOption(fieldId, optionValue) {
            vscode.postMessage({
                command: 'removeOption',
                fieldId: fieldId,
                optionValue: optionValue
            });
        }
        
        function handleAddOption(event, fieldId) {
            if (event.key === 'Enter') {
                event.preventDefault();
                addCustomOption(fieldId);
            }
        }
        
        function updateModificationsIndicator() {
            // This will be called when the form is refreshed after modifications
            // The actual count will be updated from the backend
        }
        
        // Slideshow navigation functions
        function navigateToSlide(slideIndex) {
            vscode.postMessage({
                command: 'navigateToSlide',
                slideIndex: slideIndex
            });
        }
        
        function nextSlide() {
            vscode.postMessage({
                command: 'nextSlide'
            });
        }
        
        function previousSlide() {
            vscode.postMessage({
                command: 'previousSlide'
            });
        }
        
        // Keyboard navigation for slideshow
        document.addEventListener('keydown', function(e) {
            // Only handle if we're in slideshow mode (check for slideshow controls)
            if (document.querySelector('.slideshow-controls')) {
                if (e.key === 'ArrowRight' && !e.target.matches('input, textarea, select')) {
                    e.preventDefault();
                    nextSlide();
                } else if (e.key === 'ArrowLeft' && !e.target.matches('input, textarea, select')) {
                    e.preventDefault();
                    previousSlide();
                }
            }
        });
        
        // Form style toggle function
        function toggleFormStyle() {
            vscode.postMessage({
                command: 'toggleFormStyle'
            });
        }
        `;
    }

    public dispose() {
        DetailCollectorPanel.currentPanel = undefined;
        this._panel.dispose();
        while (this._disposables.length) {
            const x = this._disposables.pop();
            if (x) {
                x.dispose();
            }
        }
    }
}