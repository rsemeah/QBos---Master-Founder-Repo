// packages/delivery-kernel/src/archetypes/ios-marketplace-lite.ts

/**
 * iOS Archetype: Marketplace Lite
 * Pattern: Listings, messaging, basic payments
 * Examples: Etsy-like, local marketplace, service booking
 */

import type { Architecture, Feature } from '../types.js'

export const marketplaceLiteArchetype = {
  name: 'marketplace-lite',
  description: 'Two-sided marketplace with listings, messaging, and payments',

  architecture: {
    type: 'ios-app' as const,
    archetype: 'marketplace-lite' as const,
    tech_stack: {
      frontend: 'React Native (Expo)',
      backend: 'Supabase + Cloud Functions',
      database: 'PostgreSQL (Supabase)',
      auth: 'Supabase Auth',
      payments: 'Stripe Connect',
      deployment: 'EAS Build + TestFlight'
    },
    engines_required: [
      'IdentityEngine',    // Buyer/seller auth
      'ExecutionEngine',   // Listing logic
      'PaywallEngine',     // Payment processing
      'SightEngine',       // Product images
      'NotificationsEngine' // Order updates
    ],
    capabilities: [
      'User authentication (buyer/seller)',
      'Create and browse listings',
      'In-app messaging',
      'Payment processing (Stripe)',
      'Order management',
      'Push notifications',
      'Image uploads',
      'Search and filters'
    ]
  } as Architecture,

  defaultFeatures: [
    {
      id: 'feat-auth',
      name: 'User Authentication',
      description: 'Signup/login for buyers and sellers',
      priority: 'must-have' as const,
      complexity: 3,
      dependencies: []
    },
    {
      id: 'feat-listings',
      name: 'Listings Management',
      description: 'Create, edit, and browse product/service listings',
      priority: 'must-have' as const,
      complexity: 8,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-messaging',
      name: 'In-App Messaging',
      description: 'Chat between buyers and sellers',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-auth', 'feat-listings']
    },
    {
      id: 'feat-payments',
      name: 'Payment Processing',
      description: 'Stripe integration for secure payments',
      priority: 'must-have' as const,
      complexity: 8,
      dependencies: ['feat-auth', 'feat-listings']
    },
    {
      id: 'feat-orders',
      name: 'Order Management',
      description: 'Track orders and transaction history',
      priority: 'should-have' as const,
      complexity: 5,
      dependencies: ['feat-payments']
    }
  ] as Feature[],

  permissions: {
    ios: {
      'NSPhotoLibraryUsageDescription': 'Upload photos of your products',
      'NSCameraUsageDescription': 'Take photos of your products',
      'NSLocationWhenInUseUsageDescription': 'Show nearby listings'
    }
  },

  appReviewNotes: [
    'Must comply with Apple In-App Purchase guidelines (digital goods)',
    'Physical goods marketplace: use Stripe (not IAP)',
    'Include clear refund/dispute policy',
    'Require business verification for sellers',
    'Include content moderation for listings'
  ]
}
