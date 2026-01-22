// packages/delivery-kernel/src/archetypes/index.ts

/**
 * iOS App Archetypes
 * Pre-defined templates for common iOS app patterns
 */

export { authContentAppArchetype } from './ios-auth-content-app.js'
export { saasCompanionArchetype } from './ios-saas-companion.js'
export { marketplaceLiteArchetype } from './ios-marketplace-lite.js'
export { sensorAppArchetype } from './ios-sensor-app.js'
export { subscriptionMediaArchetype } from './ios-subscription-media.js'

import { authContentAppArchetype } from './ios-auth-content-app.js'
import { saasCompanionArchetype } from './ios-saas-companion.js'
import { marketplaceLiteArchetype } from './ios-marketplace-lite.js'
import { sensorAppArchetype } from './ios-sensor-app.js'
import { subscriptionMediaArchetype } from './ios-subscription-media.js'

export const IOS_ARCHETYPES = {
  'auth-content-app': authContentAppArchetype,
  'saas-companion': saasCompanionArchetype,
  'marketplace-lite': marketplaceLiteArchetype,
  'sensor-app': sensorAppArchetype,
  'subscription-media': subscriptionMediaArchetype
} as const

export type IOSArchetypeName = keyof typeof IOS_ARCHETYPES

/**
 * Get archetype by name
 */
export function getArchetype(name: IOSArchetypeName) {
  return IOS_ARCHETYPES[name]
}

/**
 * List all available archetypes
 */
export function listArchetypes() {
  return Object.keys(IOS_ARCHETYPES).map(key => {
    const archetype = IOS_ARCHETYPES[key as IOSArchetypeName]
    return {
      name: archetype.name,
      description: archetype.description,
      capabilities: archetype.architecture.capabilities
    }
  })
}
