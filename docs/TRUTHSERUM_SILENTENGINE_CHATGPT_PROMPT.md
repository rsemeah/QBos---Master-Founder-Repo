# TruthSerum + SilentEngine — ChatGPT Context & Prompt Template

Purpose
- A single, copy-pasteable prompt and context bundle for ChatGPT (or Claude) that fully describes how this repo implements TruthSerum and SilentEngine, what artifacts exist, and a template for the exact action you want performed next.

How to use
1) Run the bundling script to collect artifacts and receipts:
   ```bash
   ./scripts/export-truthserum-silentengine-bundle.sh
   ```
   This writes an archive under `artifacts/`.

2) Upload the produced archive to the ChatGPT/Claude session or paste the key files (reports, receipts, verifier output).

3) Copy the prompt template below into the assistant input and fill the `GOAL` section with the concrete task you want.

Prompt template (system / developer guidance)
-------------------------------------------
System: You are an expert developer and auditor with full context about this repository. You MUST only trust claims that are backed by verified TruthSerum receipts. Use the provided archive contents to reason about what is built and what works.

Developer: This repository contains a TruthSerum implementation (signing receipts, verifier), smoke tests and CI workflows. It also contains a SilentEngine package. Your job is to inspect the artifacts and produce a precise list of actions required to complete the requested GOAL. For each action, indicate whether it is backed by verified receipts, unknown, or impossible given the provided artifacts.

User prompt (fill this and send)
--------------------------------
Context summary (paste a short summary here or leave blank to use archive contents):
- Repo: QBos---Master-Founder-Repo
- Commit: [paste commit sha]
- Branch: [paste branch]

GOAL (one sentence, be specific):
Example: "Produce a CI workflow that will run the TruthSerum smoke test, verify the latest receipt with the registered public key, and upload proof artifacts. If secrets are missing, fail the verify step and still upload artifacts. Then open a PR with the updated workflow."

Constraints / Safety:
- Do not modify production secrets.
- If any operation requires a credential not present in the archive, mark as REQUIRES_SECRET and do not attempt it.

Output Format (required):
1) A short summary of whether the GOAL is achievable from the provided artifacts (YES / PARTIAL / NO) with one-line rationale.
2) A numbered plan of specific code changes or commands to run (each item: one sentence). For code changes, include file path and small diff if possible.
3) For each step, indicate the evidence (file + receipt id + verification status) that supports the claim that the step will succeed.
4) A final checklist of items YOU (the assistant) can apply automatically if given an autopilot token, and items the human must do.

Finish by asking clarifying questions if any assumptions are needed.

Why this works
- The archive contains: keystore implementation, ReceiptWriter, verify-receipt, smoke scripts, migrations, and receipts (JSONL). The verifier processes receipts and returns exit code 0 for verified receipts. The template forces the model to only trust verified receipts.

End of template
