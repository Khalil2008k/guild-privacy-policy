#!/bin/bash
# Istio Service Mesh Installation Script

set -e

echo "🌐 Installing Istio Service Mesh..."

# Download Istio
ISTIO_VERSION=1.20.0
curl -L https://istio.io/downloadIstio | ISTIO_VERSION=$ISTIO_VERSION sh -

# Move to installation directory
cd istio-$ISTIO_VERSION

# Install Istio with demo profile (includes all components)
./bin/istioctl install --set profile=demo \
  --set values.global.imagePullPolicy=Always \
  --set values.pilot.resources.requests.cpu=100m \
  --set values.pilot.resources.requests.memory=256Mi \
  --set values.gateways.istio-ingressgateway.autoscaleMin=2 \
  --set values.gateways.istio-ingressgateway.autoscaleMax=10 \
  --set values.global.proxy.resources.requests.cpu=100m \
  --set values.global.proxy.resources.requests.memory=128Mi \
  --set values.global.proxy.resources.limits.cpu=2000m \
  --set values.global.proxy.resources.limits.memory=1Gi

# Enable sidecar injection for guild namespace
kubectl label namespace guild-production istio-injection=enabled

# Verify installation
kubectl get pods -n istio-system
kubectl get svc -n istio-system

echo "✅ Istio service mesh installed successfully!"

# Apply our service mesh configuration
kubectl apply -f infrastructure/istio/istio-operator.yaml

echo "🎉 Istio service mesh configuration applied!"
