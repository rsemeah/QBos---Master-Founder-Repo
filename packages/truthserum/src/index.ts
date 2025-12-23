/**
 * TruthSerum - Proof-based state verification
 * NO claim without receipts
 */

export * from "./types";
export * from "./TruthSerum";
export * from "./ReceiptWriter";
export * from "./intents/registry";

/**
 * Helper to get intent by ID
 */
import { IntentsRegistry } from "./intents/registry";
export function getIntent(intentId: string) {
  return IntentsRegistry[intentId];
}
