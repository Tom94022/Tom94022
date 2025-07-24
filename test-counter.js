// test-counter.js - Test script to verify fact tag detection
const FactTagCounter = require('./fact-tag-counter');

function testFactTagCounter() {
    const counter = new FactTagCounter();
    
    // Test cases with various fact tag formats
    const testCases = [
        {
            name: "Basic citation needed tags",
            text: "This is a statement{{citation needed}} and another{{fact}} and also{{cn}}.",
            expected: 3
        },
        {
            name: "Tags with parameters",
            text: "Statement{{citation needed|date=July 2025}} and {{fact|reason=needs verification|date=July 2025}}.",
            expected: 2
        },
        {
            name: "Mixed verification tags",
            text: "Text{{dubious}} and {{better source needed}} and {{according to whom?}}.",
            expected: 3
        },
        {
            name: "Question tags",
            text: "Statement{{when?}} and {{where?}} and {{by whom?}} and {{which?}}.",
            expected: 4
        },
        {
            name: "Source quality tags",
            text: "Info{{unreliable source?}} and {{verify source}} and {{primary source needed}}.",
            expected: 3
        },
        {
            name: "Complex real-world example",
            text: `John Smith was born in 1985{{citation needed}} in New York{{dubious}}. He attended Harvard University{{better source needed|date=July 2025}} where he studied physics{{fact}}. According to some sources{{according to whom?}}, he later worked at NASA{{verify source}} for five years{{when?}}.`,
            expected: 6
        },
        {
            name: "No fact tags",
            text: "This is a well-sourced statement with proper citations.<ref>Source 1</ref> Another statement.<ref>Source 2</ref>",
            expected: 0
        },
        {
            name: "Case sensitivity test",
            text: "Statement{{Citation Needed}} and {{FACT}} and {{Cn}}.",
            expected: 3 // Should match case-insensitively
        }
    ];

    console.log('=== FACT TAG COUNTER TESTS ===\n');
    
    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
        const result = counter.countFactTags(testCase.text);
        const success = result === testCase.expected;
        
        console.log(`Test: ${testCase.name}`);
        console.log(`Expected: ${testCase.expected}, Got: ${result} ${success ? '✓' : '✗'}`);
        
        if (!success) {
            console.log(`Text: ${testCase.text}`);
            const detailed = counter.countFactTagsDetailed(testCase.text);
            console.log(`Breakdown:`, detailed.breakdown);
        }
        console.log('');
        
        if (success) passed++;
        else failed++;
    }

    console.log(`=== TEST RESULTS ===`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Total: ${passed + failed}`);
    
    if (failed === 0) {
        console.log('🎉 All tests passed!');
    } else {
        console.log(`❌ ${failed} test(s) failed`);
    }

    // Demonstrate detailed analysis
    console.log('\n=== DETAILED ANALYSIS EXAMPLE ===');
    const sampleText = `
    The population was 50,000{{citation needed}} in 2020. The city was founded in 1850{{dubious}} 
    by settlers{{who?}} from the eastern states{{which?}}. The economy relies on tourism{{better source needed}} 
    and agriculture{{verify source}}. Recent studies{{according to whom?}} suggest growth of 5% annually{{fact|date=July 2025}}.
    `;
    
    const detailed = counter.countFactTagsDetailed(sampleText);
    console.log(`Total tags found: ${detailed.total}`);
    console.log('Examples found:', detailed.examples);
    
    const categorized = counter.categorizeFactTags(sampleText);
    console.log('\nTags by category:');
    for (const [category, tags] of Object.entries(categorized)) {
        if (tags.length > 0) {
            console.log(`  ${category}: ${tags.length} (${tags.join(', ')})`);
        }
    }
}

if (require.main === module) {
    testFactTagCounter();
}

module.exports = testFactTagCounter;