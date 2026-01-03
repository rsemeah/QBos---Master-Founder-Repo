/**
 * PreviewPanel - Displays a preview summary of generated output.
 */
interface PreviewPanelProps {
    receipts: Array<{
        type?: string;
        details?: Record<string, unknown>;
    }>;
}
export declare function PreviewPanel({ receipts }: PreviewPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=PreviewPanel.d.ts.map