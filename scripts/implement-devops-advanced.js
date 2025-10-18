#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DevOpsAdvancedImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
    this.mobileRoot = this.projectRoot;
    this.adminRoot = path.join(this.projectRoot, 'admin-portal');
    this.infrastructureRoot = path.join(this.projectRoot, 'infrastructure');
  }

  async implement() {
    console.log('🚀 Implementing advanced DevOps and infrastructure features with STRICT rules...');

    try {
      // Step 1: Implement Infrastructure as Code with Pulumi
      console.log('🏗️  Implementing Infrastructure as Code with Pulumi...');
      await this.implementInfrastructureAsCode();

      // Step 2: Implement networking with GCP VPC
      console.log('🌐 Implementing networking with GCP VPC...');
      await this.implementNetworking();

      // Step 3: Implement Docker Compose multi-stage
      console.log('🐳 Implementing Docker Compose multi-stage...');
      await this.implementDockerCompose();

      // Step 4: Implement GKE orchestration with Helm
      console.log('☸️  Implementing GKE orchestration...');
      await this.implementGKEOrchestration();

      // Step 5: Implement GitLab CI/CD
      console.log('🔄 Implementing GitLab CI/CD...');
      await this.implementGitLabCI();

      console.log('✅ Advanced DevOps implementation completed!');

    } catch (error) {
      console.error('❌ Advanced DevOps implementation failed:', error.message);
      process.exit(1);
    }
  }

  async implementInfrastructureAsCode() {
    // Infrastructure as Code with Pulumi for Firebase
    const pulumiConfig = `
// Infrastructure as Code with Pulumi for Firebase and Multi-Cloud
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';
import * as aws from '@pulumi/aws';
import * as azure from '@pulumi/azure';
import * as firebase from '@pulumi/firebase';

// Configuration
const config = new pulumi.Config();
const project = config.require('project');
const region = config.get('region') || 'us-central1';
const environment = config.get('environment') || 'production';

// GCP Provider
const gcpProvider = new gcp.Provider('gcp-provider', {
  project: project,
  region: region,
});

// Firebase Project
const firebaseProject = new firebase.Project('guild-firebase-project', {
  projectId: \`guild-\${environment}\`,
  region: region,
});

// Firestore Database
const firestoreDatabase = new gcp.firestore.Database('guild-firestore', {
  project: firebaseProject.projectId,
  name: 'guild-database',
  locationId: region,
  type: 'FIRESTORE_NATIVE',
  deletionProtection: true,
});

// Firebase Functions
const firebaseFunctions = new firebase.Functions('guild-functions', {
  project: firebaseProject.projectId,
  region: region,
  runtime: 'nodejs18',
  availableMemoryMb: 1024,
  timeoutSeconds: 540,
  environmentVariables: {
    NODE_ENV: environment,
    FIREBASE_PROJECT_ID: firebaseProject.projectId,
  },
});

// Firebase Hosting
const firebaseHosting = new firebase.Hosting('guild-hosting', {
  project: firebaseProject.projectId,
  sites: [
    {
      siteId: 'guild-app',
      domain: {
        domain: \`app.guild.com\`,
        type: 'domain',
      },
    },
    {
      siteId: 'guild-admin',
      domain: {
        domain: \`admin.guild.com\`,
        type: 'domain',
      },
    },
  ],
});

// Firebase Storage
const firebaseStorage = new firebase.Storage('guild-storage', {
  project: firebaseProject.projectId,
  bucket: \`guild-\${environment}-storage\`,
  location: region,
  uniformBucketLevelAccess: true,
  versioning: {
    enabled: true,
  },
  lifecycleRules: [
    {
      action: {
        type: 'Delete',
      },
      condition: {
        age: 365, // Delete objects older than 1 year
        withState: 'ARCHIVED',
      },
    },
  ],
});

// Cloud Functions for API Gateway
const apiGateway = new gcp.cloudfunctions.Function('guild-api-gateway', {
  name: 'guild-api-gateway',
  runtime: 'nodejs18',
  availableMemoryMb: 2048,
  timeout: 540,
  entryPoint: 'apiGateway',
  sourceArchiveUrl: 'gs://guild-functions-source/guild-api-gateway.zip',
  triggerHttp: true,
  environmentVariables: {
    NODE_ENV: environment,
    FIREBASE_PROJECT_ID: firebaseProject.projectId,
  },
});

// VPC Network
const vpcNetwork = new gcp.compute.Network('guild-vpc', {
  name: 'guild-network',
  autoCreateSubnetworks: false,
  routingMode: 'GLOBAL',
  mtu: 1460,
});

// VPC Subnetworks
const vpcSubnetwork = new gcp.compute.Subnetwork('guild-subnet', {
  name: 'guild-subnet',
  network: vpcNetwork.id,
  ipCidrRange: '10.0.0.0/24',
  region: region,
  privateIpGoogleAccess: true,
  secondaryIpRanges: [
    {
      rangeName: 'services-range',
      ipCidrRange: '10.1.0.0/24',
    },
    {
      rangeName: 'pods-range',
      ipCidrRange: '10.2.0.0/24',
    },
  ],
});

// Cloud NAT for private instances
const cloudNat = new gcp.compute.RouterNat('guild-nat', {
  name: 'guild-nat',
  router: 'guild-router',
  region: region,
  natIpAllocateOption: 'AUTO_ONLY',
  sourceSubnetworkIpRangesToNat: 'ALL_SUBNETWORKS_ALL_IP_RANGES',
});

// Firebase Rules for Security
const firestoreRules = \`
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Jobs can be read by authenticated users, written by admins
    match /jobs/{jobId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
        exists(/databases/\$(database)/documents/users/\$(request.auth.uid)) &&
        get(/databases/\$(database)/documents/users/\$(request.auth.uid)).data.role == 'admin';
    }

    // Payments are restricted
    match /payments/{paymentId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/\$(database)/documents/users/\$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null &&
        get(/databases/\$(database)/documents/users/\$(request.auth.uid)).data.role == 'admin';
    }
  }
}
\`;

const storageRules = \`
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files
    match /users/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Allow public read for profile images
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }

    // Restrict admin uploads
    match /admin/{allPaths=**} {
      allow read, write: if request.auth != null &&
        exists(/databases/default/documents/users/\$(request.auth.uid)) &&
        get(/databases/default/documents/users/\$(request.auth.uid)).data.role == 'admin';
    }
  }
}
\`;

// Deploy Firebase rules
const firestoreRulesResource = new gcp.firebaserules.Ruleset('guild-firestore-rules', {
  project: firebaseProject.projectId,
  source: {
    files: [
      {
        name: 'firestore.rules',
        content: firestoreRules,
      },
    ],
  },
});

const storageRulesResource = new gcp.firebaserules.Ruleset('guild-storage-rules', {
  project: firebaseProject.projectId,
  source: {
    files: [
      {
        name: 'storage.rules',
        content: storageRules,
      },
    ],
  },
});

// Cloud Run for containerized services
const cloudRunService = new gcp.cloudrun.Service('guild-api-service', {
  name: 'guild-api-service',
  location: region,
  template: {
    spec: {
      containers: [
        {
          image: 'gcr.io/\${project}/guild-api:latest',
          ports: [
            {
              containerPort: 8080,
            },
          ],
          env: [
            {
              name: 'NODE_ENV',
              value: environment,
            },
            {
              name: 'FIREBASE_PROJECT_ID',
              value: firebaseProject.projectId,
            },
          ],
          resources: {
            limits: {
              cpu: '2000m',
              memory: '4Gi',
            },
          },
        },
      ],
    },
    metadata: {
      annotations: {
        'autoscaling.knative.dev/minScale': '1',
        'autoscaling.knative.dev/maxScale': '10',
      },
    },
  },
  traffics: [
    {
      percent: 100,
      latestRevision: true,
    },
  ],
});

// IAM Service Account for Cloud Run
const serviceAccount = new gcp.serviceaccount.Account('guild-api-sa', {
  accountId: 'guild-api-service',
  displayName: 'Guild API Service Account',
});

// IAM bindings
const serviceAccountBinding = new gcp.projects.IAMBinding('guild-api-iam', {
  project: project,
  role: 'roles/cloudtranslate.user',
  members: [serviceAccount.email.apply(email => \`serviceAccount:\${email}\`)],
});

// Cloud Load Balancer
const loadBalancer = new gcp.compute.GlobalAddress('guild-lb-ip', {
  name: 'guild-lb-ip',
  addressType: 'EXTERNAL',
});

const sslCertificate = new gcp.compute.ManagedSslCertificate('guild-ssl-cert', {
  name: 'guild-ssl-cert',
  managed: {
    domains: ['api.guild.com', 'admin.guild.com'],
  },
});

const urlMap = new gcp.compute.URLMap('guild-url-map', {
  name: 'guild-url-map',
  defaultService: cloudRunService.statuses[0].url,
  hostRules: [
    {
      hosts: ['api.guild.com'],
      pathMatcher: 'api-paths',
    },
    {
      hosts: ['admin.guild.com'],
      pathMatcher: 'admin-paths',
    },
  ],
  pathMatchers: [
    {
      name: 'api-paths',
      defaultService: cloudRunService.statuses[0].url,
      pathRules: [
        {
          paths: ['/api/*'],
          service: cloudRunService.statuses[0].url,
        },
      ],
    },
    {
      name: 'admin-paths',
      defaultService: firebaseHosting.sites[1].defaultUrl,
      pathRules: [
        {
          paths: ['/*'],
          service: firebaseHosting.sites[1].defaultUrl,
        },
      ],
    },
  ],
});

const targetHttpsProxy = new gcp.compute.TargetHttpsProxy('guild-https-proxy', {
  name: 'guild-https-proxy',
  urlMap: urlMap.id,
  sslCertificates: [sslCertificate.id],
});

const globalForwardingRule = new gcp.compute.GlobalForwardingRule('guild-forwarding-rule', {
  name: 'guild-forwarding-rule',
  target: targetHttpsProxy.id,
  ipAddress: loadBalancer.address,
  portRange: '443',
});

// Export outputs
export const firebaseProjectId = firebaseProject.projectId;
export const firestoreDatabaseName = firestoreDatabase.name;
export const storageBucketName = firebaseStorage.bucket;
export const apiGatewayUrl = apiGateway.httpsTriggerUrl;
export const loadBalancerIP = loadBalancer.address;
export const cloudRunUrl = cloudRunService.statuses[0].url;
`;

    // Create infrastructure directory
    const infraDir = path.join(this.infrastructureRoot);
    if (!fs.existsSync(infraDir)) {
      fs.mkdirSync(infraDir, { recursive: true });
    }

    fs.writeFileSync(path.join(infraDir, 'index.ts'), pulumiConfig);

    // Create Pulumi configuration
    const pulumiConfigFile = {
      "name": "guild-infrastructure",
      "runtime": "nodejs",
      "description": "Infrastructure as Code for Guild Platform",
      "config": {
        "gcp:project": "guild-production",
        "gcp:region": "us-central1",
        "aws:region": "us-east-1",
        "azure:location": "East US"
      },
      "dependencies": {
        "@pulumi/pulumi": "^3.0.0",
        "@pulumi/gcp": "^7.0.0",
        "@pulumi/aws": "^6.0.0",
        "@pulumi/azure": "^5.0.0",
        "@pulumi/firebase": "^5.0.0"
      }
    };

    fs.writeFileSync(path.join(infraDir, 'package.json'), JSON.stringify(pulumiConfigFile, null, 2));
  }

  async implementNetworking() {
    // GCP VPC networking implementation
    const networkingConfig = `
// Advanced GCP VPC Networking with Peering and Security
import * as pulumi from '@pulumi/pulumi';
import * as gcp from '@pulumi/gcp';

const config = new pulumi.Config();
const project = config.require('project');
const region = config.get('region') || 'us-central1';

// Main VPC Network
export const mainVpc = new gcp.compute.Network('guild-main-vpc', {
  name: 'guild-main-network',
  autoCreateSubnetworks: false,
  routingMode: 'GLOBAL',
  mtu: 1460,
  enableUlaInternalIpv6: false,
  deleteDefaultRoutesOnCreate: false,
});

// Regional Subnetworks
export const usCentralSubnet = new gcp.compute.Subnetwork('guild-us-central-subnet', {
  name: 'guild-us-central-subnet',
  network: mainVpc.id,
  ipCidrRange: '10.0.0.0/24',
  region: 'us-central1',
  privateIpGoogleAccess: true,
  secondaryIpRanges: [
    {
      rangeName: 'services-range',
      ipCidrRange: '10.1.0.0/24',
    },
    {
      rangeName: 'pods-range',
      ipCidrRange: '10.2.0.0/24',
    },
  ],
});

export const usEastSubnet = new gcp.compute.Subnetwork('guild-us-east-subnet', {
  name: 'guild-us-east-subnet',
  network: mainVpc.id,
  ipCidrRange: '10.10.0.0/24',
  region: 'us-east1',
  privateIpGoogleAccess: true,
  secondaryIpRanges: [
    {
      rangeName: 'services-range',
      ipCidrRange: '10.11.0.0/24',
    },
    {
      rangeName: 'pods-range',
      ipCidrRange: '10.12.0.0/24',
    },
  ],
});

// VPC Peering for multi-region connectivity
export const vpcPeering = new gcp.compute.NetworkPeering('guild-vpc-peering', {
  name: 'guild-vpc-peering',
  network: mainVpc.id,
  peerNetwork: 'projects/guild-shared-vpc/global/networks/guild-shared-network',
});

// Cloud Router for hybrid connectivity
export const cloudRouter = new gcp.compute.Router('guild-cloud-router', {
  name: 'guild-cloud-router',
  network: mainVpc.id,
  region: region,
  bgp: {
    asn: 64514,
    advertiseMode: 'CUSTOM',
    advertisedGroups: ['ALL_SUBNETS'],
  },
});

// Cloud NAT for private instances
export const cloudNat = new gcp.compute.RouterNat('guild-cloud-nat', {
  name: 'guild-cloud-nat',
  router: cloudRouter.name,
  region: region,
  natIpAllocateOption: 'AUTO_ONLY',
  sourceSubnetworkIpRangesToNat: 'ALL_SUBNETWORKS_ALL_IP_RANGES',
  logConfig: {
    enable: true,
    filter: 'ALL',
  },
});

// Firewall Rules
export const allowInternalTraffic = new gcp.compute.Firewall('guild-allow-internal', {
  name: 'guild-allow-internal',
  network: mainVpc.name,
  allows: [
    {
      protocol: 'tcp',
      ports: ['0-65535'],
    },
    {
      protocol: 'udp',
      ports: ['0-65535'],
    },
    {
      protocol: 'icmp',
    },
  ],
  sourceRanges: ['10.0.0.0/8'],
  direction: 'INGRESS',
});

export const allowHttps = new gcp.compute.Firewall('guild-allow-https', {
  name: 'guild-allow-https',
  network: mainVpc.name,
  allows: [
    {
      protocol: 'tcp',
      ports: ['443'],
    },
  ],
  sourceRanges: ['0.0.0.0/0'],
  direction: 'INGRESS',
});

export const allowHealthChecks = new gcp.compute.Firewall('guild-allow-health-checks', {
  name: 'guild-allow-health-checks',
  network: mainVpc.name,
  allows: [
    {
      protocol: 'tcp',
      ports: ['80', '443'],
    },
  ],
  sourceRanges: ['35.191.0.0/16', '130.211.0.0/22'], // GCP health check ranges
  direction: 'INGRESS',
});

// Private Service Connect for secure API access
export const privateServiceConnect = new gcp.compute.ServiceAttachment('guild-psc', {
  name: 'guild-psc',
  region: region,
  connectionPreference: 'ACCEPT_AUTOMATIC',
  natSubnets: [usCentralSubnet.name],
  targetService: cloudRunService.statuses[0].url,
});

// DNS Configuration
export const dnsZone = new gcp.dns.ManagedZone('guild-dns-zone', {
  name: 'guild-zone',
  dnsName: 'guild.com.',
  description: 'DNS zone for Guild platform',
  labels: {
    environment: 'production',
  },
});

export const apiDnsRecord = new gcp.dns.RecordSet('guild-api-dns', {
  name: 'api.guild.com.',
  type: 'A',
  ttl: 300,
  managedZone: dnsZone.name,
  rrdatas: [loadBalancerIP.address],
});

export const adminDnsRecord = new gcp.dns.RecordSet('guild-admin-dns', {
  name: 'admin.guild.com.',
  type: 'CNAME',
  ttl: 300,
  managedZone: dnsZone.name,
  rrdatas: ['guild-app.firebaseapp.com.'],
});

// VPC Service Controls for data protection
export const vpcServicePerimeter = new gcp.accesscontextmanager.ServicePerimeter('guild-service-perimeter', {
  name: 'guild-service-perimeter',
  parent: \`organizations/\${project}\`,
  title: 'Guild Service Perimeter',
  perimeterType: 'PERIMETER_TYPE_REGULAR',
  status: {
    resources: [
      \`projects/\${project}\`,
    ],
    restrictedServices: [
      'storage.googleapis.com',
      'firestore.googleapis.com',
      'firebase.googleapis.com',
    ],
    vpcAccessibleServices: {
      enableRestriction: true,
      allowedServices: [
        'storage.googleapis.com',
        'firestore.googleapis.com',
      ],
    },
  },
});

// Export outputs
export const vpcNetworkName = mainVpc.name;
export const vpcSubnetworkName = usCentralSubnet.name;
export const loadBalancerIP = loadBalancerIP.address;
export const dnsZoneName = dnsZone.name;
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'networking.ts'), networkingConfig);
  }

  async implementDockerCompose() {
    // Multi-stage Docker Compose
    const dockerComposeConfig = `
// Multi-Stage Docker Compose for Development and Production
version: '3.8'

networks:
  guild-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16

volumes:
  postgres_data:
  redis_data:
  elasticsearch_data:
  prometheus_data:
  grafana_data:

services:
  # Database Layer
  postgres:
    image: postgres:15-alpine
    container_name: guild-postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: guild
      POSTGRES_USER: guild_user
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-guild_secure_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./docker/postgres/init:/docker-entrypoint-initdb.d
    ports:
      - "5432:5432"
    networks:
      - guild-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U guild_user -d guild"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 30s

  redis:
    image: redis:7-alpine
    container_name: guild-redis
    restart: unless-stopped
    command: redis-server --appendonly yes --requirepass \${REDIS_PASSWORD:-guild_redis_password}
    volumes:
      - redis_data:/data
      - ./docker/redis/redis.conf:/etc/redis/redis.conf:ro
    ports:
      - "6379:6379"
    networks:
      - guild-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Search and Analytics
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: guild-elasticsearch
    restart: unless-stopped
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
      - "9300:9300"
    networks:
      - guild-network
    healthcheck:
      test: ["CMD-SHELL", "curl -f http://localhost:9200/_cluster/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Monitoring Stack
  prometheus:
    image: prom/prometheus:latest
    container_name: guild-prometheus
    restart: unless-stopped
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    volumes:
      - ./docker/prometheus:/etc/prometheus
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    networks:
      - guild-network
    depends_on:
      - guild-api

  grafana:
    image: grafana/grafana:latest
    container_name: guild-grafana
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=\${GRAFANA_PASSWORD:-guild_grafana_password}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana_data:/var/lib/grafana
      - ./docker/grafana/provisioning:/etc/grafana/provisioning
    ports:
      - "3000:3000"
    networks:
      - guild-network
    depends_on:
      - prometheus

  # Application Services
  guild-api:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: guild-api
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - PORT=8080
      - DATABASE_URL=postgresql://guild_user:guild_secure_password@guild-postgres:5432/guild
      - REDIS_URL=redis://:guild_redis_password@guild-redis:6379
      - ELASTICSEARCH_URL=http://guild-elasticsearch:9200
      - FIREBASE_PROJECT_ID=guild-production
    ports:
      - "8080:8080"
    networks:
      - guild-network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
      elasticsearch:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  guild-worker:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: production
    container_name: guild-worker
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - WORKER_TYPE=background
      - DATABASE_URL=postgresql://guild_user:guild_secure_password@guild-postgres:5432/guild
      - REDIS_URL=redis://:guild_redis_password@guild-redis:6379
    networks:
      - guild-network
    depends_on:
      - guild-api
      - postgres
      - redis
    command: npm run worker

  guild-admin:
    build:
      context: ./admin-portal
      dockerfile: Dockerfile
      target: production
    container_name: guild-admin
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - REACT_APP_API_URL=http://guild-api:8080
      - REACT_APP_FIREBASE_CONFIG=\${FIREBASE_CONFIG}
    ports:
      - "3001:80"
    networks:
      - guild-network
    depends_on:
      - guild-api

  guild-mobile:
    build:
      context: .
      dockerfile: Dockerfile.mobile
      target: production
    container_name: guild-mobile
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - EXPO_WEB_PORT=3002
    ports:
      - "3002:3002"
    networks:
      - guild-network

  # Load Testing
  jmeter-master:
    image: justb4/jmeter:latest
    container_name: guild-jmeter-master
    restart: 'no'
    environment:
      - JMETER_MODE=MASTER
      - JMETER_SLAVES=jmeter-slave1,jmeter-slave2
    volumes:
      - ./testing/load:/test
    networks:
      - guild-network
    command: jmeter -n -t /test/guild-load-test.jmx -R jmeter-slave1,jmeter-slave2 -l /test/results.jtl

  jmeter-slave1:
    image: justb4/jmeter:latest
    container_name: guild-jmeter-slave1
    restart: 'no'
    environment:
      - JMETER_MODE=SLAVE
      - JMETER_SERVER_RMI_PORT=1099
    networks:
      - guild-network

  jmeter-slave2:
    image: justb4/jmeter:latest
    container_name: guild-jmeter-slave2
    restart: 'no'
    environment:
      - JMETER_MODE=SLAVE
      - JMETER_SERVER_RMI_PORT=1099
    networks:
      - guild-network

  # Security Testing
  zap:
    image: owasp/zap2docker-stable:latest
    container_name: guild-zap
    restart: 'no'
    environment:
      - ZAP_PORT=8080
    ports:
      - "8080:8080"
    volumes:
      - ./testing/security:/zap/wrk
    networks:
      - guild-network
    command: zap.sh -daemon -port 8080 -config api.disablekey=true

  # Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: guild-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
    networks:
      - guild-network
    depends_on:
      - guild-api
      - guild-admin
      - guild-mobile
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
`;

    // Create docker directory structure
    const dockerDir = path.join(this.projectRoot, 'docker');
    if (!fs.existsSync(dockerDir)) {
      fs.mkdirSync(dockerDir, { recursive: true });
    }

    fs.writeFileSync(path.join(dockerDir, 'docker-compose.yml'), dockerComposeConfig);

    // Create Docker Compose override for production
    const dockerComposeProd = `
// Production Docker Compose Override
version: '3.8'

services:
  guild-api:
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '1.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 1G
      update_config:
        parallelism: 1
        delay: 10s
      restart_policy:
        condition: on-failure
        delay: 5s
        max_attempts: 3
        window: 120s

  guild-worker:
    deploy:
      replicas: 2

  postgres:
    deploy:
      placement:
        constraints:
          - node.role == manager

  redis:
    command: redis-server --appendonly yes --requirepass \${REDIS_PASSWORD}

  elasticsearch:
    environment:
      - xpack.security.enabled=true
      - xpack.security.transport.ssl.enabled=true
      - xpack.security.http.ssl.enabled=true

  prometheus:
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=720h' # 30 days
      - '--web.enable-lifecycle'
    secrets:
      - prometheus_config

  grafana:
    environment:
      - GF_SECURITY_ADMIN_PASSWORD_FILE=/run/secrets/grafana_password
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
    secrets:
      - grafana_password

secrets:
  prometheus_config:
    file: ./docker/prometheus/prometheus.yml
  grafana_password:
    file: ./docker/grafana/grafana_password.txt
`;

    fs.writeFileSync(path.join(dockerDir, 'docker-compose.prod.yml'), dockerComposeProd);

    // Create production Dockerfile
    const dockerfile = `
// Multi-Stage Dockerfile for Production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build the application
RUN npm run build

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 guild

COPY --from=builder /app/public ./public

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=guild:nodejs /app/.next/standalone ./
COPY --from=builder --chown=guild:nodejs /app/.next/static ./.next/static

USER guild

EXPOSE 3000

ENV PORT 3000

# server.js is created by next build from the standalone output
# https://nextjs.org/docs/pages/api-reference/next-config-js/output
CMD ["node", "server.js"]
`;

    fs.writeFileSync(path.join(this.backendRoot, 'Dockerfile'), dockerfile);

    // Update package.json with Docker scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'docker:build': 'docker-compose build',
      'docker:up': 'docker-compose up -d',
      'docker:down': 'docker-compose down',
      'docker:logs': 'docker-compose logs -f',
      'docker:prod': 'docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d',
      'docker:test': 'docker-compose -f docker-compose.test.yml up --abort-on-container-exit'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async implementGKEOrchestration() {
    // GKE orchestration with Helm charts
    const helmChart = `
// Helm Chart for Guild Platform Kubernetes Deployment
apiVersion: v2
name: guild-platform
description: A Helm chart for Guild Platform
type: application
version: 0.1.0
appVersion: "1.0.0"

keywords:
  - guild
  - platform
  - kubernetes
  - gke

maintainers:
  - name: Guild DevOps Team

dependencies:
  - name: prometheus
    version: "25.0.0"
    repository: "https://prometheus-community.github.io/helm-charts"
  - name: grafana
    version: "7.0.0"
    repository: "https://grafana.github.io/helm-charts"
  - name: elasticsearch
    version: "8.11.0"
    repository: "https://helm.elastic.co"

# Application values
guild-api:
  image:
    repository: gcr.io/guild-production/guild-api
    tag: "latest"
    pullPolicy: Always

  replicaCount: 3

  service:
    type: ClusterIP
    port: 80
    targetPort: 8080

  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 500m
      memory: 1Gi

  autoscaling:
    enabled: true
    minReplicas: 3
    maxReplicas: 10
    targetCPUUtilizationPercentage: 70
    targetMemoryUtilizationPercentage: 80

  config:
    databaseUrl: "postgresql://guild:secure_password@guild-postgres:5432/guild"
    redisUrl: "redis://:secure_password@guild-redis:6379"
    firebaseProjectId: "guild-production"

guild-worker:
  image:
    repository: gcr.io/guild-production/guild-worker
    tag: "latest"
    pullPolicy: Always

  replicaCount: 2

  resources:
    limits:
      cpu: 1000m
      memory: 2Gi
    requests:
      cpu: 200m
      memory: 512Mi

guild-frontend:
  image:
    repository: gcr.io/guild-production/guild-frontend
    tag: "latest"
    pullPolicy: Always

  replicaCount: 2

  service:
    type: ClusterIP
    port: 80
    targetPort: 3000

  ingress:
    enabled: true
    className: "gce"
    annotations:
      kubernetes.io/ingress.class: "gce"
      kubernetes.io/ingress.global-static-ip-name: "guild-lb-ip"
      networking.gke.io/managed-certificates: "guild-ssl-cert"
      networking.gke.io/v1beta1.FrontendConfig: "guild-frontend-config"
    hosts:
      - host: app.guild.com
        paths:
          - path: /
            pathType: Prefix
      - host: admin.guild.com
        paths:
          - path: /
            pathType: Prefix

# Database configuration
postgresql:
  enabled: true
  auth:
    postgresPassword: "secure_postgres_password"
    password: "secure_guild_password"

  primary:
    persistence:
      enabled: true
      size: 100Gi
      storageClass: "premium-rwo"

    resources:
      limits:
        cpu: 2000m
        memory: 8Gi
      requests:
        cpu: 1000m
        memory: 4Gi

# Redis configuration
redis:
  enabled: true
  auth:
    password: "secure_redis_password"

  master:
    persistence:
      enabled: true
      size: 50Gi
      storageClass: "premium-rwo"

# Elasticsearch configuration
elasticsearch:
  enabled: true

  persistence:
    enabled: true
    size: 200Gi
    storageClass: "premium-rwo"

  resources:
    limits:
      cpu: 2000m
      memory: 8Gi
    requests:
      cpu: 1000m
      memory: 4Gi

# Monitoring configuration
prometheus:
  enabled: true
  server:
    persistentVolume:
      enabled: true
      size: 50Gi
      storageClass: "premium-rwo"

  alertmanager:
    persistentVolume:
      enabled: true
      size: 10Gi

grafana:
  enabled: true
  persistence:
    enabled: true
    size: 20Gi
    storageClass: "premium-rwo"

  adminPassword: "secure_grafana_password"

# Ingress configuration
ingress-nginx:
  enabled: true
  controller:
    replicaCount: 2
    resources:
      limits:
        cpu: 1000m
        memory: 2Gi
      requests:
        cpu: 200m
        memory: 512Mi

    service:
      loadBalancerIP: "34.102.136.180"
      annotations:
        networking.gke.io/v1beta1.FrontendConfig: "guild-frontend-config"

# Service mesh with Istio
istio:
  enabled: true
  gateways:
    istio-ingressgateway:
      enabled: true

# Security policies
networkPolicies:
  enabled: true

  guild-api:
    podSelector:
      matchLabels:
        app: guild-api
    policyTypes:
      - Ingress
      - Egress

# Horizontal Pod Autoscaler
hpa:
  guild-api:
    enabled: true
    minReplicas: 3
    maxReplicas: 20
    targetCPUUtilizationPercentage: 70

# Pod Disruption Budget
pdb:
  guild-api:
    enabled: true
    minAvailable: 2

# Secrets management
secrets:
  guild-api:
    databasePassword: "base64-encoded-password"
    redisPassword: "base64-encoded-password"
    firebaseServiceAccount: "base64-encoded-json"
`;

    // Create Helm chart structure
    const helmDir = path.join(this.infrastructureRoot, 'helm', 'guild-platform');
    if (!fs.existsSync(helmDir)) {
      fs.mkdirSync(helmDir, { recursive: true });
    }

    fs.writeFileSync(path.join(helmDir, 'Chart.yaml'), helmChart);

    // Create values.yaml
    const valuesYaml = `
// Helm Values for Guild Platform
guild-api:
  image:
    repository: gcr.io/guild-production/guild-api
    tag: "latest"

  replicaCount: 3

  resources:
    limits:
      cpu: 2000m
      memory: 4Gi
    requests:
      cpu: 500m
      memory: 1Gi

  config:
    databaseUrl: "postgresql://guild:secure_password@guild-postgres:5432/guild"
    redisUrl: "redis://:secure_password@guild-redis:6379"

# Production overrides
environment: production

# Database configuration
postgresql:
  auth:
    postgresPassword: "CHANGE_THIS_PASSWORD"
    password: "CHANGE_THIS_PASSWORD"

  primary:
    persistence:
      size: "100Gi"

# Redis configuration
redis:
  auth:
    password: "CHANGE_THIS_PASSWORD"

# Elasticsearch configuration
elasticsearch:
  persistence:
    size: "200Gi"

# Monitoring
prometheus:
  server:
    persistentVolume:
      size: "50Gi"

grafana:
  persistence:
    size: "20Gi"
  adminPassword: "CHANGE_THIS_PASSWORD"
`;

    fs.writeFileSync(path.join(helmDir, 'values.yaml'), valuesYaml);

    // Create deployment script
    const deployScript = `#!/bin/bash
# Kubernetes Deployment Script for Guild Platform

set -e

echo "🚀 Deploying Guild Platform to GKE..."

# Set up kubectl context
gcloud container clusters get-credentials guild-cluster --region us-central1

# Install Helm dependencies
helm dependency update helm/guild-platform

# Deploy to staging first
echo "📦 Deploying to staging environment..."
helm upgrade --install guild-staging helm/guild-platform \\
  --namespace staging \\
  --create-namespace \\
  --values helm/guild-platform/values-staging.yaml \\
  --wait \\
  --timeout 600s

# Run tests against staging
echo "🧪 Running tests against staging..."
kubectl run test-runner --image=guild/test-runner:latest --rm -i --restart=Never \\
  --namespace staging

# If staging tests pass, deploy to production
if [ $? -eq 0 ]; then
  echo "✅ Staging tests passed, deploying to production..."

  helm upgrade --install guild-production helm/guild-platform \\
    --namespace production \\
    --create-namespace \\
    --values helm/guild-platform/values-production.yaml \\
    --wait \\
    --timeout 900s

  echo "🎉 Production deployment completed successfully!"

  # Verify deployment
  kubectl get pods -n production
  kubectl get services -n production
  kubectl get ingress -n production

else
  echo "❌ Staging tests failed, aborting production deployment"
  exit 1
fi
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'deploy.sh'), deployScript);

    // Make script executable
    try {
      if (process.platform !== 'win32') {
        execSync('chmod +x infrastructure/deploy.sh', {
          cwd: this.projectRoot,
          stdio: 'inherit'
        });
      }
    } catch (error) {
      console.warn('Script permissions warning:', error.message);
    }

    // Update package.json with deployment scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'deploy:gke': './infrastructure/deploy.sh',
      'deploy:staging': 'helm upgrade --install guild-staging helm/guild-platform --namespace staging',
      'deploy:production': 'helm upgrade --install guild-production helm/guild-platform --namespace production',
      'deploy:rollback': 'helm rollback guild-production 1'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  async implementGitLabCI() {
    // GitLab CI/CD implementation
    const gitlabCIConfig = `
// GitLab CI/CD Pipeline for Guild Platform
stages:
  - validate
  - test
  - build
  - deploy
  - monitor

variables:
  NODE_VERSION: "18"
  DOCKER_DRIVER: overlay2
  DOCKER_TLS_CERTDIR: ""
  KUBECONFIG: /builds/guild-platform/.kube/config

# Cache configuration for faster builds
cache:
  key: \${CI_COMMIT_REF_SLUG}
  paths:
    - node_modules/
    - .npm/
    - backend/node_modules/
    - backend/.npm/

# Template for jobs
.job_template: &job_template
  image: node:\${NODE_VERSION}
  before_script:
    - npm ci --cache .npm --prefer-offline
  cache:
    key: \${CI_COMMIT_REF_SLUG}
    paths:
      - node_modules/
      - .npm/

# Validation Stage
validate:lint:
  <<: *job_template
  stage: validate
  script:
    - npm run lint
    - npm run type-check
    - npm run security:audit
  only:
    - merge_requests
    - main
    - develop

validate:dependencies:
  <<: *job_template
  stage: validate
  script:
    - npm run depcheck
    - npm audit --audit-level moderate
  only:
    - merge_requests
    - main

# Test Stage
test:unit:
  <<: *job_template
  stage: test
  script:
    - npm run test:ci
  coverage: '/All files\\s+\\|\\s+([\\d\\.]+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
      junit: test-results/junit.xml
    paths:
      - coverage/
      - test-results/
    expire_in: 1 week
  only:
    - merge_requests
    - main
    - develop

test:e2e:
  <<: *job_template
  stage: test
  image: cypress/included:13.6.0
  script:
    - npm run test:e2e:ci
  artifacts:
    paths:
      - cypress/videos/
      - cypress/screenshots/
    expire_in: 1 week
    when: always
  only:
    - merge_requests
    - main

test:load:
  stage: test
  image: justb4/jmeter:latest
  script:
    - npm run test:load
  artifacts:
    paths:
      - testing/load/jmeter-results/
    expire_in: 1 week
    when: always
  only:
    - main
    - schedules

test:security:
  stage: test
  image: owasp/zap2docker-stable:latest
  script:
    - npm run test:security
  artifacts:
    paths:
      - testing/security/reports/
    expire_in: 1 week
    when: always
  only:
    - main
    - schedules

# Build Stage
build:backend:
  <<: *job_template
  stage: build
  script:
    - cd backend
    - npm run build
    - npm run build:docker
  artifacts:
    paths:
      - backend/dist/
      - backend/Dockerfile
    expire_in: 1 hour
  only:
    - merge_requests
    - main

build:frontend:
  <<: *job_template
  stage: build
  script:
    - npm run build
    - npm run build:docker
  artifacts:
    paths:
      - build/
      - Dockerfile
    expire_in: 1 hour
  only:
    - merge_requests
    - main

# Deploy Stage
deploy:staging:
  stage: deploy
  image: google/cloud-sdk:alpine
  script:
    - echo \$GCP_SERVICE_ACCOUNT_KEY > /tmp/key.json
    - gcloud auth activate-service-account --key-file=/tmp/key.json
    - gcloud config set project \$GCP_PROJECT_ID
    - gcloud container clusters get-credentials guild-staging --region us-central1
    - helm upgrade --install guild-staging helm/guild-platform --namespace staging --wait
  environment:
    name: staging
    url: https://staging.guild.com
  only:
    - develop
  when: manual

deploy:production:
  stage: deploy
  image: google/cloud-sdk:alpine
  script:
    - echo \$GCP_SERVICE_ACCOUNT_KEY > /tmp/key.json
    - gcloud auth activate-service-account --key-file=/tmp/key.json
    - gcloud config set project \$GCP_PROJECT_ID
    - gcloud container clusters get-credentials guild-production --region us-central1
    - helm upgrade --install guild-production helm/guild-platform --namespace production --wait
  environment:
    name: production
    url: https://app.guild.com
  only:
    - main
  when: manual

# Monitor Stage
monitor:health:
  stage: monitor
  image: curlimages/curl:latest
  script:
    - curl -f https://app.guild.com/health || exit 1
    - curl -f https://admin.guild.com/health || exit 1
    - curl -f https://api.guild.com/health || exit 1
  only:
    - main

monitor:performance:
  stage: monitor
  image: google/cloud-sdk:alpine
  script:
    - echo \$GCP_SERVICE_ACCOUNT_KEY > /tmp/key.json
    - gcloud auth activate-service-account --key-file=/tmp/key.json
    - gcloud monitoring metrics list --filter='metric.type="loadbalancing.googleapis.com/https/request_count"'
  only:
    - main
  when: manual

# Cleanup Stage
cleanup:cache:
  stage: .post
  script:
    - echo "Cleaning up cache and temporary files..."
    - rm -rf node_modules/.cache
    - rm -rf .npm/_cacache
  when: always

# Notification
notify:slack:
  stage: .post
  image: curlimages/curl:latest
  script:
    - |
      if [ "\$CI_JOB_STATUS" == "success" ]; then
        MESSAGE="✅ Pipeline succeeded for \$CI_COMMIT_REF_NAME"
      else
        MESSAGE="❌ Pipeline failed for \$CI_COMMIT_REF_NAME"
      fi
      curl -X POST -H 'Content-type: application/json' \\
        --data "{\"text\":\"\$MESSAGE\\nBranch: \$CI_COMMIT_REF_NAME\\nPipeline: \$CI_PIPELINE_URL\"}" \\
        \$SLACK_WEBHOOK_URL
  only:
    - main
    - develop
  when: always
`;

    fs.writeFileSync(path.join(this.projectRoot, '.gitlab-ci.yml'), gitlabCIConfig);

    // Update package.json with CI scripts
    const packageJsonPath = path.join(this.projectRoot, 'package.json');
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

    packageJson.scripts = {
      ...packageJson.scripts,
      'ci:validate': 'npm run lint && npm run type-check && npm run security:audit',
      'ci:test': 'npm run test:ci && npm run test:e2e:ci',
      'ci:build': 'npm run build && npm run build:docker',
      'ci:deploy': 'echo "Deploying via GitLab CI/CD..."',
      'security:audit': 'npm audit --audit-level moderate',
      'build:docker': 'docker build -t guild-api .'
    };

    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }
}

// Run the implementer if called directly
if (require.main === module) {
  const implementer = new DevOpsAdvancedImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Advanced DevOps implementation completed!');
    })
    .catch(error => {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = DevOpsAdvancedImplementer;







