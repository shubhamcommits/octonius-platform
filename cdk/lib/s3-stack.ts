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

        // Create assets bucket
        this.assets_bucket = new s3.Bucket(this, 'OctoniusAssetsBucket', {
            bucketName: `octonius-assets-${this.account}-${this.region}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
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
            bucketName: `octonius-backups-${this.account}-${this.region}`,
            versioned: true,
            encryption: s3.BucketEncryption.S3_MANAGED,
            blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
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
    }
} 