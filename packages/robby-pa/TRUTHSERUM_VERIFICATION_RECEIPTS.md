## Verification Run: 2026-01-08

- Command: `pnpm -C packages/robby-pa install`
	- Exit Code: 0
	- Receipt: `receipts/robby-pa-verify-1767901698.install.json`

- Command: `pnpm -C packages/robby-pa build`
	- Exit Code: 0
	- Receipt: `receipts/robby-pa-verify-1767901698.build.json`

- Command: `pnpm -C packages/robby-pa test:unit`
	- Exit Code: 0
	- Result: Test Suites: 3 passed; Tests: 5 passed; Snapshots: 0
	- Receipt: `receipts/robby-pa-verify-1767901698.unit.json`

- Command: `docker compose -f packages/robby-pa/dev/docker-compose.pg.yml up -d`
	- Exit Code: non-zero (Docker daemon not running)
	- Integration Status: SKIPPED
	- Receipt: `receipts/robby-pa-verify-1767901698.integration.json`

- Proof Map: `receipts/robby-pa-verify-1767901698.proof-map.txt`
	- Status: CLAIMED (pending integration runtime proof)

# Robby PA Verification Receipts

**Date**: 2026-01-08
**Executor**: local pnpm (macOS)

## Commands and Exit Codes

| Step | Command | Exit | Notes |
| --- | --- | --- | --- |
| Apps build | `pnpm -C apps/robby build` | 0 | Next.js build + lint completed (warnings only) |
| Package build | `pnpm -C packages/robby-pa build` | 0 | TypeScript compile via `tsc -p .` |
| Package tests | `pnpm -C packages/robby-pa test` | 0 | Jest unit suites (3/3) passed |

## Logs (abridged)

### pnpm -C packages/robby-pa build
```
> @qbos/robby-pa@0.1.0 build
> tsc -p .
```

### pnpm -C packages/robby-pa test
```
> @qbos/robby-pa@0.1.0 test
> pnpm -C . test:unit

 PASS  src/__tests__/receipt.test.ts
 PASS  src/__tests__/stateMachine.test.ts
 PASS  src/__tests__/previewServer.test.ts

Test Suites: 3 passed, 3 total
Tests:       5 passed, 5 total
```

### pnpm -C apps/robby build
```
> @qbos/robby@0.1.0 build
> next build

✓ Compiled successfully
✓ Linting and checking validity of types
⚠ Warnings remain (any typing, console usage); no errors
```

## Verification Scope

- ✅ TypeScript compilation for robby-pa
- ✅ Unit tests for robby-pa (5 tests across 3 suites)
- ✅ Next.js app build (apps/robby) including lint/typecheck pass
- ⚠ Integration/DB/API/E2E not run in this pass
