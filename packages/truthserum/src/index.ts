// Root re-exports and compatibility helpers for @qbos/truthserum
// Provide a safe `getIntent` helper for older callers/tests.
import * as _exports from "./ReceiptWriter";
import * as types from "./types";

let IntentsRegistry: any = {};
try {
  // Common path used in the repo for intents registry
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const intents = require("./intents/registry");
  IntentsRegistry = intents.IntentsRegistry || intents.default || intents;
} catch (e) {
  // fallback: leave empty
}

export const ReceiptWriter =
  (_exports as any).ReceiptWriter || (_exports as any).default || _exports;
export { types };

export function getIntent(name: string) {
  if (!name) return undefined;
  return IntentsRegistry ? IntentsRegistry[name] : undefined;
}

// Export a TruthSerum facade if present to preserve old imports
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ts = require("./TruthSerum");
  // export as named export `TruthSerum`
  // @ts-ignore
  exports.TruthSerum = ts && (ts.default || ts);
} catch (e) {
  // ignore
}

export default {
  ReceiptWriter,
  getIntent,
};
/**
 * TruthSerum - Proof-based state verification
 * NO claim without receipts
 */

export * from "./intents/registry";
export * from "./ReceiptWriter";
export * from "./TruthSerum";
export * from "./types";

/**
 * Helper to get intent by ID
 */
import { IntentsRegistry } from "./intents/registry";
export function getIntent(intentId: string) {
  return IntentsRegistry[intentId];
}
