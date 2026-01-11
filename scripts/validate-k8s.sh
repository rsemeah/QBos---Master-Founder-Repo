#!/usr/bin/env bash
# Validate Kubernetes manifests
set -euo pipefail

ENVIRONMENT=${1:-dev}
OVERLAY="kubernetes/overlays/$ENVIRONMENT"

if [[ ! -d "$OVERLAY" ]]; then
  echo "❌ Invalid environment: $ENVIRONMENT"
  exit 1
fi

echo "🔍 Validating $ENVIRONMENT manifests..."

# Kustomize build
echo "Building kustomization..."
kubectl kustomize "$OVERLAY" > /tmp/manifest.yaml

# Kubeval validation (if installed)
if command -v kubeval &> /dev/null; then
  echo "Running kubeval..."
  kubeval /tmp/manifest.yaml
fi

# Syntax check
echo "Checking YAML syntax..."
kubectl apply -k "$OVERLAY" --dry-run=client

echo "✅ Validation passed!"
