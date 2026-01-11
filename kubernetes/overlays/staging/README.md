# QuietBuild OS - Staging Environment

## Prerequisites

- EKS cluster or equivalent managed K8s
- kubectl configured for staging cluster
- Docker images pushed to registry (quietbuild/robby:staging, etc.)

## Deploy to Staging

```bash
# Set context
kubectl config use-context staging-cluster

# Create secrets
cp secrets.env.template secrets.env
# Edit secrets.env with actual staging values
kubectl create secret generic app-secrets --from-env-file=secrets.env -n quietbuild

# Apply deployment
kubectl apply -k .

# Verify
kubectl get pods -n quietbuild
kubectl get svc -n quietbuild
```

## Monitoring & Logs

```bash
# View metrics
kubectl top pods -n quietbuild

# Logs
kubectl logs -n quietbuild -l app=robby -f
```

## Rollback

```bash
kubectl rollout history deployment/staging-robby -n quietbuild
kubectl rollout undo deployment/staging-robby -n quietbuild
```
