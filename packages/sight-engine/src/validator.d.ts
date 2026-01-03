/**
 * SightEngine™ - Validation Utilities
 *
 * 11 validation functions to enforce visual quality standards
 */
import { AssetSpec, ValidationResult, QualityTier, QualityTierSpec, LogoRequirements, RejectionCriteria, AssetType } from './types';
/**
 * 1. Validate complete asset against tier requirements
 */
export declare function validateAsset(spec: AssetSpec, assetType: AssetType, tier: QualityTier): ValidationResult;
/**
 * 2. Validate resolution meets tier minimum
 */
export declare function validateResolution(resolution: {
    width: number;
    height: number;
}, tierSpec: QualityTierSpec): {
    passed: boolean;
    errors: string[];
};
/**
 * 3. Validate camera specifications
 */
export declare function validateCameraSpec(camera: {
    model: string;
    lens: string;
    aperture: number;
}, tierSpec: QualityTierSpec): {
    passed: boolean;
    warnings: string[];
};
/**
 * 4. Validate lighting setup
 */
export declare function validateLighting(lighting: {
    setup: string;
    keyLight: any;
    colorTemperature: number;
}, requirement: 'cinematic' | 'professional' | 'acceptable'): {
    passed: boolean;
    errors: string[];
};
/**
 * 5. Validate composition rules
 */
export declare function validateComposition(composition: {
    rules: string[];
    silhouetteClarity: number;
    visualClutter: number;
}, tierSpec: QualityTierSpec): {
    passed: boolean;
    warnings: string[];
};
/**
 * 6. Validate video specifications
 */
export declare function validateVideoSpec(video: {
    frameRate: number;
    codec?: string;
}, tierSpec: QualityTierSpec): {
    passed: boolean;
    errors: string[];
};
/**
 * 7. Validate logo requirements (16px readable, 8K scalable)
 */
export declare function validateLogoRequirements(logo: LogoRequirements): {
    passed: boolean;
    errors: string[];
};
/**
 * 8. Check for AI artifacts (flat lighting, over-saturation)
 */
export declare function checkAIArtifacts(spec: AssetSpec): RejectionCriteria;
/**
 * 9. Calculate quality score (0-100)
 */
export declare function calculateQualityScore(spec: AssetSpec, tier: QualityTier): number;
/**
 * 10. Generate AI prompt header with SightEngine™ standards
 */
export declare function generatePromptHeader(tier?: QualityTier): string;
/**
 * 11. Validate complete asset pipeline (batch validation)
 */
export declare function validateAssetPipeline(assets: {
    spec: AssetSpec;
    type: AssetType;
    tier: QualityTier;
}[]): {
    passed: boolean;
    results: ValidationResult[];
    summary: {
        totalAssets: number;
        passed: number;
        failed: number;
        averageScore: number;
    };
};
//# sourceMappingURL=validator.d.ts.map