#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class AWSInfrastructureImplementer {
  constructor() {
    this.projectRoot = path.join(__dirname, '..');
    this.backendRoot = path.join(this.projectRoot, 'backend');
    this.infrastructureRoot = path.join(this.projectRoot, 'infrastructure');
    this.awsRoot = path.join(this.infrastructureRoot, 'aws');
  }

  async implement() {
    console.log('🏗️ Implementing advanced AWS infrastructure with CDK and STRICT rules...');

    try {
      // Step 1: Implement AWS CDK stacks
      console.log('☁️ Implementing AWS CDK stacks...');
      await this.implementAWSCDKStacks();

      // Step 2: Implement AWS Transit Gateway networking
      console.log('🌐 Implementing AWS Transit Gateway...');
      await this.implementAWSTransitGateway();

      // Step 3: Implement Buildah OCI containerization
      console.log('🐳 Implementing Buildah OCI...');
      await this.implementBuildahContainerization();

      // Step 4: Implement ECS Fargate orchestration
      console.log('⚙️ Implementing ECS Fargate...');
      await this.implementECSFargate();

      // Step 5: Implement AWS CodePipeline CI/CD
      console.log('🔄 Implementing AWS CodePipeline...');
      await this.implementAWSCodePipeline();

      console.log('✅ Advanced AWS infrastructure implementation completed!');

    } catch (error) {
      console.error('❌ Advanced AWS infrastructure implementation failed:', error.message);
      process.exit(1);
    }
  }

  async implementAWSCDKStacks() {
    // AWS CDK stacks implementation
    const cdkConfig = `
// AWS CDK Infrastructure as Code for Guild Platform
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudtrail from 'aws-cdk-lib/aws-cloudtrail';
import * as config from 'aws-cdk-lib/aws-config';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as cognito from 'aws-cdk-lib/aws-cognito';

export class GuildInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC with multiple availability zones
    const vpc = new ec2.Vpc(this, 'GuildVPC', {
      maxAzs: 3,
      natGateways: 3,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Security Groups
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc,
      description: 'Security group for ECS services',
      allowAllOutbound: true,
    });

    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RDSSecurityGroup', {
      vpc,
      description: 'Security group for RDS instances',
    });

    // Allow ALB to ECS
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(8080),
      'Allow HTTP from ALB'
    );

    // Allow ECS to RDS
    rdsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS'
    );

    // Secrets Manager for database credentials
    const dbSecret = new secretsmanager.Secret(this, 'DBSecret', {
      secretName: 'guild-db-credentials',
      description: 'Database credentials for Guild platform',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'guild_user',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludeCharacters: '@%*()_+=[]{}|\\\\',
      },
    });

    // Aurora PostgreSQL cluster
    const dbCluster = new rds.DatabaseCluster(this, 'GuildDB', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      instanceProps: {
        vpc,
        securityGroups: [rdsSecurityGroup],
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
      },
      instances: 2,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      storageEncrypted: true,
      storageEncryptionKey: new cdk.aws_kms.Key(this, 'DBEncryptionKey', {
        description: 'KMS key for database encryption',
      }),
      monitoringInterval: cdk.Duration.seconds(60),
      enablePerformanceInsights: true,
      parameterGroup: rds.ParameterGroup.fromParameterGroupName(
        this,
        'DBParameterGroup',
        'default.aurora-postgresql15'
      ),
    });

    // ElastiCache Redis cluster
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis cluster',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: 'guild-redis-subnet-group',
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'GuildRedis', {
      cacheClusterId: 'guild-redis-cluster',
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t3.medium',
      numCacheNodes: 2,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      vpcSecurityGroupIds: [ecsSecurityGroup.securityGroupId],
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
      snapshotRetentionPeriod: 7,
      snapshotWindow: '06:00-07:00',
      autoMinorVersionUpgrade: true,
    });

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'GuildECSCluster', {
      vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // ECR Repository
    const repository = new ecr.Repository(this, 'GuildECR', {
      repositoryName: 'guild-api',
      imageScanOnPush: true,
      encryption: ecr.RepositoryEncryption.AES256,
      lifecycleRules: [
        {
          description: 'Keep last 10 images',
          maxImageCount: 10,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    // Fargate Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'GuildAPITask', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: new cdk.aws_iam.Role(this, 'ExecutionRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
        ],
      }),
      taskRole: new cdk.aws_iam.Role(this, 'TaskRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonRDSFullAccess'),
          cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonElastiCacheFullAccess'),
        ],
      }),
    });

    // Container definition
    const container = taskDefinition.addContainer('GuildAPIContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: \`postgresql://\${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:\${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@\${dbCluster.clusterEndpoint.hostname}:\${dbCluster.clusterEndpoint.port}/guild\`,
        REDIS_URL: \`redis://\${redisCluster.attrRedisEndpointAddress}:6379\`,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'guild-api',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // ECS Service
    const service = new ecs.FargateService(this, 'GuildAPIService', {
      cluster,
      taskDefinition,
      desiredCount: 3,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      deploymentConfiguration: {
        minimumHealthyPercent: 50,
        maximumPercent: 200,
      },
    });

    // Auto Scaling
    const scaling = service.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 20,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'GuildALB', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'GuildTargetGroup', {
      vpc,
      port: 8080,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [service],
      healthCheck: {
        path: '/health',
        port: '8080',
        protocol: elbv2.Protocol.HTTP,
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 2,
      },
    });

    // ALB Listener
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // CloudFront Distribution
    const distribution = new cloudfront.Distribution(this, 'GuildCloudFront', {
      defaultBehavior: {
        origin: new cloudfront.origins.LoadBalancerV2Origin(alb, {
          protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: cloudfront.OriginRequestPolicy.ALL_VIEWER,
      },
      domainNames: ['api.guild.com'],
      certificate: cloudfront.ViewerCertificate.fromAcm('guild-cert', {
        domainName: 'api.guild.com',
        validation: cloudfront.CertificateValidation.fromDns(route53.PublicHostedZone.fromHostedZoneId(this, 'GuildHostedZone', 'Z123456789')),
      }),
      priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
      enabled: true,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
    });

    // Route 53 DNS
    const hostedZone = route53.PublicHostedZone.fromHostedZoneId(this, 'GuildHostedZone', 'Z123456789');

    new route53.ARecord(this, 'GuildAPIRecord', {
      zone: hostedZone,
      recordName: 'api.guild.com',
      target: route53.RecordTarget.fromAlias(new cdk.aws_route53_targets.CloudFrontTarget(distribution)),
    });

    // S3 Bucket for static assets
    const assetsBucket = new s3.Bucket(this, 'GuildAssetsBucket', {
      bucketName: 'guild-assets-\${cdk.Aws.ACCOUNT_ID}',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
      ],
      cors: [
        {
          allowedOrigins: ['https://app.guild.com', 'https://admin.guild.com'],
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedHeaders: ['*'],
          maxAge: 3000,
        },
      ],
    });

    // CloudTrail for audit logging
    const trail = new cloudtrail.Trail(this, 'GuildCloudTrail', {
      bucket: new s3.Bucket(this, 'CloudTrailBucket', {
        bucketName: 'guild-cloudtrail-\${cdk.Aws.ACCOUNT_ID}',
        encryption: s3.BucketEncryption.S3_MANAGED,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      }),
      encryptionEnabled: true,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableFileValidation: true,
      eventSelectors: [
        {
          readWriteType: cloudtrail.ReadWriteType.ALL,
          includeManagementEvents: true,
          includeDataEvents: true,
          dataResource: [
            {
              type: 'AWS::S3::Object',
              values: [\`\${assetsBucket.bucketArn}/*\`],
            },
          ],
        },
      ],
    });

    // AWS Config for compliance
    const configRule = new config.ManagedRule(this, 'GuildConfigRule', {
      identifier: 'ENCRYPTED_VOLUMES',
      description: 'Ensure all EBS volumes are encrypted',
      inputParameters: {
        encrypted: 'true',
      },
    });

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'GuildAlerts', {
      displayName: 'Guild Platform Alerts',
      topicName: 'guild-alerts',
    });

    // CloudWatch Alarms
    const cpuAlarm = new cdk.aws_cloudwatch.Alarm(this, 'CPUAlarm', {
      alarmName: 'Guild-API-High-CPU',
      metric: service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const memoryAlarm = new cdk.aws_cloudwatch.Alarm(this, 'MemoryAlarm', {
      alarmName: 'Guild-API-High-Memory',
      metric: service.metricMemoryUtilization(),
      threshold: 85,
      evaluationPeriods: 2,
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Add alarm actions
    cpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));
    memoryAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // Lambda function for data processing
    const dataProcessor = new lambda.Function(this, 'DataProcessor', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        DATABASE_URL: dbCluster.secret?.secretArn || '',
      },
      vpc,
      securityGroups: [ecsSecurityGroup],
      timeout: cdk.Duration.minutes(15),
      memorySize: 1024,
    });

    // EventBridge rule for scheduled tasks
    const scheduledRule = new events.Rule(this, 'ScheduledProcessing', {
      description: 'Scheduled data processing',
      schedule: events.Schedule.cron({
        hour: '2',
        minute: '0',
      }),
    });

    scheduledRule.addTarget(new targets.LambdaFunction(dataProcessor));

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'CloudFrontURL', {
      value: \`https://\${distribution.distributionDomainName}\`,
      description: 'CloudFront Distribution URL',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Database Cluster Endpoint',
    });
  }
}

// Additional stacks for different environments
export class GuildStagingStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Staging configuration with reduced resources
    const vpc = new ec2.Vpc(this, 'StagingVPC', {
      maxAzs: 2,
      natGateways: 1,
    });

    // Similar setup but with staging-specific configurations
    // Reduced instance sizes, single AZ, etc.
  }
}

// Multi-region disaster recovery stack
export class GuildDRStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, {
      ...props,
      env: {
        region: 'us-west-2', // Disaster recovery region
      },
    });

    // Read replica in DR region
    // Backup configurations
    // Failover mechanisms
  }
}

const app = new cdk.App();

// Create stacks for different environments
new GuildInfrastructureStack(app, 'GuildProduction', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

new GuildStagingStack(app, 'GuildStaging', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});

new GuildDRStack(app, 'GuildDisasterRecovery', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-west-2',
  },
});

app.synth();
`;

    // Create AWS directory structure
    const awsDir = path.join(this.infrastructureRoot, 'aws');
    if (!fs.existsSync(awsDir)) {
      fs.mkdirSync(awsDir, { recursive: true });
    }

    fs.writeFileSync(path.join(awsDir, 'lib', 'guild-infrastructure-stack.ts'), cdkConfig);

    // Create CDK configuration
    const cdkJson = {
      "app": "npx ts-node --prefer-ts-exts lib/guild-infrastructure-stack.ts",
      "watch": {
        "include": [
          "**"
        ],
        "exclude": [
          "README.md",
          "cdk*.json",
          "**/*.d.ts",
          "**/*.js",
          "node_modules",
          "dist"
        ]
      },
      "context": {
        "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
        "@aws-cdk/core:stackRelativeExports": true,
        "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
        "@aws-cdk/aws-lambda:recognizeVersionProps": true,
        "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
        "@aws-cdk/core:checkSecretUsage": true,
        "@aws-cdk/aws-iam:minimizePolicies": true,
        "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
        "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
        "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
        "@aws-cdk/aws-sns-subscriptions:restrictSnsSubscriptionEventSources": true
      }
    };

    fs.writeFileSync(path.join(awsDir, 'cdk.json'), JSON.stringify(cdkJson, null, 2));

    // Create package.json for CDK
    const cdkPackageJson = {
      "name": "guild-infrastructure",
      "version": "1.0.0",
      "description": "AWS CDK infrastructure for Guild platform",
      "scripts": {
        "build": "tsc",
        "watch": "tsc -w",
        "test": "jest",
        "cdk": "cdk",
        "deploy": "cdk deploy",
        "deploy:production": "cdk deploy GuildProduction",
        "deploy:staging": "cdk deploy GuildStaging",
        "deploy:dr": "cdk deploy GuildDisasterRecovery",
        "diff": "cdk diff",
        "synth": "cdk synth",
        "bootstrap": "cdk bootstrap"
      },
      "dependencies": {
        "aws-cdk-lib": "^2.100.0",
        "constructs": "^10.0.0",
        "@aws-cdk/aws-ec2": "^2.100.0",
        "@aws-cdk/aws-ecs": "^2.100.0",
        "@aws-cdk/aws-ecr": "^2.100.0",
        "@aws-cdk/aws-rds": "^2.100.0",
        "@aws-cdk/aws-elasticache": "^2.100.0",
        "@aws-cdk/aws-elasticloadbalancingv2": "^2.100.0",
        "@aws-cdk/aws-cloudfront": "^2.100.0",
        "@aws-cdk/aws-route53": "^2.100.0",
        "@aws-cdk/aws-s3": "^2.100.0",
        "@aws-cdk/aws-cloudtrail": "^2.100.0",
        "@aws-cdk/aws-config": "^2.100.0",
        "@aws-cdk/aws-secretsmanager": "^2.100.0",
        "@aws-cdk/aws-lambda": "^2.100.0",
        "@aws-cdk/aws-logs": "^2.100.0",
        "@aws-cdk/aws-sns": "^2.100.0",
        "@aws-cdk/aws-sqs": "^2.100.0",
        "@aws-cdk/aws-events": "^2.100.0",
        "@aws-cdk/aws-events-targets": "^2.100.0",
        "@aws-cdk/aws-wafv2": "^2.100.0",
        "@aws-cdk/aws-cognito": "^2.100.0"
      },
      "devDependencies": {
        "@types/node": "^20.0.0",
        "typescript": "^5.0.0",
        "aws-cdk": "^2.100.0",
        "ts-node": "^10.9.0",
        "jest": "^29.7.0"
      }
    };

    fs.writeFileSync(path.join(awsDir, 'package.json'), JSON.stringify(cdkPackageJson, null, 2));

    // Create TypeScript config
    const tsconfigJson = {
      "compilerOptions": {
        "target": "ES2020",
        "module": "commonjs",
        "lib": ["ES2020"],
        "outDir": "./dist",
        "rootDir": "./lib",
        "strict": true,
        "esModuleInterop": true,
        "skipLibCheck": true,
        "forceConsistentCasingInFileNames": true,
        "declaration": true,
        "declarationMap": true,
        "sourceMap": true,
        "removeComments": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "noImplicitThis": true,
        "noImplicitReturns": true,
        "noFallthroughCasesInSwitch": true,
        "moduleResolution": "node",
        "allowSyntheticDefaultImports": true,
        "experimentalDecorators": true,
        "emitDecoratorMetadata": true
      },
      "include": [
        "lib/**/*"
      ],
      "exclude": [
        "node_modules",
        "dist",
        "**/*.test.ts"
      ]
    };

    fs.writeFileSync(path.join(awsDir, 'tsconfig.json'), JSON.stringify(tsconfigJson, null, 2));
  }

  async implementAWSTransitGateway() {
    // AWS Transit Gateway networking implementation
    const transitGatewayConfig = `
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
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'aws', 'lib', 'transit-gateway-stack.ts'), transitGatewayConfig);
  }

  async implementBuildahContainerization() {
    // Buildah OCI containerization implementation
    const buildahConfig = `
// Buildah OCI Containerization for Secure Builds
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as efs from 'aws-cdk-lib/aws-efs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class GuildBuildahStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for build environment
    const vpc = new ec2.Vpc(this, 'BuildVPC', {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Security Group for Buildah instances
    const buildahSecurityGroup = new ec2.SecurityGroup(this, 'BuildahSecurityGroup', {
      vpc,
      description: 'Security group for Buildah build instances',
      allowAllOutbound: true,
    });

    // Allow SSH access from bastion
    buildahSecurityGroup.addIngressRule(
      ec2.Peer.ipv4('10.0.0.0/8'),
      ec2.Port.tcp(22),
      'Allow SSH from VPC'
    );

    // EFS for shared build cache
    const fileSystem = new efs.FileSystem(this, 'BuildCacheEFS', {
      vpc,
      encrypted: true,
      performanceMode: efs.PerformanceMode.GENERAL_PURPOSE,
      throughputMode: efs.ThroughputMode.BURSTING,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Mount target for EFS
    const mountTarget = new efs.AccessPoint(this, 'BuildCacheAccessPoint', {
      fileSystem,
      posixUser: {
        uid: '1000',
        gid: '1000',
      },
      path: '/cache',
      createAcl: {
        ownerUid: '1000',
        ownerGid: '1000',
        permissions: '755',
      },
    });

    // ECR Repository for build artifacts
    const buildRepository = new ecr.Repository(this, 'GuildBuildRepo', {
      repositoryName: 'guild-build-artifacts',
      imageScanOnPush: true,
      encryption: ecr.RepositoryEncryption.AES256,
      lifecycleRules: [
        {
          description: 'Keep last 50 build artifacts',
          maxImageCount: 50,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    // IAM Role for Buildah instances
    const buildahRole = new iam.Role(this, 'BuildahInstanceRole', {
      assumedBy: new iam.ServicePrincipal('ec2.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonEC2ReadOnlyAccess'),
        iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonS3ReadOnlyAccess'),
      ],
      inlinePolicies: {
        'BuildahPolicy': new iam.PolicyDocument({
          statements: [
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'ecr:GetAuthorizationToken',
                'ecr:BatchCheckLayerAvailability',
                'ecr:GetDownloadUrlForLayer',
                'ecr:BatchGetImage',
                'ecr:InitiateLayerUpload',
                'ecr:UploadLayerPart',
                'ecr:CompleteLayerUpload',
                'ecr:PutImage',
              ],
              resources: [buildRepository.repositoryArn],
            }),
            new iam.PolicyStatement({
              effect: iam.Effect.ALLOW,
              actions: [
                'efs:ClientMount',
                'efs:ClientWrite',
              ],
              resources: [fileSystem.fileSystemArn],
            }),
          ],
        }),
      },
    });

    // EC2 Launch Template for Buildah instances
    const launchTemplate = new ec2.LaunchTemplate(this, 'BuildahLaunchTemplate', {
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.C5, ec2.InstanceSize.LARGE),
      machineImage: ec2.MachineImage.latestAmazonLinux2(),
      securityGroup: buildahSecurityGroup,
      role: buildahRole,
      blockDevices: [
        {
          deviceName: '/dev/sda1',
          volume: ec2.BlockDeviceVolume.ebs(100, {
            volumeType: ec2.EbsDeviceVolumeType.GP3,
            encrypted: true,
            deleteOnTermination: true,
          }),
        },
      ],
      userData: ec2.UserData.custom(\`
#!/bin/bash
# Install Buildah and dependencies
yum update -y
yum install -y buildah podman

# Configure Buildah for rootless operation
usermod -a -G rootless ec2-user

# Create build cache directory
mkdir -p /home/ec2-user/.local/share/containers
chown -R ec2-user:ec2-user /home/ec2-user/.local

# Mount EFS for shared cache
mkdir -p /cache
mount -t efs \${fileSystem.fileSystemId}:/ /cache
echo "\${fileSystem.fileSystemId}:/ /cache efs defaults,_netdev 0 0" >> /etc/fstab

# Configure registries
mkdir -p /etc/containers
cat > /etc/containers/registries.conf << EOF
[registries.search]
registries = ['registry.access.redhat.com', 'registry.redhat.io', 'docker.io', 'quay.io']

[registries.insecure]
registries = []

[registries.block]
registries = []
EOF

# Start Buildah service
systemctl enable --now buildah
\`),
    });

    // Auto Scaling Group for build capacity
    const autoScalingGroup = new ec2.AutoScalingGroup(this, 'BuildahASG', {
      vpc,
      launchTemplate,
      minCapacity: 0,
      maxCapacity: 5,
      desiredCapacity: 1,
      cooldown: cdk.Duration.minutes(5),
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      signals: ec2.Signals.waitForAll({
        timeout: cdk.Duration.minutes(10),
      }),
    });

    // Scale based on SQS queue length
    const buildQueue = new cdk.aws_sqs.Queue(this, 'BuildQueue', {
      visibilityTimeout: cdk.Duration.minutes(15),
      retentionPeriod: cdk.Duration.days(7),
      encryption: cdk.aws_sqs.QueueEncryption.SQS_MANAGED,
    });

    autoScalingGroup.scaleOnSchedule('ScaleUpMorning', {
      schedule: cdk.aws_autoscaling.Schedule.cron({
        hour: '8',
        minute: '0',
      }),
      minCapacity: 2,
    });

    autoScalingGroup.scaleOnSchedule('ScaleDownNight', {
      schedule: cdk.aws_autoscaling.Schedule.cron({
        hour: '20',
        minute: '0',
      }),
      maxCapacity: 0,
    });

    // Lambda function for triggering builds
    const buildTrigger = new lambda.Function(this, 'BuildTrigger', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/build-trigger')),
      environment: {
        BUILD_QUEUE_URL: buildQueue.queueUrl,
        ECR_REPOSITORY_URI: buildRepository.repositoryUri,
      },
      timeout: cdk.Duration.minutes(5),
      memorySize: 512,
    });

    buildQueue.grantSendMessages(buildTrigger);

    // EventBridge rule for Git pushes
    const gitPushRule = new events.Rule(this, 'GitPushRule', {
      description: 'Trigger build on Git push',
      eventPattern: {
        source: ['aws.codecommit'],
        detailType: ['CodeCommit Repository State Change'],
        detail: {
          eventName: ['Push'],
          referenceType: ['branch'],
          referenceName: ['main', 'develop'],
        },
      },
    });

    gitPushRule.addTarget(new targets.LambdaFunction(buildTrigger));

    // CloudWatch Logs for build monitoring
    const buildLogs = new cdk.aws_logs.LogGroup(this, 'BuildLogs', {
      logGroupName: '/aws/lambda/guild-build-trigger',
      retention: cdk.aws_logs.RetentionDays.ONE_MONTH,
      encryptionKey: new cdk.aws_kms.Key(this, 'BuildLogsKey', {
        description: 'KMS key for build logs encryption',
      }),
    });

    // Outputs
    new cdk.CfnOutput(this, 'BuildQueueURL', {
      value: buildQueue.queueUrl,
      description: 'SQS Queue URL for build triggers',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: buildRepository.repositoryUri,
      description: 'ECR Repository URI for build artifacts',
    });

    new cdk.CfnOutput(this, 'BuildLogsGroup', {
      value: buildLogs.logGroupName,
      description: 'CloudWatch Log Group for build logs',
    });
  }
}
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'aws', 'lib', 'buildah-stack.ts'), buildahConfig);
  }

  async implementECSFargate() {
    // ECS Fargate orchestration implementation
    const ecsConfig = `
// ECS Fargate Orchestration for Serverless Container Deployment
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';

export class GuildECSFargateStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // VPC for Fargate services
    const vpc = new ec2.Vpc(this, 'FargateVPC', {
      maxAzs: 3,
      natGateways: 3,
    });

    // ECS Cluster with Fargate capacity providers
    const cluster = new ecs.Cluster(this, 'GuildFargateCluster', {
      vpc,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // ECR Repository for application images
    const repository = new ecr.Repository(this, 'GuildAppRepository', {
      repositoryName: 'guild-app',
      imageScanOnPush: true,
      encryption: ecr.RepositoryEncryption.AES256,
      lifecycleRules: [
        {
          description: 'Keep last 20 images',
          maxImageCount: 20,
          tagStatus: ecr.TagStatus.ANY,
        },
      ],
    });

    // Secrets for database credentials
    const dbSecret = new secretsmanager.Secret(this, 'AppDBSecret', {
      secretName: 'guild-app-db-credentials',
      description: 'Database credentials for Guild application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'guild_app_user',
        }),
        generateStringKey: 'password',
        passwordLength: 32,
      },
    });

    // Aurora PostgreSQL for application data
    const dbCluster = new rds.DatabaseCluster(this, 'GuildAppDB', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromSecret(dbSecret),
      instanceProps: {
        vpc,
        instanceType: ec2.InstanceType.of(ec2.InstanceClass.R6G, ec2.InstanceSize.LARGE),
      },
      instances: 2,
      backup: {
        retention: cdk.Duration.days(7),
      },
      storageEncrypted: true,
    });

    // ElastiCache Redis for session storage
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'AppRedisSubnetGroup', {
      description: 'Subnet group for application Redis',
      subnetIds: vpc.privateSubnets.map(subnet => subnet.subnetId),
    });

    const redisCluster = new elasticache.CfnCacheCluster(this, 'GuildAppRedis', {
      cacheClusterId: 'guild-app-redis',
      engine: 'redis',
      engineVersion: '7.0',
      cacheNodeType: 'cache.t3.medium',
      numCacheNodes: 2,
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
    });

    // Fargate Task Definition for API service
    const apiTaskDefinition = new ecs.FargateTaskDefinition(this, 'GuildAPITaskDef', {
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: new cdk.aws_iam.Role(this, 'APIExecutionRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }),
      taskRole: new cdk.aws_iam.Role(this, 'APITaskRole', {
        assumedBy: new cdk.aws_iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      }),
    });

    // API Container
    const apiContainer = apiTaskDefinition.addContainer('GuildAPIContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'api'),
      environment: {
        NODE_ENV: 'production',
        PORT: '8080',
        DATABASE_URL: \`postgresql://\${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:\${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@\${dbCluster.clusterEndpoint.hostname}:\${dbCluster.clusterEndpoint.port}/guild_app\`,
        REDIS_URL: \`redis://\${redisCluster.attrRedisEndpointAddress}:6379\`,
      },
      secrets: {
        DATABASE_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'guild-api',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    apiContainer.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // Fargate Task Definition for worker service
    const workerTaskDefinition = new ecs.FargateTaskDefinition(this, 'GuildWorkerTaskDef', {
      memoryLimitMiB: 1024,
      cpu: 512,
    });

    // Worker Container
    const workerContainer = workerTaskDefinition.addContainer('GuildWorkerContainer', {
      image: ecs.ContainerImage.fromEcrRepository(repository, 'worker'),
      environment: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'background',
        DATABASE_URL: \`postgresql://\${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:\${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@\${dbCluster.clusterEndpoint.hostname}:\${dbCluster.clusterEndpoint.port}/guild_app\`,
        REDIS_URL: \`redis://\${redisCluster.attrRedisEndpointAddress}:6379\`,
      },
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'guild-worker',
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
    });

    // ECS Services
    const apiService = new ecs.FargateService(this, 'GuildAPIService', {
      cluster,
      taskDefinition: apiTaskDefinition,
      desiredCount: 3,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      deploymentConfiguration: {
        minimumHealthyPercent: 50,
        maximumPercent: 200,
      },
    });

    const workerService = new ecs.FargateService(this, 'GuildWorkerService', {
      cluster,
      taskDefinition: workerTaskDefinition,
      desiredCount: 2,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      assignPublicIp: false,
    });

    // Auto Scaling for API service
    const apiScaling = apiService.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 20,
    });

    apiScaling.scaleOnCpuUtilization('ApiCpuScaling', {
      targetUtilizationPercent: 70,
    });

    apiScaling.scaleOnMemoryUtilization('ApiMemoryScaling', {
      targetUtilizationPercent: 80,
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'GuildAppALB', {
      vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // ALB Listener and Target Group
    const listener = alb.addListener('HTTPListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: elbv2.ApplicationProtocol.HTTPS,
        permanent: true,
      }),
    });

    const httpsListener = alb.addListener('HTTPSListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTPS,
      certificates: [elbv2.ListenerCertificate.fromArn('arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012')],
      defaultTargetGroups: [new elbv2.ApplicationTargetGroup(this, 'APITargetGroup', {
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targets: [apiService],
        healthCheck: {
          path: '/health',
          port: '8080',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 2,
        },
      })],
    });

    // CloudWatch Alarms for monitoring
    const cpuAlarm = new cdk.aws_cloudwatch.Alarm(this, 'APIHighCPU', {
      alarmName: 'Guild-API-High-CPU-Utilization',
      metric: apiService.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    const memoryAlarm = new cdk.aws_cloudwatch.Alarm(this, 'APIHighMemory', {
      alarmName: 'Guild-API-High-Memory-Utilization',
      metric: apiService.metricMemoryUtilization(),
      threshold: 85,
      evaluationPeriods: 2,
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
    });

    new cdk.CfnOutput(this, 'ECSClusterName', {
      value: cluster.clusterName,
      description: 'ECS Cluster Name',
    });

    new cdk.CfnOutput(this, 'ECRRepositoryURI', {
      value: repository.repositoryUri,
      description: 'ECR Repository URI',
    });
  }
}
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'aws', 'lib', 'ecs-fargate-stack.ts'), ecsConfig);
  }

  async implementAWSCodePipeline() {
    // AWS CodePipeline CI/CD implementation
    const codePipelineConfig = `
// AWS CodePipeline for Multi-Stage Deployment
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codedeploy from 'aws-cdk-lib/aws-codedeploy';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';

export class GuildCodePipelineStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, 'PipelineArtifacts', {
      bucketName: 'guild-pipeline-artifacts-\${cdk.Aws.ACCOUNT_ID}',
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'DeleteOldArtifacts',
          enabled: true,
          expiration: cdk.Duration.days(30),
        },
      ],
    });

    // CodeCommit repository (or GitHub/CodeStar)
    const repository = new codecommit.Repository(this, 'GuildRepository', {
      repositoryName: 'guild-platform',
      description: 'Source code repository for Guild platform',
    });

    // SNS topic for pipeline notifications
    const pipelineNotifications = new sns.Topic(this, 'PipelineNotifications', {
      displayName: 'Guild Pipeline Notifications',
      topicName: 'guild-pipeline-notifications',
    });

    // Build project for source code
    const sourceBuild = new codebuild.Project(this, 'SourceBuild', {
      projectName: 'guild-source-build',
      source: codebuild.Source.codeCommit({
        repository,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.LARGE,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm ci',
              'npm install -g typescript',
            ],
          },
          pre_build: {
            commands: [
              'npm run lint',
              'npm run type-check',
              'npm run test',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm run build:docker',
            ],
          },
          post_build: {
            commands: [
              'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin \${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com',
              'docker tag guild-api:latest \${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/guild-api:\${CODEBUILD_RESOLVED_SOURCE_VERSION}',
              'docker push \${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/guild-api:\${CODEBUILD_RESOLVED_SOURCE_VERSION}',
            ],
          },
        },
        artifacts: {
          files: [
            'appspec.yml',
            'scripts/**/*',
            'infrastructure/**/*',
          ],
          'discard-paths': false,
        },
        cache: {
          type: 'S3',
          location: artifactBucket.bucketName + '/cache',
        },
      }),
      cache: codebuild.Cache.bucket(artifactBucket),
      artifacts: codebuild.Artifacts.s3({
        bucket: artifactBucket,
        includeBuildId: true,
        packageZip: false,
      }),
    });

    // Build project for testing
    const testBuild = new codebuild.Project(this, 'TestBuild', {
      projectName: 'guild-test-build',
      source: codebuild.Source.s3({
        bucket: artifactBucket,
        key: sourceBuild.artifacts!.s3Location!.objectKey,
      }),
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        computeType: codebuild.ComputeType.LARGE,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm ci',
            ],
          },
          pre_build: {
            commands: [
              'npm run test:ci',
              'npm run test:e2e',
              'npm run test:load',
            ],
          },
        },
      }),
    });

    // CodeDeploy application for blue-green deployments
    const application = new codedeploy.LambdaApplication(this, 'GuildApp', {
      applicationName: 'guild-application',
    });

    // Deployment group for ECS
    const deploymentGroup = new codedeploy.EcsDeploymentGroup(this, 'GuildDeploymentGroup', {
      application,
      deploymentGroupName: 'guild-ecs-deployment-group',
      service: 'guild-api-service', // Reference to ECS service
      blueGreenDeploymentConfig: {
        blueTargetGroup: 'blue-target-group',
        greenTargetGroup: 'green-target-group',
        listener: 'alb-listener',
        terminationWaitTime: cdk.Duration.minutes(5),
      },
      deploymentConfig: codedeploy.EcsDeploymentConfig.ALL_AT_ONCE,
    });

    // Main pipeline
    const pipeline = new codepipeline.Pipeline(this, 'GuildPipeline', {
      pipelineName: 'guild-platform-pipeline',
      artifactBucket,
      stages: [
        {
          stageName: 'Source',
          actions: [
            new codepipeline_actions.CodeCommitSourceAction({
              actionName: 'Source',
              repository,
              branch: 'main',
              output: new codepipeline.Artifact('SourceArtifact'),
            }),
          ],
        },
        {
          stageName: 'Build',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Build',
              project: sourceBuild,
              input: new codepipeline.Artifact('SourceArtifact'),
              outputs: [
                new codepipeline.Artifact('BuildArtifact'),
              ],
            }),
          ],
        },
        {
          stageName: 'Test',
          actions: [
            new codepipeline_actions.CodeBuildAction({
              actionName: 'Test',
              project: testBuild,
              input: new codepipeline.Artifact('BuildArtifact'),
            }),
          ],
        },
        {
          stageName: 'Deploy_Staging',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'DeployToStaging',
              service: 'guild-staging-service', // Reference to staging ECS service
              input: new codepipeline.Artifact('BuildArtifact'),
            }),
          ],
        },
        {
          stageName: 'Approval',
          actions: [
            new codepipeline_actions.ManualApprovalAction({
              actionName: 'ApproveProduction',
              notificationTopic: pipelineNotifications,
              additionalInformation: 'Approve deployment to production?',
              externalEntityLink: 'https://console.aws.amazon.com/codesuite/codepipeline/pipelines/guild-platform-pipeline/view',
            }),
          ],
        },
        {
          stageName: 'Deploy_Production',
          actions: [
            new codepipeline_actions.EcsDeployAction({
              actionName: 'DeployToProduction',
              service: 'guild-production-service', // Reference to production ECS service
              input: new codepipeline.Artifact('BuildArtifact'),
            }),
          ],
        },
      ],
      notificationRule: new cdk.aws_codestarnotifications.NotificationRule(this, 'PipelineNotifications', {
        source: pipeline,
        events: [
          'codepipeline-pipeline-pipeline-execution-failed',
          'codepipeline-pipeline-pipeline-execution-succeeded',
          'codepipeline-pipeline-manual-approval-needed',
        ],
        targets: [new cdk.aws_codestarnotifications.SnsTopic(pipelineNotifications)],
      }),
    });

    // Lambda function for custom pipeline actions
    const pipelineWebhook = new lambda.Function(this, 'PipelineWebhook', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda/pipeline-webhook')),
      environment: {
        PIPELINE_NAME: pipeline.pipelineName,
        NOTIFICATION_TOPIC_ARN: pipelineNotifications.topicArn,
      },
      timeout: cdk.Duration.minutes(5),
    });

    // EventBridge rule for pipeline events
    const pipelineRule = new events.Rule(this, 'PipelineEventRule', {
      description: 'Handle pipeline events',
      eventPattern: {
        source: ['aws.codepipeline'],
        detailType: ['CodePipeline Pipeline Execution State Change'],
        detail: {
          state: ['SUCCEEDED', 'FAILED'],
        },
      },
    });

    pipelineRule.addTarget(new targets.LambdaFunction(pipelineWebhook));

    // Outputs
    new cdk.CfnOutput(this, 'PipelineName', {
      value: pipeline.pipelineName,
      description: 'CodePipeline Name',
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: artifactBucket.bucketName,
      description: 'S3 Bucket for Pipeline Artifacts',
    });

    new cdk.CfnOutput(this, 'NotificationTopicArn', {
      value: pipelineNotifications.topicArn,
      description: 'SNS Topic ARN for Notifications',
    });
  }
}
`;

    fs.writeFileSync(path.join(this.infrastructureRoot, 'aws', 'lib', 'codepipeline-stack.ts'), codePipelineConfig);
  }
}

// Run the implementer if called directly
if (require.main === module) {
  const implementer = new AWSInfrastructureImplementer();
  implementer.implement()
    .then(() => {
      console.log('🎉 Advanced AWS infrastructure implementation completed!');
    })
    .catch(error => {
      console.error('❌ Implementation failed:', error);
      process.exit(1);
    });
}

module.exports = AWSInfrastructureImplementer;







