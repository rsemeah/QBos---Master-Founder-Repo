/**
 * @qbos/safety-engine-core - SafetyEngine™ Core Package
 *
 * Content moderation, user safety, and policy enforcement for QuietBuild OS.
 *
 * Usage:
 *
 * ```typescript
 * import { SafetyEngine, PatternModerator } from '@qbos/safety-engine-core';
 *
 * const safetyEngine = new SafetyEngine();
 *
 * // Bootstrap with SafetyEngine
 * const qbos = await bootstrap(config, [safetyEngine]);
 * ```
 */

// Types
export * from './types';

// Moderators
export { PatternModerator } from './moderators/pattern-moderator';

// Engine
export { SafetyEngine, SafetyEngineConfig } from './safety-engine';

// Default policies
export const DEFAULT_SAFETY_POLICY = {
  id: 'default-policy',
  name: 'Default Safety Policy',
  violationTypes: [
    'hate_speech',
    'violence',
    'sexual_content',
    'harassment',
    'spam',
    'misinformation',
    'self_harm',
    'illegal_content',
    'copyright',
    'privacy',
  ] as const,
  autoApprovalThreshold: 0.9,
  autoRejectionThreshold: 0.8,
  maxAutoApprovalSeverity: 0.3,
  actions: [
    { type: 'notify_admin' as const },
    { type: 'quarantine' as const },
  ],
};
