import { RillanForm, RillanFormSection } from './detailCollectorPanel';

export interface SlideshowConfig {
    enabled: boolean;
    sectionsPerSlide: number;
    navigationStyle: 'arrows' | 'dots' | 'both';
    autoAdvance: boolean;
    progressIndicator: boolean;
}

export interface SlideState {
    currentSlide: number;
    totalSlides: number;
    completedSlides: Set<number>;
    slideData: Map<number, any>;
    canAdvance: boolean;
}

export interface SlideValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
}

export class SlideshowFormController {
    private _slideState: SlideState;
    private _config: SlideshowConfig;
    private _form: RillanForm;
    private _slides: RillanFormSection[][];

    constructor(form: RillanForm, config?: Partial<SlideshowConfig>) {
        this._form = form;
        this._config = {
            enabled: true,
            sectionsPerSlide: 1,
            navigationStyle: 'both',
            autoAdvance: false,
            progressIndicator: true,
            ...config
        };
        
        this._slides = this._createSlides(form.sections);
        this._slideState = this._initializeSlideState();
    }

    /**
     * Initialize slideshow state
     */
    private _initializeSlideState(): SlideState {
        return {
            currentSlide: 0,
            totalSlides: this._slides.length,
            completedSlides: new Set<number>(),
            slideData: new Map<number, any>(),
            canAdvance: this._validateSlide(0).isValid
        };
    }

    /**
     * Create slides from form sections
     */
    private _createSlides(sections: RillanFormSection[]): RillanFormSection[][] {
        const slides: RillanFormSection[][] = [];
        
        for (let i = 0; i < sections.length; i += this._config.sectionsPerSlide) {
            const slide = sections.slice(i, i + this._config.sectionsPerSlide);
            slides.push(slide);
        }
        
        return slides;
    }

    /**
     * Get current slide state
     */
    public getSlideState(): SlideState {
        return { ...this._slideState };
    }

    /**
     * Get current slide sections
     */
    public getCurrentSlideSections(): RillanFormSection[] {
        return this._slides[this._slideState.currentSlide] || [];
    }

    /**
     * Navigate to specific slide
     */
    public navigateToSlide(slideIndex: number): boolean {
        if (slideIndex < 0 || slideIndex >= this._slideState.totalSlides) {
            return false;
        }

        // Validate current slide before allowing navigation
        if (slideIndex > this._slideState.currentSlide) {
            const validation = this._validateSlide(this._slideState.currentSlide);
            if (!validation.isValid) {
                return false;
            }
            this._slideState.completedSlides.add(this._slideState.currentSlide);
        }

        this._slideState.currentSlide = slideIndex;
        this._slideState.canAdvance = this._validateSlide(slideIndex).isValid;
        
        return true;
    }

    /**
     * Navigate to next slide
     */
    public nextSlide(): boolean {
        return this.navigateToSlide(this._slideState.currentSlide + 1);
    }

    /**
     * Navigate to previous slide
     */
    public previousSlide(): boolean {
        return this.navigateToSlide(this._slideState.currentSlide - 1);
    }

    /**
     * Check if can navigate to next slide
     */
    public canNavigateNext(): boolean {
        return this._slideState.currentSlide < this._slideState.totalSlides - 1 && 
               this._slideState.canAdvance;
    }

    /**
     * Check if can navigate to previous slide
     */
    public canNavigatePrevious(): boolean {
        return this._slideState.currentSlide > 0;
    }

    /**
     * Check if current slide is the last slide
     */
    public isLastSlide(): boolean {
        return this._slideState.currentSlide === this._slideState.totalSlides - 1;
    }

    /**
     * Validate current slide
     */
    public validateCurrentSlide(): SlideValidationResult {
        return this._validateSlide(this._slideState.currentSlide);
    }

    /**
     * Validate specific slide
     */
    private _validateSlide(slideIndex: number): SlideValidationResult {
        const result: SlideValidationResult = {
            isValid: true,
            errors: [],
            warnings: []
        };

        const slideSections = this._slides[slideIndex];
        if (!slideSections) {
            result.isValid = false;
            result.errors.push('Invalid slide index');
            return result;
        }

        // Get slide data from stored values
        const slideData = this._slideState.slideData.get(slideIndex) || {};

        // Validate required fields in current slide
        for (const section of slideSections) {
            for (const field of section.fields) {
                if (field.required) {
                    const value = slideData[field.id];
                    if (!value || (typeof value === 'string' && value.trim() === '')) {
                        result.isValid = false;
                        result.errors.push(`${field.label} is required`);
                    }
                }
            }
        }

        return result;
    }

    /**
     * Update slide data
     */
    public updateSlideData(slideIndex: number, fieldId: string, value: any): void {
        if (!this._slideState.slideData.has(slideIndex)) {
            this._slideState.slideData.set(slideIndex, {});
        }
        
        const slideData = this._slideState.slideData.get(slideIndex)!;
        slideData[fieldId] = value;
        
        // Re-validate current slide after data update
        if (slideIndex === this._slideState.currentSlide) {
            this._slideState.canAdvance = this._validateSlide(slideIndex).isValid;
        }
    }

    /**
     * Get progress percentage
     */
    public getProgressPercentage(): number {
        const completedSlides = this._slideState.completedSlides.size;
        const currentProgress = this._slideState.canAdvance ? 1 : 0;
        return Math.round(((completedSlides + currentProgress) / this._slideState.totalSlides) * 100);
    }

    /**
     * Export all slideshow data
     */
    public exportSlideshowData(): Record<string, any> {
        const allData: Record<string, any> = {};
        
        // Combine data from all slides
        for (const [slideIndex, slideData] of this._slideState.slideData.entries()) {
            Object.assign(allData, slideData);
        }
        
        return allData;
    }

    /**
     * Get slideshow configuration
     */
    public getConfig(): SlideshowConfig {
        return { ...this._config };
    }

    /**
     * Update slideshow configuration
     */
    public updateConfig(newConfig: Partial<SlideshowConfig>): void {
        this._config = { ...this._config, ...newConfig };
        
        // Recreate slides if sectionsPerSlide changed
        if (newConfig.sectionsPerSlide !== undefined) {
            this._slides = this._createSlides(this._form.sections);
            this._slideState.totalSlides = this._slides.length;
            
            // Reset to first slide if current slide is now invalid
            if (this._slideState.currentSlide >= this._slides.length) {
                this._slideState.currentSlide = 0;
            }
        }
    }

    /**
     * Reset slideshow to initial state
     */
    public reset(): void {
        this._slideState = this._initializeSlideState();
    }

    /**
     * Get slide summary for navigation
     */
    public getSlideSummary(): Array<{index: number, title: string, completed: boolean, current: boolean}> {
        return this._slides.map((slideSections, index) => ({
            index,
            title: slideSections.length === 1 
                ? slideSections[0].title 
                : `Slide ${index + 1}`,
            completed: this._slideState.completedSlides.has(index),
            current: index === this._slideState.currentSlide
        }));
    }
}