declare module '@qbos/truthserum' {
  import type { Receipt, IntentEvaluation, TruthState, BuildIntent } from '../../../../packages/truthserum/dist/types';
  export type { Receipt, IntentEvaluation, TruthState, BuildIntent };
  export const ReceiptWriter: {
    writeReceipt: (opts: any) => Promise<Receipt>;
    readReceipts?: (filter?: any) => Promise<Receipt[]>;
  };
  export const TruthSerum: any;
  export const IntentsRegistry: Record<string, BuildIntent>;
  export function getIntent(intentId: string): BuildIntent;
}
