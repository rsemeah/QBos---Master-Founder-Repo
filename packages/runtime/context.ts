/**
 * Runtime Context - Session and user info for orchestration
 */

import { Receipt } from "@qbos/truthserum";

export interface RuntimeContext {
  sessionId: string;
  userId?: string;
  userEmail?: string;
  receipts: Receipt[];
  currentState?: string;
  appConfig?: Record<string, any>;
}

export interface EngineDefinition {
  key: string;
  name: string;
  description: string;
  status: "active" | "beta" | "planned";
  receiptTypes: string[];
}

export const EngineRegistry: Record<string, EngineDefinition> = {
  execution: {
    key: "execution",
    name: "ExecutionEngine",
    description: "Orchestrates session state transitions and truth evaluation",
    status: "active",
    receiptTypes: ["session.created", "state.transition"],
  },
  identity: {
    key: "identity",
    name: "IdentityEngine",
    description: "Manages authentication and user identity",
    status: "active",
    receiptTypes: ["identity.authenticated"],
  },
  charter: {
    key: "charter",
    name: "CharterEngine",
    description: "Defines and validates product charter and constraints",
    status: "beta",
    receiptTypes: ["charter.defined", "charter.validated"],
  },
  config: {
    key: "config",
    name: "ConfigEngine",
    description: "Manages configuration and environment variables",
    status: "active",
    receiptTypes: ["config.updated", "config.validated"],
  },
  paywall: {
    key: "paywall",
    name: "PaywallEngine",
    description: "Enforces billing caps and subscription limits",
    status: "active",
    receiptTypes: ["billing.active", "billing.cap_not_exceeded", "billing.cap_warning"],
  },
  notifications: {
    key: "notifications",
    name: "NotificationsEngine",
    description: "Manages user notifications and alerts",
    status: "beta",
    receiptTypes: ["notification.sent"],
  },
  sight: {
    key: "sight",
    name: "SightEngine",
    description: "Visual quality validation and preview rendering",
    status: "active",
    receiptTypes: ["preview.rendered", "visual.validated"],
  },
  silent: {
    key: "silent",
    name: "SilentEngine",
    description: "AI generation with provider failover",
    status: "active",
    receiptTypes: ["silent.generated", "ai.usage_logged"],
  },
  truthserum: {
    key: "truthserum",
    name: "TruthSerum",
    description: "Proof verification and claim sanitization",
    status: "active",
    receiptTypes: ["truth.evaluated", "claim.sanitized"],
  },
  safety: {
    key: "safety",
    name: "SafetyEngine",
    description: "Content safety and compliance validation",
    status: "active",
    receiptTypes: ["safety.passed", "safety.blocked"],
  },
  build: {
    key: "build",
    name: "BuildEngine",
    description: "Template generation and build verification",
    status: "active",
    receiptTypes: ["build.started", "build.passed", "build.failed"],
  },
  deploy: {
    key: "deploy",
    name: "DeployEngine",
    description: "GitHub and Vercel deployment orchestration",
    status: "beta",
    receiptTypes: [
      "github.repo_created",
      "github.commit_pushed",
      "vercel.deploy_success",
      "vercel.healthcheck_ok",
    ],
  },
};

export function getEngine(key: string): EngineDefinition | undefined {
  return EngineRegistry[key];
}

export function listEngines(): EngineDefinition[] {
  return Object.values(EngineRegistry);
}
