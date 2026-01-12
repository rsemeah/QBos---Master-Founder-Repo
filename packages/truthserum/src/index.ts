/**
 * TruthSerum - Proof-based state verification
 * NO claim without receipts
 */

export * from "./intents/registry.js";
export * from "./ReceiptWriter.js";
export * from "./TruthSerum.js";
export * from "./types.js";

/**
 * Helper to get intent by ID
 */
import { IntentsRegistry } from "./intents/registry.js";
export function getIntent(intentId: string) {
  return IntentsRegistry[intentId];
}
