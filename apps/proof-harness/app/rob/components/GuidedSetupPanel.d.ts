/**
 * GuidedSetupPanel - Friendly, low-decision setup for non-technical users.
 */
interface PromptOption {
    id: string;
    label: string;
    message: string;
}
interface TemplateOption {
    id: string;
    name: string;
    description: string;
}
interface PaletteOption {
    id: string;
    name: string;
    swatches: string[];
}
interface GuidedSetupPanelProps {
    prompts: PromptOption[];
    templates: TemplateOption[];
    palettes: PaletteOption[];
    selectedTemplateId: string | null;
    selectedPaletteId: string | null;
    onSelectTemplate: (templateId: string) => void;
    onSelectPalette: (paletteId: string) => void;
    onSendPrompt: (message: string) => void;
}
export declare function GuidedSetupPanel({ prompts, templates, palettes, selectedTemplateId, selectedPaletteId, onSelectTemplate, onSelectPalette, onSendPrompt, }: GuidedSetupPanelProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=GuidedSetupPanel.d.ts.map