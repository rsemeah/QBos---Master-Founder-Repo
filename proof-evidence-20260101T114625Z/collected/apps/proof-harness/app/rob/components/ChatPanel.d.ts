/**
 * ChatPanel - Message list + input
 */
interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
    state?: string;
    missingProofs?: string[];
}
interface ChatPanelProps {
    messages: Message[];
    onSendMessage: (content: string) => void;
    disabled?: boolean;
}
export declare function ChatPanel({ messages, onSendMessage, disabled }: ChatPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=ChatPanel.d.ts.map