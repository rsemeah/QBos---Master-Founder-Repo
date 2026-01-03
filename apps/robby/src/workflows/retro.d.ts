export declare function retro(): Promise<{
    status: string;
    result: {
        timestamp: string;
        reports: number;
        localReceiptsCount: number;
        unknownsCount: number;
        unknowns: {
            id: string | null;
            classification: any;
            verification: any;
        }[];
    };
    receipt: import("../util/robby-receipt.js").RobbyReceipt;
}>;
//# sourceMappingURL=retro.d.ts.map