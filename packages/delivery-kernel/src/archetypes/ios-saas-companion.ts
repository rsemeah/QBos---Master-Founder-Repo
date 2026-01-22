// packages/delivery-kernel/src/archetypes/ios-saas-companion.ts

/**
 * iOS Archetype: SaaS Companion App
 * Pattern: Account management, billing, notifications for existing SaaS
 * Examples: Stripe Dashboard, Notion, Slack mobile
 */

import type { Architecture, Feature } from '../types.js'

export const saasCompanionArchetype = {
  name: 'saas-companion',
  description: 'Mobile companion for existing SaaS with account and billing',

  architecture: {
    type: 'ios-app' as const,
    archetype: 'saas-companion' as const,
    tech_stack: {
      frontend: 'React Native (Expo)',
      backend: 'Existing SaaS API',
      database: 'Remote (via API)',
      auth: 'OAuth / API Token',
      payments: 'Stripe (via API)',
      deployment: 'EAS Build + TestFlight'
    },
    engines_required: [
      'IdentityEngine',    // OAuth integration
      'ExecutionEngine',   // API client
      'PaywallEngine',     // Subscription management
      'NotificationsEngine' // Push for alerts
    ],
    capabilities: [
      'OAuth authentication',
      'Account settings',
      'Subscription management',
      'Usage metrics',
      'Push notifications',
      'Offline caching',
      'Biometric auth (Touch ID / Face ID)'
    ]
  } as Architecture,

  defaultFeatures: [
    {
      id: 'feat-oauth',
      name: 'OAuth Login',
      description: 'Sign in with existing SaaS account',
      priority: 'must-have' as const,
      complexity: 3,
      dependencies: []
    },
    {
      id: 'feat-account',
      name: 'Account Management',
      description: 'View and update account settings',
      priority: 'must-have' as const,
      complexity: 2,
      dependencies: ['feat-oauth']
    },
    {
      id: 'feat-billing',
      name: 'Billing & Subscription',
      description: 'View subscription status and update payment methods',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-oauth']
    },
    {
      id: 'feat-metrics',
      name: 'Usage Metrics',
      description: 'View usage stats and analytics',
      priority: 'should-have' as const,
      complexity: 3,
      dependencies: ['feat-oauth']
    },
    {
      id: 'feat-biometric',
      name: 'Biometric Auth',
      description: 'Quick login with Touch ID or Face ID',
      priority: 'should-have' as const,
      complexity: 2,
      dependencies: ['feat-oauth']
    }
  ] as Feature[],

  permissions: {
    ios: {
      'NSFaceIDUsageDescription': 'Use Face ID for quick and secure login'
    }
  },

  appReviewNotes: [
    'App must provide value beyond just a web wrapper',
    'Must have offline functionality for core features',
    'Link to parent SaaS terms of service',
    'Privacy policy must match web version'
  ]
}
