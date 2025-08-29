import * as vscode from 'vscode';

/**
 * Performance optimization system for the AI Integration Layer
 */

export interface PerformanceMetrics {
    formGenerationTime: number;
    formRenderTime: number;
    dataProcessingTime: number;
    memoryUsage: number;
    cacheHitRate: number;
    userInteractionLatency: number;
    timestamp: Date;
}

export interface CacheEntry<T> {
    data: T;
    timestamp: Date;
    accessCount: number;
    lastAccessed: Date;
    size: number;
}

export interface OptimizationRule {
    id: string;
    condition: (metrics: PerformanceMetrics) => boolean;
    action: (metrics: PerformanceMetrics) => Promise<void>;
    description: string;
    priority: number;
}

export interface LazyLoadConfig {
    enabled: boolean;
    chunkSize: number;
    loadThreshold: number;
    preloadNext: boolean;
}

/**
 * Performance Optimizer with caching, lazy loading, and monitoring
 */
export class PerformanceOptimizer {
    private static instance: PerformanceOptimizer;
    private formCache: Map<string, CacheEntry<any>> = new Map();
    private templateCache: Map<string, CacheEntry<any>> = new Map();
    private metricsHistory: PerformanceMetrics[] = [];
    private optimizationRules: OptimizationRule[] = [];
    private lazyLoadConfig: LazyLoadConfig = {
        enabled: true,
        chunkSize: 5,
        loadThreshold: 0.8,
        preloadNext: true
    };
    
    // Cache configuration
    private readonly MAX_CACHE_SIZE = 50; // Maximum number of cached items
    private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
    private readonly MAX_MEMORY_USAGE = 100 * 1024 * 1024; // 100MB
    
    // Performance thresholds
    private readonly SLOW_GENERATION_THRESHOLD = 2000; // 2 seconds
    private readonly SLOW_RENDER_THRESHOLD = 1000; // 1 second
    private readonly HIGH_MEMORY_THRESHOLD = 80 * 1024 * 1024; // 80MB

    private constructor() {
        this.initializeOptimizationRules();
        this.startPerformanceMonitoring();
    }

    public static getInstance(): PerformanceOptimizer {
        if (!PerformanceOptimizer.instance) {
            PerformanceOptimizer.instance = new PerformanceOptimizer();
        }
        return PerformanceOptimizer.instance;
    }

    /**
     * Cache form templates for faster generation
     */
    public cacheFormTemplate(key: string, template: any): void {
        const size = this.estimateObjectSize(template);
        
        // Check if adding this would exceed memory limits
        if (this.getCurrentCacheSize() + size > this.MAX_MEMORY_USAGE) {
            this.evictLeastRecentlyUsed();
        }
        
        const entry: CacheEntry<any> = {
            data: template,
            timestamp: new Date(),
            accessCount: 0,
            lastAccessed: new Date(),
            size
        };
        
        this.templateCache.set(key, entry);
        
        // Enforce cache size limit
        if (this.templateCache.size > this.MAX_CACHE_SIZE) {
            this.evictLeastRecentlyUsed();
        }
    }

    /**
     * Get cached form template
     */
    public getCachedFormTemplate(key: string): any | null {
        const entry = this.templateCache.get(key);
        
        if (!entry) {
            return null;
        }
        
        // Check if cache entry is expired
        if (Date.now() - entry.timestamp.getTime() > this.CACHE_TTL) {
            this.templateCache.delete(key);
            return null;
        }
        
        // Update access statistics
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        return entry.data;
    }

    /**
     * Cache generated forms for reuse
     */
    public cacheGeneratedForm(formId: string, form: any): void {
        const size = this.estimateObjectSize(form);
        
        if (this.getCurrentCacheSize() + size > this.MAX_MEMORY_USAGE) {
            this.evictLeastRecentlyUsed();
        }
        
        const entry: CacheEntry<any> = {
            data: form,
            timestamp: new Date(),
            accessCount: 0,
            lastAccessed: new Date(),
            size
        };
        
        this.formCache.set(formId, entry);
        
        if (this.formCache.size > this.MAX_CACHE_SIZE) {
            this.evictLeastRecentlyUsed();
        }
    }

    /**
     * Get cached generated form
     */
    public getCachedForm(formId: string): any | null {
        const entry = this.formCache.get(formId);
        
        if (!entry) {
            return null;
        }
        
        if (Date.now() - entry.timestamp.getTime() > this.CACHE_TTL) {
            this.formCache.delete(formId);
            return null;
        }
        
        entry.accessCount++;
        entry.lastAccessed = new Date();
        
        return entry.data;
    }

    /**
     * Optimize form rendering with lazy loading
     */
    public optimizeFormRendering(form: any): any {
        if (!this.lazyLoadConfig.enabled) {
            return form;
        }
        
        // Split large forms into chunks for lazy loading
        if (form.sections && form.sections.length > this.lazyLoadConfig.chunkSize) {
            return this.createLazyLoadedForm(form);
        }
        
        return form;
    }

    /**
     * Create lazy-loaded form structure
     */
    private createLazyLoadedForm(form: any): any {
        const chunks = this.chunkArray(form.sections, this.lazyLoadConfig.chunkSize);
        
        return {
            ...form,
            lazyLoaded: true,
            totalChunks: chunks.length,
            initialChunk: chunks[0],
            loadedChunks: new Set([0]),
            chunks: chunks.map((chunk, index) => ({
                index,
                sections: chunk,
                loaded: index === 0,
                loading: false
            }))
        };
    }

    /**
     * Load next chunk of form sections
     */
    public async loadNextChunk(form: any, currentChunkIndex: number): Promise<any> {
        if (!form.lazyLoaded || !form.chunks) {
            return form;
        }
        
        const nextChunkIndex = currentChunkIndex + 1;
        
        if (nextChunkIndex >= form.chunks.length) {
            return form; // No more chunks to load
        }
        
        const nextChunk = form.chunks[nextChunkIndex];
        
        if (nextChunk.loaded) {
            return form; // Already loaded
        }
        
        // Simulate loading delay (in real implementation, this might involve network requests)
        nextChunk.loading = true;
        await this.delay(100); // Small delay to simulate loading
        
        nextChunk.loaded = true;
        nextChunk.loading = false;
        form.loadedChunks.add(nextChunkIndex);
        
        // Preload next chunk if enabled
        if (this.lazyLoadConfig.preloadNext && nextChunkIndex + 1 < form.chunks.length) {
            setTimeout(() => {
                this.loadNextChunk(form, nextChunkIndex);
            }, 500);
        }
        
        return form;
    }

    /**
     * Monitor and record performance metrics
     */
    public recordMetrics(metrics: Partial<PerformanceMetrics>): void {
        const fullMetrics: PerformanceMetrics = {
            formGenerationTime: 0,
            formRenderTime: 0,
            dataProcessingTime: 0,
            memoryUsage: this.getCurrentMemoryUsage(),
            cacheHitRate: this.calculateCacheHitRate(),
            userInteractionLatency: 0,
            timestamp: new Date(),
            ...metrics
        };
        
        this.metricsHistory.push(fullMetrics);
        
        // Keep only last 100 metrics to prevent memory issues
        if (this.metricsHistory.length > 100) {
            this.metricsHistory = this.metricsHistory.slice(-100);
        }
        
        // Apply optimization rules
        this.applyOptimizationRules(fullMetrics);
    }

    /**
     * Get performance statistics
     */
    public getPerformanceStats(): {
        averageGenerationTime: number;
        averageRenderTime: number;
        cacheHitRate: number;
        memoryUsage: number;
        recentMetrics: PerformanceMetrics[];
    } {
        if (this.metricsHistory.length === 0) {
            return {
                averageGenerationTime: 0,
                averageRenderTime: 0,
                cacheHitRate: 0,
                memoryUsage: 0,
                recentMetrics: []
            };
        }
        
        const recent = this.metricsHistory.slice(-10);
        
        return {
            averageGenerationTime: this.average(recent.map(m => m.formGenerationTime)),
            averageRenderTime: this.average(recent.map(m => m.formRenderTime)),
            cacheHitRate: this.calculateCacheHitRate(),
            memoryUsage: this.getCurrentMemoryUsage(),
            recentMetrics: recent
        };
    }

    /**
     * Initialize optimization rules
     */
    private initializeOptimizationRules(): void {
        // Rule: Clear cache when memory usage is high
        this.optimizationRules.push({
            id: 'high-memory-cleanup',
            condition: (metrics) => metrics.memoryUsage > this.HIGH_MEMORY_THRESHOLD,
            action: async (metrics) => {
                await this.clearOldCacheEntries();
                vscode.window.showInformationMessage('Optimized memory usage by clearing old cache entries');
            },
            description: 'Clear old cache entries when memory usage is high',
            priority: 1
        });
        
        // Rule: Preload templates when generation is slow
        this.optimizationRules.push({
            id: 'slow-generation-preload',
            condition: (metrics) => metrics.formGenerationTime > this.SLOW_GENERATION_THRESHOLD,
            action: async (metrics) => {
                await this.preloadCommonTemplates();
            },
            description: 'Preload common templates when generation is slow',
            priority: 2
        });
        
        // Rule: Enable lazy loading when rendering is slow
        this.optimizationRules.push({
            id: 'slow-render-lazy-load',
            condition: (metrics) => metrics.formRenderTime > this.SLOW_RENDER_THRESHOLD,
            action: async (metrics) => {
                this.lazyLoadConfig.enabled = true;
                this.lazyLoadConfig.chunkSize = Math.max(3, this.lazyLoadConfig.chunkSize - 1);
            },
            description: 'Enable lazy loading when rendering is slow',
            priority: 3
        });
        
        // Rule: Optimize cache when hit rate is low
        this.optimizationRules.push({
            id: 'low-cache-hit-optimize',
            condition: (metrics) => metrics.cacheHitRate < 0.3,
            action: async (metrics) => {
                await this.optimizeCacheStrategy();
            },
            description: 'Optimize cache strategy when hit rate is low',
            priority: 4
        });
    }

    /**
     * Apply optimization rules based on current metrics
     */
    private async applyOptimizationRules(metrics: PerformanceMetrics): Promise<void> {
        const applicableRules = this.optimizationRules
            .filter(rule => rule.condition(metrics))
            .sort((a, b) => a.priority - b.priority);
        
        for (const rule of applicableRules) {
            try {
                await rule.action(metrics);
            } catch (error) {
                console.warn(`Optimization rule ${rule.id} failed:`, error);
            }
        }
    }

    /**
     * Evict least recently used cache entries
     */
    private evictLeastRecentlyUsed(): void {
        const allEntries = [
            ...Array.from(this.formCache.entries()).map(([key, entry]) => ({ key, entry, cache: 'form' })),
            ...Array.from(this.templateCache.entries()).map(([key, entry]) => ({ key, entry, cache: 'template' }))
        ];
        
        // Sort by last accessed time (oldest first)
        allEntries.sort((a, b) => a.entry.lastAccessed.getTime() - b.entry.lastAccessed.getTime());
        
        // Remove oldest entries until we're under the memory limit
        let currentSize = this.getCurrentCacheSize();
        
        for (const item of allEntries) {
            if (currentSize <= this.MAX_MEMORY_USAGE * 0.8) { // Target 80% of max
                break;
            }
            
            if (item.cache === 'form') {
                this.formCache.delete(item.key);
            } else {
                this.templateCache.delete(item.key);
            }
            
            currentSize -= item.entry.size;
        }
    }

    /**
     * Clear old cache entries
     */
    private async clearOldCacheEntries(): Promise<void> {
        const now = Date.now();
        const cutoffTime = now - (this.CACHE_TTL / 2); // Clear entries older than half TTL
        
        // Clear old form cache entries
        for (const [key, entry] of this.formCache.entries()) {
            if (entry.timestamp.getTime() < cutoffTime) {
                this.formCache.delete(key);
            }
        }
        
        // Clear old template cache entries
        for (const [key, entry] of this.templateCache.entries()) {
            if (entry.timestamp.getTime() < cutoffTime) {
                this.templateCache.delete(key);
            }
        }
    }

    /**
     * Preload common templates
     */
    private async preloadCommonTemplates(): Promise<void> {
        const commonTemplates = [
            'minimal-project-form',
            'standard-project-form',
            'investigation-form',
            'refactoring-form'
        ];
        
        for (const templateId of commonTemplates) {
            if (!this.templateCache.has(templateId)) {
                // In a real implementation, this would load the template
                const template = this.generateBasicTemplate(templateId);
                this.cacheFormTemplate(templateId, template);
            }
        }
    }

    /**
     * Optimize cache strategy
     */
    private async optimizeCacheStrategy(): Promise<void> {
        // Analyze access patterns and adjust cache size
        const accessCounts = new Map<string, number>();
        
        for (const [key, entry] of this.templateCache.entries()) {
            accessCounts.set(key, entry.accessCount);
        }
        
        // Keep frequently accessed items, remove rarely accessed ones
        const sortedByAccess = Array.from(accessCounts.entries())
            .sort((a, b) => b[1] - a[1]);
        
        const keepCount = Math.floor(this.MAX_CACHE_SIZE * 0.7);
        const toRemove = sortedByAccess.slice(keepCount);
        
        for (const [key] of toRemove) {
            this.templateCache.delete(key);
        }
    }

    /**
     * Start performance monitoring
     */
    private startPerformanceMonitoring(): void {
        // Monitor memory usage every 30 seconds
        setInterval(() => {
            const memoryUsage = this.getCurrentMemoryUsage();
            
            if (memoryUsage > this.HIGH_MEMORY_THRESHOLD) {
                this.recordMetrics({ memoryUsage });
            }
        }, 30000);
    }

    /**
     * Utility methods
     */
    private estimateObjectSize(obj: any): number {
        // Rough estimation of object size in bytes
        const jsonString = JSON.stringify(obj);
        return Buffer.byteLength(jsonString, 'utf8');
    }

    private getCurrentCacheSize(): number {
        let totalSize = 0;
        
        for (const entry of this.formCache.values()) {
            totalSize += entry.size;
        }
        
        for (const entry of this.templateCache.values()) {
            totalSize += entry.size;
        }
        
        return totalSize;
    }

    private getCurrentMemoryUsage(): number {
        // In a real implementation, this would get actual memory usage
        return this.getCurrentCacheSize();
    }

    private calculateCacheHitRate(): number {
        const totalAccesses = Array.from(this.templateCache.values())
            .reduce((sum, entry) => sum + entry.accessCount, 0);
        
        const totalEntries = this.templateCache.size;
        
        if (totalEntries === 0) {
            return 0;
        }
        
        return totalAccesses / totalEntries;
    }

    private average(numbers: number[]): number {
        if (numbers.length === 0) return 0;
        return numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    }

    private chunkArray<T>(array: T[], chunkSize: number): T[][] {
        const chunks: T[][] = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private generateBasicTemplate(templateId: string): any {
        // Generate a basic template for caching
        return {
            id: templateId,
            title: `Template: ${templateId}`,
            sections: [{
                id: 'basic',
                title: 'Basic Information',
                fields: [{
                    id: 'description',
                    type: 'textarea',
                    label: 'Description',
                    required: true
                }]
            }]
        };
    }

    /**
     * Performance measurement utilities
     */
    public measureFormGeneration<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
        return this.measureAsync(fn);
    }

    public measureFormRender<T>(fn: () => T): { result: T; duration: number } {
        return this.measureSync(fn);
    }

    private async measureAsync<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
        const start = performance.now();
        const result = await fn();
        const duration = performance.now() - start;
        return { result, duration };
    }

    private measureSync<T>(fn: () => T): { result: T; duration: number } {
        const start = performance.now();
        const result = fn();
        const duration = performance.now() - start;
        return { result, duration };
    }

    /**
     * Get cache statistics
     */
    public getCacheStatistics(): {
        formCacheSize: number;
        templateCacheSize: number;
        totalMemoryUsage: number;
        hitRate: number;
        mostAccessedTemplates: Array<{ key: string; accessCount: number }>;
    } {
        const mostAccessed = Array.from(this.templateCache.entries())
            .map(([key, entry]) => ({ key, accessCount: entry.accessCount }))
            .sort((a, b) => b.accessCount - a.accessCount)
            .slice(0, 5);

        return {
            formCacheSize: this.formCache.size,
            templateCacheSize: this.templateCache.size,
            totalMemoryUsage: this.getCurrentCacheSize(),
            hitRate: this.calculateCacheHitRate(),
            mostAccessedTemplates: mostAccessed
        };
    }

    /**
     * Clear all caches (for testing or maintenance)
     */
    public clearAllCaches(): void {
        this.formCache.clear();
        this.templateCache.clear();
    }

    /**
     * Configure lazy loading
     */
    public configureLazyLoading(config: Partial<LazyLoadConfig>): void {
        this.lazyLoadConfig = { ...this.lazyLoadConfig, ...config };
    }

    /**
     * Get lazy loading configuration
     */
    public getLazyLoadConfig(): LazyLoadConfig {
        return { ...this.lazyLoadConfig };
    }
}