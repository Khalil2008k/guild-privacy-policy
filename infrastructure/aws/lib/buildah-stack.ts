
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
      userData: ec2.UserData.custom(`
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
mount -t efs ${fileSystem.fileSystemId}:/ /cache
echo "${fileSystem.fileSystemId}:/ /cache efs defaults,_netdev 0 0" >> /etc/fstab

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
`),
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
