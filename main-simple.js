// main-simple.js - Simplified version using direct API calls
const fetch = require('node-fetch');
const FactTagCounter = require('./fact-tag-counter');
const StatisticsCalculator = require('./statistics-calculator');

class SimpleWikipediaEstimator {
    constructor() {
        this.baseUrl = 'https://en.wikipedia.org/w/api.php';
        this.userAgent = 'FactTagEstimator/2.1 (Educational Research)';
        this.counter = new FactTagCounter();
        this.stats = new StatisticsCalculator();
    }

    async estimateFactTags(sampleSize = 100) {
        console.log(`Starting simple estimation with sample size: ${sampleSize}`);
        
        try {
            // Step 1: Get articles using search
            console.log('Step 1: Getting sample articles with fact tags...');
            const sampleArticles = await this.getArticlesWithFactTags(sampleSize);
            console.log(`Retrieved ${sampleArticles.length} articles`);

            // Step 2: Count fact tags in each article
            console.log('Step 2: Counting fact tags...');
            const tagCounts = [];
            
            for (let i = 0; i < sampleArticles.length; i++) {
                const article = sampleArticles[i];
                console.log(`Processing ${i + 1}/${sampleArticles.length}: ${article.title}`);
                
                try {
                    const content = await this.getArticleContent(article.title);
                    const tagCount = this.counter.countFactTags(content);
                    tagCounts.push({
                        title: article.title,
                        tagCount: tagCount
                    });
                    
                    await this.delay(200);
                } catch (error) {
                    console.warn(`Error processing ${article.title}:`, error.message);
                }
            }

            // Step 3: Estimate using known total
            const totalTaggedArticles = 553000; // Approximate from our earlier query
            const results = this.stats.calculateEstimate(tagCounts, totalTaggedArticles);
            
            return results;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    async getArticlesWithFactTags(limit) {
        const articles = [];
        const seenTitles = new Set();
        
        // Use search to find articles with citation needed
        const searchTerms = ['citation needed', 'fact', 'dubious'];
        
        for (const term of searchTerms) {
            if (articles.length >= limit) break;
            
            console.log(`Searching for articles with "${term}"...`);
            
            const params = new URLSearchParams({
                action: 'query',
                list: 'search',
                srsearch: `insource:"{{${term}}}"`,
                srnamespace: '0',
                srlimit: Math.min(50, limit - articles.length),
                format: 'json'
            });

            const response = await fetch(`${this.baseUrl}?${params}`, {
                headers: { 'User-Agent': this.userAgent }
            });

            const data = await response.json();
            
            if (data.query && data.query.search) {
                for (const page of data.query.search) {
                    if (!seenTitles.has(page.title) && articles.length < limit) {
                        seenTitles.add(page.title);
                        articles.push({
                            title: page.title,
                            pageid: page.pageid
                        });
                    }
                }
            }
            
            await this.delay(500);
        }
        
        return articles;
    }

    async getArticleContent(title) {
        const params = new URLSearchParams({
            action: 'query',
            titles: title,
            prop: 'revisions',
            rvprop: 'content',
            rvslots: 'main',
            format: 'json'
        });

        const response = await fetch(`${this.baseUrl}?${params}`, {
            headers: { 'User-Agent': this.userAgent }
        });

        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (page.missing) {
            throw new Error('Article not found');
        }

        if (!page.revisions || !page.revisions[0]) {
            throw new Error('No content available');
        }

        return page.revisions[0].slots.main['*'];
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Usage
async function main() {
    const estimator = new SimpleWikipediaEstimator();
    
    try {
        const results = await estimator.estimateFactTags(500); // Smaller sample
        
        console.log('\n=== ESTIMATION RESULTS ===');
        console.log(`Sample size: ${results.sampleSize}`);
        console.log(`Estimated total fact tags: ${Math.round(results.estimatedTotal).toLocaleString()}`);
        console.log(`95% Confidence interval: ${Math.round(results.confidenceInterval.lower).toLocaleString()} - ${Math.round(results.confidenceInterval.upper).toLocaleString()}`);
        
    } catch (error) {
        console.error('Estimation failed:', error.message);
    }
}

if (require.main === module) {
    main();
}