// wikipedia-api.js - Wikipedia API interaction using categories and proper sampling
const fetch = require('node-fetch');

class WikipediaAPI {
    constructor() {
        this.baseUrl = 'https://en.wikipedia.org/w/api.php';
        this.userAgent = 'FactTagEstimator/2.0 (Educational Research; Statistical Sampling)';
        this.categoryName = 'All articles with unsourced statements';
    }

    async getTotalArticlesWithFactTags() {
        console.log(`Querying category: "${this.categoryName}"`);
        
        const params = new URLSearchParams({
            action: 'query',
            list: 'categorymembers',
            cmtitle: `Category:${this.categoryName}`,
            cmnamespace: '0', // Main namespace only (articles)
            cmlimit: '1', // We only need the count
            format: 'json'
        });

        const response = await fetch(`${this.baseUrl}?${params}`, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!response.ok) {
            throw new Error(`Wikipedia API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`Wikipedia API error: ${data.error.info}`);
        }

        if (!data.query || !data.query.categorymembers) {
            throw new Error('Invalid response from categorymembers query');
        }

        // Get the total count from the response
        const totalCount = data.query.categorymembers.length > 0 ? 
            await this.getFullCategoryCount() : 0;

        return totalCount;
    }

    async getFullCategoryCount() {
        // Get the exact count by using the category info
        const params = new URLSearchParams({
            action: 'query',
            titles: `Category:${this.categoryName}`,
            prop: 'categoryinfo',
            format: 'json'
        });

        const response = await fetch(`${this.baseUrl}?${params}`, {
            headers: { 'User-Agent': this.userAgent }
        });

        const data = await response.json();
        const pages = data.query.pages;
        const pageId = Object.keys(pages)[0];
        
        if (pages[pageId].categoryinfo) {
            return pages[pageId].categoryinfo.pages || 0;
        }
        
        // Fallback: manually count by iterating through all members
        return await this.countCategoryMembers();
    }

    async countCategoryMembers() {
        let totalCount = 0;
        let cmcontinue = null;

        console.log('Counting all category members...');

        do {
            const params = new URLSearchParams({
                action: 'query',
                list: 'categorymembers',
                cmtitle: `Category:${this.categoryName}`,
                cmnamespace: '0', // Main namespace only
                cmlimit: '500', // Maximum allowed
                format: 'json'
            });

            if (cmcontinue) {
                params.set('cmcontinue', cmcontinue);
            }

            const response = await fetch(`${this.baseUrl}?${params}`, {
                headers: { 'User-Agent': this.userAgent }
            });

            const data = await response.json();
            
            if (!data.query || !data.query.categorymembers) {
                break;
            }

            totalCount += data.query.categorymembers.length;
            cmcontinue = data.continue ? data.continue.cmcontinue : null;

            if (totalCount % 1000 === 0) {
                console.log(`  Counted ${totalCount} articles so far...`);
            }

            await this.delay(100); // Rate limiting
        } while (cmcontinue);

        return totalCount;
    }

    async getRandomArticlesWithFactTags(sampleSize, totalArticles) {
        const articles = [];
        const seenTitles = new Set();
        const maxAttempts = Math.min(sampleSize * 2, 1000); // Don't make too many requests
        
        console.log(`Collecting random sample from ${totalArticles} total articles...`);

        // Strategy: Use multiple random offsets to get a good sample
        const attempts = [];
        for (let i = 0; i < maxAttempts && articles.length < sampleSize; i++) {
            // Generate random offset within the total range
            const randomOffset = Math.floor(Math.random() * Math.max(1, totalArticles - 500));
            attempts.push(randomOffset);
        }

        // Remove duplicates and sort for more efficient API usage
        const uniqueOffsets = [...new Set(attempts)].sort((a, b) => a - b);

        for (const offset of uniqueOffsets) {
            if (articles.length >= sampleSize) break;

            try {
                const batch = await this.getCategoryMembersBatch(offset, Math.min(50, sampleSize - articles.length));
                
                for (const article of batch) {
                    if (!seenTitles.has(article.title) && articles.length < sampleSize) {
                        seenTitles.add(article.title);
                        articles.push(article);
                    }
                }

                console.log(`  Collected ${articles.length}/${sampleSize} articles...`);
                await this.delay(200); // Rate limiting
                
            } catch (error) {
                console.warn(`Error fetching batch at offset ${offset}:`, error.message);
                continue;
            }
        }

        return articles;
    }

    async getCategoryMembersBatch(offset, limit) {
        const params = new URLSearchParams({
            action: 'query',
            list: 'categorymembers',
            cmtitle: `Category:${this.categoryName}`,
            cmnamespace: '0', // Main namespace only
            cmlimit: limit.toString(),
            cmstart: offset.toString(),
            format: 'json'
        });

        const response = await fetch(`${this.baseUrl}?${params}`, {
            headers: { 'User-Agent': this.userAgent }
        });

        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`API error: ${data.error.info}`);
        }

        return data.query.categorymembers || [];
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

        if (!response.ok) {
            throw new Error(`Failed to fetch article content: ${response.status}`);
        }

        const data = await response.json();
        
        if (data.error) {
            throw new Error(`API error: ${data.error.info}`);
        }

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

module.exports = WikipediaAPI;
