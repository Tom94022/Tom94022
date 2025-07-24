// fact-tag-counter.js - Enhanced fact tag detection with comprehensive patterns
class FactTagCounter {
    constructor() {
        // Comprehensive regex patterns for all fact-checking templates
        this.factTagPatterns = [
            // Core citation needed tags
            /\{\{fact\}\}/gi,                           // {{fact}}
            /\{\{citation needed\}\}/gi,                // {{citation needed}}
            /\{\{cn\}\}/gi,                             // {{cn}}
            
            // With parameters (date, reason, etc.)
            /\{\{fact\|[^}]*\}\}/gi,                   // {{fact|date=...}}
            /\{\{citation needed\|[^}]*\}\}/gi,        // {{citation needed|date=...}}
            /\{\{cn\|[^}]*\}\}/gi,                     // {{cn|date=...}}
            
            // Source quality tags
            /\{\{better source needed\}\}/gi,           // {{better source needed}}
            /\{\{better source needed\|[^}]*\}\}/gi,    // {{better source needed|...}}
            /\{\{unreliable source\?\}\}/gi,            // {{unreliable source?}}
            /\{\{unreliable source\?\|[^}]*\}\}/gi,     // {{unreliable source?|...}}
            /\{\{verify source\}\}/gi,                  // {{verify source}}
            /\{\{verify source\|[^}]*\}\}/gi,           // {{verify source|...}}
            /\{\{primary source needed\}\}/gi,          // {{primary source needed}}
            /\{\{primary source needed\|[^}]*\}\}/gi,   // {{primary source needed|...}}
            /\{\{third-party needed\}\}/gi,             // {{third-party needed}}
            /\{\{third-party needed\|[^}]*\}\}/gi,      // {{third-party needed|...}}
            /\{\{sources needed\}\}/gi,                 // {{sources needed}}
            /\{\{sources needed\|[^}]*\}\}/gi,          // {{sources needed|...}}
            
            // Clarification and verification tags
            /\{\{dubious\}\}/gi,                        // {{dubious}}
            /\{\{dubious\|[^}]*\}\}/gi,                 // {{dubious|...}}
            /\{\{according to whom\?\}\}/gi,            // {{according to whom?}}
            /\{\{according to whom\?\|[^}]*\}\}/gi,     // {{according to whom?|...}}
            /\{\{by whom\?\}\}/gi,                      // {{by whom?}}
            /\{\{by whom\?\|[^}]*\}\}/gi,               // {{by whom?|...}}
            /\{\{when\?\}\}/gi,                         // {{when?}}
            /\{\{when\?\|[^}]*\}\}/gi,                  // {{when?|...}}
            /\{\{where\?\}\}/gi,                        // {{where?}}
            /\{\{where\?\|[^}]*\}\}/gi,                 // {{where?|...}}
            /\{\{which\?\}\}/gi,                        // {{which?}}
            /\{\{which\?\|[^}]*\}\}/gi,                 // {{which?|...}}
            /\{\{who\?\}\}/gi,                          // {{who?}}
            /\{\{who\?\|[^}]*\}\}/gi,                   // {{who?|...}}
            /\{\{how\?\}\}/gi,                          // {{how?}}
            /\{\{how\?\|[^}]*\}\}/gi,                   // {{how?|...}}
            /\{\{why\?\}\}/gi,                          // {{why?}}
            /\{\{why\?\|[^}]*\}\}/gi,                   // {{why?|...}}
            
            // Additional verification templates
            /\{\{failed verification\}\}/gi,            // {{failed verification}}
            /\{\{failed verification\|[^}]*\}\}/gi,     // {{failed verification|...}}
            /\{\{page needed\}\}/gi,                    // {{page needed}}
            /\{\{page needed\|[^}]*\}\}/gi,             // {{page needed|...}}
            /\{\{full citation needed\}\}/gi,           // {{full citation needed}}
            /\{\{full citation needed\|[^}]*\}\}/gi     // {{full citation needed|...}}
        ];
    }

    countFactTags(wikitext) {
        if (!wikitext || typeof wikitext !== 'string') {
            return 0;
        }

        let totalCount = 0;

        // Count matches for each pattern
        for (const pattern of this.factTagPatterns) {
            const matches = wikitext.match(pattern);
            if (matches) {
                totalCount += matches.length;
            }
        }

        return totalCount;
    }

    countFactTagsDetailed(wikitext) {
        if (!wikitext || typeof wikitext !== 'string') {
            return {
                total: 0,
                breakdown: [],
                examples: []
            };
        }

        let totalCount = 0;
        const breakdown = [];
        const allExamples = [];

        for (const pattern of this.factTagPatterns) {
            const matches = wikitext.match(pattern);
            if (matches) {
                const count = matches.length;
                totalCount += count;
                
                breakdown.push({
                    pattern: pattern.source,
                    count: count,
                    examples: matches.slice(0, 2) // First 2 examples per pattern
                });
                
                allExamples.push(...matches.slice(0, 2));
            }
        }

        return {
            total: totalCount,
            breakdown: breakdown,
            examples: allExamples.slice(0, 15) // Limit total examples
        };
    }

    // Helper method to categorize tags by type
    categorizeFactTags(wikitext) {
        const categories = {
            'Citation Needed': [],
            'Source Quality': [],
            'Clarification': [],
            'Verification': []
        };

        const categoryPatterns = {
            'Citation Needed': [
                /\{\{fact\}\}/gi,
                /\{\{citation needed\}\}/gi,
                /\{\{cn\}\}/gi,
                /\{\{fact\|[^}]*\}\}/gi,
                /\{\{citation needed\|[^}]*\}\}/gi,
                /\{\{cn\|[^}]*\}\}/gi
            ],
            'Source Quality': [
                /\{\{better source needed[^}]*\}\}/gi,
                /\{\{unreliable source\?[^}]*\}\}/gi,
                /\{\{verify source[^}]*\}\}/gi,
                /\{\{primary source needed[^}]*\}\}/gi,
                /\{\{third-party needed[^}]*\}\}/gi,
                /\{\{sources needed[^}]*\}\}/gi
            ],
            'Clarification': [
                /\{\{according to whom\?[^}]*\}\}/gi,
                /\{\{by whom\?[^}]*\}\}/gi,
                /\{\{when\?[^}]*\}\}/gi,
                /\{\{where\?[^}]*\}\}/gi,
                /\{\{which\?[^}]*\}\}/gi,
                /\{\{who\?[^}]*\}\}/gi,
                /\{\{how\?[^}]*\}\}/gi,
                /\{\{why\?[^}]*\}\}/gi
            ],
            'Verification': [
                /\{\{dubious[^}]*\}\}/gi,
                /\{\{failed verification[^}]*\}\}/gi,
                /\{\{page needed[^}]*\}\}/gi,
                /\{\{full citation needed[^}]*\}\}/gi
            ]
        };

        for (const [category, patterns] of Object.entries(categoryPatterns)) {
            for (const pattern of patterns) {
                const matches = wikitext.match(pattern);
                if (matches) {
                    categories[category].push(...matches);
                }
            }
        }

        return categories;
    }
}

module.exports = FactTagCounter;

