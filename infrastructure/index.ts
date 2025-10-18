
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
  projectId: `guild-${environment}`,
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
        domain: `app.guild.com`,
        type: 'domain',
      },
    },
    {
      siteId: 'guild-admin',
      domain: {
        domain: `admin.guild.com`,
        type: 'domain',
      },
    },
  ],
});

// Firebase Storage
const firebaseStorage = new firebase.Storage('guild-storage', {
  project: firebaseProject.projectId,
  bucket: `guild-${environment}-storage`,
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
const firestoreRules = `
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
        exists(/databases/$(database)/documents/users/$(request.auth.uid)) &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Payments are restricted
    match /payments/{paymentId} {
      allow read: if request.auth != null &&
        (resource.data.userId == request.auth.uid ||
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null &&
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
`;

const storageRules = `
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
        exists(/databases/default/documents/users/$(request.auth.uid)) &&
        get(/databases/default/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
`;

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
          image: 'gcr.io/${project}/guild-api:latest',
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
  members: [serviceAccount.email.apply(email => `serviceAccount:${email}`)],
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
