#!/bin/bash
# External Secrets Operator Installation Script

set -e

echo "🔐 Installing External Secrets Operator..."

# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io/
helm repo update

# Install External Secrets Operator
helm upgrade --install external-secrets external-secrets/external-secrets \
  --namespace external-secrets-system \
  --create-namespace \
  --set installCRDs=true \
  --set webhook.create=false \
  --wait

# Wait for controller to be ready
kubectl wait --for=condition=available --timeout=300s deployment/external-secrets -n external-secrets-system

# Create Vault authentication
kubectl apply -f infrastructure/external-secrets/vault-auth.yaml

# Apply our external secrets configuration
kubectl apply -f infrastructure/external-secrets/external-secrets.yaml

echo "✅ External Secrets Operator installed successfully!"

# Verify installation
kubectl get pods -n external-secrets-system
kubectl get externalsecrets -n guild-production

echo "🎉 External Secrets Operator configuration applied!"
