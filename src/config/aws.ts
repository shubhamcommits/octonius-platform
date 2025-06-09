import { getEnv } from '../config'
import type { AWSConfig } from './types'

/**
 * Gets AWS configuration from validated environment
 */
export function getAWSConfig(): AWSConfig {
  const env = getEnv()
  
  return {
    region: env.AWS_DEFAULT_REGION,
    credentials: {
      accessKeyId: env.AWS_ACCESS_KEY_ID,
      secretAccessKey: env.AWS_SECRET_ACCESS_KEY
    },
    accountNumber: env.AWS_ACCOUNT_NUMBER
  }
} 