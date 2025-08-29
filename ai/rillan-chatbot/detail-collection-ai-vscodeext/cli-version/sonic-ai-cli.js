#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

class RillanAICLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }

    async collectDetails(request) {
        console.log('\n🎯 Rillan AI Workflow Interface - CLI Version\n');

        // Analyze request
        const analysis = this.analyzeRequest(request);
        console.log('📊 Project Analysis:');
        console.log(`   Type: ${analysis.type}`);
        console.log(`   Complexity: ${analysis.complexity}`);
        console.log(`   Approach: ${analysis.approach}\n`);

        // Collect details based on analysis
        const details = await this.collectProjectDetails(analysis);

        // Export data
        const exportData = {
            formId: `cli-${Date.now()}`,
            timestamp: new Date().toISOString(),
            originalRequest: request,
            analysis: analysis,
            details: details
        };

        this.exportData(exportData);
        return exportData;
    }

    analyzeRequest(request) {
        const lowerRequest = request.toLowerCase();

        let type = 'other';
        if (lowerRequest.includes('app') || lowerRequest.includes('application')) type = 'app';
        else if (lowerRequest.includes('web') || lowerRequest.includes('website')) type = 'web';
        else if (lowerRequest.includes('image') || lowerRequest.includes('picture')) type = 'image';
        else if (lowerRequest.includes('code') || lowerRequest.includes('function')) type = 'code';

        let complexity = 'simple';
        if (lowerRequest.includes('complex') || lowerRequest.includes('advanced')) complexity = 'complex';
        else if (lowerRequest.includes('full') || lowerRequest.includes('complete')) complexity = 'medium';

        return {
            type,
            complexity,
            approach: `${complexity} ${type} development with modern tools`
        };
    }

    async collectProjectDetails(analysis) {
        const details = {};

        details.projectName = await this.ask('📝 Project Name: ');
        details.description = await this.ask('📋 Description: ');

        if (analysis.type === 'web' || analysis.type === 'app') {
            details.framework = await this.ask('⚛️  Framework (React/Vue/Angular): ');
            details.database = await this.ask('🗄️  Database (PostgreSQL/MongoDB/etc): ');
            details.features = (await this.ask('✨ Key Features (comma-separated): ')).split(',').map(f => f.trim());
        }

        if (analysis.type === 'image') {
            details.style = await this.ask('🎨 Art Style: ');
            details.colors = await this.ask('🌈 Color Scheme: ');
            details.dimensions = await this.ask('📐 Dimensions: ');
        }

        details.timeline = await this.ask('⏰ Timeline: ');
        details.priority = await this.ask('🎯 Priority Level: ');

        return details;
    }

    ask(question) {
        return new Promise((resolve) => {
            this.rl.question(question, (answer) => {
                resolve(answer);
            });
        });
    }

    exportData(data) {
        const rillanDir = '.rillan-ai';
        if (!fs.existsSync(rillanDir)) {
            fs.mkdirSync(rillanDir);
        }

        const filename = `rillan-ai-details-${Date.now()}.json`;
        const filepath = path.join(rillanDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));
        console.log(`\n✅ Data exported to: ${filepath}`);
        console.log('\n📋 Summary:');
        console.log(JSON.stringify(data, null, 2));
    }

    close() {
        this.rl.close();
    }
}

// CLI Usage
if (require.main === module) {
    const args = process.argv.slice(2);
    const request = args.join(' ') || 'Build a simple web application';

    const cli = new RillanAICLI();
    cli.collectDetails(request).then(() => {
        cli.close();
    });
}

module.exports = RillanAICLI;