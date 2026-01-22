// packages/delivery-kernel/src/archetypes/ios-subscription-media.ts

/**
 * iOS Archetype: Subscription Media App
 * Pattern: Content paywall, in-app purchases, media playback
 * Examples: News apps, podcast apps, video streaming
 */

import type { Architecture, Feature } from '../types.js'

export const subscriptionMediaArchetype = {
  name: 'subscription-media',
  description: 'Media app with subscription paywall and in-app purchases',

  architecture: {
    type: 'ios-app' as const,
    archetype: 'subscription-media' as const,
    tech_stack: {
      frontend: 'React Native (Expo)',
      backend: 'Supabase + CDN',
      database: 'PostgreSQL (Supabase)',
      auth: 'Supabase Auth',
      payments: 'Apple In-App Purchase (StoreKit)',
      deployment: 'EAS Build + TestFlight'
    },
    engines_required: [
      'IdentityEngine',    // User auth
      'ExecutionEngine',   // Content logic
      'PaywallEngine',     // IAP + subscriptions
      'NotificationsEngine' // New content alerts
    ],
    capabilities: [
      'User authentication',
      'Content library (articles/audio/video)',
      'In-App Purchase integration',
      'Subscription management (auto-renewing)',
      'Paywall enforcement',
      'Offline downloads',
      'Push notifications',
      'Restore purchases'
    ]
  } as Architecture,

  defaultFeatures: [
    {
      id: 'feat-auth',
      name: 'User Authentication',
      description: 'Sign up and login to access content',
      priority: 'must-have' as const,
      complexity: 3,
      dependencies: []
    },
    {
      id: 'feat-library',
      name: 'Content Library',
      description: 'Browse and access media content',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-iap',
      name: 'In-App Purchases',
      description: 'Purchase subscriptions via Apple StoreKit',
      priority: 'must-have' as const,
      complexity: 8,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-paywall',
      name: 'Paywall Enforcement',
      description: 'Restrict premium content to subscribers',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-iap', 'feat-library']
    },
    {
      id: 'feat-player',
      name: 'Media Player',
      description: 'Audio/video playback with controls',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-library']
    },
    {
      id: 'feat-downloads',
      name: 'Offline Downloads',
      description: 'Download content for offline viewing',
      priority: 'should-have' as const,
      complexity: 5,
      dependencies: ['feat-paywall']
    }
  ] as Feature[],

  permissions: {
    ios: {
      'NSUserTrackingUsageDescription': 'Personalize content recommendations'
    }
  },

  appReviewNotes: [
    'CRITICAL: Must use Apple IAP for digital content subscriptions',
    'Cannot link to external payment (Stripe) for subscriptions',
    'Must provide restore purchases functionality',
    'Must handle subscription lifecycle (renew, cancel, expire)',
    'Include privacy policy for subscription data',
    'App Store subscription guidelines strictly enforced'
  ]
}
