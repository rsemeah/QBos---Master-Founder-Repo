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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReceiptWriter = void 0;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto = __importStar(require("crypto"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const keystore_1 = __importDefault(require("./keystore"));
class ReceiptWriterImpl {
    supabase = null;
    useSupabase = false;
    config = {
        localFallbackPath: './proof/local_receipts.jsonl',
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL || undefined,
        supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || undefined,
    };
    constructor() {
        if (this.config.supabaseUrl && this.config.supabaseKey) {
            this.supabase = (0, supabase_js_1.createClient)(this.config.supabaseUrl, this.config.supabaseKey);
            this.useSupabase = true;
        }
    }
    generateId() {
        return `receipt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    }
    canonicalize(obj) {
        const step = (v) => {
            if (v === null || typeof v !== 'object')
                return v;
            if (Array.isArray(v))
                return v.map(step);
            const out = {};
            Object.keys(v).sort().forEach((k) => { out[k] = step(v[k]); });
            return out;
        };
        return JSON.stringify(step(obj));
    }
    async write(data) {
        const hash = crypto.createHash('sha256').update(JSON.stringify(data.details)).digest('hex');
        const fallbackReceipt = { id: this.generateId(), createdAt: new Date().toISOString(), ...data, verification_hash: hash };
        if (!this.useSupabase || !this.supabase) {
            await this.writeToLocalFile(fallbackReceipt);
            return { id: fallbackReceipt.id, hash };
        }
        try {
            const { data: receipt, error } = await this.supabase.from('build_receipts').insert({
                session_id: data.sessionId || null,
                type: data.type,
                details: data.details,
                verification_hash: hash,
                parent_receipt_id: data.parentReceiptId || null
            }).select().single();
            if (error)
                throw error;
            return { id: receipt.id, hash };
        }
        catch (e) {
            await this.writeToLocalFile(fallbackReceipt);
            return { id: fallbackReceipt.id, hash };
        }
    }
    async writeReceipt(receipt) {
        const full = {
            id: this.generateId(),
            createdAt: new Date().toISOString(),
            ...receipt
        };
        const verification_hash = crypto.createHash('sha256').update(JSON.stringify(full.details)).digest('hex');
        const nonce = crypto.randomBytes(16).toString('hex');
        const unsigned = {
            id: full.id,
            createdAt: full.createdAt,
            sessionId: full.sessionId || null,
            type: full.type,
            verification_hash,
            parentReceiptId: full.parentReceiptId || null,
            nonce
        };
        const canonical = this.canonicalize(unsigned);
        keystore_1.default.init();
        const { signature, keyId } = keystore_1.default.sign(canonical);
        const signedReceipt = {
            ...full,
            verification_hash,
            nonce,
            signerKeyId: keyId,
            signature,
            algo: 'Ed25519'
        };
        if (this.useSupabase) {
            await this.writeToSupabase(signedReceipt);
        }
        else {
            await this.writeToLocalFile(signedReceipt);
        }
        return signedReceipt;
    }
    async verifyReceipt(receipt) {
        if (!receipt || !receipt.signature || !receipt.signerKeyId)
            return false;
        try {
            const verification_hash = crypto.createHash('sha256').update(JSON.stringify(receipt.details)).digest('hex');
            if (receipt.verification_hash !== verification_hash)
                return false;
            const unsigned = {
                id: receipt.id,
                createdAt: receipt.createdAt,
                sessionId: receipt.sessionId || null,
                type: receipt.type,
                verification_hash: receipt.verification_hash,
                parentReceiptId: receipt.parentReceiptId || null,
                nonce: receipt.nonce
            };
            const canonical = this.canonicalize(unsigned);
            return await keystore_1.default.verify(canonical, receipt.signature, receipt.signerKeyId);
        }
        catch (e) {
            console.error('[ReceiptWriter] verifyReceipt error', e);
            return false;
        }
    }
    async writeToSupabase(receipt) {
        if (!this.supabase)
            return this.writeToLocalFile(receipt);
        try {
            const payload = {
                id: receipt.id,
                created_at: receipt.createdAt,
                session_id: receipt.sessionId || null,
                type: receipt.type,
                details: receipt.details,
                verification_hash: receipt.verification_hash || null,
                parent_receipt_id: receipt.parentReceiptId || null,
                signer_key_id: receipt.signerKeyId || null,
                signature: receipt.signature || null,
                algo: receipt.algo || null,
                nonce: receipt.nonce || null
            };
            const { error } = await this.supabase.from('build_receipts').insert(payload);
            if (error) {
                console.error('[ReceiptWriter] Supabase insert error:', error);
                await this.writeToLocalFile(receipt);
            }
        }
        catch (e) {
            console.error('[ReceiptWriter] writeToSupabase exception:', e);
            await this.writeToLocalFile(receipt);
        }
    }
    async writeToLocalFile(receipt) {
        const filePath = this.config.localFallbackPath;
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir))
            fs.mkdirSync(dir, { recursive: true });
        fs.appendFileSync(filePath, JSON.stringify(receipt) + '\n', 'utf-8');
    }
    async readReceipts(sessionId) {
        if (this.useSupabase && this.supabase) {
            try {
                let q = this.supabase.from('build_receipts').select('*');
                if (sessionId)
                    q = q.eq('session_id', sessionId);
                q = q.order('created_at', { ascending: true });
                const { data, error } = await q;
                if (error)
                    throw error;
                return (data || []).map((r) => ({
                    id: r.id,
                    createdAt: r.created_at,
                    sessionId: r.session_id,
                    type: r.type,
                    details: r.details,
                    parentReceiptId: r.parent_receipt_id || undefined,
                    signerKeyId: r.signer_key_id || undefined,
                    signature: r.signature || undefined,
                    algo: r.algo || undefined,
                    nonce: r.nonce || undefined,
                    verification_hash: r.verification_hash || undefined
                }));
            }
            catch (e) {
                console.error('[ReceiptWriter] readReceipts supabase error', e);
                return this.readFromLocalFile(sessionId);
            }
        }
        return this.readFromLocalFile(sessionId);
    }
    readFromLocalFile(sessionId) {
        const filePath = this.config.localFallbackPath;
        if (!fs.existsSync(filePath))
            return [];
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.trim().split('\n').filter(Boolean);
        const receipts = lines.map((line) => JSON.parse(line)).map((r) => ({ ...r }));
        if (sessionId)
            return receipts.filter((r) => r.sessionId === sessionId);
        return receipts;
    }
}
exports.ReceiptWriter = new ReceiptWriterImpl();
exports.default = exports.ReceiptWriter;
//# sourceMappingURL=ReceiptWriter.js.map