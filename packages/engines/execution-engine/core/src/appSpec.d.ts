export interface AppSpec {
    appName: string;
    description?: string;
    archetype: string;
    goals: string[];
    stack?: {
        frontend?: string;
        backend?: string;
        database?: string;
    };
    deployment?: {
        targets: string[];
    };
    capabilities?: string[];
}
export interface AppSpecValidationResult {
    ok: boolean;
    errors: string[];
}
export declare function validateAppSpec(spec: unknown): AppSpecValidationResult;
//# sourceMappingURL=appSpec.d.ts.map