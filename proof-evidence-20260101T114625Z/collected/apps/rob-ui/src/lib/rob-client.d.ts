export interface RobSession {
    id: string;
    state: string;
    progress: number;
    readiness: string;
    consent_granted: boolean;
}
export interface RobMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
}
export interface RobReceipt {
    id: string;
    type: string;
    details: Record<string, any>;
    timestamp: string;
}
declare class RobClient {
    private baseUrl;
    initSession(templateId?: string): Promise<{
        session: RobSession;
        messages: RobMessage[];
    }>;
    sendMessage(sessionId: string, message: string): Promise<{
        response: string;
        session: RobSession;
        system_message?: string;
    }>;
    getReceipts(sessionId: string): Promise<RobReceipt[]>;
    writeReceipt(receipt: {
        sessionId?: string;
        type: string;
        details: Record<string, any>;
        causedBy?: any;
    }): Promise<any>;
}
export declare const robClient: RobClient;
export {};
//# sourceMappingURL=rob-client.d.ts.map