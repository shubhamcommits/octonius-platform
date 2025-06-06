// Import AWS SDK
import { SecretsManager, S3, EC2 } from 'aws-sdk'

// Import Logger
import logger from './logger'

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
 * This class manages AWS services and provides methods for interacting with AWS resources
 * Implements the Singleton pattern to ensure only one instance exists
 */
class AWSService {
    // Private instance variable for Singleton pattern
    private static instance: AWSService

    // AWS Service instances
    private secretsManager: SecretsManager
    private s3: S3
    private ec2: EC2

    // AWS Configuration
    private config: AWSConfig

    /**
     * Private constructor to prevent direct instantiation
     * Initializes AWS services with configuration
     */
    private constructor() {
        
        // Initialize AWS configuration
        this.config = {
            region: process.env.AWS_DEFAULT_REGION || '',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || ''
            }
        }

        // Initialize AWS services
        this.initializeServices()
    }

    /**
     * Initialize all AWS services with the configuration
     */
    private initializeServices(): void {
        try {
            // Initialize SecretsManager
            this.secretsManager = new SecretsManager(this.config)
            logger.info('AWS \t: SecretsManager service initialized')

            // Initialize S3
            this.s3 = new S3(this.config)
            logger.info('AWS \t: S3 service initialized')

            // Initialize EC2
            this.ec2 = new EC2(this.config)
            logger.info('AWS \t: EC2 service initialized')

            // Debug log to verify if credentials are available
            if (this.secretsManager.config.credentials) {
                logger.info('AWS \t: Credentials are available')
            } else {
                logger.warn('AWS \t: No credentials found - ensure IAM role or environment variables are set')
            }
        } catch (error: unknown) {
            logger.error(`AWS \t: Error initializing AWS services - ${error}`)
            throw error
        }
    }

    /**
     * Gets the singleton instance of AWSService
     * Creates a new instance if one doesn't exist
     * @returns AWSService instance
     */
    public static getInstance(): AWSService {
        if (!AWSService.instance) {
            AWSService.instance = new AWSService()
        }
        return AWSService.instance
    }

    /**
     * Retrieves secrets from AWS Secrets Manager and sets them as environment variables
     * @param secretId - The ID of the secret to retrieve
     * @returns Promise<Record<string, string>> - The secret key-value pairs
     */
    public async getSecrets(secretId: string): Promise<Record<string, string>> {
        try {
            logger.info(`AWS \t: Attempting to fetch secrets from ${secretId}`)
            const secret = await this.secretsManager
                .getSecretValue({ SecretId: secretId })
                .promise()

            if (!secret.SecretString) {
                logger.error(`AWS \t: No secret string found for ${secretId}`)
                throw new Error('No secret string found')
            }

            // Parse the secrets
            const secrets = JSON.parse(secret.SecretString)

            // Set each secret as an environment variable
            Object.entries(secrets).forEach(([key, value]) => {
                process.env[key] = value as string
                logger.debug(`AWS \t: Set environment variable - ${key}`)
            })

            logger.info(`AWS \t: Successfully set ${Object.keys(secrets).length} environment variables from secrets`)
            return secrets
        } catch (error) {
            logger.error(`AWS \t: Error fetching and setting secrets - ${error}`)
            throw error
        }
    }
}

// Export the singleton instance
export const awsService = AWSService.getInstance() 