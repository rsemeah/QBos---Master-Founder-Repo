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
exports.initKeystore = initKeystore;
exports.sign = sign;
exports.verify = verify;
const supabase_js_1 = require("@supabase/supabase-js");
const crypto = __importStar(require("crypto"));
const crypto_1 = require("crypto");
let activeKey = null;
let initialized = false;
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey) : null;
/**
 * Initialize keystore. In production this expects env-provided base64 PEM values.
 * In development it will generate an ephemeral keypair if none provided.
 */
function initKeystore() {
    if (initialized)
        return;
    const privateKeyB64 = process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64;
    const publicKeysJson = process.env.TRUTHSERUM_PUBLIC_KEYS_JSON; // optional map { keyId: pem }
    if (privateKeyB64) {
        const privPem = Buffer.from(privateKeyB64, 'base64').toString('utf-8');
        // compute keyId from public key
        const privKeyObj = crypto.createPrivateKey(privPem);
        const pubKeyObj = crypto.createPublicKey(privKeyObj);
        const pubDer = pubKeyObj.export({ type: 'spki', format: 'der' });
        const keyId = crypto.createHash('sha256').update(pubDer).digest('hex').substring(0, 16);
        activeKey = { id: keyId, privateKey: privKeyObj, publicKeyPem: pubKeyObj.export({ type: 'spki', format: 'pem' }) };
    }
    else if (publicKeysJson) {
        // no private key, but we can load public keys map for verification-only mode
        try {
            const parsed = JSON.parse(publicKeysJson);
            const first = Object.entries(parsed)[0];
            activeKey = { id: first[0], privateKey: null, publicKeyPem: first[1] };
        }
        catch (e) {
            // fall through to generate ephemeral
        }
    }
    if (!activeKey) {
        // generate ephemeral keypair for dev convenience
        const { publicKey, privateKey } = (0, crypto_1.generateKeyPairSync)('ed25519');
        const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' });
        const pubPem = publicKey.export({ type: 'spki', format: 'pem' });
        // derive canonical key id from public SPKI DER (sha256 -> first 16 hex chars)
        const pubDer = publicKey.export({ type: 'spki', format: 'der' });
        const derivedId = crypto.createHash('sha256').update(pubDer).digest('hex').substring(0, 16);
        activeKey = { id: derivedId, privateKey: crypto.createPrivateKey(privPem), publicKeyPem: pubPem };
    }
    initialized = true;
}
/**
 * Sign a canonical payload. Throws if no private key available.
 */
function sign(canonicalPayload) {
    if (!initialized || !activeKey)
        throw new Error('Keystore not initialized');
    if (!activeKey.privateKey)
        throw new Error('No private key available for signing');
    const sig = crypto.sign(null, Buffer.from(canonicalPayload, 'utf8'), activeKey.privateKey);
    return { signature: sig.toString('base64'), keyId: activeKey.id };
}
/**
 * Verify a signature. If Supabase is configured, consult the `truthserum_public_keys` table,
 * otherwise use the in-memory public key loaded at init.
 */
async function verify(message, signatureBase64, keyId) {
    try {
        // If supabase available, prefer registry lookup
        if (supabase) {
            const { data: keyData, error } = await supabase
                .from('truthserum_public_keys')
                .select('public_key_pem, revoked_at')
                .eq('key_id', keyId)
                .single();
            if (error || !keyData || keyData.revoked_at)
                return false;
            const publicKey = crypto.createPublicKey(keyData.public_key_pem);
            return crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, Buffer.from(signatureBase64, 'base64'));
        }
        // fallback to in-memory public key
        if (activeKey && activeKey.id === keyId && activeKey.publicKeyPem) {
            const publicKey = crypto.createPublicKey(activeKey.publicKeyPem);
            return crypto.verify(null, Buffer.from(message, 'utf8'), publicKey, Buffer.from(signatureBase64, 'base64'));
        }
        return false;
    }
    catch (err) {
        console.error('[Keystore] verify error:', err);
        return false;
    }
}
const keystore = { init: initKeystore, sign, verify };
exports.default = keystore;
//# sourceMappingURL=keystore.js.map