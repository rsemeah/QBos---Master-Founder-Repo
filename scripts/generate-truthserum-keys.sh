#!/usr/bin/env bash
set -euo pipefail

echo "Generating TruthSerum signing keys..."

TMP_DIR=$(mktemp -d)
PRIVATE_PEM="$TMP_DIR/private.pem"
PUBLIC_PEM="$TMP_DIR/public.pem"

openssl genpkey -algorithm ED25519 -out "$PRIVATE_PEM"
openssl pkey -in "$PRIVATE_PEM" -pubout -out "$PUBLIC_PEM"

# Base64 encode (portable across GNU and macOS)
if command -v openssl >/dev/null 2>&1; then
  PRIVATE_B64=$(openssl base64 -in "$PRIVATE_PEM" -A)
  PUBLIC_B64=$(openssl base64 -in "$PUBLIC_PEM" -A)
else
  # GNU base64
  PRIVATE_B64=$(base64 -w0 < "$PRIVATE_PEM")
  PUBLIC_B64=$(base64 -w0 < "$PUBLIC_PEM")
fi

# Key ID (short hex of SHA-256 of DER public key)
KEY_ID=$(openssl pkey -in "$PUBLIC_PEM" -pubin -outform DER | shasum -a 256 | cut -c1-16)

echo
echo "✅ Keys generated"
echo
echo "Key ID: $KEY_ID"
echo
echo "Add to .env.local (NEVER COMMIT):"
echo "TRUTHSERUM_PRIVATE_KEY_PEM_BASE64=\"$PRIVATE_B64\""
echo "TRUTHSERUM_PUBLIC_KEY_PEM_BASE64=\"$PUBLIC_B64\""
echo
echo "Add public key to Supabase trust registry (SQL):"
PUB_KEY_ESCAPED=$(sed ':a;N;$!ba;s/\n/\\n/g' "$PUBLIC_PEM")
echo "INSERT INTO truthserum_public_keys (key_id, public_key_pem, is_active) VALUES ('$KEY_ID', '$PUB_KEY_ESCAPED', true);"
echo
# Wipe plaintext files securely when possible
if command -v shred >/dev/null 2>&1; then
  shred -u "$PRIVATE_PEM" "$PUBLIC_PEM" || true
else
  rm -f "$PRIVATE_PEM" "$PUBLIC_PEM" || true
fi

rm -rf "$TMP_DIR"

echo "✅ Plaintext keys removed from disk; store base64 values securely."
