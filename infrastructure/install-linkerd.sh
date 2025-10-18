#!/bin/bash
# Linkerd Service Mesh Installation Script

set -e

echo "🌐 Installing Linkerd service mesh..."

# Install Linkerd CLI
curl -sL https://run.linkerd.io/install | sh
export PATH=$HOME/.linkerd2/bin:$PATH

# Validate cluster prerequisites
linkerd check --pre

# Install Linkerd control plane
linkerd install --skip-checks | kubectl apply -f -

# Wait for control plane to be ready
kubectl wait --for=condition=available --timeout=300s deployment/linkerd-controller -n linkerd

# Install Linkerd viz extension for observability
linkerd viz install | kubectl apply -f -

# Install Linkerd multicluster extension
linkerd multicluster install | kubectl apply -f -

# Install Linkerd policy extension for traffic control
linkerd policy install | kubectl apply -f -

# Verify installation
linkerd check

echo "✅ Linkerd service mesh installed successfully!"

# Apply our service mesh configuration
kubectl apply -f infrastructure/linkerd/linkerd-config.yaml

# Enable service mesh injection for guild namespace
kubectl label namespace guild-production linkerd.io/inject=enabled

echo "🎉 Linkerd service mesh configuration applied!"
