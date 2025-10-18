#!/bin/bash
# Locust Distributed Deployment Script

set -e

echo "🚀 Deploying Locust distributed load testing..."

# Create Kubernetes namespace for load testing
kubectl create namespace load-testing --dry-run=client -o yaml | kubectl apply -f -

# Deploy Locust master
cat > locust-master.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: locust-master
  namespace: load-testing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: locust-master
  template:
    metadata:
      labels:
        app: locust-master
    spec:
      containers:
      - name: locust-master
        image: locustio/locust:latest
        command:
        - locust
        - --master
        - --master-bind-host=0.0.0.0
        - --master-bind-port=5557
        - --expect-workers=3
        - --host=https://api.guild.com
        - -f
        - /mnt/locust/guild_load_test.py
        ports:
        - containerPort: 5557
        - containerPort: 8089
        volumeMounts:
        - name: locust-scripts
          mountPath: /mnt/locust
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 1000m
            memory: 2Gi
      volumes:
      - name: locust-scripts
        configMap:
          name: locust-scripts
---
apiVersion: v1
kind: Service
metadata:
  name: locust-master
  namespace: load-testing
spec:
  selector:
    app: locust-master
  ports:
  - name: master
    port: 5557
    targetPort: 5557
  - name: web
    port: 8089
    targetPort: 8089
  type: ClusterIP
EOF

kubectl apply -f locust-master.yaml

# Deploy Locust workers
for i in {1..3}; do
  cat > locust-worker-${i}.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: locust-worker-${i}
  namespace: load-testing
spec:
  replicas: 1
  selector:
    matchLabels:
      app: locust-worker-${i}
  template:
    metadata:
      labels:
        app: locust-worker-${i}
    spec:
      containers:
      - name: locust-worker
        image: locustio/locust:latest
        command:
        - locust
        - --worker
        - --master-host=locust-master
        - --master-port=5557
        - --host=https://api.guild.com
        - -f
        - /mnt/locust/guild_load_test.py
        volumeMounts:
        - name: locust-scripts
          mountPath: /mnt/locust
        resources:
          requests:
            cpu: 1000m
            memory: 2Gi
          limits:
            cpu: 2000m
            memory: 4Gi
      volumes:
      - name: locust-scripts
        configMap:
          name: locust-scripts
EOF

  kubectl apply -f locust-worker-${i}.yaml
done

# Create ConfigMap for test scripts
kubectl create configmap locust-scripts \
  --from-file=guild_load_test.py=testing/load/locust/guild_load_test.py \
  --namespace load-testing

# Wait for deployments to be ready
kubectl wait --for=condition=available --timeout=300s deployment/locust-master -n load-testing
kubectl wait --for=condition=available --timeout=300s deployment/locust-worker-1 -n load-testing
kubectl wait --for=condition=available --timeout=300s deployment/locust-worker-2 -n load-testing
kubectl wait --for=condition=available --timeout=300s deployment/locust-worker-3 -n load-testing

echo "✅ Locust distributed load testing deployed successfully!"

# Port forward to access Locust web interface
echo "🌐 Accessing Locust web interface..."
kubectl port-forward svc/locust-master 8089:8089 -n load-testing &

echo "🎉 Locust is running at http://localhost:8089"
