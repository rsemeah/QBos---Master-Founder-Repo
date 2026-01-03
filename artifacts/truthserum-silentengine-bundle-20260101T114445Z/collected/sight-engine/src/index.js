"use strict";
/**
 * SightEngine™ - Visual Quality Standards for QuietBuild OS™
 *
 * Public API for enforcing investor-grade visual quality.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAssetPipeline = exports.generatePromptHeader = exports.calculateQualityScore = exports.checkAIArtifacts = exports.validateLogoRequirements = exports.validateVideoSpec = exports.validateComposition = exports.validateLighting = exports.validateCameraSpec = exports.validateResolution = exports.validateAsset = void 0;
// Export all types
__exportStar(require("./types"), exports);
// Export validation functions
var validator_1 = require("./validator");
Object.defineProperty(exports, "validateAsset", { enumerable: true, get: function () { return validator_1.validateAsset; } });
Object.defineProperty(exports, "validateResolution", { enumerable: true, get: function () { return validator_1.validateResolution; } });
Object.defineProperty(exports, "validateCameraSpec", { enumerable: true, get: function () { return validator_1.validateCameraSpec; } });
Object.defineProperty(exports, "validateLighting", { enumerable: true, get: function () { return validator_1.validateLighting; } });
Object.defineProperty(exports, "validateComposition", { enumerable: true, get: function () { return validator_1.validateComposition; } });
Object.defineProperty(exports, "validateVideoSpec", { enumerable: true, get: function () { return validator_1.validateVideoSpec; } });
Object.defineProperty(exports, "validateLogoRequirements", { enumerable: true, get: function () { return validator_1.validateLogoRequirements; } });
Object.defineProperty(exports, "checkAIArtifacts", { enumerable: true, get: function () { return validator_1.checkAIArtifacts; } });
Object.defineProperty(exports, "calculateQualityScore", { enumerable: true, get: function () { return validator_1.calculateQualityScore; } });
Object.defineProperty(exports, "generatePromptHeader", { enumerable: true, get: function () { return validator_1.generatePromptHeader; } });
Object.defineProperty(exports, "validateAssetPipeline", { enumerable: true, get: function () { return validator_1.validateAssetPipeline; } });
//# sourceMappingURL=index.js.map