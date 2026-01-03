export declare function suggestTemplate(message: string): {
    templateId: string;
    templateName: string;
} | null;
export declare function detectTemplateSelection(message: string): {
    templateId: string;
    templateName: string;
} | null;
export declare function listTemplates(): {
    id: string;
    name: string;
}[];
//# sourceMappingURL=templateRouter.d.ts.map