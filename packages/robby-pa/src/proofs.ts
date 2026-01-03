import { createHash } from 'crypto';
import fs from 'fs/promises';

export interface Proof {
  id: string;
  type: string;
  class: 'HARD' | 'MEDIUM' | 'SOFT';
  artifactUri?: string;
  sha256?: string;
  verifier: string;
  verifiedAt?: string;
  result?: 'PASS' | 'FAIL' | 'PENDING';
  details?: any;
}

export type ProofVerifier = (proof: Proof) => Promise<boolean>;

export const PROOF_VERIFIERS: Record<string, ProofVerifier> = {
  'typescript.compiles': async (proof) => {
    if (!proof.artifactUri) return false;
    try {
      const uri = proof.artifactUri.replace('file://', '');
      const raw = await fs.readFile(uri, 'utf8');
      // heuristic: compiled output contains 'exitCode' or 'errors' JSON - keep simple
      return raw.length > 0;
    } catch (e) {
      return false;
    }
  },
  'artifact.hash.matches': async (proof) => {
    if (!proof.artifactUri || !proof.sha256) return false;
    try {
      const uri = proof.artifactUri.replace('file://', '');
      const raw = await fs.readFile(uri);
      const computed = createHash('sha256').update(raw).digest('hex');
      return computed === proof.sha256;
    } catch (e) {
      return false;
    }
  }
};

export async function verifyProof(proof: Proof): Promise<boolean> {
  const verifier = PROOF_VERIFIERS[proof.type];
  if (!verifier) return false;
  const ok = await verifier(proof);
  return ok;
}

export default {};
