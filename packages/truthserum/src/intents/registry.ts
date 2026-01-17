// BrainSmart + Action lifecycle intents
try {
  intents.set("brainsmart.started", {
    intentKey: "brainsmart.started",
    description: "BrainSmart deliberation session started",
    requiredProofs: ["task", "sessionId"],
    truthState: "Verified",
  });

  intents.set("brainsmart.trigger_evaluation", {
    intentKey: "brainsmart.trigger_evaluation",
    description: "Evaluated BrainSmart triggers (T1-T6)",
    requiredProofs: ["triggers", "result"],
    truthState: "Verified",
  });

  intents.set("brainsmart.model_call", {
    intentKey: "brainsmart.model_call",
    description: "Single LLM call during BrainSmart deliberation",
    requiredProofs: ["role", "provider", "model"],
    truthState: "Verified",
  });

  intents.set("brainsmart.synthesis_complete", {
    intentKey: "brainsmart.synthesis_complete",
    description: "BrainSmart completed synthesis with required outputs",
    requiredProofs: ["outputs", "confidence"],
    truthState: "Verified",
  });

  intents.set("approval.intent", {
    intentKey: "approval.intent",
    description: "State-based approval for execution",
    requiredProofs: ["approved", "approved_by", "scope", "confidence"],
    truthState: "Verified",
  });

  // Action lifecycle
  intents.set("action.requested", {
    intentKey: "action.requested",
    description: "An action was requested by Robby or an agent",
    requiredProofs: ["action_id", "sessionId", "runId"],
    truthState: "Observed",
  });

  intents.set("action.allowed", {
    intentKey: "action.allowed",
    description: "An action was allowed by the runtime guard",
    requiredProofs: ["action_id", "receipt"],
    truthState: "Verified",
  });

  intents.set("action.denied", {
    intentKey: "action.denied",
    description: "An action was denied by the runtime guard",
    requiredProofs: ["action_id", "reason"],
    truthState: "Verified",
  });
} catch (e) {
  // ignore double-sets during repeated runs
}

/**
 * Intents Registry - Canonical definitions of what constitutes "ready"
 */

import { BuildIntent } from "../types";

export const IntentsRegistry: Record<string, BuildIntent> = {
  "session.ready": {
    intentId: "session.ready",
    name: "Session Ready",
    description: "Session is ready to accept build instructions",
    requiredProofs: [
      {
        type: "identity.authenticated",
        required: true,
        description: "User identity verified",
      },
      {
        type: "billing.active",
        required: true,
        description: "User has active billing",
      },
      {
        type: "session.created",
        required: true,
        description: "Session record exists",
      },
    ],
  },

  "rob.ready": {
    intentId: "rob.ready",
    name: "Rob Ready",
    description: "Rob can generate code",
    requiredProofs: [
      {
        type: "identity.authenticated",
        required: true,
        description: "User authenticated",
      },
      {
        type: "billing.cap_not_exceeded",
        required: true,
        description: "User has not exceeded AI usage cap",
      },
      {
        type: "safety.passed",
        required: true,
        description: "Request passed safety checks",
      },
    ],
  },

  "deploy.ready": {
    intentId: "deploy.ready",
    name: "Deploy Ready",
    description: "App is ready to deploy",
    requiredProofs: [
      {
        type: "build.passed",
        required: true,
        description: "Build completed successfully",
      },
      {
        type: "preview.rendered",
        required: true,
        description: "Preview rendered without errors",
      },
      {
        type: "safety.passed",
        required: true,
        description: "Safety checks passed",
      },
    ],
  },

  "deploy.completed": {
    intentId: "deploy.completed",
    name: "Deploy Completed",
    description: "App successfully deployed and live",
    requiredProofs: [
      {
        type: "github.repo_created",
        required: true,
        description: "GitHub repo created",
      },
      {
        type: "github.commit_pushed",
        required: true,
        description: "Code pushed to GitHub",
      },
      {
        type: "vercel.deploy_success",
        required: true,
        description: "Vercel deployment succeeded",
      },
      {
        type: "vercel.healthcheck_ok",
        required: true,
        description: "Health check returned 200",
      },
    ],
  },
};

export function getIntent(intentId: string): BuildIntent | undefined {
  return IntentsRegistry[intentId];
}

export function listIntents(): BuildIntent[] {
  return Object.values(IntentsRegistry);
}
