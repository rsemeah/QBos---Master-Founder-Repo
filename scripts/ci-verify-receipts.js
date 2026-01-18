#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const TS = require("../packages/truthserum/dist");

function readReceiptsFromDir(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
  const receipts = [];
  for (const f of files) {
    try {
      const p = path.join(dir, f);
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      receipts.push(j);
    } catch (e) {
      console.error("failed to parse", f, e.message);
    }
  }
  return receipts;
}

async function run() {
  const dir = path.join(process.cwd(), ".robby", "receipts");
  const receipts = readReceiptsFromDir(dir);
  if (!receipts.length) {
    console.error("No receipts found in .robby/receipts");
    process.exit(1);
  }
  const intent = TS.getIntent("rob.ready");
  if (!intent) {
    console.error("No rob.ready intent registered");
    process.exit(1);
  }
  const ev = TS.TruthSerum.evaluateIntent(intent, receipts);
  console.log("rob.ready state:", ev.state);
  if (ev.state !== "Verified") {
    console.error(
      "rob.ready not Verified. missing:",
      ev.missingProofs.map((m) => m.type).join(", "),
    );
    process.exit(1);
  }
  console.log("rob.ready Verified");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
