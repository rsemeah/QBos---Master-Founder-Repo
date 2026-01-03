/**
 * SightEngine™ - Visual Quality Standards for QuietBuild OS™
 *
 * Enforces investor-grade visual quality across all brand assets.
 * Rejects AI-looking outputs, flat lighting, and low-quality visuals.
 */
/**
 * Quality tier definitions for visual assets
 * - A: Investor-grade (hero images, brand materials, public presentations)
 * - B: Product-grade (UI components, documentation images)
 * - C: Internal (sketches, wireframes, internal tools)
 */
export type QualityTier = 'A' | 'B' | 'C';
export interface QualityTierSpec {
    tier: QualityTier;
    name: string;
    description: string;
    minResolution: Resolution;
    minBitDepth: number;
    requiredColorSpace: ColorSpace[];
    cameraModels: CameraModel[];
    lensTypes: LensType[];
    apertureRange: [number, number];
    minFrameRate: number;
    lightingRequirement: 'cinematic' | 'professional' | 'acceptable';
    compositionRules: CompositionRule[];
}
export type CameraModel = 'ARRI-Alexa-65' | 'ARRI-Alexa-Mini-LF' | 'RED-V-Raptor-8K' | 'RED-Komodo-6K' | 'Sony-Venice' | 'Canon-C500-Mark-II' | 'Blackmagic-URSA-12K' | 'simulated-cinematic';
export type LensType = '50mm-prime' | '65mm-prime' | '80mm-prime' | '35mm-prime' | '100mm-prime' | 'zoom-lens' | 'macro-lens';
export interface CameraSpec {
    model: CameraModel;
    lens: LensType;
    aperture: number;
    focalLength?: number;
    iso?: number;
    shutterSpeed?: string;
}
export interface Resolution {
    width: number;
    height: number;
    label: '8K' | '6K' | '4K' | '2K' | 'HD' | 'SD';
}
export type AspectRatio = '16:9' | '21:9' | '4:3' | '1:1' | '9:16' | '2.39:1';
export declare const STANDARD_RESOLUTIONS: Record<string, Resolution>;
export type ColorSpace = 'ACEScg' | 'Display-P3' | 'sRGB' | 'Rec-709' | 'Rec-2020' | 'DCI-P3';
export type BitDepth = 8 | 10 | 12 | 16 | 32;
export interface ColorProfile {
    space: ColorSpace;
    bitDepth: BitDepth;
    gamma?: 'linear' | 'sRGB' | 'Rec-709' | 'HLG' | 'PQ';
    hdrCapable?: boolean;
}
export type LightingSetup = 'three-point' | 'rembrandt' | 'butterfly' | 'broad' | 'natural-window' | 'hard-dramatic';
export interface LightingSpec {
    setup: LightingSetup;
    keyLight: LightSource;
    fillLight?: LightSource;
    rimLight?: LightSource;
    ambientLight?: LightSource;
    colorTemperature: number;
    contrast: 'low' | 'medium' | 'high';
}
export interface LightSource {
    type: 'key' | 'fill' | 'rim' | 'ambient';
    intensity: number;
    angle?: number;
    softness: 'hard' | 'medium' | 'soft';
    color?: string;
}
export type CompositionRule = 'rule-of-thirds' | 'golden-ratio' | 'leading-lines' | 'symmetry' | 'frame-within-frame' | 'negative-space' | 'depth-of-field';
export interface CompositionSpec {
    rules: CompositionRule[];
    focalPoint: {
        x: number;
        y: number;
    };
    depthOfField: 'shallow' | 'medium' | 'deep';
    silhouetteClarity: number;
    visualClutter: number;
}
export interface VideoSpec {
    frameRate: number;
    duration: number;
    codec?: 'ProRes-422-HQ' | 'ProRes-4444' | 'H.265' | 'DNxHR';
    motionBlur: boolean;
    stabilization: 'none' | 'software' | 'gimbal' | 'tripod';
}
export interface LogoRequirements {
    minSize: {
        width: number;
        height: number;
    };
    maxSize: {
        width: number;
        height: number;
    };
    vectorFormat: boolean;
    readableAt16px: boolean;
    scalableTo8K: boolean;
    backgrounds: ('white' | 'black' | 'transparent')[];
    colorVariants: number;
}
export interface RejectionCriteria {
    flatAILighting: boolean;
    overSaturated: boolean;
    illegibleDetails: boolean;
    inconsistentShadows: boolean;
    fakeReflections: boolean;
    lowResUpscale: boolean;
    aiArtifacts: boolean;
    brandInconsistency: boolean;
}
export interface AssetSpec {
    resolution: Resolution;
    aspectRatio: AspectRatio;
    camera: CameraSpec;
    colorSpace: ColorSpace;
    bitDepth: BitDepth;
    lighting: LightingSpec;
    composition?: CompositionSpec;
    video?: VideoSpec;
    logo?: LogoRequirements;
}
export interface ValidationResult {
    passed: boolean;
    tier: QualityTier;
    score: number;
    errors: string[];
    warnings: string[];
    rejections: Partial<RejectionCriteria>;
    recommendations: string[];
}
export type AssetType = 'hero-image' | 'logo' | 'screenshot' | 'diagram' | 'video' | 'thumbnail' | 'icon';
export interface PromptHeader {
    cameraSpec: string;
    lightingSpec: string;
    qualityModifiers: string[];
    rejectionWarnings: string[];
}
export declare const QUALITY_TIER_SPECS: Record<QualityTier, QualityTierSpec>;
//# sourceMappingURL=types.d.ts.map