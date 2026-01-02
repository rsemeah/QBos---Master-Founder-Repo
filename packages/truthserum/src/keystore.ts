import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';
import { generateKeyPairSync } from 'crypto';

interface SigningKey {
  id: string;
  privateKey: crypto.KeyObject | null;
  publicKeyPem: string;
}

let activeKey: SigningKey | null = null;
let initialized = false;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase: SupabaseClient | null = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

/**
 * Initialize keystore. In production this expects env-provided base64 PEM values.
 * In development it will generate an ephemeral keypair if none provided.
 */
export function initKeystore(): void {
  if (initialized) return;

  const privateKeyB64 = process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64;
  const publicKeysJson = process.env.TRUTHSERUM_PUBLIC_KEYS_JSON; // optional map { keyId: pem }

  if (privateKeyB64) {
    const privPem = Buffer.from(privateKeyB64, 'base64').toString('utf-8');
    // compute keyId from public key
    const privKeyObj = crypto.createPrivateKey(privPem);
    const pubKeyObj = crypto.createPublicKey(privKeyObj);
    const pubDer = pubKeyObj.export({ type: 'spki', format: 'der' }) as Buffer;
    const keyId = crypto.createHash('sha256').update(pubDer).digest('hex').substring(0, 16);
    activeKey = { id: keyId, privateKey: privKeyObj, publicKeyPem: pubKeyObj.export({ type: 'spki', format: 'pem' }) as string };
  } else if (publicKeysJson) {
    // no private key, but we can load public keys map for verification-only mode
    try {
      const parsed = JSON.parse(publicKeysJson) as Record<string, string>;
      const first = Object.entries(parsed)[0];
      activeKey = { id: first[0], privateKey: null, publicKeyPem: first[1] };
    } catch (e) {
      // fall through to generate ephemeral
    }
  }

  if (!activeKey) {
    // generate ephemeral keypair for dev convenience
    const { publicKey, privateKey } = generateKeyPairSync('ed25519');
    const privPem = privateKey.export({ type: 'pkcs8', format: 'pem' }) as string;
    const pubPem = publicKey.export({ type: 'spki', format: 'pem' }) as string;
    // derive canonical key id from public SPKI DER (sha256 -> first 16 hex chars)
    const pubDer = publicKey.export({ type: 'spki', format: 'der' }) as Buffer;
    const derivedId = crypto.createHash('sha256').update(pubDer).digest('hex').substring(0, 16);
    activeKey = { id: derivedId, privateKey: crypto.createPrivateKey(privPem), publicKeyPem: pubPem };
  }

  initialized = true;
}

/**
 * Sign a canonical payload. Throws if no private key available.
 */
export function sign(canonicalPayload: string): { signature: string; keyId: string } {
  if (!initialized || !activeKey) throw new Error('Keystore not initialized');
  if (!activeKey.privateKey) throw new Error('No private key available for signing');

  const sig = crypto.sign(null as any, Buffer.from(canonicalPayload, 'utf8'), activeKey.privateKey);
  return { signature: sig.toString('base64'), keyId: activeKey.id };
}

/**
 * Verify a signature. If Supabase is configured, consult the `truthserum_public_keys` table,
 * otherwise use the in-memory public key loaded at init.
 */
export async function verify(message: string, signatureBase64: string, keyId: string): Promise<boolean> {
  try {
    // If supabase available, prefer registry lookup
    if (supabase) {
      const { data: keyData, error } = await supabase
        .from('truthserum_public_keys')
        .select('public_key_pem, revoked_at')
        .eq('key_id', keyId)
        .single();

      if (error || !keyData || keyData.revoked_at) return false;
      const publicKey = crypto.createPublicKey(keyData.public_key_pem);
      return crypto.verify(null as any, Buffer.from(message, 'utf8'), publicKey, Buffer.from(signatureBase64, 'base64'));
    }

    // fallback to in-memory public key
    if (activeKey && activeKey.id === keyId && activeKey.publicKeyPem) {
      const publicKey = crypto.createPublicKey(activeKey.publicKeyPem);
      return crypto.verify(null as any, Buffer.from(message, 'utf8'), publicKey, Buffer.from(signatureBase64, 'base64'));
    }

    return false;
  } catch (err) {
    console.error('[Keystore] verify error:', err);
    return false;
  }
}

const keystore = { init: initKeystore, sign, verify };
export default keystore;
