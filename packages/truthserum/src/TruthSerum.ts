/**
 * TruthSerum - The canonical proof verification engine
 * NEVER upgrades Unknown to Verified without receipts
 */

import {
  TruthState,
  TruthVerdict,
  TruthClaim,
  Receipt,
  BuildIntent,
  IntentEvaluation,
  ProofRequirement,
} from "./types";

export class TruthSerum {
  /**
   * Evaluate an intent against available receipts
   * Returns Verified ONLY if all required proofs exist
   */
  static evaluateIntent(
    intent: BuildIntent,
    receipts: Receipt[]
  ): IntentEvaluation {
    const foundProofs: Receipt[] = [];
    const missingProofs: ProofRequirement[] = [];

    for (const requirement of intent.requiredProofs) {
      const found = receipts.find((r) => r.type === requirement.type);
      if (found) {
        foundProofs.push(found);
      } else if (requirement.required) {
        missingProofs.push(requirement);
      }
    }

    const state: TruthState =
      missingProofs.length === 0 ? "Verified" : "Unknown";

    const nextSteps = missingProofs.map(
      (mp) => `Obtain proof: ${mp.type} - ${mp.description}`
    );

    return {
      intent,
      state,
      missingProofs,
      foundProofs,
      nextSteps,
    };
  }

  /**
   * Sanitize claims by rewriting unproven success language
   * Forbidden words unless backed by receipts:
   * - deployed, live, published, ready, working, completed, fixed, verified
   */
  static sanitizeClaims(
    draftText: string,
    receipts: Receipt[],
    overallState: TruthState
  ): TruthVerdict {
    const forbiddenClaims: TruthClaim[] = [
      {
        claimText: /\b(deployed|live|published)\b/gi,
        requiredProofs: ["vercel.deploy_success", "vercel.healthcheck_ok"],
        contextHints: ["deployment", "url", "site"],
      },
      {
        claimText: /\b(build|built)\s+(passed|works|successful)/gi,
        requiredProofs: ["build.passed"],
        contextHints: ["build", "compile"],
      },
      {
        claimText: /\b(ready|working|completed)\b/gi,
        requiredProofs: ["session.created"], // Context-specific, minimal
        contextHints: [],
      },
      {
        claimText: /\b(authenticated|logged in)\b/gi,
        requiredProofs: ["identity.authenticated"],
        contextHints: ["auth", "login", "user"],
      },
      {
        claimText: /\b(connected)\b/gi,
        requiredProofs: ["supabase.connected"],
        contextHints: ["database", "supabase"],
      },
    ];

    let sanitizedText = draftText;
    const missingProofs: string[] = [];

    for (const claim of forbiddenClaims) {
      if (claim.claimText instanceof RegExp && claim.claimText.test(draftText)) {
        // Check if required proofs exist
        const hasProof = claim.requiredProofs.every((requiredType) =>
          receipts.some((r) => r.type === requiredType)
        );

        if (!hasProof) {
          // Rewrite to truthful language
          sanitizedText = sanitizedText.replace(
            claim.claimText,
            (match) => {
              missingProofs.push(...claim.requiredProofs);
              return `status unknown for ${match}`;
            }
          );
        }
      }
    }

    return {
      state: overallState,
      missingProofs: [...new Set(missingProofs)] as any,
      foundReceipts: receipts,
      sanitizedText: sanitizedText !== draftText ? sanitizedText : undefined,
      nextActions:
        missingProofs.length > 0
          ? [`Obtain receipts: ${[...new Set(missingProofs)].join(", ")}`]
          : [],
    };
  }

  /**
   * Compute overall readiness state from multiple intent evaluations
   */
  static computeOverallState(evaluations: IntentEvaluation[]): TruthState {
    const hasBlocked = evaluations.some((e) => e.state === "Blocked");
    const hasUnknown = evaluations.some((e) => e.state === "Unknown");

    if (hasBlocked) return "Blocked";
    if (hasUnknown) return "Unknown";
    return "Verified";
  }

  /**
   * Verify a claim with explicit proof requirements
   */
  static verifyClaim(claim: TruthClaim, receipts: Receipt[]): TruthVerdict {
    const foundReceipts = receipts.filter((r) =>
      claim.requiredProofs.includes(r.type as any)
    );
    const missingProofs = claim.requiredProofs.filter(
      (required) => !foundReceipts.some((r) => r.type === required)
    );

    const state: TruthState = missingProofs.length === 0 ? "Verified" : "Unknown";

    return {
      state,
      missingProofs,
      foundReceipts,
      nextActions:
        missingProofs.length > 0
          ? [`Missing proof: ${missingProofs.join(", ")}`]
          : [],
    };
  }
}
