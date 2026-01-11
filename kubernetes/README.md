# QuietBuild OS — Kubernetes Infrastructure

Complete Kubernetes manifests and deployment configurations for QuietBuild OS constitutional infrastructure.

## Overview

QuietBuild is deployed across three environments using Kustomize for configuration management:

- **Dev**: Local Minikube/Docker Desktop for development
- **Staging**: Pre-production verification with 2x replication
- **Production**: Hardened 3x replication with network policies and pod security policies

## Architecture

### Services

- **Robby** (3000): Core autonomous infrastructure engine

  - Phase 4 execution-blocking enforced
  - Requires HSM/Vault, nonce ledger, independent verifier in production

- **TruthSerum** (3001): Constitutional verification and receipt system
  - Generates and validates operational receipts
  - Enforces governance constraints
  - Audit trail for all operations

### Constitutional Constraints

All deployments respect the constitutional freeze:

- Phase 0–5 locked and immutable
- Robby cannot approve its own constraints
- Network isolation enforced
- Runtime hardening applied

## Quick Start

### Dev Environment

```bash
# Prerequisites
brew install kubectl minikube

# Start Minikube
minikube start --cpus=4 --memory=8192

# Deploy
cd kubernetes/overlays/dev
kubectl apply -k .

# Port forward
kubectl port-forward -n quietbuild svc/dev-robby 3000:80

# View logs
kubectl logs -n quietbuild -l app=robby -f
```

### Staging Environment

```bash
# Configure for staging cluster
kubectl config use-context staging-cluster

# Deploy
cd kubernetes/overlays/staging
kubectl apply -k .

# Monitor
kubectl get pods -n quietbuild -w
```

### Production Environment

```bash
# ⚠️  CRITICAL: Verify context before deploying
kubectl config current-context
# Must show production-cluster

# Deploy
cd kubernetes/overlays/production
kubectl apply -k .

# Verify
kubectl get pods -n quietbuild -w
kubectl top nodes
```

## Structure

```
kubernetes/
├── base/                          # Base manifests (shared)
│   ├── namespace.yaml
│   ├── robby-deployment.yaml
│   ├── robby-service.yaml
│   ├── truthserum-deployment.yaml
│   ├── truthserum-service.yaml
│   └── kustomization.yaml
├── overlays/
│   ├── dev/                       # Development (Minikube)
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   └── README.md
│   ├── staging/                   # Staging (2x replication)
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── secrets.env.template
│   │   └── README.md
│   └── production/                # Production (3x hardened)
│       ├── kustomization.yaml
│       ├── deployment-patch.yaml
│       ├── production-network-policy.yaml
│       ├── production-pod-security-policy.yaml
│       ├── secrets.env.template
│       └── README.md
└── README.md                      # This file
```

## Deployment Commands

### Build without deploying

```bash
# Dev
kubectl kustomize overlays/dev

# Staging
kubectl kustomize overlays/staging

# Production
kubectl kustomize overlays/production
```

### Apply with dry-run

```bash
kubectl apply -k overlays/dev --dry-run=client -o yaml
```

### Deploy

```bash
kubectl apply -k overlays/dev
kubectl apply -k overlays/staging
kubectl apply -k overlays/production
```

### Remove deployment

```bash
kubectl delete -k overlays/dev
```

## Monitoring & Operations

### View deployments

```bash
kubectl get deployments -n quietbuild
kubectl get pods -n quietbuild
kubectl get svc -n quietbuild
```

### View logs

```bash
# Robby
kubectl logs -n quietbuild -l app=robby -f

# TruthSerum
kubectl logs -n quietbuild -l app=truthserum -f

# All services
kubectl logs -n quietbuild -l project=quietbuild -f --all-containers
```

### Resource usage

```bash
kubectl top pods -n quietbuild
kubectl top nodes
```

### Events

```bash
kubectl get events -n quietbuild --sort-by='.lastTimestamp'
```

## Troubleshooting

### Pod stuck in pending

```bash
kubectl describe pod <pod-name> -n quietbuild
kubectl get events -n quietbuild
```

### Service not responding

```bash
# Check service
kubectl get svc -n quietbuild
kubectl describe svc robby -n quietbuild

# Check endpoints
kubectl get endpoints -n quietbuild

# Test connectivity
kubectl run -it --rm debug --image=nicolaka/netshoot --restart=Never -- /bin/sh
# Inside pod: curl http://robby/health
```

### Restart pods

```bash
kubectl rollout restart deployment/robby -n quietbuild
kubectl rollout restart deployment/truthserum -n quietbuild
```

## Security

### Network Policies (Production)

```bash
# Verify network policies
kubectl get networkpolicies -n quietbuild
kubectl describe networkpolicy quietbuild-network-policy -n quietbuild
```

### Pod Security Policies

```bash
# Check PSP
kubectl get psp
kubectl describe psp quietbuild-restricted
```

### Secrets Management

- Dev: Uses Kubernetes Secrets (simple, development-only)
- Staging: AWS Secrets Manager / Azure Key Vault (recommended)
- Production: AWS Secrets Manager / Azure Key Vault (required)

Never commit `.env` files or actual secrets to git.

## Scaling

### Horizontal Pod Autoscaling (Future)

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: robby-hpa
  namespace: quietbuild
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: robby
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
```

## Documentation

- [Dev Environment](overlays/dev/README.md)
- [Staging Environment](overlays/staging/README.md)
- [Production Environment](overlays/production/README.md)
- [Constitutional Freeze](../../CONSTITUTION_FREEZE.md)

## Support

For issues, consult:

1. `kubectl describe pod <pod> -n quietbuild`
2. `kubectl logs <pod> -n quietbuild`
3. Review manifests in `kubernetes/base/` and `overlays/`

---

**QuietBuild OS** — Constitutional infrastructure for AI that can say no.
