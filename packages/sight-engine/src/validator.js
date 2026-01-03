"use strict";
/**
 * SightEngine™ - Validation Utilities
 *
 * 11 validation functions to enforce visual quality standards
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAsset = validateAsset;
exports.validateResolution = validateResolution;
exports.validateCameraSpec = validateCameraSpec;
exports.validateLighting = validateLighting;
exports.validateComposition = validateComposition;
exports.validateVideoSpec = validateVideoSpec;
exports.validateLogoRequirements = validateLogoRequirements;
exports.checkAIArtifacts = checkAIArtifacts;
exports.calculateQualityScore = calculateQualityScore;
exports.generatePromptHeader = generatePromptHeader;
exports.validateAssetPipeline = validateAssetPipeline;
const types_1 = require("./types");
/**
 * 1. Validate complete asset against tier requirements
 */
function validateAsset(spec, assetType, tier) {
    const tierSpec = types_1.QUALITY_TIER_SPECS[tier];
    const errors = [];
    const warnings = [];
    const rejections = {};
    const recommendations = [];
    let score = 100;
    // Validate resolution
    const resolutionCheck = validateResolution(spec.resolution, tierSpec);
    if (!resolutionCheck.passed) {
        errors.push(...resolutionCheck.errors);
        score -= 20;
    }
    // Validate color space
    if (!tierSpec.requiredColorSpace.includes(spec.colorSpace)) {
        errors.push(`Color space ${spec.colorSpace} not in required: ${tierSpec.requiredColorSpace.join(', ')}`);
        score -= 15;
    }
    // Validate bit depth
    if (spec.bitDepth < tierSpec.minBitDepth) {
        errors.push(`Bit depth ${spec.bitDepth} below minimum ${tierSpec.minBitDepth}`);
        score -= 15;
    }
    // Validate camera
    const cameraCheck = validateCameraSpec(spec.camera, tierSpec);
    if (!cameraCheck.passed) {
        warnings.push(...cameraCheck.warnings);
        score -= 10;
    }
    // Validate lighting
    const lightingCheck = validateLighting(spec.lighting, tierSpec.lightingRequirement);
    if (!lightingCheck.passed) {
        errors.push(...lightingCheck.errors);
        rejections.flatAILighting = true;
        score -= 25;
    }
    // Validate composition (if provided)
    if (spec.composition) {
        const compositionCheck = validateComposition(spec.composition, tierSpec);
        if (!compositionCheck.passed) {
            warnings.push(...compositionCheck.warnings);
            score -= 10;
        }
    }
    // Validate video specs (if applicable)
    if (spec.video) {
        const videoCheck = validateVideoSpec(spec.video, tierSpec);
        if (!videoCheck.passed) {
            errors.push(...videoCheck.errors);
            score -= 15;
        }
    }
    // Validate logo requirements (if applicable)
    if (spec.logo && assetType === 'logo') {
        const logoCheck = validateLogoRequirements(spec.logo);
        if (!logoCheck.passed) {
            errors.push(...logoCheck.errors);
            score -= 20;
        }
    }
    // Add recommendations
    if (score >= 90) {
        recommendations.push('Asset meets high quality standards');
    }
    else if (score >= 75) {
        recommendations.push('Consider upgrading to higher tier specifications');
    }
    else {
        recommendations.push('Significant improvements needed to meet tier requirements');
    }
    return {
        passed: errors.length === 0,
        tier,
        score: Math.max(0, score),
        errors,
        warnings,
        rejections,
        recommendations,
    };
}
/**
 * 2. Validate resolution meets tier minimum
 */
function validateResolution(resolution, tierSpec) {
    const errors = [];
    const minRes = tierSpec.minResolution;
    if (resolution.width < minRes.width || resolution.height < minRes.height) {
        errors.push(`Resolution ${resolution.width}×${resolution.height} below minimum ${minRes.width}×${minRes.height} for tier ${tierSpec.tier}`);
    }
    return { passed: errors.length === 0, errors };
}
/**
 * 3. Validate camera specifications
 */
function validateCameraSpec(camera, tierSpec) {
    const warnings = [];
    // Check camera model
    if (!tierSpec.cameraModels.includes(camera.model)) {
        warnings.push(`Camera model ${camera.model} not in recommended list for tier ${tierSpec.tier}`);
    }
    // Check lens type
    if (!tierSpec.lensTypes.includes(camera.lens)) {
        warnings.push(`Lens type ${camera.lens} not in recommended list for tier ${tierSpec.tier}`);
    }
    // Check aperture range
    const [minAperture, maxAperture] = tierSpec.apertureRange;
    if (camera.aperture < minAperture || camera.aperture > maxAperture) {
        warnings.push(`Aperture f/${camera.aperture} outside recommended range f/${minAperture} - f/${maxAperture}`);
    }
    return { passed: warnings.length === 0, warnings };
}
/**
 * 4. Validate lighting setup
 */
function validateLighting(lighting, requirement) {
    const errors = [];
    // Cinematic requires 3-point or Rembrandt
    if (requirement === 'cinematic') {
        if (!['three-point', 'rembrandt', 'butterfly'].includes(lighting.setup)) {
            errors.push(`Cinematic quality requires three-point, Rembrandt, or butterfly lighting`);
        }
    }
    // Check color temperature (daylight: 5000-6500K, tungsten: 2700-3200K)
    if (lighting.colorTemperature < 2500 || lighting.colorTemperature > 7000) {
        errors.push(`Color temperature ${lighting.colorTemperature}K outside acceptable range (2500-7000K)`);
    }
    // Check for flat lighting (potential AI artifact)
    if (!lighting.keyLight) {
        errors.push('No key light defined - potential flat AI lighting');
    }
    return { passed: errors.length === 0, errors };
}
/**
 * 5. Validate composition rules
 */
function validateComposition(composition, tierSpec) {
    const warnings = [];
    // Check if required composition rules are followed
    for (const requiredRule of tierSpec.compositionRules) {
        if (!composition.rules.includes(requiredRule)) {
            warnings.push(`Missing recommended composition rule: ${requiredRule}`);
        }
    }
    // Check silhouette clarity (should be high)
    if (composition.silhouetteClarity < 70) {
        warnings.push(`Low silhouette clarity (${composition.silhouetteClarity}/100)`);
    }
    // Check visual clutter (should be low)
    if (composition.visualClutter > 40) {
        warnings.push(`High visual clutter (${composition.visualClutter}/100)`);
    }
    return { passed: warnings.length === 0, warnings };
}
/**
 * 6. Validate video specifications
 */
function validateVideoSpec(video, tierSpec) {
    const errors = [];
    // Check frame rate
    if (video.frameRate < tierSpec.minFrameRate) {
        errors.push(`Frame rate ${video.frameRate}fps below minimum ${tierSpec.minFrameRate}fps`);
    }
    // Cinematic should be 24fps
    if (tierSpec.tier === 'A' && video.frameRate !== 24 && video.frameRate !== 23.976) {
        errors.push(`Tier A (cinematic) requires 24fps, got ${video.frameRate}fps`);
    }
    // Check codec (if provided)
    if (video.codec && tierSpec.tier === 'A') {
        if (!['ProRes-422-HQ', 'ProRes-4444'].includes(video.codec)) {
            errors.push(`Tier A requires ProRes codec, got ${video.codec}`);
        }
    }
    return { passed: errors.length === 0, errors };
}
/**
 * 7. Validate logo requirements (16px readable, 8K scalable)
 */
function validateLogoRequirements(logo) {
    const errors = [];
    // Must be vector
    if (!logo.vectorFormat) {
        errors.push('Logo must be provided in vector format (SVG, AI, EPS)');
    }
    // Must be readable at 16px
    if (!logo.readableAt16px) {
        errors.push('Logo must be legible at 16×16px minimum size');
    }
    // Must scale to 8K
    if (!logo.scalableTo8K) {
        errors.push('Logo must scale cleanly to 8K resolution without artifacts');
    }
    // Should have multiple background versions
    if (!logo.backgrounds.includes('white') || !logo.backgrounds.includes('black')) {
        errors.push('Logo must be provided on both white and black backgrounds');
    }
    // Should have color variants
    if (logo.colorVariants < 2) {
        errors.push('Logo should have at least 2 color variants (full color + monochrome)');
    }
    return { passed: errors.length === 0, errors };
}
/**
 * 8. Check for AI artifacts (flat lighting, over-saturation)
 */
function checkAIArtifacts(spec) {
    const rejections = {
        flatAILighting: false,
        overSaturated: false,
        illegibleDetails: false,
        inconsistentShadows: false,
        fakeReflections: false,
        lowResUpscale: false,
        aiArtifacts: false,
        brandInconsistency: false,
    };
    // Check for flat lighting
    if (!spec.lighting.keyLight || spec.lighting.contrast === 'low') {
        rejections.flatAILighting = true;
    }
    // Check for illegible details (composition clutter)
    if (spec.composition && spec.composition.visualClutter > 60) {
        rejections.illegibleDetails = true;
    }
    // Check for low-res upscale (bit depth mismatch)
    if (spec.bitDepth < 10 && spec.resolution.width >= 3840) {
        rejections.lowResUpscale = true;
    }
    return rejections;
}
/**
 * 9. Calculate quality score (0-100)
 */
function calculateQualityScore(spec, tier) {
    const result = validateAsset(spec, 'hero-image', tier);
    return result.score;
}
/**
 * 10. Generate AI prompt header with SightEngine™ standards
 */
function generatePromptHeader(tier = 'A') {
    const tierSpec = types_1.QUALITY_TIER_SPECS[tier];
    const cameraSpec = `${tierSpec.cameraModels[0]}, ${tierSpec.lensTypes[0]}, f/${tierSpec.apertureRange[0]}`;
    const lightingSpec = tierSpec.lightingRequirement === 'cinematic'
        ? 'cinematic three-point lighting'
        : 'professional lighting';
    return `
CRITICAL QUALITY REQUIREMENTS (SightEngine™ Tier ${tier}):
Camera: ${cameraSpec}
Lighting: ${lightingSpec}, natural shadows, directional key light
Quality: ${tierSpec.minResolution.label} resolution, ${tierSpec.minBitDepth}-bit color, ${tierSpec.requiredColorSpace[0]} color space
Style: Photorealistic, engineered precision, NOT AI-generated look

AUTOMATIC REJECTIONS:
❌ Flat/ambient lighting only
❌ Over-saturated colors
❌ Blurred or "mushy" details
❌ Inconsistent shadows
❌ Fake reflections
❌ "Midjourney aesthetic"

ENSURE:
✅ Crisp, clear details at all resolutions
✅ Physically accurate lighting and shadows
✅ Professional color grading
✅ Sharp silhouettes
✅ Minimal visual clutter
  `.trim();
}
/**
 * 11. Validate complete asset pipeline (batch validation)
 */
function validateAssetPipeline(assets) {
    const results = [];
    for (const asset of assets) {
        const result = validateAsset(asset.spec, asset.type, asset.tier);
        results.push(result);
    }
    const passed = results.filter((r) => r.passed).length;
    const failed = results.length - passed;
    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length || 0;
    return {
        passed: failed === 0,
        results,
        summary: {
            totalAssets: assets.length,
            passed,
            failed,
            averageScore,
        },
    };
}
//# sourceMappingURL=validator.js.map