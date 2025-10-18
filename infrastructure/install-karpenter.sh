#!/bin/bash
# Karpenter Installation Script

set -e

echo "⚙️ Installing Karpenter for auto-provisioning..."

# Install Karpenter
helm repo add karpenter https://charts.karpenter.sh/
helm repo update

# Install Karpenter
helm upgrade --install karpenter karpenter/karpenter \
  --namespace karpenter \
  --create-namespace \
  --set serviceAccount.annotations."iam.gke.io/gcp-service-account"=karpenter-controller@guild-production.iam.gserviceaccount.com \
  --set controller.clusterName=guild-production \
  --set controller.clusterEndpoint=$(kubectl config view --minify -o jsonpath='{.clusters[0].cluster.server}') \
  --wait

# Create AWS Node Template (if using AWS)
kubectl apply -f infrastructure/karpenter/provisioner.yaml

# Verify installation
kubectl get pods -n karpenter
kubectl get provisioners.karpenter.sh

echo "✅ Karpenter installed successfully!"

# Test auto-provisioning
kubectl apply -f - <<EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: test-autoscaling
  namespace: guild-production
spec:
  replicas: 10
  selector:
    matchLabels:
      app: test-autoscaling
  template:
    metadata:
      labels:
        app: test-autoscaling
    spec:
      containers:
      - name: test-container
        image: nginx:alpine
        resources:
          requests:
            cpu: 100m
            memory: 128Mi
EOF

echo "🧪 Testing auto-provisioning with test deployment..."
sleep 60

# Check if nodes were provisioned
kubectl get nodes --selector=karpenter.sh/provisioner-name

echo "🎉 Karpenter auto-provisioning test completed!"
