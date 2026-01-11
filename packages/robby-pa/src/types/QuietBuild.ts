/**
 * Type definitions for QuietBuild Constitutional AI™ System
 */

export enum PhaseState {
  AWAITING_CONSENT = "AWAITING_CONSENT",
  AWAITING_INTENT = "AWAITING_INTENT",
  INTAKE_COMPLETE = "INTAKE_COMPLETE",
  SCOPE_LOCKED = "SCOPE_LOCKED",
  EXECUTING = "EXECUTING",
  VERIFICATION_PENDING = "VERIFICATION_PENDING",
  VERIFIED = "VERIFIED",
  SHIPPED = "SHIPPED",
}

export interface AppScope {
  projectName: string;
  framework: string;
  database: string;
  features: string[];
}

export interface QuietBuildResponse {
  ok: boolean;
  state?: PhaseState;
  receipt?: any;
  receipts?: any[];
  message?: string;
  error?: string;
}
