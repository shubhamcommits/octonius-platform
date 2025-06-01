// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import ECS constructs
import * as ecs from 'aws-cdk-lib/aws-ecs'

// Import ECR constructs
import * as ecr from 'aws-cdk-lib/aws-ecr'

// Import VPC constructs
import * as ec2 from 'aws-cdk-lib/aws-ec2'

// Import IAM constructs
import * as iam from 'aws-cdk-lib/aws-iam'

// Import Construct base class
import { Construct } from 'constructs'

// Define interface for EcsStack props
interface EcsStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
    tags?: Record<string, string>
}

// Define EcsStack class
export class EcsStack extends cdk.Stack {
    // Public properties for ECS resources
    public readonly cluster: ecs.Cluster
    public readonly repository: ecr.Repository
    public readonly taskDefinition: ecs.FargateTaskDefinition
    public readonly service: ecs.FargateService

    // Constructor for the EcsStack
    constructor(scope: Construct, id: string, props: EcsStackProps) {
        super(scope, id, props)

        // Create ECS cluster
        this.cluster = new ecs.Cluster(this, 'octonius_cluster', {
            vpc: props.vpc,
            clusterName: 'octonius-cluster',
            containerInsights: true
        })

        // Create ECR repository with enhanced security
        this.repository = new ecr.Repository(this, 'octonius_repo', {
            repositoryName: 'octonius',
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            imageScanOnPush: true,
            encryption: ecr.RepositoryEncryption.KMS,
            imageTagMutability: ecr.TagMutability.IMMUTABLE,
            lifecycleRules: [
                {
                    maxImageCount: 100,
                    rulePriority: 1,
                    description: 'Keep only 100 images'
                },
                {
                    maxImageAge: cdk.Duration.days(30),
                    rulePriority: 2,
                    description: 'Remove images older than 30 days'
                }
            ]
        })

        // Add image scanning policy
        const scanningPolicy = new ecr.CfnRegistryPolicy(this, 'octonius_scanning_policy', {
            policyText: JSON.stringify({
                rules: [
                    {
                        rulePriority: 1,
                        description: 'Scan all images on push',
                        selection: {
                            tagStatus: 'tagged',
                            tagPrefixList: ['prod', 'staging', 'dev'],
                            repositoryNames: [this.repository.repositoryName]
                        },
                        action: {
                            type: 'SCAN'
                        }
                    }
                ]
            })
        })

        // Create task execution role with enhanced permissions
        const taskExecutionRole = new iam.Role(this, 'octonius_task_execution_role', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
            ]
        })

        // Add permissions for Secrets Manager
        taskExecutionRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                'secretsmanager:GetSecretValue',
                'secretsmanager:DescribeSecret'
            ],
            resources: [
                `arn:aws:secretsmanager:${this.region}:${this.account}:secret:octonius-*`
            ]
        }))

        // Create task role with least privilege
        const taskRole = new iam.Role(this, 'octonius_task_role', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        })

        // Add specific permissions needed by the application
        taskRole.addToPolicy(new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
                's3:GetObject',
                's3:PutObject',
                's3:ListBucket'
            ],
            resources: [
                `arn:aws:s3:::octonius-*/*`,
                `arn:aws:s3:::octonius-*`
            ]
        }))

        // Create task definition
        this.taskDefinition = new ecs.FargateTaskDefinition(this, 'octonius_task', {
            memoryLimitMiB: 1024,
            cpu: 512,
            executionRole: taskExecutionRole,
            taskRole: taskRole,
            family: 'octonius-task'
        })

        // Create security group for ECS service
        const serviceSecurityGroup = new ec2.SecurityGroup(this, 'octonius_service_sg', {
            vpc: props.vpc,
            description: 'Security group for Octonius ECS service',
            allowAllOutbound: false
        })

        // Allow HTTPS outbound
        serviceSecurityGroup.addEgressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(443),
            'Allow HTTPS outbound'
        )

        // Allow HTTP outbound for package downloads
        serviceSecurityGroup.addEgressRule(
            ec2.Peer.anyIpv4(),
            ec2.Port.tcp(80),
            'Allow HTTP outbound'
        )

        // Allow inbound from ALB
        serviceSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
            ec2.Port.tcp(3000),
            'Allow inbound from ALB'
        )

        // Create Fargate service with enhanced security
        this.service = new ecs.FargateService(this, 'octonius_service', {
            cluster: this.cluster,
            taskDefinition: this.taskDefinition,
            desiredCount: 2,
            minHealthyPercent: 50,
            maxHealthyPercent: 200,
            assignPublicIp: false,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },
            securityGroups: [serviceSecurityGroup],
            circuitBreaker: { rollback: true },
            enableECSManagedTags: true,
            propagateTags: ecs.PropagatedTagSource.SERVICE,
            enableExecuteCommand: false,
            platformVersion: ecs.FargatePlatformVersion.LATEST
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                cdk.Tags.of(this.cluster).add(key, value as string)
                cdk.Tags.of(this.repository).add(key, value as string)
                cdk.Tags.of(this.service).add(key, value as string)
            })
        }
    }
} 