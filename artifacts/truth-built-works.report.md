# TruthSerum Built+Works Report

Generated: 2026-01-01T12:43:24.374Z

## What this report means

A thing is counted as **WORKS** only if there is at least one **VERIFIED** TruthSerum receipt for it.

## Counts

- Verified receipts: **9**
- Failed verification: **0**
- Unknown verification: **38**
- Parse errors: **47 parsed, 13 parse errors**

## WORKS by Engine (Verified receipts)

| Engine | Verified Receipts |
|---|---:|
| TruthSerum | 9 |

## WORKS by Surface

| Surface | Verified Receipts |
|---|---:|
| UnknownSurface | 9 |

## WORKS by Route (if route present in receipts)

No verified receipts contained a route/path field.

## WORKS by Receipt Type

| Type | Verified Receipts |
|---|---:|
| smoke.test | 9 |
## Verified receipt samples (first 25)

| Engine | Surface | Type | Session | Timestamp | File | Receipt ID | Raw SHA256 |
|---|---|---|---|---|---|---|---|
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T01:53:01.299Z | proof/local_receipts.jsonl | smoke_1767232381299 | b36da898774df464… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T02:00:27.784Z | proof/local_receipts.jsonl | smoke_1767232827784 | 3307e35f6f050f0e… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T11:46:25.791Z | proof/local_receipts.jsonl | smoke_1767267985791 | 3029da9ea663b0fd… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T12:42:29.459Z | proof/local_receipts.jsonl | smoke_1767271349459 | f91239807e845413… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T12:43:22.027Z | proof/local_receipts.jsonl | smoke_1767271402027 | abd38261fb1eea5e… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T01:53:01.299Z | artifacts/truthserum-silentengine-bundle-20260101T114445Z/collected/local_receipts.jsonl | smoke_1767232381299 | b36da898774df464… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T02:00:27.784Z | artifacts/truthserum-silentengine-bundle-20260101T114445Z/collected/local_receipts.jsonl | smoke_1767232827784 | 3307e35f6f050f0e… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T01:53:01.299Z | artifacts/truthserum-silentengine-bundle-20260101T114445Z/collected/proof/local_receipts.jsonl | smoke_1767232381299 | b36da898774df464… |
| TruthSerum | UnknownSurface | smoke.test | smoke-test | 2026-01-01T02:00:27.784Z | artifacts/truthserum-silentengine-bundle-20260101T114445Z/collected/proof/local_receipts.jsonl | smoke_1767232827784 | 3307e35f6f050f0e… |

## Notes / Why you might see UNKNOWN

- If verify-receipt.js requires public keys/secrets that are not available locally, verification may be UNKNOWN.
- If receipts are present but malformed, they will show as parse errors.
- This script does not assume "code exists" means "works". It only trusts verified receipts.

