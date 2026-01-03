type StepResult = {
    name: string;
    cmd: string;
    exitCode: number;
    stdout: string;
    stderr: string;
};
export declare function verify(cwd: string): Promise<{
    status: string;
    summary: {
        verified: number;
        failed: number;
        unknown: number;
        parseErrors: number;
    };
    steps: StepResult[];
}>;
export declare function certify(cwd: string): Promise<{
    status: string;
    verification: {
        status: string;
        summary: {
            verified: number;
            failed: number;
            unknown: number;
            parseErrors: number;
        };
        steps: StepResult[];
    };
}>;
export {};
//# sourceMappingURL=verification_clean.d.ts.map