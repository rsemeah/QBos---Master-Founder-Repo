/**
 * TruthSerum Types - Canonical proof-based state verification
 * NO claim without receipts
 */

export type TruthState = 
  | "Verified"     // Has complete proof chain
  | "Unknown"      // Missing proof or indeterminate
  | "Blocked";     // Has proof it cannot proceed

export type ProofType =
  | "identity.authenticated"
  | "billing.active"
  | "billing.cap_not_exceeded"
  | "safety.passed"
  | "silent.generated"
  | "preview.rendered"
  | "build.passed"
  | "github.repo_created"
  | "github.commit_pushed"
  | "vercel.deploy_success"
  | "vercel.healthcheck_ok"
  | "supabase.connected"
  | "session.created"
  | "state.transition";

export interface ProofRequirement {
  type: ProofType;
  required: boolean;
  description: string;
}

export interface Receipt {
  id: string;
  sessionId?: string;
  type: ProofType | string;
  details: Record<string, any>;
  causedBy?: {
    messageId?: string;
    rule?: string;
    constraint?: string;
  };
  createdAt: Date;
}

export interface TruthClaim {
  claimText: string;
  requiredProofs: ProofType[];
  contextHints?: string[];
}

export interface TruthVerdict {
  state: TruthState;
  missingProofs: ProofType[];
  foundReceipts: Receipt[];
  sanitizedText?: string;
  nextActions?: string[];
}

export interface BuildIntent {
  intentId: string;
  name: string;
  description: string;
  requiredProofs: ProofRequirement[];
}

export interface IntentEvaluation {
  intent: BuildIntent;
  state: TruthState;
  missingProofs: ProofRequirement[];
  foundProofs: Receipt[];
  nextSteps: string[];
}
