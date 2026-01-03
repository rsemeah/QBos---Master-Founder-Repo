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
exports.calibrate = calibrate;
const node_crypto_1 = __importDefault(require("node:crypto"));
const fs = __importStar(require("node:fs"));
const robby_receipt_js_1 = require("../util/robby-receipt.js");
function deriveKeyIdFromPem(pem) {
    try {
        const key = node_crypto_1.default.createPublicKey(pem);
        const der = key.export({ type: 'spki', format: 'der' });
        return node_crypto_1.default.createHash('sha256').update(der).digest('hex').substring(0, 16);
    }
    catch (e) {
        return null;
    }
}
async function calibrate(cwd) {
    let publicKeyId = null;
    let mode = 'UNKNOWN';
    if (process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64) {
        try {
            const privPem = Buffer.from(process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64, 'base64').toString('utf8');
            const pubPem = node_crypto_1.default.createPublicKey(privPem).export({ type: 'spki', format: 'pem' });
            publicKeyId = deriveKeyIdFromPem(pubPem);
            mode = 'single-key';
        }
        catch (e) {
            publicKeyId = null;
        }
    }
    if (!publicKeyId && process.env.PUBLIC_KEY_PATH && fs.existsSync(process.env.PUBLIC_KEY_PATH)) {
        try {
            const pem = fs.readFileSync(process.env.PUBLIC_KEY_PATH, 'utf8');
            publicKeyId = deriveKeyIdFromPem(pem);
            mode = 'single-key';
        }
        catch (e) {
            // ignore
        }
    }
    if (!publicKeyId && process.env.TRUTHSERUM_PUBLIC_KEYS_JSON) {
        try {
            const parsed = JSON.parse(process.env.TRUTHSERUM_PUBLIC_KEYS_JSON);
            const first = Object.entries(parsed)[0];
            if (first) {
                publicKeyId = first[0];
                mode = 'registry';
            }
        }
        catch (e) {
            // ignore
        }
    }
    const payload = { cwd, publicKeyId, mode };
    const receipt = await (0, robby_receipt_js_1.robbyReceipt)('robby.calibration.probe', payload);
    return { status: publicKeyId ? 'READY' : 'DEGRADED', receipt };
}
//# sourceMappingURL=calibration.js.map