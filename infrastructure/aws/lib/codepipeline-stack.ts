
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
      bucketName: 'guild-pipeline-artifacts-${cdk.Aws.ACCOUNT_ID}',
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
              'aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com',
              'docker tag guild-api:latest ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/guild-api:${CODEBUILD_RESOLVED_SOURCE_VERSION}',
              'docker push ${AWS_ACCOUNT_ID}.dkr.ecr.us-east-1.amazonaws.com/guild-api:${CODEBUILD_RESOLVED_SOURCE_VERSION}',
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
