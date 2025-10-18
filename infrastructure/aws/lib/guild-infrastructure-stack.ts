
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
        excludeCharacters: '@%*()_+=[]{}|\\',
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
        DATABASE_URL: `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${dbCluster.clusterEndpoint.hostname}:${dbCluster.clusterEndpoint.port}/guild`,
        REDIS_URL: `redis://${redisCluster.attrRedisEndpointAddress}:6379`,
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
      bucketName: 'guild-assets-${cdk.Aws.ACCOUNT_ID}',
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
        bucketName: 'guild-cloudtrail-${cdk.Aws.ACCOUNT_ID}',
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
              values: [`${assetsBucket.bucketArn}/*`],
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
      value: `https://${distribution.distributionDomainName}`,
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
