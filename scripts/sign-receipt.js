#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

function stableStringify(obj) {
  if (obj === null || typeof obj !== "object") return JSON.stringify(obj);
  if (Array.isArray(obj)) return "[" + obj.map(stableStringify).join(",") + "]";
  const keys = Object.keys(obj).sort();
  return (
    "{" +
    keys
      .map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k]))
      .join(",") +
    "}"
  );
}

const args = process.argv.slice(2);
if (args.length < 1) {
  console.error(
    "Usage: node scripts/sign-receipt.js <payload.json> [output.json]",
  );
  process.exit(2);
}

const payloadPath = path.resolve(args[0]);
const outPath = args[1]
  ? path.resolve(args[1])
  : path.join(".robby", "receipts", path.basename(payloadPath));

if (!fs.existsSync(payloadPath)) {
  console.error("Payload file not found:", payloadPath);
  process.exit(2);
}

const privPem =
  process.env.RECEIPT_SIGNING_KEY ||
  (process.env.HOME
    ? path.join(process.env.HOME, ".ssh", "robby_signing_key.pem")
    : null);
if (!privPem) {
  console.error(
    "Private key not provided. Set RECEIPT_SIGNING_KEY (PEM) or place private key at ~/.ssh/robby_signing_key.pem",
  );
  process.exit(2);
}

let privKeyData = privPem;
if (fs.existsSync(privPem)) privKeyData = fs.readFileSync(privPem, "utf8");

const payload = JSON.parse(fs.readFileSync(payloadPath, "utf8"));
const payloadString = stableStringify(payload);
const payloadBuf = Buffer.from(payloadString, "utf8");

const privateKey = crypto.createPrivateKey(privKeyData);
const sig = crypto.sign(null, payloadBuf, privateKey);
const receipt = { payload, signature: sig.toString("base64") };

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(receipt, null, 2));
console.log("Signed receipt written to", outPath);
