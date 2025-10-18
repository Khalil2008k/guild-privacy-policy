#!/bin/bash
# Argo CD Installation and Configuration Script

set -e

echo "🚀 Installing Argo CD for GitOps..."

# Install Argo CD CLI
curl -sSL -o /tmp/argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x /tmp/argocd
sudo mv /tmp/argocd /usr/local/bin/argocd

# Install Argo CD in Kubernetes
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml

# Wait for Argo CD to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

# Get initial admin password
ARGOCD_PASSWORD=$(kubectl get secret argocd-initial-admin-secret -n argocd -o jsonpath="{.data.password}" | base64 -d)

echo "Argo CD installed successfully!"
echo "Admin password: $ARGOCD_PASSWORD"
echo "Access Argo CD at: https://$(kubectl get svc argocd-server -n argocd -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')"

# Apply our application configuration
kubectl apply -f infrastructure/argocd/application.yaml

echo "✅ Argo CD setup completed!"
