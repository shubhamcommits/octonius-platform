// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import RDS constructs
import * as rds from 'aws-cdk-lib/aws-rds'

// Import VPC constructs
import * as ec2 from 'aws-cdk-lib/aws-ec2'

// Import Construct base class
import { Construct } from 'constructs'

// Define interface for DatabaseStack props
interface DatabaseStackProps extends cdk.StackProps {
    vpc: ec2.Vpc
}

// Define DatabaseStack class
export class DatabaseStack extends cdk.Stack {
    // Public property for the RDS instance
    public readonly instance: rds.DatabaseInstance

    // Constructor for the DatabaseStack
    constructor(scope: Construct, id: string, props: DatabaseStackProps) {
        super(scope, id, props)

        // Create security group for RDS
        const dbSecurityGroup = new ec2.SecurityGroup(this, 'octonius_db_sg', {
            vpc: props.vpc,
            description: 'Security group for Octonius RDS instance',
            allowAllOutbound: true
        })

        // Allow inbound PostgreSQL traffic from ECS tasks
        dbSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
            ec2.Port.tcp(5432),
            'Allow PostgreSQL access from within VPC'
        )

        // Create RDS instance
        this.instance = new rds.DatabaseInstance(this, 'octonius_db', {
            // Engine configuration
            engine: rds.DatabaseInstanceEngine.postgres({
                version: rds.PostgresEngineVersion.VER_15_3
            }),

            // Instance configuration
            instanceType: ec2.InstanceType.of(
                ec2.InstanceClass.T3,
                ec2.InstanceSize.MICRO
            ),

            // VPC configuration
            vpc: props.vpc,
            vpcSubnets: {
                subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS
            },

            // Security group
            securityGroups: [dbSecurityGroup],

            // Database configuration
            databaseName: 'octonius',
            credentials: rds.Credentials.fromGeneratedSecret('postgres'),

            // Storage configuration
            allocatedStorage: 20,
            storageType: rds.StorageType.GP2,

            // Backup configuration
            backupRetention: cdk.Duration.days(7),
            preferredBackupWindow: '03:00-04:00',
            preferredMaintenanceWindow: 'Mon:04:00-Mon:05:00',

            // High availability configuration
            multiAz: false,

            // Removal policy
            removalPolicy: cdk.RemovalPolicy.SNAPSHOT,

            // Performance Insights
            enablePerformanceInsights: true,
            performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,

            // Monitoring
            monitoringInterval: cdk.Duration.seconds(60),

            // Tags
            instanceIdentifier: 'octonius-db'
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => cdk.Tags.of(this.instance).add(key, value as string))
        }
    }
} 