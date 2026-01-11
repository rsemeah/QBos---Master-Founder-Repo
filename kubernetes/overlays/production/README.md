# QuietBuild OS - Production Environment

## Prerequisites

- EKS cluster (or equivalent managed K8s)
- AWS Secrets Manager or similar vault
- kubectl configured for production cluster
- Images built and pushed to ECR/registry
- Database replicas configured
- HSM/Vault endpoints active

## Deployment Checklist

- [ ] All Phase 4 infrastructure ready (HSM, nonce ledger, verifier)
- [ ] Constitutional freeze acknowledged
- [ ] Monitoring and alerting configured
- [ ] Backup and disaster recovery tested
- [ ] Network policies validated
- [ ] Pod security policies applied
- [ ] RBAC configured

## Deploy to Production

```bash
# CRITICAL: Verify cluster
kubectl config current-context
# Must show production cluster

# Create namespace
kubectl apply -f base/namespace.yaml

# Deploy secrets (from AWS Secrets Manager, etc.)
aws secretsmanager get-secret-value --secret-id quietbuild/prod \
  | jq -r .SecretString > secrets.env
kubectl create secret generic app-secrets --from-env-file=secrets.env -n quietbuild

# Apply kustomize build
kubectl apply -k .

# Verify all pods are running
kubectl get pods -n quietbuild -w
```

## Monitoring

```bash
# Logs (all services)
kubectl logs -n quietbuild -l project=quietbuild -f --tail=100

# Metrics
kubectl top pods -n quietbuild

# Events
kubectl get events -n quietbuild --sort-by='.lastTimestamp'
```

## Rollback (If Required)

```bash
# Check rollout history
kubectl rollout history deployment/prod-robby -n quietbuild

# Rollback to previous version
kubectl rollout undo deployment/prod-robby -n quietbuild

# Verify
kubectl get pods -n quietbuild -w
```

## Constitutional Constraints

- Robby cannot approve constitutional changes
- All Phase 4 operations require independent verification
- Network policies enforce service isolation
- Pod security policies enforce runtime hardening
- Secrets stored in vault (not committed)

## Incident Response

1. Check logs: `kubectl logs -n quietbuild ...`
2. Check events: `kubectl get events -n quietbuild ...`
3. Validate manifests: `kubectl apply -k . --dry-run=client`
4. Rollback if necessary: `kubectl rollout undo deployment/...`
5. Document incident and resolution
