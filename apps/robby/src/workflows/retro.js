"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.retro = retro;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const robby_receipt_js_1 = require("../util/robby-receipt.js");
function classifyUnknown(entry) {
    const stderr = (entry?.verification?.stderr || '');
    const stdout = (entry?.verification?.stdout || '');
    if (/Buffer.from\(|ENOENT: .* '--json'/.test(stderr) || /TypeError/.test(stderr)) {
        return { category: 'NON_RECEIPT', reason: 'Verifier invoked on non-receipt' };
    }
    const pubMatch = stdout.match(/computed public key id: (\w+)/);
    const sigMatch = stdout.match(/receipt signerKeyId: (\w+)/);
    if (pubMatch && sigMatch) {
        const pubId = pubMatch[1];
        const sigId = sigMatch[1];
        if (pubId === sigId)
            return { category: 'FAILED_SIGNATURE', reason: 'ID matched but signature failed' };
        return { category: 'KEY_MISMATCH', reason: `computed ${pubId} vs signer ${sigId}` };
    }
    return { category: 'UNKNOWN_UNCLASSIFIED', reason: 'No useful stdout/stderr' };
}
async function retro() {
    const artifactsDir = path.resolve('artifacts');
    const reports = [];
    if (fs.existsSync(artifactsDir)) {
        const files = fs.readdirSync(artifactsDir).filter(f => f.endsWith('.report.json') || f.endsWith('.report.jsonl') || f.endsWith('.json'));
        for (const f of files) {
            try {
                const raw = fs.readFileSync(path.join(artifactsDir, f), 'utf8');
                reports.push(JSON.parse(raw));
            }
            catch (_) {
                // ignore malformed artifact
            }
        }
    }
    const receiptsPath = path.resolve('receipts/robby/robby.receipts.jsonl');
    let localLines = [];
    if (fs.existsSync(receiptsPath)) {
        localLines = fs.readFileSync(receiptsPath, 'utf8').split(/\r?\n/).filter(Boolean);
    }
    const unknowns = [];
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
    const receipt = await (0, robby_receipt_js_1.robbyReceipt)('robby.retro.run', { reports: reports.length, unknowns: unknowns.length });
    const outPath = path.resolve('artifacts/robby.retro.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2), 'utf8');
    return { status: 'COMPLETE', result, receipt };
}
//# sourceMappingURL=retro.js.map