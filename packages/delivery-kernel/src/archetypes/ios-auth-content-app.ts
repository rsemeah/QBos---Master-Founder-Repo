// packages/delivery-kernel/src/archetypes/ios-auth-content-app.ts

/**
 * iOS Archetype: Auth + Content App
 * Pattern: Feeds, profiles, bookmarks, social features
 * Examples: Instagram-like, Twitter-like, content aggregators
 */

import type { Architecture, Feature } from '../types.js'

export const authContentAppArchetype = {
  name: 'auth-content-app',
  description: 'Authentication + content feeds with social features',

  architecture: {
    type: 'ios-app' as const,
    archetype: 'auth-content-app' as const,
    tech_stack: {
      frontend: 'React Native (Expo)',
      backend: 'Supabase',
      database: 'PostgreSQL (Supabase)',
      auth: 'Supabase Auth',
      deployment: 'EAS Build + TestFlight'
    },
    engines_required: [
      'IdentityEngine',    // Auth flows
      'ExecutionEngine',   // Core app logic
      'SightEngine',       // Image uploads
      'NotificationsEngine' // Push notifications
    ],
    capabilities: [
      'Authentication (Email, OAuth)',
      'User profiles',
      'Content feed (infinite scroll)',
      'Bookmarks/favorites',
      'Image uploads',
      'Push notifications',
      'Offline mode (basic)'
    ]
  } as Architecture,

  defaultFeatures: [
    {
      id: 'feat-auth',
      name: 'User Authentication',
      description: 'Email/password signup and login with OAuth providers',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: []
    },
    {
      id: 'feat-profile',
      name: 'User Profiles',
      description: 'View and edit user profiles with avatar upload',
      priority: 'must-have' as const,
      complexity: 3,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-feed',
      name: 'Content Feed',
      description: 'Infinite scroll feed of posts/content',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-bookmarks',
      name: 'Bookmarks',
      description: 'Save and manage favorite content',
      priority: 'should-have' as const,
      complexity: 2,
      dependencies: ['feat-feed']
    },
    {
      id: 'feat-notifications',
      name: 'Push Notifications',
      description: 'Receive notifications for new content and interactions',
      priority: 'should-have' as const,
      complexity: 3,
      dependencies: ['feat-auth']
    }
  ] as Feature[],

  permissions: {
    ios: {
      'NSPhotoLibraryUsageDescription': 'Upload photos to your profile and posts',
      'NSCameraUsageDescription': 'Take photos for your profile and posts',
      'NSUserTrackingUsageDescription': 'Personalize your content feed'
    }
  },

  appReviewNotes: [
    'Include demo account credentials for review',
    'Ensure content moderation policy is clear',
    'Privacy policy must explain data collection',
    'Include settings to disable push notifications'
  ]
}
