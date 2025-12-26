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
import { AssetSpec, AssetType, QualityTier } from '../types';

describe('SightEngine (Quality Validator)', () => {
  describe('validateResolution', () => {
    it('should pass for standard 1080p resolution', () => {
      const result = validateResolution(
        { width: 1920, height: 1080 },
        {
          minResolution: { width: 1920, height: 1080 },
          requiredColorSpace: ['sRGB'],
          minBitDepth: 8,
          lightingRequirement: 'natural',
        }
      );

      expect(result.passed).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should fail for resolution below minimum', () => {
      const result = validateResolution(
        { width: 1280, height: 720 },
        {
          minResolution: { width: 1920, height: 1080 },
          requiredColorSpace: ['sRGB'],
          minBitDepth: 8,
          lightingRequirement: 'natural',
        }
      );

      expect(result.passed).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('below minimum');
    });

    it('should accept 4K resolution for investor tier', () => {
      const result = validateResolution(
        { width: 3840, height: 2160 },
        {
          minResolution: { width: 3840, height: 2160 },
          requiredColorSpace: ['DCI-P3'],
          minBitDepth: 10,
          lightingRequirement: 'studio',
        }
      );

      expect(result.passed).toBe(true);
    });
  });

  describe('validateCameraSpec', () => {
    it('should pass for professional camera', () => {
      const result = validateCameraSpec(
        {
          model: 'Sony A7R V',
          sensor: 'Full Frame 61MP',
          lens: 'Sony FE 85mm f/1.4 GM',
        },
        {
          minResolution: { width: 1920, height: 1080 },
          requiredColorSpace: ['sRGB'],
          minBitDepth: 8,
          lightingRequirement: 'natural',
          cameraConstraint: 'professional',
        }
      );

      expect(result.passed).toBe(true);
      expect(result.warnings).toHaveLength(0);
    });

    it('should warn for phone camera on investor tier', () => {
      const result = validateCameraSpec(
        {
          model: 'iPhone 15 Pro',
          sensor: 'Mobile',
          lens: 'Mobile lens',
        },
        {
          minResolution: { width: 3840, height: 2160 },
          requiredColorSpace: ['DCI-P3'],
          minBitDepth: 10,
          lightingRequirement: 'studio',
          cameraConstraint: 'professional',
        }
      );

      expect(result.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateLighting', () => {
    it('should pass for natural lighting', () => {
      const result = validateLighting(
        {
          type: 'natural',
          sources: ['window', 'ambient'],
          colorTemperature: 5500,
        },
        'natural'
      );

      expect(result.passed).toBe(true);
    });

    it('should fail for flat AI lighting', () => {
      const result = validateLighting(
        {
          type: 'ai-generated',
          sources: ['synthetic'],
          colorTemperature: 6500,
        },
        'natural'
      );

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('flat'))).toBe(true);
    });

    it('should pass for studio lighting on investor tier', () => {
      const result = validateLighting(
        {
          type: 'studio',
          sources: ['key', 'fill', 'rim'],
          colorTemperature: 5600,
        },
        'studio'
      );

      expect(result.passed).toBe(true);
    });

    it('should fail when color temperature is out of range', () => {
      const result = validateLighting(
        {
          type: 'natural',
          sources: ['window'],
          colorTemperature: 2000, // Too warm
        },
        'natural'
      );

      expect(result.passed).toBe(false);
    });
  });

  describe('validateComposition', () => {
    it('should pass for rule of thirds composition', () => {
      const result = validateComposition(
        {
          followsRuleOfThirds: true,
          hasSubjectSeparation: true,
          depth: 'multi-layer',
        },
        {
          minResolution: { width: 1920, height: 1080 },
          requiredColorSpace: ['sRGB'],
          minBitDepth: 8,
          lightingRequirement: 'natural',
          compositionRequirement: 'rule-of-thirds',
        }
      );

      expect(result.passed).toBe(true);
    });

    it('should warn for centered composition', () => {
      const result = validateComposition(
        {
          followsRuleOfThirds: false,
          hasSubjectSeparation: false,
          depth: 'flat',
        },
        {
          minResolution: { width: 1920, height: 1080 },
          requiredColorSpace: ['sRGB'],
          minBitDepth: 8,
          lightingRequirement: 'natural',
          compositionRequirement: 'rule-of-thirds',
        }
      );

      expect(result.passed).toBe(false);
      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('validateVideoSpec', () => {
    it('should pass for 1080p 60fps video', () => {
      const result = validateVideoSpec({
        fps: 60,
        codec: 'H.265',
        bitrate: 20000,
      });

      expect(result.passed).toBe(true);
    });

    it('should warn for low framerate', () => {
      const result = validateVideoSpec({
        fps: 24,
        codec: 'H.264',
        bitrate: 10000,
      });

      expect(result.passed).toBe(false);
      expect(result.warnings.some(w => w.includes('fps'))).toBe(true);
    });

    it('should fail for low bitrate', () => {
      const result = validateVideoSpec({
        fps: 60,
        codec: 'H.264',
        bitrate: 5000, // Too low
      });

      expect(result.passed).toBe(false);
    });
  });

  describe('validateLogoRequirements', () => {
    it('should pass for valid logo', () => {
      const result = validateLogoRequirements({
        format: 'SVG',
        hasTransparentBackground: true,
        minSize: { width: 512, height: 512 },
        colorModes: ['light', 'dark'],
      });

      expect(result.passed).toBe(true);
    });

    it('should fail for raster-only logo', () => {
      const result = validateLogoRequirements({
        format: 'PNG',
        hasTransparentBackground: true,
        minSize: { width: 512, height: 512 },
        colorModes: ['light'],
      });

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('vector'))).toBe(true);
    });

    it('should fail for logo without dark mode variant', () => {
      const result = validateLogoRequirements({
        format: 'SVG',
        hasTransparentBackground: true,
        minSize: { width: 512, height: 512 },
        colorModes: ['light'],
      });

      expect(result.passed).toBe(false);
      expect(result.errors.some(e => e.includes('dark'))).toBe(true);
    });
  });

  describe('checkAIArtifacts', () => {
    it('should pass for real photos', () => {
      const result = checkAIArtifacts({
        hasWeirdFingers: false,
        hasFloatingObjects: false,
        hasInconsistentLighting: false,
        hasTextGarbling: false,
        hasSymmetryArtifacts: false,
      });

      expect(result.passed).toBe(true);
      expect(result.aiLikelihood).toBe('low');
    });

    it('should flag AI-generated images', () => {
      const result = checkAIArtifacts({
        hasWeirdFingers: true,
        hasFloatingObjects: true,
        hasInconsistentLighting: true,
        hasTextGarbling: false,
        hasSymmetryArtifacts: true,
      });

      expect(result.passed).toBe(false);
      expect(result.aiLikelihood).toBe('high');
      expect(result.flags.length).toBeGreaterThan(0);
    });

    it('should detect text garbling artifact', () => {
      const result = checkAIArtifacts({
        hasWeirdFingers: false,
        hasFloatingObjects: false,
        hasInconsistentLighting: false,
        hasTextGarbling: true,
        hasSymmetryArtifacts: false,
      });

      expect(result.passed).toBe(false);
      expect(result.flags).toContain('text_garbling');
    });
  });

  describe('calculateQualityScore', () => {
    it('should give high score for investor-grade asset', () => {
      const asset: AssetSpec = {
        resolution: { width: 3840, height: 2160 },
        colorSpace: 'DCI-P3',
        bitDepth: 10,
        camera: {
          model: 'Sony A7R V',
          sensor: 'Full Frame 61MP',
          lens: 'Sony FE 85mm f/1.4 GM',
        },
        lighting: {
          type: 'studio',
          sources: ['key', 'fill', 'rim'],
          colorTemperature: 5600,
        },
        composition: {
          followsRuleOfThirds: true,
          hasSubjectSeparation: true,
          depth: 'multi-layer',
        },
      };

      const score = calculateQualityScore(asset, 'photo', 'investor');

      expect(score).toBeGreaterThan(90);
    });

    it('should give lower score for consumer-grade asset', () => {
      const asset: AssetSpec = {
        resolution: { width: 1920, height: 1080 },
        colorSpace: 'sRGB',
        bitDepth: 8,
        camera: {
          model: 'iPhone 15',
          sensor: 'Mobile',
          lens: 'Mobile',
        },
        lighting: {
          type: 'natural',
          sources: ['window'],
          colorTemperature: 5500,
        },
      };

      const score = calculateQualityScore(asset, 'photo', 'consumer');

      expect(score).toBeGreaterThan(60);
      expect(score).toBeLessThan(90);
    });
  });

  describe('generatePromptHeader', () => {
    it('should generate investor-tier prompt header', () => {
      const header = generatePromptHeader('investor', 'photo');

      expect(header).toContain('4K');
      expect(header).toContain('DCI-P3');
      expect(header).toContain('10-bit');
      expect(header).toContain('professional camera');
    });

    it('should generate consumer-tier prompt header', () => {
      const header = generatePromptHeader('consumer', 'photo');

      expect(header).toContain('1080p');
      expect(header).toContain('sRGB');
      expect(header).toContain('natural lighting');
    });

    it('should include video-specific requirements', () => {
      const header = generatePromptHeader('investor', 'video');

      expect(header).toContain('60fps');
      expect(header).toContain('H.265');
    });
  });

  describe('validateAsset (integration)', () => {
    it('should validate complete investor-grade photo', () => {
      const asset: AssetSpec = {
        resolution: { width: 3840, height: 2160 },
        colorSpace: 'DCI-P3',
        bitDepth: 10,
        camera: {
          model: 'Sony A7R V',
          sensor: 'Full Frame 61MP',
          lens: 'Sony FE 85mm f/1.4 GM',
        },
        lighting: {
          type: 'studio',
          sources: ['key', 'fill', 'rim'],
          colorTemperature: 5600,
        },
        composition: {
          followsRuleOfThirds: true,
          hasSubjectSeparation: true,
          depth: 'multi-layer',
        },
      };

      const result = validateAsset(asset, 'photo', 'investor');

      expect(result.passed).toBe(true);
      expect(result.score).toBeGreaterThan(90);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject AI-generated image on investor tier', () => {
      const asset: AssetSpec = {
        resolution: { width: 3840, height: 2160 },
        colorSpace: 'DCI-P3',
        bitDepth: 10,
        camera: {
          model: 'Midjourney v6',
          sensor: 'AI',
          lens: 'AI',
        },
        lighting: {
          type: 'ai-generated',
          sources: ['synthetic'],
          colorTemperature: 6500,
        },
      };

      const result = validateAsset(asset, 'photo', 'investor');

      expect(result.passed).toBe(false);
      expect(result.rejectionCriteria?.flatAILighting).toBe(true);
      expect(result.score).toBeLessThan(70);
    });

    it('should accept good consumer-grade asset', () => {
      const asset: AssetSpec = {
        resolution: { width: 1920, height: 1080 },
        colorSpace: 'sRGB',
        bitDepth: 8,
        camera: {
          model: 'iPhone 15 Pro',
          sensor: 'Mobile',
          lens: 'Mobile',
        },
        lighting: {
          type: 'natural',
          sources: ['window', 'ambient'],
          colorTemperature: 5500,
        },
        composition: {
          followsRuleOfThirds: true,
          hasSubjectSeparation: true,
          depth: 'multi-layer',
        },
      };

      const result = validateAsset(asset, 'photo', 'consumer');

      expect(result.passed).toBe(true);
      expect(result.tier).toBe('consumer');
    });
  });
});
