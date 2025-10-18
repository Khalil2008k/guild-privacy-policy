
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
  parent: `organizations/${project}`,
  title: 'Guild Service Perimeter',
  perimeterType: 'PERIMETER_TYPE_REGULAR',
  status: {
    resources: [
      `projects/${project}`,
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
