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
exports.verify = verify;
exports.certify = certify;
const execa_1 = require("execa");
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const robby_receipt_js_1 = require("../util/robby-receipt.js");
async function runStep(cmd, cwd) {
    try {
        const r = await execa_1.execa.command(cmd, { cwd, shell: true, reject: false });
        return { exitCode: r.exitCode ?? 0, stdout: r.stdout ?? '', stderr: r.stderr ?? '' };
    }
    catch (e) {
        return { exitCode: 1, stdout: e.stdout ?? '', stderr: String(e.message || e) };
    }
}
async function verify(cwd) {
    const steps = [
        { name: 'collect-proof-evidence', cmd: 'NO_INSTALL=1 ./scripts/collect-proof-evidence.sh' },
        { name: 'verify-latest', cmd: 'chmod +x ./scripts/verify-latest.sh && ./scripts/verify-latest.sh' },
        { name: 'truth-built-works-report', cmd: 'node scripts/truth-built-works-report.mjs' }
    ];
    const results = [];
    await (0, robby_receipt_js_1.robbyReceipt)('robby.verification.ladder.start', { cwd, steps: steps.map(s => s.name) });
    for (const s of steps) {
        const res = await runStep(s.cmd, cwd);
        const stepResult = { name: s.name, cmd: s.cmd, exitCode: res.exitCode, stdout: res.stdout, stderr: res.stderr };
        results.push(stepResult);
        await (0, robby_receipt_js_1.robbyReceipt)(`robby.verification.step.${s.name}`, { step: s.name, exitCode: res.exitCode });
        if (res.exitCode !== 0)
            break;
    }
    const out = { timestamp: new Date().toISOString(), steps: results };
    const outPath = path.resolve('artifacts/robby.verification.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify(out, null, 2), 'utf8');
    const reportStep = results.find(r => r.name === 'truth-built-works-report');
    let summary = { verified: 0, failed: 0, unknown: 0, parseErrors: 0 };
    if (reportStep) {
        const outTxt = (reportStep.stdout || '') + '\n' + (reportStep.stderr || '');
        summary.verified = parseInt((outTxt.match(/Verified=(\d+)/) || [])[1] || '0', 10);
        summary.failed = parseInt((outTxt.match(/Failed=(\d+)/) || [])[1] || '0', 10);
        summary.unknown = parseInt((outTxt.match(/Unknown=(\d+)/) || [])[1] || '0', 10);
        summary.parseErrors = parseInt((outTxt.match(/ParseErrors=(\d+)/) || [])[1] || '0', 10);
    }
    const status = (summary.failed === 0 && summary.unknown === 0 && summary.parseErrors === 0 && summary.verified > 0) ? 'VERIFIED' : 'UNKNOWN';
    await (0, robby_receipt_js_1.robbyReceipt)('robby.verification.complete', { status, summary });
    return { status, summary, steps: results };
}
async function certify(cwd) {
    const v = await verify(cwd);
    const outPath = path.resolve('artifacts/robby.certify.json');
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, JSON.stringify({ timestamp: new Date().toISOString(), verification: v }, null, 2), 'utf8');
    if (v.status !== 'VERIFIED') {
        await (0, robby_receipt_js_1.robbyReceipt)('robby.certify.failed', { status: v.status, summary: v.summary });
        return { status: 'FAILED', verification: v };
    }
    await (0, robby_receipt_js_1.robbyReceipt)('robby.certify.success', { status: 'VERIFIED', summary: v.summary });
    return { status: 'VERIFIED', verification: v };
}
//# sourceMappingURL=verification_clean.js.map