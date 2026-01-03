export type RobbyReceipt = {
    id: string;
    timestamp: string;
    type: string;
    payload: any;
    signerKeyId?: string | null;
    signature?: string | null;
};
export declare function ensureReceiptsDir(): Promise<void>;
export declare function robbyReceipt(type: string, payload?: any): Promise<RobbyReceipt>;
//# sourceMappingURL=robby-receipt.d.ts.map