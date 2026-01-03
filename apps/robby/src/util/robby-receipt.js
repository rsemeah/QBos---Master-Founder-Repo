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
exports.ensureReceiptsDir = ensureReceiptsDir;
exports.robbyReceipt = robbyReceipt;
const fs = __importStar(require("node:fs"));
const path = __importStar(require("node:path"));
const RECEIPTS_PATH = path.resolve('receipts/robby/robby.receipts.jsonl');
async function ensureReceiptsDir() {
    const dir = path.dirname(RECEIPTS_PATH);
    if (!fs.existsSync(dir))
        fs.mkdirSync(dir, { recursive: true });
}
async function robbyReceipt(type, payload = {}) {
    await ensureReceiptsDir();
    const id = `${type.replace(/[^a-z0-9_.-]/gi, '_')}_${Date.now()}`;
    const r = {
        id,
        timestamp: new Date().toISOString(),
        type,
        payload
    };
    try {
        // Try to dynamically load the ReceiptWriter in a resilient way
        let ReceiptWriter = null;
        try {
            const mod = await Promise.resolve().then(() => __importStar(require('@qbos/truthserum')));
            ReceiptWriter = mod.ReceiptWriter ?? mod.default ?? mod;
        }
        catch (e) {
            ReceiptWriter = null;
        }
        const hasPrivateKey = !!process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64;
        const hasPublicKeyPath = !!process.env.PUBLIC_KEY_PATH || fs.existsSync('.keys/public.pem');
        if (hasPrivateKey && ReceiptWriter && typeof ReceiptWriter.writeReceipt === 'function') {
            try {
                const signed = await ReceiptWriter.writeReceipt({ sessionId: 'robby', type, details: payload });
                r.signerKeyId = signed.signerKeyId || null;
                r.signature = signed.signature || null;
            }
            catch (e) {
                r.signerKeyId = null;
                r.signature = null;
                r.payload.__error = `ReceiptWriter signing failed: ${String(e?.message || e)}`;
            }
        }
        else if (hasPublicKeyPath) {
            r.signerKeyId = null;
            r.signature = null;
            r.payload.__status = 'DEGRADED_NO_SIGNING_KEY';
        }
        else {
            r.signerKeyId = null;
            r.signature = null;
            r.payload.__status = 'BLOCKED_NO_KEYS';
        }
    }
    catch (err) {
        r.signerKeyId = null;
        r.signature = null;
        r.payload.__error = String(err?.message || err);
    }
    fs.appendFileSync(RECEIPTS_PATH, JSON.stringify(r) + '\n', 'utf8');
    return r;
}
//# sourceMappingURL=robby-receipt.js.map