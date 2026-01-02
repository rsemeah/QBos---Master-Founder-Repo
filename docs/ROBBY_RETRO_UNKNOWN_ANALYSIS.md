Robby Retro-Analysis: Explaining UNKNOWNs
=========================================

Purpose
-------
This document explains, in machine-friendly but human-readable form, what the `UNKNOWN` and `ParseErrors` results mean in TruthSerum reports and how Robby (an LLM agent) should retro-analyze them without executing shell commands or making changes. It assumes the existing build pattern and cadence observed in the repo: receipts written to `proof/local_receipts.jsonl`, verification run with `verify-receipt.js`, and reports in `artifacts/*.report.json`.

High-level categories of UNKNOWNs
--------------------------------
1. Non-receipt files scanned (verifier invoked on regular files)
   - Symptom: verifier stderr shows TypeError/Buffer.from(undefined) or ENOENT referencing `--json`.
   - Meaning: the collector mistakenly passed a non-receipt object to the verifier.
   - Resolution: cannot be retro-verified. Mark as UNKNOWN (locked).

2. Missing / mismatched public key (receipt present but signature fails)
   - Symptom: verifier ran, printed `computed public key id: <idA>` and `receipt signerKeyId: <idB>`, verification false.
   - Meaning: receipt was signed by a key the verifier does not have; the key ID derivation differs or key absent.
   - Resolution: retro-verify only if the matching public PEM or registry entry is provided.

3. Parse errors (malformed JSONL or corrupted lines)
   - Symptom: `parseErrorsCount > 0` in report; parse-scan of `proof/local_receipts.jsonl` shows bad lines.
   - Meaning: receipt lines were truncated or non-JSON; cannot verify until corrected.
   - Resolution: list offending lines; request original raw lines or exclude them.

Assumptions (what Robby can assume about the build pattern)
-----------------------------------------------------------
- Receipts are JSON objects with at least `signature` and `signerKeyId` fields when valid.
- Verifier computes canonical `keyId` as: sha256(SPKI_DER(publicKey)).hex.slice(0,16).
- Reports live under `artifacts/*.report.json` and include `receipts.{verified,failed,unknown,parseErrors}` arrays.
- Robby must not modify files or run writes; only read and return structured analysis.

Inputs Robby should read (read-only)
-----------------------------------
- `artifacts/*.report.json` (report source)
- `proof/local_receipts.jsonl` and any `collected/*/local_receipts.jsonl`
- `verify-receipt.js` (to understand stderr patterns and key-id derivation)
- `packages/truthserum/src/keystore.ts` (to confirm signer key rules)

Algorithm Robby must follow (deterministic, read-only)
----------------------------------------------------
1. Load the latest `artifacts/*.report.json` (or all reports) and build a list of entries in `receipts.unknown` and `receipts.parseErrors`.
2. For each UNKNOWN entry:
   a. Inspect `verification.stderr` and `verification.stdout` in the report entry.
   b. If stderr contains patterns like `TypeError`, `Buffer.from(undefined)`, `ENOENT: no such file or directory, open '--json'` => classify as NON_RECEIPT. Produce UNKNOWN-NonReceipt output (locked).
   c. Else if stdout contains `computed public key id: <pubId>` and `receipt signerKeyId: <sigId>`:
      - If `pubId === sigId` and verifier still returned failure, mark as FAILED (signature check failed despite ID match).
      - If `pubId !== sigId`, mark as KEY_MISMATCH. Required evidence: public PEM for `sigId` (or registry row). If PEM available in artifacts or env snapshot in report, attempt to verify logically (compare derived id to signerKeyId). Otherwise mark UNKNOWN (locked) and list the missing PEM/key-id.
   d. Else, mark as UNKNOWN-Unclassified and include stderr/stdout.
3. For each ParseError entry: include file path, parse error message (from report or parsing attempt), and the raw sample (first 200 chars) if available; mark as PARSE_ERROR and request the original raw line(s).
4. Produce output for each UNKNOWN in the strict structured format (see Required Output Format below).

Required Output Format (exact structure Robby must emit)
-----------------------------------------------------
For each UNKNOWN, Robby must produce:

## UNKNOWN-[short-id]

Evidence Reviewed:
- [file / report entry]

What This UNKNOWN Represents:
[short factual statement]

Can this be resolved retroactively?
YES / NO / MAYBE

If YES:
- Receipt(s) that resolve it:
- Verification that proves it:
- Resulting status: VERIFIED / FAILED

If NO:
- Missing evidence:
- Why it cannot be inferred safely:
- Resulting status: UNKNOWN (LOCKED)

At the end produce a summary block:

### Retroactive Resolution Summary

UNKNOWNs reviewed: X
Resolved to VERIFIED: Y
Resolved to FAILED: Z
Remaining UNKNOWN: N

Structural causes of remaining UNKNOWNs:
- list

Practical heuristics and templates (what to ask a human)
-----------------------------------------------------
- If KEY_MISMATCH: "Provide the public PEM corresponding to `signerKeyId: <id>` or add it to the Supabase trust registry."
- If PARSE_ERROR: "Provide the original receipt file or the exact raw lines that failed parsing." 
- If NON_RECEIPT: "This file is not a receipt. Narrow collector paths or mark it excluded." 

Example Robby action (read-only) pseudocode
-------------------------------------------
1. reports = readAll('artifacts/*.report.json')
2. unknowns = flatten(reports.receipts.unknown)
3. for u in unknowns:
     stderr = u.verification.stderr || ''
     stdout = u.verification.stdout || ''
     if /Buffer.from\(|ENOENT: .* '--json'/.test(stderr): classify NON_RECEIPT
     else if (/computed public key id: (\w+)/.test(stdout) && /receipt signerKeyId: (\w+)/.test(stdout)):
         pubId = match1; sigId = match2
         if (pubId === sigId) then attempt to call verifier logic in-memory (only if public PEM present in artifacts) else KEY_MISMATCH
     else PARSE_ERROR or UNKNOWN-UNCLASSIFIED

What Robby must never do in retro-analysis
-----------------------------------------
- Do not generate or set keys.
- Do not alter receipts, reports, or DB.
- Do not claim VERIFIED without cryptographic proof (verifier exit code 0 + matching public key).

Output placement
----------------
Robby should return the analysis as a JSON object and a plain-text report. Use the repo-relative path `docs/ROBBY_RETRO_UNKNOWN_ANALYSIS.md` as the human-readable artifact and produce `artifacts/robby-retro-unknowns.json` for machine consumption.

Closing note
------------
This guidance lets Robby convert report noise into deterministic categories and precise human asks. It preserves TruthSerum discipline: Robby reports what can be proven, lists what is missing, and refuses to invent or mutate evidence.
