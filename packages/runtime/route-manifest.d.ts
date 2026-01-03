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
export declare const ENGINE_KEYS: readonly ["execution", "identity", "charter", "config", "paywall", "notifications", "sight", "silent"];
export type EngineKey = typeof ENGINE_KEYS[number];
export interface RouteDefinition {
    path: string;
    pageFile: string;
    description: string;
    category: 'page' | 'api' | 'engine-detail';
}
export declare const ROUTES: Record<string, RouteDefinition>;
/**
 * Navigation graph - defines allowed forward/back navigation patterns
 */
export declare const NAV_GRAPH: Record<string, string[]>;
/**
 * Validate if a path is a known valid route
 */
export declare function isValidRoute(path: string): boolean;
/**
 * Get all page routes (excludes API routes)
 */
export declare function getPageRoutes(): RouteDefinition[];
/**
 * Get all API routes
 */
export declare function getApiRoutes(): RouteDefinition[];
/**
 * Get all engine detail routes
 */
export declare function getEngineRoutes(): RouteDefinition[];
//# sourceMappingURL=route-manifest.d.ts.map