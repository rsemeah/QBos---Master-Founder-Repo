#!/usr/bin/env bash
set -euo pipefail

dir="$1"
min="${2:-1}"

if [ ! -d "$dir" ]; then
  echo "FAIL: receipts dir missing: $dir"
  exit 1
fi

count="$(find "$dir" -type f | wc -l | tr -d ' ')"
if [ "$count" -lt "$min" ]; then
  echo "FAIL: receipts insufficient ($count < $min) in $dir"
  exit 1
fi

echo "OK: receipts present ($count files) in $dir"
