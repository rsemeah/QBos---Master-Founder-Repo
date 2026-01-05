declare module '@qbos/truthserum' {
  import type { BuildIntent, IntentEvaluation, Receipt, TruthState } from '../../../../packages/truthserum/dist/types';
  export type { BuildIntent, IntentEvaluation, Receipt, TruthState };
  export const ReceiptWriter: {
    writeReceipt: (opts: any) => Promise<Receipt>;
    readReceipts?: (filter?: any) => Promise<Receipt[]>;
  };
  export const TruthSerum: any;
  export const IntentsRegistry: Record<string, BuildIntent>;
  export function getIntent(intentId: string): BuildIntent;
}
