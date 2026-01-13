/*
 * QuietBuild OS Witness Script: Phase 4 Execution Attempt (Refusal Demonstration)
 *
 * This script attempts a Phase 4 core modification setup in production mode.
 * It intentionally uses development keys and local nonce storage to trigger
 * the execution-blocking safeguards. The goal is to demonstrate:
 *  - A real Phase 4 setup attempt
 *  - The exact blocking error thrown
 *  - A witness receipt emitted
 *  - Clean halt with no side effects beyond an append-only receipt
 */

import { createHash, randomBytes } from "crypto";
import * as fs from "fs";
import * as path from "path";

// Import Phase 4 modules directly from the monorepo
import { Phase4DualKeyApprovalSystem } from "../packages/engines/execution-engine/core/src/permissions/Phase4DualKeyApprovalSystem";
import { NonceRegistry } from "../packages/engines/execution-engine/core/src/receipts/NonceRegistry";

function setProdEnv() {
  process.env.NODE_ENV = "production";
  process.env.ROBBY_PRODUCTION = "true";
  process.env.ROBBY_VERIFIER_REQUIRED = "true"; // ensure verifier requirement is active
}

function nowISO() {
  return new Date().toISOString();
}

function writeWitnessReceipt(type: string, details: Record<string, unknown>) {
  const receiptsPath = path.resolve("ci-artifact/local_receipts.jsonl");
  const id = `witness.phase4.execution_blocked_${Date.now()}`;
  const nonce = randomBytes(8).toString("hex");
  const payload = JSON.stringify({ type, details });
  const verification_hash = createHash("sha256").update(payload).digest("hex");
  const receipt = {
    id,
    createdAt: nowISO(),
    sessionId: "witness-phase4",
    type: "robby.phase4.execution.blocked",
    verification_hash,
    parentReceiptId: null,
    nonce,
    signerKeyId: "witness",
    signature: "", // witness receipts are unsigned in local developer mode
    algo: "none",
  };
  const line = JSON.stringify(receipt) + "\n";
  fs.mkdirSync(path.dirname(receiptsPath), { recursive: true });
  fs.appendFileSync(receiptsPath, line, { encoding: "utf8" });
  return receipt;
}

async function main() {
  setProdEnv();

  const results: { step: string; ok: boolean; error?: string }[] = [];
  let blockingError: string | undefined;

  try {
    // 1) Attempt to initialize approval system with dev keys in production
    const human = Phase4DualKeyApprovalSystem.generateDevKeyPair();
    const policy = Phase4DualKeyApprovalSystem.generateDevKeyPair();

    try {
      // HSM disabled, dev keys provided -> should throw PRODUCTION_KEYS_REQUIRED in production
      new Phase4DualKeyApprovalSystem(
        human.publicKey,
        policy.publicKey,
        { enabled: false },
        {
          humanPrivateKey: human.privateKey,
          policyPrivateKey: policy.privateKey,
        }
      );
      results.push({ step: "Phase4DualKeyApprovalSystem.init", ok: true });
    } catch (e: any) {
      blockingError = String(e?.message || e);
      results.push({
        step: "Phase4DualKeyApprovalSystem.init",
        ok: false,
        error: blockingError,
      });
    }

    // 2) Attempt to initialize NonceRegistry in local mode in production
    if (!blockingError) {
      try {
        // local storage in production should throw NONCE_REGISTRY_REQUIRES_LEDGER
        new NonceRegistry(undefined, 24, "local");
        results.push({ step: "NonceRegistry.init", ok: true });
      } catch (e: any) {
        blockingError = String(e?.message || e);
        results.push({
          step: "NonceRegistry.init",
          ok: false,
          error: blockingError,
        });
      }
    }

    // 3) Print summary and capture receipt
    console.log("\n=== Witness: Phase 4 Execution Attempt (Production) ===\n");
    console.log(`Environment: NODE_ENV=${process.env.NODE_ENV}`);
    console.log(`Production mode: ${process.env.ROBBY_PRODUCTION === "true"}`);
    console.log(
      `Verifier required: ${process.env.ROBBY_VERIFIER_REQUIRED === "true"}\n`
    );

    let refusalObserved = false;

    for (const r of results) {
      const mark = r.ok ? "✔" : "✖";
      console.log(`${mark} ${r.step}: ${r.ok ? "OK" : r.error}`);
      if (!r.ok) refusalObserved = true;
    }

    if (refusalObserved && blockingError) {
      console.log(`\n✖ Production execution blocked: ${blockingError}\n`);
      console.log("Exact blocking error:");
      console.log(blockingError);

      // Write witness receipt
      const receipt = writeWitnessReceipt("robby.phase4.execution.blocked", {
        environment: process.env.NODE_ENV,
        production: process.env.ROBBY_PRODUCTION === "true",
        blockingError,
        stepsAttempted: results.length,
        timestamp: nowISO(),
      });

      console.log("\nWitness receipt emitted (append-only):");
      console.log(JSON.stringify(receipt, null, 2));
      console.log("\n✔ Refusal observed. Halting cleanly with exit 0.\n");
      process.exit(0);
    } else {
      console.log(
        "\n✖ WARNING: Expected production refusal, but none occurred."
      );
      console.log(
        "This indicates execution-blocking safeguards may not be active.\n"
      );
      process.exit(1);
    }
  } catch (err: any) {
    console.error("\n✖ Unexpected error during witness script execution:");
    console.error(err);
    process.exit(1);
  }
}

main();
