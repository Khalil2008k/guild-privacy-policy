
// AWS Transit Gateway for Multi-VPC Connectivity
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';

export class GuildTransitGatewayStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Transit Gateway
    const transitGateway = new ec2.CfnTransitGateway(this, 'GuildTransitGateway', {
      description: 'Transit Gateway for Guild platform multi-region connectivity',
      defaultRouteTableAssociation: 'enable',
      defaultRouteTablePropagation: 'enable',
      dnsSupport: 'enable',
      vpnEcmpSupport: 'enable',
      autoAcceptSharedAttachments: 'disable',
      tags: [
        {
          key: 'Name',
          value: 'guild-transit-gateway',
        },
        {
          key: 'Environment',
          value: 'production',
        },
      ],
    });

    // Transit Gateway Route Tables
    const productionRouteTable = new ec2.CfnTransitGatewayRouteTable(this, 'ProductionRouteTable', {
      transitGatewayId: transitGateway.ref,
    });

    const stagingRouteTable = new ec2.CfnTransitGatewayRouteTable(this, 'StagingRouteTable', {
      transitGatewayId: transitGateway.ref,
    });

    // VPC Attachments
    const productionAttachment = new ec2.CfnTransitGatewayVpcAttachment(this, 'ProductionVPCAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: 'vpc-production-id', // Reference to production VPC
      subnetIds: [
        'subnet-production-private1',
        'subnet-production-private2',
        'subnet-production-private3',
      ],
      transitGatewayDefaultRouteTableAssociation: true,
      transitGatewayDefaultRouteTablePropagation: true,
    });

    const stagingAttachment = new ec2.CfnTransitGatewayVpcAttachment(this, 'StagingVPCAttachment', {
      transitGatewayId: transitGateway.ref,
      vpcId: 'vpc-staging-id', // Reference to staging VPC
      subnetIds: [
        'subnet-staging-private1',
        'subnet-staging-private2',
      ],
      transitGatewayDefaultRouteTableAssociation: false,
      transitGatewayDefaultRouteTablePropagation: false,
    });

    // Associate staging VPC with staging route table
    new ec2.CfnTransitGatewayRouteTableAssociation(this, 'StagingRouteTableAssociation', {
      transitGatewayAttachmentId: stagingAttachment.ref,
      transitGatewayRouteTableId: stagingRouteTable.ref,
    });

    new ec2.CfnTransitGatewayRouteTablePropagation(this, 'StagingRouteTablePropagation', {
      transitGatewayAttachmentId: stagingAttachment.ref,
      transitGatewayRouteTableId: stagingRouteTable.ref,
    });

    // Transit Gateway Routes
    new ec2.CfnTransitGatewayRoute(this, 'ProductionToStagingRoute', {
      transitGatewayRouteTableId: productionRouteTable.ref,
      destinationCidrBlock: '10.1.0.0/16', // Staging VPC CIDR
      transitGatewayAttachmentId: stagingAttachment.ref,
    });

    new ec2.CfnTransitGatewayRoute(this, 'StagingToProductionRoute', {
      transitGatewayRouteTableId: stagingRouteTable.ref,
      destinationCidrBlock: '10.0.0.0/16', // Production VPC CIDR
      transitGatewayAttachmentId: productionAttachment.ref,
    });

    // Site-to-Site VPN Connection
    const customerGateway = new ec2.CfnCustomerGateway(this, 'GuildCustomerGateway', {
      bgpAsn: 65000,
      publicIp: '203.0.113.1', // Customer gateway IP
      type: 'ipsec.1',
    });

    const vpnConnection = new ec2.CfnVPNConnection(this, 'GuildVPNConnection', {
      customerGatewayId: customerGateway.ref,
      transitGatewayId: transitGateway.ref,
      type: 'ipsec.1',
      staticRoutesOnly: false,
      options: {
        tunnelOptions: [
          {
            tunnelInsideCidr: '169.254.10.0/30',
          },
          {
            tunnelInsideCidr: '169.254.11.0/30',
          },
        ],
      },
    });

    // Network ACL for Transit Gateway subnets
    const transitGatewayNetworkAcl = new ec2.NetworkAcl(this, 'TransitGatewayACL', {
      vpc: 'vpc-production', // Reference to VPC
      subnetSelection: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Allow all traffic within VPC
    transitGatewayNetworkAcl.addEntry('AllowInternal', {
      cidr: ec2.AclCidr.ipv4('10.0.0.0/8'),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleNumber: 100,
    });

    // Deny all other traffic
    transitGatewayNetworkAcl.addEntry('DenyExternal', {
      cidr: ec2.AclCidr.anyIpv4(),
      traffic: ec2.AclTraffic.allTraffic(),
      ruleNumber: 200,
      direction: ec2.TrafficDirection.EGRESS,
    });

    // Route 53 Resolver for hybrid DNS
    const resolverEndpoint = new ec2.CfnResolverEndpoint(this, 'GuildResolverEndpoint', {
      direction: 'INBOUND',
      ipAddresses: [
        {
          subnetId: 'subnet-production-private1',
        },
        {
          subnetId: 'subnet-production-private2',
        },
      ],
      protocols: ['Do53', 'DoH'],
      resolverEndpointType: 'INBOUND',
      securityGroupIds: ['sg-transit-gateway'],
    });

    // Outputs
    new cdk.CfnOutput(this, 'TransitGatewayId', {
      value: transitGateway.ref,
      description: 'Transit Gateway ID',
    });

    new cdk.CfnOutput(this, 'ProductionRouteTableId', {
      value: productionRouteTable.ref,
      description: 'Production Route Table ID',
    });

    new cdk.CfnOutput(this, 'StagingRouteTableId', {
      value: stagingRouteTable.ref,
      description: 'Staging Route Table ID',
    });
  }
}
