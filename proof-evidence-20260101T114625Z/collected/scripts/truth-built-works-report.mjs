// FILE: scripts/truth-built-works-report.mjs
// Purpose:
// - Crawl receipts in the repo (receipts/ + proof/ + any *.jsonl/*.json receipts)
// - Verify each receipt using the repo's verify-receipt.js (TruthSerum verification)
// - Produce:
//   1) artifacts/truth-built-works.report.json (machine-readable)
//   2) artifacts/truth-built-works.report.md   (human-readable, "level set")
//
// Truth rules:
// - Only count a thing as "WORKS" if at least one receipt is VERIFIED by verify-receipt.js
// - If verification cannot run (missing keys, missing verifier, parse errors), classify as UNKNOWN
//
// Requirements:
// - Node 18+
// - Repo has verify-receipt.js at root (as shown in your tree)
// - Receipts are JSON objects or JSONL lines; best-effort parsing

import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const OUT_DIR = path.join(ROOT, "artifacts");
const DEFAULT_RECEIPT_DIRS = [
  path.join(ROOT, "receipts"),
  path.join(ROOT, "proof"),
  path.join(ROOT, "artifacts"),
];

const VERIFY_SCRIPT = path.join(ROOT, "verify-receipt.js");

// ---------- helpers ----------
function exists(p) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function sha256(s) {
  return crypto.createHash("sha256").update(s).digest("hex");
}

function walk(dir, filelist = []) {
  if (!exists(dir)) return filelist;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) {
      walk(fp, filelist);
    } else {
      filelist.push(fp);
    }
  }
  return filelist;
}

function looksLikeReceiptFile(fp) {
  const name = fp.toLowerCase();
  return (
    name.endsWith(".jsonl") ||
    name.endsWith(".json") ||
    name.includes("receipt") ||
    name.includes("receipts")
  );
}

function readText(fp) {
  return fs.readFileSync(fp, "utf8");
}

function safeJsonParse(line, context) {
  try {
    return JSON.parse(line);
  } catch (e) {
    return { __parse_error: true, __context: context, __error: String(e), __raw: line };
  }
}

function parseReceiptFile(fp) {
  const txt = readText(fp);
  const ext = fp.toLowerCase().endsWith(".jsonl") ? "jsonl" : "json";

  if (ext === "jsonl") {
    const lines = txt
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    return lines.map((line, idx) => safeJsonParse(line, `${fp}:L${idx + 1}`));
  }

  // .json may be a single receipt OR an array/object wrapper
  const obj = safeJsonParse(txt, fp);
  if (obj?.__parse_error) return [obj];

  if (Array.isArray(obj)) return obj;
  // common pattern: { receipts: [...] }
  if (obj && typeof obj === "object") {
    if (Array.isArray(obj.receipts)) return obj.receipts;
    return [obj];
  }

  return [obj];
}

function guessEngineFromReceipt(r) {
  const t = (r?.type || r?.eventType || r?.intent || "").toString().toLowerCase();
  const p = (r?.path || r?.route || r?.endpoint || "").toString().toLowerCase();
  const s = JSON.stringify(r).toLowerCase();

  const hints = [
    ["execution", "ExecutionEngine"],
    ["identity", "IdentityEngine"],
    ["charter", "CharterEngine"],
    ["consent", "CharterEngine"],
    ["config", "ConfigEngine"],
    ["paywall", "PaywallEngine"],
    ["billing", "PaywallEngine"],
    ["notification", "NotificationsEngine"],
    ["sight", "SightEngine"],
    ["silent", "SilentEngine"],
    ["truth", "TruthSerum"],
  ];

  for (const [needle, label] of hints) {
    if (t.includes(needle) || p.includes(needle) || s.includes(`"${needle}`) || s.includes(needle)) {
      return label;
    }
  }
  return "UnknownEngine";
}

function guessSurfaceFromReceipt(r) {
  const p = (r?.path || r?.route || r?.endpoint || "").toString().toLowerCase();
  const s = JSON.stringify(r).toLowerCase();

  if (p.includes("/api/") || s.includes("/api/")) return "API";
  if (p.includes("/rob") || s.includes("/rob")) return "RobUI";
  if (s.includes("proof-harness") || p.includes("proof-harness")) return "ProofHarness";
  if (s.includes("nextjs-demo") || p.includes("nextjs-demo")) return "ExampleApp";
  return "UnknownSurface";
}

function normalizeReceipt(r) {
  // Keep a stable minimal snapshot so we don't accidentally print secrets
  const id =
    r?.id ||
    r?.receiptId ||
    r?.hash ||
    r?.signature?.receiptId ||
    r?.details?.receiptId ||
    sha256(JSON.stringify(r)).slice(0, 16);

  const type = r?.type || r?.eventType || r?.intent || "unknown.type";
  const sessionId = r?.sessionId || r?.session || r?.context?.sessionId || "unknown.session";
  const timestamp = r?.timestamp || r?.time || r?.createdAt || r?.details?.timestamp || null;
  const route = r?.route || r?.path || r?.endpoint || r?.details?.route || null;

  return {
    id: String(id),
    type: String(type),
    sessionId: String(sessionId),
    timestamp,
    route,
    engine: guessEngineFromReceipt(r),
    surface: guessSurfaceFromReceipt(r),
    raw: r,
  };
}

function verifyReceiptWithRepoVerifier(receiptObj) {
  // We call: node verify-receipt.js --json '<receipt>'
  // If verify-receipt.js uses different args, we fallback to stdin
  if (!exists(VERIFY_SCRIPT)) {
    return {
      status: "UNKNOWN",
      reason: "verify-receipt.js not found at repo root",
      stdout: "",
      stderr: "",
    };
  }

  const json = JSON.stringify(receiptObj);

  // Attempt argv mode
  let res = spawnSync(process.execPath, [VERIFY_SCRIPT, "--json", json], {
    encoding: "utf8",
    maxBuffer: 10 * 1024 * 1024,
  });

  // If verifier doesn't support --json, try stdin mode
  const maybeUnsupported =
    res.status !== 0 &&
    (res.stderr || "").toLowerCase().includes("unknown option") ||
    (res.stderr || "").toLowerCase().includes("unexpected");

  if (maybeUnsupported) {
    res = spawnSync(process.execPath, [VERIFY_SCRIPT], {
      input: json,
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
    });
  }

  const out = (res.stdout || "").trim();
  const err = (res.stderr || "").trim();

  // Heuristics (since we don't know verifier output contract):
  // - If exit code 0 => VERIFIED
  // - If exit code nonzero => FAILED/UNKNOWN depending on error text
  if (res.status === 0) {
    return { status: "VERIFIED", reason: "Verifier exit code 0", stdout: out, stderr: err };
  }

  const combined = `${out}\n${err}`.toLowerCase();
  if (
    combined.includes("missing key") ||
    combined.includes("no public key") ||
    combined.includes("pem") ||
    combined.includes("ed25519") ||
    combined.includes("base64") ||
    combined.includes("crypto") ||
    combined.includes("verification failed")
  ) {
    return { status: "FAILED", reason: "Verifier reported crypto/key failure", stdout: out, stderr: err };
  }

  return { status: "UNKNOWN", reason: "Verifier failed with unclassified error", stdout: out, stderr: err };
}

function mdEscape(s) {
  return String(s ?? "").replaceAll("|", "\\|").replaceAll("\n", " ");
}

// ---------- main ----------
ensureDir(OUT_DIR);

const candidateFiles = [];
for (const d of DEFAULT_RECEIPT_DIRS) {
  for (const fp of walk(d)) {
    if (looksLikeReceiptFile(fp)) candidateFiles.push(fp);
  }
}

// Also: scan root-level integration receipts JSONL you listed (if present)
const rootCandidates = ["integration_receipts.jsonl", "local_receipts.jsonl", "proof/local_receipts.jsonl"].map((p) =>
  path.join(ROOT, p)
);
for (const fp of rootCandidates) {
  if (exists(fp) && !candidateFiles.includes(fp)) candidateFiles.push(fp);
}

const parsed = [];
const parseErrors = [];

for (const fp of candidateFiles) {
  const receipts = parseReceiptFile(fp);

  for (const r of receipts) {
    if (r?.__parse_error) {
      parseErrors.push(r);
      continue;
    }
    // only accept objects
    if (!r || typeof r !== "object") continue;
    parsed.push({ file: fp, receipt: normalizeReceipt(r) });
  }
}

const verified = [];
const failed = [];
const unknown = [];

for (const item of parsed) {
  const v = verifyReceiptWithRepoVerifier(item.receipt.raw);
  const record = {
    file: item.file,
    verification: v,
    receipt: {
      id: item.receipt.id,
      type: item.receipt.type,
      sessionId: item.receipt.sessionId,
      timestamp: item.receipt.timestamp,
      route: item.receipt.route,
      engine: item.receipt.engine,
      surface: item.receipt.surface,
    },
    // fingerprints let you locate the raw receipt without dumping it
    raw_sha256: sha256(JSON.stringify(item.receipt.raw)),
  };

  if (v.status === "VERIFIED") verified.push(record);
  else if (v.status === "FAILED") failed.push(record);
  else unknown.push(record);
}

// Summarize "what's built AND works" = any engine/surface/route that appears in VERIFIED receipts
function aggByKey(rows, keyFn) {
  const m = new Map();
  for (const r of rows) {
    const k = keyFn(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return [...m.entries()].map(([k, arr]) => ({ key: k, count: arr.length, sample: arr[0] }));
}

const worksByEngine = aggByKey(verified, (r) => r.receipt.engine).sort((a, b) => b.count - a.count);
const worksBySurface = aggByKey(verified, (r) => r.receipt.surface).sort((a, b) => b.count - a.count);
const worksByRoute = aggByKey(
  verified.filter((r) => r.receipt.route),
  (r) => r.receipt.route
).sort((a, b) => b.count - a.count);
const worksByType = aggByKey(verified, (r) => r.receipt.type).sort((a, b) => b.count - a.count);

const report = {
  generatedAt: new Date().toISOString(),
  repoRoot: ROOT,
  verifier: exists(VERIFY_SCRIPT) ? "verify-receipt.js" : null,
  inputs: {
    scannedDirs: DEFAULT_RECEIPT_DIRS.filter(exists),
    candidateFilesCount: candidateFiles.length,
    parsedReceiptsCount: parsed.length,
    parseErrorsCount: parseErrors.length,
  },
  truth: {
    verifiedCount: verified.length,
    failedCount: failed.length,
    unknownCount: unknown.length,
  },
  works: {
    byEngine: worksByEngine,
    bySurface: worksBySurface,
    byRoute: worksByRoute,
    byType: worksByType,
  },
  receipts: {
    verified,
    failed: failed.slice(0, 200), // keep report size sane
    unknown: unknown.slice(0, 200),
    parseErrors: parseErrors.slice(0, 50),
  },
};

const outJson = path.join(OUT_DIR, "truth-built-works.report.json");
fs.writeFileSync(outJson, JSON.stringify(report, null, 2), "utf8");

// Markdown report for humans
const outMd = path.join(OUT_DIR, "truth-built-works.report.md");
let md = "";
md += `# TruthSerum Built+Works Report\n\n`;
md += `Generated: ${report.generatedAt}\n\n`;
md += `## What this report means\n\n`;
md += `A thing is counted as **WORKS** only if there is at least one **VERIFIED** TruthSerum receipt for it.\n\n`;
md += `## Counts\n\n`;
md += `- Verified receipts: **${report.truth.verifiedCount}**\n`;
md += `- Failed verification: **${report.truth.failedCount}**\n`;
md += `- Unknown verification: **${report.truth.unknownCount}**\n`;
md += `- Parse errors: **${report.inputs.parsedReceiptsCount} parsed, ${report.inputs.parseErrorsCount} parse errors**\n\n`;

md += `## WORKS by Engine (Verified receipts)\n\n`;
md += `| Engine | Verified Receipts |\n|---|---:|\n`;
for (const row of worksByEngine) md += `| ${mdEscape(row.key)} | ${row.count} |\n`;
md += `\n`;

md += `## WORKS by Surface\n\n`;
md += `| Surface | Verified Receipts |\n|---|---:|\n`;
for (const row of worksBySurface) md += `| ${mdEscape(row.key)} | ${row.count} |\n`;
md += `\n`;

md += `## WORKS by Route (if route present in receipts)\n\n`;
if (worksByRoute.length === 0) {
  md += `No verified receipts contained a route/path field.\n\n`;
} else {
  md += `| Route | Verified Receipts |\n|---|---:|\n`;
  for (const row of worksByRoute) md += `| ${mdEscape(row.key)} | ${row.count} |\n`;
  md += `\n`;
}

md += `## WORKS by Receipt Type\n\n`;
md += `| Type | Verified Receipts |\n|---|---:|\n`;
for (const row of worksByType.slice(0, 50)) md += `| ${mdEscape(row.key)} | ${row.count} |\n`;
if (worksByType.length > 50) md += `\n(Truncated; see JSON for full list.)\n\n`;

md += `## Verified receipt samples (first 25)\n\n`;
md += `| Engine | Surface | Type | Session | Timestamp | File | Receipt ID | Raw SHA256 |\n|---|---|---|---|---|---|---|---|\n`;
for (const r of verified.slice(0, 25)) {
  md += `| ${mdEscape(r.receipt.engine)} | ${mdEscape(r.receipt.surface)} | ${mdEscape(r.receipt.type)} | ${mdEscape(
    r.receipt.sessionId
  )} | ${mdEscape(r.receipt.timestamp)} | ${mdEscape(path.relative(ROOT, r.file))} | ${mdEscape(
    r.receipt.id
  )} | ${mdEscape(r.raw_sha256.slice(0, 16))}… |\n`;
}
md += `\n`;

md += `## Notes / Why you might see UNKNOWN\n\n`;
md += `- If verify-receipt.js requires public keys/secrets that are not available locally, verification may be UNKNOWN.\n`;
md += `- If receipts are present but malformed, they will show as parse errors.\n`;
md += `- This script does not assume "code exists" means "works". It only trusts verified receipts.\n\n`;

fs.writeFileSync(outMd, md, "utf8");

console.log(`✅ Wrote:\n- ${path.relative(ROOT, outJson)}\n- ${path.relative(ROOT, outMd)}\n`);
console.log(`Verified=${verified.length} Failed=${failed.length} Unknown=${unknown.length} ParseErrors=${parseErrors.length}`);

// Exit nonzero if nothing verified (useful for CI gating)
if (verified.length === 0) process.exit(2);
