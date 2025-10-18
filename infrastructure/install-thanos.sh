#!/bin/bash
# Thanos Installation Script

set -e

echo "📊 Installing Thanos for long-term monitoring..."

# Install Thanos
helm repo add thanos https://charts.bitnami.com/bitnami
helm repo update

# Install Thanos
helm upgrade --install thanos thanos/thanos \
  --namespace monitoring \
  --create-namespace \
  --set objstoreConfig.bucket=guild-monitoring-bucket \
  --set objstoreConfig.endpoint=s3.amazonaws.com \
  --set objstoreConfig.region=us-east-1 \
  --set store.enabled=true \
  --set query.enabled=true \
  --set query.frontend.enabled=true \
  --set compactor.enabled=true \
  --set ruler.enabled=true \
  --wait

# Wait for components to be ready
kubectl wait --for=condition=available --timeout=300s deployment/thanos-store -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/thanos-query -n monitoring
kubectl wait --for=condition=available --timeout=300s deployment/thanos-compactor -n monitoring

# Apply our Thanos configuration
kubectl apply -f infrastructure/thanos/thanos-monitoring.yaml

echo "✅ Thanos installed successfully!"

# Verify installation
kubectl get pods -n monitoring --selector=app=thanos
kubectl get svc -n monitoring --selector=app=thanos

echo "🎉 Thanos long-term monitoring setup completed!"
