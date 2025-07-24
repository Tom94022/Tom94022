// statistics-calculator.js - Enhanced statistical analysis
class StatisticsCalculator {
    calculateEstimate(tagCounts, totalTaggedArticles) {
        const counts = tagCounts.map(item => item.tagCount);
        const sampleSize = counts.length;
        
        if (sampleSize === 0) {
            throw new Error('No sample data provided');
        }
        
        // Basic statistics
        const sum = counts.reduce((a, b) => a + b, 0);
        const mean = sum / sampleSize;
        
        // Standard deviation
        const squaredDiffs = counts.map(count => Math.pow(count - mean, 2));
        const variance = squaredDiffs.reduce((a, b) => a + b, 0) / (sampleSize - 1);
        const standardDeviation = Math.sqrt(variance);
        
        // Standard error of the mean
        const standardError = standardDeviation / Math.sqrt(sampleSize);
        
        // 95% confidence interval for the mean
        const tValue = this.getTValue(sampleSize - 1, 0.05);
        const marginOfErrorMean = tValue * standardError;
        
        // Estimated total and its confidence interval
        const estimatedTotal = mean * totalTaggedArticles;
        const marginOfError = marginOfErrorMean * totalTaggedArticles;
        
        const confidenceInterval = {
            lower: Math.max(0, estimatedTotal - marginOfError),
            upper: estimatedTotal + marginOfError
        };

        // Additional statistics
        const sortedCounts = [...counts].sort((a, b) => a - b);
        const median = this.calculateMedian(sortedCounts);
        const mode = this.calculateMode(counts);
        const percentiles = this.calculatePercentiles(sortedCounts);

        return {
            sampleSize: sampleSize,
            totalTaggedArticles: totalTaggedArticles,
            averageTagsPerArticle: mean,
            standardDeviation: standardDeviation,
            standardError: standardError,
            estimatedTotal: estimatedTotal,
            marginOfError: marginOfError,
            confidenceInterval: confidenceInterval,
            sampleData: {
                min: Math.min(...counts),
                max: Math.max(...counts),
                median: median,
                mode: mode,
                percentiles: percentiles,
                counts: counts,
                articlesWithZeroTags: counts.filter(c => c === 0).length,
                articlesWithMultipleTags: counts.filter(c => c > 1).length
            },
            generateReport: () => this.generateReport({
                sampleSize,
                totalTaggedArticles,
                averageTagsPerArticle: mean,
                standardDeviation,
                estimatedTotal,
                confidenceInterval,
                marginOfError,
                sampleData: {
                    min: Math.min(...counts),
                    max: Math.max(...counts),
                    median,
                    mode,
                    percentiles
                }
            })
        };
    }

    calculateMedian(sortedNumbers) {
        const middle = Math.floor(sortedNumbers.length / 2);
        
        if (sortedNumbers.length % 2 === 0) {
            return (sortedNumbers[middle - 1] + sortedNumbers[middle]) / 2;
        } else {
            return sortedNumbers[middle];
        }
    }

    calculateMode(numbers) {
        const frequency = {};
        let maxFreq = 0;
        let modes = [];

        // Count frequencies
        for (const num of numbers) {
            frequency[num] = (frequency[num] || 0) + 1;
            if (frequency[num] > maxFreq) {
                maxFreq = frequency[num];
            }
        }

        // Find all numbers with maximum frequency
        for (const [num, freq] of Object.entries(frequency)) {
            if (freq === maxFreq) {
                modes.push(parseInt(num));
            }
        }

        return modes.length === Object.keys(frequency).length ? null : modes;
    }

    calculatePercentiles(sortedNumbers) {
        const percentiles = {};
        const percentilePoints = [25, 50, 75, 90, 95, 99];

        for (const p of percentilePoints) {
            const index = (p / 100) * (sortedNumbers.length - 1);
            if (Number.isInteger(index)) {
                percentiles[`p${p}`] = sortedNumbers[index];
            } else {
                const lower = Math.floor(index);
                const upper = Math.ceil(index);
                const weight = index - lower;
                percentiles[`p${p}`] = sortedNumbers[lower] * (1 - weight) + sortedNumbers[upper] * weight;
            }
        }

        return percentiles;
    }

    // Enhanced t-value lookup for better accuracy
    getTValue(degreesOfFreedom, alpha) {
        // For 95% confidence (alpha = 0.05)
        if (alpha === 0.05) {
            if (degreesOfFreedom >= 1000) return 1.96;
            if (degreesOfFreedom >= 500) return 1.96;
            if (degreesOfFreedom >= 200) return 1.97;
            if (degreesOfFreedom >= 100) return 1.98;
            if (degreesOfFreedom >= 60) return 2.00;
            if (degreesOfFreedom >= 40) return 2.02;
            if (degreesOfFreedom >= 30) return 2.04;
            if (degreesOfFreedom >= 25) return 2.06;
            if (degreesOfFreedom >= 20) return 2.09;
            if (degreesOfFreedom >= 15) return 2.13;
            if (degreesOfFreedom >= 10) return 2.23;
            if (degreesOfFreedom >= 5) return 2.57;
            return 2.78; // Conservative for very small samples
        }
        
        return 1.96; // Default to normal distribution
    }

    generateReport(results) {
        const now = new Date();
        
        return `
=== WIKIPEDIA FACT TAGS ESTIMATION REPORT ===
Generated: ${now.toISOString()}

METHODOLOGY:
• Random sampling from Wikipedia's "Category:All articles with unsourced statements"
• Sample size: ${results.sampleSize.toLocaleString()} articles
• Population: ${results.totalTaggedArticles.toLocaleString()} articles with fact tags
• Namespace: Main articles only (namespace 0)

SAMPLE STATISTICS:
• Mean tags per article: ${results.averageTagsPerArticle.toFixed(3)}
• Standard deviation: ${results.standardDeviation.toFixed(3)}
• Median: ${results.sampleData.median}
• Mode: ${results.sampleData.mode ? results.sampleData.mode.join(', ') : 'No mode'}
• Range: ${results.sampleData.min} - ${results.sampleData.max} tags per article

DISTRIBUTION:
• 25th percentile: ${results.sampleData.percentiles.p25.toFixed(1)} tags
• 75th percentile: ${results.sampleData.percentiles.p75.toFixed(1)} tags  
• 90th percentile: ${results.sampleData.percentiles.p90.toFixed(1)} tags
• 95th percentile: ${results.sampleData.percentiles.p95.toFixed(1)} tags

ESTIMATION RESULTS:
• Estimated total fact tags: ${Math.round(results.estimatedTotal).toLocaleString()}
• 95% Confidence interval: ${Math.round(results.confidenceInterval.lower).toLocaleString()} - ${Math.round(results.confidenceInterval.upper).toLocaleString()}
• Margin of error: ±${Math.round(results.marginOfError).toLocaleString()} tags
• Relative margin of error: ±${((results.marginOfError / results.estimatedTotal) * 100).toFixed(1)}%

INTERPRETATION:
We are 95% confident that the total number of fact tags across all Wikipedia 
articles is between ${Math.round(results.confidenceInterval.lower).toLocaleString()} and ${Math.round(results.confidenceInterval.upper).toLocaleString()}.

NOTES:
• This estimate includes all forms of fact-checking templates ({{citation needed}}, 
  {{fact}}, {{dubious}}, {{better source needed}}, etc.)
• Based on articles in the main namespace only
• Confidence interval accounts for sampling uncertainty
• Some articles may have been missed if not properly categorized

Statistical confidence: 95%
Sampling method: Random sampling from categorized population
        `;
    }
}

module.exports = StatisticsCalculator;