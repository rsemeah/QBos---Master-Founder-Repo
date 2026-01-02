export async function rotateKey(): Promise<{ status: string; note?: string }> {
  return { status: 'NOT_IMPLEMENTED', note: 'Key rotation must be run with secure offline tooling' };
}
