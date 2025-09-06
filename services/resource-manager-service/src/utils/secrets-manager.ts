import AWS from 'aws-sdk'
import { logger } from '../shared/logger'

const secretsManager = new AWS.SecretsManager()

/**
 * Load service secrets from AWS Secrets Manager
 */
export async function loadServiceSecrets(): Promise<void> {
  const secretName = process.env.SECRET_NAME
  
  if (!secretName) {
    logger.warn('No SECRET_NAME provided, skipping secrets loading')
    return
  }

  try {
    logger.info('Loading secrets from Secrets Manager', { secretName })
    
    const response = await secretsManager.getSecretValue({
      SecretId: secretName
    }).promise()
    
    if (response.SecretString) {
      const secrets = JSON.parse(response.SecretString)
      
      // Set environment variables from secrets
      Object.entries(secrets).forEach(([key, value]) => {
        if (typeof value === 'string') {
          process.env[key] = value
        }
      })
      
      logger.info('Secrets loaded successfully', { 
        secretName, 
        secretCount: Object.keys(secrets).length 
      })
    } else {
      logger.warn('No secret string found', { secretName })
    }
  } catch (error: any) {
    logger.error('Failed to load secrets', { 
      secretName, 
      error: error instanceof Error ? error : new Error(String(error))
    })
    
    // Don't throw error, continue without secrets
    logger.warn('Continuing without secrets loaded')
  }
}
