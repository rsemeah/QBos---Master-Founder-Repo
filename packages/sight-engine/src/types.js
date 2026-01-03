"use strict";
/**
 * SightEngine™ - Visual Quality Standards for QuietBuild OS™
 *
 * Enforces investor-grade visual quality across all brand assets.
 * Rejects AI-looking outputs, flat lighting, and low-quality visuals.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.QUALITY_TIER_SPECS = exports.STANDARD_RESOLUTIONS = void 0;
exports.STANDARD_RESOLUTIONS = {
    '8K': { width: 7680, height: 4320, label: '8K' },
    '6K': { width: 6144, height: 3456, label: '6K' },
    '4K': { width: 3840, height: 2160, label: '4K' },
    '2K': { width: 2048, height: 1080, label: '2K' },
    'HD': { width: 1920, height: 1080, label: 'HD' },
    'SD': { width: 1280, height: 720, label: 'SD' },
};
// ============================================================================
// QUALITY TIER SPECIFICATIONS
// ============================================================================
exports.QUALITY_TIER_SPECS = {
    'A': {
        tier: 'A',
        name: 'Investor-Grade',
        description: 'Hero images, brand materials, public presentations, investor decks',
        minResolution: exports.STANDARD_RESOLUTIONS['4K'],
        minBitDepth: 16,
        requiredColorSpace: ['ACEScg', 'Display-P3'],
        cameraModels: ['ARRI-Alexa-65', 'RED-V-Raptor-8K', 'Sony-Venice'],
        lensTypes: ['50mm-prime', '65mm-prime', '80mm-prime'],
        apertureRange: [2.8, 4.0],
        minFrameRate: 24,
        lightingRequirement: 'cinematic',
        compositionRules: ['rule-of-thirds', 'golden-ratio', 'depth-of-field'],
    },
    'B': {
        tier: 'B',
        name: 'Product-Grade',
        description: 'UI components, documentation images, blog posts, social media',
        minResolution: exports.STANDARD_RESOLUTIONS['2K'],
        minBitDepth: 10,
        requiredColorSpace: ['Display-P3', 'sRGB'],
        cameraModels: ['RED-Komodo-6K', 'Canon-C500-Mark-II', 'simulated-cinematic'],
        lensTypes: ['50mm-prime', '35mm-prime', 'zoom-lens'],
        apertureRange: [2.8, 5.6],
        minFrameRate: 24,
        lightingRequirement: 'professional',
        compositionRules: ['rule-of-thirds', 'negative-space'],
    },
    'C': {
        tier: 'C',
        name: 'Internal',
        description: 'Sketches, wireframes, internal tools, prototypes',
        minResolution: exports.STANDARD_RESOLUTIONS['HD'],
        minBitDepth: 8,
        requiredColorSpace: ['sRGB'],
        cameraModels: ['simulated-cinematic'],
        lensTypes: ['50mm-prime', 'zoom-lens'],
        apertureRange: [2.8, 8.0],
        minFrameRate: 24,
        lightingRequirement: 'acceptable',
        compositionRules: ['rule-of-thirds'],
    },
};
//# sourceMappingURL=types.js.map