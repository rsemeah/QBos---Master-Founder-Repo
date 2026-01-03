# @qbos/robby-pa

Scaffold for Robby PA conductor.

Quick demo (no deps):

```bash
# set mac secret then run demo
export ROBBY_RECEIPT_MAC_SECRET=\"your-secret\"
node packages/robby-pa/bin/robby-pa.cjs
```

Files added:
- `src/receipt.ts` - TypeScript implementations for create/verify receipts
- `src/store/inMemoryStore.ts` - in-memory store for local tests
- `sql/001_init.sql` - Postgres migration per spec
- `bin/robby-pa.cjs` - small demo runner (CommonJS)

Next steps:
- Add Postgres-backed store and migration runner
- Add Jest tests (language-canon + receipts)
- Wire package into monorepo build and CI
