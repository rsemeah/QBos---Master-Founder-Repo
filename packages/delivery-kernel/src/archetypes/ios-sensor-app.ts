// packages/delivery-kernel/src/archetypes/ios-sensor-app.ts

/**
 * iOS Archetype: Sensor App
 * Pattern: Camera, location, mic capture + cloud uploads
 * Examples: Photo sharing, fitness tracker, field data collection
 */

import type { Architecture, Feature } from '../types.js'

export const sensorAppArchetype = {
  name: 'sensor-app',
  description: 'Device sensor integration with cloud uploads',

  architecture: {
    type: 'ios-app' as const,
    archetype: 'sensor-app' as const,
    tech_stack: {
      frontend: 'React Native (Expo)',
      backend: 'Supabase + Storage',
      database: 'PostgreSQL (Supabase)',
      auth: 'Supabase Auth',
      deployment: 'EAS Build + TestFlight'
    },
    engines_required: [
      'IdentityEngine',    // User auth
      'ExecutionEngine',   // Core logic
      'SightEngine',       // Media processing
      'NotificationsEngine' // Background uploads
    ],
    capabilities: [
      'Camera capture (photo/video)',
      'Location tracking (GPS)',
      'Microphone recording',
      'Media uploads to cloud storage',
      'Background processing',
      'Offline capture + sync',
      'Push notifications',
      'Photo/video gallery'
    ]
  } as Architecture,

  defaultFeatures: [
    {
      id: 'feat-auth',
      name: 'User Authentication',
      description: 'Secure login to sync data to cloud',
      priority: 'must-have' as const,
      complexity: 3,
      dependencies: []
    },
    {
      id: 'feat-camera',
      name: 'Camera Capture',
      description: 'Capture photos and videos with camera',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-location',
      name: 'Location Tracking',
      description: 'Track and tag captures with GPS coordinates',
      priority: 'must-have' as const,
      complexity: 3,
      dependencies: ['feat-auth']
    },
    {
      id: 'feat-upload',
      name: 'Cloud Uploads',
      description: 'Upload captured media to cloud storage',
      priority: 'must-have' as const,
      complexity: 5,
      dependencies: ['feat-camera']
    },
    {
      id: 'feat-gallery',
      name: 'Media Gallery',
      description: 'View uploaded photos and videos',
      priority: 'should-have' as const,
      complexity: 3,
      dependencies: ['feat-upload']
    },
    {
      id: 'feat-offline',
      name: 'Offline Mode',
      description: 'Capture data offline and sync when connected',
      priority: 'should-have' as const,
      complexity: 5,
      dependencies: ['feat-upload']
    }
  ] as Feature[],

  permissions: {
    ios: {
      'NSCameraUsageDescription': 'Capture photos and videos',
      'NSPhotoLibraryUsageDescription': 'Access and save photos to your library',
      'NSPhotoLibraryAddUsageDescription': 'Save captured photos to your library',
      'NSLocationWhenInUseUsageDescription': 'Tag captures with location',
      'NSLocationAlwaysUsageDescription': 'Track location in background',
      'NSMicrophoneUsageDescription': 'Record audio with video'
    }
  },

  appReviewNotes: [
    'Clearly explain why each sensor permission is needed',
    'Must respect location privacy (only when in use)',
    'Include settings to disable background location',
    'Show user what data is being collected',
    'Comply with health data regulations if applicable'
  ]
}
