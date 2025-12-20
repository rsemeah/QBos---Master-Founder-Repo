# SightEngine™

**Visual Quality Standards for QuietBuild OS™**

SightEngine™ enforces investor-grade visual quality across all brand assets. It rejects AI-looking outputs, flat lighting, and low-quality visuals through rigorous validation.

## Quick Start

```typescript
import { validateAsset, generatePromptHeader, QUALITY_TIER_SPECS } from '@qbos/sight-engine';

// Validate a visual asset
const result = validateAsset(
  {
    resolution: { width: 3840, height: 2160, label: '4K' },
    aspectRatio: '16:9',
    camera: {
      model: 'ARRI-Alexa-65',
      lens: '50mm-prime',
      aperture: 2.8,
    },
    colorSpace: 'ACEScg',
    bitDepth: 16,
    lighting: {
      setup: 'three-point',
      keyLight: { type: 'key', intensity: 80, softness: 'medium' },
      colorTemperature: 5600,
      contrast: 'medium',
    },
  },
  'hero-image',
  'A' // Tier A: Investor-grade
);

console.log(result.passed); // true/false
console.log(result.score); // 0-100
```

## Quality Tiers

| Tier | Name | Use Case | Min Resolution | Bit Depth |
|------|------|----------|---------------|-----------|
| **A** | Investor-Grade | Hero images, brand materials, investor decks | 4K (3840×2160) | 16-bit |
| **B** | Product-Grade | UI components, documentation, social media | 2K (2048×1080) | 10-bit |
| **C** | Internal | Sketches, wireframes, prototypes | HD (1920×1080) | 8-bit |

## Automatic Rejections (Hard Fails)

SightEngine™ automatically rejects:

- ❌ Flat AI lighting
- ❌ Over-saturated colors
- ❌ Illegible micro-details
- ❌ Inconsistent shadows
- ❌ Fake reflections
- ❌ "Midjourney mush"
- ❌ Low-res upscales

**Golden Rule**: If it looks like "AI art", SightEngine™ fails it.

## Validation Functions

SightEngine™ provides 11 validation functions:

```typescript
import {
  validateAsset,          // Complete asset validation
  validateResolution,     // Resolution checks
  validateCameraSpec,     // Camera/lens validation
  validateLighting,       // Lighting setup validation
  validateComposition,    // Composition rules
  validateVideoSpec,      // Video-specific checks
  validateLogoRequirements, // Logo validation (16px readable, 8K scalable)
  checkAIArtifacts,       // AI artifact detection
  calculateQualityScore,  // Quality scoring (0-100)
  generatePromptHeader,   // AI prompt header with standards
  validateAssetPipeline,  // Batch validation
} from '@qbos/sight-engine';
```

## Generate AI Prompts with Standards

```typescript
import { generatePromptHeader } from '@qbos/sight-engine';

const prompt = `
${generatePromptHeader('A')}

Create a logo for CharterEngine - a legal governance system.

Style: Engineered, precise, minimal
Colors: Deep blue, white
`;

// Use with Gemini, Midjourney, Claude, etc.
```

## Logo Requirements

Logos must pass these requirements:

- ✅ Vector format (scalable)
- ✅ Readable at 16×16px minimum
- ✅ Scalable to 8K without artifacts
- ✅ Available on white and black backgrounds
- ✅ At least 2 color variants (full color + monochrome)

```typescript
import { validateLogoRequirements } from '@qbos/sight-engine';

const logoCheck = validateLogoRequirements({
  minSize: { width: 16, height: 16 },
  maxSize: { width: 7680, height: 7680 },
  vectorFormat: true,
  readableAt16px: true,
  scalableTo8K: true,
  backgrounds: ['white', 'black', 'transparent'],
  colorVariants: 3,
});

console.log(logoCheck.passed);
```

## Integration with AI Generation

SightEngine™ includes a prompt header generator that embeds quality standards directly into AI prompts:

```typescript
const header = generatePromptHeader('A');
```

This ensures AI-generated visuals meet SightEngine™ standards from the start.

## Tier A Requirements (Investor-Grade)

For hero images, brand materials, and investor presentations:

| Standard | Value |
|----------|-------|
| Resolution | 4K minimum (3840×2160) |
| Camera | ARRI Alexa 65 / RED V-Raptor 8K |
| Lens | Prime lenses (50mm/65mm/80mm) |
| Aperture | f/2.8 - f/4.0 |
| Color Space | ACEScg (master), Display P3 (delivery) |
| Bit Depth | 16-bit |
| Frame Rate | 24fps (cinematic), 30fps (UI only) |
| Lighting | Cinematic three-point or Rembrandt |

## Philosophy

**SightEngine™ ensures you look professional.**

Visual excellence is non-negotiable for trust-based products. SightEngine™ enforces standards that separate investor-grade brands from amateur outputs.

## Building

```bash
cd packages/sight-engine
npm install
npm run build
```

## License

MIT
