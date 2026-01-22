// packages/delivery-kernel/tests/fixtures/intents.ts

/**
 * Test fixtures for user intents
 */

import type { UserIntent } from '../../src/types'

export const webAppIntents: Record<string, UserIntent> = {
  todoApp: {
    description: 'Build a todo app with authentication',
    type: 'web-app',
    constraints: {
      budget: 5,
      complexity: 'simple'
    },
    features: [
      'User authentication',
      'Todo CRUD operations',
      'Todo filtering and search',
      'Mark todos as complete'
    ]
  },

  saasApp: {
    description: 'Build a SaaS dashboard for project management',
    type: 'web-app',
    constraints: {
      budget: 20,
      complexity: 'complex'
    },
    features: [
      'User authentication',
      'Project management',
      'Team collaboration',
      'File uploads',
      'Real-time notifications',
      'Billing with Stripe'
    ]
  },

  landingPage: {
    description: 'Build a landing page for a startup',
    type: 'web-app',
    constraints: {
      budget: 2,
      complexity: 'simple'
    },
    features: [
      'Hero section',
      'Features showcase',
      'Pricing table',
      'Contact form'
    ]
  }
}

export const iosAppIntents: Record<string, UserIntent> = {
  photoSharingApp: {
    description: 'Build an Instagram-like photo sharing app',
    type: 'ios-app',
    constraints: {
      budget: 15,
      complexity: 'moderate'
    },
    features: [
      'User authentication',
      'Photo uploads',
      'Photo feed with infinite scroll',
      'User profiles',
      'Like and comment on photos',
      'Push notifications'
    ]
  },

  fitnessTracker: {
    description: 'Build a fitness tracking app with GPS',
    type: 'ios-app',
    constraints: {
      budget: 20,
      complexity: 'complex'
    },
    features: [
      'User authentication',
      'GPS tracking for runs/walks',
      'Activity history',
      'Health data integration',
      'Workout statistics',
      'Social sharing'
    ]
  },

  subscriptionNews: {
    description: 'Build a news app with subscription paywall',
    type: 'ios-app',
    constraints: {
      budget: 25,
      complexity: 'complex'
    },
    features: [
      'User authentication',
      'Article library',
      'In-App Purchase subscriptions',
      'Paywall for premium content',
      'Offline reading',
      'Push notifications for breaking news'
    ]
  },

  marketplaceApp: {
    description: 'Build a local marketplace for buying and selling',
    type: 'ios-app',
    constraints: {
      budget: 30,
      complexity: 'complex'
    },
    features: [
      'User authentication',
      'Product listings with photos',
      'In-app messaging',
      'Stripe payments',
      'Location-based search',
      'Push notifications for orders'
    ]
  },

  saasCompanion: {
    description: 'Build a mobile companion app for project management SaaS',
    type: 'ios-app',
    constraints: {
      budget: 12,
      complexity: 'moderate'
    },
    features: [
      'OAuth authentication',
      'View and edit projects',
      'Account settings',
      'Subscription management',
      'Usage metrics',
      'Biometric login'
    ]
  }
}

export const apiIntents: Record<string, UserIntent> = {
  restApi: {
    description: 'Build a REST API for a blog platform',
    type: 'api',
    constraints: {
      budget: 8,
      complexity: 'moderate'
    },
    features: [
      'User authentication with JWT',
      'CRUD for blog posts',
      'Comments system',
      'File uploads',
      'Rate limiting',
      'API documentation'
    ]
  }
}
