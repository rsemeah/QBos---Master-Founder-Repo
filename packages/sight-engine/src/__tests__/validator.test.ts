/**
 * Tests for SightEngine (Visual Quality Validator)
 */

import {
  validateAsset,
  validateResolution,
  validateCameraSpec,
  validateLighting,
  validateComposition,
  validateVideoSpec,
  validateLogoRequirements,
  checkAIArtifacts,
  calculateQualityScore,
  generatePromptHeader,
} from '../validator';
import {
  AssetSpec,
  QUALITY_TIER_SPECS,
  STANDARD_RESOLUTIONS,
} from '../types';

describe('SightEngine (Quality Validator)', () => {
  describe('validateResolution', () => {
    it('should pass for standard 1080p resolution', () => {
      const result = validateResolution(
        STANDARD_RESOLUTIONS['HD'],
        QUALITY_TIER_SPECS.C
      );

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for resolution below minimum', () => {
      const result = validateResolution(
        STANDARD_RESOLUTIONS['SD'],
        QUALITY_TIER_SPECS.C
      );

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('below minimum');
    });

    it('should accept 4K resolution for investor tier', () => {
      const result = validateResolution(
        STANDARD_RESOLUTIONS['4K'],
        QUALITY_TIER_SPECS.A
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('validateCameraSpec', () => {
    it('should pass for professional camera', () => {
      const result = validateCameraSpec(
        {
          model: 'simulated-cinematic',
          lens: '50mm-prime',
          aperture: 3.2,
        },
        QUALITY_TIER_SPECS.B
      );

      expect(result.passed).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn for phone camera on investor tier', () => {
      const result = validateCameraSpec(
        {
          model: 'ARRI-Alexa-65',
          lens: 'macro-lens',
          aperture: 11,
        },
        QUALITY_TIER_SPECS.B
      );

      expect(result.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateLighting', () => {
    it('should pass for natural lighting', () => {
      const result = validateLighting(
        {
          setup: 'natural-window',
          keyLight: { type: 'key', intensity: 65, softness: 'soft' },
          colorTemperature: 5500,
        },
        'acceptable'
      );

      expect(result.passed).toBe(true);
    });

    it('should fail for flat AI lighting', () => {
      const result = validateLighting(
        {
          setup: 'natural-window',
          keyLight: null as any,
          colorTemperature: 6500,
        },
        'cinematic'
      );

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('flat'))).toBe(true);
    });

    it('should pass for studio lighting on investor tier', () => {
      const result = validateLighting(
        {
          setup: 'three-point',
          keyLight: { type: 'key', intensity: 80, softness: 'medium' },
          colorTemperature: 5600,
        },
        'cinematic'
      );

      expect(result.passed).toBe(true);
    });

    it('should fail when color temperature is out of range', () => {
      const result = validateLighting(
        {
          setup: 'three-point',
          keyLight: { type: 'key', intensity: 70, softness: 'soft' },
          colorTemperature: 2000, // Too warm
        },
        'acceptable'
      );

      expect(result.passed).toBe(false);
    });
  });

  describe('validateComposition', () => {
    it('should pass for rule of thirds composition', () => {
      const result = validateComposition(
        {
          rules: ['rule-of-thirds', 'depth-of-field'],
          silhouetteClarity: 85,
          visualClutter: 20,
        },
        QUALITY_TIER_SPECS.B
      );

      expect(result.passed).toBe(true);
    });

    it('should warn for centered composition', () => {
      const result = validateComposition(
        {
          rules: ['symmetry'],
          silhouetteClarity: 50,
          visualClutter: 65,
        },
        QUALITY_TIER_SPECS.B
      );

      expect(result.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateVideoSpec', () => {
    it('should pass for 1080p 60fps video', () => {
      const result = validateVideoSpec(
        {
          frameRate: 24,
          codec: 'ProRes-422-HQ',
        },
        QUALITY_TIER_SPECS.A
      );

      expect(result.passed).toBe(true);
    });

    it('should warn for low framerate', () => {
      const result = validateVideoSpec(
        {
          frameRate: 20,
          codec: 'H.264',
        },
        QUALITY_TIER_SPECS.B
      );

      expect(result.passed).toBe(false);
      expect(result.errors.some(w => w.includes('fps'))).toBe(true);
    });

    it('should fail for low bitrate', () => {
      const result = validateVideoSpec(
        {
          frameRate: 30,
          codec: 'H.264',
        },
        QUALITY_TIER_SPECS.A
      );

      expect(result.passed).toBe(false);
    });
  });

  describe('validateLogoRequirements', () => {
    it('should pass for valid logo', () => {
      const result = validateLogoRequirements({
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
      const result = validateLogoRequirements({
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
      const result = validateLogoRequirements({
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
      const result = checkAIArtifacts({
        resolution: STANDARD_RESOLUTIONS['HD'],
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
      const result = checkAIArtifacts({
        resolution: STANDARD_RESOLUTIONS['4K'],
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
      const result = checkAIArtifacts({
        resolution: STANDARD_RESOLUTIONS['HD'],
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
      const asset: AssetSpec = {
        resolution: STANDARD_RESOLUTIONS['4K'],
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

      const score = calculateQualityScore(asset, 'A');

      expect(score).toBeGreaterThan(90);
    });

    it('should give lower score for consumer-grade asset', () => {
      const asset: AssetSpec = {
        resolution: STANDARD_RESOLUTIONS['HD'],
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

      const score = calculateQualityScore(asset, 'C');

      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(90);
    });
  });

  describe('generatePromptHeader', () => {
    it('should generate investor-tier prompt header', () => {
      const header = generatePromptHeader('A');

      expect(header).toContain('4K');
      expect(header).toContain('Display-P3');
      expect(header).toContain('16-bit');
      expect(header).toContain('ARRI-Alexa-65');
    });

    it('should generate consumer-tier prompt header', () => {
      const header = generatePromptHeader('C');

      expect(header).toContain('HD');
      expect(header).toContain('sRGB');
      expect(header).toContain('professional lighting');
    });

    it('should include video-specific requirements', () => {
      const header = generatePromptHeader('A');

      expect(header).toContain('cinematic');
    });
  });

  describe('validateAsset (integration)', () => {
    it('should validate complete investor-grade photo', () => {
      const asset: AssetSpec = {
        resolution: STANDARD_RESOLUTIONS['4K'],
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

      const result = validateAsset(asset, 'hero-image', 'A');

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(90);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject AI-generated image on investor tier', () => {
      const asset: AssetSpec = {
        resolution: STANDARD_RESOLUTIONS['4K'],
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
          keyLight: null as any,
          colorTemperature: 6500,
          contrast: 'low',
        },
      };

      const result = validateAsset(asset, 'hero-image', 'A');

      expect(result.passed).toBe(false);
      expect(result.rejections.flatAILighting).toBe(true);
      expect(result.score).toBeLessThan(70);
    });

    it('should accept good consumer-grade asset', () => {
      const asset: AssetSpec = {
        resolution: STANDARD_RESOLUTIONS['HD'],
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

      const result = validateAsset(asset, 'hero-image', 'C');

      expect(result.passed).toBe(true);
      expect(result.tier).toBe('C');
    });
  });
});
