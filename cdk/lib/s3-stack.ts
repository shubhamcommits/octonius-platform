// Import CDK core library
import * as cdk from 'aws-cdk-lib'

// Import AWS constructs
import * as s3 from 'aws-cdk-lib/aws-s3'

// Import Construct base class
import { Construct } from 'constructs'


// Define S3Stack class
export class S3Stack extends cdk.Stack {
    // Public properties for the S3 buckets
    public readonly assets_bucket: s3.Bucket
    public readonly backups_bucket: s3.Bucket


    // Constructor for the S3Stack
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props)

        if (!props?.env?.account || !props?.env?.region) {
            throw new Error('Account and region must be specified in stack props')
        }

        const { account, region } = props.env

        // Create assets bucket
        this.assets_bucket = new s3.Bucket(this, 'OctoniusAssetsBucket', {
            bucketName: `octonius-assets-${account}-${region}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(365),
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(90)
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(180)
                        }
                    ]
                }
            ]
        })

        // Create backups bucket
        this.backups_bucket = new s3.Bucket(this, 'OctoniusBackupsBucket', {
            bucketName: `octonius-backups-${account}-${region}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
            removalPolicy: cdk.RemovalPolicy.RETAIN,
            lifecycleRules: [
                {
                    expiration: cdk.Duration.days(365),
                    transitions: [
                        {
                            storageClass: s3.StorageClass.INFREQUENT_ACCESS,
                            transitionAfter: cdk.Duration.days(90)
                        },
                        {
                            storageClass: s3.StorageClass.GLACIER,
                            transitionAfter: cdk.Duration.days(180)
                        }
                    ]
                }
            ]
        })

        // Add tags to buckets
        if (props?.tags) {
            Object.entries(props.tags).forEach(([key, value]) => {
                cdk.Tags.of(this.assets_bucket).add(key, value as string)
                cdk.Tags.of(this.backups_bucket).add(key, value as string)
            })
        }
    }
} 