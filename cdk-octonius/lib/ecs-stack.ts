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

        // Create ECR repository
        this.repository = new ecr.Repository(this, 'octonius_repo', {
            repositoryName: 'octonius',
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            imageScanOnPush: true,
            encryption: ecr.RepositoryEncryption.AES_256
        })

        // Create task execution role
        const taskExecutionRole = new iam.Role(this, 'octonius_task_execution_role', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
            managedPolicies: [
                iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy')
            ]
        })

        // Create task role
        const taskRole = new iam.Role(this, 'octonius_task_role', {
            assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com')
        })

        // Create task definition
        this.taskDefinition = new ecs.FargateTaskDefinition(this, 'octonius_task', {
            memoryLimitMiB: 1024,
            cpu: 512,
            executionRole: taskExecutionRole,
            taskRole: taskRole,
            family: 'octonius-task'
        })

        // Add container to task definition
        const container = this.taskDefinition.addContainer('octonius_container', {
            image: ecs.ContainerImage.fromEcrRepository(this.repository),
            logging: ecs.LogDrivers.awsLogs({
                streamPrefix: 'octonius',
                logRetention: cdk.aws_logs.RetentionDays.ONE_WEEK
            }),
            environment: {
                NODE_ENV: 'production',
                REGION: 'eu-central-1'
            },
            healthCheck: {
                command: ['CMD-SHELL', 'curl -f http://localhost:3000/health || exit 1'],
                interval: cdk.Duration.seconds(30),
                timeout: cdk.Duration.seconds(5),
                retries: 3,
                startPeriod: cdk.Duration.seconds(60)
            }
        })

        // Add port mappings
        container.addPortMappings({
            containerPort: 3000,
            protocol: ecs.Protocol.TCP
        })

        // Create Fargate service
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
            securityGroups: [
                new ec2.SecurityGroup(this, 'octonius_service_sg', {
                    vpc: props.vpc,
                    description: 'Security group for Octonius ECS service',
                    allowAllOutbound: true
                })
            ],
            circuitBreaker: { rollback: true },
            enableECSManagedTags: true,
            propagateTags: ecs.PropagatedTagSource.SERVICE
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => cdk.Tags.of(this.cluster).add(key, value as string))
        }
    }
} 