// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import RDS constructs
import * as rds from 'aws-cdk-lib/aws-rds'

// Import VPC constructs
import * as ec2 from 'aws-cdk-lib/aws-ec2'

// Import KMS constructs
import * as kms from 'aws-cdk-lib/aws-kms'

// Import Backup constructs
import * as backup from 'aws-cdk-lib/aws-backup'
import { Schedule } from 'aws-cdk-lib/aws-events'

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
            allowAllOutbound: false
        })

        // Allow inbound PostgreSQL traffic from ECS tasks
        dbSecurityGroup.addIngressRule(
            ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
            ec2.Port.tcp(5432),
            'Allow PostgreSQL access from within VPC'
        )

        // Allow outbound to VPC only
        dbSecurityGroup.addEgressRule(
            ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
            ec2.Port.allTcp(),
            'Allow all TCP outbound within VPC'
        )

        // Create KMS key for RDS encryption
        const dbKey = new kms.Key(this, 'octonius_db_key', {
            enableKeyRotation: true,
            description: 'KMS key for RDS encryption',
            alias: 'octonius/rds'
        })

        // Create KMS key for Performance Insights
        const piKey = new kms.Key(this, 'octonius_pi_key', {
            enableKeyRotation: true,
            description: 'KMS key for RDS Performance Insights',
            alias: 'octonius/performance-insights'
        })

        // Create RDS instance with enhanced security
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
            credentials: rds.Credentials.fromGeneratedSecret('postgres', {
                secretName: 'octonius/db/credentials',
                excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
            }),

            // Storage configuration
            allocatedStorage: 20,
            maxAllocatedStorage: 100,
            storageType: rds.StorageType.GP3,
            storageEncrypted: true,
            storageEncryptionKey: dbKey,
            iops: 3000,

            // Backup configuration
            backupRetention: cdk.Duration.days(35),
            preferredBackupWindow: '03:00-04:00',
            preferredMaintenanceWindow: 'Mon:04:00-Mon:05:00',
            copyTagsToSnapshot: true,
            deleteAutomatedBackups: false,
            enablePerformanceInsights: true,
            performanceInsightEncryptionKey: piKey,
            performanceInsightRetention: rds.PerformanceInsightRetention.LONG_TERM,

            // High availability configuration
            multiAz: true,
            autoMinorVersionUpgrade: true,
            allowMajorVersionUpgrade: false,

            // Monitoring
            monitoringInterval: cdk.Duration.seconds(60),
            cloudwatchLogsExports: ['postgresql', 'upgrade'],
            cloudwatchLogsRetention: cdk.aws_logs.RetentionDays.THREE_MONTHS,

            // Network configuration
            publiclyAccessible: false,
            port: 5432,

            // Removal policy
            removalPolicy: cdk.RemovalPolicy.SNAPSHOT,

            // Instance identifier
            instanceIdentifier: 'octonius-db'
        })

        // Add automated backup plan
        const backupVault = new backup.BackupVault(this, 'octonius_backup_vault', {
            backupVaultName: 'octonius-backup-vault',
            encryptionKey: dbKey
        })

        const backupPlan = new backup.BackupPlan(this, 'octonius_backup_plan', {
            backupVault: backupVault,
            backupPlanName: 'octonius-backup-plan'
        })

        backupPlan.addRule(new backup.BackupPlanRule({
            ruleName: 'daily-backup',
            scheduleExpression: Schedule.cron({
                hour: '5',
                minute: '0'
            }),
            startWindow: cdk.Duration.hours(1),
            completionWindow: cdk.Duration.hours(2),
            deleteAfter: cdk.Duration.days(90),
            moveToColdStorageAfter: cdk.Duration.days(30)
        }))

        backupPlan.addSelection('octonius-backup-selection', {
            resources: [
                backup.BackupResource.fromArn(this.instance.instanceArn)
            ]
        })

        // Add tags for cost allocation
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                cdk.Tags.of(this.instance).add(key, value as string)
                cdk.Tags.of(backupVault).add(key, value as string)
                cdk.Tags.of(backupPlan).add(key, value as string)
            })
        }
    }
} 