#!/usr/bin/env bash
set -euo pipefail

# Usage: PROVIDE one of: PUBLIC_KEY_PATH, PUBLIC_KEY_PEM_BASE64, TRUTHSERUM_PRIVATE_KEY_PEM_BASE64
# then run: ./scripts/verify-latest.sh [receipts_file]

RECEIPTS="${1:-proof/local_receipts.jsonl}"

if [ ! -f "$RECEIPTS" ]; then
  echo "No receipts file at $RECEIPTS"
  exit 1
fi

echo "Using receipts file: $RECEIPTS"

if [ -n "${PUBLIC_KEY_PATH:-}" ] && [ -f "$PUBLIC_KEY_PATH" ]; then
  echo "Using existing PUBLIC_KEY_PATH=$PUBLIC_KEY_PATH"
else
  if [ -n "${PUBLIC_KEY_PEM_BASE64:-}" ]; then
    echo "Decoding PUBLIC_KEY_PEM_BASE64 -> public.pem"
    node -e "require('fs').writeFileSync('public.pem', Buffer.from(process.env.PUBLIC_KEY_PEM_BASE64,'base64'))"
    PUBLIC_KEY_PATH=public.pem
  elif [ -n "${TRUTHSERUM_PRIVATE_KEY_PEM_BASE64:-}" ]; then
    echo "Decoding TRUTHSERUM_PRIVATE_KEY_PEM_BASE64 -> private.pem and deriving public.pem"
    node -e "require('fs').writeFileSync('private.pem', Buffer.from(process.env.TRUTHSERUM_PRIVATE_KEY_PEM_BASE64,'base64'))"
    openssl pkey -in private.pem -pubout -out public.pem
    PUBLIC_KEY_PATH=public.pem
  else
    echo "No public key available. Set PUBLIC_KEY_PATH or PUBLIC_KEY_PEM_BASE64 or TRUTHSERUM_PRIVATE_KEY_PEM_BASE64"
    exit 1
  fi
fi

echo "Public key path: $PUBLIC_KEY_PATH"

echo "Running verification using node verify-receipt.js"
PUBLIC_KEY_PATH="$PUBLIC_KEY_PATH" node verify-receipt.js "$RECEIPTS"

exit 0
