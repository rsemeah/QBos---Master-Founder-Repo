#!/usr/bin/env node
/*
  Script: prove-truthserum
  - Writes signed receipts for a small set of proofs
  - Evaluates intents via TruthSerum and prints verdicts
*/
const TS = require("@qbos/truthserum");

async function run() {
  console.log("Writing test receipts...");
  // write receipts required for rob.ready
  await TS.ReceiptWriter.writeReceipt({
    type: "identity.authenticated",
    details: { user: "maintainer" },
  });
  await TS.ReceiptWriter.writeReceipt({
    type: "billing.cap_not_exceeded",
    details: { cap: true },
  });
  await TS.ReceiptWriter.writeReceipt({
    type: "safety.passed",
    details: { ok: true },
  });

  // also write session.ready proofs
  await TS.ReceiptWriter.writeReceipt({
    type: "session.created",
    details: { sessionId: "s-demo" },
  });
  await TS.ReceiptWriter.writeReceipt({
    type: "billing.active",
    details: { plan: "pro" },
  });

  const receipts = await TS.ReceiptWriter.readReceipts();
  console.log("Total receipts written:", receipts.length);

  const intents = ["rob.ready", "session.ready", "deploy.ready"];
  for (const id of intents) {
    const intent = TS.getIntent(id);
    if (!intent) {
      console.log("No intent found for", id);
      continue;
    }
    const evalRes = TS.TruthSerum.evaluateIntent(intent, receipts);
    console.log("\nIntent:", id);
    console.log(JSON.stringify(evalRes, null, 2));
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
