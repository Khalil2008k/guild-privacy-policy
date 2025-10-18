#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentAdvancedImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
    this.mobileRoot = this.projectRoot;
    this.adminRoot = path.join(this.projectRoot, 'admin-portal');
    this.infrastructureRoot = path.join(this.projectRoot, 'infrastructure');
  }

  async implement() {
    console.log('🚀 Implementing advanced deployment and CI/CD features with STRICT rules...');

    try {
      // Step 1: Implement Argo Rollouts progressive deployment
      console.log('📦 Implementing Argo Rollouts...');
      await this.implementArgoRollouts();

      // Step 2: Implement GitHub Actions with OIDC
      console.log('🔄 Implementing GitHub Actions OIDC...');
      await this.implementGitHubActionsOIDC();

      // Step 3: Implement Linkerd service mesh
      console.log('🌐 Implementing Linkerd service mesh...');
      await this.implementLinkerdServiceMesh();

      // Step 4: Implement External Secrets Operator
      console.log('🔐 Implementing External Secrets Operator...');
      await this.implementExternalSecretsOperator();

      // Step 5: Implement Thanos long-term monitoring
      console.log('📊 Implementing Thanos monitoring...');
      await this.implementThanosMonitoring();

      console.log('✅ Advanced deployment implementation completed!');

    } catch (error) {
      console.error('❌ Advanced deployment implementation failed:', error.message);
      process.exit(1);
    }
  }

  async implementArgoRollouts() {
    // Argo Rollouts progressive deployment implementation
    const argoRolloutsConfig = `
// Argo Rollouts Progressive Deployment Configuration
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: guild-api-rollout
  namespace: guild-production
  labels:
    app: guild-api
spec:
  replicas: 10
  strategy:
    canary:
      stableService: guild-api-stable
      canaryService: guild-api-canary
      trafficRouting:
        istio:
          virtualService:
            name: guild-api-vs
            routes:
            - primary
      steps:
      - setWeight: 20
      - pause:
          duration: 600 # 10 minutes
      - setWeight: 50
      - pause:
          duration: 600 # 10 minutes
      - setWeight: 80
      - pause:
          duration: 600 # 10 minutes
      - setWeight: 100
      analysis:
        templates:
        - templateName: success-rate
        args:
        - name: success-rate
          value: "99.5"
        startingStep: 2 # Run analysis from step 2
  selector:
    matchLabels:
      app: guild-api
  template:
    metadata:
      labels:
        app: guild-api
    spec:
      containers:
      - name: guild-api
        image: gcr.io/guild-production/guild-api:{{ .Values.image.tag }}
        ports:
        - containerPort: 8080
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        env:
        - name: NODE_ENV
          value: production
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: guild-db-secret
              key: database-url
        livenessProbe:
          httpGet:
            path: /health
            port: 8080
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 8080
          initialDelaySeconds: 5
          periodSeconds: 5
  minReadySeconds: 30

---
# Analysis Template for Success Rate
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: guild-production
spec:
  args:
  - name: success-rate
  metrics:
  - name: success-rate
    interval: 60s
    count: 5
    successCondition: result > 99.5
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          sum(rate(http_requests_total{job="guild-api",status=~"2.."}[5m])) /
          sum(rate(http_requests_total{job="guild-api"}[5m])) * 100

---
# Analysis Template for Error Rate
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate
  namespace: guild-production
spec:
  args:
  - name: error-rate
  metrics:
  - name: error-rate
    interval: 60s
    count: 5
    successCondition: result < 0.5
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          sum(rate(http_requests_total{job="guild-api",status=~"5.."}[5m])) /
          sum(rate(http_requests_total{job="guild-api"}[5m])) * 100

---
# Rollout Analysis
apiVersion: argoproj.io/v1alpha1
kind: AnalysisRun
metadata:
  name: guild-api-analysis
  namespace: guild-production
spec:
  arguments:
  - name: success-rate
    value: "99.5"
  - name: error-rate
    value: "0.5"
  templates:
  - templateName: success-rate
  - templateName: error-rate

---
# Blue-Green Deployment Strategy
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: guild-api-blue-green
  namespace: guild-production
spec:
  replicas: 10
  strategy:
    blueGreen:
      activeService: guild-api-active
      previewService: guild-api-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 300
      previewReplicaCount: 3
      postPromotionAnalysis:
        templates:
        - templateName: success-rate
        args:
        - name: success-rate
          value: "99.9"
  selector:
    matchLabels:
      app: guild-api
  template:
    metadata:
      labels:
        app: guild-api
    spec:
      containers:
      - name: guild-api
        image: gcr.io/guild-production/guild-api:{{ .Values.image.tag }}
        ports:
        - containerPort: 8080

---
# Canary Analysis Configuration
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: canary-analysis
  namespace: guild-production
spec:
  args:
  - name: prometheus-url
    value: http://prometheus.monitoring.svc.cluster.local:9090
  metrics:
  - name: error-rate
    interval: 30s
    count: 10
    successCondition: result < 1.0
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          sum(rate(http_requests_total{job="guild-api",status=~"5.."}[5m])) /
          sum(rate(http_requests_total{job="guild-api"}[5m])) * 100

  - name: latency-p95
    interval: 30s
    count: 10
    successCondition: result < 500
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job="guild-api"}[5m])) by (le))

  - name: throughput
    interval: 30s
    count: 10
    successCondition: result > 100
    provider:
      prometheus:
        address: http://prometheus.monitoring.svc.cluster.local:9090
        query: |
          sum(rate(http_requests_total{job="guild-api"}[5m]))
`;

    // Create Argo Rollouts directory
    const argoDir = path.join(this.infrastructureRoot, 'argocd');
    if (!fs.existsSync(argoDir)) {
      fs.mkdirSync(argoDir, { recursive: true });
    }

    fs.writeFileSync(path.join(argoDir, 'rollouts.yaml'), argoRolloutsConfig);

    // Create Argo Rollouts installation script
    const argoRolloutsInstall = `#!/bin/bash
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
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'install-argo-rollouts.sh'), argoRolloutsInstall);

    // Make script executable
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x infrastructure/install-argo-rollouts.sh', {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      }
    } catch (error) {
      console.warn('Script permissions warning:', error.message);
    }

    // Update package.json with Argo Rollouts scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'rollouts:install': './infrastructure/install-argo-rollouts.sh',
      'rollouts:promote': 'kubectl argo rollouts promote guild-api-rollout -n guild-production',
      'rollouts:abort': 'kubectl argo rollouts abort guild-api-rollout -n guild-production',
      'rollouts:status': 'kubectl argo rollouts get rollout guild-api-rollout -n guild-production',
      'rollouts:dashboard': 'kubectl port-forward svc/argo-rollouts-dashboard 3100:3100 -n argo-rollouts'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async implementGitHubActionsOIDC() {
    // GitHub Actions with OIDC federated auth implementation
    const githubActionsConfig = `
// GitHub Actions with OIDC Federated Authentication
name: Guild Platform CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

env:
  REGISTRY: gcr.io
  IMAGE_NAME: guild-production/guild-api

jobs:
  # Security scanning
  security-scan:
    name: Security Scan
    runs-on: ubuntu-latest
    permissions:
      contents: read
      security-events: write
      actions: read
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: Run Trivy vulnerability scanner
        uses: aquasecurity/trivy-action@master
        with:
          scan-type: 'fs'
          scan-ref: '.'
          format: 'sarif'
          output: 'trivy-results.sarif'

      - name: Upload Trivy scan results
        uses: github/codeql-action/upload-sarif@v3
        with:
          sarif_file: 'trivy-results.sarif'

      - name: Run CodeQL Analysis
        uses: github/codeql-action/init@v3
        with:
          languages: javascript, typescript

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3

  # Code quality checks
  quality-check:
    name: Code Quality Check
    runs-on: ubuntu-latest
    needs: security-scan
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run ESLint
        run: npm run lint

      - name: Run TypeScript check
        run: npm run type-check

      - name: Run tests
        run: npm run test:ci

      - name: Run dependency check
        run: npm run depcheck

      - name: Run bundle analysis
        run: npm run analyze:bundle

  # Build and push
  build-and-push:
    name: Build and Push
    runs-on: ubuntu-latest
    needs: quality-check
    outputs:
      image-tag: \${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-oidc
          role-session-name: GitHubActions
          aws-region: us-east-1

      - name: Login to GCR
        run: |
          echo "\${{ secrets.GCR_JSON_KEY }}" | docker login -u _json_key --password-stdin https://gcr.io

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: .
          push: true
          tags: |
            gcr.io/guild-production/guild-api:\${{ github.sha }}
            gcr.io/guild-production/guild-api:latest
          cache-from: type=gha
          cache-to: type=gha,mode=max

      - name: Generate deployment metadata
        id: meta
        run: |
          echo "tags=gcr.io/guild-production/guild-api:\${{ github.sha }}" >> \$GITHUB_OUTPUT

  # Deploy to staging
  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-push
    environment: staging
    if: github.ref == 'refs/heads/develop'
    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-oidc
          role-session-name: GitHubActions
          aws-region: us-east-1

      - name: Deploy to staging
        run: |
          helm upgrade --install guild-staging ./infrastructure/helm/guild-platform \\
            --namespace guild-staging \\
            --set image.tag=\${{ needs.build-and-push.outputs.image-tag }} \\
            --wait

  # Integration tests
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: deploy-staging
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm ci

      - name: Run E2E tests
        run: npm run test:e2e:ci
        env:
          BASE_URL: https://staging.guild.com

      - name: Run load tests
        run: npm run test:load
        env:
          TARGET_URL: https://staging.guild.com

  # Deploy to production
  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: [integration-tests, build-and-push]
    environment: production
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Configure AWS credentials (OIDC)
        uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: arn:aws:iam::\${{ secrets.AWS_ACCOUNT_ID }}:role/github-actions-oidc
          role-session-name: GitHubActions
          aws-region: us-east-1

      - name: Deploy to production
        run: |
          # Progressive deployment with Argo Rollouts
          kubectl argo rollouts set image guild-api-rollout guild-api=gcr.io/guild-production/guild-api:\${{ needs.build-and-push.outputs.image-tag }} -n guild-production

          # Monitor rollout progress
          kubectl argo rollouts get rollout guild-api-rollout -n guild-production -w

  # Post-deployment verification
  post-deploy-verification:
    name: Post-Deployment Verification
    runs-on: ubuntu-latest
    needs: deploy-production
    steps:
      - name: Verify deployment health
        run: |
          curl -f https://api.guild.com/health || exit 1
          curl -f https://app.guild.com/health || exit 1

      - name: Run smoke tests
        run: npm run test:smoke
        env:
          BASE_URL: https://app.guild.com

      - name: Check monitoring dashboards
        run: |
          # Verify Prometheus metrics
          curl -f http://prometheus.monitoring.svc.cluster.local:9090/-/healthy || exit 1

  # Notification
  notify:
    name: Notification
    runs-on: ubuntu-latest
    needs: [deploy-production, post-deploy-verification]
    if: always()
    steps:
      - name: Send notification
        run: |
          if [ "\${{ job.status }}" == "success" ]; then
            MESSAGE="✅ Deployment successful for \${{ github.sha }}"
          else
            MESSAGE="❌ Deployment failed for \${{ github.sha }}"
          fi

          curl -X POST -H 'Content-type: application/json' \\
            --data "{\"text\":\"\$MESSAGE\\nCommit: \${{ github.sha }}\\nBranch: \${{ github.ref_name }}\"}" \\
            \${{ secrets.SLACK_WEBHOOK_URL }}

# IAM Role for GitHub Actions OIDC
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::\${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:guild/platform:*"
        }
      }
    }
  ]
}
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'github-actions-oidc.yml'), githubActionsConfig);

    // Create OIDC setup script
    const oidcSetup = `#!/bin/bash
# GitHub Actions OIDC Setup Script

set -e

echo "🔐 Setting up GitHub Actions OIDC..."

# Create OIDC provider
aws iam create-open-id-connect-provider \\
  --url https://token.actions.githubusercontent.com \\
  --thumbprint-list \\
  --client-id-list sts.amazonaws.com \\
  --output json

# Create IAM role for GitHub Actions
cat > github-actions-role.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::\${AWS_ACCOUNT_ID}:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:guild/platform:*"
        }
      }
    }
  ]
}
EOF

aws iam create-role \\
  --role-name github-actions-oidc \\
  --assume-role-policy-document file://github-actions-role.json

# Attach policies to the role
aws iam attach-role-policy \\
  --role-name github-actions-oidc \\
  --policy-arn arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryFullAccess

aws iam attach-role-policy \\
  --role-name github-actions-oidc \\
  --policy-arn arn:aws:iam::aws:policy/AmazonECS_FullAccess

aws iam attach-role-policy \\
  --role-name github-actions-oidc \\
  --policy-arn arn:aws:iam::aws:policy/AmazonEKS_FullAccess

# Get role ARN
ROLE_ARN=\$(aws iam get-role --role-name github-actions-oidc --query 'Role.Arn' --output text)

echo "✅ GitHub Actions OIDC setup completed!"
echo "Role ARN: \$ROLE_ARN"

# Clean up temporary file
rm github-actions-role.json
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'setup-oidc.sh'), oidcSetup);

    // Make script executable
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x infrastructure/setup-oidc.sh', {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      }
    } catch (error) {
      console.warn('Script permissions warning:', error.message);
    }

    // Update package.json with OIDC scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'oidc:setup': './infrastructure/setup-oidc.sh',
      'oidc:verify': 'aws iam get-role --role-name github-actions-oidc',
      'github:workflow': 'echo "GitHub Actions workflow configured in .github/workflows/"',
      'github:secrets': 'echo "Set up GitHub repository secrets: AWS_ACCOUNT_ID, GCR_JSON_KEY, SLACK_WEBHOOK_URL"'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async implementLinkerdServiceMesh() {
    // Linkerd service mesh implementation
    const linkerdConfig = `
// Linkerd Service Mesh Configuration for Traffic Control
apiVersion: install.linkerd.io/v1alpha1
kind: Linkerd
metadata:
  name: linkerd
  namespace: linkerd
spec:
  version: stable-2.14.0
  namespace: linkerd

  proxy:
    capabilities: null
    disableIdentity: false
    disableTap: false
    enableExternalProfiles: false
    image:
      name: cr.l5d.io/linkerd/proxy
      pullPolicy: IfNotPresent
      version: stable-2.14.0
    logFormat: plain
    logLevel: info,warn,error
    opaquePorts: 25,587,3306,4444,5432,6379,9300,11211
    outboundConnectTimeout: 1000ms
    inboundConnectTimeout: 100ms
    resources:
      cpu:
        limit: 1000m
        request: 100m
      memory:
        limit: 250Mi
        request: 20Mi
    uid: 2102

  identity:
    issuer:
      clockSkewAllowance: 20s
      crtExpiry: 24h
      externalCA: false
      issuanceLifetime: 24h
      scheme: linkerd.io/tls
      tls:
        crtPEM: |
          -----BEGIN CERTIFICATE-----
          # Certificate content
          -----END CERTIFICATE-----
        keyPEM: |
          -----BEGIN PRIVATE KEY-----
          # Private key content
          -----END PRIVATE KEY-----

  dashboard:
    enforcedHostRegexp: ^linkerd-dashboard\\.linkerd\\.svc\\.cluster\\.local\\:9090$
    resources:
      cpu:
        limit: 1000m
        request: 100m
      memory:
        limit: 250Mi
        request: 50Mi

  debugContainer:
    image:
      name: cr.l5d.io/linkerd/debug
      pullPolicy: IfNotPresent
      version: stable-2.14.0

  heartbeatSchedule: 0 0 * * *

  skipOutboundPorts: []

  clusterDomain: cluster.local

  podMonitor:
    controller:
      enabled: true
      namespaceSelector: linkerd
    enabled: true
    scrapeInterval: 30s
    scrapeTimeout: 10s

  prometheus:
    enabled: true
    resources:
      cpu:
        limit: 1000m
        request: 100m
      memory:
        limit: 2Gi
        request: 1Gi

  tracing:
    enabled: true
    collector:
      resources:
        cpu:
          limit: 1000m
          request: 100m
        memory:
          limit: 1Gi
          request: 256Mi

---
# Traffic Policy for Guild API
apiVersion: policy.linkerd.io/v1beta3
kind: TrafficPolicy
metadata:
  name: guild-api-traffic-policy
  namespace: guild-production
spec:
  selector:
    matchLabels:
      app: guild-api
  policy:
    control:
      maxConnections: 100
      maxPendingRequests: 50
      maxRequests: 1000
      maxRetries: 3
      timeout: 10s
    detection:
      timeout: 5s
      failureThreshold: 3
      successThreshold: 1
    loadBalancer:
      algorithm: ewma
      header: x-load-balancer
      sourceIP: true
    retryBudget:
      minRetriesPerSecond: 10
      retryRatio: 0.1
      ttl: 10s

---
# Service Profile for Enhanced Observability
apiVersion: linkerd.io/v1alpha2
kind: ServiceProfile
metadata:
  name: guild-api.guild-production.svc.cluster.local
  namespace: guild-production
spec:
  routes:
  - name: route-to-api
    methods: ["GET", "POST", "PUT", "DELETE"]
    timeout: 10s
    retryBudget:
      minRetriesPerSecond: 10
      retryRatio: 0.1
      ttl: 10s
    conditions:
    - method: GET
      pathRegex: "/api/v1/.*"
      statusRange: "200-299"
    - method: POST
      pathRegex: "/api/v1/.*"
      statusRange: "200-299"

---
# Traffic Split for Canary Deployments
apiVersion: split.smi-spec.io/v1alpha3
kind: TrafficSplit
metadata:
  name: guild-api-traffic-split
  namespace: guild-production
spec:
  service: guild-api
  backends:
  - service: guild-api-stable
    weight: 90
  - service: guild-api-canary
    weight: 10

---
# HTTPRoute for Traffic Routing
apiVersion: policy.linkerd.io/v1beta3
kind: HTTPRoute
metadata:
  name: guild-api-route
  namespace: guild-production
spec:
  parentRefs:
  - name: guild-api
    kind: Service
  rules:
  - backendRefs:
    - name: guild-api
      kind: Service
      weight: 100
    filters:
    - type: RequestHeaderModifier
      requestHeaderModifier:
        add:
        - name: x-trace-id
          value: "\${request.header.x-trace-id}"
        - name: x-user-id
          value: "\${request.header.x-user-id}"
    retries:
    - attempts: 3
      conditions:
      - type: StatusCode
        statusCodes: ["500", "502", "503", "504"]

---
# Authorization Policy for Service Mesh Security
apiVersion: policy.linkerd.io/v1beta3
kind: AuthorizationPolicy
metadata:
  name: guild-api-authz
  namespace: guild-production
spec:
  targetRefs:
  - kind: Service
    name: guild-api
  requiredAuthenticationRefs:
  - kind: MeshTLSAuthentication
    name: guild-mtls
  rules:
  - principals:
    - cluster.local/ns/guild-production/sa/guild-api
    - cluster.local/ns/guild-production/sa/guild-frontend

---
# MeshTLSAuthentication for mTLS
apiVersion: policy.linkerd.io/v1beta3
kind: MeshTLSAuthentication
metadata:
  name: guild-mtls
  namespace: guild-production
spec:
  identities:
  - "\${serviceaccount.namespace}.serviceaccount.identity.linkerd.cluster.local"
  mode: STRICT

---
# Server Authorization for External Access
apiVersion: policy.linkerd.io/v1beta3
kind: ServerAuthorization
metadata:
  name: guild-api-external-authz
  namespace: guild-production
spec:
  server:
    name: guild-api
    selector:
      matchLabels:
        app: guild-api
  client:
    unauthenticated: false
    networks:
    - cidr: 10.0.0.0/8
    - cidr: 172.16.0.0/12
    - cidr: 192.168.0.0/16
`;

    // Create Linkerd directory
    const linkerdDir = path.join(this.infrastructureRoot, 'linkerd');
    if (!fs.existsSync(linkerdDir)) {
      fs.mkdirSync(linkerdDir, { recursive: true });
    }

    fs.writeFileSync(path.join(linkerdDir, 'linkerd-config.yaml'), linkerdConfig);

    // Create Linkerd installation script
    const linkerdInstall = `#!/bin/bash
# Linkerd Service Mesh Installation Script

set -e

echo "🌐 Installing Linkerd service mesh..."

# Install Linkerd CLI
curl -sL https://run.linkerd.io/install | sh
export PATH=\$HOME/.linkerd2/bin:\$PATH

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
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'install-linkerd.sh'), linkerdInstall);

    // Make script executable
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x infrastructure/install-linkerd.sh', {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      }
    } catch (error) {
      console.warn('Script permissions warning:', error.message);
    }

    // Update package.json with Linkerd scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'linkerd:install': './infrastructure/install-linkerd.sh',
      'linkerd:check': 'linkerd check',
      'linkerd:dashboard': 'linkerd viz dashboard',
      'linkerd:stat': 'linkerd stat deploy -n guild-production',
      'linkerd:traffic': 'linkerd viz stat deploy -n guild-production --all-namespaces'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async implementExternalSecretsOperator() {
    // External Secrets Operator implementation
    const externalSecretsConfig = `
// External Secrets Operator for Vault Integration
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend
  namespace: guild-production
spec:
  provider:
    vault:
      server: "https://vault.guild.com:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "guild-platform"
          serviceAccountRef:
            name: "external-secrets-sa"
            namespace: "external-secrets-system"

---
# Cluster Secret Store for Shared Secrets
apiVersion: external-secrets.io/v1beta1
kind: ClusterSecretStore
metadata:
  name: vault-cluster
spec:
  provider:
    vault:
      server: "https://vault.guild.com:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "guild-platform-cluster"
          serviceAccountRef:
            name: "external-secrets-cluster-sa"
            namespace: "external-secrets-system"

---
# External Secret for Database Credentials
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: guild-db-secret
  namespace: guild-production
spec:
  refreshInterval: 15m
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: guild-db-secret
    creationPolicy: Owner
  data:
  - secretKey: database-url
    remoteRef:
      key: database/guild
      property: url
  - secretKey: redis-url
    remoteRef:
      key: database/guild
      property: redis_url
  - secretKey: api-key
    remoteRef:
      key: api/guild
      property: key

---
# External Secret for Firebase Config
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: guild-firebase-secret
  namespace: guild-production
spec:
  refreshInterval: 1h
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: guild-firebase-secret
    creationPolicy: Owner
  data:
  - secretKey: project-id
    remoteRef:
      key: firebase/guild
      property: project_id
  - secretKey: private-key
    remoteRef:
      key: firebase/guild
      property: private_key
  - secretKey: client-email
    remoteRef:
      key: firebase/guild
      property: client_email

---
# External Secret for Payment Gateway
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: guild-payment-secret
  namespace: guild-production
spec:
  refreshInterval: 30m
  secretStoreRef:
    name: vault-backend
    kind: SecretStore
  target:
    name: guild-payment-secret
    creationPolicy: Owner
  data:
  - secretKey: stripe-secret-key
    remoteRef:
      key: payment/stripe
      property: secret_key
  - secretKey: paypal-client-id
    remoteRef:
      key: payment/paypal
      property: client_id
  - secretKey: paypal-client-secret
    remoteRef:
      key: payment/paypal
      property: client_secret

---
# Push Secret for Container Registry
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: guild-registry-secret
  namespace: guild-production
spec:
  refreshInterval: 24h
  secretStoreRef:
    name: vault-cluster
    kind: ClusterSecretStore
  target:
    name: guild-registry-secret
    creationPolicy: Owner
    template:
      type: kubernetes.io/dockerconfigjson
      data:
        .dockerconfigjson: |
          {
            "auths": {
              "gcr.io": {
                "auth": "{{ .registry_auth }}"
              },
              "registry.hub.docker.com": {
                "auth": "{{ .dockerhub_auth }}"
              }
            }
          }
  data:
  - secretKey: registry_auth
    remoteRef:
      key: registry/gcr
      property: auth
  - secretKey: dockerhub_auth
    remoteRef:
      key: registry/dockerhub
      property: auth

---
# Secret Rotation Policy
apiVersion: external-secrets.io/v1beta1
kind: SecretStore
metadata:
  name: vault-backend-rotating
  namespace: guild-production
spec:
  provider:
    vault:
      server: "https://vault.guild.com:8200"
      path: "secret"
      version: "v2"
      auth:
        kubernetes:
          mountPath: "kubernetes"
          role: "guild-platform-rotating"
          serviceAccountRef:
            name: "external-secrets-rotating-sa"
            namespace: "external-secrets-system"
  refreshInterval: 24h

---
# Vault Policy for External Secrets
# This would be applied to Vault
vault_policy = {
  path "secret/data/database/guild" {
    capabilities = ["read"]
  }
  path "secret/data/api/guild" {
    capabilities = ["read"]
  }
  path "secret/data/firebase/guild" {
    capabilities = ["read"]
  }
  path "secret/data/payment/*" {
    capabilities = ["read"]
  }
  path "secret/data/registry/*" {
    capabilities = ["read"]
  }
}

# Kubernetes Service Account for External Secrets
apiVersion: v1
kind: ServiceAccount
metadata:
  name: external-secrets-sa
  namespace: guild-production
  annotations:
    iam.gke.io/gcp-service-account: external-secrets@guild-production.iam.gserviceaccount.com

---
# Cluster Role for External Secrets
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: external-secrets-controller
rules:
- apiGroups: [""]
  resources: ["secrets"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]
- apiGroups: ["external-secrets.io"]
  resources: ["externalsecrets", "secretstores", "clustersecretstores"]
  verbs: ["get", "list", "watch", "create", "update", "patch", "delete"]

---
# Cluster Role Binding
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: external-secrets-controller
roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: external-secrets-controller
subjects:
- kind: ServiceAccount
  name: external-secrets-controller
  namespace: external-secrets-system
`;

    // Create External Secrets directory
    const esoDir = path.join(this.infrastructureRoot, 'external-secrets');
    if (!fs.existsSync(esoDir)) {
      fs.mkdirSync(esoDir, { recursive: true });
    }

    fs.writeFileSync(path.join(esoDir, 'external-secrets.yaml'), externalSecretsConfig);

    // Create External Secrets Operator installation script
    const esoInstall = `#!/bin/bash
# External Secrets Operator Installation Script

set -e

echo "🔐 Installing External Secrets Operator..."

# Install External Secrets Operator
helm repo add external-secrets https://charts.external-secrets.io/
helm repo update

# Install External Secrets Operator
helm upgrade --install external-secrets external-secrets/external-secrets \\
  --namespace external-secrets-system \\
  --create-namespace \\
  --set installCRDs=true \\
  --set webhook.create=false \\
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
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'install-external-secrets.sh'), esoInstall);

    // Make script executable
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x infrastructure/install-external-secrets.sh', {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      }
    } catch (error) {
      console.warn('Script permissions warning:', error.message);
    }

    // Update package.json with External Secrets scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'eso:install': './infrastructure/install-external-secrets.sh',
      'eso:verify': 'kubectl get externalsecrets -n guild-production',
      'eso:refresh': 'kubectl annotate externalsecrets --all -n guild-production external-secrets.io/force-sync=$(date +%s)',
      'eso:logs': 'kubectl logs -f deployment/external-secrets -n external-secrets-system'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async implementThanosMonitoring() {
    // Thanos long-term monitoring implementation
    const thanosConfig = `
// Thanos Long-Term Monitoring Configuration
apiVersion: v1
kind: ConfigMap
metadata:
  name: thanos-config
  namespace: monitoring
data:
  config.yaml: |
    type: OBJECT_STORAGE
    config:
      bucket: "guild-monitoring-bucket"
      endpoint: "s3.amazonaws.com"
      region: "us-east-1"
      access_key: "\${AWS_ACCESS_KEY_ID}"
      secret_key: "\${AWS_SECRET_ACCESS_KEY}"
      signature_version2: false

---
# Thanos Store Gateway
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-store
  namespace: monitoring
spec:
  serviceName: thanos-store
  replicas: 3
  selector:
    matchLabels:
      app: thanos-store
  template:
    metadata:
      labels:
        app: thanos-store
    spec:
      containers:
      - name: thanos-store
        image: thanosio/thanos:v0.32.0
        args:
        - store
        - --data-dir=/var/thanos/store
        - --objstore.config-file=/etc/thanos/config/config.yaml
        - --grpc-address=0.0.0.0:10901
        - --http-address=0.0.0.0:10902
        - --index-cache-size=500MB
        - --chunk-pool-size=500MB
        - --store.grpc.series-max-concurrency=20
        ports:
        - containerPort: 10901
          name: grpc
        - containerPort: 10902
          name: http
        volumeMounts:
        - name: config
          mountPath: /etc/thanos/config
        - name: storage
          mountPath: /var/thanos/store
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /-/healthy
            port: 10902
          initialDelaySeconds: 30
          periodSeconds: 30
        readinessProbe:
          httpGet:
            path: /-/ready
            port: 10902
          initialDelaySeconds: 10
          periodSeconds: 10
      volumes:
      - name: config
        configMap:
          name: thanos-config

  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "premium-rwo"
      resources:
        requests:
          storage: 100Gi

---
# Thanos Query Layer
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thanos-query
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thanos-query
  template:
    metadata:
      labels:
        app: thanos-query
    spec:
      containers:
      - name: thanos-query
        image: thanosio/thanos:v0.32.0
        args:
        - query
        - --http-address=0.0.0.0:10902
        - --grpc-address=0.0.0.0:10901
        - --store=thanos-store-0.thanos-store.monitoring.svc.cluster.local:10901
        - --store=thanos-store-1.thanos-store.monitoring.svc.cluster.local:10901
        - --store=thanos-store-2.thanos-store.monitoring.svc.cluster.local:10901
        - --query.replica-label=prometheus_replica
        - --query.replica-label=thanos_ruler_replica
        - --query.max-concurrent=100
        ports:
        - containerPort: 10901
          name: grpc
        - containerPort: 10902
          name: http
        resources:
          requests:
            cpu: 500m
            memory: 1Gi
          limits:
            cpu: 2000m
            memory: 4Gi
        livenessProbe:
          httpGet:
            path: /-/healthy
            port: 10902
          initialDelaySeconds: 30
          periodSeconds: 30

---
# Thanos Query Frontend
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thanos-query-frontend
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: thanos-query-frontend
  template:
    metadata:
      labels:
        app: thanos-query-frontend
    spec:
      containers:
      - name: thanos-query-frontend
        image: thanosio/thanos:v0.32.0
        args:
        - query-frontend
        - --http-address=0.0.0.0:10902
        - --query-frontend.downstream-url=http://thanos-query.monitoring.svc.cluster.local:10902
        - --query-range.split-interval=24h
        - --query-range.max-resolution=1h
        ports:
        - containerPort: 10902
          name: http
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 1Gi

---
# Thanos Compactor for Long-Term Storage
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: thanos-compactor
  namespace: monitoring
spec:
  serviceName: thanos-compactor
  replicas: 1
  selector:
    matchLabels:
      app: thanos-compactor
  template:
    metadata:
      labels:
        app: thanos-compactor
    spec:
      containers:
      - name: thanos-compactor
        image: thanosio/thanos:v0.32.0
        args:
        - compact
        - --data-dir=/var/thanos/compact
        - --objstore.config-file=/etc/thanos/config/config.yaml
        - --retention.resolution-raw=30d
        - --retention.resolution-5m=90d
        - --retention.resolution-1h=1y
        - --compact.concurrency=1
        - --deduplication.replica-label=prometheus_replica
        ports:
        - containerPort: 10902
          name: http
        volumeMounts:
        - name: config
          mountPath: /etc/thanos/config
        - name: storage
          mountPath: /var/thanos/compact
        resources:
          requests:
            cpu: 100m
            memory: 512Mi
          limits:
            cpu: 500m
            memory: 2Gi
        livenessProbe:
          httpGet:
            path: /-/healthy
            port: 10902
          initialDelaySeconds: 30
          periodSeconds: 30
      volumes:
      - name: config
        configMap:
          name: thanos-config

  volumeClaimTemplates:
  - metadata:
      name: storage
    spec:
      accessModes: ["ReadWriteOnce"]
      storageClassName: "premium-rwo"
      resources:
        requests:
          storage: 50Gi

---
# Thanos Ruler for Recording and Alerting Rules
apiVersion: apps/v1
kind: Deployment
metadata:
  name: thanos-ruler
  namespace: monitoring
spec:
  replicas: 2
  selector:
    matchLabels:
      app: thanos-ruler
  template:
    metadata:
      labels:
        app: thanos-ruler
    spec:
      containers:
      - name: thanos-ruler
        image: thanosio/thanos:v0.32.0
        args:
        - rule
        - --http-address=0.0.0.0:10902
        - --grpc-address=0.0.0.0:10901
        - --rule-file=/etc/thanos/rules/*.yml
        - --objstore.config-file=/etc/thanos/config/config.yaml
        - --query=http://thanos-query.monitoring.svc.cluster.local:10902
        - --alert.label-drop=prometheus_replica
        ports:
        - containerPort: 10901
          name: grpc
        - containerPort: 10902
          name: http
        volumeMounts:
        - name: config
          mountPath: /etc/thanos/config
        - name: rules
          mountPath: /etc/thanos/rules
        resources:
          requests:
            cpu: 100m
            memory: 256Mi
          limits:
            cpu: 500m
            memory: 1Gi
      volumes:
      - name: config
        configMap:
          name: thanos-config
      - name: rules
        configMap:
          name: thanos-rules

---
# Thanos Sidecar for Prometheus
apiVersion: apps/v1
kind: Deployment
metadata:
  name: prometheus-with-sidecar
  namespace: monitoring
spec:
  replicas: 1
  selector:
    matchLabels:
      app: prometheus
  template:
    metadata:
      labels:
        app: prometheus
    spec:
      containers:
      - name: prometheus
        image: prom/prometheus:v2.45.0
        args:
        - --config.file=/etc/prometheus/prometheus.yml
        - --storage.tsdb.path=/prometheus
        - --web.console.libraries=/etc/prometheus/console_libraries
        - --web.console.templates=/etc/prometheus/consoles
        ports:
        - containerPort: 9090
          name: http
        volumeMounts:
        - name: config
          mountPath: /etc/prometheus
        - name: storage
          mountPath: /prometheus

      - name: thanos-sidecar
        image: thanosio/thanos:v0.32.0
        args:
        - sidecar
        - --tsdb.path=/prometheus
        - --prometheus.url=http://localhost:9090
        - --objstore.config-file=/etc/thanos/config/config.yaml
        - --reloader.config-file=/etc/prometheus/prometheus.yml
        - --reloader.rule-dir=/etc/prometheus/rules
        ports:
        - containerPort: 10902
          name: http
        - containerPort: 10901
          name: grpc
        volumeMounts:
        - name: config
          mountPath: /etc/thanos/config
        - name: storage
          mountPath: /prometheus

      volumes:
      - name: config
        configMap:
          name: thanos-config
      - name: storage
        emptyDir: {}

---
# Thanos Services
apiVersion: v1
kind: Service
metadata:
  name: thanos-store
  namespace: monitoring
spec:
  selector:
    app: thanos-store
  ports:
  - name: grpc
    port: 10901
    targetPort: 10901
  - name: http
    port: 10902
    targetPort: 10902
  clusterIP: None

---
apiVersion: v1
kind: Service
metadata:
  name: thanos-query
  namespace: monitoring
spec:
  selector:
    app: thanos-query
  ports:
  - name: grpc
    port: 10901
    targetPort: 10901
  - name: http
    port: 10902
    targetPort: 10902

---
apiVersion: v1
kind: Service
metadata:
  name: thanos-query-frontend
  namespace: monitoring
spec:
  selector:
    app: thanos-query-frontend
  ports:
  - name: http
    port: 10902
    targetPort: 10902

---
# Service Monitor for Thanos
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: thanos-servicemonitor
  namespace: monitoring
spec:
  selector:
    matchLabels:
      app: thanos-store
  endpoints:
  - port: http
    interval: 30s
    scrapeTimeout: 10s

---
# Prometheus Rules for Thanos
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: thanos-rules
  namespace: monitoring
spec:
  groups:
  - name: thanos
    rules:
    - alert: ThanosStoreDown
      expr: up{job="thanos-store"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Thanos Store is down"
        description: "Thanos Store has been down for more than 5 minutes."

    - alert: ThanosQueryDown
      expr: up{job="thanos-query"} == 0
      for: 5m
      labels:
        severity: critical
      annotations:
        summary: "Thanos Query is down"
        description: "Thanos Query has been down for more than 5 minutes."
`;

    // Create Thanos directory
    const thanosDir = path.join(this.infrastructureRoot, 'thanos');
    if (!fs.existsSync(thanosDir)) {
      fs.mkdirSync(thanosDir, { recursive: true });
    }

    fs.writeFileSync(path.join(thanosDir, 'thanos-monitoring.yaml'), thanosConfig);

    // Create Thanos installation script
    const thanosInstall = `#!/bin/bash
# Thanos Installation Script

set -e

echo "📊 Installing Thanos for long-term monitoring..."

# Install Thanos
helm repo add thanos https://charts.bitnami.com/bitnami
helm repo update

# Install Thanos
helm upgrade --install thanos thanos/thanos \\
  --namespace monitoring \\
  --create-namespace \\
  --set objstoreConfig.bucket=guild-monitoring-bucket \\
  --set objstoreConfig.endpoint=s3.amazonaws.com \\
  --set objstoreConfig.region=us-east-1 \\
  --set store.enabled=true \\
  --set query.enabled=true \\
  --set query.frontend.enabled=true \\
  --set compactor.enabled=true \\
  --set ruler.enabled=true \\
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
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'install-thanos.sh'), thanosInstall);

    // Make script executable
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x infrastructure/install-thanos.sh', {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      }
    } catch (error) {
      console.warn('Script permissions warning:', error.message);
    }

    // Update package.json with Thanos scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'thanos:install': './infrastructure/install-thanos.sh',
      'thanos:query': 'kubectl port-forward svc/thanos-query 10902:10902 -n monitoring',
      'thanos:dashboard': 'kubectl port-forward svc/thanos-query-frontend 10902:10902 -n monitoring',
      'thanos:compact': 'kubectl logs -f statefulset/thanos-compactor -n monitoring',
      'thanos:verify': 'kubectl get pods -n monitoring --selector=app=thanos'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

// Run the implementer if called directly
if (require.main === module) {
  const implementer = new DeploymentAdvancedImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Advanced deployment implementation completed!');
    })
    .catch(error => {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = DeploymentAdvancedImplementer;