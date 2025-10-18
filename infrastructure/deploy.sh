#!/bin/bash
# Kubernetes Deployment Script for Guild Platform

set -e

echo "🚀 Deploying Guild Platform to GKE..."

# Set up kubectl context
gcloud container clusters get-credentials guild-cluster --region us-central1

# Install Helm dependencies
helm dependency update helm/guild-platform

# Deploy to staging first
echo "📦 Deploying to staging environment..."
helm upgrade --install guild-staging helm/guild-platform \
  --namespace staging \
  --create-namespace \
  --values helm/guild-platform/values-staging.yaml \
  --wait \
  --timeout 600s

# Run tests against staging
echo "🧪 Running tests against staging..."
kubectl run test-runner --image=guild/test-runner:latest --rm -i --restart=Never \
  --namespace staging

# If staging tests pass, deploy to production
if [ $? -eq 0 ]; then
  echo "✅ Staging tests passed, deploying to production..."

  helm upgrade --install guild-production helm/guild-platform \
    --namespace production \
    --create-namespace \
    --values helm/guild-platform/values-production.yaml \
    --wait \
    --timeout 900s

  echo "🎉 Production deployment completed successfully!"

  # Verify deployment
  kubectl get pods -n production
  kubectl get services -n production
  kubectl get ingress -n production

else
  echo "❌ Staging tests failed, aborting production deployment"
  exit 1
fi
