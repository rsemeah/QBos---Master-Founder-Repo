/**
 * Initialize keystore. In production this expects env-provided base64 PEM values.
 * In development it will generate an ephemeral keypair if none provided.
 */
export declare function initKeystore(): void;
/**
 * Sign a canonical payload. Throws if no private key available.
 */
export declare function sign(canonicalPayload: string): {
    signature: string;
    keyId: string;
};
/**
 * Verify a signature. If Supabase is configured, consult the `truthserum_public_keys` table,
 * otherwise use the in-memory public key loaded at init.
 */
export declare function verify(message: string, signatureBase64: string, keyId: string): Promise<boolean>;
declare const keystore: {
    init: typeof initKeystore;
    sign: typeof sign;
    verify: typeof verify;
};
export default keystore;
//# sourceMappingURL=keystore.d.ts.map