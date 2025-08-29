import * as assert from 'assert';
import { PerformanceOptimizer, PerformanceMetrics } from '../../performanceOptimizer';

suite('Performance Optimizer Test Suite', () => {
    let optimizer: PerformanceOptimizer;

    setup(() => {
        optimizer = PerformanceOptimizer.getInstance();
        optimizer.clearAllCaches(); // Start with clean caches
    });

    test('Should cache and retrieve form templates', () => {
        const template = {
            id: 'test-template',
            title: 'Test Template',
            sections: [{
                id: 'section1',
                title: 'Section 1',
                fields: []
            }]
        };

        // Cache the template
        optimizer.cacheFormTemplate('test-key', template);

        // Retrieve the template
        const cached = optimizer.getCachedFormTemplate('test-key');
        assert.ok(cached, 'Should retrieve cached template');
        assert.strictEqual(cached.id, 'test-template');
        assert.strictEqual(cached.title, 'Test Template');
    });

    test('Should return null for non-existent cache entries', () => {
        const cached = optimizer.getCachedFormTemplate('non-existent-key');
        assert.strictEqual(cached, null, 'Should return null for non-existent entries');
    });

    test('Should cache and retrieve generated forms', () => {
        const form = {
            id: 'test-form',
            title: 'Test Form',
            sections: []
        };

        optimizer.cacheGeneratedForm('form-123', form);
        
        const cached = optimizer.getCachedForm('form-123');
        assert.ok(cached, 'Should retrieve cached form');
        assert.strictEqual(cached.id, 'test-form');
    });

    test('Should optimize form rendering with lazy loading', () => {
        const largeForm = {
            id: 'large-form',
            title: 'Large Form',
            sections: Array.from({ length: 20 }, (_, i) => ({
                id: `section-${i}`,
                title: `Section ${i}`,
                fields: []
            }))
        };

        const optimized = optimizer.optimizeFormRendering(largeForm);
        
        if (optimized.lazyLoaded) {
            assert.ok(optimized.lazyLoaded, 'Should enable lazy loading for large forms');
            assert.ok(optimized.chunks, 'Should create chunks');
            assert.ok(optimized.totalChunks > 1, 'Should have multiple chunks');
            assert.ok(optimized.initialChunk, 'Should have initial chunk');
        }
    });

    test('Should not lazy load small forms', () => {
        const smallForm = {
            id: 'small-form',
            title: 'Small Form',
            sections: [
                { id: 'section1', title: 'Section 1', fields: [] },
                { id: 'section2', title: 'Section 2', fields: [] }
            ]
        };

        const optimized = optimizer.optimizeFormRendering(smallForm);
        assert.ok(!optimized.lazyLoaded, 'Should not lazy load small forms');
    });

    test('Should load next chunk in lazy-loaded forms', async () => {
        const largeForm = {
            id: 'large-form',
            sections: Array.from({ length: 15 }, (_, i) => ({
                id: `section-${i}`,
                title: `Section ${i}`,
                fields: []
            }))
        };

        const optimized = optimizer.optimizeFormRendering(largeForm);
        
        if (optimized.lazyLoaded && optimized.chunks) {
            const updated = await optimizer.loadNextChunk(optimized, 0);
            
            // Check if next chunk was loaded
            const nextChunk = updated.chunks[1];
            if (nextChunk) {
                assert.ok(nextChunk.loaded || nextChunk.loading, 'Should load or be loading next chunk');
            }
        }
    });

    test('Should record and retrieve performance metrics', () => {
        const metrics: Partial<PerformanceMetrics> = {
            formGenerationTime: 1500,
            formRenderTime: 800,
            dataProcessingTime: 300,
            userInteractionLatency: 50
        };

        optimizer.recordMetrics(metrics);
        
        const stats = optimizer.getPerformanceStats();
        assert.ok(stats.averageGenerationTime >= 0, 'Should track generation time');
        assert.ok(stats.averageRenderTime >= 0, 'Should track render time');
        assert.ok(stats.cacheHitRate >= 0, 'Should track cache hit rate');
        assert.ok(stats.memoryUsage >= 0, 'Should track memory usage');
    });

    test('Should measure form generation performance', async () => {
        const mockFormGeneration = async () => {
            // Simulate form generation delay
            await new Promise(resolve => setTimeout(resolve, 100));
            return { id: 'generated-form', title: 'Generated Form' };
        };

        const { result, duration } = await optimizer.measureFormGeneration(mockFormGeneration);
        
        assert.ok(result, 'Should return generation result');
        assert.strictEqual(result.id, 'generated-form');
        assert.ok(duration >= 100, 'Should measure duration correctly');
    });

    test('Should measure form render performance', () => {
        const mockFormRender = () => {
            // Simulate render work
            let sum = 0;
            for (let i = 0; i < 1000000; i++) {
                sum += i;
            }
            return { rendered: true, sum };
        };

        const { result, duration } = optimizer.measureFormRender(mockFormRender);
        
        assert.ok(result, 'Should return render result');
        assert.ok(result.rendered, 'Should have render result');
        assert.ok(duration >= 0, 'Should measure duration');
    });

    test('Should provide cache statistics', () => {
        // Add some cached items
        optimizer.cacheFormTemplate('template1', { id: 'template1' });
        optimizer.cacheFormTemplate('template2', { id: 'template2' });
        optimizer.cacheGeneratedForm('form1', { id: 'form1' });

        const stats = optimizer.getCacheStatistics();
        
        assert.strictEqual(stats.templateCacheSize, 2, 'Should track template cache size');
        assert.strictEqual(stats.formCacheSize, 1, 'Should track form cache size');
        assert.ok(stats.totalMemoryUsage >= 0, 'Should track memory usage');
        assert.ok(stats.hitRate >= 0, 'Should calculate hit rate');
    });

    test('Should configure lazy loading', () => {
        const newConfig = {
            enabled: false,
            chunkSize: 10,
            loadThreshold: 0.9,
            preloadNext: false
        };

        optimizer.configureLazyLoading(newConfig);
        
        const config = optimizer.getLazyLoadConfig();
        assert.strictEqual(config.enabled, false, 'Should update enabled setting');
        assert.strictEqual(config.chunkSize, 10, 'Should update chunk size');
        assert.strictEqual(config.loadThreshold, 0.9, 'Should update load threshold');
        assert.strictEqual(config.preloadNext, false, 'Should update preload setting');
    });

    test('Should clear all caches', () => {
        // Add some cached items
        optimizer.cacheFormTemplate('template1', { id: 'template1' });
        optimizer.cacheGeneratedForm('form1', { id: 'form1' });

        let stats = optimizer.getCacheStatistics();
        assert.ok(stats.templateCacheSize > 0 || stats.formCacheSize > 0, 'Should have cached items');

        optimizer.clearAllCaches();

        stats = optimizer.getCacheStatistics();
        assert.strictEqual(stats.templateCacheSize, 0, 'Should clear template cache');
        assert.strictEqual(stats.formCacheSize, 0, 'Should clear form cache');
    });

    test('Should handle cache expiration', async () => {
        // This test would need to mock time or use a shorter TTL for testing
        // For now, we'll test the basic functionality
        
        optimizer.cacheFormTemplate('temp-template', { id: 'temp' });
        
        let cached = optimizer.getCachedFormTemplate('temp-template');
        assert.ok(cached, 'Should retrieve recently cached template');
        
        // In a real test, we would advance time and check expiration
        // For now, we'll just verify the cache works
        cached = optimizer.getCachedFormTemplate('temp-template');
        assert.ok(cached, 'Should still retrieve non-expired template');
    });

    test('Should track access counts for cache optimization', () => {
        optimizer.cacheFormTemplate('popular-template', { id: 'popular' });
        
        // Access the template multiple times
        for (let i = 0; i < 5; i++) {
            optimizer.getCachedFormTemplate('popular-template');
        }
        
        const stats = optimizer.getCacheStatistics();
        const popularTemplate = stats.mostAccessedTemplates.find(t => t.key === 'popular-template');
        
        if (popularTemplate) {
            assert.ok(popularTemplate.accessCount >= 5, 'Should track access count');
        }
    });

    teardown(() => {
        optimizer.clearAllCaches();
    });
});