#!/bin/bash
# In-Cluster Build Script with Kaniko

set -e

echo "🏗️ Starting in-cluster build with Kaniko..."

# Create build namespace if it doesn't exist
kubectl create namespace kaniko --dry-run=client -o yaml | kubectl apply -f -

# Apply Kaniko configuration
kubectl apply -f infrastructure/kaniko/kaniko-build.yaml

# Wait for build pod to complete
kubectl wait --for=condition=completed pod/kaniko-build -n kaniko --timeout=1800s

# Get build logs
kubectl logs pod/kaniko-build -n kaniko

# Check if build succeeded
if kubectl logs pod/kaniko-build -n kaniko | grep -q "Build completed successfully"; then
  echo "✅ In-cluster build completed successfully!"

  # Trigger deployment
  kubectl apply -f infrastructure/helm/guild-platform/values-production.yaml

else
  echo "❌ In-cluster build failed!"
  exit 1
fi
