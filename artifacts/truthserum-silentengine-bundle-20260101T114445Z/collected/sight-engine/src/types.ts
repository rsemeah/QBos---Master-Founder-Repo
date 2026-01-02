/**
 * SightEngine™ - Visual Quality Standards for QuietBuild OS™
 *
 * Enforces investor-grade visual quality across all brand assets.
 * Rejects AI-looking outputs, flat lighting, and low-quality visuals.
 */

// ============================================================================
// QUALITY TIERS
// ============================================================================

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

// ============================================================================
// CAMERA & OPTICS
// ============================================================================

export type CameraModel =
  | 'ARRI-Alexa-65'
  | 'ARRI-Alexa-Mini-LF'
  | 'RED-V-Raptor-8K'
  | 'RED-Komodo-6K'
  | 'Sony-Venice'
  | 'Canon-C500-Mark-II'
  | 'Blackmagic-URSA-12K'
  | 'simulated-cinematic';

export type LensType =
  | '50mm-prime'
  | '65mm-prime'
  | '80mm-prime'
  | '35mm-prime'
  | '100mm-prime'
  | 'zoom-lens'
  | 'macro-lens';

export interface CameraSpec {
  model: CameraModel;
  lens: LensType;
  aperture: number; // f-stop (e.g., 2.8 for f/2.8)
  focalLength?: number; // mm
  iso?: number;
  shutterSpeed?: string; // e.g., "1/50"
}

// ============================================================================
// RESOLUTION & FORMAT
// ============================================================================

export interface Resolution {
  width: number;
  height: number;
  label: '8K' | '6K' | '4K' | '2K' | 'HD' | 'SD';
}

export type AspectRatio = '16:9' | '21:9' | '4:3' | '1:1' | '9:16' | '2.39:1';

export const STANDARD_RESOLUTIONS: Record<string, Resolution> = {
  '8K': { width: 7680, height: 4320, label: '8K' },
  '6K': { width: 6144, height: 3456, label: '6K' },
  '4K': { width: 3840, height: 2160, label: '4K' },
  '2K': { width: 2048, height: 1080, label: '2K' },
  'HD': { width: 1920, height: 1080, label: 'HD' },
  'SD': { width: 1280, height: 720, label: 'SD' },
};

// ============================================================================
// COLOR & BIT DEPTH
// ============================================================================

export type ColorSpace =
  | 'ACEScg'        // Master color space (linear, wide gamut)
  | 'Display-P3'    // Delivery (wider than sRGB)
  | 'sRGB'          // Web standard
  | 'Rec-709'       // HD video standard
  | 'Rec-2020'      // 4K/HDR video standard
  | 'DCI-P3';       // Cinema display

export type BitDepth = 8 | 10 | 12 | 16 | 32;

export interface ColorProfile {
  space: ColorSpace;
  bitDepth: BitDepth;
  gamma?: 'linear' | 'sRGB' | 'Rec-709' | 'HLG' | 'PQ';
  hdrCapable?: boolean;
}

// ============================================================================
// LIGHTING
// ============================================================================

export type LightingSetup =
  | 'three-point'      // Key + Fill + Rim (standard cinematic)
  | 'rembrandt'        // 45° key light (dramatic portrait)
  | 'butterfly'        // Front-high key (beauty/fashion)
  | 'broad'            // Wide soft light (product/flat)
  | 'natural-window'   // Soft natural light
  | 'hard-dramatic';   // High-contrast directional

export interface LightingSpec {
  setup: LightingSetup;
  keyLight: LightSource;
  fillLight?: LightSource;
  rimLight?: LightSource;
  ambientLight?: LightSource;
  colorTemperature: number; // Kelvin (e.g., 5600K for daylight)
  contrast: 'low' | 'medium' | 'high';
}

export interface LightSource {
  type: 'key' | 'fill' | 'rim' | 'ambient';
  intensity: number; // 0-100
  angle?: number; // degrees
  softness: 'hard' | 'medium' | 'soft';
  color?: string; // hex color or 'daylight', 'tungsten', etc.
}

// ============================================================================
// COMPOSITION
// ============================================================================

export type CompositionRule =
  | 'rule-of-thirds'
  | 'golden-ratio'
  | 'leading-lines'
  | 'symmetry'
  | 'frame-within-frame'
  | 'negative-space'
  | 'depth-of-field';

export interface CompositionSpec {
  rules: CompositionRule[];
  focalPoint: { x: number; y: number }; // 0-1 normalized coordinates
  depthOfField: 'shallow' | 'medium' | 'deep';
  silhouetteClarity: number; // 0-100 (how readable is the main subject)
  visualClutter: number; // 0-100 (lower is better)
}

// ============================================================================
// VIDEO SPECIFIC
// ============================================================================

export interface VideoSpec {
  frameRate: number; // fps (24 for cinematic, 30/60 for UI)
  duration: number; // seconds
  codec?: 'ProRes-422-HQ' | 'ProRes-4444' | 'H.265' | 'DNxHR';
  motionBlur: boolean;
  stabilization: 'none' | 'software' | 'gimbal' | 'tripod';
}

// ============================================================================
// LOGO SPECIFIC
// ============================================================================

export interface LogoRequirements {
  minSize: { width: number; height: number };
  maxSize: { width: number; height: number };
  vectorFormat: boolean; // Must be scalable
  readableAt16px: boolean; // Must be legible at 16×16
  scalableTo8K: boolean; // Must scale cleanly to 8K
  backgrounds: ('white' | 'black' | 'transparent')[];
  colorVariants: number; // Number of color variations provided
}

// ============================================================================
// REJECTION CRITERIA
// ============================================================================

export interface RejectionCriteria {
  flatAILighting: boolean;         // ❌ Flat, directionless lighting
  overSaturated: boolean;          // ❌ Unnaturally vibrant colors
  illegibleDetails: boolean;       // ❌ Micro-details not readable
  inconsistentShadows: boolean;    // ❌ Physically impossible shadows
  fakeReflections: boolean;        // ❌ Reflections that don't match scene
  lowResUpscale: boolean;          // ❌ Low-res image artificially upscaled
  aiArtifacts: boolean;            // ❌ "Midjourney mush", blurred details
  brandInconsistency: boolean;     // ❌ Doesn't match brand guidelines
}

// ============================================================================
// ASSET VALIDATION
// ============================================================================

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
  score: number; // 0-100
  errors: string[];
  warnings: string[];
  rejections: Partial<RejectionCriteria>;
  recommendations: string[];
}

export type AssetType =
  | 'hero-image'        // Main brand/marketing image
  | 'logo'              // Brand logo
  | 'screenshot'        // UI screenshot
  | 'diagram'           // Technical diagram
  | 'video'             // Video content
  | 'thumbnail'         // Preview/thumbnail
  | 'icon';             // Icon/small graphic

// ============================================================================
// PROMPT GENERATION
// ============================================================================

export interface PromptHeader {
  cameraSpec: string;
  lightingSpec: string;
  qualityModifiers: string[];
  rejectionWarnings: string[];
}

// ============================================================================
// QUALITY TIER SPECIFICATIONS
// ============================================================================

export const QUALITY_TIER_SPECS: Record<QualityTier, QualityTierSpec> = {
  'A': {
    tier: 'A',
    name: 'Investor-Grade',
    description: 'Hero images, brand materials, public presentations, investor decks',
    minResolution: STANDARD_RESOLUTIONS['4K'],
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
    minResolution: STANDARD_RESOLUTIONS['2K'],
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
    minResolution: STANDARD_RESOLUTIONS['HD'],
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
