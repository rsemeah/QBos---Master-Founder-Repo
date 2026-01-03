/**
 * Intents Registry - Canonical definitions of what constitutes "ready"
 */
import { BuildIntent } from "../types";
export declare const IntentsRegistry: Record<string, BuildIntent>;
export declare function getIntent(intentId: string): BuildIntent | undefined;
export declare function listIntents(): BuildIntent[];
//# sourceMappingURL=registry.d.ts.map