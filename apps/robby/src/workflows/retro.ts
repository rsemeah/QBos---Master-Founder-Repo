import * as fs from 'node:fs';
import * as path from 'node:path';
import { robbyReceipt } from '../util/robby-receipt.js';

function classifyUnknown(entry: any) {
  const stderr = (entry?.verification?.stderr || '') as string;
  const stdout = (entry?.verification?.stdout || '') as string;
  if (/Buffer.from\(|ENOENT: .* '--json'/.test(stderr) || /TypeError/.test(stderr)) {
    return { category: 'NON_RECEIPT', reason: 'Verifier invoked on non-receipt' };
  }
  const pubMatch = stdout.match(/computed public key id: (\w+)/);
  const sigMatch = stdout.match(/receipt signerKeyId: (\w+)/);
  if (pubMatch && sigMatch) {
    const pubId = pubMatch[1];
    const sigId = sigMatch[1];
    if (pubId === sigId) return { category: 'FAILED_SIGNATURE', reason: 'ID matched but signature failed' };
    return { category: 'KEY_MISMATCH', reason: `computed ${pubId} vs signer ${sigId}` };
  }
  return { category: 'UNKNOWN_UNCLASSIFIED', reason: 'No useful stdout/stderr' };
}

export async function retro() {
  const artifactsDir = path.resolve('artifacts');
  const reports: any[] = [];

  if (fs.existsSync(artifactsDir)) {
    const files = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.report.json') || f.endsWith('.report.jsonl') || f.endsWith('.json'));
    for (const f of files) {
      try {
        const raw = fs.readFileSync(path.join(artifactsDir, f), 'utf8');
        reports.push(JSON.parse(raw));
      } catch (_) {
        // ignore malformed artifact
      }
    }
  }

  const receiptsPath = path.resolve('receipts/robby/robby.receipts.jsonl');
  let localLines: string[] = [];
  if (fs.existsSync(receiptsPath)) {
    localLines = fs.readFileSync(receiptsPath, 'utf8').split(/\r?\n/).filter(Boolean);
  }

  type UnknownRecord = { id: string | null; classification: any; verification: any };
  const unknowns: UnknownRecord[] = [];
  for (const rep of reports) {
    const recs = (rep?.receipts?.unknown) || [];
    for (const u of recs) {
      const classification = classifyUnknown(u);
      unknowns.push({ id: u?.id || null, classification, verification: u?.verification || null });
    }
  }

  const result = {
    timestamp: new Date().toISOString(),
    reports: reports.length,
    localReceiptsCount: localLines.length,
    unknownsCount: unknowns.length,
    unknowns
  };

  const receipt = await robbyReceipt('robby.retro.run', { reports: reports.length, unknowns: unknowns.length });
  const outPath = path.resolve('artifacts/robby.retro.json');
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
  return { status: 'COMPLETE', result, receipt };
}
