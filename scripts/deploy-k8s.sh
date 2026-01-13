#!/usr/bin/env bash
# Deploy QuietBuild to specified environment
set -euo pipefail

ENVIRONMENT=${1:-dev}
KUBECONFIG_CONTEXT=""

# Resolve repo root to make overlay paths absolute
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

case "$ENVIRONMENT" in
  dev)
    echo "🔧 Deploying to Development (Minikube)"
    KUBECONFIG_CONTEXT="minikube"
    OVERLAY="$REPO_ROOT/kubernetes/overlays/dev"
    ;;
  staging)
    echo "🟡 Deploying to Staging"
    KUBECONFIG_CONTEXT="staging-cluster"
    OVERLAY="$REPO_ROOT/kubernetes/overlays/staging"
    ;;
  production)
    echo "🔴 DEPLOYING TO PRODUCTION — VERIFY CONTEXT FIRST"
    KUBECONFIG_CONTEXT="production-cluster"
    OVERLAY="$REPO_ROOT/kubernetes/overlays/production"
    ;;
  *)
    echo "Usage: $0 {dev|staging|production}"
    exit 1
    ;;

esac

# Verify context
CURRENT_CONTEXT=$(kubectl config current-context)
echo "Current context: $CURRENT_CONTEXT"

if [[ "$ENVIRONMENT" == "production" ]]; then
  read -p "⚠️  About to deploy PRODUCTION. Type 'yes' to confirm: " CONFIRM
  if [[ "$CONFIRM" != "yes" ]]; then
    echo "Deployment cancelled."
    exit 1
  fi
fi

# Deploy
echo "Applying $OVERLAY..."
kubectl apply -k "$OVERLAY"

# Verify
echo "Waiting for rollout..."
kubectl rollout status deployment -l project=quietbuild -n quietbuild --timeout=5m

echo "✅ Deployment complete!"
echo ""
echo "View pods:"
echo "  kubectl get pods -n quietbuild"
echo ""
echo "View logs:"
echo "  kubectl logs -n quietbuild -l project=quietbuild -f"
