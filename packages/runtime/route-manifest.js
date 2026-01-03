"use strict";
/**
 * ROUTE MANIFEST - Single Source of Truth
 *
 * This file defines all valid routes in the QuietBuild OS proof-harness.
 * It is used by:
 * - UI components (to generate navigation links)
 * - CI verification (to ensure all routes have corresponding page files)
 * - Not-found handling (to validate route existence)
 *
 * TRUTHGATE: Any route not in this manifest is considered Unknown.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.NAV_GRAPH = exports.ROUTES = exports.ENGINE_KEYS = void 0;
exports.isValidRoute = isValidRoute;
exports.getPageRoutes = getPageRoutes;
exports.getApiRoutes = getApiRoutes;
exports.getEngineRoutes = getEngineRoutes;
exports.ENGINE_KEYS = [
    'execution',
    'identity',
    'charter',
    'config',
    'paywall',
    'notifications',
    'sight',
    'silent',
];
exports.ROUTES = {
    // Pages
    home: {
        path: '/',
        pageFile: 'app/page.tsx',
        description: 'Dashboard with engine overview',
        category: 'page',
    },
    robBuild: {
        path: '/build',
        pageFile: 'app/build/page.tsx',
        description: 'Rob the QuietBuilder chat interface',
        category: 'page',
    },
    robVerticalSlice: {
        path: '/rob',
        pageFile: 'app/rob/page.tsx',
        description: 'Rob minimal vertical slice (deterministic, real DB)',
        category: 'page',
    },
    notFound: {
        path: '/not-found',
        pageFile: 'app/not-found.tsx',
        description: 'Universal safe fallback page',
        category: 'page',
    },
    // Engine Detail Pages (dynamic routes)
    engineExecution: {
        path: '/engines/execution',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'ExecutionEngine detail page',
        category: 'engine-detail',
    },
    engineIdentity: {
        path: '/engines/identity',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'IdentityEngine detail page',
        category: 'engine-detail',
    },
    engineCharter: {
        path: '/engines/charter',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'CharterEngine detail page',
        category: 'engine-detail',
    },
    engineConfig: {
        path: '/engines/config',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'ConfigEngine detail page',
        category: 'engine-detail',
    },
    enginePaywall: {
        path: '/engines/paywall',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'PaywallEngine detail page',
        category: 'engine-detail',
    },
    engineNotifications: {
        path: '/engines/notifications',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'NotificationsEngine detail page',
        category: 'engine-detail',
    },
    engineSight: {
        path: '/engines/sight',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'SightEngine detail page',
        category: 'engine-detail',
    },
    engineSilent: {
        path: '/engines/silent',
        pageFile: 'app/engines/[engineKey]/page.tsx',
        description: 'SilentEngine detail page',
        category: 'engine-detail',
    },
    // API Routes
    apiHealth: {
        path: '/api/health',
        pageFile: 'app/api/health/route.ts',
        description: 'System health check',
        category: 'api',
    },
    apiAiInvoke: {
        path: '/api/ai/invoke',
        pageFile: 'app/api/ai/invoke/route.ts',
        description: 'SilentEngine AI routing',
        category: 'api',
    },
    apiCharterConsent: {
        path: '/api/charter/consent/accept',
        pageFile: 'app/api/charter/consent/accept/route.ts',
        description: 'CharterEngine consent acceptance',
        category: 'api',
    },
    apiIdentitySession: {
        path: '/api/identity/session/create',
        pageFile: 'app/api/identity/session/create/route.ts',
        description: 'IdentityEngine session creation',
        category: 'api',
    },
    apiConfigEvaluate: {
        path: '/api/config/evaluate',
        pageFile: 'app/api/config/evaluate/route.ts',
        description: 'ConfigEngine feature flag evaluation',
        category: 'api',
    },
    apiPaywallEntitlements: {
        path: '/api/paywall/entitlements',
        pageFile: 'app/api/paywall/entitlements/route.ts',
        description: 'PaywallEngine entitlement check',
        category: 'api',
    },
    apiNotificationsEnqueue: {
        path: '/api/notifications/enqueue',
        pageFile: 'app/api/notifications/enqueue/route.ts',
        description: 'NotificationsEngine message enqueue',
        category: 'api',
    },
    apiSightTrack: {
        path: '/api/sight/track',
        pageFile: 'app/api/sight/track/route.ts',
        description: 'SightEngine quality tracking',
        category: 'api',
    },
    apiRobSession: {
        path: '/api/rob/session',
        pageFile: 'app/api/rob/session/route.ts',
        description: 'Rob session creation',
        category: 'api',
    },
    apiRobChat: {
        path: '/api/rob/chat',
        pageFile: 'app/api/rob/chat/route.ts',
        description: 'Rob chat endpoint with TruthSerum',
        category: 'api',
    },
    apiRobInit: {
        path: '/api/rob/init',
        pageFile: 'app/api/rob/init/route.ts',
        description: 'Rob vertical slice session init',
        category: 'api',
    },
    apiRobMessage: {
        path: '/api/rob/message',
        pageFile: 'app/api/rob/message/route.ts',
        description: 'Rob vertical slice message handler',
        category: 'api',
    },
};
/**
 * Navigation graph - defines allowed forward/back navigation patterns
 */
exports.NAV_GRAPH = {
    '/': ['/engines/*', '/api/health'],
    '/engines/execution': ['/'],
    '/engines/identity': ['/'],
    '/engines/charter': ['/'],
    '/engines/config': ['/'],
    '/engines/paywall': ['/'],
    '/engines/notifications': ['/'],
    '/engines/sight': ['/'],
    '/engines/silent': ['/'],
};
/**
 * Validate if a path is a known valid route
 */
function isValidRoute(path) {
    // Check exact matches
    if (Object.values(exports.ROUTES).some((route) => route.path === path)) {
        return true;
    }
    // Check engine dynamic routes
    const engineMatch = path.match(/^\/engines\/([^\/]+)$/);
    if (engineMatch) {
        const engineKey = engineMatch[1];
        return exports.ENGINE_KEYS.includes(engineKey);
    }
    return false;
}
/**
 * Get all page routes (excludes API routes)
 */
function getPageRoutes() {
    return Object.values(exports.ROUTES).filter((route) => route.category === 'page' || route.category === 'engine-detail');
}
/**
 * Get all API routes
 */
function getApiRoutes() {
    return Object.values(exports.ROUTES).filter((route) => route.category === 'api');
}
/**
 * Get all engine detail routes
 */
function getEngineRoutes() {
    return Object.values(exports.ROUTES).filter((route) => route.category === 'engine-detail');
}
//# sourceMappingURL=route-manifest.js.map