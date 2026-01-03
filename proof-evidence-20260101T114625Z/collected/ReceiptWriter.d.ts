export declare const ReceiptWriter: ReceiptWriterImpl;
export interface Receipt {
    id: string;
    createdAt: string;
    sessionId?: string | null;
    type: string;
    details: Record<string, any>;
    parentReceiptId?: string | null;
    signerKeyId?: string | null;
    signature?: string | null;
    algo?: string | null;
    nonce?: string | null;
    verification_hash?: string | null;
}
declare class ReceiptWriterImpl {
    private supabase;
    private useSupabase;
    private config;
    constructor();
    private generateId;
    private canonicalize;
    write(data: {
        sessionId?: string | null;
        type: string;
        details: Record<string, any>;
        parentReceiptId?: string | null;
    }): Promise<{
        id: string;
        hash: string;
    }>;
    writeReceipt(receipt: Omit<Receipt, 'id' | 'createdAt'>): Promise<Receipt>;
    verifyReceipt(receipt: any): Promise<boolean>;
    private writeToSupabase;
    private writeToLocalFile;
    readReceipts(sessionId?: string): Promise<Receipt[]>;
    private readFromLocalFile;
}
export declare const ReceiptWriter: ReceiptWriterImpl;
export default ReceiptWriter;
//# sourceMappingURL=ReceiptWriter.d.ts.map