
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
        DATABASE_URL: `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${dbCluster.clusterEndpoint.hostname}:${dbCluster.clusterEndpoint.port}/guild_app`,
        REDIS_URL: `redis://${redisCluster.attrRedisEndpointAddress}:6379`,
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
        DATABASE_URL: `postgresql://${dbSecret.secretValueFromJson('username').unsafeUnwrap()}:${dbSecret.secretValueFromJson('password').unsafeUnwrap()}@${dbCluster.clusterEndpoint.hostname}:${dbCluster.clusterEndpoint.port}/guild_app`,
        REDIS_URL: `redis://${redisCluster.attrRedisEndpointAddress}:6379`,
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
