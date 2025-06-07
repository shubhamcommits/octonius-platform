// Import AWS SDK v3
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager'
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { EC2Client, DescribeInstancesCommand } from '@aws-sdk/client-ec2'

// Import Logger
import { appLogger } from './logger'

/**
 * Base configuration interface for AWS services
 */
interface AWSConfig {
    region: string
    credentials: {
        accessKeyId: string
        secretAccessKey: string
    }
}

/**
 * AWS Service class for handling AWS operations
 */
class AWSService {
    private config: AWSConfig
    private secretsManager: SecretsManagerClient
    private s3: S3Client
    private ec2: EC2Client

    constructor() {
        this.config = {
            region: process.env.AWS_DEFAULT_REGION || 'eu-central-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        }

        this.initializeServices()
    }

    /**
     * Initialize all AWS services with the configuration
     */
    private initializeServices(): void {
        try {
            // Initialize SecretsManager
            this.secretsManager = new SecretsManagerClient(this.config)
            appLogger('SecretsManager service initialized', {
                service: 'aws',
                component: 'secrets-manager',
                region: this.config.region
            })

            // Initialize S3
            this.s3 = new S3Client(this.config)
            appLogger('S3 service initialized', {
                service: 'aws',
                component: 's3',
                region: this.config.region
            })

            // Initialize EC2
            this.ec2 = new EC2Client(this.config)
            appLogger('EC2 service initialized', {
                service: 'aws',
                component: 'ec2',
                region: this.config.region
            })

            // Debug log to verify if credentials are available
            if (this.config.credentials.accessKeyId && this.config.credentials.secretAccessKey) {
                appLogger('AWS credentials are available', {
                    service: 'aws',
                    component: 'credentials',
                    region: this.config.region
                })
            } else {
                appLogger('No credentials found - ensure IAM role or environment variables are set', {
                    service: 'aws',
                    component: 'credentials',
                    level: 'warn',
                    region: this.config.region
                })
            }
        } catch (error: unknown) {
            appLogger('Error initializing AWS services', {
                service: 'aws',
                component: 'initialization',
                error: error instanceof Error ? error.message : 'Unknown error',
                level: 'error',
                region: this.config.region
            })
            throw error
        }
    }

    /**
     * Retrieves secrets from AWS Secrets Manager and sets them as environment variables
     * @param secretId - The ID of the secret to retrieve
     * @returns Promise<Record<string, string>> - The secret key-value pairs
     */
    public async getSecrets(secretId: string): Promise<Record<string, string>> {
        try {

            appLogger(`Attempting to fetch secrets from ${secretId}`, {
                service: 'aws',
                component: 'secrets-manager',
                secretId
            })

            const command = new GetSecretValueCommand({
                SecretId: secretId
            })

            const response = await this.secretsManager.send(command)

            if (!response.SecretString) {
                appLogger(`No secret string found for ${secretId}`, { 
                    service: 'aws',
                    component: 'secrets-manager',
                    level: 'error',
                    secretId
                })
                return {}
            }

            // Parse the secrets
            const secrets = JSON.parse(response.SecretString)

            // Set each secret as an environment variable
            Object.entries(secrets).forEach(([key, value]) => {
                process.env[key] = value as string
                appLogger(`Set environment variable - ${key}`, {
                    service: 'aws',
                    component: 'secrets-manager',
                    secretId
                })
            })

            appLogger(`Successfully set ${Object.keys(secrets).length} environment variables from secrets`, {
                service: 'aws',
                component: 'secrets-manager',
                secretId,
                secretCount: Object.keys(secrets).length
            })
            return secrets
        } catch (error: any) {
            if (error.name === 'CredentialsError' || error.code === 'CredentialsError' || error.message?.includes('Missing credentials')) {
                appLogger(`Missing AWS credentials. Running in degraded mode.`, {
                    service: 'aws',
                    component: 'secrets-manager',
                    level: 'warn',
                    secretId
                })
                return {}
            }

            appLogger(`Error fetching and setting secrets`, {
                service: 'aws',
                component: 'secrets-manager',
                error: error.message,
                level: 'error',
                secretId
            })
            return {}
        }
    }

    /**
     * Uploads a file to S3
     * @param bucket - The S3 bucket name
     * @param key - The object key
     * @param body - The file content
     * @returns Promise<boolean> - Success status
     */
    public async uploadToS3(bucket: string, key: string, body: Buffer): Promise<boolean> {
        try {
            const command = new PutObjectCommand({
                Bucket: bucket,
                Key: key,
                Body: body
            })

            await this.s3.send(command)
            appLogger('File uploaded to S3 successfully', {
                service: 'aws',
                component: 's3',
                bucket,
                key
            })
            return true
        } catch (error: any) {
            appLogger('Error uploading file to S3', {
                service: 'aws',
                component: 's3',
                error: error.message,
                level: 'error',
                bucket,
                key
            })
            return false
        }
    }

    /**
     * Downloads a file from S3
     * @param bucket - The S3 bucket name
     * @param key - The object key
     * @returns Promise<Buffer | null> - The file content
     */
    public async downloadFromS3(bucket: string, key: string): Promise<Buffer | null> {
        try {
            const command = new GetObjectCommand({
                Bucket: bucket,
                Key: key
            })

            const response = await this.s3.send(command)
            const stream = response.Body as any
            const chunks: Buffer[] = []

            for await (const chunk of stream) {
                chunks.push(chunk)
            }

            appLogger('File downloaded from S3 successfully', {
                service: 'aws',
                component: 's3',
                bucket,
                key
            })
            return Buffer.concat(chunks)
        } catch (error: any) {
            appLogger('Error downloading file from S3', {
                service: 'aws',
                component: 's3',
                error: error.message,
                level: 'error',
                bucket,
                key
            })
            return null
        }
    }

    /**
     * Deletes a file from S3
     * @param bucket - The S3 bucket name
     * @param key - The object key
     * @returns Promise<boolean> - Success status
     */
    public async deleteFromS3(bucket: string, key: string): Promise<boolean> {
        try {
            const command = new DeleteObjectCommand({
                Bucket: bucket,
                Key: key
            })

            await this.s3.send(command)
            appLogger('File deleted from S3 successfully', {
                service: 'aws',
                component: 's3',
                bucket,
                key
            })
            return true
        } catch (error: any) {
            appLogger('Error deleting file from S3', {
                service: 'aws',
                component: 's3',
                error: error.message,
                level: 'error',
                bucket,
                key
            })
            return false
        }
    }

    /**
     * Gets EC2 instance information
     * @param instanceId - The EC2 instance ID
     * @returns Promise<any> - The instance information
     */
    public async getEC2InstanceInfo(instanceId: string): Promise<any> {
        try {
            const command = new DescribeInstancesCommand({
                InstanceIds: [instanceId]
            })

            const response = await this.ec2.send(command)
            appLogger('EC2 instance information retrieved successfully', {
                service: 'aws',
                component: 'ec2',
                instanceId
            })
            return response
        } catch (error: any) {
            appLogger('Error getting EC2 instance information', {
                service: 'aws',
                component: 'ec2',
                error: error.message,
                level: 'error',
                instanceId
            })
            return null
        }
    }
}

// Export a singleton instance
export const awsService = new AWSService() 