"use strict";
/**
 * Tests for SightEngine (Visual Quality Validator)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const validator_1 = require("../validator");
const types_1 = require("../types");
describe('SightEngine (Quality Validator)', () => {
    describe('validateResolution', () => {
        it('should pass for standard 1080p resolution', () => {
            const result = (0, validator_1.validateResolution)(types_1.STANDARD_RESOLUTIONS['HD'], types_1.QUALITY_TIER_SPECS.C);
            expect(result.passed).toBe(true);
            expect(result.errors).toHaveLength(0);
        });
        it('should fail for resolution below minimum', () => {
            const result = (0, validator_1.validateResolution)(types_1.STANDARD_RESOLUTIONS['SD'], types_1.QUALITY_TIER_SPECS.C);
            expect(result.passed).toBe(false);
            expect(result.errors.length).toBeGreaterThan(0);
            expect(result.errors[0]).toContain('below minimum');
        });
        it('should accept 4K resolution for investor tier', () => {
            const result = (0, validator_1.validateResolution)(types_1.STANDARD_RESOLUTIONS['4K'], types_1.QUALITY_TIER_SPECS.A);
            expect(result.passed).toBe(true);
        });
    });
    describe('validateCameraSpec', () => {
        it('should pass for professional camera', () => {
            const result = (0, validator_1.validateCameraSpec)({
                model: 'simulated-cinematic',
                lens: '50mm-prime',
                aperture: 3.2,
            }, types_1.QUALITY_TIER_SPECS.B);
            expect(result.passed).toBe(true);
            expect(result.warnings).toHaveLength(0);
        });
        it('should warn for phone camera on investor tier', () => {
            const result = (0, validator_1.validateCameraSpec)({
                model: 'ARRI-Alexa-65',
                lens: 'macro-lens',
                aperture: 11,
            }, types_1.QUALITY_TIER_SPECS.B);
            expect(result.passed).toBe(false);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });
    describe('validateLighting', () => {
        it('should pass for natural lighting', () => {
            const result = (0, validator_1.validateLighting)({
                setup: 'natural-window',
                keyLight: { type: 'key', intensity: 65, softness: 'soft' },
                colorTemperature: 5500,
            }, 'acceptable');
            expect(result.passed).toBe(true);
        });
        it('should fail for flat AI lighting', () => {
            const result = (0, validator_1.validateLighting)({
                setup: 'natural-window',
                keyLight: null,
                colorTemperature: 6500,
            }, 'cinematic');
            expect(result.passed).toBe(false);
            expect(result.errors.some(e => e.includes('flat'))).toBe(true);
        });
        it('should pass for studio lighting on investor tier', () => {
            const result = (0, validator_1.validateLighting)({
                setup: 'three-point',
                keyLight: { type: 'key', intensity: 80, softness: 'medium' },
                colorTemperature: 5600,
            }, 'cinematic');
            expect(result.passed).toBe(true);
        });
        it('should fail when color temperature is out of range', () => {
            const result = (0, validator_1.validateLighting)({
                setup: 'three-point',
                keyLight: { type: 'key', intensity: 70, softness: 'soft' },
                colorTemperature: 2000, // Too warm
            }, 'acceptable');
            expect(result.passed).toBe(false);
        });
    });
    describe('validateComposition', () => {
        it('should pass for rule of thirds composition', () => {
            const result = (0, validator_1.validateComposition)({
                rules: ['rule-of-thirds', 'depth-of-field'],
                silhouetteClarity: 85,
                visualClutter: 20,
            }, types_1.QUALITY_TIER_SPECS.B);
            expect(result.passed).toBe(true);
        });
        it('should warn for centered composition', () => {
            const result = (0, validator_1.validateComposition)({
                rules: ['symmetry'],
                silhouetteClarity: 50,
                visualClutter: 65,
            }, types_1.QUALITY_TIER_SPECS.B);
            expect(result.passed).toBe(false);
            expect(result.warnings.length).toBeGreaterThan(0);
        });
    });
    describe('validateVideoSpec', () => {
        it('should pass for 1080p 60fps video', () => {
            const result = (0, validator_1.validateVideoSpec)({
                frameRate: 24,
                codec: 'ProRes-422-HQ',
            }, types_1.QUALITY_TIER_SPECS.A);
            expect(result.passed).toBe(true);
        });
        it('should warn for low framerate', () => {
            const result = (0, validator_1.validateVideoSpec)({
                frameRate: 20,
                codec: 'H.264',
            }, types_1.QUALITY_TIER_SPECS.B);
            expect(result.passed).toBe(false);
            expect(result.errors.some(w => w.includes('fps'))).toBe(true);
        });
        it('should fail for low bitrate', () => {
            const result = (0, validator_1.validateVideoSpec)({
                frameRate: 30,
                codec: 'H.264',
            }, types_1.QUALITY_TIER_SPECS.A);
            expect(result.passed).toBe(false);
        });
    });
    describe('validateLogoRequirements', () => {
        it('should pass for valid logo', () => {
            const result = (0, validator_1.validateLogoRequirements)({
                minSize: { width: 512, height: 512 },
                maxSize: { width: 8192, height: 8192 },
                vectorFormat: true,
                readableAt16px: true,
                scalableTo8K: true,
                backgrounds: ['white', 'black', 'transparent'],
                colorVariants: 2,
            });
            expect(result.passed).toBe(true);
        });
        it('should fail for raster-only logo', () => {
            const result = (0, validator_1.validateLogoRequirements)({
                minSize: { width: 512, height: 512 },
                maxSize: { width: 2048, height: 2048 },
                vectorFormat: false,
                readableAt16px: true,
                scalableTo8K: false,
                backgrounds: ['white'],
                colorVariants: 1,
            });
            expect(result.passed).toBe(false);
            expect(result.errors.some(e => e.includes('vector'))).toBe(true);
        });
        it('should fail for logo without dark mode variant', () => {
            const result = (0, validator_1.validateLogoRequirements)({
                minSize: { width: 512, height: 512 },
                maxSize: { width: 4096, height: 4096 },
                vectorFormat: true,
                readableAt16px: true,
                scalableTo8K: true,
                backgrounds: ['white', 'transparent'],
                colorVariants: 1,
            });
            expect(result.passed).toBe(false);
            expect(result.errors.some(e => e.includes('dark'))).toBe(true);
        });
    });
    describe('checkAIArtifacts', () => {
        it('should pass for real photos', () => {
            const result = (0, validator_1.checkAIArtifacts)({
                resolution: types_1.STANDARD_RESOLUTIONS['HD'],
                aspectRatio: '16:9',
                camera: { model: 'simulated-cinematic', lens: '50mm-prime', aperture: 3.2 },
                colorSpace: 'sRGB',
                bitDepth: 10,
                lighting: {
                    setup: 'three-point',
                    keyLight: { type: 'key', intensity: 70, softness: 'medium' },
                    colorTemperature: 5600,
                    contrast: 'medium',
                },
            });
            expect(result.flatAILighting).toBe(false);
        });
        it('should flag AI-generated images', () => {
            const result = (0, validator_1.checkAIArtifacts)({
                resolution: types_1.STANDARD_RESOLUTIONS['4K'],
                aspectRatio: '16:9',
                camera: { model: 'simulated-cinematic', lens: '50mm-prime', aperture: 4 },
                colorSpace: 'sRGB',
                bitDepth: 8,
                lighting: {
                    setup: 'natural-window',
                    keyLight: { type: 'key', intensity: 10, softness: 'soft' },
                    colorTemperature: 5600,
                    contrast: 'low',
                },
                composition: {
                    rules: ['rule-of-thirds'],
                    focalPoint: { x: 0.5, y: 0.5 },
                    depthOfField: 'medium',
                    silhouetteClarity: 80,
                    visualClutter: 70,
                },
            });
            expect(result.flatAILighting).toBe(true);
            expect(result.lowResUpscale).toBe(true);
        });
        it('should detect text garbling artifact', () => {
            const result = (0, validator_1.checkAIArtifacts)({
                resolution: types_1.STANDARD_RESOLUTIONS['HD'],
                aspectRatio: '16:9',
                camera: { model: 'simulated-cinematic', lens: '50mm-prime', aperture: 4 },
                colorSpace: 'sRGB',
                bitDepth: 10,
                lighting: {
                    setup: 'three-point',
                    keyLight: { type: 'key', intensity: 70, softness: 'medium' },
                    colorTemperature: 5600,
                    contrast: 'medium',
                },
                composition: {
                    rules: ['rule-of-thirds'],
                    focalPoint: { x: 0.4, y: 0.4 },
                    depthOfField: 'shallow',
                    silhouetteClarity: 85,
                    visualClutter: 20,
                },
            });
            expect(result.illegibleDetails).toBe(false);
        });
    });
    describe('calculateQualityScore', () => {
        it('should give high score for investor-grade asset', () => {
            const asset = {
                resolution: types_1.STANDARD_RESOLUTIONS['4K'],
                aspectRatio: '16:9',
                colorSpace: 'Display-P3',
                bitDepth: 16,
                camera: {
                    model: 'ARRI-Alexa-65',
                    lens: '50mm-prime',
                    aperture: 3.2,
                },
                lighting: {
                    setup: 'three-point',
                    keyLight: { type: 'key', intensity: 80, softness: 'medium' },
                    colorTemperature: 5600,
                    contrast: 'high',
                },
                composition: {
                    rules: ['rule-of-thirds', 'depth-of-field'],
                    focalPoint: { x: 0.4, y: 0.4 },
                    depthOfField: 'shallow',
                    silhouetteClarity: 90,
                    visualClutter: 15,
                },
            };
            const score = (0, validator_1.calculateQualityScore)(asset, 'A');
            expect(score).toBeGreaterThan(90);
        });
        it('should give lower score for consumer-grade asset', () => {
            const asset = {
                resolution: types_1.STANDARD_RESOLUTIONS['HD'],
                aspectRatio: '16:9',
                colorSpace: 'sRGB',
                bitDepth: 8,
                camera: {
                    model: 'simulated-cinematic',
                    lens: 'zoom-lens',
                    aperture: 5.6,
                },
                lighting: {
                    setup: 'natural-window',
                    keyLight: { type: 'key', intensity: 60, softness: 'soft' },
                    colorTemperature: 5500,
                    contrast: 'medium',
                },
            };
            const score = (0, validator_1.calculateQualityScore)(asset, 'C');
            expect(score).toBeGreaterThan(60);
            expect(score).toBeLessThan(90);
        });
    });
    describe('generatePromptHeader', () => {
        it('should generate investor-tier prompt header', () => {
            const header = (0, validator_1.generatePromptHeader)('A');
            expect(header).toContain('4K');
            expect(header).toContain('Display-P3');
            expect(header).toContain('16-bit');
            expect(header).toContain('ARRI-Alexa-65');
        });
        it('should generate consumer-tier prompt header', () => {
            const header = (0, validator_1.generatePromptHeader)('C');
            expect(header).toContain('HD');
            expect(header).toContain('sRGB');
            expect(header).toContain('professional lighting');
        });
        it('should include video-specific requirements', () => {
            const header = (0, validator_1.generatePromptHeader)('A');
            expect(header).toContain('cinematic');
        });
    });
    describe('validateAsset (integration)', () => {
        it('should validate complete investor-grade photo', () => {
            const asset = {
                resolution: types_1.STANDARD_RESOLUTIONS['4K'],
                aspectRatio: '16:9',
                colorSpace: 'Display-P3',
                bitDepth: 16,
                camera: {
                    model: 'ARRI-Alexa-65',
                    lens: '50mm-prime',
                    aperture: 3.2,
                },
                lighting: {
                    setup: 'three-point',
                    keyLight: { type: 'key', intensity: 80, softness: 'medium' },
                    colorTemperature: 5600,
                    contrast: 'high',
                },
                composition: {
                    rules: ['rule-of-thirds'],
                    focalPoint: { x: 0.4, y: 0.4 },
                    depthOfField: 'shallow',
                    silhouetteClarity: 90,
                    visualClutter: 15,
                },
            };
            const result = (0, validator_1.validateAsset)(asset, 'hero-image', 'A');
            expect(result.passed).toBe(true);
            expect(result.score).toBeGreaterThan(90);
            expect(result.errors).toHaveLength(0);
        });
        it('should reject AI-generated image on investor tier', () => {
            const asset = {
                resolution: types_1.STANDARD_RESOLUTIONS['4K'],
                aspectRatio: '16:9',
                colorSpace: 'Display-P3',
                bitDepth: 10,
                camera: {
                    model: 'simulated-cinematic',
                    lens: 'zoom-lens',
                    aperture: 8,
                },
                lighting: {
                    setup: 'natural-window',
                    keyLight: null,
                    colorTemperature: 6500,
                    contrast: 'low',
                },
            };
            const result = (0, validator_1.validateAsset)(asset, 'hero-image', 'A');
            expect(result.passed).toBe(false);
            expect(result.rejections.flatAILighting).toBe(true);
            expect(result.score).toBeLessThan(70);
        });
        it('should accept good consumer-grade asset', () => {
            const asset = {
                resolution: types_1.STANDARD_RESOLUTIONS['HD'],
                aspectRatio: '16:9',
                colorSpace: 'sRGB',
                bitDepth: 8,
                camera: {
                    model: 'simulated-cinematic',
                    lens: 'zoom-lens',
                    aperture: 5.6,
                },
                lighting: {
                    setup: 'natural-window',
                    keyLight: { type: 'key', intensity: 60, softness: 'soft' },
                    colorTemperature: 5500,
                    contrast: 'medium',
                },
                composition: {
                    rules: ['rule-of-thirds'],
                    focalPoint: { x: 0.5, y: 0.4 },
                    depthOfField: 'medium',
                    silhouetteClarity: 80,
                    visualClutter: 25,
                },
            };
            const result = (0, validator_1.validateAsset)(asset, 'hero-image', 'C');
            expect(result.passed).toBe(true);
            expect(result.tier).toBe('C');
        });
    });
});
//# sourceMappingURL=validator.test.js.map