"use strict";
/**
 * IDEA DECOMPOSER
 *
 * Generates intelligence receipts from user prompts.
 * This is the engine that demonstrates Rob's intelligence.
 *
 * RULE-BASED: Uses pattern matching and domain knowledge (deterministic)
 * AI-OPTIONAL: Can be enhanced with LLM calls, but works without them
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdeaDecomposer = void 0;
/**
 * Pattern matching for common app types
 */
const APP_PATTERNS = {
    // Gaming
    pokemon: {
        domain: 'gaming',
        keywords: ['pokemon', 'pokémon', 'monster', 'creature', 'catch', 'battle'],
        interpretations: [
            {
                name: 'Pokedex Companion',
                description: 'Encyclopedia of creatures with stats, types, and evolutions',
                feasibility: 'high',
                complexity: 'moderate',
            },
            {
                name: 'Battle Simulator',
                description: 'Turn-based battle system with type advantages and moves',
                feasibility: 'medium',
                complexity: 'complex',
            },
            {
                name: 'Collection Tracker',
                description: 'Track owned creatures, manage inventory, trade with friends',
                feasibility: 'high',
                complexity: 'simple',
            },
        ],
        coreMechanics: ['collection', 'stats', 'types', 'evolution', 'inventory'],
        essentialFeatures: ['creature cards', 'search/filter', 'detail view', 'favorites'],
        risks: {
            type: 'ip_violation',
            severity: 'high',
            description: 'Pokémon is a protected trademark owned by Nintendo/Game Freak',
            safeAlternative: 'MonsterDex - A creature collection app inspired by monster-catching games',
        },
    },
    // Task Management
    task: {
        domain: 'productivity',
        keywords: ['task', 'todo', 'checklist', 'reminder', 'productivity'],
        interpretations: [
            {
                name: 'Simple Task List',
                description: 'Basic add/complete/delete with local storage',
                feasibility: 'high',
                complexity: 'simple',
            },
            {
                name: 'Project Manager',
                description: 'Tasks organized by projects with due dates and priorities',
                feasibility: 'high',
                complexity: 'moderate',
            },
            {
                name: 'Team Collaboration',
                description: 'Shared tasks, assignments, comments, and real-time sync',
                feasibility: 'medium',
                complexity: 'complex',
            },
        ],
        coreMechanics: ['add', 'delete', 'complete', 'filter', 'sort'],
        essentialFeatures: [
            'task input',
            'completion toggle',
            'priority levels',
            'due dates',
            'categories',
            'search',
            'persistence',
        ],
        risks: null,
    },
    // E-commerce
    shop: {
        domain: 'ecommerce',
        keywords: ['shop', 'store', 'ecommerce', 'cart', 'buy', 'sell', 'product'],
        interpretations: [
            {
                name: 'Product Catalog',
                description: 'Browse and search products with detailed information',
                feasibility: 'high',
                complexity: 'moderate',
            },
            {
                name: 'Full E-commerce Platform',
                description: 'Cart, checkout, payments, order management, inventory',
                feasibility: 'medium',
                complexity: 'complex',
            },
            {
                name: 'Marketplace',
                description: 'Multi-vendor platform with seller dashboards and commission',
                feasibility: 'low',
                complexity: 'complex',
            },
        ],
        coreMechanics: ['browse', 'search', 'cart', 'checkout', 'payment'],
        essentialFeatures: [
            'product grid',
            'filters',
            'product details',
            'cart management',
            'checkout flow',
        ],
        risks: {
            type: 'legal',
            severity: 'medium',
            description: 'Payment processing requires PCI compliance and legal terms',
            safeAlternative: 'Start with product catalog, add Stripe checkout later',
        },
    },
    // Social/Chat
    chat: {
        domain: 'social',
        keywords: ['chat', 'message', 'social', 'post', 'comment', 'feed'],
        interpretations: [
            {
                name: 'Simple Chat Room',
                description: 'Real-time messages in a single room',
                feasibility: 'high',
                complexity: 'moderate',
            },
            {
                name: 'Direct Messaging',
                description: 'Private 1-on-1 conversations with history',
                feasibility: 'medium',
                complexity: 'moderate',
            },
            {
                name: 'Social Feed',
                description: 'Posts, likes, comments, follows - full social network',
                feasibility: 'medium',
                complexity: 'complex',
            },
        ],
        coreMechanics: ['send', 'receive', 'real-time sync', 'history'],
        essentialFeatures: ['message input', 'message list', 'timestamps', 'user names'],
        risks: {
            type: 'legal',
            severity: 'high',
            description: 'Content moderation and user safety required for public chat',
            safeAlternative: 'Start with private rooms requiring invite codes',
        },
    },
};
/**
 * Detect domain and pattern from user prompt
 */
function detectPattern(prompt) {
    const normalizedPrompt = prompt.toLowerCase();
    for (const [patternName, pattern] of Object.entries(APP_PATTERNS)) {
        const matchCount = pattern.keywords.filter((keyword) => normalizedPrompt.includes(keyword)).length;
        if (matchCount > 0) {
            return {
                pattern: patternName,
                confidence: matchCount / pattern.keywords.length,
            };
        }
    }
    return { pattern: null, confidence: 0 };
}
/**
 * Idea Decomposer - Rule-based intelligence
 */
class IdeaDecomposer {
    /**
     * Decompose a user prompt into intelligence receipts
     *
     * ALWAYS emits minimum 3 receipts:
     * 1. idea.decomposed
     * 2. concept.inferred
     * 3. direction.recommended
     *
     * May emit additional receipts:
     * 4. domain.risk_detected (if risks found)
     * 5. alternatives.proposed (if risks require alternatives)
     */
    async decompose(sessionId, messageId, userPrompt) {
        const receipts = [];
        // Detect pattern
        const detection = detectPattern(userPrompt);
        if (detection.pattern) {
            // Known pattern - use domain knowledge
            const pattern = APP_PATTERNS[detection.pattern];
            // Receipt 1: Idea Decomposition
            const ideaReceipt = {
                type: 'idea.decomposed',
                sessionId,
                messageId,
                details: {
                    originalPrompt: userPrompt,
                    interpretations: pattern.interpretations,
                    detectedDomain: pattern.domain,
                    targetAudience: this.inferAudience(userPrompt, pattern.domain),
                },
                truthState: 'Verified',
                timestamp: new Date().toISOString(),
            };
            receipts.push(ideaReceipt);
            // Receipt 2: Concept Inference
            const conceptReceipt = {
                type: 'concept.inferred',
                sessionId,
                messageId,
                details: {
                    coreMechanics: pattern.coreMechanics,
                    essentialFeatures: pattern.essentialFeatures,
                    technicalApproach: this.inferTechnicalApproach(pattern.domain),
                    dataModel: this.inferDataModel(pattern.coreMechanics),
                },
                truthState: 'Verified',
                timestamp: new Date().toISOString(),
            };
            receipts.push(conceptReceipt);
            // Receipt 3: Direction Recommendation
            const recommendedInterpretation = pattern.interpretations.find((i) => i.feasibility === 'high') || pattern.interpretations[0];
            const directionReceipt = {
                type: 'direction.recommended',
                sessionId,
                messageId,
                details: {
                    recommendedInterpretation: recommendedInterpretation.name,
                    reasoning: `Starting with ${recommendedInterpretation.name} because it has ${recommendedInterpretation.feasibility} feasibility and ${recommendedInterpretation.complexity} complexity. This provides the fastest path to a working app.`,
                    safetyLevel: pattern.risks ? 'caution' : 'safe',
                    estimatedComplexity: recommendedInterpretation.complexity,
                    nextSteps: this.generateNextSteps(pattern.domain, recommendedInterpretation.name),
                },
                truthState: 'Verified',
                timestamp: new Date().toISOString(),
            };
            receipts.push(directionReceipt);
            // Receipt 4: Risk Detection (if applicable)
            if (pattern.risks) {
                const riskReceipt = {
                    type: 'domain.risk_detected',
                    sessionId,
                    messageId,
                    details: {
                        riskType: pattern.risks.type,
                        severity: pattern.risks.severity,
                        description: pattern.risks.description,
                        requiresConsent: pattern.risks.severity === 'high',
                        safeAlternative: pattern.risks.safeAlternative,
                    },
                    truthState: 'Verified',
                    timestamp: new Date().toISOString(),
                };
                receipts.push(riskReceipt);
            }
            return {
                receipts,
                summary: {
                    domain: pattern.domain,
                    interpretations: pattern.interpretations.length,
                    hasRisks: !!pattern.risks,
                    recommendedPath: recommendedInterpretation.name,
                },
            };
        }
        else {
            // Unknown pattern - generic decomposition
            return this.genericDecomposition(sessionId, messageId, userPrompt);
        }
    }
    /**
     * Generic decomposition for unknown patterns
     */
    genericDecomposition(sessionId, messageId, userPrompt) {
        const receipts = [];
        // Generic idea decomposition
        const ideaReceipt = {
            type: 'idea.decomposed',
            sessionId,
            messageId,
            details: {
                originalPrompt: userPrompt,
                interpretations: [
                    {
                        name: 'Custom Application',
                        description: `A custom web application based on: "${userPrompt}"`,
                        feasibility: 'medium',
                        complexity: 'moderate',
                    },
                ],
                detectedDomain: 'general',
                targetAudience: 'general users',
            },
            truthState: 'Verified',
            timestamp: new Date().toISOString(),
        };
        receipts.push(ideaReceipt);
        // Generic concept inference
        const conceptReceipt = {
            type: 'concept.inferred',
            sessionId,
            messageId,
            details: {
                coreMechanics: ['create', 'read', 'update', 'delete'],
                essentialFeatures: ['data input', 'data display', 'search', 'persistence'],
                technicalApproach: 'React SPA with TypeScript and Tailwind CSS',
                dataModel: 'Entities with standard CRUD operations',
            },
            truthState: 'Verified',
            timestamp: new Date().toISOString(),
        };
        receipts.push(conceptReceipt);
        // Generic direction recommendation
        const directionReceipt = {
            type: 'direction.recommended',
            sessionId,
            messageId,
            details: {
                recommendedInterpretation: 'Custom Application',
                reasoning: 'Building a custom application with standard CRUD operations and modern React architecture.',
                safetyLevel: 'safe',
                estimatedComplexity: 'moderate',
                nextSteps: [
                    'Define data structure',
                    'Create UI components',
                    'Implement state management',
                    'Add persistence layer',
                ],
            },
            truthState: 'Verified',
            timestamp: new Date().toISOString(),
        };
        receipts.push(directionReceipt);
        return {
            receipts,
            summary: {
                domain: 'general',
                interpretations: 1,
                hasRisks: false,
                recommendedPath: 'Custom Application',
            },
        };
    }
    /**
     * Infer target audience from prompt and domain
     */
    inferAudience(prompt, domain) {
        const lowerPrompt = prompt.toLowerCase();
        if (lowerPrompt.includes('kid') || lowerPrompt.includes('child'))
            return 'children';
        if (lowerPrompt.includes('business') || lowerPrompt.includes('enterprise'))
            return 'professionals';
        if (lowerPrompt.includes('student') || lowerPrompt.includes('learn'))
            return 'students';
        // Domain defaults
        const domainAudiences = {
            gaming: 'gamers and collectors',
            productivity: 'professionals and students',
            ecommerce: 'shoppers and sellers',
            social: 'general public',
        };
        return domainAudiences[domain] || 'general users';
    }
    /**
     * Infer technical approach based on domain
     */
    inferTechnicalApproach(domain) {
        const approaches = {
            gaming: 'React SPA with state management and local storage',
            productivity: 'React with TypeScript, Tailwind CSS, and localStorage',
            ecommerce: 'Next.js with Stripe integration and Supabase database',
            social: 'Next.js with real-time subscriptions (Supabase)',
        };
        return approaches[domain] || 'React SPA with TypeScript and Tailwind CSS';
    }
    /**
     * Infer data model from core mechanics
     */
    inferDataModel(mechanics) {
        if (mechanics.includes('collection')) {
            return 'Collection entity with items, each with properties and relationships';
        }
        if (mechanics.includes('add') && mechanics.includes('complete')) {
            return 'Task entity with status, priority, dates, and categories';
        }
        if (mechanics.includes('cart') && mechanics.includes('checkout')) {
            return 'Product and Order entities with Cart state management';
        }
        if (mechanics.includes('send') && mechanics.includes('receive')) {
            return 'Message entity with sender, recipient, timestamp, and content';
        }
        return 'Generic entity with CRUD operations';
    }
    /**
     * Generate next steps based on domain and interpretation
     */
    generateNextSteps(domain, interpretation) {
        // Gaming domain
        if (domain === 'gaming') {
            if (interpretation.includes('Pokedex') || interpretation.includes('Collection')) {
                return [
                    'Define creature data structure (name, type, stats)',
                    'Create creature card component',
                    'Build search and filter interface',
                    'Add detail view with evolution chain',
                    'Implement favorites/collection tracking',
                ];
            }
            if (interpretation.includes('Battle')) {
                return [
                    'Design battle system (turn-based logic)',
                    'Create move/attack data structure',
                    'Build battle UI with animations',
                    'Implement type effectiveness system',
                    'Add battle results and rewards',
                ];
            }
        }
        // Productivity domain
        if (domain === 'productivity') {
            return [
                'Create task data structure',
                'Build task input component',
                'Implement task list with completion toggle',
                'Add priority and due date fields',
                'Build filter and sort controls',
                'Implement local storage persistence',
            ];
        }
        // E-commerce domain
        if (domain === 'ecommerce') {
            return [
                'Define product schema',
                'Build product grid with images',
                'Create product detail page',
                'Implement cart state management',
                'Build checkout flow',
                'Integrate Stripe payments',
            ];
        }
        // Social domain
        if (domain === 'social') {
            return [
                'Design message data structure',
                'Create real-time subscription',
                'Build message input component',
                'Implement message list with scrolling',
                'Add user authentication',
                'Create room/channel system',
            ];
        }
        // Generic
        return [
            'Define data structure',
            'Create input components',
            'Build display/list view',
            'Add search and filter',
            'Implement persistence',
        ];
    }
}
exports.IdeaDecomposer = IdeaDecomposer;
//# sourceMappingURL=IdeaDecomposer.js.map