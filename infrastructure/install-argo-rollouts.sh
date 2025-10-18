#!/bin/bash
# Argo Rollouts Installation Script

set -e

echo "📦 Installing Argo Rollouts for progressive deployment..."

# Install Argo Rollouts
kubectl create namespace argo-rollouts --dry-run=client -o yaml | kubectl apply -f -

# Install Argo Rollouts controller
kubectl apply -n argo-rollouts -f https://github.com/argoproj/argo-rollouts/releases/download/v1.6.0/install.yaml

# Install Argo Rollouts CLI
curl -LO https://github.com/argoproj/argo-rollouts/releases/download/v1.6.0/argo-rollouts-cli
chmod +x argo-rollouts-cli
sudo mv argo-rollouts-cli /usr/local/bin/argo-rollouts

# Wait for controller to be ready
kubectl wait --for=condition=available --timeout=300s deployment/argo-rollouts-controller-manager -n argo-rollouts

# Apply our rollout configuration
kubectl apply -f infrastructure/argocd/rollouts.yaml

echo "✅ Argo Rollouts installed successfully!"

# Test progressive deployment
echo "🧪 Testing progressive deployment..."

# Create a test rollout
kubectl apply -f - <<EOF
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: test-rollout
  namespace: guild-production
spec:
  replicas: 5
  strategy:
    canary:
      steps:
      - setWeight: 20
      - pause: {}
      - setWeight: 40
      - pause: {}
      - setWeight: 60
      - pause: {}
      - setWeight: 80
      - pause: {}
      - setWeight: 100
  selector:
    matchLabels:
      app: test-app
  template:
    metadata:
      labels:
        app: test-app
    spec:
      containers:
      - name: test-container
        image: nginx:alpine
        ports:
        - containerPort: 80
EOF

echo "🎉 Argo Rollouts test deployment created!"
